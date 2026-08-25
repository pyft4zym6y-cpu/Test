/**
 * «Customer Journey Audit» (клієнтський PDF): повний шлях клієнта від Awareness до
 * Advocacy. On-site етапи — з обходу; pre-site/емоції/post-purchase якість — з даних.
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { CjmFlowReport, StageRow, PersonaRow, TrustRow, EmotionRow, MapRow } from '../cjmflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');
const GRP: Record<string, string> = { 'Pre-site': '#7c3aed', 'On-site': '#2563eb', 'Post-purchase': '#0891b2' };

function spine(r: CjmFlowReport): string {
  const items = r.spine.map((L) => `<div class="cj-sp-row"><div class="cj-sp-id">${esc(L.id)}</div>
    <div class="cj-sp-b"><b>${esc(L.title.replace(/^CJ\d+ · /, ''))}</b>
      <p class="cj-sp-pr">${esc(L.principle)}</p><p class="cj-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>Customer Journey Audit: 8 рівнів</h2>
    <p class="lead">Повний шлях: Awareness → Discovery → Consideration → Search → Product → Cart → Checkout → Payment → Delivery → Support → Repeat → Loyalty → Advocacy. Питання: що відбувається з клієнтом на кожному етапі й де виникає friction.</p>
    <div class="cj-sp">${items}</div></section>`;
}

function head(r: CjmFlowReport): string {
  return `<section class="block"><h2>On-site Journey Readiness + Maturity floor</h2>
    <p class="lead">On-site шлях (Homepage→Checkout) — головний вимірюваний шар. Pre-site і post-purchase якість — з даних (позначено на етапах).</p>
    <div class="cj-head">
      <div class="cj-h-box"><span class="cj-h-v ${s10(r.onsiteReadiness)}">${r.onsiteReadiness}</span><span class="cj-h-l">/10 — готовність on-site шляху</span></div>
      <div class="cj-h-box"><span class="cj-h-v ${r.maturity.floor >= 3 ? 'ok' : r.maturity.floor >= 2 ? 'check' : 'gap'}">L${r.maturity.floor}</span><span class="cj-h-l">Journey Maturity floor<br><i>${esc(r.maturity.note)}</i></span></div>
    </div></section>`;
}

function stages(r: CjmFlowReport): string {
  const rows = r.stages.map((s: StageRow) => `<tr>
    <td class="cj-grp" style="border-left:3px solid ${GRP[s.group]}">${esc(s.stage)}<span class="cj-gn">${esc(s.group)}</span></td>
    <td class="cj-mut">${esc(s.userGoal)}</td>
    <td class="cj-c">${s.source === 'обхід' ? `<b class="${s10(s.readiness)}">${s.readiness}</b>` : '<span class="cj-na">дані</span>'}</td>
    <td class="cj-fr">${s.friction ? esc(s.friction) : '<span class="ok">—</span>'}</td>
    <td class="cj-mut">${esc(s.opportunity)}</td>
    <td class="cj-c"><span class="chip ${PRI[s.priority]}">${esc(s.priority)}</span></td></tr>`).join('');
  return `<section class="block"><h2>Journey Stages — 14 етапів (Pre · On · Post)</h2>
    <p class="lead">Для кожного етапу: ціль клієнта, готовність (з обходу) або «дані», friction, можливість, пріоритет. Кольор ліворуч — група етапу.</p>
    <table class="cj-st"><thead><tr><th>Етап</th><th>Ціль клієнта</th><th>Готовн.</th><th>Friction</th><th>Можливість</th><th>Пріор.</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function personasTrust(r: CjmFlowReport): string {
  const per = r.personas.map((p: PersonaRow) => `<tr><td class="cj-c">${yn(p.aligned)}</td><td class="cj-b">${esc(p.persona)}</td><td class="cj-mut">${esc(p.goal)}</td><td class="cj-mut">${esc(p.note)}</td></tr>`).join('');
  const tr = r.trust.map((t: TrustRow) => `<div class="cj-tr">${yn(t.ok)} <span>${esc(t.touchpoint)}</span><i>${esc(t.note)}</i></div>`).join('');
  return `<section class="block"><h2>Persona Alignment + Trust Touchpoints</h2>
    <p class="lead">Шлях під сегменти (не «середній клієнт») і точки довіри, що знімають anxiety.</p>
    <table><thead><tr><th></th><th>Персона</th><th>Ціль</th><th>Коментар</th></tr></thead><tbody>${per}</tbody></table>
    <div class="cj-trs">${tr}</div></section>`;
}

function emotional(r: CjmFlowReport): string {
  const em = r.emotional.map((e: EmotionRow) => `<div class="cj-em ${e.risk ? 'risk' : ''}"><div class="cj-em-p">${esc(e.point)}</div><div class="cj-em-e">${esc(e.emotion)}</div><div class="cj-em-n">${esc(e.note)}</div></div>`).join('');
  const exp = r.expectation.map((x) => `<tr><td class="cj-c">${x.promiseObservable ? '<span class="check">видно на сайті</span>' : '<span class="cj-na">дані</span>'}</td><td class="cj-b">${esc(x.item)}</td><td class="cj-mut">${esc(x.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Emotional Journey + Expectation Management</h2>
    <p class="lead">Крива емоцій Confusion → Interest → Confidence → Anxiety → Relief → Satisfaction (фактичні емоції — дослідження). Expectation: Promise → Reality (напр. «доставка завтра» в рекламі vs «3–5 днів» на checkout — критичний mismatch).</p>
    <div class="cj-ems">${em}</div>
    <h3 class="cj-h3">Expectation Management (Promise → Reality)</h3>
    <table><thead><tr><th>Джерело</th><th>Звірка</th><th>Коментар</th></tr></thead><tbody>${exp}</tbody></table></section>`;
}

function postAndPlan(r: CjmFlowReport): string {
  const pp = r.postPurchase.map((m: MapRow) => `<div class="cj-tr">${yn(m.ok)} <span>${esc(m.item)}</span><i>${esc(m.note)}</i></div>`).join('');
  const opps = r.opportunities.map((o) => `<div class="cj-opp"><b>${esc(o.type)}</b><span>${esc(o.note)}</span></div>`).join('');
  const rm = r.roadmap.map((s, i) => `<div class="cj-rm"><div class="cj-rm-n">${i + 1}</div><div class="cj-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="cj-c cj-mut">${a.n}</td><td class="cj-b">${esc(a.name)}</td><td class="cj-c"><span class="cj-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'дані/дослідж.'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Post-purchase · Opportunity · Roadmap · Артефакти</h2>
    <p class="lead">Post-purchase — часто найслабший шар (наявність сторінок з обходу; якість — з CRM). Далі — карта можливостей, план і артефакти.</p>
    <div class="cj-trs">${pp}</div>
    <h3 class="cj-h3">Journey Opportunity Map</h3><div class="cj-opps">${opps}</div>
    <h3 class="cj-h3">Customer Journey Roadmap</h3><div class="cj-rms">${rm}</div>
    <h3 class="cj-h3">Фінальні артефакти</h3>
    <table class="cj-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const CJ_CSS = `
  .cj-sp{display:flex;flex-direction:column;}
  .cj-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .cj-sp-row:last-child{border-bottom:0;}
  .cj-sp-id{flex:0 0 36px;font-weight:800;color:var(--lime);font-size:11px;}
  .cj-sp-b b{font-size:10.5px;} .cj-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .cj-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .cj-head{display:flex;gap:10px;margin:4px 0;}
  .cj-h-box{flex:1;display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .cj-h-v{font-size:28px;font-weight:800;line-height:1;} .cj-h-v.ok{color:var(--ok);} .cj-h-v.check{color:var(--check);} .cj-h-v.gap{color:var(--gap);}
  .cj-h-l{font-size:9.5px;color:#333;} .cj-h-l i{color:var(--muted);font-size:8px;font-style:normal;}
  .cj-b{font-weight:700;} .cj-mut{color:var(--muted);font-size:9px;} .cj-c{text-align:center;} .cj-na{color:var(--muted);font-size:8px;font-style:italic;} .cj-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .cj-st td{font-size:9px;vertical-align:middle;} .cj-grp{font-weight:700;padding-left:8px !important;} .cj-gn{display:block;font-weight:400;font-size:7.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;}
  .cj-c b{font-size:11px;} .cj-c b.ok{color:var(--ok);} .cj-c b.check{color:var(--check);} .cj-c b.gap{color:var(--gap);} .cj-fr{color:#7a1f1f;font-size:8.5px;} .cj-fr .ok{color:var(--ok);}
  .cj-trs{display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0;} .cj-tr{font-size:9px;flex:0 0 46%;} .cj-tr span{font-weight:600;} .cj-tr i{color:var(--muted);font-style:normal;margin-left:4px;}
  .cj-ems{display:flex;gap:6px;flex-wrap:wrap;}
  .cj-em{flex:1;min-width:130px;border:1px solid var(--line);border-radius:6px;padding:7px 9px;} .cj-em.risk{background:#fdf6f6;border-color:#f3c9c9;}
  .cj-em-p{font-size:8px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;} .cj-em-e{font-size:10px;font-weight:700;margin:2px 0;} .cj-em-n{font-size:8px;color:#555;line-height:1.3;}
  .cj-opps{display:flex;flex-wrap:wrap;gap:6px;} .cj-opp{flex:1;min-width:150px;border:1px solid var(--line);border-left:3px solid var(--lime);border-radius:0 6px 6px 0;padding:6px 9px;}
  .cj-opp b{font-size:9.5px;display:block;} .cj-opp span{font-size:8.5px;color:#555;}
  .cj-rms{display:flex;flex-direction:column;gap:5px;}
  .cj-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:6px 10px;page-break-inside:avoid;}
  .cj-rm-n{flex:0 0 20px;height:20px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:10px;display:flex;align-items:center;justify-content:center;}
  .cj-rm-b b{font-size:10px;} .cj-rm-b ul{margin:2px 0 0;padding-left:16px;} .cj-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .cj-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .cj-badge.ok{background:#e7f6ec;color:var(--ok);} .cj-badge.na{background:#fdf1e7;color:#b45309;}
  .cj-ctx{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
`;

export function renderCjmFlowHtml(r: CjmFlowReport): string {
  const coverHtml = cover({
    kicker: 'Customer Journey Audit',
    title: 'Customer Journey Audit: повний шлях клієнта',
    verdict: `Готовність on-site шляху — ${r.onsiteReadiness}/10; Journey Maturity floor — L${r.maturity.floor}.`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'On-site readiness', value: `${r.onsiteReadiness}/10` },
      { label: 'Maturity floor', value: `L${r.maturity.floor}` },
    ],
    note: `<b>Що відбувається з клієнтом після кожного контакту.</b> На відміну від Marketing Audit (як створюється попит) — Customer Journey про весь досвід: anonymous user, purchase, service, returns, post-purchase. On-site етапи — з обходу; емоції, pre-site канали, якість підтримки/доставки й repeat/churn — з даних/досліджень (позначено).`,
  });
  const ctx = `<section class="block"><div class="cj-ctx"><b>Чесна модель.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній journey-аудит: on-site етапи (homepage→checkout), trust-touchpoints, expectation на сайті, наявність post-purchase-сторінок — з обходу. Емоції, фактичний drop-off, ефективність pre-site каналів, якість підтримки/доставки, repeat/churn — з даних/досліджень (GA4/CRM/session recordings), позначено. Цифри не вигадуються.');
  return doc(`Customer Journey Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + head(r) + stages(r) + personasTrust(r) + emotional(r) + postAndPlan(r) + foot,
    CJ_CSS);
}
