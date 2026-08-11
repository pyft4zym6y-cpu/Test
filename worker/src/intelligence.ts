/**
 * Commerce Intelligence Audit (A0): реконструкция бизнеса из сайта — не чек-лист
 * ошибок, а карта «как работает e-commerce клиента, где теряются деньги, где рост».
 * 35+ информационных слоёв в 9 группах; каждый слой — цепочка
 * наблюдаем → дедуцируем → проверить данными → бизнес-вывод → решение,
 * с уровнем доказательности (на L0 потолок E3, дедукция всегда помечена).
 * Факт-слой детерминирован из обхода; дедукции обогащает Claude (narrateIntelligence).
 */
import type { AuditDataset } from './report.js';
import type { PageAudit } from './crawl.js';
import { ask, extractJson, hasKey } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

export type CIEvidence = 'E0' | 'E1' | 'E2' | 'E3';
export type CIStatus = 'observed' | 'deduced' | 'needs-data';
export type CILayer = {
  id: string; group: string; name: string;
  observed: string;   // что видим на сайте (факт обхода)
  deduced: string;    // что это может означать о бизнесе (гипотеза)
  verify: string;     // чем подтвердить (данные A1/A2)
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
  1: 'Просто интернет-магазин', 2: 'Оптимизированный магазин', 3: 'Системный e-commerce',
  4: 'Масштабируемая Commerce-платформа', 5: 'Commerce OS',
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
  return {
    treeSize: links.length,
    products: count(PRODUCT_RE),
    categories: Math.max(count(/category|catalog|collection|katalog/), catSet.size),
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
    platform: ds.client.tech.platform ?? 'не определена',
    sitemap: ds.client.sitemapXml,
    priceVisible: pages.some((p) => p.ux?.priceVisible),
    pagesCrawled: pages.length,
  };
}

function guessBusinessType(s: Signals): string {
  if (s.hasB2B) return 'производитель / бренд с D2C + опт (B2B-разделы на витрине)';
  if (s.products > 800) return 'ритейлер / реселлер с широким ассортиментом';
  return 'D2C-магазин (роль производитель/реселлер подтвердить на A1)';
}

function maturity(s: Signals): CIReport['maturity'] {
  const l2 = Boolean(s.analytics) && s.sitemap && (s.reviews || s.filters);
  const l3 = s.newsletter && (s.wishlist || s.hasSale) && s.pixel;
  const l4 = s.multiLang && s.hasB2B;
  const level = (l4 && l3 ? 4 : l3 && l2 ? 3 : l2 ? 2 : 1) as 1 | 2 | 3 | 4;
  const basisParts = [
    `аналитика: ${s.analytics || 'нет'}`, `sitemap: ${s.sitemap ? 'да' : 'нет'}`,
    `отзывы: ${s.reviews ? 'да' : 'не видно'}`, `retention-механики: ${s.newsletter ? 'подписка' : 'не видно'}${s.wishlist ? '+wishlist' : ''}`,
    `языки: ${s.langs.join('/') || 'один'}`, `B2B: ${s.hasB2B ? 'есть' : 'не видно'}`,
  ];
  return {
    level, name: MATURITY_NAMES[level], basis: basisParts.join(' · '),
    ladder: [1, 2, 3, 4, 5].map((l) => ({ level: l, name: MATURITY_NAMES[l], has: l <= level })),
  };
}

const yn = (v: boolean, y = 'есть', n = 'не обнаружено') => (v ? y : n);

/** 35+ слоёв Commerce Intelligence (9 групп). Факты — из сигналов; дедукции размечены. */
function buildLayers(s: Signals): CILayer[] {
  const L = (id: string, group: string, name: string, observed: string, deduced: string, verify: string, decision: string, evidence: CIEvidence, status: CIStatus): CILayer =>
    ({ id, group, name, observed, deduced, verify, decision, evidence, status });
  return [
    // ── 1 · Бизнес ──
    L('business-model', 'Бизнес', 'Бизнес-модель', `${s.hasB2B ? 'B2C + B2B-разделы' : 'B2C-витрина'}; корзина ${yn(s.hasCart)}; чекаут ${yn(s.hasCheckout)}`, guessBusinessType(s), 'Интервью + revenue mix по каналам (A1)', 'Какие эталоны и домены применимы к диагностике', 'E2', 'deduced'),
    L('industry', 'Бизнес', 'Отрасль и направление', `Категорий в дереве: ${s.categories}; товаров: ~${s.products}`, 'Ниша и категорийная логика читаются из дерева каталога', 'Подтвердить ассортиментную стратегию (A1)', 'Выбор отраслевых бенчмарков', 'E2', 'observed'),
    L('target-market', 'Бизнес', 'Целевые рынки', `Языковые версии: ${s.langs.join(', ') || 'одна'}; hreflang: ${yn(s.multiLang, 'есть')}`, s.multiLang ? 'Мультирынок — есть амбиция за пределами домашнего рынка' : 'Фокус на домашнем рынке', 'География заказов из аналитики (A2)', 'Приоритет рынков и локализации', 'E2', 'observed'),
    L('value-prop', 'Бизнес', 'Ценностное предложение', `Первый экран/оффер: ${yn(s.trust || s.reviews, 'подкреплён доверием', 'без подкрепления доверием')}`, 'Насколько витрина отвечает «почему у нас» — видно по УТП/доверию на входе', 'Интервью + сравнение с конкурентами', 'Что усиливать в позиционировании', 'E1', 'deduced'),
    L('brand', 'Бизнес', 'Бренд и позиционирование', `Страница «О нас»: ${yn(s.hasAbout)}; производственный контент: см. контент-аудит`, 'Отличима ли витрина от реселлера — критично для производителя/D2C', 'Brand-research, узнаваемость (A1)', 'Нужен ли бренд-слой до редизайна', 'E1', 'deduced'),
    // ── 2 · Клиент ──
    L('segments', 'Клиент', 'Сегменты покупателей', `Подарочные разделы: ${yn(s.hasGifts)}; B2B: ${yn(s.hasB2B)}`, s.hasGifts ? 'Есть gift-аудитория — второй сценарий покупки' : 'Витрина строится под одного покупателя', 'RFM-сегментация по базе заказов (A2)', 'Отдельные пути под сегменты (подарки/B2B)', 'E2', 'deduced'),
    L('jtbd', 'Клиент', 'Задачи покупателя (JTBD)', `FAQ: ${yn(s.hasFaq)}; фильтры: ${yn(s.filters)}; характеристики: ${yn(s.specs)}`, 'Насколько витрина отвечает на вопросы выбора до покупки', 'Опрос/интервью + поисковые запросы (A1)', 'Какие возражения закрывать контентом', 'E2', 'observed'),
    L('trust-req', 'Клиент', 'Требования доверия', `Отзывы: ${yn(s.reviews)}; гарантии/возврат: ${yn(s.trust)}; оплата: ${yn(s.payment)}`, !s.reviews || !s.trust ? 'Точка решения не подкреплена доверием — тревожность на чекауте' : 'Базовое доверие собрано', 'CR по шагам воронки (A2)', 'Trust-слой в приоритет доработок', 'E2', 'observed'),
    // ── 3 · Продукт ──
    L('product-arch', 'Продукт', 'Архитектура товара', `Варианты: ${yn(s.variants)}; характеристики: ${yn(s.specs)}; Schema Product: ${yn(s.schemaProduct)}`, 'Качество товарных данных (атрибутная модель) — из карточки', 'Выгрузка каталога/PIM (A1)', 'Нужен ли справочник атрибутов', 'E2', 'observed'),
    L('assortment', 'Продукт', 'Ассортиментная архитектура', `~${s.products} товарных URL в ${s.categories} категориях; глубина — см. SEO-дерево`, s.products && s.categories ? `Средняя наполненность ~${Math.round(s.products / Math.max(1, s.categories))} SKU/категорию — видно пустые и перегруженные ветки` : 'Ассортимент из дерева не читается', 'ABC/XYZ по продажам (A2)', 'Где расширять/сокращать ассортимент', 'E2', 'observed'),
    L('pricing', 'Продукт', 'Ценовая архитектура', `Цены на витрине: ${yn(s.priceVisible, 'видны')}; акции/распродажа: ${yn(s.hasSale)}`, 'Ценовой сегмент, лестница цен, глубина скидок — снаружи только частично', 'Прайс + цены конкурентов и каналов (A1)', 'Промо-дисциплина и MAP-политика', 'E1', 'needs-data'),
    L('promotion', 'Продукт', 'Промо-архитектура', `Акционные разделы: ${yn(s.hasSale)}; подписка со скидкой: ${yn(s.newsletter)}`, s.hasSale ? 'Промо-механики активны — проверить согласованность условий' : 'Промо-слой не виден', 'История промо + маржа промо-продаж (A2)', 'Каденс промо и защита маржи', 'E1', 'deduced'),
    L('merchandising', 'Продукт', 'Мерчандайзинг', `Фильтры: ${yn(s.filters)}; сортировка: ${yn(s.sort)}; поиск: ${yn(s.search)}`, !s.filters || !s.search ? 'Управление выдачей товара ограничено — теряется выбор' : 'Базовый мерчандайзинг есть', 'Внутренний поиск: запросы с нулевой выдачей (A2)', 'Коллекции, правила сортировки, поиск', 'E2', 'observed'),
    // ── 4 · Коммерция ──
    L('journey', 'Коммерция', 'Customer Journey', `Разобрано страниц: ${s.pagesCrawled}; чекаут: ${yn(s.hasCheckout, 'найден')}`, 'Traffic→Category→PDP→Cart→Checkout: точки трения по составу блоков', 'Воронка по шагам в GA4 (A2)', 'Карта friction points → CRO-бэклог', 'E2', 'observed'),
    L('conversion', 'Коммерция', 'Conversion Architecture', `CTA/«в корзину»: ${yn(s.hasCart)}; гостевой чекаут: ${yn(s.guestCheckout, 'намёк есть')}`, 'Сила и расположение CTA, шаги чекаута — детально в UX/UI-аудите', 'CR чекаута по шагам (A2)', 'Гипотезы потери конверсии', 'E2', 'observed'),
    L('ux', 'Коммерция', 'UX / Usability', 'Постранично — в UX/UI Audit A0 (эталон↔текущая, severity)', 'Где пользователь вынужден думать — по разрывам композиции', 'Записи сессий/тепловые карты (A2)', 'Приоритет доработок по страницам', 'E2', 'observed'),
    L('monetization', 'Коммерция', 'Монетизация заказа (AOV)', `Cross-sell/похожие: ${yn(s.crossSell)}; наборы/комплекты: ${yn(s.hasGifts, 'подарочные есть')}`, !s.crossSell ? 'Cross-sell не виден → вероятно низкая монетизация заказа (attach rate)' : 'Механики AOV присутствуют', 'AOV и attach rate из заказов (A2)', 'Рекомендации/бандлы на PDP и в корзине', 'E2', 'deduced'),
    // ── 5 · Маркетинг ──
    L('acquisition', 'Маркетинг', 'Каналы привлечения', `Трекинг: ${s.analytics || 'нет'}; Pixel: ${yn(s.pixel)}`, 'Под какие каналы сайт построен — по трекингу и посадочным', 'Расходы/ROAS из кабинетов (A2)', 'Микс каналов и бюджет', 'E2', 'observed'),
    L('seo', 'Маркетинг', 'SEO Architecture', `Дерево: ${s.treeSize} URL; sitemap: ${yn(s.sitemap)}`, 'Growth space органики — в SEO Architecture A0', 'Search Console: запросы/позиции (A1)', 'SEO-приоритеты по узлам', 'E2', 'observed'),
    L('content', 'Маркетинг', 'Content Architecture', `Блог/статьи: ~${s.blogPosts}; FAQ: ${yn(s.hasFaq)}`, s.blogPosts < 3 ? 'Контент-хаб не развит — органика и AEO недоиспользованы' : 'Контентный слой есть — проверить связь с каталогом', 'Трафик и конверсия контента (A2)', 'Контент-стратегия под спрос', 'E2', 'observed'),
    L('campaign-ready', 'Маркетинг', 'Готовность к performance', `Посадочные под кампании: не видны снаружи; события: ${yn(Boolean(s.analytics), 'трекинг есть')}`, 'Готов ли сайт принимать платный трафик (посадочные, события, скорость)', 'События в GA4/Ads + campaign-структура (A2)', 'Что чинить до масштабирования платки', 'E1', 'needs-data'),
    // ── 6 · Технологии ──
    L('platform', 'Технологии', 'Платформа и стек', `${s.platform}`, 'Ограничения/возможности платформы для роадмапа', 'Доступ к админке/подрядчику (A1)', 'Меняем платформу или развиваем текущую', 'E3', 'observed'),
    L('tracking', 'Технологии', 'Analytics & Data', `${s.analytics || 'аналитика не обнаружена'}; поведенческая: ${yn(s.behaviour)}`, !s.analytics ? 'Бизнес не управляется данными — все решения вслепую' : 'Базовый трекинг есть — качество событий проверить', 'Аудит событий/dataLayer (A2)', 'План измерений (measurement plan)', 'E3', 'observed'),
    L('integrations', 'Технологии', 'Интеграции и экосистема', 'CRM/ERP/фиды снаружи не видны', 'Уровень автоматизации — по скорости и качеству операций', 'Карта систем от клиента (A1)', 'Что интегрировать в первую волну', 'E0', 'needs-data'),
    // ── 7 · Операции ──
    L('fulfillment', 'Операции', 'Доставка и фулфилмент', `Страница доставки: ${yn(s.hasDeliveryPage)}; на карточке: ${yn(s.pdpDelivery)}`, 'Модель доставки и обещание срока — из витрины', 'SLA сборки/доставки из систем (A2)', 'Обещание доставки как конкурентное преимущество', 'E2', 'observed'),
    L('payments', 'Операции', 'Оплата', `Платёжные сигналы: ${yn(s.payment)}`, 'Набор способов оплаты против нормы рынка', 'Доля отказов по способам оплаты (A2)', 'Добавить недостающие способы', 'E2', 'observed'),
    L('service', 'Операции', 'Сервис и поддержка', `FAQ: ${yn(s.hasFaq)}; контакты/каналы: см. обход`, 'Готовность снимать вопросы до и после покупки', 'SLA поддержки, топ обращений (A2)', 'FAQ из реальных обращений, чат', 'E1', 'deduced'),
    // ── 8 · Расширение ──
    L('marketplace', 'Расширение', 'Маркетплейсы', 'Собственное присутствие на площадках снаружи сайта не видно', 'Риск: товар могут продавать третьи лица без контроля бренда и цены', 'Поиск бренда на Rozetka/Prom/Amazon (A1 — внешний)', 'Стратегия присутствия и контроль цены в канале', 'E1', 'needs-data'),
    L('international', 'Расширение', 'Интернационализация', `Языки: ${s.langs.join(', ') || 'один'}; hreflang: ${yn(s.multiLang)}`, s.multiLang ? 'Мультиязычность есть — проверить полноту локализации' : 'Международный слой не начат', 'Продажи по странам (A2)', 'Какой рынок следующий и что для него нужно', 'E2', 'observed'),
    L('b2b', 'Расширение', 'B2B / опт', `B2B-разделы: ${yn(s.hasB2B)}`, s.hasB2B ? 'Оптовый канал заявлен — оценить его долю и условия' : 'B2B-потенциал не оформлен на витрине', 'Доля B2B в выручке, условия (A1)', 'B2B-портал/прайс/условия', 'E2', 'observed'),
    L('retention', 'Расширение', 'Retention / CRM', `Подписка: ${yn(s.newsletter)}; wishlist: ${yn(s.wishlist)}; ЛК: не виден снаружи`, !s.newsletter ? 'Построен только механизм первой покупки — LTV не используется' : 'Захват контакта есть — проверить welcome/триггеры', 'Доля повторных, выручка email/SMS (A2)', 'Retention-контур: триггеры, сегменты, лояльность', 'E2', 'deduced'),
    L('loyalty', 'Расширение', 'Лояльность / рефералы', 'Программа лояльности/рефералов снаружи не видна', 'Пласт удержания вероятно не задействован', 'CRM/ESP механики (A2)', 'Лояльность после налаживания retention-базы', 'E1', 'needs-data'),
    // ── 9 · Итог ──
    L('competitive', 'Итог', 'Конкурентная позиция', 'Детально — в Конкурентном анализе A0 (если заданы конкуренты)', 'Где ведём/отстаём по внешнему индексу', 'Бенчмарк по параметрам (T2+)', 'Где обгонять, где не тратить ресурсы', 'E2', 'observed'),
    L('scalability', 'Итог', 'Масштабируемость', `Платформа: ${s.platform}; дерево: ${s.treeSize} URL`, 'Выдержит ли текущая архитектура рост ×3–×10', 'Нагрузочная и организационная оценка (A1)', 'Что чинить до масштабирования трафика', 'E1', 'deduced'),
    L('risks', 'Итог', 'Риски и зависимости', 'Ключевые риски собираются из всех слоёв (право, платформа, каналы)', 'Зависимость от отдельных SKU/каналов/подрядчиков', 'Карта рисков с владельцами (A1)', 'Красная зона блокирует направления до мер', 'E1', 'deduced'),
    L('growth', 'Итог', 'Точки роста', 'Синтез всех слоёв — см. цепочки дедукции ниже', 'Где самый короткий путь к деньгам', 'Подтверждение данными (A1–A2)', 'Scope программы по волнам', 'E2', 'deduced'),
  ];
}

/** Цепочки дедукции: наблюдение → возможная проблема → проверить → impact → действие. */
function buildChains(s: Signals): CIChain[] {
  const chains: CIChain[] = [];
  if (!s.crossSell) chains.push({ observed: 'На карточке товара нет cross-sell/похожих', implies: 'Низкая монетизация заказа — заказ из одной позиции', verify: 'AOV и attach rate из выгрузки заказов', impact: 'Потенциал +10–25% к AOV (проверить данными)', action: 'Рекомендации/бандлы на PDP и в корзине' });
  if (!s.reviews || !s.trust) chains.push({ observed: 'Точка решения без отзывов/гарантий', implies: 'Тревожность на карточке и чекауте, падает оплата', verify: 'CR карточка→корзина→оплата по шагам (GA4)', impact: 'Двузначный процент конверсии (проверить)', action: 'Trust-слой: отзывы, гарантии, возврат — в точке решения' });
  if (!s.newsletter) chains.push({ observed: 'Нет захвата контакта и retention-механик', implies: 'Используется только первая покупка, LTV не работает', verify: 'Доля повторных покупок за 12 мес (заказы/CRM)', impact: 'Повторные — самый дешёвый оборот (проверить долю)', action: 'Welcome-цепочка, брошенная корзина, сегменты' });
  if (s.categories > 0 && s.products / Math.max(1, s.categories) < 5) chains.push({ observed: `Глубокое дерево (${s.categories} категорий) при малой наполненности`, implies: 'Проблема information architecture — спрос размазан по пустым веткам', verify: 'CR категорий и внутренний поиск (A2)', impact: 'Потерянный спрос в слабых категориях', action: 'Пересобрать таксономию + фасеты + мерчандайзинг' });
  if (!s.analytics) chains.push({ observed: 'Аналитика не обнаружена', implies: 'Решения принимаются вслепую, эффекты не измеримы', verify: '—', impact: 'Блокер для всей программы роста', action: 'GA4 + план измерений до любых CRO-работ' });
  if (!s.schemaProduct) chains.push({ observed: 'Карточки без Schema Product/Offer', implies: 'Нет цены/наличия в выдаче — ниже CTR из поиска', verify: 'CTR карточек в Search Console (A1)', impact: 'Недополученный органический трафик', action: 'Product+Offer+AggregateRating на шаблоне PDP' });
  chains.push({ observed: 'Бренд/товары могут продаваться третьими лицами на маркетплейсах', implies: 'Потеря контроля цены и клиентского опыта в канале', verify: 'Поиск бренда на Rozetka/Prom (внешняя проверка A1)', impact: 'Ценовая эрозия и перехват спроса', action: 'Собственное присутствие или дилерская политика + MAP' });
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
  const verdict = `${m.name} (уровень ${m.level}/5): ${m.level <= 2 ? 'работает механика первой покупки; системные слои (retention, данные, масштабирование) не построены' : 'системные механики частично есть — расти за счёт данных и каналов'}.`;
  return {
    client, takenAt: ds.takenAt,
    config: { businessType: guessBusinessType(s), platform: s.platform, analytics: s.analytics || 'не обнаружена', langs: s.langs, products: s.products, categories: s.categories, treeSize: s.treeSize },
    maturity: m, layers, chains, opportunities, verdict,
  };
}

/* ── Обогащение Claude: уточняет дедукции и вердикт по фактам обхода ── */
const CI_SYSTEM = `Ты — эксперт Commerce OS. По фактам внешнего обхода уточни Commerce Intelligence: дедукции о бизнесе, вердикт и цепочки. Правила: только по фактам, дедукция ≠ факт (формулируй как гипотезу с проверкой), деньги не считай без данных. Верни СТРОГО JSON:
{"verdict":"1-2 предложения о бизнесе и его зрелости","layerNotes":[{"id":"<id слоя>","deduced":"уточнённая дедукция","decision":"уточнённое решение"}],"chains":[{"observed":"","implies":"","verify":"","impact":"","action":""}]}
layerNotes — только для слоёв, где есть что уточнить (5-12 шт). chains — 2-4 ДОПОЛНИТЕЛЬНЫЕ цепочки, не повторяющие данные.`;

export async function narrateIntelligence(ds: AuditDataset, ci: CIReport): Promise<void> {
  if (!hasKey()) return;
  try {
    const facts = ci.layers.map((l) => `[${l.id}] ${l.name}: ${l.observed}`).join('\n');
    const user = `Клиент: ${ci.client}. Конфигурация: ${ci.config.businessType}; платформа ${ci.config.platform}; дерево ${ci.config.treeSize} URL; товаров ~${ci.config.products}; категорий ${ci.config.categories}; языки ${ci.config.langs.join('/') || 'один'}.\n\nФАКТЫ ПО СЛОЯМ:\n${facts}\n\nСуществующие цепочки: ${ci.chains.map((c) => c.observed).join('; ')}\n\nВерни JSON.`;
    const text = await ask(CI_SYSTEM + (await knowledgeFor('analyze')), user, 6000);
    const n = extractJson<{ verdict?: string; layerNotes?: { id: string; deduced?: string; decision?: string }[]; chains?: CIChain[] }>(text);
    if (n.verdict) ci.verdict = n.verdict;
    for (const note of n.layerNotes ?? []) {
      const l = ci.layers.find((x) => x.id === note.id);
      if (l) { if (note.deduced) l.deduced = note.deduced; if (note.decision) l.decision = note.decision; }
    }
    if (Array.isArray(n.chains)) ci.chains.push(...n.chains.filter((c) => c && c.observed && c.action).slice(0, 4));
  } catch { /* нарратив опционален */ }
}
