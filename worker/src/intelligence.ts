/**
 * Commerce Intelligence Audit: реконструкция бизнеса из сайта — не чек-лист
 * ошибок, а карта «как работает e-commerce клиента, где теряются деньги, где рост».
 * 35+ информационных слоёв в 9 группах; каждый слой — цепочка
 * наблюдаем → дедуцируем → проверить данными → бизнес-вывод → решение,
 * с уровнем доказательности (дедукция всегда помечена).
 * Факт-слой детерминирован из обхода; дедукции обогащает Claude (narrateIntelligence).
 */
import type { AuditDataset } from './report.js';
import type { PageAudit } from './crawl.js';
import { ask, extractJson, hasKey, apiErrorHint } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

export type CIEvidence = 'E0' | 'E1' | 'E2' | 'E3';
export type CIStatus = 'observed' | 'deduced' | 'needs-data';
export type CILayer = {
  id: string; group: string; name: string;
  observed: string;   // что видим на сайте (факт обхода)
  deduced: string;    // что это может означать о бизнесе (гипотеза)
  verify: string;     // чем подтвердить (данные следующего этапа)
  decision: string;   // какое решение это позволяет принять
  evidence: CIEvidence;
  status: CIStatus;
};
export type CIChain = { observed: string; implies: string; verify: string; impact: string; action: string };
export type CIReport = {
  client: string; takenAt: string;
  config: { businessType: string; platform: string; analytics: string; langs: string[]; products: number; categories: number; treeSize: number };
  maturity: { level: 1 | 2 | 3 | 4 | 5; name: string; basis: string; ladder: { level: number; name: string; has: boolean }[] };
  layers: CILayer[];
  chains: CIChain[];
  opportunities: string[];
  verdict: string;
};

const MATURITY_NAMES: Record<number, string> = {
  1: 'Просто інтернет-магазин', 2: 'Оптимізований магазин', 3: 'Системний e-commerce',
  4: 'Масштабована комерц-платформа', 5: 'Автономна комерц-платформа',
};

/* ── Детерминированная экстракция сигналов из обхода ── */
type Signals = ReturnType<typeof extractSignals>;
function extractSignals(ds: AuditDataset) {
  const links = ds.client.links ?? [];
  const path = (h: string) => { try { return new URL(h).pathname.toLowerCase(); } catch { return ''; } };
  const count = (re: RegExp) => links.filter((h) => re.test(path(h))).length;
  const has = (re: RegExp) => links.some((h) => re.test(path(h)));
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const block = (k: string) => pages.some((p) => p.ux?.blocks?.[k]);
  const onKind = (kind: PageAudit['kind'], k: string) => pages.some((p) => p.kind === kind && p.ux?.blocks?.[k]);
  const check = (id: string) => pages.some((p) => p.checks.some((c) => c.id === id && c.pass));
  const langs = ['en', 'ru', 'ua', 'uk', 'pl', 'de'].filter((l) => has(new RegExp(`^/${l}(/|$)`)));
  // Категория = L1-сегмент, содержащий товарные URL (не только слово category в пути).
  const PRODUCT_RE = /product|tovar|\/p\/|goods|item|route=product/;
  const catSet = new Set<string>();
  for (const h of links) {
    const p = path(h);
    const m = p.match(/^\/([^/]+)\/[^/]+/);
    if (m && PRODUCT_RE.test(p)) catSet.add(m[1]);
  }
  // Товары с SEO-URL без ключевых слов: одиночные дефисные слаги в корне
  // (прод-кейс: «~0 товаров» при 755 карточках в корне).
  const SERVICE_RE = /blog|news|article|about|contact|kontakt|delivery|dostavka|payment|oplata|faq|help|terms|privacy|policy|compare|cart|checkout|account|login|search|katalog|catalog|category|collection|shop|korp|horeca|b2b|opt|wishlist/;
  const rootSlugs = links.filter((h) => { const p = path(h); const m = p.match(/^\/([a-z0-9-]{10,})\/?$/i); return Boolean(m && m[1].includes('-') && !SERVICE_RE.test(p)); }).length;
  const kwProducts = count(PRODUCT_RE);
  return {
    treeSize: links.length,
    products: kwProducts >= 20 ? kwProducts : Math.max(kwProducts, rootSlugs >= 20 ? rootSlugs : 0),
    categories: Math.max(count(/category|catalog|collection|katalog/) ? new Set(links.map((h) => { const m = path(h).match(/^\/(?:katalog|catalog|category|collection)s?\/([^/?]+)/); return m?.[1] ?? ''; }).filter(Boolean)).size : 0, catSet.size),
    blogPosts: count(/blog|article|news|stat/),
    hasCart: has(/cart|korzina|basket/) || block('add_to_cart'),
    hasCheckout: pages.some((p) => p.kind === 'checkout') || has(/checkout|oform|order/),
    hasB2B: has(/b2b|opt|wholesale|dealer|horeca|corporate/),
    hasGifts: has(/gift|podar|prezent/),
    hasSale: has(/sale|akci|promo|discount|znizhk/),
    hasFaq: has(/faq|pytannya|voprosy/) || pages.some((p) => p.kind === 'faq'),
    hasAbout: has(/about|o-nas|pro-nas|company/),
    hasDeliveryPage: has(/dostavka|delivery|shipping|payment|oplata/),
    langs,
    multiLang: langs.length > 1 || check('hreflang'),
    reviews: block('reviews'),
    trust: block('trust'),
    filters: block('filters'),
    sort: block('sort'),
    search: block('search'),
    breadcrumbs: block('breadcrumbs'),
    crossSell: block('related'),
    wishlist: block('wishlist'),
    newsletter: block('newsletter'),
    variants: block('variants'),
    specs: block('specifications'),
    guestCheckout: block('guest_checkout'),
    pdpDelivery: onKind('pdp', 'delivery'),
    payment: block('payment'),
    schemaProduct: check('schema-product'),
    analytics: ds.client.tech.analytics.join(', ') || '',
    pixel: ds.client.tech.signals.some((s) => /Pixel/.test(s)),
    behaviour: ds.client.tech.signals.some((s) => /Hotjar|Clarity/.test(s)),
    platform: ds.client.tech.platform ?? 'не визначено',
    sitemap: ds.client.sitemapXml,
    priceVisible: pages.some((p) => p.ux?.priceVisible),
    pagesCrawled: pages.length,
  };
}

function guessBusinessType(s: Signals): string {
  if (s.hasB2B) return 'виробник / бренд із D2C + опт (B2B-розділи на вітрині)';
  if (s.products > 800) return 'ритейлер / реселер із широким асортиментом';
  return 'D2C-магазин (роль виробник/реселер підтвердити на наступному етапі)';
}

function maturity(s: Signals): CIReport['maturity'] {
  const l2 = Boolean(s.analytics) && s.sitemap && (s.reviews || s.filters);
  const l3 = s.newsletter && (s.wishlist || s.hasSale) && s.pixel;
  const l4 = s.multiLang && s.hasB2B;
  let level = (l4 && l3 ? 4 : l3 && l2 ? 3 : l2 ? 2 : 1) as 1 | 2 | 3 | 4;
  // Потолок без машинного слоя: витрина без Schema Product не «масштабируемая
  // платформа», сколько бы языков и механик ни было (прод-кейс: 4/5 при нулевой разметке).
  if (!s.schemaProduct && level > 3) level = 3;
  const basisParts = [
    `аналітика: ${s.analytics || 'немає'}`, `sitemap: ${s.sitemap ? 'так' : 'ні'}`,
    `відгуки: ${s.reviews ? 'так' : 'не видно'}`, `retention-механіки: ${s.newsletter ? 'підписка' : 'не видно'}${s.wishlist ? '+wishlist' : ''}`,
    `мови: ${s.langs.join('/') || 'одна'}`, `B2B: ${s.hasB2B ? 'є' : 'не видно'}`,
  ];
  return {
    level, name: MATURITY_NAMES[level], basis: basisParts.join(' · '),
    ladder: [1, 2, 3, 4, 5].map((l) => ({ level: l, name: MATURITY_NAMES[l], has: l <= level })),
  };
}

const yn = (v: boolean, y = 'є', n = 'не виявлено') => (v ? y : n);

/** 35+ слоёв Commerce Intelligence (9 групп). Факты — из сигналов; дедукции размечены. */
function buildLayers(s: Signals): CILayer[] {
  const L = (id: string, group: string, name: string, observed: string, deduced: string, verify: string, decision: string, evidence: CIEvidence, status: CIStatus): CILayer =>
    ({ id, group, name, observed, deduced, verify, decision, evidence, status });
  return [
    // ── 1 · Бізнес ──
    L('business-model', 'Бізнес', 'Бізнес-модель', `${s.hasB2B ? 'B2C + B2B-розділи' : 'B2C-вітрина'}; кошик ${yn(s.hasCart)}; чекаут ${yn(s.hasCheckout)}`, guessBusinessType(s), 'Інтерв’ю + revenue mix за каналами (наступний етап)', 'Які еталони й домени застосовні до діагностики', 'E2', 'deduced'),
    L('industry', 'Бізнес', 'Галузь і напрям', `Категорій у дереві: ${s.categories}; товарів: ~${s.products}`, 'Ніша й категорійна логіка читаються з дерева каталогу', 'Підтвердити асортиментну стратегію (наступний етап)', 'Вибір галузевих бенчмарків', 'E2', 'observed'),
    L('target-market', 'Бізнес', 'Цільові ринки', `Мовні версії: ${s.langs.join(', ') || 'одна'}; hreflang: ${yn(s.multiLang, 'є')}`, s.multiLang ? 'Мультиринок — є амбіція за межами домашнього ринку' : 'Фокус на домашньому ринку', 'Географія замовлень з аналітики (наступний етап)', 'Пріоритет ринків і локалізації', 'E2', 'observed'),
    L('value-prop', 'Бізнес', 'Ціннісна пропозиція', `Перший екран/оффер: ${yn(s.trust || s.reviews, 'підкріплений довірою', 'без підкріплення довірою')}`, 'Наскільки вітрина відповідає на «чому в нас» — видно з УТП/довіри на вході', 'Інтерв’ю + порівняння з конкурентами', 'Що посилювати в позиціонуванні', 'E1', 'deduced'),
    L('brand', 'Бізнес', 'Бренд і позиціонування', `Сторінка «Про нас»: ${yn(s.hasAbout)}; виробничий контент: див. контент-аудит`, 'Чи відрізняється вітрина від реселера — критично для виробника/D2C', 'Brand-research, впізнаваність (наступний етап)', 'Чи потрібен бренд-шар до редизайну', 'E1', 'deduced'),
    // ── 2 · Клієнт ──
    L('segments', 'Клієнт', 'Сегменти покупців', `Подарункові розділи: ${yn(s.hasGifts)}; B2B: ${yn(s.hasB2B)}`, s.hasGifts ? 'Є gift-аудиторія — другий сценарій покупки' : 'Вітрина будується під одного покупця', 'RFM-сегментація за базою замовлень (наступний етап)', 'Окремі шляхи під сегменти (подарунки/B2B)', 'E2', 'deduced'),
    L('jtbd', 'Клієнт', 'Завдання покупця (JTBD)', `FAQ: ${yn(s.hasFaq)}; фільтри: ${yn(s.filters)}; характеристики: ${yn(s.specs)}`, 'Наскільки вітрина відповідає на питання вибору до покупки', 'Опитування/інтерв’ю + пошукові запити (наступний етап)', 'Які заперечення закривати контентом', 'E2', 'observed'),
    L('trust-req', 'Клієнт', 'Вимоги довіри', `Відгуки: ${yn(s.reviews)}; гарантії/повернення: ${yn(s.trust)}; оплата: ${yn(s.payment)}`, !s.reviews || !s.trust ? 'Точка рішення не підкріплена довірою — тривожність на чекауті' : 'Базова довіра зібрана', 'CR за кроками воронки (наступний етап)', 'Trust-шар у пріоритет доробок', 'E2', 'observed'),
    // ── 3 · Продукт ──
    L('product-arch', 'Продукт', 'Архітектура товару', `Варіанти: ${yn(s.variants)}; характеристики: ${yn(s.specs)}; Schema Product: ${yn(s.schemaProduct)}`, 'Якість товарних даних (атрибутна модель) — з картки', 'Вивантаження каталогу/PIM (наступний етап)', 'Чи потрібен довідник атрибутів', 'E2', 'observed'),
    L('assortment', 'Продукт', 'Асортиментна архітектура', `~${s.products} товарних URL у ${s.categories} категоріях; глибина — див. SEO-дерево`, s.products && s.categories ? `Середня наповненість ~${Math.round(s.products / Math.max(1, s.categories))} SKU/категорію — видно порожні й перевантажені гілки` : 'Асортимент із дерева не читається', 'ABC/XYZ за продажами (наступний етап)', 'Де розширювати/скорочувати асортимент', 'E2', 'observed'),
    L('pricing', 'Продукт', 'Цінова архітектура', `Ціни на вітрині: ${yn(s.priceVisible, 'видно')}; акції/розпродаж: ${yn(s.hasSale)}`, 'Ціновий сегмент, драбина цін, глибина знижок — ззовні лише частково', 'Прайс + ціни конкурентів і каналів (наступний етап)', 'Промо-дисципліна і MAP-політика', 'E1', 'needs-data'),
    L('promotion', 'Продукт', 'Промо-архітектура', `Акційні розділи: ${yn(s.hasSale)}; підписка зі знижкою: ${yn(s.newsletter)}`, s.hasSale ? 'Промо-механіки активні — перевірити узгодженість умов' : 'Промо-шар не видно', 'Історія промо + маржа промо-продажів (наступний етап)', 'Каденс промо і захист маржі', 'E1', 'deduced'),
    L('merchandising', 'Продукт', 'Мерчандайзинг', `Фільтри: ${yn(s.filters)}; сортування: ${yn(s.sort)}; пошук: ${yn(s.search)}`, !s.filters || !s.search ? 'Керування видачею товару обмежене — втрачається вибір' : 'Базовий мерчандайзинг є', 'Внутрішній пошук: запити з нульовою видачею (наступний етап)', 'Колекції, правила сортування, пошук', 'E2', 'observed'),
    // ── 4 · Комерція ──
    L('journey', 'Комерція', 'Customer Journey', `Розібрано сторінок: ${s.pagesCrawled}; чекаут: ${yn(s.hasCheckout, 'знайдено')}`, 'Traffic→Category→PDP→Cart→Checkout: точки тертя за складом блоків', 'Воронка за кроками у GA4 (наступний етап)', 'Карта friction points → CRO-беклог', 'E2', 'observed'),
    L('conversion', 'Комерція', 'Conversion Architecture', `CTA/«у кошик»: ${yn(s.hasCart)}; гостьовий чекаут: ${yn(s.guestCheckout, 'є натяк')}`, 'Сила й розташування CTA, кроки чекауту — детально в UX/UI-аудиті', 'CR чекауту за кроками (наступний етап)', 'Гіпотези втрати конверсії', 'E2', 'observed'),
    L('ux', 'Комерція', 'UX / Usability', 'Посторінково — в UX/UI-аудиті (еталон↔поточна, severity)', 'Де користувач змушений думати — за розривами композиції', 'Записи сесій/теплові карти (наступний етап)', 'Пріоритет доробок за сторінками', 'E2', 'observed'),
    L('monetization', 'Комерція', 'Монетизація замовлення (AOV)', `Cross-sell/схожі: ${yn(s.crossSell)}; набори/комплекти: ${yn(s.hasGifts, 'подарункові є')}`, !s.crossSell ? 'Cross-sell не видно → ймовірно низька монетизація замовлення (attach rate)' : 'Механіки AOV присутні', 'AOV і attach rate із замовлень (наступний етап)', 'Рекомендації/бандли на PDP і в кошику', 'E2', 'deduced'),
    // ── 5 · Маркетинг ──
    L('acquisition', 'Маркетинг', 'Канали залучення', `Трекінг: ${s.analytics || 'немає'}; Pixel: ${yn(s.pixel)}`, 'Під які канали сайт побудований — за трекінгом і посадковими', 'Витрати/ROAS із кабінетів (наступний етап)', 'Мікс каналів і бюджет', 'E2', 'observed'),
    L('seo', 'Маркетинг', 'SEO Architecture', `Дерево: ${s.treeSize} URL; sitemap: ${yn(s.sitemap)}`, 'Growth space органіки — в SEO Architecture', 'Search Console: запити/позиції (наступний етап)', 'SEO-пріоритети за вузлами', 'E2', 'observed'),
    L('content', 'Маркетинг', 'Content Architecture', `Блог/статті: ~${s.blogPosts}; FAQ: ${yn(s.hasFaq)}`, s.blogPosts < 3 ? 'Контент-хаб не розвинений — органіку та AEO недовикористано' : 'Контентний шар є — перевірити зв’язок із каталогом', 'Трафік і конверсія контенту (наступний етап)', 'Контент-стратегія під попит', 'E2', 'observed'),
    L('campaign-ready', 'Маркетинг', 'Готовність до performance', `Посадкові під кампанії: не видно ззовні; події: ${yn(Boolean(s.analytics), 'трекінг є')}`, 'Чи готовий сайт приймати платний трафік (посадкові, події, швидкість)', 'Події в GA4/Ads + campaign-структура (наступний етап)', 'Що лагодити до масштабування платного трафіку', 'E1', 'needs-data'),
    // ── 6 · Технології ──
    L('platform', 'Технології', 'Платформа і стек', `${s.platform}`, 'Обмеження/можливості платформи для роадмапу', 'Доступ до адмінки/підрядника (наступний етап)', 'Змінюємо платформу чи розвиваємо поточну', 'E3', 'observed'),
    L('tracking', 'Технології', 'Analytics & Data', `${s.analytics || 'аналітику не виявлено'}; поведінкова: ${yn(s.behaviour)}`, !s.analytics ? 'Бізнес не керується даними — усі рішення наосліп' : 'Базовий трекінг є — якість подій перевірити', 'Аудит подій/dataLayer (наступний етап)', 'План вимірювань (measurement plan)', 'E3', 'observed'),
    L('integrations', 'Технології', 'Інтеграції та екосистема', 'CRM/ERP/фіди ззовні не видно', 'Рівень автоматизації — за швидкістю і якістю операцій', 'Карта систем від клієнта (наступний етап)', 'Що інтегрувати в першу хвилю', 'E0', 'needs-data'),
    // ── 7 · Операції ──
    L('fulfillment', 'Операції', 'Доставка і фулфілмент', `Сторінка доставки: ${yn(s.hasDeliveryPage)}; на картці: ${yn(s.pdpDelivery)}`, 'Модель доставки й обіцянка строку — з вітрини', 'SLA збирання/доставки із систем (наступний етап)', 'Обіцянка доставки як конкурентна перевага', 'E2', 'observed'),
    L('payments', 'Операції', 'Оплата', `Платіжні сигнали: ${yn(s.payment)}`, 'Набір способів оплати проти норми ринку', 'Частка відмов за способами оплати (наступний етап)', 'Додати відсутні способи', 'E2', 'observed'),
    L('service', 'Операції', 'Сервіс і підтримка', `FAQ: ${yn(s.hasFaq)}; контакти/канали: див. обхід`, 'Готовність знімати питання до і після покупки', 'SLA підтримки, топ звернень (наступний етап)', 'FAQ із реальних звернень, чат', 'E1', 'deduced'),
    // ── 8 · Розширення ──
    L('marketplace', 'Розширення', 'Маркетплейси', 'Власна присутність на майданчиках ззовні сайту не видно', 'Ризик: товар можуть продавати треті особи без контролю бренду і ціни', 'Пошук бренду на Rozetka/Prom/Amazon (наступний етап — зовнішня перевірка)', 'Стратегія присутності й контроль ціни в каналі', 'E1', 'needs-data'),
    L('international', 'Розширення', 'Інтернаціоналізація', `Мови: ${s.langs.join(', ') || 'одна'}; hreflang: ${yn(s.multiLang)}`, s.multiLang ? 'Багатомовність є — перевірити повноту локалізації' : 'Міжнародний шар не розпочато', 'Продажі за країнами (наступний етап)', 'Який ринок наступний і що для нього потрібно', 'E2', 'observed'),
    L('b2b', 'Розширення', 'B2B / опт', `B2B-розділи: ${yn(s.hasB2B)}`, s.hasB2B ? 'Оптовий канал заявлено — оцінити його частку й умови' : 'B2B-потенціал не оформлено на вітрині', 'Частка B2B у виручці, умови (наступний етап)', 'B2B-портал/прайс/умови', 'E2', 'observed'),
    L('retention', 'Розширення', 'Retention / CRM', `Підписка: ${yn(s.newsletter)}; wishlist: ${yn(s.wishlist)}; особистий кабінет: не видно ззовні`, !s.newsletter ? 'Побудовано лише механізм першої покупки — LTV не використовується' : 'Захоплення контакту є — перевірити welcome/тригери', 'Частка повторних, виручка email/SMS (наступний етап)', 'Retention-контур: тригери, сегменти, лояльність', 'E2', 'deduced'),
    L('loyalty', 'Розширення', 'Лояльність / реферали', 'Програму лояльності/рефералів ззовні не видно', 'Пласт утримання ймовірно не задіяно', 'CRM/ESP механіки (наступний етап)', 'Лояльність після налагодження retention-бази', 'E1', 'needs-data'),
    // ── 9 · Підсумок ──
    L('competitive', 'Підсумок', 'Конкурентна позиція', 'Детально — у Конкурентному аналізі (якщо задані конкуренти)', 'Де ведемо/відстаємо за зовнішнім індексом', 'Бенчмарк за параметрами (наступний етап)', 'Де обганяти, де не витрачати ресурси', 'E2', 'observed'),
    L('scalability', 'Підсумок', 'Масштабованість', `Платформа: ${s.platform}; дерево: ${s.treeSize} URL`, 'Чи витримає поточна архітектура зростання ×3–×10', 'Навантажувальна й організаційна оцінка (наступний етап)', 'Що лагодити до масштабування трафіку', 'E1', 'deduced'),
    L('risks', 'Підсумок', 'Ризики і залежності', 'Ключові ризики збираються з усіх шарів (право, платформа, канали)', 'Залежність від окремих SKU/каналів/підрядників', 'Карта ризиків із власниками (наступний етап)', 'Червона зона блокує напрями до заходів', 'E1', 'deduced'),
    L('growth', 'Підсумок', 'Точки зростання', 'Синтез усіх шарів — див. ланцюжки дедукції нижче', 'Де найкоротший шлях до грошей', 'Підтвердження даними (наступний етап)', 'Scope програми за хвилями', 'E2', 'deduced'),
  ];
}

/** Цепочки дедукции: наблюдение → возможная проблема → проверить → impact → действие. */
function buildChains(s: Signals): CIChain[] {
  const chains: CIChain[] = [];
  if (!s.crossSell) chains.push({ observed: 'На картці товару немає cross-sell/схожих', implies: 'Низька монетизація замовлення — замовлення з однієї позиції', verify: 'AOV і attach rate із вивантаження замовлень', impact: 'Потенціал +10–25% до AOV (перевірити даними)', action: 'Рекомендації/бандли на PDP і в кошику' });
  if (!s.reviews || !s.trust) chains.push({ observed: 'Точка рішення без відгуків/гарантій', implies: 'Тривожність на картці й чекауті, падає оплата', verify: 'CR картка→кошик→оплата за кроками (GA4)', impact: 'Двозначний відсоток конверсії (перевірити)', action: 'Trust-шар: відгуки, гарантії, повернення — у точці рішення' });
  if (!s.newsletter) chains.push({ observed: 'Немає захоплення контакту й retention-механік', implies: 'Використовується лише перша покупка, LTV не працює', verify: 'Частка повторних покупок за 12 міс (замовлення/CRM)', impact: 'Повторні — найдешевший оборот (перевірити частку)', action: 'Welcome-ланцюжок, покинутий кошик, сегменти' });
  if (s.categories > 0 && s.products / Math.max(1, s.categories) < 5) chains.push({ observed: `Глибоке дерево (${s.categories} категорій) за малої наповненості`, implies: 'Проблема information architecture — попит розмазаний по порожніх гілках', verify: 'CR категорій і внутрішній пошук (наступний етап)', impact: 'Втрачений попит у слабких категоріях', action: 'Перезібрати таксономію + фасети + мерчандайзинг' });
  if (!s.analytics) chains.push({ observed: 'Аналітику не виявлено', implies: 'Рішення приймаються наосліп, ефекти не вимірні', verify: '—', impact: 'Блокер для всієї програми зростання', action: 'GA4 + план вимірювань до будь-яких CRO-робіт' });
  if (!s.schemaProduct) chains.push({ observed: 'Картки без Schema Product/Offer', implies: 'Немає ціни/наявності у видачі — нижчий CTR із пошуку', verify: 'CTR карток у Search Console (наступний етап)', impact: 'Недоотриманий органічний трафік', action: 'Product+Offer+AggregateRating на шаблоні PDP' });
  chains.push({ observed: 'Бренд/товари можуть продаватися третіми особами на маркетплейсах', implies: 'Втрата контролю ціни й клієнтського досвіду в каналі', verify: 'Пошук бренду на Rozetka/Prom (зовнішня перевірка, наступний етап)', impact: 'Цінова ерозія і перехоплення попиту', action: 'Власна присутність або дилерська політика + MAP' });
  return chains.slice(0, 7);
}

export function buildIntelligence(ds: AuditDataset): CIReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const s = extractSignals(ds);
  const m = maturity(s);
  const layers = buildLayers(s);
  const chains = buildChains(s);
  const opportunities = chains.map((c) => c.action);
  const verdict = `${m.name} (рівень ${m.level}/5): ${m.level <= 2 ? 'працює механіка першої покупки; системні шари (retention, дані, масштабування) не побудовані' : 'системні механіки частково є — рости за рахунок даних і каналів'}.`;
  return {
    client, takenAt: ds.takenAt,
    config: { businessType: guessBusinessType(s), platform: s.platform, analytics: s.analytics || 'не виявлено', langs: s.langs, products: s.products, categories: s.categories, treeSize: s.treeSize },
    maturity: m, layers, chains, opportunities, verdict,
  };
}

/* ── Обогащение Claude: уточняет дедукции и вердикт по фактам обхода ── */
const CI_SYSTEM = `Ти — експерт з e-commerce. За фактами зовнішнього обходу уточни Commerce Intelligence: дедукції про бізнес, вердикт і ланцюжки. Правила: тільки за фактами, дедукція ≠ факт (формулюй як гіпотезу з перевіркою), гроші не рахуй без даних. Відповідай природною УКРАЇНСЬКОЮ мовою. Поверни СТРОГО JSON:
{"verdict":"1-2 речення про бізнес і його зрілість","layerNotes":[{"id":"<id шару>","deduced":"уточнена дедукція","decision":"уточнене рішення"}],"chains":[{"observed":"","implies":"","verify":"","impact":"","action":""}]}
layerNotes — лише для шарів, де є що уточнити (5-12 шт). chains — 2-4 ДОДАТКОВІ ланцюжки, що не повторюють наявні дані.`;

export async function narrateIntelligence(ds: AuditDataset, ci: CIReport, log?: (m: string) => void): Promise<void> {
  if (!hasKey()) return;
  try {
    const facts = ci.layers.map((l) => `[${l.id}] ${l.name}: ${l.observed}`).join('\n');
    const user = `Клієнт: ${ci.client}. Конфігурація: ${ci.config.businessType}; платформа ${ci.config.platform}; дерево ${ci.config.treeSize} URL; товарів ~${ci.config.products}; категорій ${ci.config.categories}; мови ${ci.config.langs.join('/') || 'одна'}.\n\nФАКТИ ЗА ШАРАМИ:\n${facts}\n\nНаявні ланцюжки: ${ci.chains.map((c) => c.observed).join('; ')}\n\nПоверни JSON.`;
    const text = await ask(CI_SYSTEM + (await knowledgeFor('analyze')), user, 6000);
    const n = extractJson<{ verdict?: string; layerNotes?: { id: string; deduced?: string; decision?: string }[]; chains?: CIChain[] }>(text);
    if (n.verdict) ci.verdict = n.verdict;
    for (const note of n.layerNotes ?? []) {
      const l = ci.layers.find((x) => x.id === note.id);
      if (l) { if (note.deduced) l.deduced = note.deduced; if (note.decision) l.decision = note.decision; }
    }
    if (Array.isArray(n.chains)) ci.chains.push(...n.chains.filter((c) => c && c.observed && c.action).slice(0, 4));
  } catch (e) { log?.(`⚠️ CI-дедукции Claude не отработали (${String(e).slice(0, 100)})${apiErrorHint(e)} — детерминированный слой сохранён`); }
}
