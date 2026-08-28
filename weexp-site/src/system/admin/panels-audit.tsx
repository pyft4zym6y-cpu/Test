import { useEffect, useMemo, useRef, useState } from 'react';
import { ReadinessPanel } from './ReadinessPanel';

import {
  findAuditIdByCode,
  loadAuditAnswers,
  saveAuditAnswer,
  loadAuditExtra,
  saveAuditExtra,
  savePatchFor,
  mergeMapFor,
  runWorkerAudit,
  downloadWorkerPack,
  importRunFiles,
  maturityToAssessment,
  sendFindingReviews,
  loadLearningSnapshot,
  aiSufficiency,
  type SufficiencyVerdict,
  type DiagRecord,
  type AccessState,
  type AuditJobRef,
  type WorkerMaturity,
  type ReviewableFinding,
  type FindingReview,
  type LearningSnapshot,
  type AuditDoc,
  type AuditDocSection,
  type AuditDocVersion,
  type AuditAnswer,
  type ExtraQ
} from '@/lib/supa';

import { toast } from '@/lib/toast';

import { loadTemplate, uid, Q_TYPES, type AuditTemplate, type Question } from '../auditTemplate';
import { ACCESS_CATALOG, ACCESS_METHOD_LABEL } from '@/data/accessCatalog';

import '../system.css';
import '../cabinet.css';
import { ACCESS_STATUS, MATURITY_MODULE_OF, MOD_LABEL, SaveBadge, fmtVal, rel, relT, type SaveState } from './shared';
import { useAutosave } from './useAutosave';
import { askConfirm, askText } from './dialog';
import { exportAuditDocPdf, seedAuditSections } from './docs';
import { buildKnowledgePack } from './knowledgePack';
import { auditStatusOf, phaseOf, PHASES } from './auditRequests';

/**
 * Перегляд і ЗАПОВНЕННЯ анкети менеджером.
 *
 * Досі це був суто перегляд, хоча модель послуги інша: клієнт дає дані, збирає
 * менеджер. Виправити описку або записати відповідь зі слів клієнта по телефону
 * було ніде — доводилось просити клієнта зайти в кабінет.
 *
 * Авторство зберігається чесно: у полі `by` опиняється email того, хто ввів,
 * тож у «Базі знань» видно, що це наш запис, а не клієнтський.
 */
export function AuditFill({ code, editor }: { code: string; editor?: string }) {
  const [tpl, setTpl] = useState<AuditTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, AuditAnswer>>({});
  const [auditId, setAuditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [edit, setEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState('');
  const load = () => {
    setLoading(true);
    (async () => {
      const t = await loadTemplate();
      const id = await findAuditIdByCode(code);
      const a = id ? await loadAuditAnswers(id) : {};
      setTpl(t); setAnswers(a); setAuditId(id); setLoading(false);
    })();
  };
  useEffect(load, [code]);
  const stat = useMemo(() => {
    let total = 0, done = 0; const authors = new Set<string>();
    (tpl?.blocks || []).forEach((b) => b.questions.forEach((q) => { total++; const a = answers[q.key]; if (a && a.value != null && a.value !== '') { done++; if (a.by) authors.add(a.by); } }));
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0, authors: [...authors] };
  }, [tpl, answers]);

  const startEdit = (q: Question) => {
    if (!editor || !auditId) return;
    setEdit(q.key);
    const v = answers[q.key]?.value;
    setDraft(v == null ? '' : Array.isArray(v) ? v.join(', ') : String(v));
  };
  const commit = async (q: Question) => {
    if (!auditId || !editor) { setEdit(null); return; }
    const raw = draft.trim();
    setSaving(q.key);
    const value = q.type === 'multi' ? raw.split(',').map((x) => x.trim()).filter(Boolean) : raw;
    const r = await saveAuditAnswer(auditId, q.key, value, editor);
    setSaving('');
    if (!r.ok) { toast('Не збережено: ' + (r.error || ''), 'err'); return; }
    setAnswers((m) => ({ ...m, [q.key]: { value, by: editor, at: r.at } }));
    setEdit(null);
    toast('✓ Записано від вашого імені');
  };

  /** Вивантажити анкету — щоб працювати з нею поза адмінкою. */
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Блок', 'Питання', 'Відповідь', 'Хто', 'Коли'].join(',')];
    (tpl?.blocks || []).forEach((b) => b.questions.forEach((q) => {
      const a = answers[q.key];
      lines.push([b.title, q.label, fmtVal(a?.value), a?.by || '', a?.at || ''].map(esc).join(','));
    }));
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = `anketa-${code}.csv`; el.click(); URL.revokeObjectURL(el.href);
  };

  return (
    <div className="adm-fill">
      <div className="adm-fill-head">
        <span className="mono adm-fill-p">{stat.done}/{stat.total} · {stat.pct}%</span>
        {stat.authors.length > 0 && <span className="mono adm-fill-au">автори: {stat.authors.join(', ')}</span>}
        <button className={`mc-btn sm${onlyEmpty ? ' ok' : ' ghost'}`} onClick={() => setOnlyEmpty((v) => !v)}>
          {onlyEmpty ? '✓ Лише незаповнені' : 'Лише незаповнені'}
        </button>
        <button className="mc-btn sm ghost" onClick={exportCsv} disabled={!tpl}>↓ CSV</button>
        <button className="mc-btn ghost adm-fill-rf" onClick={load}>↻</button>
      </div>
      {editor && <p className="mono adm-hint">Клік по відповіді — записати її від свого імені (напр. зі слів клієнта по телефону).</p>}
      {loading ? <p className="mono adm-empty">Завантаження…</p> : !tpl ? <p className="mono adm-empty">—</p> : (
        <div className="adm-fill-blocks">
          {tpl.blocks.map((b) => {
            const qs = onlyEmpty ? b.questions.filter((q) => { const a = answers[q.key]; return !(a && a.value != null && a.value !== ''); }) : b.questions;
            if (!qs.length) return null;
            return (
              <div key={b.key} className="adm-fill-block">
                <b className="adm-fill-bt">{b.title}</b>
                {qs.map((q: Question) => {
                  const a = answers[q.key];
                  const filled = a && a.value != null && a.value !== '';
                  const editing = edit === q.key;
                  return (
                    <div key={q.key} className={`adm-fill-q${filled ? ' on' : ''}${editor ? ' editable' : ''}`}>
                      <span className="adm-fill-ql">{q.label}</span>
                      {editing ? (
                        <span className="adm-fill-edit">
                          <input className="ab-inp sm" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                            placeholder={q.type === 'multi' ? 'через кому' : 'відповідь'}
                            onKeyDown={(e) => { if (e.key === 'Enter') void commit(q); if (e.key === 'Escape') setEdit(null); }} />
                          <button className="mc-btn sm ok" disabled={saving === q.key} onClick={() => void commit(q)}>{saving === q.key ? '…' : '✓'}</button>
                          <button className="mc-btn sm ghost" aria-label="Скасувати редагування" title="Скасувати редагування" onClick={() => setEdit(null)}>✕</button>
                        </span>
                      ) : filled ? (
                        <button className="adm-fill-qv" disabled={!editor} onClick={() => startEdit(q)} title={editor ? 'Змінити від свого імені' : undefined}>
                          {fmtVal(a!.value)}<i className="mono"> — {a!.by} · {relT(a!.at)}</i>
                        </button>
                      ) : (
                        <button className="mono adm-fill-qe" disabled={!editor} onClick={() => startEdit(q)} title={editor ? 'Записати відповідь' : undefined}>
                          {editor ? '+ записати' : '—'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ExtraEditor({ code }: { code: string }) {
  const [list, setList] = useState<ExtraQ[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { loadAuditExtra(code).then(setList); }, [code]);
  if (list === null) return <p className="mono adm-empty">Завантаження…</p>;
  const add = () => setList([...list, { key: uid('x'), label: '', type: 'text' }]);
  const set = (i: number, k: keyof ExtraQ, v: unknown) => setList(list.map((q, j) => (j === i ? { ...q, [k]: v } : q)));
  const del = (i: number) => setList(list.filter((_, j) => j !== i));
  const save = async () => {
    setBusy(true); setMsg('');
    const r = await saveAuditExtra(code, list.filter((q) => q.label.trim()));
    setBusy(false);
    setMsg(r.ok ? '✓ Збережено — клієнт побачить у розділі «Крок 2».' : (r.error || 'Помилка'));
  };
  return (
    <div className="adm-extra">
      {list.length === 0 ? <p className="mono adm-empty">Немає уточнень. Додайте персональні питання/доступи для цього клієнта.</p> : list.map((q, i) => (
        <div key={q.key} className="adm-extra-q">
          <input className="ab-inp" value={q.label} onChange={(e) => set(i, 'label', e.target.value)} placeholder="Питання / що уточнити" />
          <select className="ab-sel" value={q.type} onChange={(e) => set(i, 'type', e.target.value)}>{Q_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}</select>
          <button className="mc-btn ghost" aria-label={`Видалити питання ${i + 1}`} title="Видалити питання" onClick={() => del(i)}>✕</button>
        </div>
      ))}
      <div className="adm-extra-act">
        <button className="mc-btn" onClick={add}>+ Питання</button>
        <button className="mc-btn ok" onClick={save} disabled={busy}>{busy ? 'Зберігаємо…' : 'Зберегти й надіслати'}</button>
      </div>
      {msg && <span className="mono adm-fill-au">{msg}</span>}
    </div>
  );
}

export function AccessCatalog({ userId, initial, onSaved }: { userId: string; initial: Record<string, AccessState>; onSaved?: () => void }) {
  const [map, setMap] = useState<Record<string, AccessState>>(initial || {});
  // Пишемо лише те, що змінили в цій сесії: інакше збереження затирало правки
  // колеги в сусідніх рядках того самого каталогу.
  const touched = useRef<Set<string>>(new Set());
  const auto = useAutosave<Record<string, AccessState>>((v) => {
    const changed = Object.fromEntries([...touched.current].map((k) => [k, v[k]]).filter(([, x]) => x));
    return mergeMapFor(userId, 'accessLog', changed as Record<string, AccessState>).then((r) => { if (r.ok) onSaved?.(); return r; });
  });
  const set = (id: string, patch: Partial<AccessState>) => setMap((m) => { touched.current.add(id); const next = { ...m, [id]: { ...m[id], ...patch, at: new Date().toISOString() } }; auto.touch(next); return next; });
  const cats = [...new Set(ACCESS_CATALOG.map((a) => a.category))];
  const granted = ACCESS_CATALOG.filter((a) => ['granted', 'verified'].includes(map[a.id]?.status || '')).length;

  return (
    <div className="adm-acc">
      <div className="adm-acc-sum mono">
        <span>Надано: <b>{granted}/{ACCESS_CATALOG.length}</b></span>
        <span className="adm-acc-hint">Клієнт бачить цей самий список у кабінеті, у глибокому аудиті: що потрібно, навіщо і як надати. Він надає доступ і позначає це в себе — рядок тут змінює статус сам. Тут же можна проставити стан вручну, якщо доступ передали повз кабінет.</span>
        <SaveBadge state={auto.state} error={auto.error} savedAt={auto.savedAt} onRetry={auto.flush} />
      </div>
      {cats.map((cat) => (
        <div key={cat} className="adm-acc-cat">
          <span className="adm-acc-cat-h mono">{cat}</span>
          {ACCESS_CATALOG.filter((a) => a.category === cat).map((a) => {
            const s = map[a.id] || {};
            const st = ACCESS_STATUS.find((x) => x.v === s.status);
            return (
              <div key={a.id} className="adm-acc-row2">
                <div className="adm-acc-name">
                  <b>{a.system}</b>
                  {s.method && <span className={`adm-acc-mtag mono`}>{ACCESS_METHOD_LABEL[s.method]}</span>}
                </div>
                <select className={`ab-sel sm adm-acc-st tst-${st?.cls || 'muted'}`} value={s.status || ''} onChange={(e) => set(a.id, { status: (e.target.value || undefined) as AccessState['status'] })}>
                  <option value="">— статус —</option>
                  {ACCESS_STATUS.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                </select>
                <input className="ab-inp sm adm-acc-nt" value={s.note || ''} onChange={(e) => set(a.id, { note: e.target.value })} placeholder="лог / акаунт / нотатка" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Запуск аудиту рушієм Commerce OS (worker) з картки клієнта + історія прогонів. */

export function WorkerAudit({ userId, code, rec, reviewer }: { userId: string; code?: string; rec: DiagRecord; reviewer: string }) {
  const [site, setSite] = useState(rec.company?.site || rec.company?.domains || '');
  const [tier, setTier] = useState(2);
  // Відповіді потрібні тут для оцінки готовності: рішення про запуск і знання
  // про його наслідки мають бути в одному місці, а не через дві вкладки.
  const [wAnswers, setWAnswers] = useState<Record<string, AuditAnswer>>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = code ? await findAuditIdByCode(code) : null;
        const a = id ? await loadAuditAnswers(id) : {};
        if (alive) setWAnswers(a);
      } catch { /* немає анкети — готовність порахується без неї */ }
    })();
    return () => { alive = false; };
  }, [code]);
  const [jobs, setJobs] = useState<AuditJobRef[]>(rec.auditJobs || []);
  const [running, setRunning] = useState(false);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [maturity, setMaturity] = useState<WorkerMaturity | null>(null);
  const [imported, setImported] = useState(false);
  const [snap, setSnap] = useState<LearningSnapshot | null>(null);
  const [err, setErr] = useState('');
  const findings = (Array.isArray(job?.findings) ? job!.findings as ReviewableFinding[] : []);

  const showSnapshot = async () => {
    const r = await loadLearningSnapshot();
    if (r.ok && r.snapshot) setSnap(r.snapshot);
    else toast('Знімок навчання недоступний: ' + (r.error || 'воркер ще не оновлено'), 'err');
  };
  const poll = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  // Раніше результат запису відкидався: RLS відмовляв — на екрані все одно
  // зʼявлявся новий прогін, якого в базі немає.
  const saveJobs = async (next: AuditJobRef[]) => {
    setJobs(next);
    const r = await savePatchFor(userId, { auditJobs: next });
    if (!r.ok) toast('Історія прогонів не збереглась: ' + (r.error || ''), 'err');
  };

  const importMaturity = async () => {
    if (!maturity) return;
    const { assessment, imported: n, skipped } = maturityToAssessment(maturity, rec.assessment || {});
    if (!n) { toast('Немає нових оцінок для імпорту (усі домени вже оцінені вручну).', 'err'); return; }
    const r = await savePatchFor(userId, { assessment });
    if (r.ok) { setImported(true); toast(`✓ Імпортовано у C-level: ${n} модул. ${skipped ? `· пропущено ${skipped}` : ''} — оновіть сторінку, щоб побачити в блоці «Оцінка модулів».`); }
    else toast('Не вдалося зберегти оцінку: ' + (r.error || ''), 'err');
  };

  /**
   * Конвеєр: документи прогону → файли клієнта одним рухом. Раніше останній
   * метр послуги був ручним — качали zip, розпаковували, вантажили назад.
   * Далі документ віддається клієнту кнопкою «Поділитися» у вкладці «Документи».
   */
  const [importing, setImporting] = useState('');

  /**
   * Те саме перенесення, але БЕЗ підтвердження — одразу після успішного прогону.
   * Питати тут нема про що: документи щойно зроблені для цього клієнта, і
   * альтернатива «не переносити» не має сенсу. Ручна кнопка лишається для
   * старих прогонів і для повтору, якщо частина файлів не доїхала.
   */
  const autoImport = async (id: string) => {
    try {
      const st = await runWorkerAudit('status', { id });
      const list = (st.job?.files as { name: string }[] | undefined) || [];
      if (!list.length) return;
      setImporting(id);
      const r = await importRunFiles(userId, id, list, reviewer, (done, total) => setImporting(`${id}:${done}/${total}`));
      setImporting('');
      if (!r.added.length) return;
      const res = await savePatchFor(userId, { adminFiles: [...r.added, ...(rec.adminFiles || [])] });
      if (res.ok) toast(`✓ ${r.added.length} документ(ів) прогону — у файлах клієнта${r.failed.length ? ` · ${r.failed.length} не доїхало` : ''}`);
      else toast('Документи не закріпились за клієнтом: ' + (res.error || ''), 'err');
    } catch {
      setImporting('');
      // Мовчазний провал тут неприпустимий: менеджер вважатиме, що документи
      // вже у клієнта, і не натисне ручну кнопку.
      toast('Автоперенос документів не вдався — скористайтесь кнопкою «Перенести у файли» в історії прогонів', 'err');
    }
  };

  const importRun = async (id: string) => {
    const st = await runWorkerAudit('status', { id });
    const list = (st.job?.files as { name: string }[] | undefined) || [];
    if (!list.length) { toast('Рушій не віддав список документів цього прогону', 'err'); return; }
    if (!(await askConfirm({ title: `Перенести ${list.length} документ(ів) прогону у файли клієнта?`, text: 'Далі їх можна віддати клієнту кнопкою «Поділитися» у вкладці «Документи».', confirmLabel: 'Перенести' }))) return;
    setImporting(id);
    const r = await importRunFiles(userId, id, list, reviewer, (done, total) => setImporting(`${id}:${done}/${total}`));
    setImporting('');
    if (!r.added.length) { toast('Не перенесено жодного документа' + (r.failed.length ? ` (${r.failed.length} з помилкою)` : ''), 'err'); return; }
    const prev = rec.adminFiles || [];
    const res = await savePatchFor(userId, { adminFiles: [...r.added, ...prev] });
    if (!res.ok) { toast('Файли завантажено, але картку не оновлено: ' + (res.error || ''), 'err'); return; }
    toast(`✓ Перенесено ${r.added.length} документ(ів)${r.failed.length ? ` · не вдалось: ${r.failed.length}` : ''} — вкладка «Документи»`);
  };

  const downloadPack = async (id: string, internal: boolean) => {
    const r = await downloadWorkerPack(id, internal);
    if (!r.ok || !r.blob) { toast('Завантаження: ' + (r.error || 'недоступно'), 'err'); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.blob); a.download = `audit-${id}${internal ? '-internal' : ''}.zip`; a.click(); URL.revokeObjectURL(a.href);
  };

  const start = async () => {
    setErr('');
    if (!site.trim()) { setErr('Вкажіть сайт клієнта (домен).'); return; }
    setRunning(true); setJob(null);
    let answers: Record<string, unknown> = {};
    try { const id = code ? await findAuditIdByCode(code) : null; if (id) answers = await loadAuditAnswers(id); } catch { /* ignore */ }
    // Рушій бачить те саме, що менеджер: профіль, доступи, файли, оцінки,
    // попередні прогони. Досі їхали лише відповіді анкети.
    const tplAll = await loadTemplate().catch(() => null);
    const totalQ = (tplAll?.blocks || []).reduce((n, b) => n + b.questions.length, 0);
    const st = auditStatusOf({ userId, email: '', record: rec } as never);
    const knowledge = buildKnowledgePack(
      { userId, email: '', record: rec } as never,
      answers as never, totalQ, st ? PHASES[phaseOf(st)].l : undefined,
    );
    const r = await runWorkerAudit('start', { site: site.trim(), tier, answers, knowledge, ownerKey: userId });
    if (r.error || !r.id) { setErr('Помилка запуску: ' + (r.error || '')); setRunning(false); toast('Аудит не запущено: ' + (r.error || ''), 'err'); return; }
    const ref: AuditJobRef = { id: r.id, at: new Date().toISOString(), site: site.trim(), tier, status: 'queued' };
    const next = [ref, ...jobs].slice(0, 20); saveJobs(next);
    toast('✓ Аудит запущено на рушії');
    // Полінг статусу. Обриваємо його після кількох невдач поспіль: рушій міг
    // перезапуститись, і опитувати його вічно — просто вантажити мережу.
    if (poll.current) clearInterval(poll.current);
    let pollErrors = 0;
    poll.current = setInterval(async () => {
      const s = await runWorkerAudit('status', { id: r.id });
      if (s.error) {
        if (++pollErrors >= 5) {
          if (poll.current) clearInterval(poll.current);
          setRunning(false);
          setErr('Рушій не відповідає (5 спроб): ' + s.error + '. Прогін міг лишитись живим — перевірте пізніше.');
        }
        return;
      }
      pollErrors = 0;
      const j = s.job || {};
      setJob(j);
      const st = String(j.status || '');
      if (st === 'done' || st === 'error' || st === 'failed') {
        if (poll.current) clearInterval(poll.current);
        setRunning(false);
        const mat = (j.maturity && Array.isArray((j.maturity as WorkerMaturity).rows)) ? j.maturity as WorkerMaturity : null;
        if (mat) { setMaturity(mat); setImported(false); }
        const health = (j.metrics as { health?: number } | undefined)?.health;
        const upd = next.map((x) => x.id === r.id ? { ...x, status: st, summary: typeof j.summary === 'string' ? j.summary : undefined, health: typeof health === 'number' ? health : null } : x);
        saveJobs(upd);
        toast(st === 'done' ? '✓ Аудит завершено рушієм' : 'Аудит завершився з помилкою', st === 'done' ? 'ok' : 'err');
        // Документи прогону — у файли клієнта одразу. Раніше це був окремий
        // ручний крок після кожного прогону: менеджер мусив згадати про нього
        // й натиснути. Забув — документи лишились усередині прогону, а прогін
        // з часом зникає разом із томом Railway. Перенос ідемпотентний:
        // `importRunFiles` не дублює те, що вже лежить у клієнта.
        if (st === 'done' && r.id) void autoImport(r.id);
      }
    }, 4000);
  };

  const logLines = (Array.isArray(job?.log) ? job!.log as string[] : []).slice(-6);
  return (
    <div className="adm-worker">
      <p className="mono adm-hint">Рушій Commerce OS краулить сайт і будує повний аудит (findings, метрики, документи). Відповіді клієнта з опитувальника додаються автоматично.</p>
      <div className="adm-worker-run">
        <input className="ab-inp" value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://site.com — домен клієнта" />
        <select className="ab-sel" value={tier} onChange={(e) => setTier(Number(e.target.value))}>
          {[1, 2, 3, 4].map((t) => <option key={t} value={t}>Tier {t}</option>)}
        </select>
        <button className="mc-btn ok" disabled={running} onClick={start}>{running ? '⏳ Аудит іде…' : '▶ Запустити аудит'}</button>
      </div>
      <ReadinessPanel rec={rec} answers={wAnswers} />
      {err && <p className="cab-auth-err mono">{err}</p>}
      {job && (
        /* Лог прогону оновлюється сам протягом сорока хвилин. Без aria-live
           екранний читач мовчить весь цей час: людина не знає ні що аудит іде,
           ні коли він завершився. `polite` — щоб не переривати на кожному рядку. */
        <div className="adm-worker-log mono" role="status" aria-live="polite" aria-busy={running}>
          <b>Статус: {String(job.status || '…')}{(() => { const mh = (job.metrics as { health?: number } | undefined)?.health; return typeof mh === 'number' ? ` · Health ${mh}/100` : ''; })()}</b>
          {logLines.map((l, i) => <div key={i} className="adm-worker-l">{l}</div>)}
          {typeof job.summary === 'string' && job.summary && <div className="adm-worker-l" style={{ opacity: 1, marginTop: 4 }}>{job.summary}</div>}
        </div>
      )}
      {maturity && (
        <div className="adm-worker-mat">
          <div className="adm-worker-mat-h">
            <span className="adm-acc-cat-h mono">Матриця зрілості рушія{typeof maturity.observedAvg === 'number' ? ` · середнє ${maturity.observedAvg}/5` : ''}</span>
            <button className="mc-btn ok" disabled={imported} onClick={importMaturity}>{imported ? '✓ Імпортовано' : '↧ Імпортувати у C-level оцінку'}</button>
          </div>
          <div className="adm-worker-mat-rows mono">
            {maturity.rows.filter((r) => r.level != null).map((r) => (
              <div key={r.domain} className="adm-worker-mat-row">
                <span>{r.domain} → {MOD_LABEL[MATURITY_MODULE_OF[r.domain]] || '—'}</span>
                <b>L{r.level} · {(r.level || 0) * 20}/100</b>
              </div>
            ))}
          </div>
          <p className="mono adm-hint">Рівні L1–L5 → бали 20–100. Імпорт заповнює лише порожні модулі (ручні оцінки не перетираються). Домени «потрібні дані» зʼявляться після доступів/опитувальника.</p>
        </div>
      )}
      {findings.length > 0 && (
        <FindingsReview auditId={String(job?.id || '')} findings={findings} userId={userId} reviewer={reviewer} initial={rec.findingReviews || {}} />
      )}
      <div className="adm-worker-learn">
        <button className="mc-btn ghost" onClick={showSnapshot}>📈 Знімок навчання рушія</button>
        {snap && (
          <div className="adm-worker-snap mono">
            <div>Записів у леджері: <b>{snap.ledgerEntries}</b> · аудитів: <b>{snap.distinctAudits}</b> · golden-кандидатів: <b>{snap.goldenCandidateCount}</b></div>
            <div>Калібрування: n={snap.calibration.n} · ECE {snap.calibration.ece ?? '—'} · {snap.calibration.reliable ? 'надійно' : 'мало даних'}</div>
            <div>Патернів: <b>{snap.patterns.length}</b> · антипатернів: <b>{snap.antiPatterns.length}</b> · пропозицій методології: <b>{snap.suggestions.length}</b></div>
            {snap.suggestions.slice(0, 3).map((s, i) => <div key={i} className="adm-worker-l">• {s.kind}: {s.target} — {s.rationale} (n={s.evidenceN})</div>)}
          </div>
        )}
      </div>
      {jobs.length > 0 && (
        <div className="adm-worker-hist">
          <span className="adm-acc-cat-h mono">Прогони</span>
          {jobs.map((j) => (
            <div key={j.id} className="adm-worker-item mono">
              <span className={`cab-badge tst-${j.status === 'done' ? 'ok' : j.status === 'error' || j.status === 'failed' ? 'bad' : 'wait'}`}>{j.status || '…'}</span>
              <span>{j.site} · Tier {j.tier}</span>
              <span className="adm-act-at">{rel(j.at)}</span>
              {j.status === 'done' && <span className="adm-worker-dl">
                <button className="mc-btn ghost" onClick={() => downloadPack(j.id, false)} title="Пакет документів для клієнта">⬇ Клієнту</button>
                <button className="mc-btn ghost" onClick={() => downloadPack(j.id, true)} title="Внутрішній пакет (усі доки + JSON)">⬇ Внутрішній</button>
                <button className="mc-btn ok" disabled={!!importing} onClick={() => importRun(j.id)} title="Покласти документи прогону у файли клієнта — звідти їх можна віддати клієнту">
                  {importing.startsWith(j.id) ? (importing.split(':')[1] || 'Переносимо…') : '→ У файли клієнта'}
                </button>
              </span>}
              {j.summary && <span className="adm-worker-sum">{j.summary}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Рецензування знахідок рушія (human-in-the-loop) → леджер навчання воркера. */

export function FindingsReview({ auditId, findings, userId, reviewer, initial }: { auditId: string; findings: ReviewableFinding[]; userId: string; reviewer: string; initial: Record<string, FindingReview> }) {
  const [reviews, setReviews] = useState<Record<string, FindingReview>>(initial || {});
  const [busy, setBusy] = useState(false);
  const PRI_CLS: Record<string, string> = { P0: 'bad', P1: 'wait', P2: 'muted' };
  const setV = (id: string, patch: Partial<FindingReview>) => {
    const prev = reviews[id] || { verdict: 'accepted' as const, at: '' };
    const next = { ...reviews, [id]: { ...prev, ...patch, sent: false, at: new Date().toISOString() } };
    setReviews(next); void savePatchFor(userId, { findingReviews: next }).then((r) => { if (!r.ok) toast('Рецензію не збережено: ' + (r.error || ''), 'err'); });
  };
  const decided = findings.filter((f) => reviews[f.id]);
  const unsent = decided.filter((f) => !reviews[f.id].sent).length;
  const send = async () => {
    const verdicts = decided.map((f) => ({ findingId: f.id, verdict: reviews[f.id].verdict, correctedPriority: reviews[f.id].correctedPriority, note: reviews[f.id].note }));
    if (!verdicts.length) { toast('Спершу винесіть вердикт хоча б по одній знахідці.', 'err'); return; }
    if (!auditId) { toast('Немає id прогону для відправки.', 'err'); return; }
    setBusy(true);
    const r = await sendFindingReviews(auditId, findings, verdicts, reviewer);
    setBusy(false);
    if (r.ok) {
      const next = { ...reviews }; verdicts.forEach((v) => { if (next[v.findingId]) next[v.findingId] = { ...next[v.findingId], sent: true }; });
      setReviews(next); void savePatchFor(userId, { findingReviews: next }).then((r) => { if (!r.ok) toast('Рецензію не збережено: ' + (r.error || ''), 'err'); });
      toast(`✓ У навчання записано: ${r.written ?? verdicts.length}`);
    } else toast('Не вдалося надіслати: ' + (r.error || 'воркер ще не оновлено'), 'err');
  };
  return (
    <div className="adm-fr">
      <div className="adm-fr-h">
        <span className="adm-acc-cat-h mono">Рецензування знахідок ({decided.length}/{findings.length})</span>
        <button className="mc-btn ok" disabled={busy || !unsent} onClick={send}>{busy ? 'Надсилаю…' : unsent ? `↑ У навчання (${unsent})` : '✓ Надіслано'}</button>
      </div>
      <ul className="adm-fr-list">
        {findings.map((f) => {
          const rv = reviews[f.id];
          return (
            <li key={f.id} className="adm-fr-item">
              <div className="adm-fr-top">
                <span className={`cab-badge tst-${PRI_CLS[f.priority] || 'muted'}`}>{f.priority}</span>
                <span className="adm-fr-dom mono">{f.domain}</span>
                <span className="adm-fr-title">{f.title}</span>
                <span className="adm-fr-conf mono">{Math.round(f.confidence * 100)}%{rv?.sent ? ' · ✓' : ''}</span>
              </div>
              <div className="adm-fr-acts">
                <button className={'mc-btn ' + (rv?.verdict === 'accepted' ? 'fr-on-ok' : 'ghost')} onClick={() => setV(f.id, { verdict: 'accepted', correctedPriority: undefined })}>✓ Реальна</button>
                <button className={'mc-btn ' + (rv?.verdict === 'rejected' ? 'fr-on-bad' : 'ghost')} onClick={() => setV(f.id, { verdict: 'rejected', correctedPriority: undefined })}>✕ Хибна</button>
                <button className={'mc-btn ' + (rv?.verdict === 'corrected' ? 'fr-on-ok' : 'ghost')} onClick={() => setV(f.id, { verdict: 'corrected', correctedPriority: rv?.correctedPriority || f.priority })}>± Коригувати</button>
                {rv?.verdict === 'corrected' && (
                  <select className="ab-sel xs" value={rv.correctedPriority || f.priority} onChange={(e) => setV(f.id, { verdict: 'corrected', correctedPriority: e.target.value as 'P0' | 'P1' | 'P2' })}>
                    {['P0', 'P1', 'P2'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mono adm-hint">Вердикти калібрують рушій: підтверджені/хибні/скориговані знахідки лягають у append-only леджер навчання (ECE, патерни, golden-кандидати). Дані клієнта не передаються — лише id/домен/тема/впевненість.</p>
    </div>
  );
}

/** Зібрати чернетку розділів документа з наявних даних картки. */

export function AuditDocEditor({ userId, email, rec }: { userId: string; email: string; rec: DiagRecord }) {
  const [doc, setDoc] = useState<AuditDoc>(rec.auditDoc || { title: 'Документ аудиту', sections: [] });
  const [modMap, setModMap] = useState<Record<string, string>>({});
  const auto = useAutosave<AuditDoc>((v) => savePatchFor(userId, { auditDoc: v }), 1200);
  useEffect(() => { let on = true; loadTemplate().then((t) => { if (on && t) setModMap(Object.fromEntries(t.blocks.map((b) => [b.key, b.title]))); }).catch(() => {}); return () => { on = false; }; }, []);
  const modTitle = (k: string) => modMap[k] || k;
  const push = (next: AuditDoc) => {
    next.updatedAt = new Date().toISOString();
    setDoc({ ...next });
    auto.touch(next);
  };

  const setSec = (id: string, patch: Partial<AuditDocSection>) => push({ ...doc, sections: doc.sections.map((s) => s.id === id ? { ...s, ...patch } : s) });
  const addSec = () => push({ ...doc, sections: [...doc.sections, { id: uid(), heading: 'Новий розділ', body: '' }] });
  const delSec = (id: string) => push({ ...doc, sections: doc.sections.filter((s) => s.id !== id) });
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= doc.sections.length) return; const s = [...doc.sections]; [s[i], s[j]] = [s[j], s[i]]; push({ ...doc, sections: s }); };
  const seed = async () => { if (doc.sections.length && !(await askConfirm({ title: 'Перезібрати чернетку з даних?', text: 'Поточний вміст буде замінено. Стару версію можна зберегти окремо кнопкою «Зберегти версію».', confirmLabel: 'Перезібрати', tone: 'bad' }))) return; push({ ...doc, sections: seedAuditSections(rec, modTitle) }); };
  const saveVersion = () => { const v: AuditDocVersion = { at: new Date().toISOString(), title: doc.title, sections: doc.sections, by: email }; push({ ...doc, versions: [v, ...(doc.versions || [])].slice(0, 10) }); toast('✓ Версію збережено'); };
  const restore = async (v: AuditDocVersion) => { if (!(await askConfirm({ title: `Відновити версію від ${new Date(v.at).toLocaleString('uk-UA')}?`, text: 'Поточний вміст замінить знімок цієї версії.', confirmLabel: 'Відновити', tone: 'bad' }))) return; push({ ...doc, title: v.title, sections: v.sections }); };

  return (
    <div className="adm-doc">
      <div className="adm-doc-bar">
        <input className="ab-inp adm-doc-title" value={doc.title} onChange={(e) => push({ ...doc, title: e.target.value })} placeholder="Назва документа" />
        <SaveBadge state={auto.state} error={auto.error} savedAt={auto.savedAt} onRetry={auto.flush} />
      </div>
      <div className="adm-doc-tools">
        <button className="mc-btn ghost" onClick={seed}>✨ {doc.sections.length ? 'Перезібрати' : 'Зібрати'} чернетку</button>
        <button className="mc-btn ghost" onClick={saveVersion} disabled={!doc.sections.length}>💾 Зберегти версію</button>
        <button className="mc-btn ok" onClick={() => exportAuditDocPdf(doc, email)} disabled={!doc.sections.length}>📄 Експорт PDF</button>
      </div>
      {doc.sections.length === 0 ? (
        <p className="mono adm-empty">Документа ще немає. Натисніть «✨ Зібрати чернетку», щоб зібрати його з оцінки, знахідок і нотаток — далі коригуйте вручну.</p>
      ) : doc.sections.map((s, i) => (
        <div key={s.id} className="adm-doc-sec">
          <div className="adm-doc-sec-h">
            <input className="ab-inp adm-doc-heading" value={s.heading} onChange={(e) => setSec(s.id, { heading: e.target.value })} />
            <div className="adm-doc-sec-act">
              <button className="adm-note-x mono" onClick={() => move(i, -1)} disabled={i === 0} title="Вгору">↑</button>
              <button className="adm-note-x mono" onClick={() => move(i, 1)} disabled={i === doc.sections.length - 1} title="Вниз">↓</button>
              <button className="adm-note-x mono" onClick={() => delSec(s.id)} aria-label={`Видалити розділ ${s.heading || ''}`} title="Видалити розділ">✕</button>
            </div>
          </div>
          <textarea className="ab-inp adm-doc-body" rows={Math.min(14, Math.max(3, s.body.split('\n').length + 1))} value={s.body} onChange={(e) => setSec(s.id, { body: e.target.value })} />
        </div>
      ))}
      {doc.sections.length > 0 && <button className="mc-btn ghost adm-doc-add" onClick={addSec}>+ Розділ</button>}
      {(doc.versions || []).length > 0 && (
        <div className="adm-doc-vers">
          <span className="adm-acc-cat-h mono">Версії</span>
          {(doc.versions || []).map((v) => (
            <div key={v.at} className="adm-doc-ver mono">
              <span>{new Date(v.at).toLocaleString('uk-UA')} · {v.sections.length} розд.{v.by ? ` · ${v.by}` : ''}</span>
              <button className="mc-btn ghost" onClick={() => restore(v)}>Відновити</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Модерація опитувальника: AI-перевірка достатності + рішення менеджера ── */

export function ModerationPanel({ userId, code, rec, reviewer }: { userId: string; code?: string; rec: DiagRecord; reviewer?: string }) {
  const [busy, setBusy] = useState('');
  const [verdict, setVerdict] = useState<SufficiencyVerdict | null>(null);
  const mod = rec.deepModeration;
  const setStatus = async (status: 'accepted' | 'clarify', note?: string) => {
    setBusy(status);
    const r = await savePatchFor(userId, { deepModeration: { ...(mod || {}), status, at: new Date().toISOString(), by: reviewer || undefined, note: note || undefined, aiVerdict: verdict ? { sufficient: verdict.sufficient, coveragePct: verdict.coveragePct, summary: verdict.summary, at: new Date().toISOString() } : mod?.aiVerdict } });
    setBusy('');
    if (r.ok) toast(status === 'accepted' ? '✓ Підтверджено — клієнт бачить «очікуйте підсумки»' : '✓ Повернуто з уточненнями — клієнт бачить питання');
    else toast('Не вдалося: ' + (r.error || ''), 'err');
  };
  const runAi = async () => {
    setBusy('ai'); setVerdict(null);
    try {
      const id = code ? await findAuditIdByCode(code) : null;
      const answers = id ? await loadAuditAnswers(id) : {};
      if (!Object.keys(answers).length) { toast('Відповідей ще немає — клієнт не заповнював опитувальник.', 'err'); setBusy(''); return; }
      const tpl = await loadTemplate();
      const modules = (tpl?.blocks || []).map((b) => ({ key: b.key, title: b.title }));
      const r = await aiSufficiency({ answers, modules, company: rec.company });
      if (r.ok && r.verdict) setVerdict(r.verdict);
      else toast('AI-перевірка: ' + (r.error || 'помилка'), 'err');
    } catch (e) { toast('Помилка: ' + String(e), 'err'); }
    setBusy('');
  };
  const clarify = async () => {
    // Це текст, який ПОБАЧИТЬ КЛІЄНТ, — йому потрібне нормальне поле, а не
    // однорядковий prompt(), у якому не видно, що написав.
    const typed = await askText({
      title: 'Повернути анкету на уточнення',
      text: 'Коментар клієнту — він побачить його в кабінеті. Самі питання додайте у блоці «Уточнення (Крок 2)».',
      input: { rows: 4, placeholder: 'Що саме уточнити', initial: verdict?.missing?.length ? 'Потрібно кілька уточнень — питання нижче у вкладці «Питання».' : '' },
      confirmLabel: 'Повернути клієнту', tone: 'wait',
    });
    if (typed === null) return;
    const note = typed.trim() || undefined;
    void setStatus('clarify', note);
  };
  const M: Record<string, { l: string; cls: string }> = {
    submitted: { l: 'надіслано на модерацію', cls: 'wait' }, clarify: { l: 'повернуто з уточненнями', cls: 'wait' }, accepted: { l: 'підтверджено', cls: 'ok' },
  };
  return (
    <div className="adm-modn">
      <div className="adm-modn-head">
        <span className={`cab-badge mono tst-${mod ? M[mod.status].cls : 'muted'}`}>{mod ? M[mod.status].l : 'клієнт ще не надсилав'}</span>
        {mod && <span className="mono adm-act-at">{rel(mod.at)}</span>}
        {mod?.aiVerdict && <span className="mono adm-modn-ai">AI: {mod.aiVerdict.sufficient ? '✓ достатньо' : '✕ недостатньо'}{typeof mod.aiVerdict.coveragePct === 'number' ? ` · ${mod.aiVerdict.coveragePct}%` : ''}</span>}
      </div>
      <div className="adm-modn-acts">
        <button className="mc-btn ghost" disabled={busy === 'ai'} onClick={runAi}>{busy === 'ai' ? '🤖 Аналізую…' : '🤖 AI: чи достатньо даних?'}</button>
        <button className="mc-btn ok" disabled={!!busy} onClick={() => setStatus('accepted')}>✓ Підтвердити отримання</button>
        <button className="mc-btn wait" disabled={!!busy} onClick={clarify}>↩ Повернути з уточненнями</button>
      </div>
      {verdict && (
        <div className={'adm-modn-verdict' + (verdict.sufficient ? ' is-ok' : ' is-warn')}>
          <b>{verdict.sufficient ? '✓ Даних достатньо' : '✕ Даних недостатньо'} · покриття ~{verdict.coveragePct}%</b>
          <p>{verdict.summary}</p>
          {verdict.missing.length > 0 && (
            <ul>{verdict.missing.map((m, i) => <li key={i}><b>{m.module}:</b> {m.ask}</li>)}</ul>
          )}
          {!verdict.sufficient && <p className="mono adm-hint">Скопіюйте потрібні питання у блок «Уточнення (Крок 2)» і натисніть «Повернути з уточненнями».</p>}
        </div>
      )}
      <p className="mono adm-hint">Ланцюг: клієнт надсилає анкету → AI/менеджер перевіряють повноту → «Підтвердити» (клієнт бачить «очікуйте підсумки») або «Повернути» (клієнт бачить уточнюючі питання). Результати аудиту НЕ потрапляють до клієнта автоматично — лише через «поділитися» у файлах.</p>
    </div>
  );
}

/* ── Пакет аудиту: чеклист глав 5 звітів + автогенерація адмінських документів ── */

/** Спільний друкований шаблон WEEXP (як досьє): відкриває вікно → друк у PDF. */
