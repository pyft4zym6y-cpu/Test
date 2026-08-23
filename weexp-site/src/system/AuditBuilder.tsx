import { useEffect, useMemo, useState } from 'react';
import {
  loadTemplate, saveTemplate, uid, Q_TYPES, CLIENT_ROLES, FRAMEWORK_PRESETS, frameworkFor, customerArchetypeBlock,
  type AuditTemplate, type Block, type Question, type QType,
} from './auditTemplate';

/**
 * Конструктор шаблону глибокого аудиту (адмінка). Блоки → питання: типи,
 * обов’язковість, підказки, варіанти, умовна логіка, роль-обмеження. Save → нова
 * активна версія (старі заморожуються для вже початих аудитів).
 */
/** Робочі простори одного аудиту: питання / доступи / файли — окремі вкладки. */
type Workspace = 'questions' | 'access' | 'files';
const WS_OF = (t: QType): Workspace => (t === 'access' ? 'access' : t === 'file' ? 'files' : 'questions');

export function AuditBuilder() {
  const [tpl, setTpl] = useState<AuditTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [preset, setPreset] = useState<string>('full');
  const [ws, setWs] = useState<Workspace>('questions');

  useEffect(() => { loadTemplate().then(setTpl); }, []);

  const allQ = useMemo(() => (tpl?.blocks || []).flatMap((b) => b.questions.map((q) => ({ key: q.key, label: q.label }))), [tpl]);

  if (!tpl) return <section className="adm-sec"><p className="mc-msg mono">Завантаження шаблону…</p></section>;

  const patch = (fn: (t: AuditTemplate) => AuditTemplate) => setTpl((t) => (t ? fn(structuredClone(t)) : t));
  const move = <T,>(arr: T[], i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= arr.length) return arr; [arr[i], arr[j]] = [arr[j], arr[i]]; return arr; };

  const addBlock = () => patch((t) => { t.blocks.push({ key: uid('b'), title: 'Новий блок', questions: [] }); return t; });
  const addArchetype = () => patch((t) => { const n = t.blocks.filter((b) => /Клієнт — CA/.test(b.title)).length + 1; t.blocks.push(customerArchetypeBlock(n)); return t; });
  const delBlock = (bi: number) => patch((t) => { t.blocks.splice(bi, 1); return t; });
  const moveBlock = (bi: number, d: -1 | 1) => patch((t) => { move(t.blocks, bi, d); return t; });
  const setBlock = (bi: number, k: keyof Block, v: unknown) => patch((t) => { (t.blocks[bi] as Record<string, unknown>)[k] = v; return t; });

  // Питання адресуються за key (а не індексом): робочі простори фільтрують список,
  // тож реальний індекс у масиві шукаємо на місці.
  const addQ = (bi: number, type: QType = 'text') => patch((t) => { t.blocks[bi].questions.push({ key: uid(), label: type === 'access' ? 'Новий доступ' : type === 'file' ? 'Новий файл' : 'Нове питання', type }); return t; });
  const delQ = (bi: number, key: string) => patch((t) => { const qs = t.blocks[bi].questions; const i = qs.findIndex((x) => x.key === key); if (i >= 0) qs.splice(i, 1); return t; });
  const setQ = (bi: number, key: string, k: keyof Question, v: unknown) => patch((t) => { const q = t.blocks[bi].questions.find((x) => x.key === key); if (q) (q as Record<string, unknown>)[k] = v; return t; });
  /** Перемістити в межах свого робочого простору (сусід того самого виду). */
  const moveQKind = (bi: number, key: string, d: -1 | 1) => patch((t) => {
    const qs = t.blocks[bi].questions;
    const kind = qs.filter((x) => WS_OF(x.type) === ws);
    const ki = kind.findIndex((x) => x.key === key);
    const nb = kind[ki + d];
    if (!nb) return t;
    const i = qs.findIndex((x) => x.key === key), j = qs.findIndex((x) => x.key === nb.key);
    [qs[i], qs[j]] = [qs[j], qs[i]];
    return t;
  });

  const loadFramework = () => {
    const p = FRAMEWORK_PRESETS.find((x) => x.id === preset) || FRAMEWORK_PRESETS[0];
    if (!confirm(`Замінити поточні блоки пресетом «${p.label}» (${p.modules.length} модулів)? Поточні незбережені блоки буде втрачено. Збереження — окремою кнопкою «Зберегти нову версію».`)) return;
    setTpl((t) => ({ ...frameworkFor(preset), version: t?.version || 1 }));
    setMsg(`Завантажено пресет «${p.label}» (${p.modules.length} модулів). Перевірте й натисніть «Зберегти нову версію».`);
  };

  const save = async () => {
    setBusy(true); setMsg('');
    const next = { ...tpl, version: (tpl.version || 1) + 1 };
    const r = await saveTemplate(next);
    setBusy(false);
    if (r.ok) { setTpl(next); setMsg(r.local ? `Збережено локально (v${next.version}). З Supabase — нова активна версія.` : `Збережено · активна версія v${next.version}.`); }
    else setMsg('Помилка: ' + (r.error || ''));
  };

  return (
    <section className="adm-sec">
      <div className="adm-sec-head">
        <div><h1 className="sysx-display adm-h1">Конструктор аудиту</h1><span className="mono adm-hint">Активна версія v{tpl.version} · {tpl.blocks.length} блоків</span></div>
        <div className="adm-head-r">
          <select className="ab-sel" value={preset} onChange={(e) => setPreset(e.target.value)} title="Тип бізнесу — пресет фреймворку">
            {FRAMEWORK_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button className="sysx-cta" onClick={loadFramework} title="Замінити блоки обраним пресетом C-level фреймворку">↺ Завантажити пресет</button>
          <button className="sysx-cta is-primary" onClick={save} disabled={busy}>{busy ? 'Зберігаємо…' : 'Зберегти нову версію →'}</button>
        </div>
      </div>
      {msg && <p className="adm-code-banner-l mono" style={{ color: 'var(--ok,#1F9D55)' }}>{msg}</p>}
      <p className="adm-hint mono">Один аудит — єдина сутність із трьома робочими просторами: питання, доступи, файли. Клієнт бачить це як єдину послугу «Глибокий аудит». Роль на блоці обмежує, хто з команди замовника заповнює.</p>

      {(() => {
        const counts = { questions: 0, access: 0, files: 0 };
        for (const b of tpl.blocks) for (const qq of b.questions) counts[WS_OF(qq.type)]++;
        const WS_TABS: { k: Workspace; l: string; n: number }[] = [
          { k: 'questions', l: 'Питання', n: counts.questions },
          { k: 'access', l: 'Доступи', n: counts.access },
          { k: 'files', l: 'Файли', n: counts.files },
        ];
        return (
          <div className="adm-seg mono" role="tablist">
            {WS_TABS.map((w) => <button key={w.k} role="tab" className={ws === w.k ? 'on' : ''} onClick={() => setWs(w.k)}>{w.l} <b>{w.n}</b></button>)}
          </div>
        );
      })()}

      <div className="ab-blocks">
        {tpl.blocks.map((b, bi) => {
          const items = b.questions.filter((qq) => WS_OF(qq.type) === ws);
          return (
          <div key={b.key} className="ab-block">
            <div className="ab-block-head">
              {b.cat && <span className="ab-cat mono" title="Модуль">{b.cat}</span>}
              <input className="ab-inp ab-title" value={b.title} onChange={(e) => setBlock(bi, 'title', e.target.value)} placeholder="Назва блоку" />
              <label className="ab-role mono">роль
                <select value={b.role || ''} onChange={(e) => setBlock(bi, 'role', e.target.value || undefined)}>
                  <option value="">будь-хто</option>
                  {CLIENT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <div className="ab-mv">
                <button className="mc-btn ghost" onClick={() => moveBlock(bi, -1)} disabled={bi === 0}>↑</button>
                <button className="mc-btn ghost" onClick={() => moveBlock(bi, 1)} disabled={bi === tpl.blocks.length - 1}>↓</button>
                <button className="mc-btn bad" onClick={() => delBlock(bi)}>Видалити блок</button>
              </div>
            </div>

            <div className="ab-qs">
              {items.length === 0 && <p className="mono adm-empty ab-empty">{ws === 'questions' ? 'питань немає' : ws === 'access' ? 'доступів немає' : 'файлів немає'}</p>}
              {items.map((q, ki) => (
                <div key={q.key} className="ab-q">
                  <div className="ab-q-row">
                    <input className="ab-inp" value={q.label} onChange={(e) => setQ(bi, q.key, 'label', e.target.value)} placeholder={ws === 'access' ? 'Який доступ потрібен' : ws === 'files' ? 'Який файл потрібен' : 'Текст питання'} />
                    {ws === 'questions' ? (
                      <select className="ab-sel" value={q.type} onChange={(e) => setQ(bi, q.key, 'type', e.target.value as QType)}>
                        {Q_TYPES.filter((tp) => WS_OF(tp.v as QType) === 'questions').map((tp) => <option key={tp.v} value={tp.v}>{tp.label}</option>)}
                      </select>
                    ) : (
                      <span className="ab-kind mono">{ws === 'access' ? '🔑 доступ' : '📎 файл'}</span>
                    )}
                    <label className="ab-req mono"><input type="checkbox" checked={!!q.required} onChange={(e) => setQ(bi, q.key, 'required', e.target.checked)} /> обов.</label>
                    <div className="ab-mv">
                      <button className="mc-btn ghost" onClick={() => moveQKind(bi, q.key, -1)} disabled={ki === 0}>↑</button>
                      <button className="mc-btn ghost" onClick={() => moveQKind(bi, q.key, 1)} disabled={ki === items.length - 1}>↓</button>
                      <button className="mc-btn ghost" onClick={() => delQ(bi, q.key)}>✕</button>
                    </div>
                  </div>
                  <div className="ab-q-row2">
                    <input className="ab-inp ab-hint" value={q.hint || ''} onChange={(e) => setQ(bi, q.key, 'hint', e.target.value)} placeholder={ws === 'access' ? 'Інструкція: кого і як додати (напр. audit@weexp.agency як Viewer)' : ws === 'files' ? 'Формат/період (напр. CSV, 12 міс)' : 'Підказка (необов.)'} />
                    {(q.type === 'single' || q.type === 'multi') && (
                      <input className="ab-inp" value={(q.options || []).join(', ')} onChange={(e) => setQ(bi, q.key, 'options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="Варіанти через кому" />
                    )}
                  </div>
                  {ws === 'questions' && (
                    <div className="ab-q-cond mono">
                      <span>показати, якщо</span>
                      <select value={q.condQKey || ''} onChange={(e) => setQ(bi, q.key, 'condQKey', e.target.value || undefined)}>
                        <option value="">— завжди —</option>
                        {allQ.filter((x) => x.key !== q.key).map((x) => <option key={x.key} value={x.key}>{x.label.slice(0, 30)}</option>)}
                      </select>
                      {q.condQKey && <><span>=</span><input className="ab-inp ab-cond" value={q.condValue || ''} onChange={(e) => setQ(bi, q.key, 'condValue', e.target.value)} placeholder="значення" /></>}
                    </div>
                  )}
                </div>
              ))}
              <button className="mc-btn" onClick={() => addQ(bi, ws === 'access' ? 'access' : ws === 'files' ? 'file' : 'text')}>
                {ws === 'access' ? '+ Доступ' : ws === 'files' ? '+ Файл' : '+ Питання'}
              </button>
            </div>
          </div>
          );
        })}
        <div className="adm-head-r">
          <button className="sysx-cta" onClick={addArchetype} title="Додати портрет аудиторії (Customer Archetype) зі своїм набором питань">+ Архетип клієнта (CA)</button>
          <button className="sysx-cta" onClick={addBlock}>+ Додати блок</button>
        </div>
      </div>
    </section>
  );
}
