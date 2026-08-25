/**
 * SEO-аудит як ЦІЛІСНА СИСТЕМА, а не «мета-теги + помилки індексації».
 *
 * Для e-commerce SEO — це перевірка, чи здатний сайт СИСТЕМНО отримувати
 * органічний трафік, масштабувати видимість і конвертувати її в гроші. Логіка —
 * послідовна: Стратегія → Структура → Crawl/Index → Семантика/Intent →
 * Постраничний → Поблоковий → Проблеми/Можливості → Roadmap. Результат — не
 * технічний звіт, а 8 артефактів: Strategy Map · Site Tree · Semantic Map ·
 * Technical Map · Page-by-Page · Block-by-Block · Problem/Opportunity Map ·
 * Growth Roadmap.
 *
 * Модуль детермінований: спирається на зовнішній обхід (seoarch: дерево, issues,
 * on-page; site-audit: блоки; сигнали crawl: canonical/schema/hreflang/robots/
 * sitemap/soft404/linkHealth/llms.txt). Те, що вимірюється лише з доступом до
 * Search Console / GA / backlink-інструментів, чесно позначаємо «н/д».
 */
import type { AuditDataset } from './report.js';
import type { PageKind, PageAudit } from './crawl.js';
import { buildSeoArch } from './seoarch.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Intent = 'commercial' | 'transactional' | 'informational' | 'navigational';

export type SeoLayer = { id: string; title: string; principle: string; state: string };
export type SeoScoreZone = { key: string; label: string; score: number; note: string; measured: boolean };
export type StrategyRow = { direction: string; purpose: string; drives: string; priority: Priority };
export type SemanticRow = { cluster: string; intent: Intent; url: string; pageType: string; status: 'ok' | 'weak' | 'missing'; priority: Priority };
export type TechRow = { area: string; check: string; status: 'ok' | 'warn' | 'gap' | 'na'; detail: string };

export type SeoBlockCard = {
  page: string; pageUrl: string; key: string; name: string;
  now: string; should: string;
  seoValue: number; content: number; linking: number; aeo: number; // осі 1..5
  score: number; priority: Priority;
  recommendation: string; effect: string;
};

export type SeoPageCard = {
  page: string; url: string; targetIntent: Intent;
  indexation: string; title: string; description: string; h1: string;
  schema: string; canonical: string; internalLinks: string;
  gap: string; recommendation: string; priority: Priority;
};

export type SeoProblem = {
  problem: string; where: string; seoConseq: string; bizConseq: string;
  should: string; priority: Priority; effort: number; effect: string;
};
export type SeoOpportunity = { title: string; chain: string; effect: string; priority: Priority };

export type SeoFlowReport = {
  client: string; takenAt: string;
  spine: SeoLayer[];
  score: { zones: SeoScoreZone[]; overall: number };
  strategy: StrategyRow[];
  semantic: SemanticRow[];
  technical: TechRow[];
  pageCards: SeoPageCard[];
  blockCards: SeoBlockCard[];
  problems: SeoProblem[];
  opportunities: SeoOpportunity[];
  roadmap: { stage: string; items: string[] }[];
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const clamp5 = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
const half = (n: number) => Math.round(Math.max(1, Math.min(5, n)) * 2) / 2;
const shortUrl = (u: string) => { try { const x = new URL(u); return x.pathname === '/' ? '/' : x.pathname; } catch { return u; } };
const chk = (p: PageAudit, id: string) => p.checks.find((c) => c.id === id);
const pass = (p: PageAudit, id: string) => !!chk(p, id)?.pass;

// Intent за типом сторінки.
const INTENT_BY_KIND: Record<PageKind, Intent> = { home: 'navigational', plp: 'commercial', pdp: 'transactional', cart: 'transactional', checkout: 'transactional', content: 'informational', faq: 'informational', other: 'navigational' };
const INTENT_LABEL: Record<Intent, string> = { commercial: 'комерційний', transactional: 'транзакційний', informational: 'інформаційний', navigational: 'навігаційний' };

/* ── SEO-анатомія блоку: як має бути + осьові акценти + ефект (шаблони) ── */
type STpl = { should: string; recommendation: string; effect: string; seoStrong?: boolean; linkStrong?: boolean; aeoStrong?: boolean };
const S_TPL: Record<string, STpl> = {
  faq: { should: 'Питання за реальним пошуковим попитом, повні відповіді 40–60 слів, FAQPage-розмітка, посилання на категорії/умови (не «глухий кут»).', recommendation: 'Перебудувати FAQ під попит → додати відповіді й виходи-посилання → впровадити schema.org/FAQPage.', effect: 'Тематичне покриття + внутрішні посилання + прямі/AI-відповіді (AEO).', seoStrong: true, aeoStrong: true, linkStrong: true },
  category_description: { should: 'Короткий корисний вступ під сіткою (60–90 слів) із ключовими сутностями категорії + перелінковка на підкатегорії/гайди. Не «портянка» заради щільності ключів.', recommendation: 'Додати SEO-текст під сіткою з семантикою й перелінковкою на дочірні розділи.', effect: 'Категорія починає збирати середньо- і низькочастотний попит.', seoStrong: true, linkStrong: true },
  breadcrumbs: { should: 'Повний шлях із розміткою BreadcrumbList — передача ваги за структурою і sitelinks у видачі.', recommendation: 'Додати повні хлібні крихти з BreadcrumbList-розміткою.', effect: 'Краща індексація структури, sitelinks, розподіл ваги.', linkStrong: true },
  category_title: { should: 'H1 із предметом категорії (не «Каталог»), що збігається з основним комерційним кластером.', recommendation: 'Переписати H1 під цільовий кластер категорії.', effect: 'Вища релевантність посадкової під комерційні запити.', seoStrong: true },
  description: { should: 'Опис із сутностями товару, характеристиками словами, сценаріями — інформаційний приріст, який цитують генеративні системи.', recommendation: 'Розширити опис сутностями/сценаріями замість тексту постачальника.', effect: 'Семантична повнота + цитованість в AI-видачі (AEO).', seoStrong: true, aeoStrong: true },
  specifications: { should: 'Характеристики таблицею зі значеннями «число + сенс», атрибути з довідника — джерело для порівнянь і фільтрів.', recommendation: 'Винести характеристики в структуровану таблицю з довідника атрибутів.', effect: 'Покриття атрибутивних запитів + дані для фасетних посадкових.', seoStrong: true, aeoStrong: true },
  reviews: { should: 'Відгуки з розміткою Review/AggregateRating — зірки в сніпеті, UGC під запити «X відгуки».', recommendation: 'Додати відгуки з Review/AggregateRating-розміткою.', effect: 'Rich-сніпет із зірками (вищий CTR) + покриття запитів «відгуки».', seoStrong: true, aeoStrong: true },
  related: { should: 'Релевантні перелінковки: «схожі», «з цим беруть», «інші кольори» — контекстні внутрішні посилання, а не одна карусель.', recommendation: 'Додати релевантні блоки перелінковки між товарами й категоріями.', effect: 'Глибша перелінковка, розподіл ваги, більше проіндексованих сторінок.', linkStrong: true },
  product_grid: { should: 'Картки з мікророзміткою (Product/Offer/rating), керовані добірки — сигнали для ItemList і Shopping.', recommendation: 'Додати мікророзмітку карток і керований мерчандайзинг сітки.', effect: 'Кращі сигнали ItemList/Shopping, глибина обходу каталогу.', seoStrong: true },
  qa: { should: 'Q&A з розміткою QAPage — унікальні питання покупців, самодостатні відповіді.', recommendation: 'Додати Q&A з QAPage-розміткою.', effect: 'Унікальний контент під long-tail + AEO.', aeoStrong: true, seoStrong: true },
  author: { should: 'Автор з експертизою, дата оновлення, біо — сигнали E-E-A-T для пошуку й AI.', recommendation: 'Додати авторство й дату оновлення до інфо-контенту.', effect: 'Сильніший E-E-A-T, вища довіра пошуку/AI.', aeoStrong: true },
  toc: { should: 'Якірний зміст для довгих матеріалів — навігація і sitelinks у видачі.', recommendation: 'Додати якірний зміст із посиланнями на розділи.', effect: 'Sitelinks + краща читабельність довгих сторінок.', linkStrong: true },
  footer_contacts: { should: 'Повні реквізити (юрособа, адреса), правові сторінки, оплата/доставка — сигнали довіри й внутрішня перелінковка.', recommendation: 'Додати повні реквізити й правові сторінки у футер.', effect: 'Сигнали E-E-A-T + перелінковка службових сторінок.', linkStrong: true },
};
const SEO_BLOCKS = new Set(Object.keys(S_TPL));

const stateScore: Record<BlockState, number> = { ok: 5, weak: 3, check: 2.5, gap: 1 };
const priFor = (state: BlockState, weight: string): Priority => {
  const bad = state === 'gap' || state === 'weak';
  const r = bad ? (weight === 'core' ? 0 : weight === 'important' ? 1 : 2) : (weight === 'core' ? 1 : weight === 'important' ? 2 : 3);
  return (['P0', 'P1', 'P2', 'P3'] as const)[r];
};

export function buildSeoFlow(ds: AuditDataset): SeoFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }

  const arch = buildSeoArch(ds);
  const site = buildSiteAudit(ds);
  const pages = ds.client.pages.filter((p) => !p.error);
  const cl = ds.client;

  // Агреговані on-page сигнали.
  const nP = pages.length || 1;
  const rate = (id: string) => pages.filter((p) => pass(p, id)).length / nP;
  const titleOk = rate('title'), descOk = rate('desc'), h1Ok = rate('h1'), canonOk = rate('canonical');
  const schemaProd = rate('schema-product'), schemaCrumbs = rate('schema-crumbs'), schemaOrg = rate('schema-org');
  const ogOk = rate('og'), noindexClean = rate('noindex'), hreflangOk = rate('hreflang'), viewportOk = rate('viewport');
  const anyHreflang = pages.some((p) => pass(p, 'hreflang'));

  /* ── S1 · SEO Strategy Map ── */
  const commercialNodes = arch.tree.filter((t) => t.purpose === 'commercial');
  const infoNodes = arch.tree.filter((t) => t.purpose === 'informational');
  const strategy: StrategyRow[] = [
    { direction: 'Категорії / підкатегорії', purpose: 'Комерційний', drives: 'Основний органічний трафік + продажі (посадкові під категорійні запити)', priority: 'P0' },
    { direction: 'Картки товарів', purpose: 'Транзакційний', drives: 'Long-tail і брендові/модельні запити → продажі', priority: 'P1' },
    { direction: 'Фасети / фільтри як landing', purpose: 'Комерційний', drives: 'Масштабування на атрибутивні запити (розмір/матеріал/колір)', priority: 'P1' },
    { direction: 'База знань / гайди', purpose: 'Інформаційний', drives: 'Верхня воронка + E-E-A-T + перелінковка в каталог', priority: infoNodes.length ? 'P2' : 'P1' },
    { direction: 'Бренди / виробники', purpose: 'Комерційний', drives: 'Брендовий попит, хаби перелінковки', priority: 'P2' },
  ];

  /* ── S2 · Semantic Map (keyword-to-URL) ── */
  const kindsPresent = new Set(pages.map((p) => p.kind));
  const semantic: SemanticRow[] = [
    { cluster: 'Категорійні запити («купити X»)', intent: 'commercial', url: '/category/', pageType: 'Категорія', status: kindsPresent.has('plp') ? (arch.tree.some((t) => t.purpose === 'commercial' && t.severity === 'ok') ? 'ok' : 'weak') : 'missing', priority: 'P0' },
    { cluster: 'Товарні / модельні («X модель, ціна»)', intent: 'transactional', url: '/product/', pageType: 'Картка', status: kindsPresent.has('pdp') ? 'weak' : 'missing', priority: 'P1' },
    { cluster: 'Атрибутивні («X із матеріалу/розміру»)', intent: 'commercial', url: '/category/?facet', pageType: 'Фасетна landing', status: 'missing', priority: 'P1' },
    { cluster: 'Як обрати / порівняння', intent: 'informational', url: '/blog/guide', pageType: 'Гайд', status: kindsPresent.has('content') ? 'weak' : 'missing', priority: 'P1' },
    { cluster: 'Питання («як користуватись», «чи можна»)', intent: 'informational', url: '/faq', pageType: 'FAQ', status: kindsPresent.has('faq') ? 'weak' : 'missing', priority: 'P2' },
    { cluster: 'Брендові («бренд + категорія»)', intent: 'commercial', url: '/brand/', pageType: 'Бренд', status: 'missing', priority: 'P2' },
  ];

  /* ── S3 · Technical SEO Map ── */
  const li = arch.linkHealth;
  const technical: TechRow[] = [
    { area: 'Crawl', check: 'robots.txt', status: cl.robotsTxt ? 'ok' : 'gap', detail: cl.robotsTxt ? 'є' : 'відсутній — обхід не керований' },
    { area: 'Crawl', check: 'Параметричні URL / crawl-пастки', status: arch.totals.paramUrls > 40 ? 'warn' : 'ok', detail: `${arch.totals.paramUrls} URL із параметрами; глибина ${arch.totals.maxDepth}` },
    { area: 'Index', check: 'XML sitemap', status: cl.sitemapXml ? 'ok' : 'gap', detail: cl.sitemapXml ? 'є' : 'відсутній — індексація сповільнена' },
    { area: 'Index', check: 'Soft 404 (200 на неіснуючому URL)', status: cl.soft404 ? 'gap' : (cl.soft404 === false ? 'ok' : 'na'), detail: cl.soft404 ? 'виявлено — засмічення індексу' : (cl.soft404 === false ? 'коректна 404' : 'не перевірено') },
    { area: 'Index', check: 'noindex (немає випадкового)', status: noindexClean >= 0.99 ? 'ok' : 'warn', detail: `${Math.round(noindexClean * 100)}% сторінок без випадкового noindex` },
    { area: 'Canonical', check: 'Canonical заданий', status: canonOk >= 0.9 ? 'ok' : canonOk >= 0.5 ? 'warn' : 'gap', detail: `${Math.round(canonOk * 100)}% розібраних сторінок` },
    { area: 'Redirect', check: 'Ланцюги/биті посилання', status: li ? ((li.broken?.length ?? 0) > 0 ? 'warn' : 'ok') : 'na', detail: li ? `биті: ${li.broken?.length ?? 0}, редиректи: ${li.redirects ?? 0}` : 'свип статусів не виконано' },
    { area: 'Schema', check: 'Organization / WebSite', status: schemaOrg >= 0.5 ? 'ok' : 'gap', detail: `${Math.round(schemaOrg * 100)}% (головна/сайт)` },
    { area: 'Schema', check: 'Product / Offer', status: schemaProd >= 0.5 ? 'ok' : schemaProd > 0 ? 'warn' : 'gap', detail: `${Math.round(schemaProd * 100)}% карток` },
    { area: 'Schema', check: 'BreadcrumbList', status: schemaCrumbs >= 0.5 ? 'ok' : 'gap', detail: `${Math.round(schemaCrumbs * 100)}% сторінок` },
    { area: 'Mobile', check: 'Viewport / mobile-ready', status: viewportOk >= 0.9 ? 'ok' : 'warn', detail: `${Math.round(viewportOk * 100)}% сторінок` },
    { area: 'International', check: 'hreflang', status: anyHreflang ? 'ok' : 'na', detail: anyHreflang ? 'присутній' : 'не виявлено (актуально лише для мультимовних)' },
    { area: 'GEO/AEO', check: 'llms.txt / доступ AI-ботів', status: cl.ai?.llmsTxt ? 'ok' : 'warn', detail: cl.ai?.llmsTxt ? 'llms.txt є' : `llms.txt немає${cl.ai?.blockedBots?.length ? `; блоковані боти: ${cl.ai.blockedBots.join(', ')}` : ''}` },
    { area: 'Performance', check: 'Core Web Vitals (лабораторно)', status: cl.perf ? 'warn' : 'na', detail: cl.perf ? 'знято лабораторно — деталі в тех-аудиті' : 'польові дані — після доступу до CrUX/CWV' },
  ];

  /* ── S5 · Page-by-Page SEO cards ── */
  const KEY: PageKind[] = ['home', 'plp', 'pdp', 'content', 'faq'];
  const pageCards: SeoPageCard[] = [];
  for (const p of pages) {
    if (!KEY.includes(p.kind)) continue;
    if (pageCards.some((c) => c.page === KIND_LABEL[p.kind])) continue; // один представник типу
    const titleD = chk(p, 'title')?.detail ?? (pass(p, 'title') ? 'у нормі' : 'проблема');
    const descD = chk(p, 'desc')?.detail ?? (pass(p, 'desc') ? 'у нормі' : 'відсутній/поза нормою');
    const h1D = chk(p, 'h1')?.detail ?? (pass(p, 'h1') ? 'один H1' : 'H1 відсутній/дублюється');
    const schemaBits = [pass(p, 'schema-product') && 'Product', pass(p, 'schema-crumbs') && 'Breadcrumb', pass(p, 'schema-org') && 'Org'].filter(Boolean);
    const gaps: string[] = [];
    if (!pass(p, 'title')) gaps.push('Title');
    if (!pass(p, 'desc')) gaps.push('Description');
    if (!pass(p, 'h1')) gaps.push('H1');
    if (!pass(p, 'canonical')) gaps.push('canonical');
    if (p.kind === 'pdp' && !pass(p, 'schema-product')) gaps.push('Product-schema');
    if (!pass(p, 'schema-crumbs')) gaps.push('Breadcrumb-schema');
    const pr: Priority = gaps.length >= 3 ? 'P0' : gaps.length >= 1 ? 'P1' : 'P2';
    pageCards.push({
      page: KIND_LABEL[p.kind], url: shortUrl(p.finalUrl || p.url), targetIntent: INTENT_BY_KIND[p.kind],
      indexation: pass(p, 'noindex') ? 'індексується' : 'noindex — виключено з індексу',
      title: titleD, description: descD, h1: h1D,
      schema: schemaBits.length ? schemaBits.join(' · ') : 'немає',
      canonical: pass(p, 'canonical') ? 'заданий' : 'не заданий',
      internalLinks: pass(p, 'schema-crumbs') ? 'хлібні крихти є' : 'слабка перелінковка (немає крихт)',
      gap: gaps.length ? `Бракує: ${gaps.join(', ')}` : 'Критичних on-page прогалин немає',
      recommendation: gaps.length ? `Закрити on-page: ${gaps.join(', ')}; звірити Title/H1 з цільовим кластером (${INTENT_LABEL[INTENT_BY_KIND[p.kind]]} intent).` : 'Тонке налаштування Title під CTR; розширити семантику.',
      priority: pr,
    });
  }

  /* ── S6 · Block-by-Block SEO cards (Fragstore-анатомія) ── */
  const blockCards: SeoBlockCard[] = [];
  for (const pr of site.pages) {
    if (!KEY.includes(pr.kind)) continue;
    for (const row of pr.rows) {
      if (!SEO_BLOCKS.has(row.key)) continue;
      if (row.state === 'ok') continue;
      const tpl = S_TPL[row.key];
      const base = stateScore[row.state];
      const seoValue = clamp5(tpl.seoStrong ? base : base + 1);
      const content = clamp5(base + 0.5);
      const linking = clamp5(tpl.linkStrong ? base : base + 1);
      const aeo = clamp5(tpl.aeoStrong ? base : base + 1);
      blockCards.push({
        page: KIND_LABEL[pr.kind], pageUrl: shortUrl(pr.url), key: row.key, name: row.name,
        now: row.now, should: tpl.should,
        seoValue, content, linking, aeo,
        score: half((seoValue + content + linking + aeo) / 4),
        priority: priFor(row.state, row.weight),
        recommendation: tpl.recommendation, effect: tpl.effect,
      });
    }
  }
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  blockCards.sort((a, b) => priRank[a.priority] - priRank[b.priority] || a.score - b.score);

  /* ── S7 · SEO Problem Map ── */
  const problems: SeoProblem[] = [];
  if (arch.totals.paramUrls > 40) problems.push({ problem: `Фасети/параметри генерують ${arch.totals.paramUrls}+ індексованих URL-комбінацій без самостійного попиту`, where: 'Фільтри категорій', seoConseq: 'Розмивання crawl budget, дублі, канібалізація категорій', bizConseq: 'Пошук індексує «сміття» замість продажних сторінок → менше органіки', should: 'Список SEO-цінних комбінацій → контрольовані landing; решта — noindex+canonical; перелінковка; контроль crawl budget', priority: 'P0', effort: 4, effect: 'Чистий індекс + керовані фасетні посадкові під атрибутивний попит' });
  if (!cl.sitemapXml) problems.push({ problem: 'Немає XML sitemap', where: 'Корінь сайту', seoConseq: 'Повільніше виявлення й індексація нових/глибоких сторінок', bizConseq: 'Товари довше доходять до видачі → втрата раннього трафіку', should: 'Згенерувати sitemap index (категорії/товари/сторінки) лише з канонічних індексованих URL, lastmod', priority: 'P1', effort: 1, effect: 'Швидша й повніша індексація' });
  if (cl.soft404) problems.push({ problem: 'Soft 404: неіснуючий URL віддає 200', where: 'Обробка помилок', seoConseq: 'Засмічення індексу порожніми сторінками, дублі', bizConseq: 'Пошук витрачає бюджет на порожнечу замість товарів', should: 'Повертати коректний 404/410 для неіснуючих URL', priority: 'P1', effort: 1, effect: 'Чистіший індекс, коректний crawl' });
  if (canonOk < 0.9) problems.push({ problem: `Canonical заданий лише на ${Math.round(canonOk * 100)}% розібраних сторінок`, where: 'Шаблони сторінок', seoConseq: 'Ризик дублів і розпорошення сигналів між URL', bizConseq: 'Продажні сторінки конкурують самі з собою → нижчі позиції', should: 'Self-canonical на всіх індексованих типах; canonical фасетів на базову категорію', priority: 'P1', effort: 2, effect: 'Консолідація сигналів на цільових URL' });
  if (schemaProd < 0.5) problems.push({ problem: `Product/Offer-розмітка лише на ${Math.round(schemaProd * 100)}% карток`, where: 'Картки товару', seoConseq: 'Немає rich-сніпетів (ціна/наявність/рейтинг), слабші сигнали для Shopping', bizConseq: 'Нижчий CTR у видачі → менше кліків при тих самих позиціях', should: 'Впровадити Product+Offer+AggregateRating на всі картки', priority: 'P1', effort: 2, effect: 'Rich-сніпети, вищий CTR, сигнали Shopping' });
  if (!infoNodes.length) problems.push({ problem: 'Немає інформаційного шару (гайди/база знань)', where: 'Архітектура', seoConseq: 'Не покритий верхній воронковий попит, слабкий E-E-A-T і перелінковка', bizConseq: 'Аудиторія на етапі вибору йде до конкурентів', should: 'Контент-хаб «Як обрати/порівняння/догляд» із перелінковкою в каталог', priority: 'P1', effort: 4, effect: 'Новий органічний трафік + вага в комерційні сторінки' });

  /* ── S8 · SEO Opportunity Map ── */
  const opportunities: SeoOpportunity[] = [
    { title: 'Фасетні landing під атрибутивний попит', chain: 'Keyword gap (розмір/матеріал/колір) → нові landing → перелінковка → трафік → продажі', effect: 'Десятки нових посадкових під середньо-/низькочастотку', priority: 'P1' },
    { title: 'Контент-хаб «Як обрати / порівняння»', chain: 'Content gap → гайди → перелінковка в категорії → трафік → конверсія', effect: 'Верхня воронка + вага в комерцію + E-E-A-T', priority: 'P1' },
    { title: 'Rich-сніпети (Product/FAQ/Review schema)', chain: 'Schema → rich-сніпет → вищий CTR → трафік при тих самих позиціях', effect: 'Приріст кліків без зростання позицій', priority: 'P1' },
    { title: 'CTR-оптимізація Title/Description', chain: 'Високі покази + низький CTR → переписати сніпети → більше кліків', effect: 'Quick win на наявному трафіку (уточнюється в Search Console)', priority: 'P2' },
  ];

  /* ── SEO Score — зони /10 (виміряні зовні + н/д) ── */
  const commShare = arch.tree.length ? commercialNodes.length / arch.tree.length : 0;
  const zone = (key: string, label: string, score: number, note: string, measured = true): SeoScoreZone => ({ key, label, score: measured ? clamp10(score) : 0, note, measured });
  const zones: SeoScoreZone[] = [
    zone('strategy', 'SEO Strategy', 5 + commShare * 3, 'Чи є комерційні осі під органіку'),
    zone('structure', 'Структура / дерево', (arch.totals.maxDepth <= 4 ? 7 : 4) + (arch.tree.length >= 6 ? 1.5 : 0), `Глибина ${arch.totals.maxDepth}, типів ${arch.tree.length}`),
    zone('semantics', 'Семантика', 4 + semantic.filter((s) => s.status === 'ok').length * 1.2, 'Покриття кластерів посадковими'),
    zone('intent', 'Intent-відповідність', 6 - semantic.filter((s) => s.status === 'missing').length, 'Тип сторінки під тип запиту'),
    zone('indexation', 'Індексація', (cl.sitemapXml ? 4 : 1) + (cl.robotsTxt ? 3 : 1) + (cl.soft404 ? 0 : 2), 'robots/sitemap/soft404/noindex'),
    zone('technical', 'Технічний SEO', 4 + (canonOk >= 0.9 ? 2 : 0) + (arch.totals.paramUrls <= 40 ? 2 : 0), 'canonical, параметри, редиректи'),
    zone('onpage', 'On-page', titleOk * 3 + h1Ok * 3.5 + descOk * 2 + ogOk * 1.5, `Title ${Math.round(titleOk * 100)}%, H1 ${Math.round(h1Ok * 100)}%`),
    zone('content', 'Контент (SEO)', 4 + (infoNodes.length ? 2 : 0) + schemaProd * 2, 'Семантична повнота, thin/дублі'),
    zone('linking', 'Перелінковка', Math.min(10, arch.totals.links / 25) + (schemaCrumbs >= 0.5 ? 1 : 0), `${arch.totals.links} внутр. посилань, крихти ${Math.round(schemaCrumbs * 100)}%`),
    zone('ecom', 'E-commerce SEO', 4 + (schemaProd >= 0.5 ? 2 : 0) + (arch.totals.paramUrls <= 40 ? 2 : 0), 'Фасети, картки, out-of-stock'),
    zone('mobile', 'Mobile SEO', viewportOk * 8 + 1, `Viewport ${Math.round(viewportOk * 100)}%`),
    zone('schema', 'Schema', schemaProd * 4 + schemaCrumbs * 3 + schemaOrg * 3, 'Product/Breadcrumb/Org покриття'),
    zone('geoaeo', 'GEO/AEO readiness', 2 + (cl.ai?.llmsTxt ? 2 : 0) + (kindsPresent.has('faq') ? 2 : 0) + schemaProd * 2, 'llms.txt, FAQ, факти, розмітка'),
    zone('eeat', 'E-E-A-T', 3 + (infoNodes.length ? 2 : 0) + (schemaOrg >= 0.5 ? 2 : 0), 'Автори, реквізити, довіра'),
    // Зони, які чесно вимірюються лише з доступом:
    zone('international', 'International SEO', 0, anyHreflang ? 'hreflang є — деталі після доступу' : 'н/д (немає мультимовності або даних)', false),
    zone('local', 'Local SEO', 0, 'н/д — потрібні GBP/NAP/локальні дані', false),
    zone('serpctr', 'SERP / CTR', 0, 'н/д — потрібен Search Console', false),
    zone('backlinks', 'Backlinks', 0, 'н/д — потрібен backlink-інструмент', false),
    zone('competitors', 'Competitors', 0, 'н/д — потрібні дані видимості конкурентів', false),
  ];
  const measured = zones.filter((z) => z.measured);
  const overall = measured.length ? clamp10(measured.reduce((s, z) => s + z.score, 0) / measured.length) : 0;

  /* ── S-роадмап (7 етапів) ── */
  const roadmap = [
    { stage: 'Етап 1 · Critical Fixes', items: [
      ...(cl.sitemapXml ? [] : ['Згенерувати XML sitemap лише з канонічних URL']),
      ...(cl.soft404 ? ['Виправити soft 404 → коректний 404/410'] : []),
      ...(arch.totals.paramUrls > 40 ? ['Приборкати фасети: noindex+canonical для безпопитних комбінацій'] : []),
      ...(canonOk < 0.9 ? ['Self-canonical на всіх індексованих типах'] : []),
    ] },
    { stage: 'Етап 2 · Quick Wins', items: [
      `Переписати Title/Description під CTR (зараз Title ${Math.round(titleOk * 100)}%, Desc ${Math.round(descOk * 100)}%)`,
      ...(schemaProd < 0.5 ? ['Впровадити Product/Offer-розмітку на картки (rich-сніпети)'] : []),
      ...(schemaCrumbs < 0.5 ? ['Додати BreadcrumbList-розмітку'] : []),
      'Закрити on-page прогалини з постраничних карток',
    ] },
    { stage: 'Етап 3 · Structural SEO', items: [
      'Фасетні landing під атрибутивний попит (розмір/матеріал/колір)',
      'Категорійні SEO-тексти + перелінковка на дочірні розділи',
      'Впорядкувати URL і вкладеність під інформаційну архітектуру',
    ] },
    { stage: 'Етап 4 · Content', items: [
      'Контент-хаб: гайди «Як обрати», порівняння, догляд',
      'Розширити описи/характеристики сутностями; прибрати thin/дублі',
      'FAQ/Q&A під реальний попит зі schema',
    ] },
    { stage: 'Етап 5 · Authority (E-E-A-T)', items: [
      'Авторство, реквізити, сертифікати, кейси',
      'Backlink-профіль і згадки (після доступу до інструментів)',
    ] },
    { stage: 'Етап 6 · Scale', items: [
      'Нові кластери, категорії, long-tail; нові гео/мови за потреби',
      'Programmatic SEO для атрибутивних посадкових, якщо виправдано',
    ] },
    { stage: 'Етап 7 · GEO / AEO', items: [
      ...(cl.ai?.llmsTxt ? [] : ['Додати llms.txt і відкрити доступ AI-ботам']),
      'Структуровані відповіді, покриття сутностей, унікальні дані — під AI-цитування',
    ] },
  ].map((s) => ({ stage: s.stage, items: s.items.filter(Boolean) })).filter((s) => s.items.length);

  /* ── Спайн ── */
  const spine: SeoLayer[] = [
    { id: 'S1', title: 'S1 · SEO-стратегія', principle: 'Спершу — що бізнесу вигідно просувати. Якщо стратегія крива, виправлення тех-помилок не додасть трафіку.', state: `Комерційних гілок ${commercialNodes.length}, інформаційних ${infoNodes.length}${infoNodes.length ? '' : ' — немає інфо-шару'}.` },
    { id: 'S2', title: 'S2 · Структура / дерево', principle: 'Архітектура під органіку: категорія → підкатегорія → landing → товар, без orphan і crawl-пасток.', state: `Глибина ${arch.totals.maxDepth}, типів сторінок ${arch.tree.length}, параметричних URL ${arch.totals.paramUrls}.` },
    { id: 'S3', title: 'S3 · Семантика / Intent', principle: 'Попит → Intent → кластер → цільова сторінка. Не ранжувати неправильний тип сторінки під запит.', state: `${semantic.filter((s) => s.status !== 'missing').length}/${semantic.length} кластерів мають власника; ${semantic.filter((s) => s.status === 'missing').length} без URL.` },
    { id: 'S4', title: 'S4 · Технічний (crawl/index/schema)', principle: 'В індексі має бути потрібне, а не все підряд: robots, sitemap, canonical, redirects, schema, швидкість.', state: `${technical.filter((t) => t.status === 'gap').length} критичних тех-розривів, ${technical.filter((t) => t.status === 'warn').length} попереджень.` },
    { id: 'S5', title: 'S5 · Постраничний', principle: 'Кожна ключова сторінка — власна SEO-картка: intent, індексація, on-page, schema, gap.', state: `${pageCards.length} ключових сторінок розібрано; ${pageCards.filter((c) => c.priority === 'P0').length} × P0.` },
    { id: 'S6', title: 'S6 · Поблоковий', principle: 'Кожен SEO-значущий блок окремо: Зараз → Як має бути → оцінка → рекомендація → ефект.', state: `${blockCards.length} блоків потребують SEO-правок; ${blockCards.filter((c) => c.priority === 'P0').length} × P0.` },
    { id: 'S7', title: 'S7 · Проблеми і можливості', principle: 'Не список помилок, а карта: проблема + SEO-/бізнес-наслідок, і карта можливостей росту.', state: `${problems.length} проблем (${problems.filter((p) => p.priority === 'P0').length} × P0), ${opportunities.length} можливостей.` },
    { id: 'S8', title: 'S8 · Growth Roadmap', principle: 'Фінал — план росту органіки за 7 етапів: Critical → Quick Wins → Structural → Content → Authority → Scale → GEO/AEO.', state: `${roadmap.length} етапів, впорядкованих за Impact×Effort×Traffic×Value.` },
  ];

  return { client, takenAt: ds.takenAt, spine, score: { zones, overall }, strategy, semantic, technical, pageCards, blockCards, problems, opportunities, roadmap };
}
