/**
 * STRUCTURE & SITE TREE AUDIT — аудит архітектури сайту як системи.
 * Відповідає не «чи гарне дерево», а «чи правильно сайт організований на рівні
 * сутностей, розділів, сторінок, звʼязків і точок входу»: чи швидко знаходить
 * користувач, чи розуміє структуру пошук, чи масштабується каталог без постійної
 * перебудови дерева.
 *
 * Розрізняємо: Site Structure (вся архітектура) vs Site Tree (ієрархія сторінок).
 * Аудит дивиться дерево + горизонтальні звʼязки (граф) + комерційні осі +
 * інформаційні осі + SEO-посадкові + точки входу/виходу.
 *
 * Детермінований: спирається на seoarch (дерево/issues/params), site-audit (блоки/
 * дерево типів), intelligence (товари/категорії), аналіз шляхів URL. Дані Search
 * Console / Analytics / конкурентів / CMS — вхід ззовні, позначено «н/д».
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';
import { buildSeoArch } from './seoarch.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';
import { buildIntelligence } from './intelligence.js';
import { flowScore, type FlowScore } from './flowScore.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type StructLayer = { id: string; title: string; principle: string; state: string };
export type StructHealthZone = { key: string; label: string; score: number; note: string };
export type StructScoreZone = { key: string; label: string; score: number; measured: boolean };
export type PageTypeRow = { type: string; present: boolean; count: string; role: string };
export type AxisRow = { axis: string; exists: boolean; hasEntry: boolean; impl: 'landing' | 'фільтр' | 'підбірка' | '—'; priority: Priority; note: string };
export type TargetBranch = { name: string; present: boolean; note: string; children?: TargetBranch[] };
export type OrphanRow = { label: string; url: string };
export type StructBlockCard = {
  page: string; key: string; name: string; fn: string; leadsTo: string;
  now: string; problem: string; should: string; priority: Priority;
};
export type StructGap = { current: string; problem: string; target: string; priority: Priority };
export type StructOpp = { title: string; chain: string; priority: Priority };
export type StructArtifact = { n: number; name: string; source: 'обхід' | 'зовн. дані' };

export type StructureFlowReport = {
  client: string; takenAt: string;
  spine: StructLayer[];
  health: { zones: StructHealthZone[]; /** null — обходу не було, рахувати нема з чого. */ overall: number | null };
  score: FlowScore<StructScoreZone>;
  pageTypes: PageTypeRow[];
  currentTree: { label: string; count: number; purpose: string; severity: string; note: string }[];
  targetTree: TargetBranch[];
  axes: AxisRow[];
  entryPoints: { page: string; entries: number; note: string }[];
  orphans: OrphanRow[];
  deadEnds: string[];
  clickDepth: { max: number; note: string };
  linking: { internalUrls: number; homeOutlinks: number; paramUrls: number; note: string };
  blockCards: StructBlockCard[];
  gaps: StructGap[];
  opportunities: StructOpp[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: StructArtifact[];
  contextNote: string;
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const shortUrl = (u: string) => { try { const x = new URL(u); return x.pathname === '/' ? '/' : x.pathname; } catch { return u; } };

/* ── Структурна анатомія блоку: функція в архітектурі + куди веде ── */
type SbTpl = { fn: string; leadsTo: string; should: string };
const SB_TPL: Record<string, SbTpl> = {
  nav: { fn: 'Навігація · точки входу в каталог', leadsTo: 'категорії · комерційні осі', should: 'Головні осі за 1 клік із шапки: категорії + бренди + колекції + подарунки + sale + новинки (розширити без зростання висоти).' },
  breadcrumbs: { fn: 'Положення у дереві · перелінковка вгору', leadsTo: 'категорія · підкатегорія', should: 'Повний шлях із BreadcrumbList; для товарів з кількома батьками — канонічний шлях.' },
  footer_contacts: { fn: 'Другий рівень навігації · SEO-посилання', leadsTo: 'категорії · бренди · сервіс · правові', should: 'Футер як другий навігаційний шар: категорії, бренди, хаби, сервіс — не лише службові посилання.' },
  related: { fn: 'Горизонтальні звʼязки (граф)', leadsTo: 'схожі · аксесуари · бренд · колекція', should: 'Горизонтальні звʼязки: схожі / з цим беруть / інші кольори / бренд / колекція — перетворюють дерево на граф.' },
  faq: { fn: 'Точка виходу з інфо-відповіді', leadsTo: 'доставка · оплата · каталог', should: 'Кожна відповідь → тематичний вихід у каталог/умови, а не «глухий кут».' },
  category_description: { fn: 'SEO-посадкова · перелінковка вниз', leadsTo: 'підкатегорії · гайди', should: 'Перелінковка на дочірні розділи й гайди — вертикальний звʼязок контенту з каталогом.' },
  search: { fn: 'Вхід у дерево без знання назв', leadsTo: 'категорії · товари · контент', should: 'Пошук по товарах/брендах/контенту з підказками й толерантністю до одруківок; вхід у потрібну гілку.' },
  product_grid: { fn: 'Discovery · вхід у товари', leadsTo: 'картки товару', should: 'Керовані добірки як точки входу (бестселери/новинки/сезон) + мікророзмітка ItemList.' },
};
const STRUCT_BLOCKS = new Set(Object.keys(SB_TPL));
const priFor = (state: BlockState, weight: string): Priority => {
  const bad = state === 'gap' || state === 'weak';
  const r = bad ? (weight === 'core' ? 0 : weight === 'important' ? 1 : 2) : (weight === 'core' ? 1 : weight === 'important' ? 2 : 3);
  return (['P0', 'P1', 'P2', 'P3'] as const)[r];
};

export function buildStructureFlow(ds: AuditDataset): StructureFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const arch = buildSeoArch(ds);
  const site = buildSiteAudit(ds);
  const ci = buildIntelligence(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const links = ds.client.links ?? [];
  const lpath = (h: string) => { try { return new URL(h).pathname.toLowerCase(); } catch { return ''; } };
  const hasLink = (re: RegExp) => links.some((h) => re.test(lpath(h)));
  const kinds = new Set(pages.map((p) => p.kind));
  const anyBlock = new Set<string>();
  for (const p of pages) for (const [k, v] of Object.entries(p.ux!.blocks ?? {})) if (v) anyBlock.add(k);
  const has = (...k: string[]) => k.some((x) => anyBlock.has(x));
  const navBlock = has('nav');

  /* ── Page Type Map ── */
  const typeCount = (re: RegExp) => links.filter((h) => re.test(lpath(h))).length;
  const pageTypes: PageTypeRow[] = [
    { type: 'Homepage', present: kinds.has('home'), count: '1', role: 'positioning · discovery · навігація' },
    { type: 'Category / PLP', present: kinds.has('plp'), count: `~${ci.config.categories}`, role: 'product discovery · SEO · merchandising' },
    { type: 'Product / PDP', present: kinds.has('pdp'), count: `~${ci.config.products}`, role: 'рішення · транзакція' },
    { type: 'Brand', present: hasLink(/brand|brend/), count: typeCount(/brand|brend/) ? `~${typeCount(/brand|brend/)}` : '0', role: 'брендовий попит · хаб' },
    { type: 'Collection', present: hasLink(/collection|kolekc|seri/), count: typeCount(/collection|kolekc|seri/) ? '≥1' : '0', role: 'тематична вісь' },
    { type: 'Landing (gift/sale/new)', present: hasLink(/gift|podar|sale|akci|skidk|new|novink/), count: '—', role: 'комерційні осі' },
    { type: 'Blog / Article / Guide', present: kinds.has('content'), count: `~${typeCount(/blog|article|news|stat|guide/)}`, role: 'acquisition · authority · SEO/GEO' },
    { type: 'FAQ', present: kinds.has('faq') || has('faq'), count: '—', role: 'зняття заперечень · AEO' },
    { type: 'Service / Legal', present: hasLink(/dostavka|delivery|oplata|payment|contact|about|oferta|policy/), count: '—', role: 'довіра · правова база' },
    { type: 'Account', present: hasLink(/account|cabinet|lk|login/), count: '—', role: 'retention · повторні покупки' },
  ];
  const typesPresent = pageTypes.filter((t) => t.present).length;

  /* ── Current tree (з seoarch) ── */
  const currentTree = arch.tree.slice(0, 14).map((t) => ({ label: t.label, count: t.count, purpose: t.purpose === 'commercial' ? 'комерційний' : t.purpose === 'informational' ? 'інформаційний' : 'системний', severity: t.severity, note: t.note }));

  /* ── Commercial Axes ── */
  const axisDef: { axis: string; re: RegExp; impl: AxisRow['impl'] }[] = [
    { axis: 'Категорії', re: /catalog|katalog|category|categor/, impl: 'landing' },
    { axis: 'Бренди', re: /brand|brend/, impl: 'landing' },
    { axis: 'Колекції / серії', re: /collection|kolekc|seri/, impl: 'landing' },
    { axis: 'Подарунки', re: /gift|podar|present/, impl: 'landing' },
    { axis: 'Розпродаж / Sale', re: /sale|akci|skidk|discount/, impl: 'підбірка' },
    { axis: 'Новинки', re: /new|novink/, impl: 'підбірка' },
    { axis: 'Бестселери / популярне', re: /best|hit|popular|top/, impl: 'підбірка' },
    { axis: 'Сценарії / для кого', re: /for-|dlya|use-?case|scenari/, impl: 'landing' },
  ];
  const axes: AxisRow[] = axisDef.map((a) => {
    const exists = hasLink(a.re);
    // «Точка входу» — груба евристика: вісь є в лінках І присутня навігація в шапці.
    const hasEntry = exists && navBlock;
    const priority: Priority = !exists ? (a.axis === 'Категорії' ? 'P0' : a.axis === 'Бренди' || a.axis === 'Колекції / серії' ? 'P1' : 'P2') : (!hasEntry ? 'P1' : 'P3');
    return { axis: a.axis, exists, hasEntry, impl: exists ? a.impl : '—', priority, note: !exists ? 'осі немає — сценарій не покритий' : !hasEntry ? 'вісь є, але без явної точки входу з шапки' : 'вісь є з точкою входу' };
  });

  /* ── Target Site Tree ── */
  const tb = (name: string, present: boolean, note: string, children?: TargetBranch[]): TargetBranch => ({ name, present, note, children });
  const targetTree: TargetBranch[] = [
    tb('CATALOG', kinds.has('plp'), 'категорії/підкатегорії', [
      tb('Категорії', kinds.has('plp'), `~${ci.config.categories} категорій`),
      tb('Фасетні landing', arch.totals.paramUrls > 0 && hasLink(/brand|color|size/), 'керовані комбінації фільтрів під попит'),
    ]),
    tb('BRANDS', hasLink(/brand|brend/), 'окрема вісь брендів (не змішувати з виробниками)'),
    tb('COLLECTIONS', hasLink(/collection|kolekc|seri/), 'тематичні/сезонні добірки'),
    tb('GIFTS', hasLink(/gift|podar/), 'подарунковий сценарій'),
    tb('SALE', hasLink(/sale|akci|skidk/), 'розпродаж як вісь'),
    tb('NEW', hasLink(/new|novink/), 'новинки як вісь'),
    tb('KNOWLEDGE HUB', kinds.has('content'), 'гайди/огляди/FAQ/довідник', [
      tb('Guides', hasLink(/guide|gayd|kak-/), 'гайди «як обрати»'),
      tb('FAQ', kinds.has('faq') || has('faq'), 'часті питання'),
      tb('Articles', kinds.has('content'), 'статті/огляди'),
    ]),
    tb('SERVICE', hasLink(/dostavka|delivery|oplata|contact|about/), 'доставка/оплата/повернення/контакти', [
      tb('Delivery', hasLink(/dostavka|delivery/), ''),
      tb('Payment', hasLink(/oplata|payment/), ''),
      tb('Returns', hasLink(/return|vozvrat|obmin|garant/), ''),
      tb('Contacts', hasLink(/contact|kontakt|about/), ''),
    ]),
  ];

  /* ── Entry points ── */
  const entryPoints = site.pages.filter((p) => ['home', 'plp', 'pdp', 'content'].includes(p.kind)).map((p) => {
    let entries = 1; // з дерева/навігації
    if (p.kind !== 'home' && navBlock) entries++;
    if (has('breadcrumbs')) entries++;
    if (p.kind === 'pdp' && has('related')) entries++;
    if (p.kind === 'plp' && has('category_description')) entries++;
    return { page: KIND_LABEL[p.kind], entries, note: entries <= 1 ? 'мало входів — ризик orphan' : 'входи з навігації/крихт/звʼязків' };
  }).filter((v, i, a) => a.findIndex((x) => x.page === v.page) === i);

  /* ── Orphans (з карти типів, без розбору/звʼязків) ── */
  const parsed = new Set(pages.map((p) => shortUrl(p.url)));
  const orphans = (ds.client.pageTypes ?? []).filter((t) => t.status === 'найдена' && t.url && !parsed.has(shortUrl(t.url!))).map((t) => ({ label: t.label, url: shortUrl(t.url!) })).slice(0, 10);

  /* ── Dead-ends (структурні тупики) ── */
  const homeRep = site.pages.find((p) => p.kind === 'home');
  const deadEnds: string[] = [];
  for (const pr of site.pages) {
    for (const row of pr.rows) {
      if ((row.key === 'faq' || row.key === 'reviews' || row.key === 'related') && row.state !== 'ok') {
        deadEnds.push(`${KIND_LABEL[pr.kind]}: «${row.name}» — немає виходу далі`);
      }
    }
  }

  /* ── Click depth / linking ── */
  const clickDepth = { max: arch.totals.maxDepth, note: arch.totals.maxDepth <= 3 ? 'глибина в нормі (≤3)' : arch.totals.maxDepth === 4 ? 'глибина 4 — прийнятно, перевірити цінність рівнів' : 'глибина >4 — ризик надмірного дроблення' };
  const linking = { internalUrls: links.length, homeOutlinks: ds.client.discoveredLinks ?? links.length, paramUrls: arch.totals.paramUrls, note: `${links.length} унік. URL; ${arch.totals.paramUrls} параметричних (crawl-пастки за >40)` };

  /* ── Block-by-Block structure cards ── */
  const KEY: PageKind[] = ['home', 'plp', 'pdp', 'content', 'faq'];
  const blockCards: StructBlockCard[] = [];
  for (const pr of site.pages) {
    if (!KEY.includes(pr.kind)) continue;
    for (const row of pr.rows) {
      if (!STRUCT_BLOCKS.has(row.key) || row.state === 'ok') continue;
      const tpl = SB_TPL[row.key];
      blockCards.push({
        page: KIND_LABEL[pr.kind], key: row.key, name: row.name, fn: tpl.fn, leadsTo: tpl.leadsTo,
        now: row.now, problem: row.state === 'gap' ? 'блок відсутній — точка входу/виходу не працює' : row.state === 'weak' ? 'є, але структурну функцію не виконує' : 'не підтверджено обходом',
        should: tpl.should, priority: priFor(row.state, row.weight),
      });
    }
  }
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  blockCards.sort((a, b) => priRank[a.priority] - priRank[b.priority]);

  /* ── Structure Gap Map ── */
  const gaps: StructGap[] = [];
  const missingAxes = axes.filter((a) => !a.exists);
  if (missingAxes.length) gaps.push({ current: `Каталог без осей: ${missingAxes.map((a) => a.axis).slice(0, 4).join(', ')}`, problem: 'Не покриті комерційні сценарії (подарунки/колекції/бренди/sale)', target: 'Каталог + окремі комерційні осі з точками входу', priority: 'P1' });
  const noEntryAxes = axes.filter((a) => a.exists && !a.hasEntry);
  if (noEntryAxes.length) gaps.push({ current: `Осі без точки входу: ${noEntryAxes.map((a) => a.axis).slice(0, 3).join(', ')}`, problem: 'Осі є в структурі, але немає входу з шапки — трафік їх не досягає', target: 'Розширити меню осями (без зростання висоти шапки)', priority: 'P1' });
  if (arch.totals.paramUrls > 40) gaps.push({ current: `${arch.totals.paramUrls}+ параметричних URL`, problem: 'Неконтрольовані фасетні комбінації — crawl-пастки, дублі', target: 'SEO-landing лише для попитних комбінацій; решта — фільтр без окремого URL', priority: 'P0' });
  if (orphans.length >= 3) gaps.push({ current: `${orphans.length} потенційно orphan-сторінок`, problem: 'Цінні сторінки майже не звʼязані з архітектурою', target: 'Увести orphan-сторінки в перелінковку (навігація/крихти/звʼязки)', priority: 'P1' });
  if (!kinds.has('content')) gaps.push({ current: 'Немає контентної архітектури (hub)', problem: 'Немає вертикалі article → hub → category → product', target: 'Knowledge Hub із рубриками, звʼязаний із каталогом', priority: 'P1' });

  /* ── Opportunities ── */
  const opportunities: StructOpp[] = [
    { title: 'Розширити комерційні осі + точки входу', chain: 'Осі без входу → меню/лендинги → нові входи → findability → SEO/CRO', priority: 'P1' },
    { title: 'Фасетні SEO-landing під попит', chain: 'Параметри без попиту → контрольовані landing → нові посадкові → органіка', priority: 'P1' },
    { title: 'Перетворити дерево на граф (горизонтальні звʼязки)', chain: 'Тільки вертикаль → cross-links (товар↔бренд↔колекція↔гайд) → глибина/вага', priority: 'P2' },
    { title: 'Knowledge Hub → каталог', chain: 'Розрізнені статті → hub із виходами в категорії/товари → трафік у комерцію', priority: 'P2' },
  ];

  /* ── Structure Health Score (5 зон) ── */
  const findability = clamp10((navBlock ? 3 : 1) + (has('search') ? 2 : 0) + (has('breadcrumbs') ? 2 : 0) + (arch.totals.maxDepth <= 3 ? 3 : 1));
  const logicality = clamp10((typesPresent / pageTypes.length) * 6 + (arch.issues.length <= 3 ? 4 : 2));
  const connectivity = clamp10((has('related') ? 3 : 1) + (has('breadcrumbs') ? 2 : 0) + (orphans.length === 0 ? 3 : orphans.length <= 3 ? 1.5 : 0) + (deadEnds.length === 0 ? 2 : 0));
  const scalability = clamp10((arch.totals.maxDepth <= 4 ? 4 : 2) + (arch.totals.paramUrls <= 40 ? 3 : 0) + (ci.config.categories >= 5 ? 2 : 1));
  const seoArch = clamp10((ds.client.sitemapXml ? 3 : 1) + (has('breadcrumbs') ? 2 : 0) + (arch.totals.paramUrls <= 40 ? 2 : 0) + (kinds.has('plp') ? 2 : 0));
  const health = {
    zones: [
      { key: 'findability', label: 'Findability', score: findability, note: 'Наскільки легко знайти потрібне' },
      { key: 'logicality', label: 'Logicality', score: logicality, note: 'Наскільки логічно організовано' },
      { key: 'connectivity', label: 'Connectivity', score: connectivity, note: 'Наскільки повʼязані сторінки (граф)' },
      { key: 'scalability', label: 'Scalability', score: scalability, note: 'Готовність до росту в 10–100×' },
      { key: 'seoArch', label: 'SEO Architecture', score: seoArch, note: 'Підтримка органічного пошуку' },
    ],
    overall: pages.length ? clamp10((findability + logicality + connectivity + scalability + seoArch) / 5) : null,
  };

  /* ── Structure Score (18 зон) ── */
  const z = (key: string, label: string, score: number, measured = true): StructScoreZone => ({ key, label, score: measured ? clamp10(score) : 0, measured });
  const zones = [
      z('ia', 'Information Architecture', logicality),
      z('tree', 'Site Tree', (typesPresent / pageTypes.length) * 10),
      z('catlogic', 'Category Logic', kinds.has('plp') ? 6 + (has('category_description') ? 2 : 0) : 2),
      z('taxonomy', 'Taxonomy', (ci.config.categories >= 5 ? 6 : 3) + (arch.issues.filter((i) => i.problem.includes('дубл')).length === 0 ? 2 : 0)),
      z('nav', 'Navigation', (navBlock ? 4 : 1) + (has('search') ? 3 : 0) + (has('footer_contacts') ? 2 : 0)),
      z('axes', 'Commercial Axes', (axes.filter((a) => a.exists).length / axes.length) * 10),
      z('search', 'Search Architecture', has('search') ? 6 : 2),
      z('filters', 'Filter Architecture', has('filters') ? (arch.totals.paramUrls <= 40 ? 7 : 4) : 3),
      z('url', 'URL Architecture', (arch.totals.maxDepth <= 4 ? 5 : 2) + (arch.totals.paramUrls <= 40 ? 3 : 0)),
      z('seo', 'SEO Architecture', seoArch),
      z('linking', 'Internal Linking', Math.min(10, links.length / 25) + (has('breadcrumbs') ? 1 : 0)),
      z('content', 'Content Architecture', kinds.has('content') ? 6 : 2),
      z('landing', 'Landing Architecture', (axes.filter((a) => a.exists && a.impl === 'landing').length) * 2.5),
      z('scalability', 'Scalability', scalability),
      z('mobile', 'Mobile Architecture', has('nav') ? 6 : 3),
      z('connectivity', 'Connectivity / Graph', connectivity),
      // Зовнішні дані:
      z('international', 'International Architecture', 0, hasLink(/\/(en|pl|de|ro|ua|ru)(\/|$)/)),
      z('cmsfit', 'CMS Fit / Competitive Benchmark', 0, false),
    ];
  // international score if detected
  const intl = zones.find((zz) => zz.key === 'international')!;
  if (intl.measured) intl.score = clamp10(hasLink(/\/(en|pl|de|ro)(\/|$)/) ? 6 : 3);
  // Бал рахуємо ПІСЛЯ правки international: інакше в середнє потрапило б
  // старе значення зони.
  const score = flowScore(zones, pages.length);

  /* ── Roadmap (6 фаз) ── */
  const roadmap = [
    { phase: 'Phase 1 · Cleanup', items: [
      ...(arch.totals.paramUrls > 40 ? ['Приборкати фасетні URL (noindex+canonical для безпопитних)'] : []),
      ...(orphans.length ? [`Увести ${orphans.length} orphan-сторінок у перелінковку`] : []),
      ...(deadEnds.length ? ['Прибрати структурні тупики (FAQ/відгуки/related → виходи)'] : []),
      ...(arch.issues.some((i) => i.problem.includes('дубл')) ? ['Обʼєднати/канонізувати дублі гілок'] : []),
    ] },
    { phase: 'Phase 2 · Core Tree', items: ['Впорядкувати категорії/підкатегорії й URL', 'Навігація: логіка й пріоритет розділів (primary/secondary)'] },
    { phase: 'Phase 3 · Commercial Axes', items: [
      ...(missingAxes.length ? [`Додати осі: ${missingAxes.map((a) => a.axis).slice(0, 4).join(', ')}`] : []),
      ...(noEntryAxes.length ? ['Розширити меню осями без зростання висоти шапки'] : ['Точки входу для всіх осей']),
    ] },
    { phase: 'Phase 4 · Content Architecture', items: [
      ...(kinds.has('content') ? ['Перетворити блог на Knowledge Hub із рубриками'] : ['Створити Knowledge Hub (гайди/FAQ/огляди)']),
      'Вертикаль article → hub → category → product',
    ] },
    { phase: 'Phase 5 · SEO Architecture', items: ['Фасетні landing під семантичні кластери', 'Перелінковка: hub-сторінки, cross-links, крихти'] },
    { phase: 'Phase 6 · Scale', items: ['Архітектура під нові категорії/сутності', 'Підготовка під нові ринки/мови (за потреби)'] },
  ].map((p) => ({ phase: p.phase, items: p.items.filter(Boolean) })).filter((p) => p.items.length);

  /* ── Артефакти (22) ── */
  const A = (n: number, name: string, source: StructArtifact['source']): StructArtifact => ({ n, name, source });
  const artifacts: StructArtifact[] = [
    A(1, 'Current Site Tree', 'обхід'), A(2, 'Target Site Tree', 'обхід'), A(3, 'Page Type Map', 'обхід'),
    A(4, 'Entity Map', 'обхід'), A(5, 'Taxonomy Map', 'обхід'), A(6, 'Commercial Axes Map', 'обхід'),
    A(7, 'Navigation Map', 'обхід'), A(8, 'Entry Point Map', 'обхід'), A(9, 'Exit Point Map', 'обхід'),
    A(10, 'Orphan Page Map', 'обхід'), A(11, 'Click Depth Map', 'обхід'), A(12, 'Internal Linking Map', 'обхід'),
    A(13, 'Filter Architecture', 'обхід'), A(14, 'Landing Page Architecture', 'обхід'), A(15, 'Content Architecture', 'обхід'),
    A(16, 'SEO Architecture', 'обхід'), A(17, 'Golden Standard Benchmark', 'зовн. дані'), A(18, 'Structure Score', 'обхід'),
    A(19, 'Structure Gap Map', 'обхід'), A(20, 'Priority Matrix', 'обхід'), A(21, 'Structure Roadmap', 'обхід'),
    A(22, 'ТЗ на зміну архітектури', 'обхід'),
  ];

  const contextNote = 'Structure & Site Tree Audit іде після Strategic і перед Page/Block-аудитами: спершу визначаємо, які сторінки й гілки МАЮТЬ існувати, і лише потім оцінюємо якість реалізації. Вимірюване з обходу рахуємо детерміновано; конкурентні дерева, дані Search Console/Analytics, CMS-обмеження — вхід ззовні, позначено «зовн. дані/н/д».';

  /* ── Спайн ── */
  const spine: StructLayer[] = [
    { id: 'SR1', title: 'SR1 · Page Types & Entity Model', principle: 'Спершу класифікуємо всі URL і сутності бізнесу: дві сторінки можуть виглядати однаково, але виконувати різні функції.', state: `${typesPresent}/${pageTypes.length} типів сторінок присутні; ~${ci.config.products} товарів, ~${ci.config.categories} категорій.` },
    { id: 'SR2', title: 'SR2 · Current Tree & Taxonomy', principle: 'Фіксуємо фактичне дерево й основну класифікацію — нічого поки не виправляючи.', state: `Гілок верхнього рівня: ${arch.totals.l1}; глибина ${arch.totals.maxDepth}; проблем структури ${arch.issues.length}.` },
    { id: 'SR3', title: 'SR3 · Commercial Axes', principle: 'Сучасний e-commerce — не одне дерево: бренди/колекції/подарунки/sale/сценарії потребують окремих осей і точок входу.', state: `Осей є ${axes.filter((a) => a.exists).length}/${axes.length}; без точки входу — ${axes.filter((a) => a.exists && !a.hasEntry).length}.` },
    { id: 'SR4', title: 'SR4 · Navigation · Entry / Exit', principle: 'У кожної важливої сторінки — зрозумілий вхід і вихід далі; інакше orphan і тупики.', state: `Orphan-сторінок: ${orphans.length}; структурних тупиків: ${deadEnds.length}.` },
    { id: 'SR5', title: 'SR5 · Filters · Landing · URL', principle: 'Що має бути категорією, що фільтром, що фасетним landing; URL відображає дерево, без crawl-пасток.', state: `Параметричних URL: ${arch.totals.paramUrls}${arch.totals.paramUrls > 40 ? ' — ризик пасток' : ''}.` },
    { id: 'SR6', title: 'SR6 · Content & SEO Architecture', principle: 'Вертикаль article → hub → category → product і посадкові під попит; дерево + граф.', state: `Контентна архітектура: ${kinds.has('content') ? 'є інфо-шар' : 'немає hub'}; горизонтальні звʼязки: ${has('related') ? 'частково' : 'слабко'}.` },
    { id: 'SR7', title: 'SR7 · Scalability & Graph', principle: 'Не зламається при рості асортименту в 10–100×; звʼязність графа, hubs, перевантажені вузли.', state: `Глибина ${arch.totals.maxDepth}; ${links.length} унік. URL; connectivity ${connectivity}/10.` },
    { id: 'SR8', title: 'SR8 · Target Tree · Gaps · Roadmap', principle: 'Фінал — не список проблем, а доведене цільове дерево + gaps → roadmap → ТЗ.', state: `Розривів ${gaps.length} (${gaps.filter((g) => g.priority === 'P0').length} × P0); roadmap — ${roadmap.length} фаз; артефактів ${artifacts.length}.` },
  ];

  return {
    client, takenAt: ds.takenAt, spine, health, score, pageTypes, currentTree, targetTree, axes,
    entryPoints, orphans, deadEnds, clickDepth, linking, blockCards, gaps, opportunities, roadmap, artifacts, contextNote,
  };
}
