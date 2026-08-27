/**
 * «SEO-аудит як система» — клієнтський PDF, що видає 8 артефактів замість
 * технічного звіту: Strategy Map · Semantic Map · Technical Map · Page-by-Page ·
 * Block-by-Block · Problem/Opportunity Map · SEO Score · Growth Roadmap.
 * Єдиний візуальний стандарт (reportShell). Фактологічний зріз (дерево, on-page,
 * issues) лишається в окремому «SEO-архітектура».
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { SeoFlowReport, SeoBlockCard, SeoPageCard, SeoScoreZone } from '../seoflow.js';
import { scoreText } from '../flowScore.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const s5 = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const ST: Record<string, string> = { ok: 'ok', warn: 'check', gap: 'gap', na: 'na', weak: 'check', missing: 'gap' };
const STW: Record<string, string> = { ok: '✓', warn: '!', gap: '✕', na: 'н/д', weak: '~', missing: '✕' };
const mini = (l: string, v: number) => `<div class="sfa-mini"><span>${l}</span><b class="${s5(v)}">${v}<i>/5</i></b></div>`;

function spine(r: SeoFlowReport): string {
  const items = r.spine.map((L) => `<div class="sf-sp-row">
    <div class="sf-sp-id">${esc(L.id)}</div>
    <div class="sf-sp-b"><b>${esc(L.title.replace(/^S\d+ · /, ''))}</b>
      <p class="sf-sp-pr">${esc(L.principle)}</p><p class="sf-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>SEO-аудит як система: 8 послідовних рівнів</h2>
    <p class="lead">Не «мета-теги + помилки індексації», а перевірка здатності сайту системно отримувати органіку й конвертувати її в гроші. Логіка: Стратегія → Структура → Семантика → Технічний → Постраничний → Поблоковий → Проблеми/Можливості → Roadmap.</p>
    <div class="sf-sp">${items}</div></section>`;
}

function score(r: SeoFlowReport): string {
  const rows = r.score.zones.map((z: SeoScoreZone) => {
    const pct = Math.round((z.score / 10) * 100);
    return `<tr><td class="sfs-l">${esc(z.label)}</td>
      <td class="sfs-bar"><span class="bar">${z.measured ? `<span class="fill ${s10(z.score)}" style="width:${pct}%"></span>` : ''}</span></td>
      <td class="sfs-v">${z.measured ? `<b class="${s10(z.score)}">${z.score}</b><i>/10</i>` : '<span class="sfs-na">н/д</span>'}</td>
      <td class="sfs-n">${esc(z.note)}</td></tr>`;
  }).join('');
  const naCount = r.score.zones.filter((z) => !z.measured).length;
  return `<section class="block"><h2>SEO Score — зони оцінки</h2>
    <p class="lead">Звід SEO в один бал за зонами. ${naCount} зон (SERP/CTR, Backlinks, Competitors, Local, International) чесно позначені «н/д» — вони вимірюються лише з доступом до Search Console / GA / backlink-інструментів і не входять у середнє.</p>
    ${r.score.overall === null
      ? `<div class="sf-shead"><span class="sf-scap"><b>SEO Score не вимірювався.</b><br><i>${scoreText(r.score)}. Бал за зонами зʼявиться після обходу — без нього число складалося б із базових констант формул, а не зі спостережень.</i></span></div>`
      : `<div class="sf-shead"><span class="sf-sbig ${s10(r.score.overall)}">${r.score.overall}</span><span class="sf-scap">/10 — SEO Score<br><i>середнє за ${r.score.coverage.zonesMeasured} виміряними зонами з ${r.score.coverage.zonesTotal} · розібрано сторінок: ${r.score.coverage.pagesAnalysed}</i></span></div>`}
    <table class="sfs"><tbody>${rows}</tbody></table></section>`;
}

function strategy(r: SeoFlowReport): string {
  const rows = r.strategy.map((s) => `<tr>
    <td class="sf-pri"><span class="chip ${PRI[s.priority]}">${esc(s.priority)}</span></td>
    <td class="sf-b">${esc(s.direction)}</td><td class="sf-mut">${esc(s.purpose)}</td><td>${esc(s.drives)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт 1 · SEO Strategy Map</h2>
    <p class="lead">Що і навіщо просуваємо: які напрями мають отримувати органічний попит і чому. Технічні виправлення без стратегії трафіку не додають.</p>
    <table><thead><tr><th>Пріор.</th><th>Напрям</th><th>Тип</th><th>Що генерує</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function semantic(r: SeoFlowReport): string {
  const rows = r.semantic.map((s) => `<tr>
    <td class="sf-b">${esc(s.cluster)}</td><td class="sf-mut">${esc(intentLabel(s.intent))}</td>
    <td class="sf-url">${esc(s.url)}</td><td>${esc(s.pageType)}</td>
    <td class="sf-st"><span class="sf-badge ${ST[s.status]}">${statusLabel(s.status)}</span></td>
    <td class="sf-pri"><span class="chip ${PRI[s.priority]}">${esc(s.priority)}</span></td></tr>`).join('');
  return `<section class="block"><h2>Артефакт 2 · Semantic Map (Keyword → Intent → URL)</h2>
    <p class="lead">Кожен важливий кластер має мати власника-URL правильного типу. Принцип: не ранжувати неправильний тип сторінки під правильний запит.</p>
    <table><thead><tr><th>Кластер запитів</th><th>Intent</th><th>URL</th><th>Тип сторінки</th><th>Стан</th><th>Пріор.</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function technical(r: SeoFlowReport): string {
  const rows = r.technical.map((t) => `<tr>
    <td class="sf-area">${esc(t.area)}</td><td class="sf-b">${esc(t.check)}</td>
    <td class="sf-st"><span class="sf-badge ${ST[t.status]}">${STW[t.status]}</span></td>
    <td class="sf-mut">${esc(t.detail)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт 3 · Technical SEO Map</h2>
    <p class="lead">Crawl → Index → Canonical → Redirect → Schema → Mobile → Performance. В індексі має бути потрібне, а не все підряд.</p>
    <table class="sf-tech"><thead><tr><th>Зона</th><th>Перевірка</th><th>Стан</th><th>Деталі</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function pageCards(r: SeoFlowReport): string {
  if (!r.pageCards.length) return '';
  const cards = r.pageCards.map((c: SeoPageCard) => `<div class="sf-pc">
    <div class="sf-pc-h"><span class="sf-pg">${esc(c.page)}</span><b>${esc(c.url)}</b>
      <span class="sf-mut">intent: ${esc(intentLabel(c.targetIntent))}</span>
      <span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="sf-pc-grid">
      <div><span class="sf-k">Індексація</span>${esc(c.indexation)}</div>
      <div><span class="sf-k">Canonical</span>${esc(c.canonical)}</div>
      <div><span class="sf-k">Title</span>${esc(c.title)}</div>
      <div><span class="sf-k">Description</span>${esc(c.description)}</div>
      <div><span class="sf-k">H1</span>${esc(c.h1)}</div>
      <div><span class="sf-k">Schema</span>${esc(c.schema)}</div>
      <div><span class="sf-k">Перелінковка</span>${esc(c.internalLinks)}</div>
      <div class="sf-gap"><span class="sf-k">Gap</span>${esc(c.gap)}</div>
    </div>
    <div class="sf-pc-reco"><b>Рекомендація:</b> ${esc(c.recommendation)}</div>
  </div>`).join('');
  return `<section class="block"><h2>Артефакт 4 · Постраничний SEO-аудит</h2>
    <p class="lead">Кожна ключова сторінка — власна картка: intent, індексація, on-page, schema, перелінковка, gap і рекомендація.</p>${cards}</section>`;
}

function blockCards(r: SeoFlowReport): string {
  if (!r.blockCards.length) return '';
  const cards = r.blockCards.map((c: SeoBlockCard) => `<div class="sf-bc">
    <div class="sf-bc-h"><span class="sf-pg">${esc(c.page)}</span><b>${esc(c.name)}</b>
      <span class="sf-bc-score ${s5(c.score)}">${c.score}<i>/5</i></span>
      <span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="sf-bc-cols">
      <div class="sf-now"><div class="sf-lbl">ЗАРАЗ</div><p>${esc(c.now)}</p></div>
      <div class="sf-should"><div class="sf-lbl good">ЯК МАЄ БУТИ</div><p>${esc(c.should)}</p></div>
    </div>
    <div class="sf-axes">${mini('SEO', c.seoValue)}${mini('Контент', c.content)}${mini('Перелінковка', c.linking)}${mini('AEO', c.aeo)}</div>
    <div class="sf-bc-reco"><b>Рекомендація:</b> ${esc(c.recommendation)}</div>
    <div class="sf-bc-eff"><b>Ефект:</b> ${esc(c.effect)}</div>
  </div>`).join('');
  return `<section class="block"><h2>Артефакт 5 · Поблоковий SEO-аудит</h2>
    <p class="lead">Кожен SEO-значущий блок окремо за принципом: Зараз → Як має бути → оцінка SEO/Контент/Перелінковка/AEO → рекомендація → ефект. Сильні блоки (за еталоном) не входять.</p>${cards}</section>`;
}

function problems(r: SeoFlowReport): string {
  if (!r.problems.length) return '';
  const rows = r.problems.map((p) => `<div class="sf-prob">
    <div class="sf-prob-h"><span class="chip ${PRI[p.priority]}">${esc(p.priority)}</span><b>${esc(p.problem)}</b><span class="sf-eff">Effort ${p.effort}/5</span></div>
    <div class="sf-prob-g">
      <div><span class="sf-k">Де</span>${esc(p.where)}</div>
      <div><span class="sf-k">SEO-наслідок</span>${esc(p.seoConseq)}</div>
      <div><span class="sf-k">Бізнес-наслідок</span>${esc(p.bizConseq)}</div>
      <div class="sf-prob-should"><span class="sf-k">Як має бути</span>${esc(p.should)}</div>
    </div>
    <div class="sf-bc-eff"><b>Ефект:</b> ${esc(p.effect)}</div></div>`).join('');
  const opps = r.opportunities.map((o) => `<div class="sf-opp">
    <div class="sf-opp-h"><span class="chip ${PRI[o.priority]}">${esc(o.priority)}</span><b>${esc(o.title)}</b></div>
    <div class="sf-opp-chain">${esc(o.chain)}</div>
    <div class="sf-bc-eff"><b>Ефект:</b> ${esc(o.effect)}</div></div>`).join('');
  return `<section class="block"><h2>Артефакт 6 · SEO Problem & Opportunity Map</h2>
    <p class="lead">Кожна проблема — з SEO- і бізнес-наслідком, а не просто «помилка». Плюс карта можливостей: як SEO-аудит стає планом росту, а не списком помилок.</p>
    ${rows}
    <h3 class="sf-h3">Карта можливостей росту</h3>${opps}</section>`;
}

function roadmap(r: SeoFlowReport): string {
  if (!r.roadmap.length) return '';
  const st = r.roadmap.map((s, i) => `<div class="sf-rm"><div class="sf-rm-n">${i + 1}</div>
    <div class="sf-rm-b"><b>${esc(s.stage)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  return `<section class="block"><h2>Артефакт 7 · SEO Growth Roadmap</h2>
    <p class="lead">План росту органіки за етапами: Critical Fixes → Quick Wins → Structural → Content → Authority → Scale → GEO/AEO.</p>
    <div class="sf-rms">${st}</div></section>`;
}

function intentLabel(i: string): string { return ({ commercial: 'комерційний', transactional: 'транзакційний', informational: 'інформаційний', navigational: 'навігаційний' } as Record<string, string>)[i] ?? i; }
function statusLabel(s: string): string { return ({ ok: 'є, за еталоном', weak: 'є, слабко', missing: 'немає URL' } as Record<string, string>)[s] ?? s; }

const SF_CSS = `
  .sf-sp{display:flex;flex-direction:column;}
  .sf-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .sf-sp-row:last-child{border-bottom:0;}
  .sf-sp-id{flex:0 0 30px;font-weight:800;color:var(--lime);font-size:12px;}
  .sf-sp-b b{font-size:10.5px;} .sf-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .sf-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .sf-shead{display:flex;align-items:center;gap:12px;margin:4px 0 8px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .sf-sbig{font-size:34px;font-weight:800;line-height:1;} .sf-scap{font-size:10px;color:#333;} .sf-scap i{color:var(--muted);font-size:8px;font-style:normal;}
  .sfs{width:100%;} .sfs td{padding:3px 6px;vertical-align:middle;border-bottom:1px solid var(--line);}
  .sfs-l{font-weight:700;white-space:nowrap;width:150px;} .sfs-bar{width:110px;} .sfs-v{white-space:nowrap;width:44px;text-align:right;} .sfs-v b{font-size:12px;font-weight:800;} .sfs-v i{color:var(--muted);font-size:8px;font-style:normal;} .sfs-n{color:#555;font-size:9px;} .sfs-na{color:var(--muted);font-size:9px;}
  .lime{color:var(--lime);}
  .sf-pri{white-space:nowrap;} .sf-b{font-weight:700;} .sf-mut{color:var(--muted);} .sf-url{font-family:monospace;font-size:8.5px;color:#334;} .sf-area{font-weight:700;color:var(--lime);font-size:8.5px;white-space:nowrap;}
  .sf-st{white-space:nowrap;text-align:center;}
  .sf-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .sf-badge.ok{background:#e7f6ec;color:var(--ok);} .sf-badge.check{background:#fdf6e7;color:var(--check);} .sf-badge.gap{background:#fdeaea;color:var(--gap);} .sf-badge.na{background:#eef0f3;color:var(--muted);}
  .sf-tech td{font-size:9px;}
  /* page card */
  .sf-pc{border:1px solid var(--line);border-radius:7px;margin:7px 0;overflow:hidden;page-break-inside:avoid;}
  .sf-pc-h{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);}
  .sf-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .sf-pc-h b{font-size:10.5px;flex:0 0 auto;font-family:monospace;} .sf-pc-h .chip{margin-left:auto;}
  .sf-pc-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;padding:7px 9px;font-size:9px;}
  .sf-pc-grid>div{padding:2px 0;border-bottom:1px solid #f1f2f4;} .sf-gap{grid-column:1 / -1;color:#7a1f1f;}
  .sf-k{display:inline-block;min-width:88px;color:var(--muted);font-weight:700;font-size:8px;text-transform:uppercase;letter-spacing:.3px;}
  .sf-pc-reco{padding:6px 9px;font-size:9px;background:#fbfcfd;border-top:1px solid var(--line);} .sf-pc-reco b{color:var(--muted);}
  /* block card */
  .sf-bc{border:1px solid var(--line);border-radius:7px;margin:7px 0;overflow:hidden;page-break-inside:avoid;}
  .sf-bc-h{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);}
  .sf-bc-h b{font-size:11px;flex:1;} .sf-bc-score{font-weight:800;font-size:12px;} .sf-bc-score i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;}
  .sf-bc-cols{display:grid;grid-template-columns:1fr 1fr;}
  .sf-now,.sf-should{padding:7px 9px;font-size:9px;} .sf-now{border-right:1px solid var(--line);background:#fcfcfc;}
  .sf-lbl{font-size:8px;font-weight:800;letter-spacing:.5px;color:var(--muted);margin-bottom:4px;} .sf-lbl.good{color:var(--ok);}
  .sf-now p,.sf-should p{margin:0;line-height:1.35;color:#333;}
  .sf-axes{display:flex;border-top:1px solid var(--line);} .sfa-mini{flex:1;text-align:center;padding:5px 2px;border-right:1px solid var(--line);} .sfa-mini:last-child{border-right:0;}
  .sfa-mini span{display:block;font-size:7.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;} .sfa-mini b{font-size:12px;font-weight:800;} .sfa-mini b i{font-size:7px;color:var(--muted);font-weight:400;font-style:normal;}
  .sf-bc-reco{padding:6px 9px;font-size:9px;border-top:1px solid var(--line);background:#fbfcfd;} .sf-bc-reco b{color:var(--muted);}
  .sf-bc-eff{padding:5px 9px 7px;font-size:9px;color:var(--ok);font-weight:600;} .sf-bc-eff b{color:var(--ok);}
  /* problems */
  .sf-prob{border:1px solid var(--line);border-radius:6px;margin:6px 0;padding:7px 9px;page-break-inside:avoid;}
  .sf-prob-h{display:flex;align-items:center;gap:7px;} .sf-prob-h b{font-size:10px;flex:1;} .sf-eff{font-size:8px;color:var(--muted);white-space:nowrap;}
  .sf-prob-g{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;margin:5px 0;font-size:8.5px;} .sf-prob-should{grid-column:1 / -1;}
  .sf-opp{border:1px solid var(--line);border-left:3px solid var(--lime);border-radius:0 6px 6px 0;margin:6px 0;padding:7px 9px;}
  .sf-opp-h{display:flex;align-items:center;gap:7px;} .sf-opp-h b{font-size:10px;} .sf-opp-chain{font-size:9px;color:#334;margin:4px 0;font-family:monospace;}
  .sf-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  /* roadmap */
  .sf-rms{display:flex;flex-direction:column;gap:6px;}
  .sf-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .sf-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .sf-rm-b b{font-size:10px;} .sf-rm-b ul{margin:3px 0 0;padding-left:16px;} .sf-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
`;

export function renderSeoFlowHtml(r: SeoFlowReport): string {
  const coverHtml = cover({
    kicker: 'SEO-аудит як система',
    title: 'SEO-аудит: від стратегії до органічного росту',
    verdict: r.score.overall === null
      ? `SEO Score ${scoreText(r.score)}.`
      : `SEO Score — ${r.score.overall}/10 за ${r.score.coverage.zonesMeasured} виміряними зонами (зовнішній обхід, ${r.score.coverage.pagesAnalysed} стор.).`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'SEO Score', value: scoreText(r.score) },
      { label: 'Проблем / можливостей', value: `${r.problems.length} / ${r.opportunities.length}` },
    ],
    note: `<b>Ширше за «мета-теги + індексацію»:</b> це перевірка, чи здатний сайт СИСТЕМНО отримувати органіку, масштабувати видимість і конвертувати її в гроші. Видача — 8 артефактів (Strategy · Semantic · Technical · Page · Block · Problem/Opportunity · Score · Roadmap), пов'язаних у ланцюг Structure → UX/UI → Content → SEO → CRO. Зони, що вимірюються лише з доступом (SERP/CTR, Backlinks, Competitors), позначені «н/д».`,
  });
  const foot = pageFooter('Зовнішній SEO-аудит: оцінка за сигналами обходу (дерево, on-page, schema, canonical, sitemap/robots, linkHealth, llms.txt). SERP/CTR, backlinks, конкурентна видимість — після доступу до Search Console / GA / backlink-інструментів. Відсутність даних не видається за факт.');
  return doc(`SEO-аудит як система · ${r.client}`,
    coverHtml + spine(r) + score(r) + strategy(r) + semantic(r) + technical(r) + pageCards(r) + blockCards(r) + problems(r) + roadmap(r) + foot,
    SF_CSS);
}
