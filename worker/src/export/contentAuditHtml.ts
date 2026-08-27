/**
 * Контент-аудит — клієнтський PDF: посторінково (усі розібрані
 * сторінки) — повнота / корисність / переконливість / відповідність інтенту
 * (1–5) + консалтинговий каркас: методологія, сильні/слабкі сторони,
 * рекомендації, підсумковий висновок. Єдиний візуальний стандарт (reportShell).
 */
import { esc, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import { svgRadar } from './charts.js';
import type { ContentReport, ContentRow } from '../contentaudit.js';
import type { ContentFlowReport, ContentBlockCard, CScoreAxis } from '../contentflow.js';

const rateCls = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const critCls = (c: string) => (c === 'H' ? 'gap' : c === 'M' ? 'check' : 'ok');
const critWord = (c: string) => (c === 'H' ? 'висока' : c === 'M' ? 'середня' : 'низька');
const rate = (v: number) => `<span class="rate ${rateCls(v)}">${v}<i>/5</i></span>`;

/* ══════════════ Контент-аудит як цілісна система (C1→C7) ══════════════ */
const PRI_CLS: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const s10cls = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const s5cls = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const miniAxis = (label: string, v: number) => `<div class="cfa-mini"><span>${label}</span><b class="${s5cls(v)}">${v}<i>/5</i></b></div>`;

// C-спайн: послідовність аудиту контенту.
function cfSpine(flow: ContentFlowReport): string {
  const items = flow.spine.map((L) => `<div class="cf-spine-row">
    <div class="cf-spine-id">${esc(L.id)}</div>
    <div class="cf-spine-body"><b>${esc(L.title.replace(/^C\d+ · /, ''))}</b>
      <p class="cf-spine-pr">${esc(L.principle)}</p>
      <p class="cf-spine-st">${esc(L.state)}</p></div>
  </div>`).join('');
  return `<section class="block"><h2>Контент-аудит як система: 7 послідовних рівнів</h2>
    <p class="lead">Не «100 зауважень до текстів», а карта: архітектура → поблоковий розбір → розриви → перелінковка → єдиний бал → рішення → план. Кожен рівень спирається на попередній.</p>
    <div class="cf-spine">${items}</div></section>`;
}

// Content Score — 10 напрямків /10.
function cfScore(flow: ContentFlowReport): string {
  const rows = flow.score.axes.map((x: CScoreAxis) => {
    const measured = x.score > 0 || x.key !== 'freshness';
    const pct = Math.round((x.score / 10) * 100);
    return `<tr>
      <td class="cfs-l">${esc(x.label)}</td>
      <td class="cfs-bar"><span class="bar">${measured ? `<span class="fill ${s10cls(x.score)}" style="width:${pct}%"></span>` : ''}</span></td>
      <td class="cfs-v">${measured ? `<b class="${s10cls(x.score)}">${x.score}</b><i>/10</i>` : '<span class="cfs-na">н/д</span>'}</td>
      <td class="cfs-n">${esc(x.note)}</td></tr>`;
  }).join('');
  return `<section class="block"><h2>Content Score — 10 напрямків</h2>
    <p class="lead">Звід оцінки контенту в один бал за 10 напрямками. «Актуальність» (ціни/наявність/дати) — вимір, який чесно вимірюється лише після доступу до CMS, тому не входить у середнє.</p>
    ${flow.score.overall === null
      ? `<div class="cf-scorehead"><span class="cf-score-cap"><b>Content Score не вимірювався.</b><br><i>Жоден напрям не отримав даних — обхід не дав сторінок для розбору.</i></span></div>`
      : `<div class="cf-scorehead"><span class="cf-score-big ${s10cls(flow.score.overall)}">${flow.score.overall}</span><span class="cf-score-cap">/10 — загальний Content Score<br><i>середнє за ${flow.score.axes.filter((a) => a.score > 0).length} виміряними напрямками</i></span></div>`}
    <table class="cfs"><tbody>${rows}</tbody></table></section>`;
}

// Інвентар типів контенту.
function cfTypes(flow: ContentFlowReport): string {
  const rows = flow.types.map((t) => `<tr class="${t.present ? '' : 'cf-miss'}">
    <td class="cft-s">${t.present ? '<span class="ok">є</span>' : '<span class="gap">немає</span>'}</td>
    <td class="cft-n">${esc(t.name)}</td>
    <td>${esc(t.purpose)}</td>
    <td class="cft-st">${esc(t.stage)}</td></tr>`).join('');
  const missing = flow.types.filter((t) => !t.present).length;
  return `<section class="block"><h2>Інвентар типів контенту</h2>
    <p class="lead">Які типи контенту існують на сайті і чи є з них система. Відсутні типи (${missing}) — це не «погані тексти», а прогалини в самій системі контенту.</p>
    <table class="cft"><thead><tr><th>Стан</th><th>Тип контенту</th><th>Навіщо існує</th><th>Етап воронки</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

// Поблокова контент-картка (повна анатомія Fragstore).
function cfCard(c: ContentBlockCard): string {
  const links = c.links.length ? `<div class="cfc-links"><b>Веде далі:</b> ${c.links.map(esc).join(' · ')}</div>` : '<div class="cfc-links cfc-dead"><b>Веде далі:</b> — глухий кут, виходів немає</div>';
  const cta = c.cta ? `<span class="cfc-cta">CTA: ${esc(c.cta)}</span>` : '';
  return `<div class="cfc">
    <div class="cfc-head"><span class="cfc-pg">${esc(c.page)}</span><b>${esc(c.name)}</b>
      <span class="cfc-score ${s5cls(c.score)}">${c.score}<i>/5</i></span>
      <span class="cfc-pri ${PRI_CLS[c.priority]}">${esc(c.priority)}</span></div>
    <div class="cfc-meta"><span><b>Призначення:</b> ${esc(c.purpose)}</span><span><b>ЦА:</b> ${esc(c.audience)}</span><span><b>Задача:</b> ${esc(c.task)}</span></div>
    <div class="cfc-cols">
      <div class="cfc-now"><div class="cfc-lbl">ЗАРАЗ</div><p>${esc(c.now)}</p>
        <div class="cfc-prob"><b>Проблема:</b> ${esc(c.problem)}</div>
        <div class="cfc-miss"><b>Бракує:</b> ${esc(c.missing)}</div></div>
      <div class="cfc-should"><div class="cfc-lbl good">ЯК МАЄ БУТИ</div><p>${esc(c.should)}</p></div>
    </div>
    <div class="cfc-axes">${miniAxis('UX', c.ux)}${miniAxis('CRO', c.cro)}${miniAxis('SEO', c.seo)}${miniAxis('GEO/AEO', c.geo)}</div>
    ${links}${cta ? `<div class="cfc-ctarow">${cta}</div>` : ''}
    <div class="cfc-reco"><b>Рекомендація:</b> ${esc(c.recommendation)}</div>
    <div class="cfc-eff"><b>Ефект:</b> ${esc(c.effect)}</div>
  </div>`;
}

function cfCards(flow: ContentFlowReport): string {
  if (!flow.cards.length) return '';
  return `<section class="block"><h2>Поблоковий контент-аудит ключових сторінок</h2>
    <p class="lead">Кожен контентний блок ключових сторінок — окрема картка за принципом: Призначення → Зараз → Проблема → Як має бути → оцінка UX/CRO/SEO/GEO → рекомендація → ефект. Сильні блоки (за еталоном) до карток не входять.</p>
    ${flow.cards.map(cfCard).join('')}</section>`;
}

// Content Gap Map.
function cfGaps(flow: ContentFlowReport): string {
  if (!flow.gaps.length) return '';
  const rows = flow.gaps.map((g) => `<tr>
    <td class="cfg-p"><span class="cfc-pri ${PRI_CLS[g.priority]}">${esc(g.priority)}</span></td>
    <td class="cfg-t">${esc(g.title)}</td>
    <td>${esc(g.why)}</td>
    <td class="cfg-c">${esc(g.create)}</td>
    <td class="cfg-w">${esc(g.where)}</td></tr>`).join('');
  return `<section class="block"><h2>Content Gap Map — чого контенту немає</h2>
    <p class="lead">Не «що переписати», а якого контенту бракує взагалі — за потребами користувача, попитом і воронкою. Це джерело нового контенту, а не правок наявного.</p>
    <table class="cfg"><thead><tr><th>Пріор.</th><th>Розрив</th><th>Чому важливо</th><th>Що створити</th><th>Де розмістити</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

// Карта перелінковки.
function cfLinking(flow: ContentFlowReport): string {
  const l = flow.linking;
  const orphan = l.orphanPages.length ? `<p class="lead" style="margin-top:6px"><b>Потенційно orphan-сторінки</b> (є в карті, але без вхідних зв'язків у розборі): ${l.orphanPages.map((o) => `${esc(o.label)} <span class="p-url" style="display:inline">(${esc(o.url)})</span>`).join(', ')}.</p>` : '';
  const proj = (l.keyPageLinksNow || l.keyPageLinksTarget) ? `<div class="cf-proj"><div class="cf-proj-now"><span class="cf-proj-n">${l.keyPageLinksNow}</span><span class="cf-proj-l">внутр. посилань дають сильні блоки головної зараз</span></div><div class="cf-proj-arr">→</div><div class="cf-proj-tgt"><span class="cf-proj-n">${l.keyPageLinksTarget}</span><span class="cf-proj-l">дала б повна контентна композиція</span></div></div>` : '';
  return `<section class="block"><h2>Карта перелінковки контенту</h2>
    <p class="lead">Контент має вести далі по ланцюгу: інформаційна сторінка → хаб → категорія → товар → комерційна сторінка. Блоки без виходів — глухі кути, які «зливають» увагу.</p>
    <div class="cf-lk">
      <div class="cf-lk-m"><span class="cf-lk-v">${l.uniqueInternalUrls}</span><span class="cf-lk-l">унік. внутр. URL у карті сайту</span></div>
      <div class="cf-lk-m"><span class="cf-lk-v">${l.homeOutlinks}</span><span class="cf-lk-l">внутр. посилань на головній</span></div>
      <div class="cf-lk-m"><span class="cf-lk-v ${l.deadEndBlocks ? 'gap' : 'ok'}">${l.deadEndBlocks}</span><span class="cf-lk-l">контентних блоків-глухих кутів</span></div>
      <div class="cf-lk-m"><span class="cf-lk-v ${l.orphanPages.length ? 'check' : 'ok'}">${l.orphanPages.length}</span><span class="cf-lk-l">потенційно orphan-сторінок</span></div>
    </div>
    ${proj}${orphan}</section>`;
}

// Рішення Keep/Rewrite/Create/Merge/Remove.
function cfDecisions(flow: ContentFlowReport): string {
  const map: Record<string, string> = { Keep: 'ok', Rewrite: 'check', Create: 'gap', Merge: 'lime', Remove: 'muted' };
  const cells = flow.decisions.map((d) => `<div class="cf-dec">
    <span class="cf-dec-n ${map[d.verb] ?? ''}">${d.count}</span>
    <span class="cf-dec-v">${esc(d.verb)}</span>
    <span class="cf-dec-note">${esc(d.note)}</span></div>`).join('');
  return `<section class="block"><h2>Рішення по контенту</h2>
    <p class="lead">Кожна одиниця контенту отримує рішення: залишити, переписати, створити, об'єднати чи видалити. Це переводить аудит у конкретні задачі.</p>
    <div class="cf-decs">${cells}</div></section>`;
}

// Контентний roadmap.
function cfRoadmap(flow: ContentFlowReport): string {
  if (!flow.roadmap.length) return '';
  const phases = flow.roadmap.map((ph, i) => `<div class="cf-rm">
    <div class="cf-rm-n">${i + 1}</div>
    <div class="cf-rm-b"><b>${esc(ph.phase)}</b><ul>${ph.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div>
  </div>`).join('');
  return `<section class="block"><h2>Контентний Roadmap</h2>
    <p class="lead">Фінал контент-аудиту — не список зауважень, а послідовний план: швидкі перемоги → переписування → новий контент → перелінковка → SEO/GEO/AEO.</p>
    <div class="cf-rms">${phases}</div></section>`;
}

const CF_CSS = `
  .cf-spine{display:flex;flex-direction:column;gap:0;}
  .cf-spine-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;}
  .cf-spine-row:last-child{border-bottom:0;}
  .cf-spine-id{flex:0 0 30px;font-weight:800;color:var(--lime);font-size:12px;}
  .cf-spine-body b{font-size:10.5px;} .cf-spine-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .cf-spine-st{margin:0;color:var(--muted);font-size:8.5px;}
  .cf-scorehead{display:flex;align-items:center;gap:12px;margin:4px 0 8px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .cf-score-big{font-size:34px;font-weight:800;line-height:1;} .cf-score-cap{font-size:10px;color:#333;} .cf-score-cap i{color:var(--muted);font-size:8px;font-style:normal;}
  .cfs{width:100%;} .cfs td{padding:3px 6px;vertical-align:middle;border-bottom:1px solid var(--line);}
  .cfs-l{font-weight:700;white-space:nowrap;width:150px;} .cfs-bar{width:120px;} .cfs-v{white-space:nowrap;width:44px;text-align:right;} .cfs-v b{font-size:12px;font-weight:800;} .cfs-v i{color:var(--muted);font-size:8px;font-style:normal;}
  .cfs-n{color:#555;font-size:9px;} .cfs-na{color:var(--muted);font-size:9px;}
  .lime{color:var(--lime);}
  .cft td,.cfg td{font-size:9px;} .cft-s,.cfg-p{white-space:nowrap;} .cft-n{font-weight:700;} .cft-st{color:var(--muted);white-space:nowrap;} .cf-miss td{background:#fdf2f2;}
  .cft-s .ok,.cft-s .gap{font-weight:800;font-size:9px;}
  /* контент-картка */
  .cfc{border:1px solid var(--line);border-radius:7px;margin:8px 0;overflow:hidden;page-break-inside:avoid;}
  .cfc-head{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);}
  .cfc-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .cfc-head b{font-size:11px;flex:1;} .cfc-score{font-weight:800;font-size:12px;} .cfc-score i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;}
  .cfc-pri{font-size:8px;font-weight:800;color:#fff;padding:2px 8px;border-radius:12px;} .cfc-pri.gap{background:var(--gap);} .cfc-pri.check{background:var(--check);} .cfc-pri.lime{background:var(--lime);} .cfc-pri.ok{background:var(--ok);}
  .cfc-meta{display:flex;flex-wrap:wrap;gap:4px 14px;padding:6px 9px;font-size:8.5px;color:#444;border-bottom:1px solid var(--line);} .cfc-meta b{color:var(--muted);font-weight:700;}
  .cfc-cols{display:grid;grid-template-columns:1fr 1fr;}
  .cfc-now,.cfc-should{padding:7px 9px;font-size:9px;} .cfc-now{border-right:1px solid var(--line);background:#fcfcfc;}
  .cfc-lbl{font-size:8px;font-weight:800;letter-spacing:.5px;color:var(--muted);margin-bottom:4px;} .cfc-lbl.good{color:var(--ok);}
  .cfc-now p,.cfc-should p{margin:0 0 5px;line-height:1.35;color:#333;}
  .cfc-prob{color:#7a1f1f;font-size:8.5px;margin-bottom:3px;} .cfc-miss{color:#8a5a00;font-size:8.5px;} .cfc-prob b,.cfc-miss b{font-weight:700;}
  .cfc-axes{display:flex;gap:0;border-top:1px solid var(--line);}
  .cfa-mini{flex:1;text-align:center;padding:5px 2px;border-right:1px solid var(--line);} .cfa-mini:last-child{border-right:0;}
  .cfa-mini span{display:block;font-size:7.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;} .cfa-mini b{font-size:12px;font-weight:800;} .cfa-mini b i{font-size:7px;color:var(--muted);font-weight:400;font-style:normal;}
  .cfc-links{padding:5px 9px;font-size:8.5px;color:#333;border-top:1px solid var(--line);} .cfc-links b{color:var(--muted);} .cfc-dead{color:var(--gap);} .cfc-dead b{color:var(--gap);}
  .cfc-ctarow{padding:0 9px 5px;} .cfc-cta{font-size:8px;font-weight:700;color:var(--lime);background:#f2f8e8;border:1px solid #dcecc4;border-radius:10px;padding:2px 8px;}
  .cfc-reco{padding:6px 9px;font-size:9px;color:#1f2937;border-top:1px solid var(--line);background:#fbfcfd;} .cfc-reco b{color:var(--muted);}
  .cfc-eff{padding:5px 9px 7px;font-size:9px;color:var(--ok);font-weight:600;} .cfc-eff b{color:var(--ok);}
  /* перелінковка */
  .cf-lk{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0;}
  .cf-lk-m{flex:1;min-width:110px;border:1px solid var(--line);border-radius:6px;padding:8px 10px;text-align:center;background:var(--soft);}
  .cf-lk-v{display:block;font-size:22px;font-weight:800;line-height:1.1;} .cf-lk-l{display:block;font-size:8px;color:var(--muted);margin-top:2px;}
  .cf-proj{display:flex;align-items:center;gap:12px;margin:8px 0;padding:9px 12px;border:1px solid var(--line);border-radius:6px;}
  .cf-proj-now,.cf-proj-tgt{flex:1;text-align:center;} .cf-proj-n{display:block;font-size:26px;font-weight:800;} .cf-proj-tgt .cf-proj-n{color:var(--ok);} .cf-proj-l{display:block;font-size:8px;color:var(--muted);} .cf-proj-arr{font-size:20px;color:var(--lime);font-weight:800;}
  /* рішення */
  .cf-decs{display:flex;gap:8px;flex-wrap:wrap;}
  .cf-dec{flex:1;min-width:100px;border:1px solid var(--line);border-radius:6px;padding:8px 10px;text-align:center;}
  .cf-dec-n{display:block;font-size:24px;font-weight:800;line-height:1;} .cf-dec-n.muted{color:var(--muted);} .cf-dec-v{display:block;font-size:10px;font-weight:800;margin:2px 0;} .cf-dec-note{display:block;font-size:8px;color:var(--muted);line-height:1.3;}
  /* roadmap */
  .cf-rms{display:flex;flex-direction:column;gap:6px;}
  .cf-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .cf-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .cf-rm-b b{font-size:10px;} .cf-rm-b ul{margin:3px 0 0;padding-left:16px;} .cf-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
`;

export function renderContentAuditHtml(r: ContentReport, flow?: ContentFlowReport | null): string {
  const overall = ((r.avg.completeness + r.avg.usefulness + r.avg.persuasiveness + r.avg.intent) / 4);

  const coverHtml = cover({
    kicker: 'Контент-аудит',
    title: 'Контент-аудит',
    verdict: r.verdict, // вивід — окремим рядком, а не гігантським заголовком
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Сторінок розібрано', value: String(r.rows.length) },
      { label: 'Середня здатність вести до рішення', value: `${overall.toFixed(1)}/5` },
    ],
    note: `<b>Що оцінюємо:</b> не «якість тексту», а здатність контенту знижувати невизначеність і допомагати комерційному рішенню. У зовнішньому аудиті — за наявністю вирішальних блоків (опис, характеристики, довіра, відповіді); реальна переконливість тексту уточнюється з доступом до контенту після передачі доступів (наступний етап). Відсутність даних не видається за факт.`,
  });

  const meth = methodologySection({
    goal: 'Оцінити, чи веде контент кожної розібраної сторінки покупця до рішення — і де він втрачає покупця.',
    sources: [`Зовнішній обхід: ${r.rows.length} сторінок, відрендерений DOM`, 'Каталог вирішальних блоків (опис, характеристики, довіра, відповіді)', 'Еталонні вимоги до контенту за типами сторінок'],
    scope: `Усі розібрані сторінки всіх типів (${r.rows.length} шт.), чотири виміри × шкала 1–5.`,
    limits: 'Зовнішній аудит оцінює наявність і склад вирішальних блоків. Якість формулювань, унікальність і відповідність пошуковому попиту перевіряються після передачі доступів (наступний етап; доступ до CMS, Search Console).',
  });

  // Методика: що саме означає кожен вимір і кожна оцінка — щоб шкала
  // читалася без усних пояснень.
  const legend = `<section class="block"><h2>Методика оцінки: чотири виміри, шкала 1–5</h2>
    <table class="lg"><thead><tr><th>Вимір</th><th>Питання, на яке відповідає</th><th>1 — провал</th><th>3 — середина</th><th>5 — еталон</th></tr></thead><tbody>
      <tr><td class="lg-n">Повнота</td><td>Чи є на сторінці вся інформація для рішення?</td><td>ключових блоків немає — покупець іде шукати</td><td>база є, деталі доводиться добувати</td><td>усі питання вибору закриті на сторінці</td></tr>
      <tr><td class="lg-n">Корисність</td><td>Чи допомагає контент зробити вибір швидше?</td><td>текст «для галочки», не допомагає обрати</td><td>допомагає частково (немає порівняння/умов)</td><td>веде за руку: характеристики, умови, відповіді</td></tr>
      <tr><td class="lg-n">Переконливість</td><td>Чи дає сторінка причини повірити?</td><td>ні відгуків, ні гарантій, ні доказів</td><td>частина доказів є, не в точці рішення</td><td>довіра вбудована там, де ухвалюється рішення</td></tr>
      <tr><td class="lg-n">Інтент</td><td>Чи збігається контент із метою візиту?</td><td>сторінка не відповідає на запит, з яким прийшли</td><td>відповідає, але змушує шукати по сторінці</td><td>мета візиту закривається одразу і без тертя</td></tr>
    </tbody></table>
    <p class="lead">Оцінка на цьому шарі ставиться за наявністю і складом вирішальних блоків (спостереження зовнішнього обходу); якість формулювань тексту уточнюється після передачі доступів (наступний етап).</p></section>`;

  const rows = r.rows.map((row: ContentRow) => `<tr>
    <td class="p-type">${esc(row.pageType)}<span class="p-url">${esc(row.url)}</span></td>
    <td class="p-obj">${esc(row.object)}</td>
    <td>${rate(row.completeness)}</td>
    <td>${rate(row.usefulness)}</td>
    <td>${rate(row.persuasiveness)}</td>
    <td>${rate(row.intent)}</td>
    <td class="p-crit ${critCls(row.crit)}">${critWord(row.crit)}</td>
    <td class="p-note">${esc(row.note)}</td>
  </tr>`).join('');
  const radar = `<div class="chart-wrap">${svgRadar([
    { axis: 'Повнота', value: r.avg.completeness },
    { axis: 'Корисність', value: r.avg.usefulness },
    { axis: 'Переконливість', value: r.avg.persuasiveness },
    { axis: 'Інтент', value: r.avg.intent },
  ], { max: 5, title: 'Профіль контенту за 4 вимірами (середнє, 0–5)' })}
    <p class="chart-cap">Провал будь-якої з осей до центру — це місце, де контент перестає вести до рішення. Найкоротша вісь задає, за що братися першим.<sup class="fn">1</sup></p></div>`;
  const table = `<section class="block"><h2>Контент посторінково</h2>
    <p class="lead">Оцінка 1–5 за кожною розібраною сторінкою: 1 — не знімає питання вибору, 5 — веде до рішення без зовнішніх пошуків.</p>
    ${radar}
    <p class="fn-note"><sup>1</sup> Значення — середнє за ${r.rows.length} розібраними сторінками. На зовнішньому шарі оцінка ставиться за наявністю і складом вирішальних блоків; якість формулювань уточнюється після доступу до контенту.</p>
    <table><thead><tr><th>Сторінка</th><th>Об'єкт</th><th>Повнота</th><th>Корисність</th><th>Переконл.</th><th>Інтент</th><th>Критич.</th><th>Коментар</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2">Середнє за ${r.rows.length} сторінками</td><td>${rate(r.avg.completeness)}</td><td>${rate(r.avg.usefulness)}</td><td>${rate(r.avg.persuasiveness)}</td><td>${rate(r.avg.intent)}</td><td colspan="2"></td></tr></tfoot></table></section>`;

  const unparsed = r.unparsed.length ? `<section class="block"><h2>Знайдені, але не розібрані в цьому прогоні</h2>
    <p class="lead">Ці сторінки є на сайті (карта типів), але не потрапили в розбір контенту — їхня оцінка додається розширеним обходом, відсутність оцінки не означає «все гаразд».</p>
    <ul>${r.unparsed.map((u) => `<li><b>${esc(u.label)}</b> — ${esc(u.url)}</li>`).join('')}</ul></section>` : '';

  const sw = swSection(r.strengths, r.weaknesses);
  const recs = recsSection(r.recommendations);
  const concl = conclusionSection(r.conclusion, 'Наступний етап: аудит тексту на живому сайті (унікальність, тональність, попит) + звʼязка контенту з конверсією за даними аналітики.');

  const foot = pageFooter('Зовнішній аудит вітрини: оцінка за наявністю вирішальних блоків, спостереження. Відсутність даних не видається за факт і не приховується.');

  // Контент-аудит як цілісна система (C1→C7) — центральна частина звіту.
  const system = flow
    ? cfSpine(flow) + cfScore(flow) + cfTypes(flow) + cfCards(flow) + cfGaps(flow) + cfLinking(flow) + cfDecisions(flow) + cfRoadmap(flow)
    : '';
  // Постраничний факт-слой лишається як доказова база під системою.
  const factHead = flow ? `<section class="block"><h2>Факт-слой: контент посторінково (доказова база)</h2><p class="lead">Нижче — постраничні оцінки, на яких побудована система вище. Це первинні спостереження обходу за 4 вимірами.</p></section>` : '';

  const extra = `.rate{font-weight:800;font-size:12px;} .rate i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;}
    .rate.ok{color:var(--ok);} .rate.check{color:var(--check);} .rate.gap{color:var(--gap);}
    .p-type{font-weight:700;white-space:nowrap;} .p-type .p-url{display:block;font-weight:400;font-size:8px;color:var(--muted);max-width:110px;overflow:hidden;text-overflow:ellipsis;}
    .p-obj{color:#333;} .p-crit{font-weight:700;white-space:nowrap;} .p-note{color:#333;font-size:10px;}
    tfoot td{border-top:2px solid var(--ink);font-weight:800;padding-top:8px;}`;
  return doc(`Контент-аудит · ${r.client}`, coverHtml + meth + system + factHead + legend + table + unparsed + sw + recs + concl + foot, `${extra}
    .lg td{font-size:9px;color:#333;} .lg-n{font-weight:800;white-space:nowrap;}
    ${CF_CSS}`);
}
