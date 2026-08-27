import type { ScreenCheck, ScreenRow } from './consultant';

/**
 * L0-скрининг страницы против голд-стандарта UX/UI/SEO Commerce OS:
 * Автоматические проверки по DOM (SEO / UX / Техника), голд-стандарт = все
 * пройдены. Число проверок не дублируем словами — его отдаёт checkCount().
 * HTML качается через /api/fetch (Vercel serverless) — браузеру мешает CORS.
 */

async function fetchHtml(url: string): Promise<{ html?: string; error?: string }> {
  try {
    const r = await fetch(`/api/fetch?url=${encodeURIComponent(url)}`);
    if (!r.ok) return { error: `API ${r.status} — нужен хостинг Vercel (api/fetch)` };
    const j = await r.json();
    if (j.error) return { error: j.error };
    if (!j.html) return { error: `HTTP ${j.status} без HTML` };
    if (j.status >= 400) return { error: `Сайт ответил HTTP ${j.status} (бот-защита?)` };
    return { html: j.html };
  } catch {
    return { error: 'API недоступно — скрининг работает на хостинге (Vercel), не в демо' };
  }
}

export function runChecks(html: string, url: string): ScreenCheck[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const low = html.toLowerCase();
  const $ = (sel: string) => doc.querySelector(sel);
  const $$ = (sel: string) => doc.querySelectorAll(sel);
  /*
   * Видимый текст страницы. `body.textContent` включает содержимое <script>,
   * <style> и <template> — то есть шесть проверок этой группы (price, reviews,
   * delivery, contacts, cookies, errors-soft) читали заодно исходники скриптов.
   * Достаточно было `document.cookie` в аналитике, чтобы «механика согласия»
   * засчиталась, или слова delivery в переменной — чтобы засчитался блок
   * доставки. Убираем неотображаемое перед чтением.
   */
  const visible = doc.body?.cloneNode(true) as HTMLElement | undefined;
  visible?.querySelectorAll('script, style, noscript, template').forEach((n) => n.remove());
  const text = visible?.textContent?.toLowerCase() ?? '';
  const out: ScreenCheck[] = [];
  const add = (id: string, group: string, label: string, pass: boolean, detail?: string) =>
    out.push({ id, group, label, pass, detail });

  // SEO
  const title = doc.title?.trim() ?? '';
  add('title', 'SEO', 'Title 15–70 символов', title.length >= 15 && title.length <= 70, title ? `${title.length} симв.` : 'нет');
  const desc = $('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
  add('desc', 'SEO', 'Meta description 50–170', desc.length >= 50 && desc.length <= 170, desc ? `${desc.length} симв.` : 'нет');
  add('canonical', 'SEO', 'Canonical задан', Boolean($('link[rel="canonical"]')));
  add('h1', 'SEO', 'Ровно один H1', $$('h1').length === 1, `${$$('h1').length} шт.`);
  const robots = $('meta[name="robots"]')?.getAttribute('content') ?? '';
  add('noindex', 'SEO', 'Нет случайного noindex', !/noindex/i.test(robots));
  add('og', 'SEO', 'Open Graph (og:title + og:image)', Boolean($('meta[property="og:title"]') && $('meta[property="og:image"]')));
  add('schema-org', 'SEO', 'Schema.org Organization/WebSite', /"@type"\s*:\s*"(organization|website)/i.test(html));
  add('schema-product', 'SEO', 'Schema.org Product/Offer', /"@type"\s*:\s*"(product|offer|aggregateoffer)/i.test(html) || low.includes('itemtype="http://schema.org/product"'));
  add('schema-crumbs', 'SEO', 'Schema.org BreadcrumbList', /breadcrumblist/i.test(html));
  add('hreflang', 'SEO', 'hreflang (мультиязычность)', Boolean($('link[rel="alternate"][hreflang]')));

  // UX / коммерция
  add('viewport', 'UX', 'Viewport (мобильная версия)', Boolean($('meta[name="viewport"]')));
  add('favicon', 'UX', 'Favicon', Boolean($('link[rel*="icon"]')));
  add('search', 'UX', 'Поиск по сайту', Boolean($('input[type="search"]') || $('[class*="search" i] input') || $('form[action*="search" i]')));
  add('phone', 'UX', 'Телефон кликабелен (tel:)', Boolean($('a[href^="tel:"]')));
  add('cart', 'UX', 'Корзина обнаружима', Boolean($('[href*="cart" i]') || $('[class*="cart" i]') || $('[href*="korzina" i]') || $('[href*="basket" i]')));
  add('price', 'UX', 'Цены на странице', /(₴|грн|zł|pln|€|eur|usd|\$)\s?\d|\d\s?(₴|грн|zł)/i.test(text));
  // Соседние проверки этой группы (delivery, contacts, price) смотрят в текст
  // страницы, а эта смотрела в `low` — в сырую разметку, где «rating» и
  // «review» живут в именах классов почти любой темы. Приводим к тексту.
  add('reviews', 'UX', 'Отзывы/рейтинг обнаружимы', /відгук|отзыв|review|рейтинг|rating|оцінк/i.test(text));
  add('delivery', 'UX', 'Доставка/оплата в контенте', /достав|delivery|shipping|оплат|payment/i.test(text));
  add('contacts', 'UX', 'Контакты/адрес', /контакт|contact|адрес|адреса/i.test(text));
  add('social', 'UX', 'Соцсети привязаны', Boolean($('[href*="instagram."]') || $('[href*="facebook."]') || $('[href*="tiktok."]')));

  // Техника
  add('https', 'Техника', 'HTTPS', url.startsWith('https://'));
  add('charset', 'Техника', 'Charset задан', Boolean($('meta[charset]')) || /charset=/i.test(html.slice(0, 2000)));
  const imgs = [...$$('img')];
  const withAlt = imgs.filter((i) => (i.getAttribute('alt') ?? '').trim()).length;
  add('alt', 'Техника', 'ALT у ≥70% изображений', imgs.length === 0 || withAlt / imgs.length >= 0.7, imgs.length ? `${withAlt}/${imgs.length}` : 'нет img');
  add('lazy', 'Техника', 'Lazy-load изображений', imgs.some((i) => i.getAttribute('loading') === 'lazy'));
  add('lang', 'Техника', 'Атрибут lang у html', Boolean(doc.documentElement?.getAttribute('lang') || /<html[^>]+lang=/i.test(html.slice(0, 500))));
  add('analytics', 'Техника', 'Аналитика установлена (GA4/GTM/Pixel)', /gtag|googletagmanager|fbq\(|fbevents|clarity|hotjar/i.test(html));
  add('inline-styles', 'Техника', 'Нет тяжёлых инлайн-стилей (>150)', $$('[style]').length <= 150, `${$$('[style]').length} шт.`);
  // id был `favicon-svg` — остаток копипасты от соседней проверки. По id
  // проверки сопоставляются между прогонами и попадают в отчёт клиента.
  add('preload', 'Техника', 'Preconnect/preload шрифтов или критики', Boolean($('link[rel="preconnect"]') || $('link[rel="preload"]')));
  /*
   * Проверка шла по `low` — по всей разметке вместе со скриптами. Слово
   * «cookie» есть в любом `document.cookie`, в любой аналитике и в половине
   * библиотек, так что провалить её сайт практически не мог: проверка стояла
   * в протоколе и всегда давала ✓. Consent-механика — это видимый баннер и
   * его текст, значит искать надо в тексте страницы либо в явной разметке
   * баннера.
   */
  /*
   * Механика согласия — это ВЫБОР: контейнер про cookie/consent, внутри
   * которого есть чем нажать. Первая версия этой правки принимала за баннер
   * любой `[href*="cookie"]`, то есть обычную ссылку «Политика cookie» в
   * футере — она есть почти у всех, и проверка снова стала почти всегда
   * истинной, только по другой причине. Ссылка на документ согласием не
   * является: у неё нет ни «принять», ни «отклонить».
   */
  const consentBanner = [...$$('[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i]')]
    .find((el) => el.querySelector('button, input[type="button"], input[type="submit"], [role="button"], a[onclick]'));
  add('cookies', 'Техника', 'Cookie/consent-механика (для ЕС)',
    Boolean(consentBanner),
    consentBanner ? 'баннер с выбором' : 'баннера с кнопкой согласия не найдено');
  add('errors-soft', 'Техника', 'Нет текста ошибок в вёрстке', !/fatal error|exception|undefined index|stack trace/i.test(text));

  return out;
}

/**
 * Сколько проверок в протоколе и сколько из них в каждой группе — считаем по
 * самому протоколу, прогнав его на пустом документе. Подписи вроде
 * «провалено N/10 SEO-проверок» брали десятку из головы; стоит добавить
 * проверку в группу — и подпись начинает врать, ничего при этом не ломая.
 */
let protocol: ScreenCheck[] | null = null;
/** Лениво: runChecks требует DOMParser, а модуль импортируется и вне браузера. */
const protocolChecks = () =>
  (protocol ??= runChecks('<!doctype html><html><body></body></html>', 'https://example.com'));

export const checkCount = () => protocolChecks().length;
export const checkCountByGroup = (group: string) =>
  protocolChecks().filter((c) => c.group === group).length;

export async function screenUrl(url: string, kind: ScreenRow['kind']): Promise<ScreenRow> {
  const { html, error } = await fetchHtml(url);
  if (!html) return { url, kind, score: null, checks: [], error };
  const checks = runChecks(html, url);
  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  return { url, kind, score, checks };
}
