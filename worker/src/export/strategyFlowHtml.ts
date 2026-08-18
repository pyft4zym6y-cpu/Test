/**
 * «Strategic Audit» — верхньорівневий PDF: чи правильно сайт спроєктовано як
 * інструмент бізнесу. Іде першим; його висновки — вхід для решти аудитів.
 * Два шари: вимірюване з сайту + позначене «потрібен бізнес-контекст» (без вигадок).
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { StrategyFlowReport, StratBlockCard, HealthZone, StratScoreZone } from '../strategyflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const s5 = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');
const DIFF_CLS: Record<string, string> = { 'сильно': 'ok', 'середньо': 'check', 'слабко': 'gap' };

function spine(r: StrategyFlowReport): string {
  const items = r.spine.map((L) => `<div class="st-sp-row"><div class="st-sp-id">${esc(L.id)}</div>
    <div class="st-sp-b"><b>${esc(L.title.replace(/^ST\d+ · /, ''))}</b>
      <p class="st-sp-pr">${esc(L.principle)}</p><p class="st-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>Strategic Audit: 8 рівнів (іде першим)</h2>
    <p class="lead">Відповідає не «чи добре зроблено сайт», а «чи правильно сайт спроєктовано як інструмент бізнесу». Логіка: Business Model → Positioning → Audience → Market → Product → Channel/Retention → Page/Block → Gaps/Roadmap.</p>
    <div class="st-sp">${items}</div></section>`;
}

function health(r: StrategyFlowReport): string {
  const cards = r.health.zones.map((z: HealthZone) => `<div class="st-hz">
    <div class="st-hz-v ${s10(z.score)}">${z.score}<i>/10</i></div>
    <div class="st-hz-l">${esc(z.label)}</div><div class="st-hz-n">${esc(z.note)}</div></div>`).join('');
  return `<section class="block"><h2>Strategic Health Score</h2>
    <p class="lead">Пʼять великих зон стратегічного здоровʼя проєкту. Це «шапка» аудиту — далі кожна зона розкривається детально.</p>
    <div class="st-hhead"><span class="st-hbig ${s10(r.health.overall)}">${r.health.overall}</span><span class="st-hcap">/10 — Strategic Health Score<br><i>${esc(r.businessType)} · зрілість L${r.maturityLevel} (${esc(r.maturityName)})</i></span></div>
    <div class="st-hzs">${cards}</div></section>`;
}

function scoreT(r: StrategyFlowReport): string {
  const rows = r.score.zones.map((z: StratScoreZone) => {
    const pct = Math.round((z.score / 10) * 100);
    return `<tr><td class="st-s-l">${esc(z.label)}</td>
      <td class="st-s-bar"><span class="bar">${z.measured ? `<span class="fill ${s10(z.score)}" style="width:${pct}%"></span>` : ''}</span></td>
      <td class="st-s-v">${z.measured ? `<b class="${s10(z.score)}">${z.score}</b><i>/10</i>` : '<span class="st-na">н/д</span>'}</td></tr>`;
  }).join('');
  const na = r.score.zones.filter((z) => !z.measured).length;
  return `<section class="block"><h2>Strategic Score — 22 напрями</h2>
    <p class="lead">Деталізація за напрямами. ${na} напрями (unit-економіка, pricing, revenue-модель, omnichannel, KPI) чесно «н/д» — потрібен бізнес-контекст (бриф/інтейк), не вигадуємо.</p>
    <table class="st-s"><tbody>${rows}</tbody></table></section>`;
}

function roles(r: StrategyFlowReport): string {
  const rows = r.roles.map((x) => `<tr><td class="st-c">${yn(x.fits)}</td><td class="st-b">${esc(x.role)}</td><td class="st-mut">${esc(x.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Роль сайту в бізнесі</h2>
    <p class="lead">Яку стратегічну роль сайт реально виконує. Помилка ролі (напр. D2C-логіка при 70% продажів через marketplace) робить решту оптимізацій марними.</p>
    <table><thead><tr><th></th><th>Роль</th><th>Спостереження</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function positioning(r: StrategyFlowReport): string {
  const pos = r.positioning.map((p) => `<div class="st-pos ${p.present ? 'on' : 'off'}"><span>${esc(p.part)}</span><b>${p.present ? '✓' : '✕'}</b><i>${esc(p.note)}</i></div>`).join('');
  const claims = r.claims.map((c) => `<tr><td class="st-b">${esc(c.claim)}</td><td class="st-c">${yn(c.declared)}</td><td class="st-c">${yn(c.proven)}</td><td class="st-mut">${esc(c.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Positioning &amp; Value Proposition</h2>
    <p class="lead">Чи зрозуміло за 5–10 секунд: WHO + FOR WHOM + WHAT + WHY US + PROOF. І чи доведені заявлені переваги (claim → proof).</p>
    <div class="st-poss">${pos}</div>
    <h3 class="st-h3">USP: claim → proof</h3>
    <table><thead><tr><th>Перевага</th><th>Заявлено</th><th>Доведено</th><th>Коментар</th></tr></thead><tbody>${claims}</tbody></table></section>`;
}

function audience(r: StrategyFlowReport): string {
  const seg = r.segments.map((s) => `<tr><td class="st-c">${yn(s.supported)}</td><td class="st-b">${esc(s.segment)}</td><td class="st-mut">${esc(s.scenario)}</td><td class="st-mut">${esc(s.note)}</td></tr>`).join('');
  const obj = r.objections.map((o) => `<tr><td class="st-c">${yn(o.ok)}</td><td class="st-b">${esc(o.objection)}</td><td class="st-mut">${esc(o.closedWhere)}</td></tr>`).join('');
  return `<section class="block"><h2>Аудиторія · Сценарії · Заперечення</h2>
    <p class="lead">Чи побудований сайт під різні сегменти та їхні заперечення, а не «універсальний homepage».</p>
    <table><thead><tr><th></th><th>Сегмент</th><th>Сценарій</th><th>Коментар</th></tr></thead><tbody>${seg}</tbody></table>
    <h3 class="st-h3">Карта заперечень</h3>
    <table><thead><tr><th></th><th>Заперечення</th><th>Де знімається</th></tr></thead><tbody>${obj}</tbody></table></section>`;
}

function featuresDiff(r: StrategyFlowReport): string {
  const feat = r.features.map((f) => `<tr><td class="st-c">${yn(f.present)}</td><td class="st-b">${esc(f.feature)}</td>
    <td><span class="chip ${f.decision === 'Create' ? 'gap' : 'check'}">${esc(f.decision)}</span></td><td class="st-mut">${esc(f.value)}</td></tr>`).join('');
  const diff = r.differentiation.map((d) => `<tr><td class="st-b">${esc(d.factor)}</td>
    <td><span class="chip ${DIFF_CLS[d.ours]}">${esc(d.ours)}</span></td><td class="st-mut">${esc(d.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Feature Audit &amp; Differentiation</h2>
    <p class="lead">Функції — за бізнес- і клієнт-цінністю (Keep/Improve/Create), а не «є/немає». Диференціація — наш сигнал; повне порівняння з конкурентами потребує бізнес-даних.</p>
    <table><thead><tr><th></th><th>Функція</th><th>Рішення</th><th>Бізнес-цінність</th></tr></thead><tbody>${feat}</tbody></table>
    <h3 class="st-h3">Точки диференціації (наш сигнал)</h3>
    <table><thead><tr><th>Фактор</th><th>Ми</th><th>Коментар</th></tr></thead><tbody>${diff}</tbody></table></section>`;
}

function pagesT(r: StrategyFlowReport): string {
  const rows = r.pages.map((p) => `<tr><td class="st-b">${esc(p.page)}<span class="st-url">${esc(p.url)}</span></td>
    <td class="st-mut">${esc(p.fn)}</td><td class="st-c">${yn(p.delivers)}</td><td class="st-mut">${esc(p.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Стратегічний аудит сторінок</h2>
    <p class="lead">Кожна ключова сторінка — за БІЗНЕС-ФУНКЦІЄЮ, а не лише за UX: що вона дає бізнесу і чи виконує це.</p>
    <table><thead><tr><th>Сторінка</th><th>Бізнес-функція</th><th>Виконує</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function blockCards(r: StrategyFlowReport): string {
  if (!r.blockCards.length) return '';
  const cards = r.blockCards.map((c: StratBlockCard) => `<div class="st-bc">
    <div class="st-bc-h"><span class="st-pg">${esc(c.page)}</span><b>${esc(c.name)}</b>
      <span class="st-sv">стратег. цінність <b class="${s5(c.strategicValue)}">${c.strategicValue}</b>/5</span><span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="st-bc-meta"><span><b>Бізнес-ціль:</b> ${esc(c.businessPurpose)}</span><span><b>Клієнт:</b> ${esc(c.customerPurpose)}</span></div>
    <div class="st-bc-cols">
      <div class="st-now"><div class="st-lbl">ЗАРАЗ</div><p>${esc(c.now)}</p><div class="st-prob"><b>Проблема:</b> ${esc(c.problem)}</div></div>
      <div class="st-should"><div class="st-lbl good">ЯК МАЄ БУТИ</div><p>${esc(c.should)}</p></div>
    </div>
    <div class="st-bc-imp"><b>Бізнес-вплив:</b> ${esc(c.businessImpact)}</div>
    <div class="st-bc-reco"><b>Рекомендація:</b> ${esc(c.recommendation)}</div></div>`).join('');
  return `<section class="block"><h2>Стратегічний аудит блоків</h2>
    <p class="lead">Кожен блок — за бізнес-функцією: Бізнес-ціль → Клієнт → Зараз → Проблема → Як має бути → бізнес-вплив → рекомендація. Приклад: відгуки — не «покращити», а зробити комерційним переходом у товар.</p>${cards}</section>`;
}

function risksOpps(r: StrategyFlowReport): string {
  const risks = r.risks.map((x) => `<div class="st-risk"><span class="chip ${PRI[x.severity]}">${esc(x.severity)}</span><b>${esc(x.risk)}</b><div class="st-risk-n">${esc(x.note)}</div></div>`).join('');
  const opps = r.opportunities.map((o) => `<div class="st-opp"><span class="chip ${PRI[o.priority]}">${esc(o.priority)}</span><b>${esc(o.title)}</b><div class="st-opp-c">${esc(o.chain)}</div></div>`).join('');
  return `<section class="block"><h2>Strategic Risk &amp; Opportunity Map</h2>
    <p class="lead">Стратегічні ризики (що загрожує зростанню) і можливості (де воно приховане). Кожен ризик/можливість — з бізнес-наслідком.</p>
    <div class="st-two"><div><h3 class="st-h3">Ризики</h3>${risks || '<p class="lead">Критичних не виявлено.</p>'}</div>
      <div><h3 class="st-h3">Можливості</h3>${opps}</div></div></section>`;
}

function roadmap(r: StrategyFlowReport): string {
  const st = r.roadmap.map((s, i) => `<div class="st-rm"><div class="st-rm-n">${i + 1}</div>
    <div class="st-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="st-c st-mut">${a.n}</td><td class="st-b">${esc(a.name)}</td>
    <td class="st-c"><span class="st-badge ${a.source === 'сайт' ? 'ok' : 'na'}">${a.source === 'сайт' ? 'з сайту' : 'бізнес-контекст'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Strategic Roadmap + 20 артефактів</h2>
    <p class="lead">План за 6 фазами: Critical → Quick Wins → Growth → Product → Scale → Transformation. І перелік артефактів, які видає модуль.</p>
    <div class="st-rms">${st}</div>
    <h3 class="st-h3">Фінальні артефакти (20)</h3>
    <table class="st-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const ST_CSS = `
  .st-sp{display:flex;flex-direction:column;}
  .st-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .st-sp-row:last-child{border-bottom:0;}
  .st-sp-id{flex:0 0 34px;font-weight:800;color:var(--lime);font-size:11px;}
  .st-sp-b b{font-size:10.5px;} .st-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .st-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .st-hhead{display:flex;align-items:center;gap:12px;margin:4px 0 8px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .st-hbig{font-size:36px;font-weight:800;line-height:1;} .st-hcap{font-size:10px;color:#333;} .st-hcap i{color:var(--muted);font-size:8.5px;font-style:normal;}
  .st-hzs{display:flex;gap:7px;flex-wrap:wrap;}
  .st-hz{flex:1;min-width:105px;border:1px solid var(--line);border-radius:6px;padding:8px 9px;text-align:center;}
  .st-hz-v{font-size:20px;font-weight:800;} .st-hz-v i{font-size:9px;color:var(--muted);font-weight:400;font-style:normal;} .st-hz-v.ok{color:var(--ok);} .st-hz-v.check{color:var(--check);} .st-hz-v.gap{color:var(--gap);}
  .st-hz-l{font-size:9px;font-weight:800;margin:2px 0;} .st-hz-n{font-size:7.5px;color:var(--muted);line-height:1.3;}
  .st-s{width:100%;} .st-s td{padding:3px 6px;border-bottom:1px solid var(--line);vertical-align:middle;}
  .st-sgrid{display:none;}
  .st-s-l{font-weight:700;white-space:nowrap;width:200px;font-size:9.5px;} .st-s-bar{width:130px;} .st-s-v{white-space:nowrap;width:44px;text-align:right;} .st-s-v b{font-size:12px;font-weight:800;} .st-s-v i{color:var(--muted);font-size:8px;font-style:normal;} .st-na{color:var(--muted);font-size:9px;}
  .st-b{font-weight:700;} .st-mut{color:var(--muted);font-size:9px;} .st-c{text-align:center;} .st-url{display:block;font-weight:400;font-size:8px;color:var(--muted);font-family:monospace;}
  .st-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .st-poss{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0;}
  .st-pos{flex:1;min-width:120px;border:1px solid var(--line);border-radius:6px;padding:6px 8px;} .st-pos.off{background:#fdf2f2;border-color:#f3c9c9;}
  .st-pos span{display:block;font-size:8px;font-weight:800;letter-spacing:.3px;color:var(--muted);} .st-pos b{font-size:14px;} .st-pos.on b{color:var(--ok);} .st-pos.off b{color:var(--gap);} .st-pos i{display:block;font-size:8px;color:#555;font-style:normal;margin-top:2px;line-height:1.3;}
  .st-bc{border:1px solid var(--line);border-radius:7px;margin:7px 0;overflow:hidden;page-break-inside:avoid;}
  .st-bc-h{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);}
  .st-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .st-bc-h b{font-size:11px;flex:1;} .st-sv{font-size:8.5px;color:var(--muted);} .st-sv b{font-size:12px;} .st-sv b.ok{color:var(--ok);} .st-sv b.check{color:var(--check);} .st-sv b.gap{color:var(--gap);}
  .st-bc-meta{display:flex;flex-wrap:wrap;gap:4px 14px;padding:6px 9px;font-size:8.5px;color:#444;border-bottom:1px solid var(--line);} .st-bc-meta b{color:var(--muted);}
  .st-bc-cols{display:grid;grid-template-columns:1fr 1fr;}
  .st-now,.st-should{padding:7px 9px;font-size:9px;} .st-now{border-right:1px solid var(--line);background:#fcfcfc;}
  .st-lbl{font-size:8px;font-weight:800;letter-spacing:.5px;color:var(--muted);margin-bottom:4px;} .st-lbl.good{color:var(--ok);}
  .st-now p,.st-should p{margin:0 0 4px;line-height:1.35;color:#333;} .st-prob{font-size:8.5px;color:#7a1f1f;} .st-prob b{font-weight:700;}
  .st-bc-imp{padding:5px 9px;font-size:9px;color:#1e2a5a;background:#eef2ff;border-top:1px solid var(--line);} .st-bc-imp b{color:#2f4fd0;}
  .st-bc-reco{padding:6px 9px;font-size:9px;border-top:1px solid var(--line);background:#fbfcfd;} .st-bc-reco b{color:var(--muted);}
  .st-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .st-risk,.st-opp{border:1px solid var(--line);border-radius:6px;margin:5px 0;padding:6px 9px;}
  .st-risk{border-left:3px solid var(--gap);} .st-opp{border-left:3px solid var(--lime);}
  .st-risk b,.st-opp b{font-size:9.5px;margin-left:6px;} .st-risk-n{font-size:8.5px;color:#555;margin-top:3px;} .st-opp-c{font-size:8.5px;color:#334;margin-top:3px;font-family:monospace;}
  .st-rms{display:flex;flex-direction:column;gap:6px;}
  .st-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .st-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .st-rm-b b{font-size:10px;} .st-rm-b ul{margin:3px 0 0;padding-left:16px;} .st-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .st-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 8px;border-radius:10px;} .st-badge.ok{background:#e7f6ec;color:var(--ok);} .st-badge.na{background:#eef0f3;color:var(--muted);}
  .st-ctx{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
`;

export function renderStrategyFlowHtml(r: StrategyFlowReport): string {
  const coverHtml = cover({
    kicker: 'Strategic Audit',
    title: 'Strategic Audit: чи спроєктовано сайт як інструмент бізнесу',
    verdict: `Strategic Health Score — ${r.health.overall}/10 за виміряними зонами (${r.businessType}, зрілість L${r.maturityLevel}).`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Strategic Health', value: `${r.health.overall}/10` },
      { label: 'Ризиків / можливостей', value: `${r.risks.length} / ${r.opportunities.length}` },
    ],
    note: `<b>Іде першим, задає «навіщо».</b> Відповідає не «що виправити на сайті», а «навіщо і який бізнес-результат це дасть». Його висновки — вхід для UX/UI, Content, SEO, GEO/AEO, CRO. Головне питання: чи робить сайт саме те, що бізнесу потрібно для зростання виручки, прибутку, бази й бренду.`,
  });
  const ctx = `<section class="block"><div class="st-ctx"><b>Чесна модель.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній стратегічний аудит: вимірюване з сайту (роль, позиціонування, value prop, claim→proof, сегменти, довіра, retention-механіки, фічі, масштабованість) + реконструкція бізнесу з обходу. Unit-економіка, цілі, KPI, marketplace-частка, дані-стратегія — вхід із брифу/інтейку, позначено «н/д». Цифри не вигадуються.');
  return doc(`Strategic Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + health(r) + scoreT(r) + roles(r) + positioning(r) + audience(r) + featuresDiff(r) + pagesT(r) + blockCards(r) + risksOpps(r) + roadmap(r) + foot,
    ST_CSS);
}
