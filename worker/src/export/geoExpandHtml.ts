/**
 * «GEO / New Market Expansion Audit» (клієнтський PDF) — readiness framework.
 * Вимірюване з обходу: i18n-готовність сайту. Решта — research/intake, позначено.
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { GeoExpandReport, ReadyRow, CriterionRow } from '../geoexpand.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');

function spine(r: GeoExpandReport): string {
  const items = r.spine.map((L) => `<div class="gx-sp-row"><div class="gx-sp-id">${esc(L.id)}</div>
    <div class="gx-sp-b"><b>${esc(L.title.replace(/^GX\d+ · /, ''))}</b><p>${esc(L.principle)}</p></div></div>`).join('');
  return `<section class="block"><h2>New Market Expansion: 7 рівнів</h2>
    <p class="lead">У який ринок виходити, чому туди, чи є реальний попит, яку економіку отримаємо, які барʼєри й чи здатний бізнес масштабуватися без руйнування unit economics.</p>
    <div class="gx-sp">${items}</div></section>`;
}
function ready(r: GeoExpandReport): string {
  const rows = r.i18nReadiness.rows.map((x: ReadyRow) => `<tr><td class="gx-c">${yn(x.ok)}</td><td class="gx-b">${esc(x.area)}</td><td class="gx-mut">${esc(x.note)}</td></tr>`).join('');
  return `<section class="block"><h2>i18n Technical Readiness (єдине вимірюване з обходу)</h2>
    <p class="lead">Технічна готовність сайту обслуговувати нову гео. Ринкове рішення (попит/економіка/барʼєри) — research/intake нижче.</p>
    <div class="gx-head"><span class="gx-big ${s10(r.i18nReadiness.score)}">${r.i18nReadiness.score}</span><span class="gx-cap">/10 — i18n readiness (обхід)</span></div>
    <table><thead><tr><th></th><th>Область</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}
function criteria(r: GeoExpandReport): string {
  const groups = [...new Set(r.criteria.map((c) => c.group))];
  const body = groups.map((g) => {
    const rows = r.criteria.filter((c) => c.group === g).map((c: CriterionRow) => `<tr><td class="gx-b">${esc(c.criterion)}</td>
      <td class="gx-c"><span class="gx-badge ${c.source === 'обхід' ? 'ok' : 'na'}">${c.source === 'обхід' ? 'з обходу' : 'дослідж.'}</span></td>
      <td class="gx-mut">${esc(c.note)}</td></tr>`).join('');
    return `<tr class="gx-grp"><td colspan="3">${esc(g)}</td></tr>${rows}`;
  }).join('');
  const bar = r.barriers.map((b) => `<div class="gx-bar"><b>${esc(b.barrier)}</b><span>${esc(b.note)}</span></div>`).join('');
  return `<section class="block"><h2>Decision Criteria + Barriers</h2>
    <p class="lead">Критерії рішення про вихід (майже всі — research/дані) і карта барʼєрів.</p>
    <table class="gx-crit"><thead><tr><th>Критерій</th><th>Джерело</th><th>Коментар</th></tr></thead><tbody>${body}</tbody></table>
    <h3 class="gx-h3">Barrier / Risk Map</h3><div class="gx-bars">${bar}</div></section>`;
}
function plan(r: GeoExpandReport): string {
  const em = r.entryModes.map((e) => `<div class="gx-em"><b>${esc(e.mode)}</b><span>${esc(e.note)}</span></div>`).join('');
  const rm = r.roadmap.map((s, i) => `<div class="gx-rm"><div class="gx-rm-n">${i + 1}</div><div class="gx-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<span class="gx-art">${esc(a)}</span>`).join('');
  return `<section class="block"><h2>Entry Mode · Roadmap · Артефакти</h2>
    <h3 class="gx-h3">Entry Modes</h3><div class="gx-ems">${em}</div>
    <h3 class="gx-h3">Expansion Roadmap</h3><div class="gx-rms">${rm}</div>
    <h3 class="gx-h3">Артефакти (10) — фінал: Go/No-Go</h3><div class="gx-arts">${arts}</div></section>`;
}

const GX_CSS = `
  .gx-sp{display:flex;flex-direction:column;} .gx-sp-row{display:flex;gap:9px;padding:6px 0;border-bottom:1px solid var(--line);} .gx-sp-row:last-child{border-bottom:0;}
  .gx-sp-id{flex:0 0 36px;font-weight:800;color:var(--lime);font-size:11px;} .gx-sp-b b{font-size:10.5px;} .gx-sp-b p{margin:2px 0 0;color:#444;font-size:9px;line-height:1.35;}
  .gx-b{font-weight:700;} .gx-mut{color:var(--muted);font-size:9px;} .gx-c{text-align:center;} .gx-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .gx-head{display:flex;align-items:center;gap:10px;margin:4px 0;padding:8px 12px;background:var(--soft);border-radius:6px;} .gx-big{font-size:28px;font-weight:800;} .gx-big.ok{color:var(--ok);} .gx-big.check{color:var(--check);} .gx-big.gap{color:var(--gap);} .gx-cap{font-size:10px;color:#333;}
  .gx-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .gx-badge.ok{background:#e7f6ec;color:var(--ok);} .gx-badge.na{background:#fdf1e7;color:#b45309;}
  .gx-crit td{font-size:9px;} .gx-grp td{background:var(--soft);font-weight:800;font-size:8.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--lime);padding:4px 6px;}
  .gx-bars,.gx-ems{display:flex;flex-wrap:wrap;gap:6px;} .gx-bar,.gx-em{flex:1;min-width:150px;border:1px solid var(--line);border-left:3px solid var(--gap);border-radius:0 6px 6px 0;padding:6px 9px;} .gx-em{border-left-color:var(--lime);}
  .gx-bar b,.gx-em b{font-size:9.5px;display:block;} .gx-bar span,.gx-em span{font-size:8.5px;color:#555;}
  .gx-rms{display:flex;flex-direction:column;gap:5px;} .gx-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:6px 10px;} .gx-rm-n{flex:0 0 20px;height:20px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:10px;display:flex;align-items:center;justify-content:center;}
  .gx-rm-b b{font-size:10px;} .gx-rm-b ul{margin:2px 0 0;padding-left:16px;} .gx-rm-b li{font-size:9px;color:#333;line-height:1.4;}
  .gx-arts{display:flex;flex-wrap:wrap;gap:4px;} .gx-art{font-size:8px;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:2px 8px;}
  .gx-ctx{border:1px solid #fdd9a8;background:#fff7ed;border-left:4px solid #d97706;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#7c4a03;}
`;

export function renderGeoExpandHtml(r: GeoExpandReport): string {
  const coverHtml = cover({
    kicker: 'New Market Expansion', title: 'GEO / New Market Expansion Audit',
    verdict: `i18n readiness (обхід) — ${r.i18nReadiness.score}/10. Ринкове рішення — research/дані.`,
    metrics: [{ label: 'Клієнт', value: r.client }, { label: 'i18n readiness', value: `${r.i18nReadiness.score}/10` }, { label: 'Критеріїв рішення', value: String(r.criteria.length) }],
    note: `<b>Рішення про вихід — на даних.</b> Куди й чи виходити залежить від ринкового попиту, конкурентів, юніт-економіки в новій гео, логістики, права й платежів (research/intake). Із зовнішнього обходу вимірюється лише технічна i18n-готовність сайту.`,
  });
  const ctx = `<section class="block"><div class="gx-ctx"><b>Чесна модель.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('New Market Expansion Audit: технічна i18n-готовність — з обходу; попит, конкуренти, юніт-економіка нової гео, логістика, право, платежі — research/intake (дані/документи/інтерв’ю). Фінал — обґрунтоване Go/No-Go. Цифри не вигадуються.');
  return doc(`New Market Expansion · ${r.client}`, coverHtml + ctx + spine(r) + ready(r) + criteria(r) + plan(r) + foot, GX_CSS);
}
