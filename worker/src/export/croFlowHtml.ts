/**
 * «CRO Audit» (клієнтський PDF): системне перетворення відвідувача на дію.
 * CRO Health/Score + воронка (готовність; drop-off — н/д) + Friction/Trust/
 * Objection/CTA maps + block-cards + Hypothesis Backlog (ICE) + roadmap. 32 артефакти.
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { CroFlowReport, CroBlockCard, HealthZone, ScoreZone, FunnelStage, Hypothesis } from '../croflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');

function spine(r: CroFlowReport): string {
  const items = r.spine.map((L) => `<div class="cr-sp-row"><div class="cr-sp-id">${esc(L.id)}</div>
    <div class="cr-sp-b"><b>${esc(L.title.replace(/^CRO\d+ · /, ''))}</b>
      <p class="cr-sp-pr">${esc(L.principle)}</p><p class="cr-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>CRO Audit: 8 рівнів</h2>
    <p class="lead">Інтерфейс може бути зручним, але погано продавати. CRO зв'язує Traffic → Intent → Experience → Trust → Decision → Action → Conversion → Revenue. Головне питання: що заважає дії й що з найбільшою ймовірністю підніме конверсію.</p>
    <div class="cr-sp">${items}</div></section>`;
}

function health(r: CroFlowReport): string {
  const cards = r.health.zones.map((z: HealthZone) => `<div class="cr-hz"><div class="cr-hz-v ${s10(z.score)}">${z.score}<i>/10</i></div>
    <div class="cr-hz-l">${esc(z.label)}</div><div class="cr-hz-n">${esc(z.note)}</div></div>`).join('');
  return `<section class="block"><h2>CRO Health Score</h2>
    <p class="lead">Пʼять ключових показників готовності конвертувати.</p>
    ${r.health.overall === null
      ? `<div class="cr-hhead"><span class="cr-hcap"><b>Бал не вимірювався.</b> Обхід не дав жодної сторінки — пʼять показників готовності рахувати нема з чого.</span></div>`
      : `<div class="cr-hhead"><span class="cr-hbig ${s10(r.health.overall)}">${r.health.overall}</span><span class="cr-hcap">/10 — CRO Health Score</span></div>`}
    <div class="cr-hzs">${cards}</div></section>`;
}

function scoreT(r: CroFlowReport): string {
  const rows = r.score.zones.map((z: ScoreZone) => {
    const pct = Math.round((z.score / 10) * 100);
    return `<tr><td class="cr-s-l">${esc(z.label)}</td>
      <td class="cr-s-bar"><span class="bar">${z.measured ? `<span class="fill ${s10(z.score)}" style="width:${pct}%"></span>` : ''}</span></td>
      <td class="cr-s-v">${z.measured ? `<b class="${s10(z.score)}">${z.score}</b><i>/10</i>` : '<span class="cr-na">н/д</span>'}</td></tr>`;
  }).join('');
  return `<section class="block"><h2>CRO Score — 20 напрямів</h2>
    <p class="lead">Деталізація. Behavioral Analytics, Personalization, A/B Experimentation — «н/д»: потрібні дані GA4/GTM/CRM/heatmaps, не вигадуємо.</p>
    <table class="cr-s"><tbody>${rows}</tbody></table></section>`;
}

function funnel(r: CroFlowReport): string {
  const rows = r.funnel.map((f: FunnelStage) => `<div class="cr-fn"><div class="cr-fn-l">${esc(f.stage)}</div>
    <div class="cr-fn-bar"><span class="cr-fn-fill ${s10(f.readiness)}" style="width:${f.readiness * 10}%"></span></div>
    <div class="cr-fn-v ${s10(f.readiness)}">${f.readiness}</div><div class="cr-fn-lk">drop-off: ${esc(f.leakage)}</div>
    <div class="cr-fn-n">${esc(f.note)}</div></div>`).join('');
  return `<section class="block"><h2>Conversion Funnel — готовність за етапами</h2>
    <p class="lead">Готовність кожного етапу конвертувати (наявність блоків). Фактичний drop-off — з даних GA4 (позначено «н/д»).</p>
    <div class="cr-fns">${rows}</div></section>`;
}

function maps(r: CroFlowReport): string {
  const fr = r.friction.map((f) => `<tr><td class="cr-pri">${f.present ? `<span class="chip ${PRI[f.severity]}">${esc(f.severity)}</span>` : '<span class="chip ok">ok</span>'}</td>
    <td class="cr-b">${esc(f.point)}</td><td class="cr-c">${f.present ? '<span class="gap">є тертя</span>' : '<span class="ok">чисто</span>'}</td><td class="cr-mut">${esc(f.note)}</td></tr>`).join('');
  const mapTable = (title: string, rows: { item: string; ok: boolean; note: string }[]) => `<div class="cr-mapcol"><div class="cr-map-h">${esc(title)}</div>${rows.map((m) => `<div class="cr-map-r">${yn(m.ok)} <span>${esc(m.item)}</span><i>${esc(m.note)}</i></div>`).join('')}</div>`;
  return `<section class="block"><h2>Friction · Trust · Objection · CTA · AOV</h2>
    <p class="lead">Головне питання CRO — що заважає дії. Friction Map + карти довіри, заперечень, CTA й механік AOV.</p>
    <table class="cr-fr"><thead><tr><th>Sev</th><th>Точка тертя</th><th>Стан</th><th>Коментар</th></tr></thead><tbody>${fr}</tbody></table>
    <div class="cr-maps">${mapTable('Trust Map', r.trustMap)}${mapTable('Objection Map', r.objectionMap)}${mapTable('CTA Map', r.ctaMap)}${mapTable('AOV-механіки', r.aovMechanics)}</div></section>`;
}

function blockCards(r: CroFlowReport): string {
  if (!r.blockCards.length) return '';
  const cards = r.blockCards.map((c: CroBlockCard) => `<div class="cr-bc">
    <div class="cr-bc-h"><span class="cr-pg">${esc(c.page)}</span><b>${esc(c.name)}</b><span class="cr-role">${esc(c.role)}</span><span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="cr-bc-body">
      <div class="cr-row"><span class="cr-k">Current</span>${esc(c.current)}</div>
      <div class="cr-row"><span class="cr-k">Problem</span><span class="cr-prob">${esc(c.problem)}</span></div>
      <div class="cr-row"><span class="cr-k">Golden Standard</span><span class="cr-gold">${esc(c.golden)}</span></div>
      <div class="cr-row"><span class="cr-k">Рекомендація</span>${esc(c.recommendation)}</div>
    </div>
    <div class="cr-bc-eff"><b>Ефект:</b> ${esc(c.effect)}</div></div>`).join('');
  return `<section class="block"><h2>Block CRO — поблоковий розбір</h2>
    <p class="lead">Кожен конверсійний блок: роль → Current → Problem → Golden Standard → Recommendation → Impact.</p>${cards}</section>`;
}

function hypotheses(r: CroFlowReport): string {
  if (!r.hypotheses.length) return '';
  const rows = r.hypotheses.map((h: Hypothesis) => `<tr>
    <td class="cr-pri"><span class="chip ${PRI[h.priority]}">${esc(h.priority)}</span></td>
    <td class="cr-hyp">${esc(h.text)}</td>
    <td class="cr-c">${h.impact}</td><td class="cr-c">${h.confidence}</td><td class="cr-c">${h.ease}</td>
    <td class="cr-c"><b class="${s10(h.ice)}">${h.ice}</b></td></tr>`).join('');
  const opps = r.opportunities.map((o) => `<div class="cr-opp"><b>${esc(o.type)}</b><span>${esc(o.note)}</span></div>`).join('');
  return `<section class="block"><h2>Hypothesis Backlog (ICE) + Opportunity Map</h2>
    <p class="lead">Гіпотези у форматі «Якщо змінимо X, то Y зросте, бо Z», пріоритет за ICE (Impact × Confidence × Ease). Experimentation Maturity: <b>Level ${r.experimentation.level}</b> — ${esc(r.experimentation.note)}</p>
    <table class="cr-hyp-t"><thead><tr><th>Пріор.</th><th>Гіпотеза «Якщо X → Y, бо Z»</th><th>I</th><th>C</th><th>E</th><th>ICE</th></tr></thead><tbody>${rows}</tbody></table>
    <h3 class="cr-h3">CRO Opportunity Map</h3><div class="cr-opps">${opps}</div></section>`;
}

function roadmap(r: CroFlowReport): string {
  const rm = r.roadmap.map((s, i) => `<div class="cr-rm"><div class="cr-rm-n">${i + 1}</div><div class="cr-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="cr-c cr-mut">${a.n}</td><td class="cr-b">${esc(a.name)}</td><td class="cr-c"><span class="cr-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'дані GA/CRM'}</span></td></tr>`).join('');
  return `<section class="block"><h2>CRO Roadmap + 32 артефакти</h2>
    <p class="lead">План: Critical Friction → Core Conversion → Revenue Optimization → Personalization → Experimentation. І перелік артефактів.</p>
    <div class="cr-rms">${rm}</div>
    <h3 class="cr-h3">Фінальні артефакти (32)</h3>
    <table class="cr-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const CR_CSS = `
  .cr-sp{display:flex;flex-direction:column;}
  .cr-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .cr-sp-row:last-child{border-bottom:0;}
  .cr-sp-id{flex:0 0 44px;font-weight:800;color:var(--lime);font-size:10px;}
  .cr-sp-b b{font-size:10.5px;} .cr-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .cr-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .cr-hhead{display:flex;align-items:center;gap:12px;margin:4px 0 8px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .cr-hbig{font-size:36px;font-weight:800;line-height:1;} .cr-hcap{font-size:10px;color:#333;}
  .cr-hzs{display:flex;gap:7px;flex-wrap:wrap;}
  .cr-hz{flex:1;min-width:105px;border:1px solid var(--line);border-radius:6px;padding:8px 9px;text-align:center;}
  .cr-hz-v{font-size:20px;font-weight:800;} .cr-hz-v i{font-size:9px;color:var(--muted);font-weight:400;font-style:normal;} .cr-hz-v.ok{color:var(--ok);} .cr-hz-v.check{color:var(--check);} .cr-hz-v.gap{color:var(--gap);}
  .cr-hz-l{font-size:9px;font-weight:800;margin:2px 0;} .cr-hz-n{font-size:7.5px;color:var(--muted);line-height:1.3;}
  .cr-s{width:100%;} .cr-s td{padding:3px 6px;border-bottom:1px solid var(--line);vertical-align:middle;}
  .cr-s-l{font-weight:700;white-space:nowrap;width:190px;font-size:9.5px;} .cr-s-bar{width:130px;} .cr-s-v{white-space:nowrap;width:44px;text-align:right;} .cr-s-v b{font-size:12px;font-weight:800;} .cr-s-v i{color:var(--muted);font-size:8px;font-style:normal;} .cr-na{color:var(--muted);font-size:9px;}
  .cr-b{font-weight:700;} .cr-mut{color:var(--muted);font-size:9px;} .cr-c{text-align:center;} .cr-pri{white-space:nowrap;} .cr-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .cr-fns{display:flex;flex-direction:column;gap:4px;}
  .cr-fn{display:grid;grid-template-columns:150px 130px 26px 90px 1fr;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid var(--line);font-size:9px;}
  .cr-fn-l{font-weight:700;} .cr-fn-bar{height:9px;background:var(--line);border-radius:5px;overflow:hidden;} .cr-fn-fill{display:block;height:100%;border-radius:5px;} .cr-fn-fill.ok{background:var(--ok);} .cr-fn-fill.check{background:var(--check);} .cr-fn-fill.gap{background:var(--gap);}
  .cr-fn-v{font-weight:800;} .cr-fn-v.ok{color:var(--ok);} .cr-fn-v.check{color:var(--check);} .cr-fn-v.gap{color:var(--gap);} .cr-fn-lk{font-size:8px;color:var(--muted);} .cr-fn-n{color:#555;font-size:8.5px;}
  .cr-fr td{font-size:9px;} .cr-fr .gap{color:var(--gap);font-weight:700;} .cr-fr .ok{color:var(--ok);font-weight:700;}
  .cr-maps{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
  .cr-mapcol{border:1px solid var(--line);border-radius:6px;padding:6px 8px;} .cr-map-h{font-size:9px;font-weight:800;color:var(--lime);margin-bottom:4px;text-transform:uppercase;letter-spacing:.3px;}
  .cr-map-r{font-size:8.5px;padding:1px 0;} .cr-map-r span{font-weight:600;} .cr-map-r i{color:var(--muted);font-style:normal;margin-left:4px;}
  .cr-bc{border:1px solid var(--line);border-radius:7px;margin:7px 0;overflow:hidden;page-break-inside:avoid;}
  .cr-bc-h{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);flex-wrap:wrap;}
  .cr-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .cr-bc-h b{font-size:11px;} .cr-role{font-size:8px;color:var(--muted);} .cr-bc-h .chip{margin-left:auto;}
  .cr-bc-body{padding:6px 9px;} .cr-row{display:flex;gap:7px;font-size:9px;line-height:1.4;padding:1px 0;} .cr-k{flex:0 0 100px;color:var(--muted);font-weight:700;font-size:8px;text-transform:uppercase;letter-spacing:.3px;}
  .cr-prob{color:#7a1f1f;} .cr-gold{color:#166534;}
  .cr-bc-eff{padding:5px 9px 7px;font-size:9px;color:var(--ok);font-weight:600;border-top:1px solid var(--line);background:#fbfcfd;} .cr-bc-eff b{color:var(--ok);}
  .cr-hyp-t td{font-size:9px;vertical-align:middle;} .cr-hyp{color:#222;line-height:1.35;} .cr-hyp-t .cr-c b{font-size:11px;}
  .cr-opps{display:flex;flex-wrap:wrap;gap:6px;} .cr-opp{flex:1;min-width:150px;border:1px solid var(--line);border-left:3px solid var(--lime);border-radius:0 6px 6px 0;padding:6px 9px;}
  .cr-opp b{font-size:9.5px;display:block;} .cr-opp span{font-size:8.5px;color:#555;}
  .cr-rms{display:flex;flex-direction:column;gap:6px;}
  .cr-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .cr-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .cr-rm-b b{font-size:10px;} .cr-rm-b ul{margin:3px 0 0;padding-left:16px;} .cr-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .cr-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .cr-badge.ok{background:#e7f6ec;color:var(--ok);} .cr-badge.na{background:#eef0f3;color:var(--muted);}
  .cr-ctx{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
`;

export function renderCroFlowHtml(r: CroFlowReport): string {
  const coverHtml = cover({
    kicker: 'CRO Audit',
    title: 'CRO Audit: що заважає конверсії і як її підняти',
    verdict: r.health.overall === null
      ? 'CRO Health Score не вимірювався — обхід не дав жодної сторінки.'
      : `CRO Health Score — ${r.health.overall}/10; CRO Score — ${r.score.overall}/10 (обхід).`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'CRO Health', value: `${r.health.overall}/10` },
      { label: 'Гіпотез (ICE)', value: String(r.hypotheses.length) },
    ],
    note: `<b>Не лише зручність — продажі.</b> Інтерфейс може бути зручним, але погано продавати. CRO зв'язує Traffic → Intent → Experience → Trust → Decision → Action → Conversion → Revenue. Вимірюване з обходу (friction/trust/CTA/готовність воронки) — детерміновано; фактична воронка, drop-off, конверсія за джерелами, A/B, heatmaps — з даних (GA4/GTM/CRM), позначено «н/д».`,
  });
  const ctx = `<section class="block"><div class="cr-ctx"><b>Чесна модель.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній CRO-аудит: friction, trust, CTA, готовність воронки, AOV-механіки — з обходу. Фактична воронка й drop-off, конверсія за джерелами, revenue per session, A/B-історія, heatmaps, form analytics — з даних (GA4/GTM/CRM/heatmap), позначено «н/д». Гіпотези — «Якщо X→Y, бо Z»; benchmark — орієнтир, не доказ. Цифри не вигадуються.');
  return doc(`CRO Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + health(r) + scoreT(r) + funnel(r) + maps(r) + blockCards(r) + hypotheses(r) + roadmap(r) + foot,
    CR_CSS);
}
