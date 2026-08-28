import { useEffect, useRef, useState } from 'react';
import { runWorkerAudit, downloadWorkerPack, savePatchFor, type AdminRow, type AuditJobRef } from '@/lib/supa';
import { toast } from '@/lib/toast';
import { EmptyState, rel } from './shared';

/**
 * «Воркер» — особистий інструмент адміністратора, а не рушій клієнтської послуги.
 * Прогін по довільному сайту під вузьку задачу: подивитись чужу вітрину, зібрати
 * факти, перевірити гіпотезу.
 *
 * Прогін можна ЗАЛИШИТИ особистим, а можна привʼязати до клієнта — тоді він
 * лягає в його базу знань разом з рештою. Без цього особистий прогін був
 * глухим кутом: подивився й забув.
 *
 * Токен рушія лишається на сервері: браузер дьоргає лише /api/audit-run.
 */
type Health = { ok?: boolean; hasKey?: boolean; knowledge?: unknown; store?: unknown; error?: string };
type Run = { id: string; at: string; site: string; tier: number; status: string; summary?: string; clientId?: string };
const LS = 'weexp:worker-runs';
/** Скільки поспіль невдалих опитувань терпимо, перш ніж зупинитись. */
const MAX_POLL_ERRORS = 5;
const POLL_MS = 4000;

/**
 * Глибина прогону рушія — ВНУТРІШНІЙ параметр команди, не рівень послуги.
 * Підписи були «T1…T4» — ті самі коди, якими колись різали клієнтський аудит
 * на рівні. Модель рівнів скасована; лишити її позначення тут означало б
 * тримати скасовану модель живою на екрані.
 */
const TIERS: { v: number; l: string; note: string }[] = [
  { v: 1, l: 'Глибина 1', note: 'лише сайт — зовнішній обхід, без доступів' },
  { v: 2, l: 'Глибина 2', note: 'сайт + відповіді анкети' },
  { v: 3, l: 'Глибина 3', note: '+ аналітика та рекламні кабінети' },
  { v: 4, l: 'Глибина 4', note: '+ внутрішні дані (CRM/ERP)' },
];

export function WorkerTab({ rows }: { rows: AdminRow[] | null }) {
  const [site, setSite] = useState('');
  const [tier, setTier] = useState(1);
  const [clientId, setClientId] = useState('');
  const [health, setHealth] = useState<Health | null>(null);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState('');
  const [runs, setRuns] = useState<Run[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; }
  });
  const poll = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  // Зупиняємо опитування в одному місці — раніше інтервал міг лишитись висіти
  // назавжди: при помилці статусу код просто повертався й опитував далі.
  const stopPolling = () => { if (poll.current) { clearInterval(poll.current); poll.current = undefined; } };
  useEffect(() => stopPolling, []);

  const saveRuns = (next: Run[]) => { setRuns(next); try { localStorage.setItem(LS, JSON.stringify(next.slice(0, 30))); } catch { /* ignore */ } };

  const checkHealth = async () => {
    setHealth(null); setErr('');
    const r = await runWorkerAudit('health');
    setHealth(r as Health);
    if (r.error) setErr(String(r.error));
  };

  /** Записати прогін у базу знань клієнта (той самий формат, що й аудит клієнта). */
  const attach = async (run: Run, uid: string) => {
    const row = (rows || []).find((r) => r.userId === uid);
    if (!row) return;
    const prev = row.record?.auditJobs || [];
    if (prev.some((j) => j.id === run.id)) { toast('Цей прогін уже є в картці клієнта'); return; }
    const ref: AuditJobRef = { id: run.id, at: run.at, site: run.site, tier: run.tier, status: run.status, summary: run.summary };
    const res = await savePatchFor(uid, { auditJobs: [ref, ...prev] });
    if (!res.ok) { toast('Не привʼязано: ' + (res.error || ''), 'err'); return; }
    toast('✓ Прогін у картці клієнта');
    saveRuns(runs.map((x) => (x.id === run.id ? { ...x, clientId: uid } : x)));
  };

  const start = async () => {
    const s = site.trim();
    if (!s) { setErr('Вкажіть домен або URL.'); return; }
    stopPolling();
    setErr(''); setRunning(true); setJob(null);
    // Особистий прогін теж має власника — інакше в базі він анонімний.
    const r = await runWorkerAudit('start', { site: s, tier, ownerKey: clientId || 'personal' });
    if (r.error || !r.id) {
      setErr('Не запустилось: ' + (r.error || 'невідома помилка'));
      setRunning(false); toast('Прогін не запущено', 'err'); return;
    }
    const ref: Run = { id: r.id, at: new Date().toISOString(), site: s, tier, status: 'queued', clientId: clientId || undefined };
    let next = [ref, ...runs]; saveRuns(next);
    toast('✓ Прогін запущено');
    let errors = 0;
    poll.current = setInterval(async () => {
      const st = await runWorkerAudit('status', { id: r.id });
      if (st.error) {
        // Рушій міг перезапуститись або впасти. Не опитуємо вічність.
        if (++errors >= MAX_POLL_ERRORS) {
          stopPolling(); setRunning(false);
          setErr(`Рушій не відповідає (${MAX_POLL_ERRORS} спроб): ${st.error}. Прогін міг лишитись живим — перевірте «Стан рушія».`);
        }
        return;
      }
      errors = 0;
      const j = st.job || {};
      setJob(j);
      const s2 = String(j.status || '');
      if (s2 === 'done' || s2 === 'error' || s2 === 'failed') {
        stopPolling(); setRunning(false);
        const summary = typeof j.summary === 'string' ? j.summary : undefined;
        next = next.map((x) => (x.id === r.id ? { ...x, status: s2, summary } : x));
        saveRuns(next);
        if (s2 === 'done' && clientId) void attach({ ...ref, status: s2, summary }, clientId);
        toast(s2 === 'done' ? '✓ Прогін завершено' : 'Прогін завершився помилкою', s2 === 'done' ? 'ok' : 'err');
      }
    }, POLL_MS);
  };

  const stop = () => { stopPolling(); setRunning(false); toast('Перестали стежити за прогоном — на рушії він триває'); };

  const download = async (id: string, internal: boolean) => {
    const r = await downloadWorkerPack(id, internal);
    if (!r.ok || !r.blob) { toast('Завантаження: ' + (r.error || 'недоступно'), 'err'); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.blob);
    a.download = `audit-${id}${internal ? '-internal' : ''}.zip`; a.click(); URL.revokeObjectURL(a.href);
  };

  const log = Array.isArray(job?.log) ? (job!.log as string[]) : [];

  return (
    <section className="adm-sec">
      <div className="adm-sec-head">
        <h1 className="sysx-display adm-h1">Воркер</h1>
        <button className="sysx-cta" onClick={checkHealth}>Перевірити рушій</button>
      </div>
      <p className="adm-hint mono">
        Особистий інструмент: прогін рушія Commerce OS по будь-якому сайту під вашу задачу.
        За замовчуванням нікуди не привʼязується; за потреби — кладеться в базу знань обраного клієнта.
      </p>

      {health && (
        <div className="adm-panel">
          <span className="adm-col-h mono">Стан рушія</span>
          <p className="mono">
            {health.error ? `✖ ${health.error}` : `${health.ok ? '✓ на звʼязку' : '— не відповідає'} · ключ Claude: ${health.hasKey ? 'є' : 'немає'} · пакети знань: ${String(health.knowledge ?? '—')}`}
          </p>
        </div>
      )}

      <div className="adm-panel">
        <span className="adm-col-h mono">Новий прогін</span>
        <div className="mc-row">
          <input className="mc-inp" placeholder="домен або URL, напр. example.com" value={site} onChange={(e) => setSite(e.target.value)} />
          <select className="mc-inp" value={tier} onChange={(e) => setTier(Number(e.target.value))} title={TIERS.find((t) => t.v === tier)?.note}>
            {TIERS.map((t) => <option key={t.v} value={t.v}>{t.l} — {t.note}</option>)}
          </select>
          <select className="mc-inp" value={clientId} onChange={(e) => setClientId(e.target.value)} title="Куди покласти результат">
            <option value="">особистий прогін (нікуди не класти)</option>
            {(rows || []).map((r) => <option key={r.userId} value={r.userId}>у базу знань: {r.company || r.email}</option>)}
          </select>
          <button className="sysx-cta is-primary" disabled={running} onClick={start}>{running ? 'Йде прогін…' : 'Запустити'}</button>
          {running && <button className="mc-btn ghost" onClick={stop}>Перестати стежити</button>}
        </div>
        {tier >= 3 && !clientId && (
          <p className="adm-hint mono">T3/T4 читають аналітику й внутрішні дані — без привʼязки до клієнта рушію нема звідки взяти доступи, результат буде як у T1.</p>
        )}
        {err && <p className="mc-msg mono bad">{err}</p>}
        {log.length > 0 && (
          <pre className="adm-log mono">{log.slice(-40).join('\n')}</pre>
        )}
      </div>

      <div className="adm-panel">
        <span className="adm-col-h mono">Мої прогони</span>
        {runs.length === 0
          ? <EmptyState icon="⚙" text="Прогонів ще не було. Історія зберігається у цьому браузері; привʼязані до клієнта — у його картці."
              hint="Це особистий інструмент: подивитись чужу вітрину, перевірити гіпотезу. Аудит клієнта запускається з його картки — там рушій бачить анкету, доступи й файли." />
          : (
            <table className="adm-table">
              <thead><tr><th>Коли</th><th>Сайт</th><th>Тир</th><th>Статус</th><th>Підсумок</th><th>Пакет</th></tr></thead>
              <tbody>
                {runs.map((r) => {
                  const cli = r.clientId ? (rows || []).find((x) => x.userId === r.clientId) : undefined;
                  return (
                    <tr key={r.id}>
                      <td className="mono" title={new Date(r.at).toLocaleString('uk-UA')}>{rel(r.at)}</td>
                      <td>{r.site}{cli && <i className="mono adm-c-co"> · {cli.company || cli.email}</i>}</td>
                      <td className="mono">T{r.tier}</td>
                      <td className="mono">{r.status}</td>
                      <td>{r.summary || '—'}</td>
                      <td className="mc-row">
                        {r.status === 'done' && <>
                          <button className="mc-btn sm" onClick={() => download(r.id, false)} title="Клієнтський пакет">zip</button>
                          <button className="mc-btn sm ghost" onClick={() => download(r.id, true)} title="Повний внутрішній пакет">повний</button>
                          {!r.clientId && (rows || []).length > 0 && (
                            <select className="mc-inp sm" value="" onChange={(e) => e.target.value && attach(r, e.target.value)} title="Покласти в базу знань клієнта">
                              <option value="">→ клієнту</option>
                              {(rows || []).map((x) => <option key={x.userId} value={x.userId}>{x.company || x.email}</option>)}
                            </select>
                          )}
                        </>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </section>
  );
}
