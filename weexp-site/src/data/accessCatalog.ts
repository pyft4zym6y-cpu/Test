/**
 * Каталог доступів клієнта для аудиту. Кожна система підтримує до трьох способів
 * надання доступу (взаємодоповнюють; повна автоматизація — пріоритет):
 *   view   — додати корпоративну пошту як Viewer/Analyst (людина-аудитор дивиться);
 *   oauth  — read-only конектор (сервер тягне дані автоматично);
 *   upload — клієнт вивантажує файл (CSV/експорт).
 * Ідентифікатори AC-** узгоджені з методологією аудиту (portal/accesses.json).
 */
export type AccessMethod = 'view' | 'oauth' | 'upload';
export type AccessItem = {
  id: string;
  system: string;
  category: string;
  why: string;
  methods: AccessMethod[];
  /** Інструкція для способу «view» (кого додати як переглядача). */
  viewHow?: string;
};

/** Корпоративна пошта для view-доступу (додається як Viewer/Analyst у системах клієнта). */
export const AUDIT_EMAIL = 'audit@weexp.agency';
export const DATA_EMAIL = 'data@weexp.agency';

export const ACCESS_CATALOG: AccessItem[] = [
  { id: 'AC-01', system: 'Google Analytics 4', category: 'Аналітика', why: 'Воронка, джерела, звірка з бекендом', methods: ['view', 'oauth'], viewHow: `GA4 → Admin → Property Access Management → додати ${AUDIT_EMAIL} з роллю Viewer.` },
  { id: 'AC-02', system: 'Google Tag Manager', category: 'Аналітика', why: 'Аудит подій і коректності трекінгу', methods: ['view', 'oauth'], viewHow: `GTM → Admin → User Management → додати ${AUDIT_EMAIL} (Read).` },
  { id: 'AC-03', system: 'Google Search Console', category: 'SEO', why: 'Індексація, запити, технічні помилки', methods: ['view', 'oauth'], viewHow: `GSC → Settings → Users and permissions → додати ${AUDIT_EMAIL} (Restricted/Full).` },
  { id: 'AC-04', system: 'Ahrefs / Semrush / Serpstat', category: 'SEO', why: 'Видимість, посилання, конкуренти', methods: ['view', 'upload'], viewHow: `Додати ${AUDIT_EMAIL} у workspace (Viewer), або вивантажити звіти.` },
  { id: 'AC-05', system: 'Адмінка сайту / CMS', category: 'Платформа', why: 'Структура каталогу, налаштування, контент', methods: ['view'], viewHow: `Створити read-only акаунт для ${AUDIT_EMAIL} (перегляд без редагування).` },
  { id: 'AC-06', system: 'Хостинг / сервер', category: 'Платформа', why: 'Продуктивність, логи, бекапи', methods: ['view', 'upload'], viewHow: `Read-only доступ для ${DATA_EMAIL} або вивантаження логів/метрик.` },
  { id: 'AC-07', system: 'Google Ads', category: 'Маркетинг', why: 'Структура кампаній, витрати, ефективність', methods: ['view', 'oauth'], viewHow: `Google Ads → Tools → Access and security → додати ${AUDIT_EMAIL} (Read-only).` },
  { id: 'AC-08', system: 'Meta Ads Manager', category: 'Маркетинг', why: 'Кампанії, креативи, аудиторії', methods: ['view', 'oauth'], viewHow: `Business Settings → People → додати ${AUDIT_EMAIL} з доступом Analyst до рекламного акаунта.` },
  { id: 'AC-09', system: 'CRM / Klaviyo / ESP', category: 'CRM', why: 'Флоу, сегменти, метрики бази', methods: ['view', 'oauth', 'upload'], viewHow: `Додати ${AUDIT_EMAIL} як користувача з переглядом (Analyst/Viewer).` },
  { id: 'AC-10', system: 'ERP / 1C / Odoo', category: 'Операції', why: 'Собівартість, залишки, закупівлі', methods: ['view', 'upload'], viewHow: `Read-only акаунт для ${DATA_EMAIL} або вивантаження звітів.` },
  { id: 'AC-11', system: 'Кабінети маркетплейсів', category: 'Marketplace', why: 'Продажі, комісії, рейтинги, реклама', methods: ['view', 'upload'], viewHow: `Додати ${AUDIT_EMAIL} як користувача-переглядача (де можливо) або вивантаження.` },
  { id: 'AC-12', system: 'Управлінська звітність', category: 'Фінанси', why: 'P&L, маржа, юніт-економіка, EBITDA', methods: ['upload'], viewHow: 'Вивантаження звітів (Google Sheets/Excel/PDF).' },
  { id: 'AC-13', system: 'Вивантаження замовлень за 24 міс', category: 'Дані', why: 'Когорти, повторні, сезонність', methods: ['upload'], viewHow: 'Експорт замовлень CSV з платформи/ERP.' },
  { id: 'AC-14', system: 'Google Merchant Center', category: 'Маркетинг', why: 'Фід товарів, помилки, Shopping', methods: ['view', 'oauth'], viewHow: `Merchant Center → Users → додати ${AUDIT_EMAIL} (Standard).` },
];

export const ACCESS_METHOD_LABEL: Record<AccessMethod, string> = {
  view: '👁 Перегляд (пошта)', oauth: '🔗 Конектор (OAuth)', upload: '📎 Вивантаження',
};
