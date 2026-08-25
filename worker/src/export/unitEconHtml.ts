/**
 * «Unit Economics Audit» (клієнтський PDF) — framework + калькулятор-шаблон.
 * Числа з даних (GA4/CRM/ERP), не вигадуються. Честний банер про це.
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { UnitEconReport, DecompRow, SensitivityRow, ScenarioRow } from '../unitecon.js';

const GRP: Record<string, string> = { Revenue: '#2563eb', Cost: '#dc2626', Margin: '#16a34a', Acquisition: '#7c3aed', Value: '#0891b2', Risk: '#ea580c' };

function spine(r: UnitEconReport): string {
  const items = r.spine.map((L) => `<div class="ue-sp-row"><div class="ue-sp-id">${esc(L.id)}</div>
    <div class="ue-sp-b"><b>${esc(L.title.replace(/^UE\d+ · /, ''))}</b><p>${esc(L.principle)}</p></div></div>`).join('');
  return `<section class="block"><h2>Unit Economics Audit: 7 рівнів</h2>
    <p class="lead">Скільки бізнес заробляє на кожній одиниці, скільки коштує її залучення й обслуговування, коли вона окупається і наскільки результат стійкий до зміни параметрів.</p>
    <div class="ue-sp">${items}</div></section>`;
}
function units(r: UnitEconReport): string {
  const rows = r.units.map((u) => `<tr><td class="ue-b">${esc(u.unit)}</td><td>${esc(u.def)}</td><td class="ue-mut">${esc(u.useWhen)}</td></tr>`).join('');
  return `<section class="block"><h2>Unit Definition</h2><p class="lead">Що саме одиниця — різні одиниці дають різні рішення.</p>
    <table><thead><tr><th>Одиниця</th><th>Визначення</th><th>Коли застосовувати</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}
function decomp(r: UnitEconReport): string {
  const rows = r.decomposition.map((d: DecompRow) => `<tr><td class="ue-c"><span class="ue-dot" style="background:${GRP[d.group] ?? '#888'}"></span>${esc(d.group)}</td>
    <td class="ue-b">${esc(d.metric)}</td><td class="ue-mono">${esc(d.formula)}</td><td class="ue-mut">${esc(d.note)}</td></tr>`).join('');
  const lc = r.ltvcac.map((l) => `<tr><td class="ue-b">${esc(l.metric)}</td><td class="ue-mono">${esc(l.formula)}</td><td class="ue-mut">${esc(l.healthy)}</td></tr>`).join('');
  return `<section class="block"><h2>Декомпозиція: Revenue → Contribution → Profit</h2>
    <p class="lead">Повний ланцюг економіки одиниці з формулами. Значення підставляються з даних.</p>
    <table class="ue-dec"><thead><tr><th>Група</th><th>Метрика</th><th>Формула</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table>
    <h3 class="ue-h3">LTV : CAC — ключові співвідношення</h3>
    <table><thead><tr><th>Метрика</th><th>Формула</th><th>Здорове значення</th></tr></thead><tbody>${lc}</tbody></table></section>`;
}
function sens(r: UnitEconReport): string {
  const s = r.sensitivity.map((x: SensitivityRow) => `<tr><td class="ue-b">${esc(x.change)}</td><td>${esc(x.effect)}</td><td class="ue-mut">${esc(x.watch)}</td></tr>`).join('');
  const sc = r.scenarios.map((x: ScenarioRow) => `<div class="ue-scen"><b>${esc(x.scenario)}</b><span>${esc(x.assumptions)}</span><i>${esc(x.signal)}</i></div>`).join('');
  return `<section class="block"><h2>Sensitivity & Scenarios</h2>
    <p class="lead">Наскільки економіка стійка до зміни ключових параметрів і яка картина в Base/Best/Worst.</p>
    <table><thead><tr><th>Зміна</th><th>Ефект</th><th>За чим стежити</th></tr></thead><tbody>${s}</tbody></table>
    <div class="ue-scens">${sc}</div></section>`;
}
function plan(r: UnitEconReport): string {
  const mat = r.maturity.levels.map((l) => `<li>${esc(l)}</li>`).join('');
  const rm = r.roadmap.map((s, i) => `<div class="ue-rm"><div class="ue-rm-n">${i + 1}</div><div class="ue-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<span class="ue-art">${esc(a)}</span>`).join('');
  return `<section class="block"><h2>Maturity · Roadmap · Артефакти</h2>
    <div class="ue-mat"><b>Unit Economics Maturity:</b><ul>${mat}</ul><p class="ue-mut">${esc(r.maturity.note)}</p></div>
    <h3 class="ue-h3">Roadmap</h3><div class="ue-rms">${rm}</div>
    <h3 class="ue-h3">Артефакти (18)</h3><div class="ue-arts">${arts}</div></section>`;
}

const UE_CSS = `
  .ue-sp{display:flex;flex-direction:column;} .ue-sp-row{display:flex;gap:9px;padding:6px 0;border-bottom:1px solid var(--line);} .ue-sp-row:last-child{border-bottom:0;}
  .ue-sp-id{flex:0 0 36px;font-weight:800;color:var(--lime);font-size:11px;} .ue-sp-b b{font-size:10.5px;} .ue-sp-b p{margin:2px 0 0;color:#444;font-size:9px;line-height:1.35;}
  .ue-b{font-weight:700;} .ue-mut{color:var(--muted);font-size:9px;} .ue-c{white-space:nowrap;font-size:8.5px;} .ue-mono{font-family:monospace;font-size:8.5px;color:#334;} .ue-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .ue-dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle;}
  .ue-dec td{font-size:9px;}
  .ue-scens{display:flex;gap:6px;margin-top:6px;} .ue-scen{flex:1;border:1px solid var(--line);border-radius:6px;padding:7px 9px;} .ue-scen b{font-size:10px;display:block;} .ue-scen span{font-size:8.5px;color:#333;display:block;margin:2px 0;} .ue-scen i{font-size:8px;color:var(--muted);font-style:normal;}
  .ue-mat ul{margin:3px 0;padding-left:16px;} .ue-mat li{font-size:9px;margin:1px 0;}
  .ue-rms{display:flex;flex-direction:column;gap:5px;} .ue-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:6px 10px;} .ue-rm-n{flex:0 0 20px;height:20px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:10px;display:flex;align-items:center;justify-content:center;}
  .ue-rm-b b{font-size:10px;} .ue-rm-b ul{margin:2px 0 0;padding-left:16px;} .ue-rm-b li{font-size:9px;color:#333;line-height:1.4;}
  .ue-arts{display:flex;flex-wrap:wrap;gap:4px;} .ue-art{font-size:8px;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:2px 8px;}
  .ue-ctx{border:1px solid #fdd9a8;background:#fff7ed;border-left:4px solid #d97706;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#7c4a03;}
`;

export function renderUnitEconHtml(r: UnitEconReport): string {
  const coverHtml = cover({
    kicker: 'Unit Economics Audit', title: 'Unit Economics Audit: економіка однієї одиниці',
    verdict: 'Framework + калькулятор-шаблон. Числа підставляються з даних (GA4/CRM/ERP), не вигадуються.',
    metrics: [{ label: 'Клієнт', value: r.client }, { label: 'Одиниць', value: String(r.units.length) }, { label: 'Метрик у моделі', value: String(r.decomposition.length) }],
    note: `<b>100% залежить від даних.</b> Юніт-економіка не вимірюється із зовнішнього обходу — потрібні revenue, COGS, CAC, LTV, повернення, канали. Це повна модель декомпозиції + LTV:CAC + тест чутливості + сценарії, куди підставляються реальні числа з даних.`,
  });
  const ctx = `<section class="block"><div class="ue-ctx"><b>Чесна модель.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Unit Economics Audit — framework + калькулятор. Значення (revenue/COGS/CAC/LTV/повернення/канали) підставляються з бізнес-даних (GA4/CRM/ERP/фінзвіти). Цифри не вигадуються.');
  return doc(`Unit Economics Audit · ${r.client}`, coverHtml + ctx + spine(r) + units(r) + decomp(r) + sens(r) + plan(r) + foot, UE_CSS);
}
