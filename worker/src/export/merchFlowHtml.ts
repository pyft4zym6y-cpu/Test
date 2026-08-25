/**
 * «E-commerce / Merchandising Audit» (клієнтський PDF): керування асортиментом і
 * комерційна експозиція. Merchandising Health/Score + механіки + картка товару +
 * шляхи discovery + поблокові merch-картки + gap + roadmap. 30 артефактів.
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { MerchFlowReport, MerchBlockCard, HealthZone, ScoreZone } from '../merchflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');

function spine(r: MerchFlowReport): string {
  const items = r.spine.map((L) => `<div class="mr-sp-row"><div class="mr-sp-id">${esc(L.id)}</div>
    <div class="mr-sp-b"><b>${esc(L.title.replace(/^MR\d+ · /, ''))}</b>
      <p class="mr-sp-pr">${esc(L.principle)}</p><p class="mr-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>Merchandising Audit: 8 рівнів</h2>
    <p class="lead">Формула: Right Product → Right User → Right Moment → Right Position → Right Message → Right Offer → Right Next Action. Не «чи є товари», а вся система керування видимістю, вибором, релевантністю й комерційною експозицією.</p>
    <div class="mr-sp">${items}</div></section>`;
}

function health(r: MerchFlowReport): string {
  const cards = r.health.zones.map((z: HealthZone) => `<div class="mr-hz"><div class="mr-hz-v ${s10(z.score)}">${z.score}<i>/10</i></div>
    <div class="mr-hz-l">${esc(z.label)}</div><div class="mr-hz-n">${esc(z.note)}</div></div>`).join('');
  return `<section class="block"><h2>Merchandising Health Score</h2>
    <p class="lead">Пʼять головних показників керування асортиментом.</p>
    <div class="mr-hhead"><span class="mr-hbig ${s10(r.health.overall)}">${r.health.overall}</span><span class="mr-hcap">/10 — Merchandising Health Score<br><i>${esc(r.businessType)} · ~${r.products} товарів · ${r.categories} категорій</i></span></div>
    <div class="mr-hzs">${cards}</div></section>`;
}

function scoreT(r: MerchFlowReport): string {
  const rows = r.score.zones.map((z: ScoreZone) => {
    const pct = Math.round((z.score / 10) * 100);
    return `<tr><td class="mr-s-l">${esc(z.label)}</td>
      <td class="mr-s-bar"><span class="bar">${z.measured ? `<span class="fill ${s10(z.score)}" style="width:${pct}%"></span>` : ''}</span></td>
      <td class="mr-s-v">${z.measured ? `<b class="${s10(z.score)}">${z.score}</b><i>/10</i>` : '<span class="mr-na">н/д</span>'}</td></tr>`;
  }).join('');
  return `<section class="block"><h2>Merchandising Score — 20 напрямів</h2>
    <p class="lead">Деталізація. Inventory, Margin, Merchandising Analytics — «н/д»: вимірюються лише з бізнес-даними (GA/CRM/PIM/ERP), не вигадуємо.</p>
    <table class="mr-s"><tbody>${rows}</tbody></table></section>`;
}

function mechanics(r: MerchFlowReport): string {
  const rows = r.mechanics.map((m) => `<tr><td class="mr-c">${yn(m.present)}</td><td class="mr-b">${esc(m.mech)}</td>
    <td class="mr-mut">${esc(m.group)}</td><td class="mr-c">${m.present ? '<span class="chip ok">є</span>' : `<span class="chip ${PRI[m.priority]}">${esc(m.priority)}</span>`}</td>
    <td class="mr-mut">${esc(m.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Merchandising Mechanics Inventory</h2>
    <p class="lead">Наявність ключових механік керування асортиментом. Відсутні — з пріоритетом впровадження.</p>
    <table><thead><tr><th></th><th>Механіка</th><th>Група</th><th>Стан</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function cardsDiscovery(r: MerchFlowReport): string {
  const els = r.cardElements.map((c) => `<tr><td class="mr-c">${yn(c.present)}</td><td class="mr-b">${esc(c.el)}</td><td class="mr-mut">${esc(c.role)}</td></tr>`).join('');
  const paths = r.discovery.paths.map((p) => `<span class="mr-path ${p.available ? 'on' : 'off'}">${p.available ? '✓' : '✕'} ${esc(p.path)}</span>`).join('');
  return `<section class="block"><h2>Product Card + Discovery Paths</h2>
    <p class="lead">Картка товару як merchandising-інструмент і кількість реальних шляхів до товару (чим більше входів — тим вищий discovery).</p>
    <table><thead><tr><th></th><th>Елемент картки</th><th>Роль</th></tr></thead><tbody>${els}</tbody></table>
    <div class="mr-paths"><b>Шляхи discovery — ${r.discovery.count}/${r.discovery.paths.length}:</b> ${paths}</div></section>`;
}

function blockCards(r: MerchFlowReport): string {
  if (!r.blockCards.length) return '';
  const cards = r.blockCards.map((c: MerchBlockCard) => `<div class="mr-bc">
    <div class="mr-bc-h"><span class="mr-pg">${esc(c.page)}</span><b>${esc(c.name)}</b><span class="mr-task">${esc(c.task)}</span><span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="mr-bc-body">
      <div class="mr-row"><span class="mr-k">Current</span>${esc(c.current)}</div>
      <div class="mr-row"><span class="mr-k">Problem</span><span class="mr-prob">${esc(c.problem)}</span></div>
      <div class="mr-row"><span class="mr-k">Golden Standard</span><span class="mr-gold">${esc(c.golden)}</span></div>
      <div class="mr-row"><span class="mr-k">Рекомендація</span>${esc(c.recommendation)}</div>
    </div>
    <div class="mr-bc-eff"><b>Ефект:</b> ${esc(c.effect)}</div></div>`).join('');
  return `<section class="block"><h2>Merchandising Block-by-Block</h2>
    <p class="lead">Кожен merchandising-блок: Current → Problem → Golden Standard → Recommendation → Impact. Приклад «Популярні товари»: некерований порядок → динамічний bestseller-ranking на реальних даних.</p>${cards}</section>`;
}

function gapsRoadmap(r: MerchFlowReport): string {
  const gaps = r.gaps.map((g) => `<tr><td class="mr-pri"><span class="chip ${PRI[g.priority]}">${esc(g.priority)}</span></td>
    <td class="mr-b">${esc(g.title)}</td><td>${esc(g.why)}</td><td class="mr-c2">${esc(g.create)}</td></tr>`).join('');
  const pt = r.pageTasks.map((p) => `<tr><td class="mr-b">${esc(p.page)}</td><td class="mr-mut">${esc(p.task)}</td></tr>`).join('');
  const rm = r.roadmap.map((s, i) => `<div class="mr-rm"><div class="mr-rm-n">${i + 1}</div><div class="mr-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="mr-c mr-mut">${a.n}</td><td class="mr-b">${esc(a.name)}</td><td class="mr-c"><span class="mr-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'бізнес-дані'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Gap Map · Page Tasks · Roadmap · 30 артефактів</h2>
    <p class="lead">Merchandising-розриви, задачі за сторінками, план і артефакти.</p>
    <table><thead><tr><th>Пріор.</th><th>Розрив</th><th>Чому важливо</th><th>Що створити</th></tr></thead><tbody>${gaps}</tbody></table>
    <h3 class="mr-h3">Merchandising задачі за сторінками</h3>
    <table><thead><tr><th>Сторінка</th><th>Merchandising-задача</th></tr></thead><tbody>${pt}</tbody></table>
    <h3 class="mr-h3">Merchandising Roadmap</h3><div class="mr-rms">${rm}</div>
    <h3 class="mr-h3">Фінальні артефакти (30)</h3>
    <table class="mr-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const MR_CSS = `
  .mr-sp{display:flex;flex-direction:column;}
  .mr-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .mr-sp-row:last-child{border-bottom:0;}
  .mr-sp-id{flex:0 0 34px;font-weight:800;color:var(--lime);font-size:11px;}
  .mr-sp-b b{font-size:10.5px;} .mr-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .mr-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .mr-hhead{display:flex;align-items:center;gap:12px;margin:4px 0 8px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .mr-hbig{font-size:36px;font-weight:800;line-height:1;} .mr-hcap{font-size:10px;color:#333;} .mr-hcap i{color:var(--muted);font-size:8.5px;font-style:normal;}
  .mr-hzs{display:flex;gap:7px;flex-wrap:wrap;}
  .mr-hz{flex:1;min-width:105px;border:1px solid var(--line);border-radius:6px;padding:8px 9px;text-align:center;}
  .mr-hz-v{font-size:20px;font-weight:800;} .mr-hz-v i{font-size:9px;color:var(--muted);font-weight:400;font-style:normal;} .mr-hz-v.ok{color:var(--ok);} .mr-hz-v.check{color:var(--check);} .mr-hz-v.gap{color:var(--gap);}
  .mr-hz-l{font-size:9px;font-weight:800;margin:2px 0;} .mr-hz-n{font-size:7.5px;color:var(--muted);line-height:1.3;}
  .mr-s{width:100%;} .mr-s td{padding:3px 6px;border-bottom:1px solid var(--line);vertical-align:middle;}
  .mr-s-l{font-weight:700;white-space:nowrap;width:200px;font-size:9.5px;} .mr-s-bar{width:130px;} .mr-s-v{white-space:nowrap;width:44px;text-align:right;} .mr-s-v b{font-size:12px;font-weight:800;} .mr-s-v i{color:var(--muted);font-size:8px;font-style:normal;} .mr-na{color:var(--muted);font-size:9px;}
  .mr-b{font-weight:700;} .mr-mut{color:var(--muted);font-size:9px;} .mr-c{text-align:center;} .mr-c2{color:#334;font-size:9px;} .mr-pri{white-space:nowrap;} .mr-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .mr-paths{margin:6px 0;font-size:9px;} .mr-path{display:inline-block;font-size:8.5px;border-radius:10px;padding:2px 8px;margin:2px 3px 0 0;border:1px solid var(--line);} .mr-path.on{background:#f0f9f2;color:var(--ok);border-color:#bfe6cc;} .mr-path.off{background:#fdeeee;color:var(--gap);border-color:#f3c9c9;}
  .mr-task{font-size:8px;color:var(--muted);}
  .mr-bc{border:1px solid var(--line);border-radius:7px;margin:7px 0;overflow:hidden;page-break-inside:avoid;}
  .mr-bc-h{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);flex-wrap:wrap;}
  .mr-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .mr-bc-h b{font-size:11px;} .mr-bc-h .chip{margin-left:auto;}
  .mr-bc-body{padding:6px 9px;} .mr-row{display:flex;gap:7px;font-size:9px;line-height:1.4;padding:1px 0;} .mr-k{flex:0 0 100px;color:var(--muted);font-weight:700;font-size:8px;text-transform:uppercase;letter-spacing:.3px;}
  .mr-prob{color:#7a1f1f;} .mr-gold{color:#166534;}
  .mr-bc-eff{padding:5px 9px 7px;font-size:9px;color:var(--ok);font-weight:600;border-top:1px solid var(--line);background:#fbfcfd;} .mr-bc-eff b{color:var(--ok);}
  .mr-rms{display:flex;flex-direction:column;gap:6px;}
  .mr-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .mr-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .mr-rm-b b{font-size:10px;} .mr-rm-b ul{margin:3px 0 0;padding-left:16px;} .mr-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .mr-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .mr-badge.ok{background:#e7f6ec;color:var(--ok);} .mr-badge.na{background:#eef0f3;color:var(--muted);}
  .mr-ctx{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
`;

export function renderMerchFlowHtml(r: MerchFlowReport): string {
  const coverHtml = cover({
    kicker: 'E-commerce / Merchandising Audit',
    title: 'Merchandising Audit: правильний товар у правильному місці',
    verdict: `Merchandising Health Score — ${r.health.overall}/10; Merchandising Score — ${r.score.overall}/10 (обхід).`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Merchandising Health', value: `${r.health.overall}/10` },
      { label: 'Товарів / категорій', value: `~${r.products} / ${r.categories}` },
    ],
    note: `<b>Керування асортиментом і комерційна експозиція.</b> Навіть ідеальний UX не врятує магазин, якщо користувач бачить не ті товари, bestseller унизу, а рекомендації нерелевантні. Вимірюване з обходу рахуємо детерміновано; продажі/маржа/залишки/visibility share — з бізнес-даних (GA/CRM/PIM), позначено «н/д».`,
  });
  const ctx = `<section class="block"><div class="mr-ctx"><b>Чесна модель.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній merchandising-аудит: наявність механік, картка товару, шляхи discovery — з обходу. Visibility vs revenue/margin share, ranking logic, продажі, залишки, category/search analytics, AOV, персоналізація — з бізнес-даних (GA/CRM/PIM/ERP), позначено «н/д». Цифри не вигадуються.');
  return doc(`Merchandising Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + health(r) + scoreT(r) + mechanics(r) + cardsDiscovery(r) + blockCards(r) + gapsRoadmap(r) + foot,
    MR_CSS);
}
