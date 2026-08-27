import { useEffect, useMemo, useRef, useState } from 'react';
import { escapeHtml } from '@/lib/escapeHtml';
import {
  loadTemplate, saveTemplate, uid, Q_TYPES, CLIENT_ROLES, frameworkFor, customerArchetypeBlock,
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


/** Брендований PDF усього опитувальника (через вікно друку браузера). */
function exportTemplatePdf(tpl: AuditTemplate) {
  const w = window.open('', '_blank');
  if (!w) { alert('Дозвольте спливаючі вікна, щоб зберегти PDF.'); return; }
  const typeLabel = (t: QType) => (Q_TYPES.find((x) => x.v === t)?.label || t).replace(/Відкрите — /, '');
  const counts = { q: 0, a: 0, f: 0 };
  for (const b of tpl.blocks) for (const qq of b.questions) { const ws = WS_OF(qq.type); if (ws === 'access') counts.a++; else if (ws === 'files') counts.f++; else counts.q++; }
  const toc = tpl.blocks.map((b, i) => `<tr><td class="n">${String(i + 1).padStart(2, '0')}</td><td>${escapeHtml(b.title)}</td><td class="r">${escapeHtml(b.role || '—')}</td><td class="c">${b.questions.length}</td></tr>`).join('');
  const qHtml = (qq: Question, idx: number) => {
    const ws = WS_OF(qq.type);
    const badge = ws === 'access' ? '<span class="tag acc">доступ</span>' : ws === 'files' ? '<span class="tag file">файл</span>' : `<span class="tag">${escapeHtml(typeLabel(qq.type))}</span>`;
    const opts = (qq.options || []).length ? `<div class="opts">${(qq.options || []).map((o) => `<span class="opt">${escapeHtml(o)}</span>`).join('')}</div>` : '';
    const cond = qq.condQKey ? `<div class="hint">↳ показується, якщо «${escapeHtml(qq.condQKey)}» = «${escapeHtml(qq.condValue)}»</div>` : '';
    const hint = qq.hint ? `<div class="hint">${escapeHtml(qq.hint)}</div>` : '';
    return `<div class="q${qq.required ? ' req' : ''}">
      <div class="q-top"><span class="q-n">${idx}</span><span class="q-l">${escapeHtml(qq.label)}${qq.required ? ' <b class="star">*</b>' : ''}</span>${badge}</div>
      ${opts}${hint}${cond}
    </div>`;
  };
  const blocks = tpl.blocks.map((b, i) => `
    <section class="mod">
      <div class="mod-h"><span class="mod-n">${String(i + 1).padStart(2, '0')}</span>
        <div><h2>${escapeHtml(b.title)}</h2><span class="mod-meta">${escapeHtml(b.role ? 'заповнює: ' + b.role : '')} · ${b.questions.length} позицій</span></div></div>
      ${b.questions.map((qq, qi) => qHtml(qq, qi + 1)).join('')}
    </section>`).join('');
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Опитувальник глибокого аудиту — WEEXP</title><style>
@page{margin:14mm}body{font-family:"IBM Plex Sans","Segoe UI",system-ui,Arial,sans-serif;color:#141210;margin:0;font-size:12px;line-height:1.5}
.bar{height:8px;background:#F5301C}.wrap{padding:24px 30px;max-width:800px;margin:0 auto}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #141210;padding-bottom:12px;margin-bottom:6px}
.logo{font-weight:800;font-size:22px}.logo span{color:#F5301C}
.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;text-align:right}
h1{font-size:24px;letter-spacing:-.01em;margin:14px 0 4px}
.lead{color:#3d3a35;max-width:64ch;margin:0 0 14px}
.kpis{display:flex;gap:10px;margin:0 0 18px}
.kpi{border:1.5px solid #141210;padding:8px 14px}.kpi b{font-size:18px;display:block}.kpi span{font-size:10px;color:#6B675E;letter-spacing:.08em;text-transform:uppercase}
table.toc{border-collapse:collapse;width:100%;margin-bottom:8px}
.toc td{border-bottom:1px solid #EEE7D6;padding:5px 8px}.toc .n{width:30px;font-family:monospace;color:#F5301C;font-weight:700}.toc .r{width:110px;color:#6B675E;font-size:11px}.toc .c{width:40px;text-align:right;font-family:monospace}
.mod{page-break-inside:avoid;margin-top:20px;border-top:2px solid #141210;padding-top:10px}
.mod{page-break-before:auto}.mod-h{display:flex;gap:12px;align-items:baseline;margin-bottom:10px}
.mod-n{font-family:monospace;font-weight:800;font-size:20px;color:#F5301C}
.mod-h h2{margin:0;font-size:16px}.mod-meta{font-family:monospace;font-size:10.5px;color:#6B675E}
.q{padding:7px 0 7px 10px;border-bottom:1px solid #F0EADB;page-break-inside:avoid}
.q.req{border-left:3px solid #F5301C;padding-left:10px}
.q-top{display:flex;gap:8px;align-items:baseline}
.q-n{font-family:monospace;font-size:10px;color:#9a9488;min-width:18px}
.q-l{flex:1;font-size:12.5px;font-weight:600}.star{color:#F5301C}
.tag{font-family:monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;border:1px solid #C9C2B2;border-radius:100px;padding:2px 8px;color:#6B675E;white-space:nowrap}
.tag.acc{border-color:#7E9DFF;color:#3d5bbd}.tag.file{border-color:#1F6E4E;color:#1F6E4E}
.opts{margin:5px 0 0 26px}.opt{display:inline-block;border:1px solid #E3D9C0;border-radius:100px;padding:2px 9px;margin:0 5px 5px 0;font-size:10.5px}
.hint{margin:3px 0 0 26px;font-size:10.5px;color:#6B675E}
.foot{margin-top:26px;padding-top:12px;border-top:1px solid #E3D9C0;color:#9a9488;font-size:10px}
@media print{.noprint{display:none}}
</style></head><body><div class="bar"></div><div class="wrap">
<div class="top"><div class="logo">WEEXP<span>.</span></div><div class="meta">версія шаблону v${tpl.version || 1}<br>сформовано ${escapeHtml(new Date().toLocaleDateString('uk-UA'))}</div></div>
<h1>Опитувальник глибокого аудиту</h1>
<p class="lead">Єдиний вичерпний фреймворк діагностики e-commerce: ${tpl.blocks.length} модулів. Зірочка * — обовʼязкове; бейдж показує тип позиції; сірим — куди йде відповідь у пакеті документів.</p>
<div class="kpis"><div class="kpi"><b>${tpl.blocks.length}</b><span>модулів</span></div><div class="kpi"><b>${counts.q}</b><span>питань</span></div><div class="kpi"><b>${counts.a}</b><span>доступів</span></div><div class="kpi"><b>${counts.f}</b><span>файлів</span></div></div>
<table class="toc">${toc}</table>
<button class="noprint" onclick="window.print()" style="margin:6px 0;background:#F5301C;color:#fff;border:0;border-radius:6px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer">🖨 Друк / зберегти в PDF</button>
${blocks}
<div class="foot">WEEXP — Commerce OS · weexp.agency · Внутрішній робочий документ: повний перелік питань, доступів і файлів глибокого аудиту.</div>
</div><scr${''}ipt>window.onload=function(){setTimeout(function(){window.print()},400)}</scr${''}ipt></body></html>`;
  w.document.open(); w.document.write(html); w.document.close();
}

export function AuditBuilder() {
  const [tpl, setTpl] = useState<AuditTemplate | null>(null);
  // Конструктор зберігається лише кнопкою. Без цієї позначки закрита вкладка
  // мовчки забирала з собою всю роботу над шаблоном.
  const dirty = useRef(false);
  const markDirty = () => { dirty.current = true; };
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, []);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [ws, setWs] = useState<Workspace>('questions');

  useEffect(() => { loadTemplate().then(setTpl); }, []);

  const allQ = useMemo(() => (tpl?.blocks || []).flatMap((b) => b.questions.map((q) => ({ key: q.key, label: q.label }))), [tpl]);

  if (!tpl) return <section className="adm-sec"><p className="mc-msg mono">Завантаження шаблону…</p></section>;

  const patch = (fn: (t: AuditTemplate) => AuditTemplate) => { markDirty(); setTpl((t) => (t ? fn(structuredClone(t)) : t)); };
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
    if (!confirm('Замінити поточні блоки повним фреймворком: 13 модулів питань + блок «Доступи» (21 система з каталогу) + блок «Файли» (вхідні дані під пакет документів)? Поточні незбережені блоки буде втрачено. Збереження — окремою кнопкою «Зберегти нову версію».')) return;
    markDirty(); setTpl((t) => ({ ...frameworkFor('full'), version: t?.version || 1 }));
    setMsg('Завантажено повний фреймворк: 13 модулів + доступи + файли. Перевірте й натисніть «Зберегти нову версію».');
  };

  const save = async () => {
    setBusy(true); setMsg('');
    // Номер версії призначає saveTemplate за станом бази — клієнт його не вигадує.
    const r = await saveTemplate(tpl);
    const next = { ...tpl, version: r.version ?? tpl.version };
    setBusy(false);
    if (r.ok) { dirty.current = false; setTpl(next); setMsg(r.error ? `⚠ ${r.error}` : r.local ? `Збережено локально (v${next.version}). З Supabase — нова активна версія.` : `Збережено · активна версія v${next.version}.`); }
    else setMsg('Помилка: ' + (r.error || ''));
  };

  return (
    <section className="adm-sec">
      <div className="adm-sec-head">
        <div><h1 className="sysx-display adm-h1">Конструктор аудиту</h1><span className="mono adm-hint">Активна версія v{tpl.version} · {tpl.blocks.length} блоків</span></div>
        <div className="adm-head-r">
          <button className="sysx-cta" onClick={loadFramework} title="13 модулів питань із auditTemplate.ts + доступи з каталогу + файли під пакет документів">↺ Повний фреймворк</button>
          <button className="sysx-cta" onClick={() => tpl && exportTemplatePdf(tpl)} title="Красиво оформлений список усіх питань, доступів і файлів — у PDF">📄 Завантажити PDF</button>
          <button className="sysx-cta is-primary" onClick={save} disabled={busy}>{busy ? 'Зберігаємо…' : 'Зберегти нову версію →'}</button>
        </div>
      </div>
      {msg && <p className="adm-code-banner-l mono" style={{ color: 'var(--ok,#1F9D55)' }}>{msg}</p>}
      <p className="adm-hint mono">Один аудит — ЄДИНА максимально вичерпна сутність (без пресетів за типом бізнесу) із трьома робочими просторами: питання, доступи, файли. Кожне питання живить конкретний документ пакета — куди саме, показує підказка (hint) питання. Роль на блоці обмежує, хто з команди замовника заповнює.</p>

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
                    {(q.type === 'single' || q.type === 'multi' || q.type === 'rank' || q.type === 'rate10') && (
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
