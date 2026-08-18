/**
 * E-COMMERCE / MERCHANDISING AUDIT — як сайт керує асортиментом і перетворює його
 * представлення на комерційний результат. Відповідає не «чи є товари», а «чи
 * показуємо ПРАВИЛЬНИЙ товар ПРАВИЛЬНОМУ користувачу в ПРАВИЛЬНИЙ момент у
 * ПРАВИЛЬНОМУ місці з ПРАВИЛЬНИМ оффером».
 *
 * Формула: Right Product → Right User → Right Moment → Right Position → Right
 * Message → Right Offer → Right Next Action.
 *
 * Два чесні шари:
 *  1) Вимірюване з обходу: наявність merchandising-механік (bestseller/new/sale,
 *     фільтри/сортування/пошук, картка товару, рекомендації/cross-sell/bundles,
 *     OOS, badges), шляхи discovery, пороги доставки.
 *  2) Вимірюване лише з БІЗНЕС-ДАНИХ (позначено «н/д»): visibility vs revenue/margin
 *     share, ranking logic, продажі, залишки, конверсія товару, category performance,
 *     search analytics, recommendation CTR, AOV, персоналізація. Вхід із GA/CRM/PIM.
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';
import { buildIntelligence } from './intelligence.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type MerchLayer = { id: string; title: string; principle: string; state: string };
export type HealthZone = { key: string; label: string; score: number; note: string };
export type ScoreZone = { key: string; label: string; score: number; measured: boolean };
export type MechRow = { mech: string; group: string; present: boolean; priority: Priority; note: string };
export type CardElement = { el: string; present: boolean; role: string };
export type DiscoveryPath = { path: string; available: boolean };
export type MerchBlockCard = {
  page: string; key: string; name: string; task: string;
  current: string; problem: string; golden: string; recommendation: string; effect: string; priority: Priority;
};
export type PageTask = { page: string; task: string };
export type MerchGap = { title: string; why: string; create: string; priority: Priority };

export type MerchFlowReport = {
  client: string; takenAt: string; businessType: string; products: number; categories: number;
  spine: MerchLayer[];
  health: { zones: HealthZone[]; overall: number };
  score: { zones: ScoreZone[]; overall: number };
  mechanics: MechRow[];
  cardElements: CardElement[];
  discovery: { paths: DiscoveryPath[]; count: number };
  pageTasks: PageTask[];
  blockCards: MerchBlockCard[];
  gaps: MerchGap[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: { n: number; name: string; source: 'обхід' | 'бізнес-дані' }[];
  contextNote: string;
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const shortUrl = (u: string) => { try { const x = new URL(u); return x.pathname === '/' ? '/' : x.pathname; } catch { return u; } };

/* ── Merchandising-анатомія блоку ── */
type MTpl = { task: string; golden: string; recommendation: string; effect: string; problem: string };
const M_TPL: Record<string, MTpl> = {
  product_grid: { task: 'Ranking + картки — ядро discovery', golden: 'Керований default-ranking (продажі/конверсія/наявність/свіжість), картка: фото/ціна/стара ціна/рейтинг/badge/наявність/quick-add/варіанти.', recommendation: 'Підключити керований ranking + повну картку з badge й наявністю.', effect: 'Правильні товари вгорі → вищий product discovery і CTR', problem: 'некерований порядок / бідна картка (немає рейтингу, badge, наявності)' },
  filters: { task: 'Фільтр як merchandising-інструмент', golden: 'Пріоритет фільтрів за важливістю вибору (розмір/бренд/матеріал/колір/ціна), лічильники, без zero-result комбінацій, dynamic filtering.', recommendation: 'Впорядкувати фільтри за важливістю + лічильники + прибрати zero-result.', effect: 'Клієнт швидше знаходить комерційно релевантний товар', problem: 'фасети не за важливістю / без лічильників / ведуть у 0 результатів' },
  sort: { task: 'Сортування під Intent', golden: 'Набір сортувань (рекомендовані/популярні/новинки/ціна/рейтинг/знижка); default — керований мерчандайзинг, не «як лягло з бази».', recommendation: 'Задати керований default-sort під бізнес і Intent категорії.', effect: 'Default-ranking — найсильніший merchandising-важіль', problem: 'default-сортування некероване / не під Intent' },
  related: { task: 'Recommendations + cross-sell/upsell', golden: 'ТРИ сценарії: схожі (порятунок), «з цим беруть» (cross-sell, AOV), інші кольори/дорожча альтернатива (upsell). Релевантність за co-purchase/поведінкою.', recommendation: 'Розділити на схожі / cross-sell / upsell із релевантною логікою.', effect: 'Зростання AOV і глибини перегляду', problem: 'одна карусель замість cross-sell/upsell; нерелевантні рекомендації' },
  variants: { task: 'Upsell / вибір варіанта', golden: 'Good→Better→Best зрозуміло; недоступні варіанти перекреслені (не приховані); ціна/наявність оновлюються.', recommendation: 'Показати варіанти з різницею цінності; недоступні — перекреслити.', effect: 'Керований upsell, менше помилок вибору', problem: 'немає логіки Good/Better/Best; недоступні приховані' },
  price: { task: 'Pricing + anchoring', golden: 'Ціна одразу, стара ціна чесна, економія словами, ціна за одиницю; ціннісне оточення (premium→standard) для anchoring.', recommendation: 'Показати економію конкретно + anchoring преміумом.', effect: 'Швидке розуміння вигоди → менше тертя', problem: 'вигода нечітка / немає anchoring' },
  reviews: { task: 'Соц. доказ як merchandising', golden: 'Рейтинг у картці й на PLP, «bestseller/популярне» на реальних даних, картка товару всередині відгуку.', recommendation: 'Винести рейтинг у картку + real-data bestseller-badge.', effect: 'Соц. доказ підсилює discovery й конверсію', problem: 'рейтинг не в картці; bestseller — декоративний label' },
  usp_bar: { task: 'Оффер/пороги (free shipping, bundle)', golden: 'Видимий поріг безкоштовної доставки з прогресом і добором; бандли/набори; threshold-оффери.', recommendation: 'Додати прогрес до порогу доставки + добір товарів.', effect: 'Зростання середнього чека (AOV)', problem: 'немає порогів/бандлів/добору для AOV' },
  hero: { task: 'Hero-products / кампанійний merchandising', golden: 'Керовані добірки (bestsellers/новинки/сезон/кампанія) з точками входу, а не випадкові товари.', recommendation: 'Зробити hero-добірки керованими під бізнес/сезон.', effect: 'Discovery саме тих товарів, що вигідні бізнесу', problem: 'випадкові товари замість керованих hero-добірок' },
};
const MERCH_BLOCKS = new Set(Object.keys(M_TPL));
const priFor = (state: BlockState, weight: string): Priority => {
  const bad = state === 'gap' || state === 'weak';
  const r = bad ? (weight === 'core' ? 0 : weight === 'important' ? 1 : 2) : (weight === 'core' ? 1 : weight === 'important' ? 2 : 3);
  return (['P0', 'P1', 'P2', 'P3'] as const)[r];
};

export function buildMerchFlow(ds: AuditDataset): MerchFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const ci = buildIntelligence(ds);
  const site = buildSiteAudit(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const links = ds.client.links ?? [];
  const lpath = (h: string) => { try { return new URL(h).pathname.toLowerCase(); } catch { return ''; } };
  const hasLink = (re: RegExp) => links.some((h) => re.test(lpath(h)));
  const anyBlock = new Set<string>();
  for (const p of pages) for (const [k, v] of Object.entries(p.ux!.blocks ?? {})) if (v) anyBlock.add(k);
  const has = (...k: string[]) => k.some((x) => anyBlock.has(x));
  const kinds = new Set(pages.map((p) => p.kind));
  // сигнали з ux-проб.
  const anyReviews = pages.some((p) => p.ux?.reviews);
  const anyVariants = pages.some((p) => p.ux?.variantSelector);
  const anySort = pages.some((p) => p.ux?.sortControl);
  const anyFilters = pages.some((p) => p.ux?.filters);
  const anySearch = pages.some((p) => p.ux?.blocks?.search);

  /* ── Механіки ── */
  const M = (mech: string, group: string, present: boolean, pr: Priority, note: string): MechRow => ({ mech, group, present, priority: present ? 'P3' : pr, note });
  const mechanics: MechRow[] = [
    M('Внутрішній пошук', 'Discovery', anySearch, 'P1', anySearch ? 'пошук є — перевірити autocomplete/synonyms/zero-results' : 'немає пошуку — втрата шляху до товару'),
    M('Фільтри', 'Discovery', anyFilters, 'P1', anyFilters ? 'фасети є — перевірити пріоритет і лічильники' : 'немає фільтрів'),
    M('Сортування', 'Ranking', anySort, 'P1', anySort ? 'сортування є — перевірити керований default' : 'немає керованого сортування'),
    M('Bestseller / популярне', 'Ranking', hasLink(/best|hit|popular|top/) || has('product_grid'), 'P2', 'bestseller має бути на реальних даних, не декоративний label'),
    M('Новинки', 'Ranking', hasLink(/new|novink/), 'P2', hasLink(/new|novink/) ? 'є розділ новинок' : 'немає керованого періоду visibility для новинок'),
    M('Sale / розпродаж', 'Promotion', hasLink(/sale|akci|skidk|discount/), 'P2', 'перевірити: промо збільшує продажі чи лише зменшує маржу'),
    M('Рекомендації / related', 'Revenue', has('related'), 'P1', has('related') ? 'блок є — перевірити релевантність і логіку' : 'немає рекомендацій'),
    M('Cross-sell («з цим беруть»)', 'Revenue', has('related'), 'P1', 'окремий сценарій cross-sell для AOV'),
    M('Upsell (Good/Better/Best)', 'Revenue', anyVariants, 'P2', anyVariants ? 'варіанти є — перевірити логіку upsell' : 'немає логіки upsell'),
    M('Бандли / набори', 'Revenue', hasLink(/bundle|nabor|komplekt|set/), 'P2', 'бандли підвищують AOV'),
    M('Поріг безкоштовної доставки', 'AOV', hasLink(/dostavka|delivery/) || has('usp_bar'), 'P2', 'поріг із прогресом і добором — сильна AOV-механіка'),
    M('Badge-стратегія (New/Sale/Low stock)', 'Discovery', has('product_grid'), 'P2', 'badges мають бути з реальним обґрунтуванням, без перевантаження'),
    M('Рейтинг у картці', 'Trust', anyReviews, 'P2', anyReviews ? 'рейтинг/відгуки є' : 'немає соц. доказу в картці'),
    M('Recently viewed / персоналізація', 'Personalization', has('recently_viewed'), 'P2', 'персоналізація — після даних поведінки (CRM/аналітика)'),
    M('Wishlist / обране', 'Retention', has('wishlist') || hasLink(/wishlist|favorite/), 'P3', 'збереження наміру, повернення'),
  ];

  /* ── Картка товару (merchandising-елементи) ── */
  const pdp = pages.find((p) => p.kind === 'pdp');
  const b = pdp?.ux?.blocks ?? {};
  const cardElements: CardElement[] = [
    { el: 'Фото товару', present: !!(pdp?.ux?.galleryImages && pdp.ux.galleryImages > 0) || !!b.gallery, role: 'перше, що бачить користувач' },
    { el: 'Назва / бренд', present: !!b.product_header, role: 'ідентифікація' },
    { el: 'Ціна', present: !!(pdp?.ux?.priceVisible) || !!b.price, role: 'опора рішення' },
    { el: 'Стара ціна / знижка', present: hasLink(/sale|akci|skidk/), role: 'вигода / anchoring' },
    { el: 'Рейтинг / відгуки', present: !!(pdp?.ux?.reviews) || !!b.reviews, role: 'соц. доказ' },
    { el: 'Badge (New/Sale/Bestseller)', present: false, role: 'merchandising-акцент (потребує даних)' },
    { el: 'Наявність', present: !!b.delivery || !!b.price, role: 'керує ranking і рішенням' },
    { el: 'Варіанти (розмір/колір)', present: !!(pdp?.ux?.variantSelector) || !!b.variants, role: 'вибір + upsell' },
    { el: 'Quick add / CTA', present: !!(pdp?.ux?.addToCartProminent) || !!b.add_to_cart, role: 'дія' },
    { el: 'Wishlist / порівняння', present: has('wishlist') || hasLink(/compare|wishlist/), role: 'retention / вибір' },
  ];

  /* ── Discovery paths ── */
  const paths: DiscoveryPath[] = [
    { path: 'Навігація / меню', available: has('nav') },
    { path: 'Пошук', available: anySearch },
    { path: 'Категорія', available: kinds.has('plp') },
    { path: 'Фільтр', available: anyFilters },
    { path: 'Бренд', available: hasLink(/brand|brend/) },
    { path: 'Колекція', available: hasLink(/collection|kolekc|seri/) },
    { path: 'Рекомендації', available: has('related') },
    { path: 'Контент / гайд', available: kinds.has('content') },
    { path: 'Головна (hero-добірки)', available: has('product_grid', 'hero') },
    { path: 'Кампанія / sale', available: hasLink(/sale|akci|gift|podar/) },
  ];
  const discoveryCount = paths.filter((p) => p.available).length;

  /* ── Page-by-page merchandising tasks ── */
  const TASKS: Partial<Record<PageKind, string>> = {
    home: 'Discovery / Hero Products — керовані добірки, точки входу в осі',
    plp: 'Ranking / Filters — керований default-sort, пріоритет фільтрів, картки',
    pdp: 'Cross-sell / Upsell — related-сценарії, варіанти, рейтинг у картці',
    checkout: 'AOV — добір до порогу доставки без перевантаження checkout',
    content: 'Assisted discovery — переходи з гайдів у категорії/товари',
  };
  const pageTasks: PageTask[] = pages.filter((p, i, a) => a.findIndex((x) => x.kind === p.kind) === i).map((p) => ({ page: KIND_LABEL[p.kind], task: TASKS[p.kind] ?? '—' })).filter((t) => t.task !== '—');

  /* ── Block-by-block merchandising cards ── */
  const KEY: PageKind[] = ['home', 'plp', 'pdp'];
  const blockCards: MerchBlockCard[] = [];
  for (const pr of site.pages) {
    if (!KEY.includes(pr.kind)) continue;
    for (const row of pr.rows) {
      if (!MERCH_BLOCKS.has(row.key) || row.state === 'ok') continue;
      const tpl = M_TPL[row.key];
      blockCards.push({
        page: KIND_LABEL[pr.kind], key: row.key, name: row.name, task: tpl.task,
        current: row.now, problem: row.state === 'gap' ? `блок відсутній — ${tpl.problem}` : tpl.problem,
        golden: tpl.golden, recommendation: tpl.recommendation, effect: tpl.effect, priority: priFor(row.state, row.weight),
      });
    }
  }
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  blockCards.sort((a, b) => priRank[a.priority] - priRank[b.priority]);

  /* ── Gap Map ── */
  const gaps: MerchGap[] = [];
  if (!has('related')) gaps.push({ title: 'Немає рекомендацій / cross-sell / upsell', why: 'Втрачений AOV: сайт не добирає супутнє й не пропонує дорожчу альтернативу', create: 'Related (схожі) + cross-sell («з цим беруть») + upsell (Good/Better/Best)', priority: 'P1' });
  if (!anySearch) gaps.push({ title: 'Немає внутрішнього пошуку', why: 'Клієнт без знання назви категорії не знаходить товар → втрата discovery', create: 'Пошук з autocomplete/synonyms/typo-tolerance і merchandising-ranking', priority: 'P1' });
  if (!hasLink(/bundle|nabor|komplekt/)) gaps.push({ title: 'Немає бандлів / наборів', why: 'Не використаний важіль AOV і сценарій «готове рішення»', create: 'Бандли/набори/стартер-кіти з вигодою', priority: 'P2' });
  gaps.push({ title: 'Немає керованого ranking (visibility vs бізнес-пріоритет)', why: 'Товари, вигідні бізнесу (маржа/залишки), можуть не отримувати visibility', create: 'Ranking Relevance → Customer Value → Business Value (після даних продажів/маржі)', priority: 'P1' });
  if (!hasLink(/new|novink/)) gaps.push({ title: 'Немає керованого циклу новинок', why: 'Нові товари не отримують контрольованого періоду visibility', create: 'Блок/розділ новинок + badge + період підвищеної visibility', priority: 'P2' });

  /* ── Merchandising Health Score (5 зон) ── */
  const cardShare = cardElements.filter((c) => c.present).length / cardElements.length;
  const discovery = clamp10((discoveryCount / paths.length) * 10);
  const relevance = clamp10((anyFilters ? 3 : 1) + (anySort ? 3 : 1) + (anySearch ? 2 : 0) + (has('related') ? 2 : 0));
  const commercialVis = clamp10((has('product_grid') ? 3 : 1) + (hasLink(/best|new|sale/) ? 2 : 0) + cardShare * 5);
  const revenueOpt = clamp10((has('related') ? 4 : 1) + (anyVariants ? 2 : 0) + (hasLink(/bundle|nabor/) ? 2 : 0) + (has('usp_bar') ? 2 : 0));
  const personalization = clamp10((has('recently_viewed') ? 3 : 0) + ((ci.config.analytics && ci.config.analytics !== '—') ? 2 : 0) + 1);
  const health = {
    zones: [
      { key: 'discovery', label: 'Product Discovery', score: discovery, note: 'Наскільки легко знайти потрібний товар' },
      { key: 'relevance', label: 'Product Relevance', score: relevance, note: 'Наскільки релевантні результати/ranking' },
      { key: 'commercialVis', label: 'Commercial Visibility', score: commercialVis, note: 'Чи правильні товари отримують exposure' },
      { key: 'revenueOpt', label: 'Revenue Optimization', score: revenueOpt, note: 'Cross/upsell/bundles/AOV-механіки' },
      { key: 'personalization', label: 'Personalization', score: personalization, note: 'Адаптація merchandising під користувача' },
    ],
    overall: clamp10((discovery + relevance + commercialVis + revenueOpt + personalization) / 5),
  };

  /* ── Merchandising Score (20 зон) ── */
  const z = (key: string, label: string, score: number, measured = true): ScoreZone => ({ key, label, score: measured ? clamp10(score) : 0, measured });
  const score = {
    zones: [
      z('strategy', 'Merchandising Strategy', (has('product_grid') ? 5 : 2) + (hasLink(/best|new|sale/) ? 3 : 0)),
      z('assortment', 'Assortment', ci.config.products > 100 ? 7 : ci.config.products > 20 ? 5 : 3),
      z('category', 'Category Management', (kinds.has('plp') ? 5 : 2) + (has('category_description') ? 2 : 0)),
      z('visibility', 'Product Visibility', discovery),
      z('ranking', 'Ranking', (anySort ? 5 : 2) + (has('product_grid') ? 2 : 0)),
      z('search', 'Search', anySearch ? 6 : 2),
      z('filters', 'Filters', anyFilters ? 6 : 2),
      z('cards', 'Product Cards', cardShare * 10),
      z('reco', 'Recommendations', has('related') ? 6 : 2),
      z('crosssell', 'Cross-sell', has('related') ? 5 : 2),
      z('upsell', 'Upsell', anyVariants ? 5 : 2),
      z('bundles', 'Bundles', hasLink(/bundle|nabor/) ? 6 : 2),
      z('promotions', 'Promotions', hasLink(/sale|akci|skidk/) ? 5 : 3),
      z('pricing', 'Pricing (presentation)', (pdp?.ux?.priceVisible ? 5 : 2) + (hasLink(/sale/) ? 2 : 0)),
      z('scalability', 'Scalability', ci.config.categories >= 5 ? 6 : 4),
      z('seasonal', 'Seasonal Merchandising', hasLink(/sale|new|gift|sezon/) ? 5 : 3),
      z('aov', 'AOV Strategy', (has('related') ? 3 : 1) + (has('usp_bar') ? 2 : 0) + (anyVariants ? 2 : 0)),
      // Бізнес-дані:
      z('inventory', 'Inventory Merchandising', 0, false),
      z('margin', 'Margin Merchandising', 0, false),
      z('analytics', 'Merchandising Analytics', 0, false),
    ],
    overall: 0,
  };
  const sm = score.zones.filter((zz) => zz.measured);
  score.overall = sm.length ? clamp10(sm.reduce((s, zz) => s + zz.score, 0) / sm.length) : 0;

  /* ── Roadmap (5 фаз) ── */
  const roadmap = [
    { phase: 'Phase 1 · Foundation', items: ['Дані товарів/атрибути/наявність/ціни впорядкувати', ...(anySort ? [] : ['Керований default-ranking'])] },
    { phase: 'Phase 2 · Discovery', items: [...(anySearch ? ['Покращити пошук (autocomplete/synonyms/zero-results)'] : ['Впровадити внутрішній пошук']), 'Пріоритет фільтрів + лічильники; повна картка товару з badge/наявністю'] },
    { phase: 'Phase 3 · Revenue', items: [...(has('related') ? ['Розділити related на схожі/cross-sell/upsell'] : ['Додати рекомендації/cross-sell/upsell']), 'Бандли + поріг безкоштовної доставки з прогресом'] },
    { phase: 'Phase 4 · Intelligence', items: ['Dynamic ranking (Relevance→Customer Value→Business Value)', 'Персоналізація й behavioral merchandising (після даних)'] },
    { phase: 'Phase 5 · Automation', items: ['Stock-/margin-aware ranking; автоматизація кампаній; AI-рекомендації (після інтеграції даних)'] },
  ].map((p) => ({ phase: p.phase, items: p.items.filter(Boolean) })).filter((p) => p.items.length);

  const artNames = [
    'Merchandising Strategy Map', 'Product Role Map', 'Assortment Map', 'Category Performance Map', 'Product Visibility Map',
    'Ranking Audit', 'Search Merchandising Audit', 'Filter Merchandising Audit', 'Product Card Audit', 'Bestseller Audit',
    'New Arrivals Audit', 'Sale Audit', 'Promotion Audit', 'Recommendation Audit', 'Cross-sell Map', 'Upsell Map',
    'Bundle Map', 'AOV Opportunity Map', 'Inventory Merchandising Map', 'Margin Merchandising Map', 'Personalization Map',
    'Seasonal Merchandising Map', 'Golden Standard Benchmark', 'Product Opportunity Matrix', 'Category Health Matrix',
    'Merchandising Score', 'Merchandising Gap Map', 'Priority Matrix', 'Merchandising Roadmap', 'ТЗ на merchandising-механіки',
  ];
  const BIZ = /(Performance|Visibility Map|Ranking Audit|Inventory|Margin|Personalization|Category Health|Product Opportunity|Analytics)/;
  const artifacts = artNames.map((name, i) => ({ n: i + 1, name, source: (BIZ.test(name) ? 'бізнес-дані' : 'обхід') as 'обхід' | 'бізнес-дані' }));

  const contextNote = 'E-commerce/Merchandising Audit — «правильний товар, правильному користувачу, у правильний момент і місце, з правильним оффером». Вимірюване з обходу (наявність механік, картка, шляхи discovery) рахуємо детерміновано. Visibility vs revenue/margin share, ranking logic, продажі, залишки, category performance, search analytics, AOV, персоналізація — вимірюються лише з бізнес-даними (GA/CRM/PIM/ERP), позначено «н/д». Цифри не вигадуються.';

  const spine: MerchLayer[] = [
    { id: 'MR1', title: 'MR1 · Strategy & Product Roles', principle: 'Чи збігається те, що бізнес хоче продавати, з тим, що сайт фактично показує; ролі товарів (traffic/hero/margin/entry…).', state: `Тип: ${ci.config.businessType}; ~${ci.config.products} товарів, ${ci.config.categories} категорій. Дані ролей/маржі — бізнес-контекст.` },
    { id: 'MR2', title: 'MR2 · Assortment & Gaps', principle: 'Повнота/ширина/глибина матриці; прогалини — характеристики/бренди/сегменти, які шукають, але яких немає.', state: `${gaps.length} merchandising-розривів; ${gaps.filter((g) => g.priority === 'P1').length} × P1.` },
    { id: 'MR3', title: 'MR3 · Visibility & Discovery', principle: 'Скільки реальних шляхів до товару; visibility share vs revenue/margin share (потребує даних).', state: `${discoveryCount}/${paths.length} шляхів discovery доступні.` },
    { id: 'MR4', title: 'MR4 · Ranking · Search · Filters', principle: 'Default-ranking — найсильніший важіль; пошук і фільтри — merchandising, не лише UX.', state: `Пошук: ${anySearch ? 'є' : 'немає'}; фільтри: ${anyFilters ? 'є' : 'немає'}; сортування: ${anySort ? 'є' : 'немає'}.` },
    { id: 'MR5', title: 'MR5 · Product Cards & Badges', principle: 'Картка — merchandising-інструмент: фото/ціна/рейтинг/badge/наявність/quick-add/варіанти.', state: `Елементів картки присутньо: ${cardElements.filter((c) => c.present).length}/${cardElements.length}.` },
    { id: 'MR6', title: 'MR6 · Recommendations · Cross/Upsell · AOV', principle: 'Right Next Action: релевантні рекомендації, cross/upsell, бандли, пороги — важелі AOV.', state: `Рекомендації: ${has('related') ? 'є' : 'немає'}; бандли: ${hasLink(/bundle|nabor/) ? 'є' : 'немає'}.` },
    { id: 'MR7', title: 'MR7 · Inventory · Margin · Personalization', principle: 'Visibility товарів, які треба реалізувати (залишки/маржа) — без руйнування релевантності; персоналізація.', state: 'Inventory/Margin/Personalization — потрібні бізнес-дані (позначено «н/д»).' },
    { id: 'MR8', title: 'MR8 · Score · Gap · Roadmap', principle: 'Merchandising Health/Score → gap → пріоритет (Business × Revenue × Customer × Exposure / Effort) → roadmap → ТЗ.', state: `Merchandising Health ${health.overall}/10; Score ${score.overall}/10; блоків із правками ${blockCards.length}.` },
  ];

  return { client, takenAt: ds.takenAt, businessType: ci.config.businessType, products: ci.config.products, categories: ci.config.categories, spine, health, score, mechanics, cardElements, discovery: { paths, count: discoveryCount }, pageTasks, blockCards, gaps, roadmap, artifacts, contextNote };
}
