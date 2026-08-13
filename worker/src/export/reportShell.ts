/**
 * Общий визуальный каркас всех клиентских PDF-отчётов A0 (единый стандарт A0 §6):
 * печатный CSS A4, палитра бренда, статусные цвета только для severity, бейджи
 * измерений, обёртка документа. Используется UX/UI Audit, Executive Diagnostic и
 * остальными аудитами сюиты — чтобы весь пакет выглядел как один документ.
 */
import { DIMS, type Dim } from '../pagereport.js';

export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const dimBadges = (dims: Dim[]) => dims.map((d) => `<span class="dim" title="${esc(DIMS[d])}">${d}</span>`).join('');
export const scoreColor = (pct: number) => (pct >= 70 ? 'ok' : pct >= 45 ? 'check' : 'gap');

/* ── Профиль сборки: клиентский чистовой vs наш внутренний ──
 * client — без внутренних меток, домыслов, служебной телеметрии;
 * internal — полный, с рабочими пометками. Рендереры и композер читают
 * isInternal(), чтобы одна и та же модель дала два разных документа. */
let PROFILE: 'client' | 'internal' = 'client';
export const setDocProfile = (p: 'client' | 'internal') => { PROFILE = p; };
export const isInternal = () => PROFILE === 'internal';

export const SHARED_CSS = `
  :root{--ink:#12161C;--muted:#5A6472;--line:#E4E7EC;--lime:#65A30D;--ok:#16a34a;--check:#d97706;--gap:#dc2626;--bg:#fff;--soft:#F7F8FA;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;color:var(--ink);background:var(--bg);font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;line-height:1.4;}
  @page{size:A4;margin:12mm 11mm;}
  /* h1 — это НАЗВАНИЕ документа (короткое), НЕ вывод. Вывод живёт в .verdict. */
  h1{font-size:21px;line-height:1.1;margin:0 0 4px;font-weight:800;letter-spacing:-.4px;}
  h2{font-size:15px;margin:0 0 5px;font-weight:800;letter-spacing:-.2px;}
  h3{font-size:11.5px;margin:8px 0 3px;font-weight:700;}
  .lead{color:var(--muted);margin:0 0 5px;font-size:10px;}
  .ok{color:var(--ok);} .check{color:var(--check);} .gap{color:var(--gap);}
  /* Секции текут естественно; принудительных разрывов нет (борьба с белыми пробелами) */
  .block{padding:8px 0 3px;border-top:1px solid var(--line);}
  .block:first-of-type{border-top:0;}
  .block h2{page-break-after:avoid;}
  table{page-break-inside:auto;} tr,thead{page-break-inside:avoid;}
  .page{page-break-before:always;}
  /* cover — плотная шапка: НАЗВАНИЕ → вывод одной строкой → метрики (без даты/бренда) */
  .cover{position:relative;padding:0;margin-bottom:10px;}
  .cov-bar{position:absolute;left:0;top:0;width:6px;height:100%;background:var(--lime);}
  .cov-body{padding:2px 4px 8px 16px;}
  .kicker,.page-kicker{color:var(--lime);font-weight:700;text-transform:uppercase;letter-spacing:.5px;font-size:9px;margin-bottom:8px;}
  /* .verdict — вывод аудита ОДНОЙ ФРАЗОЙ (подзаголовок, не гигантский h1) */
  .verdict{font-size:14px;line-height:1.35;font-weight:600;color:var(--ink);margin:0 0 10px;max-width:165mm;}
  .cov-meta{display:flex;gap:22px;margin:8px 0 10px;flex-wrap:wrap;}
  .cov-meta .lbl{display:block;color:var(--muted);font-size:8px;text-transform:uppercase;letter-spacing:.5px;}
  .cov-meta .val{display:block;font-size:13px;font-weight:700;}
  .cov-score{display:flex;align-items:baseline;gap:12px;margin:4px 0 10px;}
  .cov-score .big{font-size:42px;font-weight:800;line-height:1;letter-spacing:-1.5px;}
  .cov-score .big span{font-size:18px;}
  .big-cap{color:var(--muted);font-size:11px;}
  .coverage{background:var(--soft);border-left:3px solid var(--lime);padding:9px 12px;border-radius:0 5px 5px 0;font-size:9.5px;color:#333;max-width:165mm;}
  table{width:100%;border-collapse:collapse;}
  th{font-size:8px;text-transform:uppercase;color:var(--muted);text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);letter-spacing:.3px;}
  td{padding:4px 6px;border-bottom:1px solid var(--line);vertical-align:top;}
  .dim{display:inline-block;font-size:7px;font-weight:700;letter-spacing:.3px;color:#475467;background:#EEF1F4;border-radius:3px;padding:1px 3px;margin:1px 2px 1px 0;}
  .bar{display:block;width:100%;height:7px;background:var(--line);border-radius:5px;overflow:hidden;min-width:100px;}
  .fill{display:block;height:100%;border-radius:5px;} .fill.ok{background:var(--ok);} .fill.check{background:var(--check);} .fill.gap{background:var(--gap);}
  .footer{margin-top:12px;padding-top:6px;border-top:1px solid var(--line);color:var(--muted);font-size:8px;}
  /* Разделитель главы внутри сгруппированного документа */
  .chap{padding:12px 0 4px;border-top:2px solid var(--ink);margin-top:6px;}
  .chap-h{font-size:16px;font-weight:800;letter-spacing:-.2px;margin:0;}
  .chap-k{color:var(--lime);font-weight:700;text-transform:uppercase;letter-spacing:.5px;font-size:8.5px;margin-bottom:3px;}
  /* conclusion card */
  .concl{border:1px solid var(--line);border-left:4px solid var(--lime);border-radius:0 6px 6px 0;padding:9px 11px;margin:6px 0;page-break-inside:avoid;}
  .concl.crit{border-left-color:var(--gap);} .concl.warn{border-left-color:var(--check);}
  .concl h3{margin:0 0 5px;font-size:12.5px;}
  .concl-grid{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:9.5px;}
  .concl-grid .k{color:var(--muted);white-space:nowrap;} .concl-grid .v{color:#222;}
  /* status chips */
  .chip{display:inline-block;font-size:8px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid var(--line);background:var(--soft);margin:1px 3px 1px 0;}
  .chip.ok{color:var(--ok);} .chip.check{color:var(--check);} .chip.gap{color:var(--gap);}
  .chip.done{color:var(--ok);border-color:var(--ok);} .chip.partial{color:var(--check);border-color:var(--check);} .chip.blocked{color:var(--gap);border-color:var(--gap);}
  /* charts + footnotes */
  .chart-wrap{margin:6px 0 8px;padding:9px 11px;border:1px solid var(--line);border-radius:6px;background:var(--soft);page-break-inside:avoid;}
  .chart-wrap.row{display:flex;gap:16px;align-items:center;flex-wrap:wrap;}
  .chart-cap{color:var(--muted);font-size:8.5px;margin:5px 0 0;line-height:1.35;}
  sup.fn{color:var(--lime);font-weight:700;font-size:7px;}
  .fn-note{margin:6px 0 0;padding-top:5px;border-top:1px dotted var(--line);color:var(--muted);font-size:8px;line-height:1.35;}
  .fn-note sup{color:var(--lime);font-weight:700;}
`;

/* ── Консалтинговый каркас отчёта (единый для всей сюиты) ──
 * Каждый документ = завершённая услуга: контекст и методология → анализ →
 * сильные стороны и зоны риска → приоритизированные рекомендации → итоговый
 * вывод. Стандарты: принципы аудита ISO 19011 (доказательность, независимость),
 * MECE-структура разделов, пирамида Минто (вывод впереди, доказательства ниже). */

export const CONSULT_CSS = `
  .meth{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;margin:6px 0 2px;}
  .meth .mi{border-left:3px solid var(--line);padding:2px 0 2px 10px;}
  .meth .mi b{display:block;font-size:8.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin-bottom:2px;}
  .meth .mi div{font-size:10px;color:#222;}
  .meth ul{margin:0;padding-left:14px;} .meth li{margin:1px 0;}
  .sw{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0;}
  .sw .col{border:1px solid var(--line);border-radius:6px;padding:9px 11px;}
  .sw .col.plus{border-top:3px solid var(--ok);} .sw .col.minus{border-top:3px solid var(--gap);}
  .sw h3{margin:0 0 5px;font-size:11px;} .sw ul{margin:0;padding-left:14px;} .sw li{margin:3px 0;font-size:9.5px;color:#222;}
  .pr{display:inline-block;font-size:8px;font-weight:800;padding:1px 6px;border-radius:3px;color:#fff;white-space:nowrap;}
  .pr.P0{background:var(--gap);} .pr.P1{background:var(--check);} .pr.P2{background:#64748b;}
  .final{border:1px solid var(--line);border-left:4px solid var(--ink);border-radius:0 6px 6px 0;background:var(--soft);padding:12px 14px;margin:8px 0;}
  .final p{margin:0 0 8px;font-size:10.5px;color:#1a1f27;line-height:1.55;} .final p:last-child{margin:0;}
  .final .nx{border-top:1px solid var(--line);margin-top:8px;padding-top:8px;font-size:10px;color:#333;}
`;

/** «Контекст, цель и методология» — паспорт документа, читается за 20 секунд. */
export function methodologySection(o: { goal: string; sources: string[]; scope: string; limits: string; standards?: string[] }): string {
  const std = o.standards ?? ['Принципы аудита ISO 19011: вывод только из доказательства', 'MECE: разделы не пересекаются и покрывают предмет целиком', 'Пирамида Минто: управленческий вывод впереди, доказательства ниже', 'Честные данные: предположение не выдаётся за факт, заблокированное не скрывается'];
  return `<section class="block"><h2>Контекст, цель и методология</h2>
    <div class="meth">
      <div class="mi"><b>Цель документа</b><div>${esc(o.goal)}</div></div>
      <div class="mi"><b>Охват</b><div>${esc(o.scope)}</div></div>
      <div class="mi"><b>Источники данных</b><div><ul>${o.sources.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></div>
      <div class="mi"><b>Стандарты методологии</b><div><ul>${std.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></div>
      <div class="mi" style="grid-column:1/-1"><b>Границы применимости</b><div>${esc(o.limits)}</div></div>
    </div></section>`;
}

/** «Сильные стороны / Зоны риска» — оценка, а не список задач. */
export function swSection(strengths: string[], weaknesses: string[]): string {
  const li = (xs: string[], empty: string) => (xs.length ? xs.map((x) => `<li>${esc(x)}</li>`).join('') : `<li>${esc(empty)}</li>`);
  return `<section class="block"><h2>Сильные стороны и зоны риска</h2>
    <div class="sw">
      <div class="col plus"><h3 class="ok">Сильные стороны</h3><ul>${li(strengths, 'Явных сильных сторон на этом слое не зафиксировано — см. зоны риска.')}</ul></div>
      <div class="col minus"><h3 class="gap">Зоны риска</h3><ul>${li(weaknesses, 'Критичных зон риска на этом слое не выявлено.')}</ul></div>
    </div></section>`;
}

export type SectionRec = { pr: 'P0' | 'P1' | 'P2'; action: string; effect: string };

/** Приоритизированные рекомендации: P0 — сейчас, P1 — квартал, P2 — стратегия. */
export function recsSection(recs: SectionRec[], lead = 'Рекомендации следуют из зафиксированных разрывов; приоритет — по близости к деньгам и стоимости внедрения.'): string {
  if (!recs.length) return '';
  const order: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
  const rows = [...recs].sort((a, b) => order[a.pr] - order[b.pr]).map((r) => `<tr>
    <td style="width:34px"><span class="pr ${r.pr}">${r.pr}</span></td>
    <td class="rc-act">${esc(r.action)}</td>
    <td class="rc-eff">${esc(r.effect)}</td>
  </tr>`).join('');
  return `<section class="block"><h2>Рекомендации</h2><p class="lead">${esc(lead)}</p>
    <table><thead><tr><th>Приоритет</th><th>Действие</th><th>Ожидаемый эффект</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

/** «Итоговый вывод» — законченная мысль документа + связка со следующим шагом. */
export function conclusionSection(paragraphs: string[], next?: string, title = 'Итоговый вывод'): string {
  return `<section class="block"><h2>${esc(title)}</h2>
    <div class="final">${paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
    ${next ? `<div class="nx"><b>Следующий шаг:</b> ${esc(next)}</div>` : ''}</div></section>`;
}

/**
 * Обложка документа: НАЗВАНИЕ (короткое) → вывод одной фразой (.verdict) →
 * метрики → рамка охвата. Без бренда, даты, версии, «тира» и служебных меток —
 * это и есть требование «заголовок ≠ вывод» и «убрать внутренние обозначения».
 * kicker — короткое имя раздела (не «Commerce OS · …»); title — существительное
 * (напр. «Технічний фундамент»), verdict — та самая фраза-вывод.
 */
export type CoverMetric = { label: string; value: string };
export function cover(o: { kicker?: string; title: string; verdict?: string; metrics?: CoverMetric[]; score?: { pct: number; cap: string }; note?: string }): string {
  const meta = (o.metrics ?? []).map((m) => `<div><span class="lbl">${esc(m.label)}</span><span class="val">${esc(m.value)}</span></div>`).join('');
  const score = o.score ? `<div class="cov-score"><div class="big ${scoreColor(o.score.pct)}">${o.score.pct}<span>%</span></div><div class="big-cap">${esc(o.score.cap)}</div></div>` : '';
  return `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    ${o.kicker ? `<div class="kicker">${esc(o.kicker)}</div>` : ''}
    <h1>${esc(o.title)}</h1>
    ${o.verdict ? `<p class="verdict">${esc(o.verdict)}</p>` : ''}
    ${meta ? `<div class="cov-meta">${meta}</div>` : ''}
    ${score}
    ${o.note ? `<div class="coverage">${o.note}</div>` : ''}
  </div></section>`;
}

/** Подвал: только смысловая приписка (честность данных). Без бренда/даты/версии.
 *  Во внутреннем профиле можно дописать служебную метку. */
export function pageFooter(note?: string, internalNote?: string): string {
  const body = [note, isInternal() && internalNote ? internalNote : ''].filter(Boolean).join(' ');
  if (!body) return '';
  return `<section class="block"><div class="footer">${body}</div></section>`;
}

/** Разделитель главы внутри сгруппированного документа (несколько аудитов → один документ). */
export function chapter(title: string, kicker?: string): string {
  return `<section class="block chap">${kicker ? `<div class="chap-k">${esc(kicker)}</div>` : ''}<h2 class="chap-h">${esc(title)}</h2></section>`;
}

export function doc(title: string, bodyHtml: string, extraCss = ''): string {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${SHARED_CSS}${CONSULT_CSS}${extraCss}</style></head><body>${bodyHtml}</body></html>`;
}
