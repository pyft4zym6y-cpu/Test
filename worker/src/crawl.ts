/**
 * L0-обход сайта настоящим браузером (Playwright). Видит JS-контент, которого
 * не даёт fetch. Обнаруживает представительные страницы (главная, каталог/PLP,
 * карточка/PDP, корзина), гоняет 30 проверок голд-стандарта по отрендеренному
 * DOM, определяет платформу и аналитику. Основа тира T1 (годится и для
 * негласного аудита — доступы не нужны).
 */
import { chromium, type Browser, type Page } from 'playwright';

export type L0Check = { id: string; group: string; label: string; pass: boolean; detail?: string };
export type PageKind = 'home' | 'plp' | 'pdp' | 'cart' | 'checkout' | 'content' | 'other';

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
};

export type PageAudit = {
  url: string;
  finalUrl: string;
  kind: PageKind;
  status: number | null;
  title: string;
  checks: L0Check[];
  score: number | null; // % пройденных проверок против голд-стандарта
  ux?: UxProbe;         // дизайн-замеры для UX/UI-разбора
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

  // Технологические сигналы (платформа)
  const tech: string[] = [];
  const push = (re: RegExp, name: string) => { if (re.test(low)) tech.push(name); };
  push(/cdn\.shopify|shopify\./, 'Shopify');
  push(/woocommerce|wp-content/, 'WooCommerce/WordPress');
  push(/mage\/|magento|mage-/, 'Magento');
  push(/bitrix|bx-/, '1C-Bitrix');
  push(/prestashop/, 'PrestaShop');
  push(/opencart/, 'OpenCart');
  push(/tilda/, 'Tilda');
  push(/wix\.com|wixstatic/, 'Wix');
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
  const ux: UxProbe = {
    foldButtons, primaryCtaAboveFold, navItems, breadcrumbs, stickyHeader, headingLevels, distinctButtonColors,
    productCards, filters, sortControl, galleryImages, addToCartProminent, variantSelector, priceVisible,
    trustBadges, paymentIcons, reviews, formFields, guestCheckoutHint, smallTapTargets, baseFontPx,
  };

  return { checks: out, kindSignals, tech, ux };
}

function classify(url: string, sig: Record<string, boolean>, isRoot: boolean): PageKind {
  if (isRoot) return 'home';
  if (sig.isCheckoutUrl) return 'checkout';
  if (sig.isCartUrl) return 'cart';
  if (sig.hasProductSchema || (sig.addToCart && !sig.manyCards) || sig.isProductUrl) return 'pdp';
  if (sig.manyCards || sig.isCategoryUrl) return 'plp';
  return 'content';
}

async function auditPage(page: Page, url: string, isRoot: boolean): Promise<{ audit: PageAudit; tech: string[]; links: string[] }> {
  let status: number | null = null;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    status = resp?.status() ?? null;
    await page.waitForTimeout(1200); // дать JS дорисоваться
  } catch (e) {
    return { audit: { url, finalUrl: url, kind: 'other', status, title: '', checks: [], score: null, error: String(e).slice(0, 140) }, tech: [], links: [] };
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
  return { audit: { url, finalUrl, kind, status, title, checks, score, ux }, tech, links };
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

/** Отбирает по одному представителю нужных типов страниц из найденных ссылок. */
function pickCandidates(root: string, links: string[]): string[] {
  let origin: string;
  try { origin = new URL(root).origin; } catch { return []; }
  const internal = Array.from(new Set(links))
    .filter((h) => { try { return new URL(h).origin === origin; } catch { return false; } })
    .filter((h) => !/\.(jpg|png|webp|svg|pdf|zip|css|js|ico)(\?|$)/i.test(h))
    .filter((h) => h !== root && h !== root + '/');

  const pick = (re: RegExp) => internal.find((h) => re.test(new URL(h).pathname));
  const out = new Set<string>();
  const plp = pick(/category|catalog|shop|collections|katalog|/i) && internal.find((h) => /category|catalog|shop|collections|katalog/i.test(new URL(h).pathname));
  const pdp = internal.find((h) => /product|tovar|\/p\/|goods|item/i.test(new URL(h).pathname));
  const cart = internal.find((h) => /cart|basket|korzina|koszyk/i.test(new URL(h).pathname));
  const content = internal.find((h) => /blog|article|about|o-nas|dostavka|delivery|faq/i.test(new URL(h).pathname));
  [plp, pdp, cart, content].forEach((u) => u && out.add(u));
  // добить до 4 представителей любыми внутренними страницами
  for (const h of internal) { if (out.size >= 4) break; out.add(h); }
  return Array.from(out).slice(0, 4);
}

export async function crawlSite(
  browser: Browser,
  rootUrl: string,
  kind: 'client' | 'competitor',
  opts: { maxPages?: number } = {},
): Promise<SiteCrawl> {
  const maxPages = opts.maxPages ?? 5;
  const ctx = await hardenedContext(browser);
  const page = await ctx.newPage();
  const out: SiteCrawl = {
    rootUrl, finalUrl: rootUrl, kind, reachable: false, robotsTxt: false, sitemapXml: false,
    tech: { platform: null, analytics: [], signals: [] }, pages: [], discoveredLinks: 0,
  };
  try {
    const home = await auditPage(page, rootUrl, true);
    out.reachable = !home.audit.error && home.audit.status !== 0;
    out.finalUrl = home.audit.finalUrl;
    out.pages.push(home.audit);
    if (home.audit.error && !out.pages.some((p) => !p.error)) out.error = home.audit.error;
    out.discoveredLinks = home.links.length;

    // robots.txt / sitemap.xml
    try {
      const origin = new URL(out.finalUrl).origin;
      const r = await ctx.request.get(`${origin}/robots.txt`, { timeout: 8000 }).catch(() => null);
      out.robotsTxt = Boolean(r && r.ok());
      const sm = await ctx.request.get(`${origin}/sitemap.xml`, { timeout: 8000 }).catch(() => null);
      out.sitemapXml = Boolean(sm && sm.ok());
    } catch { /* noop */ }

    // техника
    const techSet = new Set(home.tech);
    out.tech.platform = home.tech.find((t) => !/GA4|GTM|Pixel|Hotjar|Clarity/.test(t)) ?? null;
    out.tech.analytics = home.tech.filter((t) => /GA4|GTM|Pixel|Hotjar|Clarity/.test(t));

    // представительные страницы
    const candidates = pickCandidates(out.finalUrl, home.links).slice(0, maxPages - 1);
    for (const url of candidates) {
      const res = await auditPage(page, url, false);
      out.pages.push(res.audit);
      res.tech.forEach((t) => techSet.add(t));
    }
    out.tech.signals = Array.from(techSet);
    if (!out.tech.platform) out.tech.platform = out.tech.signals.find((t) => !/GA4|GTM|Pixel|Hotjar|Clarity/.test(t)) ?? null;
  } catch (e) {
    out.error = out.error ?? String(e).slice(0, 160);
  } finally {
    await ctx.close().catch(() => {});
  }
  return out;
}
