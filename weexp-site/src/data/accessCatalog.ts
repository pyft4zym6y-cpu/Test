/**
 * Каталог доступів клієнта для аудиту — категоріями, як у робочому workspace:
 * Аналітика / SEO / Реклама / CMS & Website / CRM & Retention / ERP / Operations.
 * Маркетплейси та файли (звітність, вивантаження) — ДИНАМІЧНІ блоки в кабінеті,
 * тому в цьому каталозі їх немає.
 *
 * Кожна система підтримує до трьох способів (взаємодоповнюють):
 *   view   — додати корпоративну пошту як Viewer/Analyst («надати доступ вручну»);
 *   oauth  — read-only конектор (сервер тягне дані автоматично);
 *   upload — клієнт вивантажує файл (CSV/експорт).
 * Ідентифікатори AC-** стабільні (стан клієнта в accessLog ключується ними).
 */
export type AccessMethod = 'view' | 'oauth' | 'upload';
export type AccessItem = {
  id: string;
  system: string;
  category: string;
  why: string;
  methods: AccessMethod[];
  /** Інструкція «Як надати доступ» (вручну, через пошту-viewer). */
  viewHow?: string;
  /** Інструкція «Як підключити конектор» (OAuth). */
  connectorHow?: string;
};

/** Корпоративна пошта для view-доступу (додається як Viewer/Analyst у системах клієнта). */
export const AUDIT_EMAIL = 'audit@weexp.agency';
export const DATA_EMAIL = 'data@weexp.agency';

const CONN_DEFAULT = `Натисніть «Підключити конектор» → у вікні, що відкриється, увійдіть у свій акаунт і підтвердьте READ-ONLY доступ для WEEXP. Ми бачимо лише дані для аналізу — нічого не змінюємо. Статус підключення оновиться в цьому рядку; якщо вікно не відкрилось або сталася помилка — напишіть менеджеру, допоможемо за 10 хвилин.`;

export const ACCESS_CATALOG: AccessItem[] = [
  /* ── Аналітика ── */
  { id: 'AC-01', system: 'Google Analytics 4', category: 'Аналітика', why: 'Воронка, джерела, звірка з бекендом', methods: ['view', 'oauth'],
    viewHow: `GA4 → Admin → Property Access Management → додати ${AUDIT_EMAIL} з роллю Viewer.`, connectorHow: CONN_DEFAULT },
  { id: 'AC-02', system: 'Google Tag Manager', category: 'Аналітика', why: 'Аудит подій і коректності трекінгу', methods: ['view', 'oauth'],
    viewHow: `GTM → Admin → User Management → додати ${AUDIT_EMAIL} (Read).`, connectorHow: CONN_DEFAULT },
  { id: 'AC-15', system: 'Looker Studio / Power BI', category: 'Аналітика', why: 'Ваші дашборди — як ви бачите бізнес зараз', methods: ['view', 'upload'],
    viewHow: `Поділіться звітом на ${AUDIT_EMAIL} (Viewer) або надішліть PDF-експорт дашбордів.` },

  /* ── SEO ── */
  { id: 'AC-03', system: 'Google Search Console', category: 'SEO', why: 'Індексація, запити, технічні помилки', methods: ['view', 'oauth'],
    viewHow: `GSC → Settings → Users and permissions → додати ${AUDIT_EMAIL} (Restricted/Full).`, connectorHow: CONN_DEFAULT },
  { id: 'AC-04', system: 'Ahrefs / Semrush / Serpstat', category: 'SEO', why: 'Видимість, посилання, конкуренти', methods: ['view', 'upload'],
    viewHow: `Додати ${AUDIT_EMAIL} у workspace (Viewer), або вивантажити звіти.` },
  { id: 'AC-16', system: 'Bing Webmaster Tools', category: 'SEO', why: 'Індексація і запити поза Google', methods: ['view'],
    viewHow: `Bing WMT → Settings → User management → додати ${AUDIT_EMAIL} (Read-only).` },

  /* ── Реклама ── */
  { id: 'AC-07', system: 'Google Ads', category: 'Реклама', why: 'Структура кампаній, витрати, ефективність', methods: ['view', 'oauth'],
    viewHow: `Google Ads → Tools → Access and security → додати ${AUDIT_EMAIL} (Read-only).`, connectorHow: CONN_DEFAULT },
  { id: 'AC-08', system: 'Meta Ads Manager', category: 'Реклама', why: 'Кампанії, креативи, аудиторії', methods: ['view', 'oauth'],
    viewHow: `Business Settings → People → додати ${AUDIT_EMAIL} з доступом Analyst до рекламного акаунта.`, connectorHow: CONN_DEFAULT },
  { id: 'AC-17', system: 'TikTok Ads', category: 'Реклама', why: 'Кампанії і креативи TikTok', methods: ['view', 'upload'],
    viewHow: `TikTok Ads Manager → Assets → Members → запросити ${AUDIT_EMAIL} (Analyst).` },
  { id: 'AC-14', system: 'Google Merchant Center', category: 'Реклама', why: 'Фід товарів, помилки, Shopping', methods: ['view', 'oauth'],
    viewHow: `Merchant Center → Users → додати ${AUDIT_EMAIL} (Standard).`, connectorHow: CONN_DEFAULT },

  /* ── CMS & Website ── */
  { id: 'AC-05', system: 'Адмінка сайту / CMS', category: 'CMS & Website', why: 'Структура каталогу, налаштування, контент', methods: ['view'],
    viewHow: `Створити read-only акаунт для ${AUDIT_EMAIL} (перегляд без редагування).` },
  { id: 'AC-06', system: 'Хостинг / сервер', category: 'CMS & Website', why: 'Продуктивність, логи, бекапи', methods: ['view', 'upload'],
    viewHow: `Read-only доступ для ${DATA_EMAIL} або вивантаження логів/метрик.` },
  { id: 'AC-18', system: 'CDN / WAF (Cloudflare…)', category: 'CMS & Website', why: 'Швидкість, кешування, безпека', methods: ['view', 'upload'],
    viewHow: `Cloudflare → Manage members → додати ${DATA_EMAIL} (Read-only), або скриншоти налаштувань.` },

  /* ── CRM & Retention ── */
  { id: 'AC-09', system: 'CRM (KeyCRM / HubSpot / …)', category: 'CRM & Retention', why: 'Ліди, угоди, воронка продажів', methods: ['view', 'oauth', 'upload'],
    viewHow: `Додати ${AUDIT_EMAIL} як користувача з переглядом (Analyst/Viewer).`, connectorHow: CONN_DEFAULT },
  { id: 'AC-19', system: 'Klaviyo', category: 'CRM & Retention', why: 'Flows, сегменти, виручка з email', methods: ['view', 'oauth'],
    viewHow: `Klaviyo → Settings → Users → додати ${AUDIT_EMAIL} (Analyst).`, connectorHow: CONN_DEFAULT },
  { id: 'AC-20', system: 'eSputnik / Yespo', category: 'CRM & Retention', why: 'Розсилки, тригери, деліверабіліті', methods: ['view', 'upload'],
    viewHow: `eSputnik → Налаштування → Користувачі → додати ${AUDIT_EMAIL} (перегляд).` },
  { id: 'AC-21', system: 'SendPulse / інша ESP', category: 'CRM & Retention', why: 'Email/push-канал, якщо він тут', methods: ['view', 'upload'],
    viewHow: `Додати ${AUDIT_EMAIL} користувачем з правами перегляду, або вивантажити статистику кампаній.` },
  { id: 'AC-22', system: 'CDP / програма лояльності', category: 'CRM & Retention', why: 'Профілі клієнтів, бали, сегменти', methods: ['view', 'upload'],
    viewHow: `Read-only доступ для ${AUDIT_EMAIL} або експорт сегментів/правил.` },

  /* ── ERP ── */
  { id: 'AC-10', system: 'ERP (Odoo / SAP / Dynamics / NetSuite / 1С)', category: 'ERP', why: 'Собівартість, залишки, закупівлі', methods: ['view', 'upload'],
    viewHow: `Read-only акаунт для ${DATA_EMAIL} або вивантаження звітів (залишки, собівартість, закупівлі).` },

  /* ── Operations / WMS ── */
  { id: 'AC-23', system: 'WMS / складська система', category: 'Operations', why: 'Наявність, обіговість, точність складу', methods: ['view', 'upload'],
    viewHow: `Read-only доступ для ${DATA_EMAIL} або вивантаження звітів по залишках/рухах.` },
  { id: 'AC-24', system: 'Логістика / перевізники / fulfillment', category: 'Operations', why: 'Строки, вартість, бій, повернення', methods: ['upload'],
    viewHow: `Вивантаження звітів перевізників (НП/курʼєри) за 6–12 міс: строки, статуси, пошкодження.` },
];

export const ACCESS_METHOD_LABEL: Record<AccessMethod, string> = {
  view: '👁 Перегляд (пошта)', oauth: '🔗 Конектор (OAuth)', upload: '📎 Вивантаження',
};

/** Підписи станів конектора. */
export const CONN_STATUS_LABEL: Record<'off' | 'progress' | 'on' | 'error', string> = {
  off: 'Не підключено', progress: 'Підключення в процесі', on: 'Підключено', error: 'Помилка підключення',
};

/** Пресети для динамічного блоку маркетплейсів. */
export const MARKETPLACE_PRESETS = ['Rozetka', 'Amazon', 'Allegro', 'Prom', 'eBay', 'Etsy', 'Kaufland', 'eMAG', 'OLX'];
export const MARKETPLACE_SCOPES = ['Продажі та статистика', 'Рекламний кабінет', 'Повний кабінет (read-only)', 'Вивантаження звітів'];

/** Типи файлів для блоку «Управлінська звітність» і «Вивантаження». */
export const REPORT_TYPES = ['P&L', 'Cash Flow', 'Управлінський звіт', 'Звіт по продажах', 'Звіт по маржинальності', 'Звіт по категоріях', 'Звіт по каналах', 'Інший документ'];
export const EXPORT_TYPES = ['Замовлення за 24 міс (CSV)', 'Клієнтська база (знеособлено)', 'Залишки / склад', 'Собівартість по SKU', 'Вивантаження з ERP', 'Звіти перевізників', 'Відгуки / VoC', 'Рекламні вивантаження', 'Семантика / позиції', 'Інший файл'];

/** ВИЧЕРПНИЙ чекліст файлів, які потрібні для глибокого аудиту.
    Рядки сідяться в кабінеті автоматично зі статусом «Очікується» —
    клієнт бачить повний перелік одразу, а не вгадує, що додати. */
export type RequiredFileSpec = { reqId: string; group: 'report' | 'export'; type: string; title: string; period: string; why: string };
export const REQUIRED_FILES: RequiredFileSpec[] = [
  /* Управлінська звітність */
  { reqId: 'rf-pl', group: 'report', type: 'P&L', title: 'P&L помісячно', period: 'останні 24 міс', why: 'міст P&L, окупність, сезонність (Звіт 3)' },
  { reqId: 'rf-cf', group: 'report', type: 'Cash Flow', title: 'Рух коштів (Cash Flow)', period: 'останні 12 міс', why: 'каса, підготовка до сезону (Звіт 3)' },
  { reqId: 'rf-sales', group: 'report', type: 'Звіт по продажах', title: 'Продажі по місяцях і каналах', period: '24 міс', why: 'динаміка й залежність від каналів' },
  { reqId: 'rf-margin', group: 'report', type: 'Звіт по маржинальності', title: 'Маржинальність по категоріях/SKU', period: '12 міс', why: 'юніт-економіка, важелі маржі' },
  { reqId: 'rf-cat', group: 'report', type: 'Звіт по категоріях', title: 'Виручка по категоріях', period: '12 міс', why: 'ABC-аналіз, пріоритети асортименту' },
  /* Вивантаження / сирі дані */
  { reqId: 'rf-orders', group: 'export', type: 'Замовлення за 24 міс (CSV)', title: 'Замовлення з бекенда', period: '24 міс', why: 'звірка GA4, когорти, повторні покупки' },
  { reqId: 'rf-stock', group: 'export', type: 'Залишки / склад', title: 'Залишки та обіговість по SKU', period: 'поточний зріз + 12 міс', why: 'OOS, dead stock у грошах' },
  { reqId: 'rf-cost', group: 'export', type: 'Собівартість по SKU', title: 'Повна собівартість топ-SKU', period: 'поточна', why: 'юніт-економіка, цінові рішення' },
  { reqId: 'rf-carriers', group: 'export', type: 'Звіти перевізників', title: 'Строки, статуси, пошкодження', period: '6–12 міс', why: 'доставка, бій, момент розпакування' },
  { reqId: 'rf-voc', group: 'export', type: 'Відгуки / VoC', title: 'Експорт відгуків з усіх майданчиків', period: '6–12 міс', why: 'голос клієнта, теми негативу' },
  { reqId: 'rf-ads', group: 'export', type: 'Рекламні вивантаження', title: 'Витрати/результати кабінетів', period: '12 міс', why: 'юніт-економіка каналів (якщо немає конекторів)' },
];
