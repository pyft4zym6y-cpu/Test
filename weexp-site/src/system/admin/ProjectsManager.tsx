import { useEffect, useRef, useState } from 'react';

import {
  findAuditIdByCode,
  loadAuditAnswers,
  saveProjectsFor,
  emptyProject,
  loadPmDirectory,
  savePmDirectory,
  aiDraftProject,
  type Project,
  type ProjTask,
  type ProjMember,
  type ProjPayment,
  type ProjMonth,
  type ProjTariffItem,
  type PmDirectory
} from '@/lib/supa';

import { uid } from '../auditTemplate';

import '../system.css';
import '../cabinet.css';
import { gMonthLabel, SaveBadge } from './shared';
import { useAutosave } from './useAutosave';
import { askConfirm, askText } from './dialog';
import { toastUndo } from '@/lib/toast';

export function ProjectsManager({ userId, initial, code, company }: { userId: string; initial: Project[]; code?: string; company?: string }) {
  const [list, setList] = useState<Project[]>(initial.length ? initial : []);
  const [active, setActive] = useState(0);
  const auto = useAutosave<Project[]>((v) => saveProjectsFor(userId, v), 1200);
  const idx = Math.min(active, Math.max(0, list.length - 1));
  const cur = list[idx];
  /** Єдина точка зміни списку: стан + автозбереження разом, без ефекту на [list]. */
  const apply = (next: Project[]) => { setList(next); auto.touch(next); };

  const patchCur = (p: Project) => apply(list.map((x, i) => (i === idx ? p : x)));
  const addProject = () => { const np = emptyProject(); np.title = `Проект ${list.length + 1}`; apply([...list, np]); setActive(list.length); };
  const delProject = async () => { if (!cur) return; if (!(await askConfirm({ title: 'Видалити цей проект?', text: 'Задачі, бюджет і платежі проекту зникнуть разом з ним.', confirmLabel: 'Видалити', tone: 'bad' }))) return; const nl = list.filter((_, i) => i !== idx); apply(nl); setActive(0); };

  const pubN = list.filter((x) => x.published).length;
  const savedNote = `${list.length} проект(и), ${pubN} видно клієнту`;

  return (
    <div className="pj-mgr">
      <div className="pj-mgr-bar">
        {list.map((x, i) => (
          <button key={x.id || i} className={`pj-switch-b${i === idx ? ' on' : ''}`} onClick={() => setActive(i)}>
            {x.published ? '● ' : '○ '}{x.title || `Проект ${i + 1}`}
          </button>
        ))}
        <button className="mc-btn sm" onClick={addProject}>+ Проект</button>
      </div>
      {!cur ? <p className="mono adm-empty">Проектів ще немає. Додайте перший.</p> : (
        <>
          <ProjectEditor key={cur.id} value={cur} onChange={patchCur} code={code} company={company} />
          <div className="pj-ed-foot">
            <button className="mc-btn bad" onClick={delProject}>Видалити проект</button>
            <div className="pj-mgr-save">
              <SaveBadge state={auto.state} error={auto.error} savedAt={auto.savedAt} onRetry={auto.flush} />
              {auto.state === 'saved' && <span className="mono adm-hint">{savedNote}</span>}
              <button className="mc-btn ok" onClick={() => void auto.flush()} disabled={auto.state === 'saving'}>{auto.state === 'saving' ? 'Зберігаємо…' : 'Зберегти зараз'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Редактор одного проекту (керований): Гант, команда, фінкалендар, тарифікація, бюджет. */
export function ProjectEditor({ value, onChange, code, company }: { value: Project; onChange: (p: Project) => void; code?: string; company?: string }) {
  const p = value;
  const [dir, setDir] = useState<PmDirectory>({});
  const [ai, setAi] = useState('');   // статус AI-чернетки
  useEffect(() => { loadPmDirectory().then(setDir); }, []);
  const upd = (patch: Partial<Project>) => onChange({ ...p, ...patch });

  /**
   * Видалення рядка в проєкті (задача, роль, платіж, позиція тарифу) з відкатом.
   * Підтвердження тут не ставимо навмисно: у плані десятки рядків, і діалог на
   * кожен зробив би редагування нестерпним. Скасування дешевше — дія проходить
   * одразу, а помилку видно й видно, як її повернути.
   */
  const undoable = (what: string, patch: Partial<Project>) => {
    // Знімок ДО зміни: не посилання на масив, а копія — інакше відкат поверне
    // вже змінений список і нічого не відновить.
    const before: Partial<Project> = Object.fromEntries(
      Object.keys(patch).map((k) => [k, structuredClone((p as unknown as Record<string, unknown>)[k])]),
    );
    upd(patch);
    toastUndo(`${what} видалено`, () => onChange({ ...p, ...before }));
  };
  const num = (v: string) => (v === '' ? 0 : Number(v));
  const rid = (pfx: string) => `${pfx}_${Math.random().toString(36).slice(2, 8)}`;

  // 🪄 Згенерувати чернетку плану з відповідей аудиту клієнта.
  const genDraft = async () => {
    if (!code) { setAi('Немає коду аудиту — клієнт ще не відкрив розділ.'); return; }
    setAi('Читаю аудит…');
    const id = await findAuditIdByCode(code);
    if (!id) { setAi('Аудит не знайдено.'); return; }
    const answers = await loadAuditAnswers(id);
    if (!answers || !Object.keys(answers).length) { setAi('Клієнт ще не заповнив відповіді аудиту.'); return; }
    setAi('Клод складає чернетку…');
    const r = await aiDraftProject({
      answers, company, knowledge: dir.knowledge, roleRates: dir.roleRates, specialists: dir.specialists,
      startMonth: p.startMonth, span: p.span,
    });
    if (!r.ok || !r.draft) { setAi(r.error || 'Не вдалося згенерувати.'); return; }
    const d = r.draft;
    upd({
      title: p.title || d.title || '',
      tasks: (d.tasks || []).map((t) => ({ id: rid('t'), name: t.name || '', track: t.track, startM: Math.max(0, Number(t.startM) || 0), lenM: Math.max(1, Number(t.lenM) || 1), progress: 0, owner: t.owner })),
      team: (d.team || []).map((m) => ({ id: rid('m'), role: m.role || '', name: m.name || '' })),
      tariff: (d.tariff || []).map((mo) => ({ id: rid('mo'), month: mo.month || p.startMonth || '', items: (mo.items || []).map((it) => ({ id: rid('i'), label: it.label || '', hours: Number(it.hours) || 0, rate: Number(it.rate) || 0 })) })),
    });
    setAi(`✓ Чернетку складено${d.rationale ? ': ' + d.rationale : ''}. Перевірте й відредагуйте перед публікацією.`);
  };
  // Пресети проектів (шаблони) з довідника.
  const presets = dir.presets || [];
  const applyPreset = (pr: Project) => {
    upd({
      title: pr.title || p.title, span: pr.span || p.span,
      tasks: (pr.tasks || []).map((t) => ({ ...t, id: rid('t') })),
      team: (pr.team || []).map((m) => ({ ...m, id: rid('m') })),
      tariff: (pr.tariff || []).map((mo) => ({ ...mo, id: rid('mo'), items: (mo.items || []).map((it) => ({ ...it, id: rid('i') })) })),
    });
    setAi(`✓ Застосовано пресет «${pr.title || 'без назви'}».`);
  };
  const saveAsPreset = async () => {
    const name = await askText({ title: 'Назва пресету', input: { rows: 1, initial: p.title || 'Пресет' }, confirmLabel: 'Зберегти' });
    if (!name) return;
    const preset: Project = { ...p, id: rid('pr'), title: name, published: false, payments: [], budget: {} };
    const nd = { ...dir, presets: [...presets, preset] };
    setDir(nd); await savePmDirectory(nd);
    setAi(`✓ Збережено як пресет «${name}» (у Проект-офісі).`);
  };

  const tasks = p.tasks || [], team = p.team || [], pays = p.payments || [], tariff = p.tariff || [];
  const specialists = dir.specialists || [];
  const span = Math.max(1, Math.min(24, p.span || 6));
  const cols = Array.from({ length: span }, (_, i) => i);
  const budget = p.budget || {};
  const setBudget = (taskId: string, m: number, v: number) => { const b = { ...budget }; const k = `${taskId}:${m}`; if (v) b[k] = v; else delete b[k]; upd({ budget: b }); };
  const budgetGrand = Object.values(budget).reduce((s, v) => s + (v || 0), 0);
  const setTask = (i: number, k: keyof ProjTask, v: unknown) => upd({ tasks: tasks.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setMember = (i: number, k: keyof ProjMember, v: unknown) => upd({ team: team.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setPay = (i: number, k: keyof ProjPayment, v: unknown) => upd({ payments: pays.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setMonth = (i: number, k: keyof ProjMonth, v: unknown) => upd({ tariff: tariff.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setItem = (mi: number, ii: number, k: keyof ProjTariffItem, v: unknown) =>
    upd({ tariff: tariff.map((m, j) => (j === mi ? { ...m, items: (m.items || []).map((it, q) => (q === ii ? { ...it, [k]: v } : it)) } : m)) });
  const patchItem = (mi: number, ii: number, patch: Partial<ProjTariffItem>) =>
    upd({ tariff: tariff.map((m, j) => (j === mi ? { ...m, items: (m.items || []).map((it, q) => (q === ii ? { ...it, ...patch } : it)) } : m)) });

  return (
    <div className="pj-ed">
      <div className="pj-ai">
        <button className="mc-btn ai" onClick={genDraft}>🪄 AI-чернетка з аудиту</button>
        {presets.length > 0 && (
          <select className="ab-sel" value="" onChange={(e) => { const pr = presets.find((x) => x.id === e.target.value); if (pr) applyPreset(pr); }}>
            <option value="">Застосувати пресет…</option>
            {presets.map((pr) => <option key={pr.id} value={pr.id}>{pr.title || 'без назви'}</option>)}
          </select>
        )}
        <button className="mc-btn" onClick={saveAsPreset}>Зберегти як пресет</button>
        {ai && <span className="mono pj-ai-msg">{ai}</span>}
      </div>

      <div className="pj-ed-row2">
        <label className="pj-ed-f"><i>Назва проекту</i><input className="ab-inp" value={p.title || ''} onChange={(e) => upd({ title: e.target.value })} placeholder="напр. Ecom-система Q3" /></label>
        <label className="pj-ed-f sm"><i>Старт (міс.)</i><input className="ab-inp" type="month" value={p.startMonth || ''} onChange={(e) => upd({ startMonth: e.target.value })} /></label>
        <label className="pj-ed-f sm"><i>Місяців у Ганті</i><input className="ab-inp" type="number" min={1} max={24} value={p.span || 6} onChange={(e) => upd({ span: Math.max(1, Math.min(24, num(e.target.value))) })} /></label>
      </div>

      {/* Гант */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Дорожня карта (Гант)</b>
        {tasks.map((tk, i) => (
          <div key={tk.id} className="pj-ed-task">
            <input className="ab-inp gg" value={tk.name} onChange={(e) => setTask(i, 'name', e.target.value)} placeholder="Задача / етап" />
            <input className="ab-inp xs" value={tk.owner || ''} onChange={(e) => setTask(i, 'owner', e.target.value)} placeholder="хто" />
            <label className="pj-ed-mini">старт<input className="ab-inp xxs" type="number" min={0} value={tk.startM} onChange={(e) => setTask(i, 'startM', num(e.target.value))} /></label>
            <label className="pj-ed-mini">трив.<input className="ab-inp xxs" type="number" min={1} value={tk.lenM} onChange={(e) => setTask(i, 'lenM', Math.max(1, num(e.target.value)))} /></label>
            <label className="pj-ed-mini">%<input className="ab-inp xxs" type="number" min={0} max={100} value={tk.progress ?? 0} onChange={(e) => setTask(i, 'progress', Math.max(0, Math.min(100, num(e.target.value))))} /></label>
            <button className="mc-btn ghost" aria-label={`Видалити задачу ${i + 1}`} title="Видалити задачу" onClick={() => undoable('Задачу', { tasks: tasks.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button className="mc-btn" onClick={() => upd({ tasks: [...tasks, { id: uid('t'), name: '', startM: 0, lenM: 1, progress: 0 }] })}>+ Задача</button>
      </div>

      {/* Команда */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Команда</b>
        {team.map((m, i) => (
          <div key={m.id} className="pj-ed-task">
            <input className="ab-inp xs" value={m.role} onChange={(e) => setMember(i, 'role', e.target.value)} placeholder="Роль" />
            <input className="ab-inp gg" value={m.name} onChange={(e) => setMember(i, 'name', e.target.value)} placeholder="Імʼя" />
            <button className="mc-btn ghost" aria-label={`Видалити з команди: ${m.name || m.role || i + 1}`} title="Видалити з команди" onClick={() => undoable('Учасника команди', { team: team.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <div className="pj-ed-add">
          {specialists.length > 0 && (
            <select className="ab-sel" value="" onChange={(e) => { const s = specialists.find((x) => x.id === e.target.value); if (s) upd({ team: [...team, { id: uid('m'), role: s.role, name: s.name }] }); }}>
              <option value="">+ з довідника…</option>
              {specialists.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
            </select>
          )}
          <button className="mc-btn" onClick={() => upd({ team: [...team, { id: uid('m'), role: '', name: '' }] })}>+ Учасник</button>
        </div>
      </div>

      {/* Фінкалендар */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Фінансовий календар (€, без ПДВ)</b>
        {pays.map((x, i) => (
          <div key={x.id} className="pj-ed-task">
            <input className="ab-inp gg" value={x.label} onChange={(e) => setPay(i, 'label', e.target.value)} placeholder="Платіж (напр. Аванс)" />
            <input className="ab-inp xs" type="month" value={x.month} onChange={(e) => setPay(i, 'month', e.target.value)} />
            <label className="pj-ed-mini">€<input className="ab-inp xs" type="number" min={0} value={x.amount} onChange={(e) => setPay(i, 'amount', num(e.target.value))} /></label>
            <select className="ab-sel" value={x.status} onChange={(e) => setPay(i, 'status', e.target.value as ProjPayment['status'])}><option value="pending">Очікує</option><option value="paid">Сплачено</option></select>
            <button className="mc-btn ghost" aria-label={`Видалити платіж ${x.label || i + 1}`} title="Видалити платіж" onClick={() => undoable('Платіж', { payments: pays.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button className="mc-btn" onClick={() => upd({ payments: [...pays, { id: uid('p'), label: '', month: p.startMonth || '', amount: 0, status: 'pending' }] })}>+ Платіж</button>
      </div>

      {/* Тарифікація */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Помісячна тарифікація</b>
        {tariff.map((mo, mi) => {
          const items = mo.items || [];
          return (
            <div key={mo.id} className="pj-ed-tm">
              <div className="pj-ed-tm-head">
                <input className="ab-inp xs" type="month" value={mo.month} onChange={(e) => setMonth(mi, 'month', e.target.value)} />
                <button className="mc-btn ghost" onClick={() => upd({ tariff: tariff.filter((_, j) => j !== mi) })}>✕ місяць</button>
              </div>
              {items.map((it, ii) => (
                <div key={it.id} className="pj-ed-task">
                  <input className="ab-inp gg" value={it.label} onChange={(e) => setItem(mi, ii, 'label', e.target.value)} placeholder="Робота / роль" />
                  {specialists.length > 0 && (
                    <select className="ab-sel xs" value="" title="Підставити зі довідника" onChange={(e) => { const s = specialists.find((x) => x.id === e.target.value); if (s) patchItem(mi, ii, { label: `${s.name} · ${s.role}`, rate: s.rate }); }}>
                      <option value="">довідник</option>
                      {specialists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                  <label className="pj-ed-mini">год<input className="ab-inp xxs" type="number" min={0} value={it.hours} onChange={(e) => setItem(mi, ii, 'hours', num(e.target.value))} /></label>
                  <label className="pj-ed-mini">€/год<input className="ab-inp xs" type="number" min={0} value={it.rate} onChange={(e) => setItem(mi, ii, 'rate', num(e.target.value))} /></label>
                  <span className="mono pj-ed-sum">€{((it.hours || 0) * (it.rate || 0)).toLocaleString('uk-UA')}</span>
                  <button className="mc-btn ghost" aria-label={`Видалити рядок тарифу ${ii + 1}`} title="Видалити рядок тарифу" onClick={() => undoable('Рядок тарифу', { tariff: tariff.map((m, j) => (j === mi ? { ...m, items: items.filter((_, q) => q !== ii) } : m)) })}>✕</button>
                </div>
              ))}
              <button className="mc-btn sm" onClick={() => setMonth(mi, 'items', [...items, { id: uid('i'), label: '', hours: 0, rate: 0 }])}>+ Рядок</button>
            </div>
          );
        })}
        <button className="mc-btn" onClick={() => upd({ tariff: [...tariff, { id: uid('mo'), month: p.startMonth || '', items: [] }] })}>+ Місяць</button>
      </div>

      {/* Бюджет-матриця задачі × місяці (внутрішнє, проект-офіс) */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Бюджет: задачі × місяці (€, внутрішнє)</b>
        {tasks.length === 0 ? <p className="mono adm-empty">Додайте задачі в дорожній карті — рядки бюджету зʼявляться автоматично.</p> : (
          <div className="pj-bud-wrap">
            <table className="pj-bud">
              <thead><tr><th className="l">Задача</th>{cols.map((m) => <th key={m}>{gMonthLabel(p.startMonth, m)}</th>)}<th>Σ</th></tr></thead>
              <tbody>
                {tasks.map((tk) => {
                  const rowSum = cols.reduce((s, m) => s + (budget[`${tk.id}:${m}`] || 0), 0);
                  return (
                    <tr key={tk.id}>
                      <td className="l">{tk.name || '—'}</td>
                      {cols.map((m) => (
                        <td key={m}><input className="pj-bud-inp" type="number" min={0} value={budget[`${tk.id}:${m}`] || ''} onChange={(e) => setBudget(tk.id, m, num(e.target.value))} /></td>
                      ))}
                      <td className="mono r">€{rowSum.toLocaleString('uk-UA')}</td>
                    </tr>
                  );
                })}
                <tr className="pj-bud-tot">
                  <td className="l">Разом</td>
                  {cols.map((m) => { const cs = tasks.reduce((s, tk) => s + (budget[`${tk.id}:${m}`] || 0), 0); return <td key={m} className="mono">€{cs.toLocaleString('uk-UA')}</td>; })}
                  <td className="mono r">€{budgetGrand.toLocaleString('uk-UA')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pj-ed-pubrow">
        <label className="pj-ed-pub"><input type="checkbox" checked={!!p.published} onChange={(e) => upd({ published: e.target.checked })} /> Опубліковано (видно клієнту)</label>
      </div>
    </div>
  );
}

/** GA4-конектор клієнта: перевірка підключення і превʼю ключових даних (read-only). */

