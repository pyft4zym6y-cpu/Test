import { useEffect, useRef, useState } from 'react';

import {
  loadPmDirectory,
  savePmDirectory,
  type PmDirectory,
  type PmSpecialist,
  type PmRoleRate
} from '@/lib/supa';

import { uid } from '../auditTemplate';

import '../system.css';
import '../cabinet.css';
import { type SaveState } from './shared';

export function PmOffice() {
  const [dir, setDir] = useState<PmDirectory | null>(null);
  const [msg, setMsg] = useState('');
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const latest = useRef<PmDirectory | null>(dir); latest.current = dir;
  const dirtyRef = useRef(false);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { loadPmDirectory().then(setDir); }, []);
  const persist = (d: PmDirectory) => savePmDirectory({
    specialists: (d.specialists || []).filter((s) => s.name.trim() || s.role.trim()),
    roleRates: (d.roleRates || []).filter((s) => s.role.trim()),
    knowledge: d.knowledge || '', presets: d.presets || [],
  });
  const doSave = async () => {
    const d = latest.current; if (!d) return;
    setState('saving'); setMsg('');
    const r = await persist(d);
    if (r.ok) { dirtyRef.current = false; setState('saved'); setSavedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })); }
    else { setState('error'); setMsg(r.error || 'Помилка збереження'); }
  };
  // Автозбереження довідника: дебаунс 1.2с; перший стан після завантаження не зберігаємо.
  useEffect(() => {
    if (!dir) return;
    if (!loaded.current) { loaded.current = true; return; }
    dirtyRef.current = true; setState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void doSave(); }, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir]);
  useEffect(() => () => { if (dirtyRef.current && latest.current) void persist(latest.current); }, []);
  if (!dir) return <section className="adm-sec"><h1 className="sysx-display adm-h1">Проект-офіс</h1><p className="mono adm-empty">Завантаження…</p></section>;

  const specs = dir.specialists || [], roles = dir.roleRates || [];
  const num = (v: string) => (v === '' ? 0 : Number(v));
  const setSpec = (i: number, k: keyof PmSpecialist, v: unknown) => setDir({ ...dir, specialists: specs.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const setRole = (i: number, k: keyof PmRoleRate, v: unknown) => setDir({ ...dir, roleRates: roles.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const presets = dir.presets || [];
  const stateLabel = state === 'saving' ? '💾 Збереження…'
    : state === 'dirty' ? '● Є незбережені зміни'
    : state === 'saved' ? `✓ Збережено ${savedAt}`
    : state === 'error' ? `✕ ${msg}` : '';

  return (
    <section className="adm-sec">
      <h1 className="sysx-display adm-h1">Проект-офіс</h1>
      <p className="adm-hint mono">Довідник команди та ставок. Використовується при складанні тарифікації та бюджету проектів. Ставки — €/год, без ПДВ.</p>

      <div className="pm-grid">
        <div className="pj-card">
          <h2 className="pj-h2">Команда (спеціалісти)</h2>
          {specs.map((s, i) => (
            <div key={s.id} className="pj-ed-task">
              <input className="ab-inp gg" value={s.name} onChange={(e) => setSpec(i, 'name', e.target.value)} placeholder="Імʼя" />
              <input className="ab-inp xs" value={s.role} onChange={(e) => setSpec(i, 'role', e.target.value)} placeholder="Роль" />
              <label className="pj-ed-mini">€/год<input className="ab-inp xs" type="number" min={0} value={s.rate} onChange={(e) => setSpec(i, 'rate', num(e.target.value))} /></label>
              <button className="mc-btn ghost" onClick={() => setDir({ ...dir, specialists: specs.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button className="mc-btn" onClick={() => setDir({ ...dir, specialists: [...specs, { id: uid('sp'), name: '', role: '', rate: 0 }] })}>+ Спеціаліст</button>
        </div>

        <div className="pj-card">
          <h2 className="pj-h2">Ставки за ролями</h2>
          <p className="pj-sub mono">Дефолтна ставка ролі, якщо спеціаліст не вказаний.</p>
          {roles.map((s, i) => (
            <div key={s.id} className="pj-ed-task">
              <input className="ab-inp gg" value={s.role} onChange={(e) => setRole(i, 'role', e.target.value)} placeholder="Роль (напр. Senior dev)" />
              <label className="pj-ed-mini">€/год<input className="ab-inp xs" type="number" min={0} value={s.rate} onChange={(e) => setRole(i, 'rate', num(e.target.value))} /></label>
              <button className="mc-btn ghost" onClick={() => setDir({ ...dir, roleRates: roles.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button className="mc-btn" onClick={() => setDir({ ...dir, roleRates: [...roles, { id: uid('rr'), role: '', rate: 0 }] })}>+ Ставка ролі</button>
        </div>
      </div>

      <div className="pj-card" style={{ marginTop: 16 }}>
        <h2 className="pj-h2">База знань для AI</h2>
        <p className="pj-sub mono">Методика й правила агенції: як складати план, типові етапи, підходи до команди й тарифікації. Клод спирається на це, коли генерує чернетку проекту з аудиту.</p>
        <textarea className="ab-inp" rows={7} value={dir.knowledge || ''} onChange={(e) => setDir({ ...dir, knowledge: e.target.value })}
          placeholder={'напр.:\n— Старт завжди з дискавері (2–3 тижні).\n— Роль Tech Lead підключаємо з 2-го місяця.\n— Мінімальна тарифікація маркетолога — 40 год/міс.\n— Аванс 40% на старті, решта — помісячно.'} />
      </div>

      <div className="pj-card">
        <h2 className="pj-h2">Пресети проектів ({presets.length})</h2>
        <p className="pj-sub mono">Шаблони плану (Гант + команда + тарифікація). Зберігаються з картки клієнта кнопкою «Зберегти як пресет», застосовуються там само.</p>
        {presets.length === 0 ? <p className="mono adm-empty">Пресетів ще немає.</p> : (
          <ul className="adm-files">{presets.map((pr) => (
            <li key={pr.id} className="pm-preset">
              <span><b>{pr.title || 'без назви'}</b> <i className="mono">· {(pr.tasks || []).length} задач · {(pr.team || []).length} ролей</i></span>
              <button className="mc-btn ghost" onClick={() => setDir({ ...dir, presets: presets.filter((x) => x.id !== pr.id) })}>✕</button>
            </li>
          ))}</ul>
        )}
      </div>

      <div className="pj-ed-foot" style={{ marginTop: 16 }}>
        {stateLabel && <span className={`mono pj-save-state pj-save-${state}`}>{stateLabel}</span>}
        <button className="mc-btn ok" onClick={() => { if (timer.current) clearTimeout(timer.current); void doSave(); }} disabled={state === 'saving'}>{state === 'saving' ? 'Зберігаємо…' : 'Зберегти зараз'}</button>
      </div>
    </section>
  );
}

/** Менеджер керує кількома проектами клієнта: селектор + додати/видалити + збереження. */
