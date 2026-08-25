/**
 * «Analytics Audit» (клієнтський PDF): система вимірювання від KPI до purchase.
 * Чесно: ~95% потребує доступу до GA4/GTM/CRM. Обхід дає baseline інструментування
 * + нижню оцінку Maturity + структурований план аудиту й інтейк (без вигаданих цифр).
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { AnalyticsFlowReport, StackRow, AreaRow, KpiRow } from '../analyticsflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');

function spine(r: AnalyticsFlowReport): string {
  const items = r.spine.map((L) => `<div class="an-sp-row"><div class="an-sp-id">${esc(L.id)}</div>
    <div class="an-sp-b"><b>${esc(L.title.replace(/^AN\d+ · /, ''))}</b>
      <p class="an-sp-pr">${esc(L.principle)}</p><p class="an-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>Analytics Audit: 8 рівнів</h2>
    <p class="lead">Ланцюг: Business → KPI → Measurement Plan → Data Layer → Tracking → Analytics → Attribution → Reporting → Decisions. Питання: чи можна за даними точно зрозуміти, звідки прийшов користувач, що робив, де загубився, чому купив і скільки приніс.</p>
    <div class="an-sp">${items}</div></section>`;
}

function baseline(r: AnalyticsFlowReport): string {
  const stack = r.stack.map((s: StackRow) => `<tr><td class="an-c">${yn(s.present)}</td><td class="an-b">${esc(s.tool)}</td><td class="an-mut">${esc(s.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Instrumentation Baseline + Maturity floor</h2>
    <p class="lead">Єдине, що видно ззовні: які теги стоять, consent, HTTPS. Це НЕ повний Analytics Health Score — він рахується після доступу до GA4/GTM/CRM.</p>
    <div class="an-head">
      <div class="an-h-box"><span class="an-h-v ${s10(r.baseline.instrumentation)}">${r.baseline.instrumentation}</span><span class="an-h-l">/10 — Baseline інструментування</span></div>
      <div class="an-h-box"><span class="an-h-v ${r.maturity.floor >= 1 ? 'check' : 'gap'}">L${r.maturity.floor}</span><span class="an-h-l">Maturity floor (нижня оцінка)<br><i>${esc(r.maturity.note)}</i></span></div>
    </div>
    <table><thead><tr><th></th><th>Інструмент</th><th>Коментар</th></tr></thead><tbody>${stack}</tbody></table>
    <p class="fn-note"><sup>*</sup> Maturity рівні: L1 Basic (є GA4) · L2 Tracking (події) · L3 Ecommerce · L4 Integrated (GA4+CRM+ERP+Ads+BI) · L5 Decision Intelligence. L2–L5 підтверджуються лише з доступом.</p></section>`;
}

function areas(r: AnalyticsFlowReport): string {
  const groups = [...new Set(r.areas.map((a) => a.group))];
  const blocks = groups.map((g) => {
    const rows = r.areas.filter((a) => a.group === g).map((a: AreaRow) => `<tr>
      <td class="an-b">${esc(a.area)}</td>
      <td class="an-c"><span class="an-badge ${a.status === 'обхід' ? 'ok' : 'na'}">${a.status === 'обхід' ? 'з обходу' : 'потрібен доступ'}</span></td>
      <td class="an-mut">${esc(a.note)}</td></tr>`).join('');
    return `<tr class="an-grp"><td colspan="3">${esc(g)}</td></tr>${rows}`;
  }).join('');
  const ext = r.areas.filter((a) => a.status === 'обхід').length;
  return `<section class="block"><h2>Audit Framework — області × статус</h2>
    <p class="lead">Повний перелік областей аудиту вимірювання. ${ext} підтверджено з обходу (baseline), решта — «потрібен доступ» (GA4/GTM/CRM/BI). Це чесний план робіт, а не готові висновки за закритими даними.</p>
    <table class="an-areas"><thead><tr><th>Область</th><th>Статус</th><th>Що перевіряємо</th></tr></thead><tbody>${blocks}</tbody></table></section>`;
}

function kpi(r: AnalyticsFlowReport): string {
  const rows = r.kpiFramework.map((k: KpiRow) => `<tr><td class="an-b">${esc(k.goal)}</td><td>${esc(k.kpi)}</td>
    <td class="an-mono">${esc(k.event)}</td><td class="an-c"><span class="an-badge ${k.tracked === 'baseline' ? 'ok' : 'na'}">${k.tracked === 'baseline' ? 'baseline' : 'потрібен доступ'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Business → KPI → Event (Measurement Plan шаблон)</h2>
    <p class="lead">Кожна бізнес-ціль має мати вимірюваний KPI і подію. Не обирати метрику лише тому, що її зручно дивитись у GA4. Фактична передача подій перевіряється з доступом.</p>
    <table><thead><tr><th>Бізнес-ціль</th><th>KPI</th><th>Подія</th><th>Стан</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function roadmap(r: AnalyticsFlowReport): string {
  const rm = r.roadmap.map((s, i) => `<div class="an-rm"><div class="an-rm-n">${i + 1}</div><div class="an-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="an-c an-mut">${a.n}</td><td class="an-b">${esc(a.name)}</td><td class="an-c"><span class="an-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'потрібен доступ'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Analytics Roadmap + артефакти</h2>
    <p class="lead">План: Foundation → Ecommerce → Attribution → Integration → Intelligence. І перелік артефактів (майже всі — після доступу).</p>
    <div class="an-rms">${rm}</div>
    <h3 class="an-h3">Фінальні артефакти</h3>
    <table class="an-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const AN_CSS = `
  .an-sp{display:flex;flex-direction:column;}
  .an-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .an-sp-row:last-child{border-bottom:0;}
  .an-sp-id{flex:0 0 36px;font-weight:800;color:var(--lime);font-size:11px;}
  .an-sp-b b{font-size:10.5px;} .an-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .an-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .an-head{display:flex;gap:10px;margin:4px 0 8px;}
  .an-h-box{flex:1;display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .an-h-v{font-size:28px;font-weight:800;line-height:1;} .an-h-v.ok{color:var(--ok);} .an-h-v.check{color:var(--check);} .an-h-v.gap{color:var(--gap);}
  .an-h-l{font-size:9.5px;color:#333;} .an-h-l i{color:var(--muted);font-size:8px;font-style:normal;}
  .an-b{font-weight:700;} .an-mut{color:var(--muted);font-size:9px;} .an-c{text-align:center;} .an-mono{font-family:monospace;font-size:8.5px;color:#334;} .an-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .an-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .an-badge.ok{background:#e7f6ec;color:var(--ok);} .an-badge.na{background:#fdf1e7;color:#b45309;}
  .an-areas td{font-size:9px;} .an-grp td{background:var(--soft);font-weight:800;font-size:8.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--lime);padding:4px 6px;}
  .an-rms{display:flex;flex-direction:column;gap:6px;}
  .an-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .an-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .an-rm-b b{font-size:10px;} .an-rm-b ul{margin:3px 0 0;padding-left:16px;} .an-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .an-ctx{border:1px solid #fdd9a8;background:#fff7ed;border-left:4px solid #d97706;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#7c4a03;}
`;

export function renderAnalyticsFlowHtml(r: AnalyticsFlowReport): string {
  const coverHtml = cover({
    kicker: 'Analytics Audit',
    title: 'Analytics Audit: система вимірювання від KPI до purchase',
    verdict: `Baseline інструментування — ${r.baseline.instrumentation}/10; Maturity floor — L${r.maturity.floor} (повний скор — після доступу).`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Baseline', value: `${r.baseline.instrumentation}/10` },
      { label: 'Maturity floor', value: `L${r.maturity.floor}` },
    ],
    note: `<b>Потребує доступу.</b> Analytics Audit на ~95% залежить від доступу до GA4/GTM/CRM/BI. Зовнішній обхід підтверджує лише baseline (які теги стоять, consent, HTTPS) і нижню оцінку Maturity. Усе інше (dataLayer, події, ecommerce-точність, атрибуція, звіти) — з доступом, позначено «потрібен доступ». Це baseline-детекція + структурований план аудиту, без вигаданих цифр.`,
  });
  const ctx = `<section class="block"><div class="an-ctx"><b>Чесна модель.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній baseline: наявність тегів (GA4/GTM/Pixel/heatmaps), consent-механіка, HTTPS. Data Layer, GTM/GA4-конфіг, події, ecommerce-точність, атрибуція, звіти, інтеграції — вимірюються лише з доступом до GA4/GTM/CRM/BI. Цифри не вигадуються; «потрібен доступ» не видається за факт.');
  return doc(`Analytics Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + baseline(r) + areas(r) + kpi(r) + roadmap(r) + foot,
    AN_CSS);
}
