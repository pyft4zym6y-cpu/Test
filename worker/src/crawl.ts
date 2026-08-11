/**
 * L0-обход сайта настоящим браузером (Playwright). Видит JS-контент, которого
 * не даёт fetch. Обнаруживает представительные страницы (главная, каталог/PLP,
 * карточка/PDP, корзина), гоняет 30 проверок голд-стандарта по отрендеренному
 * DOM, определяет платформу и аналитику. Основа тира T1 (годится и для
 * негласного аудита — доступы не нужны).
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export type L0Check = { id: string; group: string; label: string; pass: boolean; detail?: string };
export type PageKind = 'home' | 'plp' | 'pdp' | 'cart' | 'checkout' | 'content' | 'faq' | 'other';

/** Дизайн-замеры страницы (для UX/UI-разбора против AQC-эталона). Всё измеримо
 *  из отрендеренного DOM на T1 — без доступов. */
export type UxProbe = {
  foldButtons: number;          // кликабельные элементы над сгибом (конкуренция за внимание)
  primaryCtaAboveFold: boolean; // крупная кнопка-действие в первом экране
  navItems: number;             // пунктов в главном меню (закон Хика/Миллера)
  breadcrumbs: boolean;         // хлебные крошки (положение в IA)
  stickyHeader: boolean;        // закреплённый хедер
  headingLevels: number;        // сколько уровней заголовков задействовано (иерархия)
  distinctButtonColors: number; // разных цветов кнопок (размытие приоритета CTA)
  productCards: number;         // карточек товара (сигнал PLP)
  filters: boolean;             // фильтры/фасеты
  sortControl: boolean;         // сортировка листинга
  galleryImages: number;        // изображений в галерее товара (PDP)
  addToCartProminent: boolean;  // «в корзину» распознаётся и в первом экране
  variantSelector: boolean;     // выбор варианта (размер/цвет)
  priceVisible: boolean;        // цена видна сразу
  trustBadges: boolean;         // гарантия/возврат/безопасность
  paymentIcons: boolean;        // платёжные и контактные сигналы доверия
  reviews: boolean;             // отзывы/рейтинг
  formFields: number;           // видимых полей формы (длина чекаута)
  guestCheckoutHint: boolean;   // намёк на гостевой чекаут
  smallTapTargets: number;      // кликабельных ниже 40px (Thumb Zone)
  baseFontPx: number;           // базовый кегль (читаемость на мобильном)
  blocks: Record<string, boolean>; // присутствие блоков композиции (для сверки с эталонным прототипом)
  annotations: Annotation[];    // маркеры на скриншоте первого экрана (A0 §9) — координаты во вьюпорте 1366×900
};

/** Маркер для аннотации скриншота: рамка+подпись на элементе первого экрана. */
export type Annotation = { label: string; x: number; y: number; w: number; h: number; tone: 'good' | 'warn' };

export type PageAudit = {
  url: string;
  finalUrl: string;
  kind: PageKind;
  status: number | null;
  title: string;
  checks: L0Check[];
  score: number | null; // % пройденных проверок против голд-стандарта
  ux?: UxProbe;         // дизайн-замеры для UX/UI-разбора
  screenshot?: string;  // первый экран страницы (base64 jpeg) — для документов; не пишется в dataset.json
  error?: string;
};

export type Tech = {
  platform: string | null;
  analytics: string[];
  signals: string[];
};

export type SiteCrawl = {
  rootUrl: string;
  finalUrl: string;
  kind: 'client' | 'competitor';
  reachable: boolean;
  robotsTxt: boolean;
  sitemapXml: boolean;
  tech: Tech;
  pages: PageAudit[];
  discoveredLinks: number;
  links: string[]; // внутренние URL, найденные обходом (для SEO-дерева)
  pageTypes?: PageTypeCoverage[]; // карта уникальных типов страниц (100% + переменные)
  soft404?: boolean | null;       // несуществующий URL отдаёт 200 («мягкая 404») — дефект индексации
  error?: string;
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 weexp-audit';

export async function launchBrowser(): Promise<Browser> {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const executablePath = process.env.CHROME_PATH || undefined; // escape hatch для окружений с предустановленным Chromium
  return chromium.launch({
    headless: process.env.HEADFUL !== '1', // HEADFUL=1 — иногда проходит там, где headless режет Cloudflare
    ...(executablePath ? { executablePath } : {}),
    ...(proxy ? { proxy: { server: proxy } } : {}),
    // менее детектируемый автоматизированный Chromium (для бот-защиты клиентских сайтов)
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
  });
}

/* ── Проверки голд-стандарта, исполняются В СТРАНИЦЕ (реальный DOM) ── */
function inPageChecks(): { checks: L0Check[]; kindSignals: Record<string, boolean>; tech: string[]; ux: UxProbe } {
  const out: L0Check[] = [];
  const add = (id: string, group: string, label: string, pass: boolean, detail?: string) =>
    out.push({ id, group, label, pass, detail });
  const $ = (s: string) => document.querySelector(s);
  const $$ = (s: string) => Array.from(document.querySelectorAll(s));
  const html = document.documentElement.outerHTML;
  const low = html.toLowerCase();
  const text = (document.body?.textContent ?? '').toLowerCase();

  // SEO
  const title = (document.title ?? '').trim();
  add('title', 'SEO', 'Title 15–70 символов', title.length >= 15 && title.length <= 70, title ? `${title.length} симв.` : 'нет');
  const desc = ($('meta[name="description"]') as HTMLMetaElement | null)?.content?.trim() ?? '';
  add('desc', 'SEO', 'Meta description 50–170', desc.length >= 50 && desc.length <= 170, desc ? `${desc.length} симв.` : 'нет');
  add('canonical', 'SEO', 'Canonical задан', Boolean($('link[rel="canonical"]')));
  add('h1', 'SEO', 'Ровно один H1', $$('h1').length === 1, `${$$('h1').length} шт.`);
  const robots = ($('meta[name="robots"]') as HTMLMetaElement | null)?.content ?? '';
  add('noindex', 'SEO', 'Нет случайного noindex', !/noindex/i.test(robots));
  add('og', 'SEO', 'Open Graph (og:title + og:image)', Boolean($('meta[property="og:title"]') && $('meta[property="og:image"]')));
  add('schema-org', 'SEO', 'Schema.org Organization/WebSite', /"@type"\s*:\s*"(organization|website)/i.test(html));
  add('schema-product', 'SEO', 'Schema.org Product/Offer', /"@type"\s*:\s*"(product|offer|aggregateoffer)/i.test(html));
  add('schema-crumbs', 'SEO', 'Schema.org BreadcrumbList', /breadcrumblist/i.test(html));
  add('hreflang', 'SEO', 'hreflang (мультиязычность)', Boolean($('link[rel="alternate"][hreflang]')));

  // UX / коммерция
  add('viewport', 'UX', 'Viewport (мобильная версия)', Boolean($('meta[name="viewport"]')));
  add('favicon', 'UX', 'Favicon', Boolean($('link[rel*="icon"]')));
  const hasSearch = Boolean($('input[type="search"]') || $('[class*="search" i] input') || $('form[action*="search" i]'));
  add('search', 'UX', 'Поиск по сайту', hasSearch);
  add('phone', 'UX', 'Телефон кликабелен (tel:)', Boolean($('a[href^="tel:"]')));
  const hasCart = Boolean($('[href*="cart" i]') || $('[class*="cart" i]') || $('[href*="korzina" i]') || $('[href*="basket" i]'));
  add('cart', 'UX', 'Корзина обнаружима', hasCart);
  const hasPrice = /(₴|грн|zł|pln|€|eur|usd|\$)\s?\d|\d\s?(₴|грн|zł)/i.test(text);
  add('price', 'UX', 'Цены на странице', hasPrice);
  add('reviews', 'UX', 'Отзывы/рейтинг обнаружимы', /відгук|отзыв|review|рейтинг|rating/i.test(low));
  add('delivery', 'UX', 'Доставка/оплата в контенте', /достав|delivery|shipping|оплат|payment/i.test(text));
  add('contacts', 'UX', 'Контакты/адрес', /контакт|contact|адрес|адреса/i.test(text));
  add('social', 'UX', 'Соцсети привязаны', Boolean($('[href*="instagram."]') || $('[href*="facebook."]') || $('[href*="tiktok."]')));

  // Техника
  add('https', 'Техника', 'HTTPS', location.protocol === 'https:');
  add('charset', 'Техника', 'Charset задан', Boolean($('meta[charset]')));
  const imgs = $$('img') as HTMLImageElement[];
  const withAlt = imgs.filter((i) => (i.getAttribute('alt') ?? '').trim()).length;
  add('alt', 'Техника', 'ALT у ≥70% изображений', imgs.length === 0 || withAlt / imgs.length >= 0.7, imgs.length ? `${withAlt}/${imgs.length}` : 'нет img');
  add('lazy', 'Техника', 'Lazy-load изображений', imgs.some((i) => i.getAttribute('loading') === 'lazy'));
  add('lang', 'Техника', 'Атрибут lang у html', Boolean(document.documentElement.getAttribute('lang')));
  const analytics = /gtag|googletagmanager|fbq\(|fbevents|clarity|hotjar/i.test(html);
  add('analytics', 'Техника', 'Аналитика установлена (GA4/GTM/Pixel)', analytics);
  add('preconnect', 'Техника', 'Preconnect/preload ресурсов', Boolean($('link[rel="preconnect"]') || $('link[rel="preload"]')));
  add('cookies', 'Техника', 'Cookie/consent-механика (для ЕС)', /cookie|consent|gdpr/i.test(low));
  add('errors-soft', 'Техника', 'Нет текста ошибок в вёрстке', !/fatal error|exception|undefined index|stack trace/i.test(text));

  // Сигналы типа страницы
  const addToCart = /(в корзину|додати в кошик|add to cart|купить|купити|buy now)/i.test(text) ||
    Boolean($('[class*="add-to-cart" i]') || $('[data-add-to-cart]') || $('button[name*="add" i]'));
  const productCards = $$('[class*="product" i], [class*="card" i], [class*="item" i]').length;
  const kindSignals: Record<string, boolean> = {
    addToCart,
    manyCards: productCards >= 8,
    isCartUrl: /cart|basket|korzina|kosik|koszyk/i.test(location.pathname),
    isCheckoutUrl: /checkout|order|oformlen|zamowien|zakaz/i.test(location.pathname),
    isProductUrl: /product|tovar|goods|p\/|item|catalog\/[^/]+\/[^/]+/i.test(location.pathname),
    isCategoryUrl: /category|catalog|shop|collections|categoriya|katalog/i.test(location.pathname),
    hasProductSchema: /"@type"\s*:\s*"product"/i.test(html),
  };

  // Технологические сигналы (платформа). Приоритет: <meta generator> → спец-маркеры
  // в HTML. Заголовки ответа/cookies добавляются на уровне crawlSite (надёжнее).
  const tech: string[] = [];
  const generator = (($('meta[name="generator"]') as HTMLMetaElement | null)?.content ?? '').toLowerCase();
  const push = (re: RegExp, name: string) => { if (re.test(low) && !tech.includes(name)) tech.push(name); };
  const pushGen = (re: RegExp, name: string) => { if (re.test(generator) && !tech.includes(name)) tech.unshift(name); };
  // generator meta — самый надёжный in-page сигнал CMS
  pushGen(/shopify/, 'Shopify'); pushGen(/woocommerce/, 'WooCommerce'); pushGen(/wordpress/, 'WordPress');
  pushGen(/prestashop/, 'PrestaShop'); pushGen(/opencart/, 'OpenCart'); pushGen(/magento/, 'Magento');
  pushGen(/joomla/, 'Joomla'); pushGen(/drupal/, 'Drupal'); pushGen(/tilda/, 'Tilda'); pushGen(/bitrix/, '1C-Bitrix');
  // разделяем WooCommerce и «просто WordPress»
  if (/woocommerce|wc-|wc_/.test(low)) push(/.?/, 'WooCommerce');
  else if (/wp-content|wp-includes|wp-json/.test(low)) push(/.?/, 'WordPress');
  push(/cdn\.shopify|myshopify|shopify\./, 'Shopify');
  // ВАЖНО: не использовать /mage\/|mage-/ — матчится внутри "image/", "image-" (реальный
  // прод-баг: OpenCart-сайт определился как Magento из-за путей картинок).
  push(/magento|x-magento|\/static\/version\d/, 'Magento');
  push(/bitrix|bx-|\/bitrix\//, '1C-Bitrix');
  push(/prestashop/, 'PrestaShop');
  push(/opencart|route=product/, 'OpenCart');
  push(/tilda|tildacdn/, 'Tilda');
  push(/wix\.com|wixstatic|_wix/, 'Wix');
  push(/insales/, 'InSales');
  push(/horoshop/, 'Хорошоп');
  push(/gtag|googletagmanager/, 'GA4/GTM');
  push(/fbq\(|fbevents/, 'Meta Pixel');
  push(/hotjar/, 'Hotjar');
  push(/clarity\.ms/, 'MS Clarity');

  // ── Дизайн-замеры для UX/UI-разбора (Visibility, IA, Decision, Mobile) ──
  const vh = window.innerHeight || 900;
  const inFold = (el: Element): boolean => {
    try { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && r.width > 0 && r.height > 0; } catch { return false; }
  };
  const btns = $$('button, [role="button"], input[type="submit"], a[class*="btn" i], a[class*="button" i], [class*="add-to-cart" i], [data-add-to-cart]');
  const foldButtons = btns.filter(inFold).length;
  const primaryCtaAboveFold = btns.some((el) => { if (!inFold(el)) return false; try { const r = el.getBoundingClientRect(); return r.width * r.height >= 3000; } catch { return false; } });
  const navEl = $('nav') || $('[role="navigation"]') || $('header');
  const navItems = navEl ? navEl.querySelectorAll('a').length : $$('header a').length;
  const breadcrumbs = Boolean($('[class*="breadcrumb" i]') || $('[aria-label*="breadcrumb" i]')) || /breadcrumblist/i.test(html);
  const headerEl = $('header');
  let stickyHeader = false;
  try { if (headerEl) { const pos = getComputedStyle(headerEl).position; stickyHeader = pos === 'sticky' || pos === 'fixed'; } } catch { /* noop */ }
  const headingLevels = ['h1', 'h2', 'h3', 'h4'].filter((t) => $$(t).length > 0).length;
  const colorSet = new Set<string>();
  btns.slice(0, 40).forEach((el) => { try { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') colorSet.add(c); } catch { /* noop */ } });
  const distinctButtonColors = colorSet.size;
  const filters = Boolean($('[class*="filter" i]') || $('[class*="facet" i]') || $('aside input[type="checkbox"]'));
  const sortControl = Boolean($('select[class*="sort" i]') || $('[class*="sort" i] select') || $('[class*="orderby" i]'));
  const galleryEl = $('[class*="gallery" i]') || $('[class*="slider" i]') || $('[class*="thumbs" i]');
  const galleryImages = galleryEl ? galleryEl.querySelectorAll('img').length : 0;
  const addToCartProminent = btns.some((el) => { const t = (el.textContent ?? '').toLowerCase(); return /(в корзину|в кошик|додати|add to cart|купить|купити|buy)/.test(t) && inFold(el); });
  const variantSelector = Boolean($('[class*="variant" i]') || $('[class*="swatch" i]') || $('select[name*="attribute" i]') || $('[class*="option" i] button') || $('[class*="size" i] button'));
  const priceVisible = /(₴|грн|zł|pln|€|eur|usd|\$)\s?\d|\d\s?(₴|грн|zł)/i.test(text);
  const trustBadges = /гарант|guarantee|поверненн|возврат|return|безпеч|secure|сертифікат|офіційн|официальн|оригінал/i.test(text);
  const paymentIcons = Boolean($('[class*="payment" i] img') || $('img[src*="visa" i]') || $('img[src*="mastercard" i]') || $('img[alt*="visa" i]')) || /visa|mastercard|google pay|apple pay|liqpay|privat24|monobank|наложен|післяплат|нова пошта/i.test(low);
  const reviews = /відгук|отзыв|review|рейтинг|rating|★|☆/i.test(low);
  const formFields = $$('form input:not([type="hidden"]), form select, form textarea').length;
  const guestCheckoutHint = /без реєстрац|без регистрац|guest|гостев|как гость|як гість/i.test(text);
  let smallTapTargets = 0;
  ($$('a, button, [role="button"], input[type="submit"]')).slice(0, 200).forEach((el) => { try { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.height < 40) smallTapTargets++; } catch { /* noop */ } });
  let baseFontPx = 16;
  try { baseFontPx = parseFloat(getComputedStyle(document.body).fontSize) || 16; } catch { /* noop */ }
  // ── Присутствие блоков композиции (для сверки с эталонным прототипом страницы) ──
  const hasSel = (s: string) => Boolean($(s));
  const inLow = (re: RegExp) => re.test(low);
  const inTxt = (re: RegExp) => re.test(text);
  const blocks: Record<string, boolean> = {
    breadcrumbs,
    hero: hasSel('[class*="hero" i], [class*="banner" i], [class*="slider" i], [class*="slideshow" i], [class*="carousel" i]'),
    usp_bar: hasSel('[class*="usp" i], [class*="advantage" i], [class*="benefit" i]') || inLow(/чому ми|почему мы|наші переваги|наши преимущества|why us/),
    search: hasSel('input[type="search"], [class*="search" i] input, form[action*="search" i]'),
    nav: Boolean(navEl && navEl.querySelectorAll('a').length >= 3),
    product_grid: productCards >= 8,
    trust: trustBadges || paymentIcons,
    reviews,
    newsletter: hasSel('[class*="newsletter" i], [class*="subscribe" i]') || inLow(/підпис|подпис|newsletter|subscribe/),
    footer_contacts: hasSel('footer') || inTxt(/контакт|contact|адрес|адреса/),
    category_title: hasSel('h1'),
    category_description: hasSel('[class*="category-desc" i], [class*="cat-desc" i], [class*="seo-text" i]'),
    product_count: hasSel('[class*="count" i], [class*="results" i]') || inTxt(/товар(ів|ов)|результат|products found/),
    filters,
    sort: sortControl,
    view_toggle: hasSel('[class*="view-mode" i], [class*="grid-list" i], [class*="switch-view" i]'),
    pagination: hasSel('[class*="pagination" i], [rel="next"], [class*="load-more" i]') || inTxt(/наступна|следующая|показати ще|показать ещё|load more/),
    faq: hasSel('[class*="faq" i]') || inLow(/часті питання|частые вопросы/),
    product_header: hasSel('h1'),
    gallery: galleryImages > 0,
    price: priceVisible,
    add_to_cart: addToCartProminent || hasSel('[class*="add-to-cart" i], [data-add-to-cart]'),
    variants: variantSelector,
    delivery: inTxt(/достав|delivery|shipping/),
    payment: paymentIcons,
    description: hasSel('[class*="description" i], [id*="description" i], [class*="tab" i]'),
    specifications: hasSel('[class*="spec" i], [class*="characteristic" i], [class*="attribute" i]') || inLow(/характеристик|специфікац|specifications/),
    qa: hasSel('[class*="question" i], [class*="qa" i]') || inLow(/питання та відповіді|вопросы и ответы|q&a/),
    video: hasSel('iframe[src*="youtube" i], iframe[src*="vimeo" i], video'),
    related: hasSel('[class*="related" i], [class*="similar" i], [class*="recommend" i], [class*="upsell" i], [class*="cross" i]') || inLow(/схожі товари|похожие товары|з цим товаром|с этим товаром|рекоменд/),
    recently_viewed: hasSel('[class*="recently" i], [class*="viewed" i]') || inLow(/переглянуті|просмотренные|recently viewed/),
    qty_control: hasSel('[class*="quantity" i], [class*="qty" i], input[type="number"]'),
    promo_code: hasSel('[class*="promo" i], [class*="coupon" i], [name*="coupon" i]') || inLow(/промокод|promo code|купон/),
    delivery_calc: inLow(/розрахувати доставку|рассчитать доставку|calculate shipping/),
    order_summary: hasSel('[class*="summary" i], [class*="total" i]') || inTxt(/разом до сплати|итого к оплате|order total|сума замовлення|сумма заказа/),
    wishlist: hasSel('[class*="wishlist" i], [class*="favorite" i], [class*="favourite" i]') || inLow(/список бажань|избранное|wishlist|save for later/),
    continue_shopping: inTxt(/продовжити покупки|продолжить покупки|continue shopping/),
    contact_form: hasSel('form input[type="email"], form input[name*="phone" i], form input[name*="tel" i], form input[name*="name" i]'),
    delivery_selection: hasSel('[class*="delivery" i] input[type="radio"], [class*="shipping" i] input[type="radio"], [name*="delivery" i]'),
    payment_selection: hasSel('[class*="payment" i] input[type="radio"], [name*="payment" i]'),
    guest_checkout: guestCheckoutHint,
    author: hasSel('[class*="author" i], [rel="author"]') || inLow(/автор:/),
    toc: hasSel('[class*="toc" i], [class*="table-of-contents" i], nav[class*="content" i]'),
    share: hasSel('[class*="share" i], [class*="social" i] a'),
  };

  // Аннотации скриншота (A0 §9): координаты ключевых элементов первого экрана.
  const annotations: Annotation[] = [];
  try {
    const clip = (r: DOMRect) => r.width > 4 && r.height > 4 && r.top < vh && r.top > -20 && r.left < 1366 && r.left > -20;
    const mk = (el: Element | null | undefined, label: string, tone: 'good' | 'warn') => {
      if (!el || annotations.length >= 4) return;
      try { const r = el.getBoundingClientRect(); if (clip(r)) annotations.push({ label, x: Math.round(Math.max(0, r.left)), y: Math.round(Math.max(0, r.top)), w: Math.round(Math.min(r.width, 1366 - r.left)), h: Math.round(Math.min(r.height, 900 - r.top)), tone }); } catch { /* noop */ }
    };
    const foldBtns = btns.filter(inFold);
    const cta = foldBtns.slice().sort((a, b) => { try { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.width * rb.height - ra.width * ra.height; } catch { return 0; } })[0];
    if (cta && primaryCtaAboveFold) mk(cta, 'Главный CTA', 'good');
    mk($('input[type="search"], [class*="search" i] input, form[action*="search" i]'), 'Поиск', 'good');
    mk(foldBtns.find((el) => /(в корзину|в кошик|додати|add to cart|купить|купити|buy)/i.test(el.textContent ?? '')), 'В корзину', 'good');
  } catch { /* noop */ }

  const ux: UxProbe = {
    foldButtons, primaryCtaAboveFold, navItems, breadcrumbs, stickyHeader, headingLevels, distinctButtonColors,
    productCards, filters, sortControl, galleryImages, addToCartProminent, variantSelector, priceVisible,
    trustBadges, paymentIcons, reviews, formFields, guestCheckoutHint, smallTapTargets, baseFontPx, blocks, annotations,
  };

  return { checks: out, kindSignals, tech, ux };
}

function classify(url: string, sig: Record<string, boolean>, isRoot: boolean): PageKind {
  if (isRoot) return 'home';
  // Сначала — надёжная классификация по URL: сервисные/контентные страницы часто
  // содержат карточки-виджеты в футере и ошибочно уходили в PLP (прод-баг:
  // blog/about/contact/delivery определились как «Каталог»).
  try {
    const p = new URL(url).pathname;
    if (/^\/(en|ru|ua|uk|pl|de)\/?$/i.test(p)) return 'home'; // языковое зеркало главной
    if (/\/(faq|help|dopomoga|voprosy|pytannya|questions|q-?a)(\/|$)/i.test(p)) return 'faq';
    if (/\/(blog|news|article|stat|about|o-nas|about-us|pro-nas|company|kompan|contact|kontakt|delivery|dostavka|payment|oplata|terms|privacy|policy|guarantee|warranty|return|povern|compare|korp-|horeca|b2b|opt|wholesale)(\/|-|$)/i.test(p)) return 'content';
  } catch { /* not a url */ }
  if (sig.isCheckoutUrl) return 'checkout';
  if (sig.isCartUrl) return 'cart';
  if (sig.hasProductSchema || (sig.addToCart && !sig.manyCards) || sig.isProductUrl) return 'pdp';
  if (sig.manyCards || sig.isCategoryUrl) return 'plp';
  return 'content';
}

async function auditPage(page: Page, url: string, isRoot: boolean): Promise<{ audit: PageAudit; tech: string[]; links: string[]; headers?: Record<string, string> }> {
  let status: number | null = null;
  let headers: Record<string, string> = {};
  const fail = (msg: string, fUrl = url, ttl = ''): { audit: PageAudit; tech: string[]; links: string[] } =>
    ({ audit: { url, finalUrl: fUrl, kind: 'other', status, title: ttl, checks: [], score: null, error: msg }, tech: [], links: [] });
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    status = resp?.status() ?? null;
    headers = resp?.headers() ?? {};
    await page.waitForTimeout(1200); // дать JS дорисоваться
  } catch (e) {
    return fail(`сеть: ${String(e).slice(0, 130)}`);
  }
  // page.goto НЕ бросает на HTTP-ошибке — проверяем статус сами, иначе страница
  // «403 Access Denied» ушла бы в аудит как валидная и дала бы мусорный результат.
  if (status !== null && status >= 400) {
    const blocked = status === 401 || status === 403 || status === 429;
    return fail(blocked
      ? `доступ заблокирован: HTTP ${status} (WAF/бот-защита) — нужен headful/stealth-режим или доступ от клиента`
      : `сайт вернул HTTP ${status}`, page.url());
  }
  const finalUrl = page.url();
  const title = await page.title().catch(() => '');
  if (/just a moment|attention required|verify you are human|checking your browser|cloudflare|доступ (ограничен|обмежено)|captcha/i.test(title)) {
    return { audit: { url, finalUrl, kind: 'other', status, title, checks: [], score: null, error: 'бот-защита: challenge-страница (Cloudflare/CAPTCHA) — нужен headful/stealth или доступ' }, tech: [], links: [] };
  }
  const { checks, kindSignals, tech, ux } = await page.evaluate(inPageChecks);
  const links = await page
    .evaluate(() => Array.from(document.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).href).slice(0, 400))
    .catch(() => [] as string[]);
  const passed = checks.filter((c) => c.pass).length;
  const score = checks.length ? Math.round((passed / checks.length) * 100) : null;
  const kind = classify(finalUrl, kindSignals, isRoot);
  // Скриншот первого экрана — для UX/прототип-документов. Отключается NO_SCREENSHOTS=1.
  let screenshot: string | undefined;
  if (process.env.NO_SCREENSHOTS !== '1') {
    const buf = await page.screenshot({ type: 'jpeg', quality: 55, clip: { x: 0, y: 0, width: 1366, height: 900 } }).catch(() => null);
    if (buf) screenshot = buf.toString('base64');
  }
  return { audit: { url, finalUrl, kind, status, title, checks, score, ux, screenshot }, tech, links, headers };
}

/** Определение CMS/платформы по заголовкам ответа и cookies (надёжнее HTML). */
function platformFromHeaders(headers: Record<string, string>): string | null {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()]));
  const cookie = h['set-cookie'] ?? '';
  const powered = `${h['x-powered-by'] ?? ''} ${h['x-powered-cms'] ?? ''} ${h['powered-by'] ?? ''} ${h['x-generator'] ?? ''}`;
  const server = h['server'] ?? '';
  if (h['x-shopid'] || h['x-shopify-stage'] || h['x-sorting-hat-shopid'] || /shopify/.test(powered + server)) return 'Shopify';
  if (/bitrix/.test(powered) || /bitrix_sm_|bx_user_id|php.{0,3}bitrix/.test(cookie)) return '1C-Bitrix';
  if (/woocommerce_|wp_woocommerce/.test(cookie)) return 'WooCommerce';
  if (/wordpress_|wp-settings/.test(cookie) || /wordpress/.test(powered)) return 'WordPress';
  if (/magento|x-magento/.test(powered) || /x-magento-|mage-cache/.test(JSON.stringify(h))) return 'Magento';
  if (/prestashop-/.test(cookie) || /prestashop/.test(powered)) return 'PrestaShop';
  if (/ocsessid/.test(cookie)) return 'OpenCart';
  if (/tilda/.test(server + powered)) return 'Tilda';
  if (/horoshop/.test(server + powered + cookie)) return 'Хорошоп';
  if (/insales/.test(server + powered + cookie)) return 'InSales';
  return null;
}

/** Контекст браузера с закалкой против бот-защиты (UA, заголовки, timezone, anti-webdriver). */
async function hardenedContext(browser: Browser) {
  const ctx = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1366, height: 900 },
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.6',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Chromium";v="126", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
  });
  // tsx/esbuild (keepNames) оборачивает именованные функции хелпером __name(fn,"n").
  // При page.evaluate тело функции сериализуется и исполняется В СТРАНИЦЕ, где
  // __name не определён → ReferenceError и обход не собирает данные. Определяем
  // шим в глобале страницы. Передаём строкой — иначе esbuild обернёт и сам шим.
  await ctx.addInitScript('globalThis.__name = globalThis.__name || function (t) { return t; };');
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['uk-UA', 'uk', 'ru', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
  });
  return ctx;
}

/** Точечный обход одной страницы (для агентного добора фактов). */
export async function auditSingle(browser: Browser, url: string): Promise<PageAudit & { tech: string[] }> {
  const ctx = await hardenedContext(browser);
  try {
    const page = await ctx.newPage();
    const { audit, tech } = await auditPage(page, url, false);
    return { ...audit, tech };
  } finally {
    await ctx.close().catch(() => {});
  }
}

/** Парсит sitemap.xml (+ sitemap-index и Sitemap: из robots) → полный список URL сайта. */
async function fetchSitemapUrls(ctx: BrowserContext, origin: string): Promise<string[]> {
  const urls = new Set<string>();
  const seen = new Set<string>();
  const queue: string[] = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`];
  try {
    const rob = await ctx.request.get(`${origin}/robots.txt`, { timeout: 8000 }).catch(() => null);
    if (rob && rob.ok()) { const t = await rob.text().catch(() => ''); for (const m of t.matchAll(/^\s*sitemap:\s*(\S+)/gim)) queue.push(m[1].trim()); }
  } catch { /* noop */ }
  let docs = 0;
  while (queue.length && docs < 12 && urls.size < 3000) {
    const sm = queue.shift(); if (!sm || seen.has(sm)) continue; seen.add(sm);
    try {
      const r = await ctx.request.get(sm, { timeout: 10000 }).catch(() => null);
      if (!r || !r.ok()) continue;
      docs++;
      const xml = (await r.text().catch(() => '')).slice(0, 3_000_000);
      const isIndex = /<sitemapindex/i.test(xml);
      for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
        const u = m[1].trim();
        if (isIndex) { if (queue.length < 30 && !seen.has(u)) queue.push(u); }
        else { try { if (new URL(u).origin === origin) urls.add(u.split('#')[0]); } catch { /* skip */ } }
        if (urls.size >= 3000) break;
      }
    } catch { /* noop */ }
  }
  return Array.from(urls);
}

/** Отбирает представителей нужных типов страниц из найденных ссылок (несколько на тип). */
function pickCandidates(root: string, links: string[], want: number): string[] {
  let origin: string;
  try { origin = new URL(root).origin; } catch { return []; }
  const path = (h: string) => { try { return new URL(h).pathname; } catch { return ''; } };
  const internal = Array.from(new Set(links))
    .filter((h) => { try { return new URL(h).origin === origin; } catch { return false; } })
    .filter((h) => !/\.(jpg|png|webp|svg|pdf|zip|css|js|ico|xml|json)(\?|$)/i.test(h))
    .filter((h) => h !== root && h !== root + '/');
  const out = new Set<string>();
  const findAll = (re: RegExp, n: number) => internal.filter((h) => re.test(path(h))).slice(0, n).forEach((h) => out.add(h));
  const add1 = (re: RegExp) => { const h = internal.find((x) => re.test(path(x))); if (h) out.add(h); };
  findAll(/category|catalog|shop|collections|katalog|categor/i, 2);
  findAll(/product|tovar|\/p\/|goods|item|\/pr\//i, 3);
  // Товары без ключевых слов в URL: на многих платформах (OpenCart с SEO-URL и др.)
  // карточки живут В КОРНЕ как слаги (/pled-bovaria-siryj/). Признак: большая группа
  // одиночных дефисных слагов. Берём 3 кандидата — classify() подтвердит тип по DOM.
  const SERVICE_RE = /blog|news|article|about|contact|kontakt|delivery|dostavka|payment|oplata|faq|help|terms|privacy|policy|compare|cart|checkout|account|login|search|katalog|catalog|category|collection|shop|korp|horeca|b2b|opt|wishlist|^\/?(en|ru|ua|uk|pl|de)$/i;
  const rootSlugs = internal.filter((h) => { const p = path(h); const m = p.match(/^\/([a-z0-9-]{10,})\/?$/i); return Boolean(m && m[1].includes('-') && !SERVICE_RE.test(p)); });
  if (rootSlugs.length >= 20) rootSlugs.slice(0, 3).forEach((h) => out.add(h));
  add1(/cart|basket|korzina|koszyk/i);
  add1(/checkout|oform|zakaz|order/i);
  add1(/faq|help|voprosy|pytannya/i);
  findAll(/blog|article|news|stat/i, 2);
  add1(/about|o-nas|company|pro-nas|kompan/i);
  add1(/dostavka|delivery|payment|oplata/i);
  for (const h of internal) { if (out.size >= want) break; out.add(h); }
  return Array.from(out).slice(0, want);
}

/* ── Реестр уникальных типов страниц e-commerce ──
 * Правило аудита: карта сайта строится из sitemap + ссылок обхода + АКТИВНОЙ ПРОБЫ
 * известных путей; разбирается представитель КАЖДОГО найденного типа. Обязательный
 * тип, не найденный нигде, — это находка аудита («страницы нет»), а не пропуск. */
export type PageTypeStatus = 'разобрана' | 'найдена' | 'не найдена' | 'вне обхода (A1)';
export type PageTypeCoverage = { id: string; label: string; mandatory: boolean; url?: string; status: PageTypeStatus };
type PageTypeDef = { id: string; label: string; mandatory: boolean; match: RegExp; probes: string[]; kind?: PageKind };

export const PAGE_TYPE_REGISTRY: PageTypeDef[] = [
  // ── 100%: обязаны существовать у любого магазина ──
  { id: 'home', label: 'Главная', mandatory: true, match: /^\/$/, probes: [], kind: 'home' },
  { id: 'plp', label: 'Каталог / категория (PLP)', mandatory: true, match: /category|catalog|katalog|collection|shop/i, probes: ['/katalog/', '/catalog/', '/shop/'], kind: 'plp' },
  { id: 'pdp', label: 'Карточка товара (PDP)', mandatory: true, match: /product|tovar|\/p\/|goods|item|route=product/i, probes: [], kind: 'pdp' },
  { id: 'cart', label: 'Корзина', mandatory: true, match: /\/(cart|korzina|basket|koshyk)(\/|$)/i, probes: ['/cart/', '/cart', '/korzina/', '/basket/'], kind: 'cart' },
  { id: 'checkout', label: 'Чекаут (оформление)', mandatory: true, match: /checkout|oform|zamovlennya|order\b/i, probes: ['/checkout/', '/checkout'], kind: 'checkout' },
  { id: 'search', label: 'Результаты поиска', mandatory: true, match: /\/search|[?&](s|q|query|search)=/i, probes: ['/search/?q=test', '/?s=test', '/index.php?route=product/search&search=test'] },
  { id: 'contacts', label: 'Контакты', mandatory: true, match: /contact|kontakt/i, probes: ['/contacts/', '/contact/', '/kontakty/'] },
  { id: 'delivery-payment', label: 'Доставка и оплата', mandatory: true, match: /delivery|dostavka|shipping|payment|oplata/i, probes: ['/delivery/', '/dostavka/', '/dostavka-i-oplata/', '/shipping/'] },
  { id: 'about', label: 'О компании / бренде', mandatory: true, match: /about|o-nas|pro-nas|company/i, probes: ['/about/', '/about-us/', '/pro-nas/', '/o-nas/'] },
  { id: 'legal-terms', label: 'Оферта / условия продажи', mandatory: true, match: /oferta|offer|terms|umovy|dogovir|usloviya/i, probes: ['/oferta/', '/terms/', '/umovy/', '/publichna-oferta/'] },
  { id: 'legal-privacy', label: 'Политика конфиденциальности', mandatory: true, match: /privacy|konfiden|personal-data|polityka/i, probes: ['/privacy/', '/privacy-policy/', '/konfidencijnist/'] },
  { id: 'legal-return', label: 'Возврат и обмен', mandatory: true, match: /return|povernennya|vozvrat|obmin|obmen|refund/i, probes: ['/povernennya/', '/vozvrat/', '/returns/', '/obmin-ta-povernennya/'] },
  // ── Переменные: есть при соответствующей модели/зрелости ──
  { id: 'faq', label: 'FAQ', mandatory: false, match: /\/(faq|help|pytannya|voprosy)(\/|$)/i, probes: ['/faq/', '/faq'], kind: 'faq' },
  { id: 'blog', label: 'Блог / статьи', mandatory: false, match: /\/(blog|news|articles?|statti)(\/|$)/i, probes: ['/blog/', '/news/'] },
  { id: 'sale', label: 'Акции / распродажа', mandatory: false, match: /sale|akci|promo|discount|znyzhk|rasprodazha/i, probes: ['/sale/', '/akcii/'] },
  { id: 'new', label: 'Новинки', mandatory: false, match: /novynky|novinki|\/new(\/|$)/i, probes: [] },
  { id: 'reviews-page', label: 'Отзывы о магазине', mandatory: false, match: /\/(vidhuky|otzyvy|reviews|testimonials)(\/|$)/i, probes: ['/reviews/', '/vidhuky/'] },
  { id: 'b2b', label: 'B2B / опт', mandatory: false, match: /b2b|\/opt(\/|$)|wholesale|dealer/i, probes: ['/b2b/', '/opt/'] },
  { id: 'corporate', label: 'Корпоративные / HoReCa', mandatory: false, match: /korp|corporate|horeca/i, probes: [] },
  { id: 'loyalty', label: 'Программа лояльности / бонусы', mandatory: false, match: /loyal|bonus|cashback/i, probes: ['/loyalty/', '/bonus/'] },
  { id: 'account', label: 'Личный кабинет / вход', mandatory: false, match: /account|login|signin|cabinet|profil/i, probes: ['/account/', '/login/', '/index.php?route=account/login'] },
  { id: 'wishlist', label: 'Избранное / wishlist', mandatory: false, match: /wishlist|izbrannoe|obrane/i, probes: [] },
  { id: 'compare', label: 'Сравнение товаров', mandatory: false, match: /compare|porivnyannya|sravnenie/i, probes: [] },
  { id: 'brands', label: 'Бренды / производители', mandatory: false, match: /\/(brands?|brendy|manufacturer)(\/|$)/i, probes: [] },
  { id: 'gift-cert', label: 'Подарочные сертификаты', mandatory: false, match: /gift-?card|sertyfikat|certificate|podarunkov/i, probes: [] },
  { id: 'stores', label: 'Магазины / точки продаж', mandatory: false, match: /\/(stores?|shops|magazyny|adresy)(\/|$)/i, probes: [] },
  { id: 'guides', label: 'Гайды / уход / подбор', mandatory: false, match: /care|dogliad|guide|gid|yak-obraty|how-to/i, probes: [] },
  { id: 'lang', label: 'Языковые версии', mandatory: false, match: /^\/(en|ru|ua|uk|pl|de)(\/|$)/i, probes: [] },
  { id: 'thankyou', label: 'Спасибо за заказ', mandatory: false, match: /thank|success|spasibo|dyakuyemo/i, probes: [] }, // обычно недостижима без покупки
];

export async function crawlSite(
  browser: Browser,
  rootUrl: string,
  kind: 'client' | 'competitor',
  opts: { maxPages?: number } = {},
): Promise<SiteCrawl> {
  const maxPages = opts.maxPages ?? 16;
  const ctx = await hardenedContext(browser);
  const page = await ctx.newPage();
  const out: SiteCrawl = {
    rootUrl, finalUrl: rootUrl, kind, reachable: false, robotsTxt: false, sitemapXml: false,
    tech: { platform: null, analytics: [], signals: [] }, pages: [], discoveredLinks: 0, links: [],
  };
  try {
    const home = await auditPage(page, rootUrl, true);
    // Достижим = нет ошибки И статус в успешном диапазоне (2xx/3xx). HTTP-ошибку
    // (403/404/5xx) и сетевой сбой auditPage уже пометил как error выше.
    out.reachable = !home.audit.error && (home.audit.status === null || (home.audit.status >= 200 && home.audit.status < 400));
    out.finalUrl = home.audit.finalUrl;
    out.pages.push(home.audit);
    if (home.audit.error && !out.pages.some((p) => !p.error)) out.error = home.audit.error;
    out.discoveredLinks = home.links.length;

    // Внутренние ссылки для SEO-дерева (URL, а не только счётчик).
    const origin = (() => { try { return new URL(out.finalUrl).origin; } catch { return ''; } })();
    const linkSet = new Set<string>();
    const addLinks = (arr: string[]) => { for (const h of arr) { try { const u = new URL(h); if (u.origin === origin) { u.hash = ''; linkSet.add(u.toString()); } } catch { /* skip */ } } };
    addLinks(home.links);

    // robots.txt + ПОЛНОЕ дерево из sitemap.xml (все URL сайта, а не только с обхода).
    try {
      const r = await ctx.request.get(`${origin}/robots.txt`, { timeout: 8000 }).catch(() => null);
      out.robotsTxt = Boolean(r && r.ok());
      const smUrls = await fetchSitemapUrls(ctx, origin);
      out.sitemapXml = smUrls.length > 0;
      addLinks(smUrls);
    } catch { /* noop */ }

    // Активная проба известных путей: обязательный тип, которого нет в дереве,
    // ищем руками по стандартным адресам (sitemap часто не содержит корзину/поиск/правовые).
    const lpath = (h: string) => { try { const u = new URL(h); return u.pathname + u.search; } catch { return ''; } };
    const typeHit = (t: { match: RegExp }) => Array.from(linkSet).find((h) => t.match.test(lpath(h)));
    if (kind === 'client') {
      for (const t of PAGE_TYPE_REGISTRY) {
        if (!t.probes.length || typeHit(t)) continue;
        for (const pr of t.probes) {
          try {
            const r = await ctx.request.get(origin + pr, { timeout: 6000, maxRedirects: 3 }).catch(() => null);
            if (r && r.status() < 400) { linkSet.add(origin + pr); break; }
          } catch { /* noop */ }
        }
      }
      // «Мягкая 404»: несуществующий URL обязан отдавать 404, иначе мусор индексируется.
      try {
        const r404 = await ctx.request.get(`${origin}/weexp-404-probe-${Math.random().toString(36).slice(2)}`, { timeout: 6000 }).catch(() => null);
        out.soft404 = r404 ? r404.status() < 400 : null;
      } catch { out.soft404 = null; }
    }

    // техника: платформа по заголовкам ответа (надёжнее), затем по HTML-сигналам.
    const techSet = new Set(home.tech);
    const ANALYTICS = /GA4|GTM|Pixel|Hotjar|Clarity/;
    out.tech.platform = platformFromHeaders(home.headers ?? {}) ?? home.tech.find((t) => !ANALYTICS.test(t)) ?? null;
    out.tech.analytics = home.tech.filter((t) => ANALYTICS.test(t));

    // представительные страницы: пикер по ключевым словам + представитель КАЖДОГО
    // найденного типа из реестра (правило: разобрана каждая уникальная страница).
    const kw = pickCandidates(out.finalUrl, Array.from(linkSet), maxPages - 1);
    const reps = kind === 'client'
      ? PAGE_TYPE_REGISTRY.filter((t) => t.id !== 'home').map((t) => typeHit(t)).filter((u): u is string => Boolean(u))
      : [];
    const candidates = Array.from(new Set([...reps, ...kw])).filter((u) => u !== out.finalUrl).slice(0, Math.max(maxPages - 1, kind === 'client' ? 22 : 0));
    for (const url of candidates) {
      const res = await auditPage(page, url, false);
      out.pages.push(res.audit);
      res.tech.forEach((t) => techSet.add(t));
      addLinks(res.links);
    }
    out.links = Array.from(linkSet).slice(0, 2000);
    out.discoveredLinks = out.links.length;
    out.tech.signals = Array.from(techSet);
    if (!out.tech.platform) out.tech.platform = out.tech.signals.find((t) => !ANALYTICS.test(t)) ?? null;

    // Карта уникальных типов страниц: разобрана / найдена / не найдена.
    if (kind === 'client') {
      out.pageTypes = PAGE_TYPE_REGISTRY.map((t): PageTypeCoverage => {
        const crawled = out.pages.find((p) => !p.error && (t.kind ? p.kind === t.kind : t.match.test(lpath(p.finalUrl || p.url))));
        const inTree = typeHit(t);
        if (crawled) return { id: t.id, label: t.label, mandatory: t.mandatory, url: crawled.finalUrl, status: 'разобрана' };
        if (inTree) return { id: t.id, label: t.label, mandatory: t.mandatory, url: inTree, status: 'найдена' };
        if (t.id === 'thankyou') return { id: t.id, label: t.label, mandatory: t.mandatory, status: 'вне обхода (A1)' };
        return { id: t.id, label: t.label, mandatory: t.mandatory, status: 'не найдена' };
      });
    }
  } catch (e) {
    out.error = out.error ?? String(e).slice(0, 160);
  } finally {
    await ctx.close().catch(() => {});
  }
  return out;
}

/** Человеческая причина недоступности + подсказка оператору (для честного отказа). */
export function reachabilityDiagnosis(site: SiteCrawl): string {
  const err = (site.error || site.pages[0]?.error || '').toLowerCase();
  const st = site.pages[0]?.status ?? null;
  if (st === 429 || /\b429\b|rate limit|too many/.test(err))
    return 'Причина: сайт ограничивает частоту запросов (HTTP 429) — повторить позже.';
  if (st === 403 || st === 401 || /бот-защ|waf|cloudflare|captcha|challenge|заблок/.test(err))
    return 'Причина: сайт блокирует автоматический доступ (WAF/Cloudflare/бот-защита). Нужен headful/stealth-режим (HEADFUL=1) или доступ от клиента.';
  if (st !== null && st >= 500) return `Причина: сайт отвечает ошибкой сервера (HTTP ${st}).`;
  if (st === 404 || /\b404\b/.test(err)) return 'Причина: страница не найдена (HTTP 404) — проверьте URL.';
  if (/name_not_resolved|dns|enotfound|getaddrinfo/.test(err)) return 'Причина: домен не резолвится (DNS) — проверьте URL.';
  if (/timeout|timed out|err_connection|refused|reset|err_ssl|err_cert/.test(err))
    return 'Причина: сайт недоступен по сети (таймаут/соединение/сертификат) — проверьте доступность и URL.';
  return 'Проверьте URL, доступность сайта и бот-защиту.';
}
