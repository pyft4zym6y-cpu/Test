/**
 * Генератор заполненных прототипов всех PDF-отчётов сюиты на синтетических
 * данных (демо-магазин «lavanda-home.example», D2C-производитель домашнего
 * текстиля + 2 конкурента). Показывает, как выглядит каждый документ в боевом
 * прогоне: обложка → методология → анализ → сильные/слабые → рекомендации →
 * итоговый вывод. Запуск: npx tsx scripts/proto.ts [outDir]
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import type { SiteCrawl, PageAudit, PageKind, L0Check, UxProbe, PageTypeCoverage } from '../src/crawl.js';
import type { AuditDataset } from '../src/report.js';
import type { Analysis } from '../src/analyze.js';
import type { Synthesis } from '../src/synthesis.js';
import { buildSiteAudit } from '../src/pagereport.js';
import { renderAuditHtml } from '../src/export/htmlReport.js';
import { buildSeoArch } from '../src/seoarch.js';
import { renderSeoArchHtml } from '../src/export/seoArchHtml.js';
import { buildTechAudit } from '../src/techaudit.js';
import { renderTechAuditHtml } from '../src/export/techAuditHtml.js';
import { buildContentAudit } from '../src/contentaudit.js';
import { renderContentAuditHtml } from '../src/export/contentAuditHtml.js';
import { buildIntelligence } from '../src/intelligence.js';
import { renderIntelligenceHtml } from '../src/export/intelligenceHtml.js';
import { buildChannels } from '../src/channels.js';
import { renderChannelsHtml } from '../src/export/channelsHtml.js';
import { buildBenchmark } from '../src/competitor.js';
import { renderCompetitorHtml } from '../src/export/competitorHtml.js';
import { renderExecDiagnostic } from '../src/export/execDiagHtml.js';
import { buildHypotheses } from '../src/hypotheses.js';
import { buildMaturity } from '../src/maturity.js';
import { buildScope } from '../src/routing.js';
import { buildPriceChannel } from '../src/pricechannel.js';
import { buildCausal } from '../src/causal.js';
import { buildCoverage } from '../src/coverage.js';
import { renderMaturityPdf, renderCoveragePdf, renderHypothesesPdf, renderScopePdf, renderPriceChannelPdf, renderSynthesisPdf, renderCausalPdf } from '../src/export/methodPdf.js';
import { buildMechanics } from '../src/mechanics.js';
import { renderMechanicsHtml } from '../src/export/mechanicsHtml.js';
import { buildJourneyReport, type JourneyStep } from '../src/journey.js';
import { renderJourneyHtml } from '../src/export/journeyHtml.js';
import { renderPdf, closePdfBrowser } from '../src/pdf.js';
import { buildBacklog, renderBacklogHtml, type RawRec } from '../src/backlog.js';
import { buildQa, renderQaHtml } from '../src/qa.js';
import { buildSocialAudit, buildMentionsAudit, buildReviewsAudit } from '../src/externalAudits.js';
import { renderSocialHtml, renderMentionsHtml, renderReviewsHtml } from '../src/export/externalHtml.js';

const ORIGIN = 'https://lavanda-home.example';
const OUT = process.argv[2] || 'proto-out';

/* ── Чеки страницы: базовый набор «всё ок», через over выключаем нужные ── */
const CHECK_DEFS: [string, string, string][] = [
  ['title', 'SEO', 'Title 15–70 символов'], ['desc', 'SEO', 'Meta description 50–170'], ['canonical', 'SEO', 'Canonical задан'],
  ['h1', 'SEO', 'Ровно один H1'], ['noindex', 'SEO', 'Нет случайного noindex'], ['og', 'SEO', 'Open Graph (og:title + og:image)'],
  ['schema-org', 'SEO', 'Schema.org Organization/WebSite'], ['schema-product', 'SEO', 'Schema.org Product/Offer'],
  ['schema-crumbs', 'SEO', 'Schema.org BreadcrumbList'], ['hreflang', 'SEO', 'hreflang (мультиязычность)'],
  ['viewport', 'UX', 'Viewport (мобильная версия)'], ['favicon', 'UX', 'Favicon'], ['search', 'UX', 'Поиск по сайту'],
  ['phone', 'UX', 'Телефон кликабелен (tel:)'], ['cart', 'UX', 'Корзина обнаружима'], ['price', 'UX', 'Цены на странице'],
  ['reviews', 'UX', 'Отзывы/рейтинг обнаружимы'], ['delivery', 'UX', 'Доставка/оплата в контенте'], ['contacts', 'UX', 'Контакты/адрес'],
  ['social', 'UX', 'Соцсети привязаны'],
  ['https', 'Техника', 'HTTPS'], ['charset', 'Техника', 'Charset задан'], ['alt', 'Техника', 'ALT у ≥70% изображений'],
  ['lazy', 'Техника', 'Lazy-load изображений'], ['lang', 'Техника', 'Атрибут lang у html'],
  ['analytics', 'Техника', 'Аналитика установлена (GA4/GTM/Pixel)'], ['preconnect', 'Техника', 'Preconnect/preload ресурсов'],
  ['cookies', 'Техника', 'Cookie/consent-механика (для ЕС)'], ['errors-soft', 'Техника', 'Нет текста ошибок в вёрстке'],
];
function mkChecks(fails: string[]): L0Check[] {
  return CHECK_DEFS.map(([id, group, label]) => ({ id, group, label, pass: !fails.includes(id) }));
}

function mkUx(blocks: Record<string, boolean>, over: Partial<UxProbe> = {}): UxProbe {
  return {
    foldButtons: 11, primaryCtaAboveFold: true, navItems: 9, breadcrumbs: Boolean(blocks.breadcrumbs),
    stickyHeader: true, headingLevels: 3, distinctButtonColors: 3, productCards: 0, filters: Boolean(blocks.filters),
    sortControl: Boolean(blocks.sort), galleryImages: 0, addToCartProminent: Boolean(blocks.add_to_cart),
    variantSelector: Boolean(blocks.variants), priceVisible: Boolean(blocks.price), trustBadges: Boolean(blocks.trust),
    paymentIcons: Boolean(blocks.payment), reviews: Boolean(blocks.reviews), formFields: 0, guestCheckoutHint: Boolean(blocks.guest_checkout),
    smallTapTargets: 2, baseFontPx: 15, bodyWords: 420, socialLinks: [], blocks, annotations: [], ...over,
  };
}

function mkPage(kind: PageKind, path: string, title: string, fails: string[], blocks: Record<string, boolean>, uxOver: Partial<UxProbe> = {}): PageAudit {
  const checks = mkChecks(fails);
  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  return { url: ORIGIN + path, finalUrl: ORIGIN + path, kind, status: 200, title, checks, score, ux: mkUx(blocks, uxOver) };
}

/* ── Мок-скриншот первого экрана (вайрфрейм, помечен как демо) ── */
async function mockShot(browser: Browser, kind: PageKind): Promise<string> {
  const blocksFor: Record<string, string> = {
    home: `<div class="hero">Hero-баннер · новая коллекция<span class="cta">Смотреть коллекцию</span></div><div class="row"><i></i><i></i><i></i><i></i></div><div class="cap">Хиты продаж</div><div class="grid">${'<b></b>'.repeat(8)}</div>`,
    plp: `<div class="crumbs">Главная / Каталог / Постельное бельё</div><div class="cols"><div class="side">Фильтры<u></u><u></u><u></u><u></u></div><div class="main"><div class="cap">Постельное бельё · 124 товара · сортировка</div><div class="grid">${'<b></b>'.repeat(9)}</div></div></div>`,
    pdp: `<div class="crumbs">Главная / Каталог / Комплект сатин</div><div class="cols"><div class="gal"><s></s><div class="th"><i></i><i></i><i></i><i></i></div></div><div class="buy"><h3>Комплект постельного белья, сатин</h3><div class="price">2 590 ₴</div><div class="var">Размер: <i>1.5</i><i>2.0</i><i>евро</i></div><span class="cta">В корзину</span><div class="tr">✓ Гарантия · ✓ Возврат 14 дней · Visa/MC</div></div></div>`,
    cart: `<div class="cap">Корзина · 2 товара</div><div class="cols"><div class="main"><u></u><u></u></div><div class="side">Итого: 4 180 ₴<span class="cta">Оформить заказ</span><div class="tr">Промокод · Доставка от 2 дней</div></div></div>`,
    checkout: `<div class="cap">Оформление заказа · шаг 1 из 2</div><div class="cols"><div class="main"><u></u><u></u><u></u><u></u><div class="cap">Доставка ◉ Нова Пошта ○ Курьер</div><div class="cap">Оплата ◉ Карта ○ Наложенный платёж</div></div><div class="side">Ваш заказ: 4 180 ₴<span class="cta">Подтвердить</span></div></div>`,
    faq: `<div class="cap">Частые вопросы</div><div class="main"><u></u><u></u><u></u><u></u><u></u></div>`,
    content: `<div class="cap">Блог · Как выбрать сатин</div><div class="main"><u></u><u></u><u></u></div>`,
    other: `<div class="cap">О бренде Lavanda Home</div><div class="main"><u></u><u></u></div>`,
  };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;font-family:Arial;background:#fff;color:#1d2430;}
    .top{height:56px;background:#12161C;color:#fff;display:flex;align-items:center;gap:24px;padding:0 32px;font-weight:700;}
    .top .srch{margin-left:auto;background:#fff;border-radius:6px;width:300px;height:34px;opacity:.9;}
    .badge{position:fixed;right:14px;bottom:12px;background:#65A30D;color:#fff;font-size:12px;padding:4px 10px;border-radius:14px;}
    .wrap{padding:24px 32px;}
    .hero{height:300px;background:linear-gradient(120deg,#eef1e6,#dfe7d0);border-radius:10px;display:flex;flex-direction:column;justify-content:center;padding:0 40px;font-size:28px;font-weight:800;}
    .cta{display:inline-block;background:#65A30D;color:#fff;padding:12px 26px;border-radius:8px;font-size:15px;margin-top:16px;width:max-content;font-weight:700;}
    .row{display:flex;gap:14px;margin:18px 0;} .row i{flex:1;height:64px;background:#F0F2F5;border-radius:8px;}
    .cap{font-weight:800;margin:16px 0 10px;font-size:16px;color:#333;}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;} .grid b{height:150px;background:#F0F2F5;border-radius:8px;}
    .cols{display:flex;gap:20px;margin-top:12px;} .side{width:230px;background:#F7F8FA;border:1px solid #E4E7EC;border-radius:8px;padding:14px;font-weight:700;}
    .side u,.main u{display:block;height:44px;background:#EDF0F3;border-radius:6px;margin:10px 0;text-decoration:none;}
    .main{flex:1;} .crumbs{color:#5A6472;font-size:13px;}
    .gal{width:420px;} .gal s{display:block;height:340px;background:#F0F2F5;border-radius:10px;} .th{display:flex;gap:8px;margin-top:8px;} .th i{width:72px;height:72px;background:#E7EAEE;border-radius:6px;}
    .buy{flex:1;} .price{font-size:30px;font-weight:800;margin:8px 0;} .var i{display:inline-block;border:1px solid #cdd3da;border-radius:6px;padding:6px 12px;margin:4px 6px 4px 0;font-style:normal;}
    .tr{color:#5A6472;font-size:13px;margin-top:12px;}
  </style></head><body>
    <div class="top">LAVANDA HOME <span>Каталог</span><span>Доставка</span><span>О нас</span><div class="srch"></div></div>
    <div class="wrap">${blocksFor[kind] ?? blocksFor.other}</div>
    <div class="badge">ПРОТОТИП · демонстрационные данные</div>
  </body></html>`;
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.setContent(html);
  const buf = await page.screenshot({ type: 'jpeg', quality: 70 });
  await page.close();
  return buf.toString('base64');
}

/* ── Синтетическое дерево ссылок ── */
function mkLinks(): string[] {
  const cats = ['postelnoe-bele', 'pledy', 'polotenca', 'shtory', 'podushki', 'odeyala', 'skaterti', 'khalaty'];
  const adj = ['satin', 'stripe', 'grey', 'olive', 'cotton', 'premium', 'family', 'kids', 'summer', 'winter'];
  const links: string[] = [`${ORIGIN}/`];
  for (const c of cats) {
    links.push(`${ORIGIN}/katalog/${c}/`);
    links.push(`${ORIGIN}/katalog/${c}/?sort=price`);
    for (let i = 0; i < 26; i++) links.push(`${ORIGIN}/komplekt-${c}-${adj[i % adj.length]}-${100 + i}/`);
  }
  for (let i = 1; i <= 6; i++) links.push(`${ORIGIN}/blog/kak-vybrat-${i}/`);
  links.push(`${ORIGIN}/b2b/`, `${ORIGIN}/opt/`, `${ORIGIN}/about/`, `${ORIGIN}/dostavka-i-oplata/`, `${ORIGIN}/contacts/`, `${ORIGIN}/faq/`, `${ORIGIN}/sale/`, `${ORIGIN}/en/`, `${ORIGIN}/cart/`, `${ORIGIN}/checkout/`, `${ORIGIN}/account/`, `${ORIGIN}/privacy-policy/`, `${ORIGIN}/terms/`);
  return links;
}

const PT = (id: string, label: string, mandatory: boolean, status: PageTypeCoverage['status'], url?: string): PageTypeCoverage => ({ id, label, mandatory, status, ...(url ? { url } : {}) });

function mkClient(): SiteCrawl {
  const common = ['hreflang', 'schema-crumbs', 'cookies', 'preconnect'];
  const pages: PageAudit[] = [
    mkPage('home', '/', 'Lavanda Home — домашний текстиль от производителя', [...common, 'reviews'],
      { hero: true, usp_bar: true, search: true, nav: true, product_grid: true, trust: true, footer_contacts: true, newsletter: false, reviews: false, breadcrumbs: false },
      { productCards: 12, navItems: 9 }),
    mkPage('plp', '/katalog/postelnoe-bele/', 'Постельное бельё — купить от производителя', [...common, 'desc', 'og'],
      { category_title: true, product_count: true, filters: true, sort: true, pagination: true, breadcrumbs: true, product_grid: true, category_description: false, view_toggle: false, search: true, nav: true, footer_contacts: true },
      { productCards: 24 }),
    mkPage('pdp', '/komplekt-postelnoe-bele-satin-101/', 'Комплект постельного белья сатин', [...common, 'schema-product', 'reviews', 'og'],
      { product_header: true, gallery: true, price: true, add_to_cart: true, variants: true, delivery: true, payment: true, description: true, specifications: true, trust: true, breadcrumbs: true, reviews: false, qa: false, video: false, related: false, recently_viewed: false, search: true, nav: true, footer_contacts: true, installment: true, messenger: true },
      { galleryImages: 4 }),
    mkPage('pdp', '/komplekt-pledy-cotton-104/', 'Плед хлопковый Cotton', [...common, 'schema-product', 'reviews', 'desc'],
      { product_header: true, gallery: true, price: true, add_to_cart: true, variants: false, delivery: true, payment: true, description: true, specifications: false, trust: true, breadcrumbs: true, reviews: false, qa: false, related: false, search: true, nav: true, footer_contacts: true },
      { galleryImages: 2 }),
    mkPage('cart', '/cart/', 'Корзина', [...common, 'reviews'],
      { order_summary: true, qty_control: true, continue_shopping: true, promo_code: true, trust: true, payment: true, delivery_calc: false, wishlist: false, search: true, nav: true, footer_contacts: true }),
    mkPage('checkout', '/checkout/', 'Оформление заказа', [...common, 'reviews', 'og'],
      { contact_form: true, delivery_selection: true, payment_selection: true, order_summary: true, trust: true, payment: true, guest_checkout: false, search: false, nav: true, footer_contacts: true },
      { formFields: 9 }),
    mkPage('faq', '/faq/', 'Частые вопросы', [...common],
      { faq: true, search: true, contact_form: true, related: false, nav: true, footer_contacts: true }),
    mkPage('content', '/blog/kak-vybrat-1/', 'Как выбрать сатин: гайд', [...common, 'og'],
      { product_header: true, related: true, share: true, toc: false, author: false, nav: true, footer_contacts: true }),
    mkPage('other', '/about/', 'О бренде Lavanda Home', [...common],
      { product_header: true, trust: true, nav: true, footer_contacts: true }),
    mkPage('other', '/dostavka-i-oplata/', 'Доставка и оплата', [...common],
      { product_header: true, delivery: true, payment: true, nav: true, footer_contacts: true }),
  ];
  const pageTypes: PageTypeCoverage[] = [
    PT('home', 'Главная', true, 'разобрана', `${ORIGIN}/`),
    PT('plp', 'Каталог / категория (PLP)', true, 'разобрана', `${ORIGIN}/katalog/postelnoe-bele/`),
    PT('pdp', 'Карточка товара (PDP)', true, 'разобрана', `${ORIGIN}/komplekt-postelnoe-bele-satin-101/`),
    PT('cart', 'Корзина', true, 'разобрана', `${ORIGIN}/cart/`),
    PT('checkout', 'Чекаут', true, 'разобрана', `${ORIGIN}/checkout/`),
    PT('search', 'Результаты поиска', true, 'найдена', `${ORIGIN}/search/`),
    PT('contacts', 'Контакты', true, 'найдена', `${ORIGIN}/contacts/`),
    PT('delivery-payment', 'Доставка и оплата', true, 'разобрана', `${ORIGIN}/dostavka-i-oplata/`),
    PT('about', 'О компании', true, 'разобрана', `${ORIGIN}/about/`),
    PT('legal-terms', 'Оферта / условия', true, 'найдена', `${ORIGIN}/terms/`),
    PT('legal-privacy', 'Политика конфиденциальности', true, 'найдена', `${ORIGIN}/privacy-policy/`),
    PT('legal-return', 'Возврат и обмен', true, 'не найдена'),
    PT('faq', 'FAQ', false, 'разобрана', `${ORIGIN}/faq/`),
    PT('blog', 'Блог / статьи', false, 'разобрана', `${ORIGIN}/blog/kak-vybrat-1/`),
    PT('sale', 'Акции / распродажа', false, 'найдена', `${ORIGIN}/sale/`),
    PT('new', 'Новинки', false, 'не найдена'),
    PT('reviews-page', 'Отзывы о магазине', false, 'не найдена'),
    PT('b2b', 'B2B / опт', false, 'найдена', `${ORIGIN}/b2b/`),
    PT('account', 'Личный кабинет', false, 'найдена', `${ORIGIN}/account/`),
    PT('wishlist', 'Избранное (wishlist)', false, 'не найдена'),
    PT('compare', 'Сравнение товаров', false, 'не найдена'),
    PT('brands', 'Бренды / коллекции', false, 'не найдена'),
    PT('gift-cert', 'Подарочные сертификаты', false, 'не найдена'),
    PT('stores', 'Магазины / точки продаж', false, 'не найдена'),
    PT('guides', 'Гайды / подборки', false, 'найдена', `${ORIGIN}/blog/`),
    PT('lang', 'Языковые версии', false, 'найдена', `${ORIGIN}/en/`),
    PT('thankyou', 'Спасибо за заказ', false, 'вне обхода (A1)'),
  ];
  return {
    rootUrl: ORIGIN, finalUrl: `${ORIGIN}/`, kind: 'client', reachable: true, robotsTxt: true, sitemapXml: true,
    tech: { platform: 'OpenCart', analytics: ['GA4/GTM'], signals: ['GA4/GTM', 'Meta Pixel', 'MS Clarity'] },
    pages, discoveredLinks: 260, links: mkLinks(), pageTypes, soft404: false,
  };
}

function mkCompetitor(host: string, strong: boolean): SiteCrawl {
  const fails = strong ? ['hreflang', 'cookies'] : ['hreflang', 'cookies', 'schema-product', 'schema-crumbs', 'desc', 'og', 'reviews', 'preconnect', 'lazy'];
  const blocks = strong
    ? { hero: true, search: true, nav: true, product_grid: true, trust: true, reviews: true, newsletter: true, filters: true, sort: true, breadcrumbs: true, related: true, gallery: true, price: true, add_to_cart: true, description: true, specifications: true, payment: true, footer_contacts: true }
    : { hero: true, search: true, nav: true, product_grid: true, trust: false, reviews: false, newsletter: false, filters: true, sort: false, breadcrumbs: false, gallery: true, price: true, add_to_cart: true, description: true, footer_contacts: true };
  const pages: PageAudit[] = [
    mkPage('home', '/', host, fails, blocks, { productCards: 10 }),
    mkPage('plp', '/catalog/bed/', 'Каталог', fails, blocks, { productCards: 20 }),
    mkPage('pdp', '/catalog/bed/item-1/', 'Товар', fails, { ...blocks, product_header: true }, { galleryImages: strong ? 6 : 2 }),
  ];
  return {
    rootUrl: `https://${host}`, finalUrl: `https://${host}/`, kind: 'competitor', reachable: true, robotsTxt: true, sitemapXml: strong,
    tech: { platform: strong ? 'Shopify' : 'WordPress', analytics: strong ? ['GA4/GTM'] : [], signals: strong ? ['GA4/GTM', 'Meta Pixel'] : [] },
    pages, discoveredLinks: 120, links: [`https://${host}/`, `https://${host}/catalog/bed/`],
  };
}

/* ── Синтетический аналитический слой (как его в бою собирает Claude) ── */
const ANALYSIS: Analysis = {
  summary: 'Lavanda Home — производитель с D2C-витриной и оптовым каналом: механика первой покупки собрана, но точка решения (карточка) не подкреплена доверием, retention-контур не построен, а машинный слой SEO не размечен — рост идёт на закупаемом трафике без накопления.',
  healthNote: 'Health Score не считался: опросник не заполнен (слой A0).',
  findings: [
    { area: 'UX/CRO', status: 'разрыв', fact: 'На карточках нет отзывов и блока «с этим покупают»', why: 'Точка решения без социального доказательства; заказ остаётся из одной позиции — ниже конверсия и средний чек', confidence: 0.55 },
    { area: 'SEO', status: 'разрыв', fact: 'Карточки без Schema Product/Offer, крошки без разметки', why: 'Выдача без цены и наличия — ниже CTR; машинный слой не собран', confidence: 0.7 },
    { area: 'Retention', status: 'разрыв', fact: 'Нет захвата контакта (подписка/триггеры не обнаружены)', why: 'Используется только первая покупка; повторные — самый дешёвый оборот', confidence: 0.5 },
    { area: 'Контент', status: 'наблюдение', fact: 'Категории без описаний, блог не связан с каталогом', why: 'Средне- и низкочастотный спрос не собирается', confidence: 0.45 },
    { area: 'Аналитика', status: 'гипотеза', fact: 'GA4 установлена, качество событий e-commerce не проверено', why: 'Возможна слепота воронки при формально стоящем счётчике', confidence: 0.35 },
    { area: 'Цена в канале', status: 'гипотеза', fact: 'Товары бренда могут продаваться третьими лицами на маркетплейсах', why: 'Риск ценовой эрозии и перехвата спроса в канале', confidence: 0.3 },
  ],
  pains: [
    { cause: 'Витрина построена как каталог, а не как продавец', symptoms: ['карточка без отзывов и cross-sell', 'чекаут без гостевого входа', 'категории без описаний'], evidence: ['обход 10 страниц: reviews=нет на 6/6 коммерческих', 'формы чекаута: 9 полей'] },
    { cause: 'Retention-контур не построен', symptoms: ['нет подписки', 'нет триггеров брошенной корзины', 'ЛК без программы лояльности'], evidence: ['newsletter-блок не обнаружен на 10/10 страниц'] },
    { cause: 'Машинный слой SEO не размечен', symptoms: ['нет Schema Product', 'нет BreadcrumbList', 'нет hreflang при /en/'], evidence: ['schema-product: 0/2 карточек; hreflang: 0/10'] },
  ],
  competitors: 'textile-market.example сильнее по доверию (отзывы, разметка); home-cotton.example слабее по всем осям — рынок неоднороден, лидер задаёт стандарт доверия.',
  missingFacts: ['Выгрузка заказов за 12 мес (AOV, повторные)', 'Доступ к GA4 (воронка, источники)', 'Прайс и условия опта (роль в цепочке)', 'Цены бренда на маркетплейсах'],
  scope: [
    { playbook: 'PB-15', reason: 'карточка без доверия и cross-sell', wave: 1 },
    { playbook: 'PB-04', reason: 'машинный слой SEO не размечен', wave: 1 },
    { playbook: 'PB-08', reason: 'retention-контур отсутствует', wave: 2 },
    { playbook: 'PB-07', reason: 'категорийный и товарный контент тонкий', wave: 2 },
  ],
  openQuestions: ['Какая доля выручки приходит из опта (B2B)?', 'Продаёт ли бренд на Rozetka/Prom сам или через посредников?', 'Есть ли MAP-политика для оптовых партнёров?', 'Какая доля повторных покупок за 12 мес?', 'Настроены ли e-commerce события в GA4?'],
};

const SYNTHESIS: Synthesis = {
  headline: 'Магазин продаёт как каталог: трафик закупается, но точка решения не подкреплена доверием, а купленный клиент не возвращается — две утечки перемножаются.',
  crossLinks: [
    { a: 'UX: карточка без отзывов/cross-sell', b: 'Каналы: платный трафик с Pixel', effect: 'Дорогой клик приземляется на страницу, которая не дожимает решение — CAC растёт при том же бюджете' },
    { a: 'SEO: нет Schema Product', b: 'Контент: категории без описаний', effect: 'Органика не растёт ни по машинному, ни по контентному слою — весь рост остаётся платным' },
    { a: 'Retention: нет захвата контакта', b: 'B2B/опт на витрине', effect: 'Розничный клиент уходит навсегда, хотя производитель мог бы строить LTV дешевле любого канала' },
  ],
  rootCauses: [
    { cause: 'Витрина спроектирована от ассортимента, а не от решения покупателя', from: ['UX/UI', 'Контент', 'Прототип'], impact: 'Конверсия ниже достижимой на каждом шаге воронки' },
    { cause: 'Работает только механика первой покупки', from: ['Каналы', 'CI: retention'], impact: 'LTV не накапливается — рост линейно зависит от рекламного бюджета' },
    { cause: 'Машинный слой (разметка, события) не собран', from: ['SEO', 'Аналитика'], impact: 'Ни поисковые системы, ни собственная аналитика не видят магазин полностью' },
  ],
  priorities: [
    { title: 'Достроить точку решения (карточка): доверие + cross-sell', why: 'Усиливает сразу платный и органический трафик — компаундная точка' },
    { title: 'Разметить машинный слой (Schema, события GA4)', why: 'Дешёвая работа, открывающая и CTR выдачи, и измеримость воронки' },
    { title: 'Запустить retention-контур (захват контакта, welcome, брошенная корзина)', why: 'Самый дешёвый оборот; сейчас контур отсутствует полностью' },
  ],
  oneLine: 'Сначала дожать точку решения и разметку, затем строить возврат клиента — в этой последовательности каждая волна окупает следующую.',
};

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  const ds: AuditDataset = {
    tier: 2, request: 'Комплексный аудит витрины и точек роста (демо-прогон)',
    client: mkClient(),
    competitors: [mkCompetitor('textile-market.example', true), mkCompetitor('home-cotton.example', false)],
    takenAt: new Date().toISOString(),
  };

  // Мок-скриншоты для UX/UI-прототипа
  const shotBrowser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    for (const p of ds.client.pages) {
      p.screenshot = await mockShot(shotBrowser, p.kind);
      if (p.kind === 'home') p.ux!.annotations = [{ label: 'Главный CTA', x: 72, y: 400, w: 220, h: 46, tone: 'good' }, { label: 'Поиск', x: 1010, y: 12, w: 300, h: 34, tone: 'good' }];
      if (p.kind === 'pdp') p.ux!.annotations = [{ label: 'В корзину', x: 520, y: 420, w: 180, h: 46, tone: 'good' }, { label: 'Нет отзывов у цены', x: 500, y: 300, w: 320, h: 60, tone: 'warn' }];
    }
  } finally { await shotBrowser.close().catch(() => {}); }

  const D = new Date(ds.takenAt).toLocaleDateString('ru-RU');
  const cn = 'lavanda-home.example';
  const out = (n: string) => join(OUT, n);
  const done: string[] = [];
  const pdf = async (html: string, name: string) => { await renderPdf(html, out(name)); done.push(name); console.log('✓', name); };

  // Journey — синтетический протокол прохождения (в бою шаги выполняет реальный браузер)
  const JS = (n: number, stage: string, action: string, expected: string, result: string, status: JourneyStep['status'], dims: JourneyStep['dims']): JourneyStep => ({ n, stage, action, expected, result, status, dims });
  const journeySteps: JourneyStep[] = [
    JS(1, 'Вход', 'Открываю главную страницу', 'Страница отвечает и рендерится', 'открылась (HTTP 200)', 'пройден', ['UX', 'TECH']),
    JS(2, 'Поиск', 'Ввожу запрос «подарунок» и жму Enter', 'Выдача с товарами или внятное «не найдено» с альтернативами', 'выдача с товарами', 'пройден', ['UX', 'CRO']),
    JS(3, 'Каталог', 'Перехожу из меню в каталог', 'Листинг с товарами открывается за один клик', 'листинг открылся: /katalog/postelnoe-bele/', 'пройден', ['UX', 'SEO']),
    JS(4, 'Карточка', 'Открываю первый товар из листинга', 'Карточка с ценой и кнопкой «в корзину»', 'карточка открылась, кнопка покупки на месте', 'пройден', ['UX', 'CRO']),
    JS(5, 'Добавление в корзину', 'Нажимаю «в корзину» на карточке', 'Явное подтверждение: счётчик корзины растёт или всплывает окно', 'нажатие без видимой реакции — покупатель не понимает, добавилось ли', 'спотыкание', ['CRO', 'UX']),
    JS(6, 'Избранное', 'Нажимаю «в избранное» на карточке', 'Товар сохраняется без принудительной регистрации', 'кнопка избранного не найдена на карточке', 'не найден', ['UX', 'MKT']),
    JS(7, 'Корзина', 'Открываю корзину', 'Добавленный товар в корзине: количество, сумма, следующий шаг', 'корзина открылась, состав и сумма читаются', 'пройден', ['CRO', 'UX']),
    JS(8, 'Чекаут', 'Перехожу к оформлению (не оформляю заказ)', 'Форма ≤8–10 полей, гостевой заказ возможен', 'форма из 9 видимых полей, похоже на принудительную регистрацию', 'спотыкание', ['CRO', 'UX']),
    JS(9, 'Тупик: страница 404', 'Открываю несуществующий адрес', 'Честная 404 с навигацией и поиском — мягкая посадка', '404 с навигацией — покупатель не теряется', 'пройден', ['SEO', 'UX']),
    JS(10, 'Мобильный: вход', 'Открываю главную на смартфоне (390px)', 'Страница адаптивна, без горизонтального скролла', 'адаптив в порядке', 'пройден', ['MOB', 'UX']),
    JS(11, 'Мобильный: покупка', 'Открываю карточку и проверяю кнопку «в корзину» под палец', 'Кнопка достижима и ≥40px (thumb zone)', 'кнопка покупки удобна для тапа', 'пройден', ['MOB', 'CRO']),
  ];
  const journeyReport = buildJourneyReport(journeySteps, ds.client.finalUrl, ds.takenAt);
  await pdf(renderJourneyHtml(journeyReport), 'Карта-пути-клиента-A0.pdf');

  const siteAudit = buildSiteAudit(ds, { journey: journeySteps });
  await pdf(renderAuditHtml(siteAudit), 'UX-UI-аудит-A0.pdf');
  await pdf(renderSeoArchHtml(buildSeoArch(ds)), 'SEO-Architecture-A0.pdf');
  await pdf(renderTechAuditHtml(buildTechAudit(ds)), 'Технический-аудит-A0.pdf');
  await pdf(renderContentAuditHtml(buildContentAudit(ds)), 'Content-Audit-A0.pdf');
  await pdf(renderIntelligenceHtml(buildIntelligence(ds)), 'Commerce-Intelligence-Audit-A0.pdf');
  await pdf(renderChannelsHtml(buildChannels(ds)), 'Аудит-каналов-A0.pdf');
  const bench = buildBenchmark(ds);
  if (bench) await pdf(renderCompetitorHtml(bench, cn, ds.takenAt), 'Конкурентный-анализ-A0.pdf');
  await pdf(renderHypothesesPdf(buildHypotheses(ANALYSIS), cn, D), 'Реестр-гипотез-A0.pdf');
  await pdf(renderMaturityPdf(buildMaturity(ds), cn, D), 'Матрица-зрелости-A0.pdf');
  await pdf(renderScopePdf(buildScope(ds, { analysis: ANALYSIS }), cn, D), 'Scope-по-волнам-A0.pdf');
  await pdf(renderPriceChannelPdf(buildPriceChannel(ds), cn, D), 'Цена-в-канале-A0.pdf');
  const mech = buildMechanics(ds);
  await pdf(renderMechanicsHtml(mech), 'Маркетинговые-механики-A0.pdf');

  // Внешний контур (синтетические результаты web-поиска — в бою собирает Claude)
  ds.client.pages[0].ux!.socialLinks = ['https://instagram.com/lavanda.home', 'https://facebook.com/lavandahome'];
  const social = await buildSocialAudit(ds, undefined, [
    { platform: 'Instagram', url: 'https://instagram.com/lavanda.home', found: 'на сайте', activity: '~12 тыс. подписчиков, посты 2–3 р/нед', note: 'живой профиль, ведёт на сайт' },
    { platform: 'Facebook', url: 'https://facebook.com/lavandahome', found: 'на сайте', activity: '~4 тыс., дубли Instagram', note: 'ведётся по остаточному принципу' },
    { platform: 'TikTok', url: 'https://tiktok.com/@lavanda.home', found: 'поиском', activity: '~3 тыс., 2 видео за 90 дней', note: 'профиль существует, но НЕ привязан к сайту' },
  ]);
  await pdf(renderSocialHtml(social), 'Аудит-соцсетей-A0.pdf');
  const mentions = await buildMentionsAudit(ds, undefined, [
    { source: 'Hotline.ua', kind: 'каталог', tone: 'нейтрально', what: 'Карточка магазина с ценами, 4 отзыва, профиль не заполнен брендом' },
    { source: 'Форум родителей (обсуждение текстиля)', kind: 'форум', tone: 'позитив', what: 'Рекомендуют качество сатина, спрашивают о размерах — бренд в диалоге не участвует' },
    { source: 'Rozetka (продавец-посредник)', kind: 'маркетплейс', tone: 'нейтрально', what: 'Товары бренда продаёт третье лицо на 8–12% дороже; карточки без фирменных фото' },
    { source: 'Instagram-обзорщик домашнего декора', kind: 'соцсети', tone: 'позитив', what: 'Обзор комплекта с отметкой бренда, ~15 тыс. просмотров' },
    { source: 'Отзовик otzyvua', kind: 'отзовик', tone: 'негатив', what: 'Две жалобы на сроки доставки в декабре — без ответа магазина' },
  ]);
  await pdf(renderMentionsHtml(mentions), 'Внешний-инфофон-A0.pdf');
  const reviews = await buildReviewsAudit(ds, undefined, [
    { place: 'Google Maps', kind: 'внешний', status: 'найдено', rating: '4.6/5', count: '~38', note: 'хвалят качество, две жалобы на упаковку' },
    { place: 'Rozetka (карточки посредника)', kind: 'внешний', status: 'найдено', rating: '4.4/5', count: '~57', note: 'отзывы копятся у посредника, не у бренда' },
    { place: 'Trustpilot', kind: 'внешний', status: 'не найдено', rating: '—', count: '—', note: 'профиль не создан' },
  ]);
  await pdf(renderReviewsHtml(reviews), 'Аудит-отзывов-A0.pdf');

  const cov = buildCoverage(ds, {});
  await pdf(renderCoveragePdf(cov, cn, D), 'Охват-и-уверенность-A0.pdf');
  await pdf(renderCausalPdf(buildCausal(ANALYSIS, null), cn, D), 'Причинно-следственная-карта-A0.pdf');
  await pdf(renderSynthesisPdf(SYNTHESIS, cn, D), 'Синтез-аудита-A0.pdf');
  await pdf(renderExecDiagnostic(ds, { siteAudit, analysis: ANALYSIS, engine: null, money: null, bench, coverage: cov }), 'Executive-Diagnostic-A0.pdf');

  // Сводный бэклог + Протокол синергии/QA
  const contentR = buildContentAudit(ds);
  const seoR = buildSeoArch(ds);
  const techR = buildTechAudit(ds);
  const ciR = buildIntelligence(ds);
  const raw: RawRec[] = [
    ...siteAudit.pages.flatMap((p) => p.fixes.map((f) => ({ pr: (f.crit === 'Блокирующая' ? 'P0' : f.crit === 'Высокая' ? 'P1' : 'P2') as RawRec['pr'], action: `${p.title}: ${f.what}`, effect: f.why, source: 'UX/UI' }))),
    ...contentR.recommendations.map((r) => ({ ...r, source: 'Контент' })),
    ...mech.recommendations.map((r) => ({ ...r, source: 'Механики' })),
    ...journeyReport.recommendations.map((r) => ({ ...r, source: 'Путь клиента' })),
    ...techR.categories.flatMap((c) => c.checks.filter((ch) => ch.status === 'gap').map((ch) => ({ pr: 'P1' as const, action: ch.rec, effect: `Закрывает «${ch.label}»`, source: 'Технический' }))),
    ...seoR.issues.map((i) => ({ pr: (i.level <= 1 ? 'P0' : 'P1') as RawRec['pr'], action: `${i.node}: ${i.action}`, effect: i.problem, source: 'SEO' })),
    ...ciR.chains.map((c, i) => ({ pr: (i < 2 ? 'P0' : 'P1') as RawRec['pr'], action: c.action, effect: c.impact, source: 'CI' })),
  ];
  const backlog = buildBacklog(cn, ds.takenAt, raw);
  await pdf(renderBacklogHtml(backlog), 'Сводный-бэклог-A0.pdf');
  const qa = await buildQa(cn, ds.takenAt, { siteAudit, content: contentR, mech, journey: journeyReport, tech: techR, seo: seoR, ci: ciR, bench, maturity: buildMaturity(ds), backlog, money: null }, ['аналитический слой не отработал: Your credit balance is too low (пример записи прогона)']);
  await pdf(renderQaHtml(qa), 'Протокол-синергии-QA-A0.pdf');

  await closePdfBrowser();
  console.log(`Готово: ${done.length} PDF в ${OUT}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
