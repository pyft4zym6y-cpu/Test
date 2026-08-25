import { useEffect, useRef, useState } from 'react';
import { runWorkerAudit } from '@/lib/supa';
import { toast } from '@/lib/toast';
import { EmptyState } from './shared';

/**
 * «Воркер» — особистий інструмент адміністратора, а не рушій клієнтської послуги.
 * Прогін по довільному сайту під вузьку задачу: подивитись чужу вітрину, зібрати
 * факти, перевірити гіпотезу. З карткою клієнта не звʼязаний — для аудиту клієнта
 * є свій блок у картці, який пише результат у його запис.
 *
 * Токен рушія лишається на сервері: браузер дьоргає лише /api/audit-run, і той
 * ендпоінт з недавнього часу пускає тільки команду (перевірка ролі в Supabase).
 */
type Health = { ok?: boolean; hasKey?: boolean; knowledge?: unknown; store?: unknown; error?: string };
type Run = { id: string; at: string; site: string; tier: number; status: string; summary?: string };
const LS = 'weexp:worker-runs';

const TIERS: { v: number; l: string; note: string }[] = [
  { v: 1, l: 'T1', note: 'лише сайт — зовнішній обхід, без доступів' },
  { v: 2, l: 'T2', note: 'сайт + відповіді анкети' },
  { v: 3, l: 'T3', note: '+ аналітика та рекламні кабінети' },
  { v: 4, l: 'T4', note: '+ внутрішні дані (CRM/ERP)' },
];

export function WorkerTab() {
  const [site, setSite] = useState('');
  const [tier, setTier] = useState(1);
  const [health, setHealth] = useState<Health | null>(null);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState('');
  const [runs, setRuns] = useState<Run[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; }
  });
  const poll = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  const saveRuns = (next: Run[]) => { setRuns(next); try { localStorage.setItem(LS, JSON.stringify(next.slice(0, 30))); } catch { /* ignore */ } };

  const checkHealth = async () => {
    setHealth(null); setErr('');
    const r = await runWorkerAudit('health');
    setHealth(r as Health);
    if (r.error) setErr(String(r.error));
  };

  const start = async () => {
    const s = site.trim();
    if (!s) { setErr('Вкажіть домен або URL.'); return; }
    setErr(''); setRunning(true); setJob(null);
    const r = await runWorkerAudit('start', { site: s, tier });
    if (r.error || !r.id) {
      setErr('Не запустилось: ' + (r.error || 'невідома помилка'));
      setRunning(false); toast('Прогін не запущено', 'err'); return;
    }
    const ref: Run = { id: r.id, at: new Date().toISOString(), site: s, tier, status: 'queued' };
    const next = [ref, ...runs]; saveRuns(next);
    toast('✓ Прогін запущено');
    poll.current = setInterval(async () => {
      const st = await runWorkerAudit('status', { id: r.id });
      if (st.error) return;
      const j = st.job || {};
      setJob(j);
      const s2 = String(j.status || '');
      if (s2 === 'done' || s2 === 'error' || s2 === 'failed') {
        if (poll.current) clearInterval(poll.current);
        setRunning(false);
        saveRuns(next.map((x) => x.id === r.id ? { ...x, status: s2, summary: typeof j.summary === 'string' ? j.summary : undefined } : x));
        toast(s2 === 'done' ? '✓ Прогін завершено' : 'Прогін завершився помилкою', s2 === 'done' ? 'ok' : 'err');
      }
    }, 4000);
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
        Результат нікуди не привʼязується. Аудит клієнта запускається з його картки.
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
          <button className="sysx-cta is-primary" disabled={running} onClick={start}>{running ? 'Йде прогін…' : 'Запустити'}</button>
        </div>
        {err && <p className="mc-msg mono bad">{err}</p>}
        {log.length > 0 && (
          <pre className="adm-log mono">{log.slice(-40).join('\n')}</pre>
        )}
      </div>

      <div className="adm-panel">
        <span className="adm-col-h mono">Мої прогони</span>
        {runs.length === 0
          ? <EmptyState icon="⚙" text="Прогонів ще не було. Історія зберігається у цьому браузері." />
          : (
            <table className="adm-table">
              <thead><tr><th>Коли</th><th>Сайт</th><th>Тир</th><th>Статус</th><th>Підсумок</th></tr></thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{new Date(r.at).toLocaleString('uk-UA')}</td>
                    <td>{r.site}</td>
                    <td className="mono">T{r.tier}</td>
                    <td className="mono">{r.status}</td>
                    <td>{r.summary || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </section>
  );
}
