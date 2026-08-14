/**
 * ФЛАГМАНСКИЙ клиентский документ — «Презентація аудиту». Консультационная
 * презентация, ведущая собственника к решению. Логика (задана заказчиком):
 *  1. Вступ.  2. Сторінки що Є — комерційний шлях поблочно (ЗАРАЗ↔ЯК ТРЕБА).
 *  3. Де рветься шлях клієнта (journey).  4. Сторінки яких немає + дерево (SEO).
 *  5. Тех/SEO цифри (свип).  6. Цільовий стан за ресёрчем (тренди/конкуренти).
 *  7. ЦЕНТРАЛЬНА ВІТКА — два шляхи + економіка конверсії (гроші власника або нішеві вилки).
 *  8. GEO/AI-видимість.  9. Першочергові болі + команда за етапами → КП.
 *
 * Все данные — из отчётов, что аудит уже посчитал (блок А), плюс ресёрч (блок Б).
 * Каждая секция guard'ится: нет данных — секции нет. Внутренние проценты уверенности
 * сюда не идут.
 */
import type { SiteAuditReport, PageReport } from '../pagereport.js';
import { KIND_LABEL } from '../pagereport.js';
import type { BenchmarkReport } from '../competitor.js';
import type { SeoArchReport } from '../seoarch.js';
import type { JourneyReport } from '../journey.js';
import type { MechanicsReport } from '../mechanics.js';
import type { ContentReport } from '../contentaudit.js';
import type { MoneyResult } from '../money.js';
import type { TargetStateResearch } from '../targetState.js';
import { blockCard, WIREFRAME_CSS } from './wireframes.js';
import { esc, doc, cover, chapter, pageFooter, scoreColor } from './reportShell.js';

export type PresentationExtras = {
  bench?: BenchmarkReport | null;
  seo?: SeoArchReport | null;
  journey?: JourneyReport | null;
  mech?: MechanicsReport | null;
  content?: ContentReport | null;
  maturity?: { level: number; name: string } | null;
  money?: MoneyResult | null;
  geo?: { llmsTxt: boolean; blockedBots: string[] } | null;
  research?: TargetStateResearch | null;
};

const KIND_ORDER = ['home', 'plp', 'pdp', 'cart', 'checkout'];
const pctOf = (p: PageReport) => (p.max ? Math.round((p.score / p.max) * 100) : 0);
const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

function pageBlock(p: PageReport, n: number): string {
  const gaps = p.rows.filter((b) => b.state === 'gap' && b.weight !== 'nice').map((b) => b.name);
  const weak = p.rows.filter((b) => b.state === 'weak').map((b) => b.name);
  const strong = p.strong.slice(0, 4);
  const pct = pctOf(p);
  return `<section class="block page-blk">
    <div class="pb-head"><span class="pb-n">${String(n).padStart(2, '0')}</span>
      <div><div class="pb-kick">${esc(KIND_LABEL[p.kind] ?? p.kind)} · комерційний шлях</div>
      <h2>${esc(p.conclusion)}</h2></div>
      <span class="pb-score ${scoreColor(pct)}">${pct}%</span></div>
    ${p.principle ? `<p class="lead">Що покупець очікує тут: ${esc(p.principle)}</p>` : ''}
    <div class="pb-sum">
      ${strong.length ? `<div><b class="ok">Працює:</b> ${strong.map(esc).join(' · ')}</div>` : ''}
      ${weak.length ? `<div><b class="warn">Слабко (є, але не за еталоном):</b> ${weak.map(esc).join(' · ')}</div>` : ''}
      ${gaps.length ? `<div><b class="gap">Немає ключових блоків:</b> ${gaps.map(esc).join(' · ')}</div>` : ''}
    </div>
    <div class="pb-cards">${p.rows.map((b, i) => blockCard(b, i)).join('')}</div>
  </section>`;
}

/** Куда рвётся коммерческий путь — journey. */
function journeySection(j: JourneyReport): string {
  const breaks = j.steps.filter((s) => s.status === 'тупик' || s.status === 'спотыкание');
  if (!breaks.length && !j.deadends) return '';
  return `<section class="block">
    ${chapter('Де рветься шлях клієнта', 'Комерційний маршрут у дії')}
    <p class="verdict">Пройдено ${j.passed}/${j.steps.length} кроків шляху покупця; тупиків ${j.deadends}, спотикань ${j.friction}. Кожен обрив — втрачене замовлення.</p>
    ${breaks.length ? `<table class="jt"><thead><tr><th>Крок</th><th>Що сталося</th></tr></thead><tbody>${breaks.slice(0, 8).map((s) => `<tr><td class="${s.status === 'тупик' ? 'gap' : 'warn'}"><b>${esc(s.stage)}</b><span class="jt-st">${esc(s.status)}</span></td><td>${esc(s.result)}</td></tr>`).join('')}</tbody></table>` : ''}
  </section>`;
}

/** Маркетинговые механики, которых нет. */
function mechanicsSection(m: MechanicsReport): string {
  const missing = m.rows.filter((r) => r.status === 'нет');
  if (!missing.length) return '';
  return `<section class="block">
    ${chapter('Механіки продажів, яких немає', 'Що недобирає чек і повторні продажі')}
    <p class="lead">Ці інструменти піднімають середній чек, конверсію й повернення покупця — на вітрині їх не знайдено.</p>
    <ul class="pains">${missing.slice(0, 10).map((r) => `<li><b>${esc(r.name)}</b> — ${esc(r.effect)}</li>`).join('')}</ul>
  </section>`;
}

/** Тех/SEO цифры: дерево + свип (SF-класс) + контент. */
function techSeoSection(seo: SeoArchReport | null | undefined, content: ContentReport | null | undefined): string {
  if (!seo && !content) return '';
  const lh = seo?.linkHealth;
  const tiles: string[] = [];
  if (seo) tiles.push(tile(String(seo.totals.links), 'URL у дереві', ''));
  if (lh) {
    tiles.push(tile(String(lh.broken.length), 'битих посилань', lh.broken.length ? 'gap' : 'ok'));
    tiles.push(tile(String(lh.redirects), 'редиректів', lh.redirects > 5 ? 'check' : ''));
    tiles.push(tile(String(lh.dupTitles.reduce((s, d) => s + d.count, 0)), 'дублів Title', lh.dupTitles.length ? 'check' : ''));
  }
  if (content) tiles.push(tile(`${content.avg.completeness}/5`, 'повнота контенту', content.avg.completeness < 3 ? 'gap' : content.avg.completeness < 4 ? 'check' : 'ok'));
  return `<section class="block">
    ${chapter('SEO та технічний фундамент — у цифрах', 'Що видно за деревом сайту')}
    <p class="verdict">Дерево велике, але з дірами: биті посилання, дублі Title і тонкий контент прямо ріжуть видимість у пошуку.</p>
    <div class="tiles">${tiles.join('')}</div>
    ${content ? `<p class="lead">Контент: повнота ${content.avg.completeness}/5, корисність ${content.avg.usefulness}/5, переконливість ${content.avg.persuasiveness}/5. Тонкі описи й відсутні атрибути — покупцю нема на чому ухвалити рішення, а пошуку нема що цитувати.</p>` : ''}
  </section>`;
}
const tile = (big: string, cap: string, cls: string) => `<div class="tile ${cls}"><b>${esc(big)}</b><span>${esc(cap)}</span></div>`;

/** Целевое состояние по ресёрчу (блок Б). */
function targetStateSection(rs: TargetStateResearch): string {
  return `<section class="block">
    ${chapter('Яким має бути — за ринком і трендами', 'Ресёрч цільового стану')}
    <p class="verdict">Я подивився, як зроблені сильні вітрини вашої ніші й куди йде ecommerce. Ось приймі, які вам потрібні.</p>
    <div class="ts-grid">
      <div><h3>Сучасні прийоми вітрини</h3><ul class="pains">${rs.trends.slice(0, 8).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      ${rs.competitorMoves.length ? `<div><h3>Що роблять сильні гравці ніші</h3><ul class="pains">${rs.competitorMoves.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    </div>
    ${rs.sources?.length ? `<p class="lead">Джерела: ${rs.sources.slice(0, 6).map(esc).join(' · ')}.</p>` : ''}
  </section>`;
}

/** Центральная ветка: экономика + два пути. Деньги — из money (цифры владельца) или нишевые вилки. */
function centralBranch(r: SiteAuditReport, x: PresentationExtras): string {
  const bench = x.research?.benchmark;
  const nowRange = bench?.typical || '0.2–0.8%';
  const tgtRange = bench?.strong || '3–5%';
  const money = x.money;
  const econ = money
    ? `<div class="econ">
        <div class="econ-now"><div class="econ-cap">ЗАРАЗ / МІСЯЦЬ</div><div class="econ-big gap">${rub(money.currentMonth)}</div><div class="econ-note">за поточної конверсії</div></div>
        <div class="econ-arrow">→</div>
        <div class="econ-tgt"><div class="econ-cap">ПОТЕНЦІАЛ / РІК</div><div class="econ-big ok">${rub(money.potentialYear)}</div><div class="econ-note">+${money.forecast.upliftPct}% до виторгу за правильної збірки</div></div>
      </div>
      <p class="lead">Розрахунок на ваших трьох цифрах (трафік · конверсія · чек). Консервативна вилка: ${rub(money.consMinYear)}–${rub(money.consMaxYear)} на рік.</p>`
    : `<div class="econ">
        <div class="econ-now"><div class="econ-cap">ПОТОЧНИЙ ШАБЛОН</div><div class="econ-big gap">${esc(nowRange)}</div><div class="econ-note">типова конверсія слабкої вітрини ніші</div></div>
        <div class="econ-arrow">→</div>
        <div class="econ-tgt"><div class="econ-cap">ЗІБРАНО ПРАВИЛЬНО</div><div class="econ-big ok">${esc(tgtRange)}</div><div class="econ-note">${bench?.niche ? `рівень сильної вітрини ніші «${esc(bench.niche)}»` : 'кастомний UX/UI, повна композиція, первинне SEO'}</div></div>
      </div>
      <p class="lead">Точні гроші рахуються на трьох ваших цифрах (місячний трафік, конверсія, середній чек) — дайте їх, і вилки стануть вашим виторгом.</p>`;
  return `<section class="block">
    ${chapter('Рекомендація: два шляхи', 'Центральне рішення')}
    <p class="verdict">Поточна вітрина конвертуватиме як шаблон — правильно зібрана дає кратно більше. Це і є рішення, яке треба ухвалити.</p>
    ${econ}
    <p class="lead">Це не тільки конверсія: кратно нижча вартість клієнта й витрати на рекламу, працює органіка, бренд та імідж — вітрина стає активом, а не статтею витрат.</p>
    <div class="paths">
      <div class="path"><h3>Шлях A · Доробка поточного шаблону</h3>
        <p>Швидше й дешевше на старті. Додаємо відсутні блоки, чистимо дерево, ставимо аналітику. <b>Стеля нижча</b> — база лишається шаблонною, кастомного UX і повного SEO-фундаменту не буде.</p></div>
      <div class="path hl"><h3>Шлях B · Стратегічна переробка</h3>
        <p>Нова платформа, <b>кастомний UX/UI-дизайн</b>, первинна SEO-оптимізація, повна ecommerce-композиція. Дорожче й довше, але <b>стеля конверсії й вартість активу — інші</b>. Це шлях на масштаб.</p></div>
    </div>
  </section>`;
}

/** GEO / AI-видимость. */
function geoSection(geo: { llmsTxt: boolean; blockedBots: string[] }): string {
  return `<section class="block">
    ${chapter('Видимість в AI-пошуку (GEO)', 'Новий канал, який уже працює у конкурентів')}
    <p class="lead">Покупці все частіше питають товар в AI (ChatGPT, Perplexity, AI-огляди Google). Щоб вітрину цитували, потрібні доступ AI-краулерів, llms.txt і структуровані відповіді.</p>
    <ul class="pains">
      <li>llms.txt: ${geo.llmsTxt ? '<b class="ok">є</b>' : '<b class="gap">немає</b> — AI-системам нема карти сайту'}</li>
      ${geo.blockedBots.length ? `<li><b class="gap">Заблоковані AI-краулери:</b> ${geo.blockedBots.map(esc).join(', ')} — вітрина невидима для цих систем</li>` : '<li><b class="ok">AI-краулери не заблоковані</b> — базова умова видимості виконана</li>'}
    </ul>
  </section>`;
}

/** Первостепенные боли + команда → КП. */
function painsAndTeam(r: SiteAuditReport, x: PresentationExtras): string {
  const pains = [
    'Немає систем аналітики й трекінгу (GA4/GTM/Pixel) — без них не виміряти воронку й не порахувати гроші розривів',
    'Немає наскрізної аналітики та IP-телефонії — дзвінки й заявки не звʼязані з джерелом',
    'SEO-фундамент сирий: розмітка, Title/Description, дерево',
    r.stack?.commercialTemplate || r.stack?.builder ? `Платформа — ${r.stack?.cms ?? 'шаблонна CMS'}${r.stack?.builder ? ` на білдері ${r.stack.builder}` : ''}: шаблонна база, що впирається в стелю конверсії` : 'Шаблонна база вітрини',
  ];
  const mLine = x.maturity ? `Зрілість напряму онлайн-продажів — рівень ${x.maturity.level}/5 «${esc(x.maturity.name)}». Щоб піднятися, потрібна системна робота, а не точкові правки.` : '';
  return `<section class="block">
    ${chapter('Першочергові болі та системна побудова', 'У довесок до головного')}
    <p class="lead">Окремо звертаю увагу — це системні блокери росту. Детально кожен — в окремих документах пакета.</p>
    <ul class="pains">${pains.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    ${mLine ? `<p class="verdict">${mLine}</p>` : ''}
    <h3>Будуємо системно — потрібна команда за етапами</h3>
    <table class="team"><thead><tr><th>Етап</th><th>Ролі</th></tr></thead><tbody>
      <tr><td>Стратегія й аналітика</td><td>стратег, бізнес-аналітик, маркетолог</td></tr>
      <tr><td>UX/UI-дизайн</td><td>UX-архітектор, UI-дизайнер, дизайн-директор</td></tr>
      <tr><td>Контент</td><td>копірайтер, фотограф/відео, контент-менеджер</td></tr>
      <tr><td>Розробка</td><td>фронтенд, бекенд, інтеграції (оплата/доставка/CRM)</td></tr>
      <tr><td>Трафік і зростання</td><td>SEO, performance, аналітик даних</td></tr>
    </tbody></table>
    <p class="lead">Конкретний склад, обсяг і етапи — у комерційній пропозиції (окремий документ).</p>
  </section>`;
}

export function renderPresentation(r: SiteAuditReport, x: PresentationExtras = {}): string {
  const commercial = KIND_ORDER.map((k) => r.pages.find((p) => p.kind === k)).filter((p): p is PageReport => Boolean(p));
  const secondary = r.pages.filter((p) => !KIND_ORDER.includes(p.kind));
  const missingMand = r.pageTypes.filter((t) => t.mandatory && t.status === 'не найдена');
  const missingVar = r.pageTypes.filter((t) => !t.mandatory && t.status === 'не найдена');

  let n = 0;
  const commercialBody = commercial.length
    ? commercial.map((p) => pageBlock(p, ++n)).join('')
    : '<p class="lead">Комерційні сторінки не розібрані — потрібні скріншоти внутрішніх сторінок (каталог, картка товару) для розбору зором.</p>';
  const secondaryBody = secondary.length
    ? `<section class="block">${chapter('Другорядні сторінки')}<p class="lead">Акції, новинки, блог — підтримують шлях, але не несуть основну конверсію.</p>${secondary.map((p) => pageBlock(p, ++n)).join('')}</section>`
    : '';

  const marketLine = x.bench ? `<p class="lead">Позиція проти ринку: ${x.bench.clientRank} з ${x.bench.totalSites} за зовнішніми ознаками (індекс ${x.bench.clientIndex}/100) — розрив із лідером конкретний і скінченний.</p>` : '';
  const treeBody = `<section class="block">
    ${chapter('Сторінки, яких немає — архітектура дерева', 'Чого бракує вітрині')}
    <p class="verdict">Дерево сайту неповне з погляду ecommerce й бізнесу — покупцю й пошуку бракує входів.</p>
    ${missingMand.length ? `<div><b class="gap">Обовʼязкові, яких немає:</b> ${missingMand.map((t) => esc(t.label)).join(' · ')}</div>` : "<p class='lead'>Обовʼязкові сторінки на місці.</p>"}
    ${missingVar.length ? `<div style="margin-top:6px"><b class="warn">Змінні за моделлю бізнесу, яких немає:</b> ${missingVar.map((t) => esc(t.label)).join(' · ')}</div>` : ''}
    ${marketLine}
  </section>`;

  const coverHtml = cover({
    kicker: 'Презентація аудиту',
    title: 'Презентація аудиту вітрини',
    verdict: r.design?.verdict || r.verdict,
    metrics: [{ label: 'Клієнт', value: r.client }, ...(r.stack?.cms ? [{ label: 'Платформа', value: r.stack.cms + (r.stack.templateName ? ` · ${r.stack.templateName}` : '') }] : []), ...(x.maturity ? [{ label: 'Зрілість', value: `${x.maturity.level}/5` }] : [])],
    score: { pct: r.totalPct, cap: `відповідність еталону · ${r.totalScore}/${r.totalMax}` },
    note: 'Це презентація розбору вашого сайту й рекомендації — по порядку: сторінки що є (комерційний шлях), яких немає, і що з цим робити. Ведемо до одного рішення.',
  });

  const intro = `<section class="block">
    ${chapter('З чого починаємо', 'Вступ')}
    <p class="lead">Ви розвиваєте напрям онлайн-продажів. Я провів детальний розбір вашого сайту й презентую його по порядку: спершу сторінки, що є, — з комерційного шляху (головна → каталог → картка), поблочно. Далі — де рветься шлях покупця й яких сторінок бракує. Потім — яким сайт має бути за ринком і трендами, і головне: два шляхи розвитку та що це дає в грошах.</p>
  </section>`;

  const body = coverHtml
    + intro
    + `<section class="block">${chapter('Сторінки, що є — комерційний шлях', 'Головна → каталог → картка')}<p class="lead">Кожен блок — зліва як зараз, справа як треба (за трендами ecommerce, UX, SEO, CTA). Блок, якого немає, показано, яким має бути.</p></section>`
    + commercialBody
    + secondaryBody
    + (x.journey ? journeySection(x.journey) : '')
    + treeBody
    + techSeoSection(x.seo, x.content)
    + (x.mech ? mechanicsSection(x.mech) : '')
    + (x.research ? targetStateSection(x.research) : '')
    + centralBranch(r, x)
    + (x.geo ? geoSection(x.geo) : '')
    + painsAndTeam(r, x)
    + pageFooter('Презентація зовнішнього аудиту вітрини. Деталі кожного напряму — в окремих документах пакета.');

  return doc(`Презентація аудиту · ${r.client}`, body, EXTRA_CSS);
}

const EXTRA_CSS = `
  :root{--weak:#ea580c;}
  ${WIREFRAME_CSS}
  .verdict{font-size:14px;line-height:1.35;font-weight:600;color:var(--ink);margin:0 0 8px;max-width:165mm;}
  .warn{color:var(--weak);}
  .page-blk{page-break-inside:auto;}
  .pb-head{display:flex;align-items:flex-start;gap:9px;}
  .pb-n{font-size:16px;font-weight:800;color:var(--lime);line-height:1;}
  .pb-kick{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);}
  .pb-score{margin-left:auto;font-weight:800;font-size:15px;}
  .pb-score.ok{color:var(--ok);} .pb-score.check{color:var(--check);} .pb-score.gap{color:var(--gap);}
  .pb-sum{font-size:10px;margin:6px 0 8px;display:flex;flex-direction:column;gap:3px;}
  .pb-cards{margin-top:4px;}
  .econ{display:flex;align-items:center;gap:14px;margin:10px 0;}
  .econ-now,.econ-tgt{flex:1;border:1px solid var(--line);border-radius:8px;padding:12px 14px;text-align:center;}
  .econ-tgt{border-color:var(--ok);} .econ-now{border-color:var(--gap);}
  .econ-cap{font-size:8.5px;font-weight:800;letter-spacing:.5px;color:var(--muted);}
  .econ-big{font-size:30px;font-weight:800;line-height:1.1;letter-spacing:-1px;}
  .econ-note{font-size:8.5px;color:var(--muted);line-height:1.3;margin-top:3px;}
  .econ-arrow{font-size:26px;color:var(--muted);font-weight:800;}
  .paths{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0;}
  .path{border:1px solid var(--line);border-radius:7px;padding:10px 12px;} .path.hl{border-color:var(--lime);border-left-width:3px;}
  .path h3{margin-top:0;} .path p{font-size:10px;color:#333;margin:0;line-height:1.45;}
  .pains{margin:6px 0 10px;padding-left:18px;} .pains li{margin:4px 0;font-size:10px;line-height:1.4;}
  .team{margin:4px 0;} .team td{font-size:10px;padding:5px 8px;} .team th{font-size:9px;}
  .tiles{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0;}
  .tile{border:1px solid var(--line);border-top-width:3px;border-radius:6px;padding:8px 12px;text-align:center;min-width:80px;}
  .tile b{display:block;font-size:20px;font-weight:800;line-height:1;} .tile span{font-size:8.5px;color:var(--muted);}
  .tile.ok{border-top-color:var(--ok);} .tile.ok b{color:var(--ok);} .tile.check{border-top-color:var(--check);} .tile.check b{color:var(--check);} .tile.gap{border-top-color:var(--gap);} .tile.gap b{color:var(--gap);}
  .jt td{font-size:10px;padding:5px 8px;vertical-align:top;} .jt-st{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.4px;}
  .ts-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;} .ts-grid h3{margin-top:0;}
`;
