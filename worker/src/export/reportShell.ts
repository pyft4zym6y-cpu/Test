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

export const SHARED_CSS = `
  :root{--ink:#12161C;--muted:#5A6472;--line:#E4E7EC;--lime:#65A30D;--ok:#16a34a;--check:#d97706;--gap:#dc2626;--bg:#fff;--soft:#F7F8FA;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;color:var(--ink);background:var(--bg);font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.45;}
  @page{size:A4;margin:14mm 12mm;}
  h1{font-size:30px;line-height:1.15;margin:0 0 18px;font-weight:800;letter-spacing:-.5px;}
  h2{font-size:17px;margin:0 0 6px;font-weight:800;letter-spacing:-.2px;}
  h3{font-size:12px;margin:10px 0 4px;font-weight:700;}
  .lead{color:var(--muted);margin:0 0 6px;font-size:10.5px;}
  .ok{color:var(--ok);} .check{color:var(--check);} .gap{color:var(--gap);}
  /* Секции текут естественно (без orphan-пустот от avoid); неразрывны только мелкие блоки */
  .block{padding:10px 0 4px;border-top:1px solid var(--line);}
  .block h2{page-break-after:avoid;}
  table{page-break-inside:auto;} tr,thead{page-break-inside:avoid;}
  .page{page-break-before:always;}
  /* cover — компактная шапка: без пустой титульной страницы (прод-жалоба на «белые пробелы») */
  .cover{position:relative;padding:0;margin-bottom:14px;}
  .cov-bar{position:absolute;left:0;top:0;width:8px;height:100%;background:var(--lime);}
  .cov-body{padding:12px 6px 10px 20px;}
  .kicker,.page-kicker{color:var(--lime);font-weight:700;text-transform:uppercase;letter-spacing:.6px;font-size:10px;margin-bottom:14px;}
  .cov-meta{display:flex;gap:34px;margin:14px 0 16px;}
  .cov-meta .lbl{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.5px;}
  .cov-meta .val{display:block;font-size:15px;font-weight:700;}
  .cov-score{display:flex;align-items:baseline;gap:16px;margin:6px 0 14px;}
  .cov-score .big{font-size:52px;font-weight:800;line-height:1;letter-spacing:-2px;}
  .cov-score .big span{font-size:22px;}
  .big-cap{color:var(--muted);font-size:12px;}
  .coverage{background:var(--soft);border-left:3px solid var(--lime);padding:12px 14px;border-radius:0 6px 6px 0;font-size:10px;color:#333;max-width:150mm;}
  table{width:100%;border-collapse:collapse;}
  th{font-size:8.5px;text-transform:uppercase;color:var(--muted);text-align:left;padding:5px 6px;border-bottom:1px solid var(--line);letter-spacing:.3px;}
  td{padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top;}
  .dim{display:inline-block;font-size:7px;font-weight:700;letter-spacing:.3px;color:#475467;background:#EEF1F4;border-radius:3px;padding:1px 3px;margin:1px 2px 1px 0;}
  .bar{display:block;width:100%;height:8px;background:var(--line);border-radius:5px;overflow:hidden;min-width:110px;}
  .fill{display:block;height:100%;border-radius:5px;} .fill.ok{background:var(--ok);} .fill.check{background:var(--check);} .fill.gap{background:var(--gap);}
  .footer{margin-top:16px;padding-top:8px;border-top:1px solid var(--line);color:var(--muted);font-size:8.5px;}
  /* conclusion card */
  .concl{border:1px solid var(--line);border-left:4px solid var(--lime);border-radius:0 6px 6px 0;padding:10px 12px;margin:8px 0;page-break-inside:avoid;}
  .concl.crit{border-left-color:var(--gap);} .concl.warn{border-left-color:var(--check);}
  .concl h3{margin:0 0 6px;font-size:13px;}
  .concl-grid{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:10px;}
  .concl-grid .k{color:var(--muted);white-space:nowrap;} .concl-grid .v{color:#222;}
  /* status chips */
  .chip{display:inline-block;font-size:8.5px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid var(--line);background:var(--soft);margin:1px 3px 1px 0;}
  .chip.ok{color:var(--ok);} .chip.check{color:var(--check);} .chip.gap{color:var(--gap);}
  .chip.done{color:var(--ok);border-color:var(--ok);} .chip.partial{color:var(--check);border-color:var(--check);} .chip.blocked{color:var(--gap);border-color:var(--gap);}
  /* charts + footnotes */
  .chart-wrap{margin:8px 0 10px;padding:10px 12px;border:1px solid var(--line);border-radius:6px;background:var(--soft);page-break-inside:avoid;}
  .chart-wrap.row{display:flex;gap:18px;align-items:center;flex-wrap:wrap;}
  .chart-cap{color:var(--muted);font-size:9px;margin:6px 0 0;line-height:1.4;}
  sup.fn{color:var(--lime);font-weight:700;font-size:7px;}
  .fn-note{margin:8px 0 0;padding-top:6px;border-top:1px dotted var(--line);color:var(--muted);font-size:8.5px;line-height:1.4;}
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

export function doc(title: string, bodyHtml: string, extraCss = ''): string {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${SHARED_CSS}${CONSULT_CSS}${extraCss}</style></head><body>${bodyHtml}</body></html>`;
}
