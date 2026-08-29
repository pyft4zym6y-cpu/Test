/**
 * WEEXP — ядро інтелект-платформи. Діагностуємо не сайт і не канал, а всю
 * СИСТЕМУ онлайн-продажів як функцію бізнесу: вісім систем і 35 діагностичних
 * доменів усередині них. Розмір таксономії рахує TOTAL_DOMAINS — сторінка цін
 * бере число звідти, а не набирає його руками.
 *
 * Ланцюг: СИМПТОМ → BUSINESS CHALLENGE → 8 СИСТЕМ → 35 ДОМЕНІВ → ФАКТ → БЕНЧМАРК →
 * РОЗРИВ → ПЕРШОПРИЧИНА → ФІНАНСОВИЙ ЕФЕКТ → ПРІОРИТЕТ → ДІЯ → ПОБУДОВА → НЕЗАЛЕЖНІСТЬ.
 *
 * Business Health = 8 систем → загальний бал; bottleneck = найслабша система.
 * Independence Score = зважена на автономність зрілість 0–100.
 */

export type SystemKey = 'strategy' | 'commercial' | 'customer' | 'experience' | 'operations' | 'data' | 'org' | 'expansion';

export type System = {
  key: SystemKey;
  num: string;                 // 01..07
  slug: string;                // /challenges/:slug
  title: string;               // UA заголовок
  en: string;                  // EN підпис
  feel: string;                // що відчуває власник
  when: string;                // коли ця система — вузьке місце
  bigIdea: string;             // головна ідея-обіцянка
  flow: string[];              // ланцюг цінності
  sell: string;                // що будує WEEXP
  pains: string[];             // болі (симптоми)
  domains: string[];           // діагностичні домени всередині
};

export const SYSTEMS: System[] = [
  {
    key: 'strategy', num: '01', slug: 'strategy-management',
    title: 'Стратегія та управління', en: 'Strategy & Management',
    feel: 'Ми ростемо, але я не розумію, куди і навіщо.',
    when: 'Коли бізнес не розуміє, куди рости',
    bigIdea: 'Стратегія продажів, якою можна керувати',
    flow: ['Стратегія', 'Цілі', 'Економіка', 'Модель росту', 'Управлінський цикл'],
    sell: 'Будуємо стратегію, цілі, модель росту й регулярний цикл план→факт→причини→дії.',
    pains: [
      'Немає чіткої стратегії онлайн-продажів і річних цілей',
      'Цілі відділу не пов’язані з цілями бізнесу',
      'Немає моделі росту: трафік → конверсія → чек → повторні',
      'Фокус на обороті без розуміння маржинальності',
      'Рішення ухвалюються ситуативно, а не за даними',
      'Немає регулярного управлінського циклу',
      'Бренд і позиціонування не побудовані — конкуруємо ціною, а не цінністю',
    ],
    domains: ['Стратегія', 'Бренд і позиціонування', 'Цілі й декомпозиція', 'Модель росту', 'Управлінський цикл'],
  },
  {
    key: 'commercial', num: '02', slug: 'commercial-performance',
    title: 'Комерційна ефективність', en: 'Commercial Performance',
    feel: 'Ми продаємо, але не керуємо економікою продажів.',
    when: 'Коли оборот є, а прибутку — ні',
    bigIdea: 'Більше виручки — замало. Зробіть комерцію прибутковою.',
    flow: ['Трафік', 'Конверсія', 'Чек', 'Повторні', 'Маржа', 'Contribution'],
    sell: 'Керуємо конверсією, чеком, повторними, асортиментом і промо — за маржею, а не оборотом.',
    pains: [
      'Низькі конверсія, середній чек і частка повторних',
      'Високі відмови, неоплачені замовлення й повернення',
      'Немає upsell / cross-sell і персональних пропозицій',
      'Асортимент не керується за прибутковістю (немає ABC/XYZ)',
      'Просуваються товари з низькою маржею, промо з’їдає contribution',
      'Надлишкові SKU заморожують гроші',
    ],
    domains: ['Конверсія / чек / повторні', 'Асортимент і SKU', 'Промо і маржа', 'Юніт-економіка'],
  },
  {
    key: 'customer', num: '03', slug: 'demand-customer',
    title: 'Попит і клієнт', en: 'Demand & Customer',
    feel: 'Ми дорого залучаємо людей і погано робимо їх постійними клієнтами.',
    when: 'Коли клієнт дорогий і не повертається',
    bigIdea: 'Перетворюйте трафік на клієнтів, а клієнтів — на цінність.',
    flow: ['Залучення', 'Конверсія', 'Утримання', 'Реактивація', 'Зростання LTV'],
    sell: 'Будуємо attribution, retention і lifecycle: RFM, win-back, abandoned cart, post-purchase.',
    pains: [
      'Високий CAC і залежність від одного платного каналу',
      'Немає наскрізної аналітики й нормального attribution',
      'SEO і контент відірвані від комерції',
      'Немає системного retention: RFM, lifecycle, win-back',
      'CRM-канали (email/SMS/push) працюють розрізнено',
      'Скарги клієнтів не повертаються в продукт і маркетинг',
    ],
    domains: ['Залучення і CAC', 'Attribution', 'Retention і CRM', 'Клієнтський сервіс і чат-боти'],
  },
  {
    key: 'experience', num: '04', slug: 'experience-conversion',
    title: 'Досвід і конверсія', en: 'Experience & Conversion',
    feel: 'Люди заходять, але не купують.',
    when: 'Коли сайт не працює як механізм продажу',
    bigIdea: 'Зробіть кожен крок клієнта робочим.',
    flow: ['Discover', 'Understand', 'Trust', 'Buy', 'Repeat'],
    sell: 'Перебудовуємо каталог, картку, checkout і mobile; ставимо CRO-процес і A/B.',
    pains: [
      'Складна навігація, слабкі каталог, фільтри й пошук',
      'Неочевидна картка товару, мало контенту й social proof',
      'Складний checkout, забагато обов’язкових полів',
      'Немає зручної мобільної версії',
      'Немає CRO-процесу й A/B-тестування',
      'Невідомі точки втрати користувачів',
    ],
    domains: ['Навігація і каталог', 'Картка і контент', 'Checkout і mobile', 'CRO і A/B'],
  },
  {
    key: 'operations', num: '05', slug: 'operations-fulfillment',
    title: 'Операції та fulfillment', en: 'Operations & Fulfillment',
    feel: 'Маркетинг приводить замовлення, а склад і доставка все ламають.',
    when: 'Коли продаж є, а виконати його не можемо',
    bigIdea: 'Продавати марно, якщо не можеш доставити.',
    flow: ['Замовлення', 'Склад', 'Fulfillment', 'Доставка', 'Повернення', 'Клієнт'],
    sell: 'Ставимо SLA, статуси, резервування й контроль викупу — від кошика до повернення.',
    pains: [
      'Замовлення обробляються вручну й губляться між системами',
      'Немає SLA обробки; помилки комплектації та адрес',
      'Клієнт не бачить статусу — не розуміє, де замовлення',
      'Високий відсоток невикупів, повернення закриваються довго',
      'Немає SLA між e-commerce ↔ складом ↔ логістикою',
      'Залишки на сайті не відповідають реальності',
    ],
    domains: ['Обробка замовлень', 'Викуп і доставка', 'Повернення', 'Склад і залишки', 'SLA на стиках'],
  },
  {
    key: 'data', num: '06', slug: 'data-technology',
    title: 'Дані, технології, інтеграції', en: 'Data, Technology & Integration',
    feel: 'У кожного свої цифри, і жодній не можна довіряти.',
    when: 'Коли системи не дають керувати процесом',
    bigIdea: 'Один бізнес. Одне джерело правди.',
    flow: ['Джерела', 'Інтеграції', 'Master data', 'Аналітика', 'P&L'],
    sell: 'Будуємо цифрову інфраструктуру: інтеграції, master data, наскрізну аналітику і P&L.',
    pains: [
      'Різні цифри; GA4 налаштований некоректно, транзакції губляться',
      'Немає P&L по e-commerce, contribution margin і unit economics',
      'CMS / CRM / ERP / WMS / маркетинг не інтегровані',
      'Дані передаються вручну; API-помилки лишаються непоміченими',
      'Немає єдиного master data: ціни, залишки, статуси розходяться',
      'Технічний борг блокує розвиток',
    ],
    domains: ['Аналітика і GA4', 'P&L і unit economics', 'Інтеграції CMS/CRM/ERP/WMS', 'Master data'],
  },
  {
    key: 'org', num: '07', slug: 'organization-operating-model',
    title: 'Організація та операційна модель', en: 'Organization & Operating Model',
    feel: 'Усе тримається на мені та на кількох людях.',
    when: 'Коли немає власників, процесів і відповідальності',
    bigIdea: 'Побудуйте бізнес, якому не потрібні герої.',
    flow: ['Ролі', 'RACI', 'KPI', 'SOP', 'Owner journey', 'Незалежність'],
    sell: 'Будуємо операційну модель: ролі, RACI, несуперечливі KPI, SOP і власника customer journey.',
    pains: [
      'Незрозуміло, хто за що відповідає; дублювання і зони без власника',
      'Немає RACI; KPI конфліктують між собою',
      'E-commerce відповідає за продажі, але не контролює склад',
      'Немає єдиного власника customer journey',
      'Firefighting замість розвитку; критичні процеси на одній людині',
      'Немає SOP, бази знань і roadmap; усе «терміново»',
    ],
    domains: ['Owner і RACI', 'KPI по ролях', 'SOP і база знань', 'Взаємодія підрозділів', 'Roadmap і зміни'],
  },
  {
    key: 'expansion', num: '08', slug: 'expansion-markets',
    title: 'Експансія та ринки', en: 'Expansion & Markets',
    feel: 'Наш ринок майже вичерпано, а нові — це страшно й незрозуміло.',
    when: 'Коли ріст упирається в стелю одного ринку',
    bigIdea: 'Новий ринок — це не «ще один канал», а окремий бізнес-контур.',
    flow: ['Вибір ринку', 'Локалізація', 'Маркетплейси', 'Логістика', 'Юридика', 'Масштабування'],
    sell: 'Виводимо в ЄС і США системно: власний сайт, Amazon, Allegro, eBay і локальні майданчики, логістика й податки.',
    pains: [
      'Продажі тримаються на одному ринку — і він вичерпується',
      'Немає локалізованого сайту, мов і валют',
      'Немає акаунтів і рейтингу на маркетплейсах (Amazon, Allegro)',
      'Логістика й фулфілмент за кордон не налагоджені',
      'Юридичні й податкові питання блокують старт',
      'Виходили хаотично, без юніт-економіки нового ринку',
    ],
    domains: ['Вибір ринку', 'Локалізація', 'Маркетплейси', 'Логістика і податки'],
  },
];

/**
 * Ваги автономності — наскільки кожна система впливає на здатність бізнесу
 * працювати без власника. Організація й операції важать більше за експансію:
 * бізнес без ролей і процесів тримається на людині, скільки б ринків не мав.
 *
 * Один набір на весь застосунок. Ці самі вісім чисел лежали ще й у
 * system/lossModel.ts — окремою копією, під іншою назвою підсумку («Business
 * Health» проти «Independence Score»), хоча формула та сама. Дві копії однієї
 * правди розходяться мовчки: правку ваг зробили б в одному файлі, а другий
 * рахував би далі по-старому — і сайт показував би два різні бали за ті самі
 * відповіді.
 */
export const AUTONOMY_W: Record<SystemKey, number> = {
  strategy: 1, commercial: 1, customer: 1.1, experience: 0.9,
  operations: 1.3, data: 1.2, org: 1.5, expansion: 0.8,
};

/**
 * Розмір таксономії — рахується з даних, а не пишеться в текст.
 *
 * Кількість систем і доменів згадується на сторінці цін. Раніше вона стояла
 * там літералом, а звʼязок із моделлю тримав лише тест: число було вірне, але
 * трималось на тому, що хтось прочитає падіння тесту й полагодить сторінку.
 * Тепер сторінка бере число звідси — розійтись більше нема чому.
 */
export const TOTAL_SYSTEMS = SYSTEMS.length;
export const TOTAL_DOMAINS = SYSTEMS.reduce((n, s) => n + s.domains.length, 0);

export const systemBySlug = (slug: string) => SYSTEMS.find((s) => s.slug === slug);
export const systemByKey = (k: SystemKey) => SYSTEMS.find((s) => s.key === k)!;

/** Короткі підписи для радара (повні заголовки не влазять на осі). */
export const SHORT: Record<SystemKey, string> = {
  strategy: 'Стратегія', commercial: 'Комерція', customer: 'Клієнт',
  experience: 'Досвід', operations: 'Операції', data: 'Дані', org: 'Організація', expansion: 'Експансія',
};
export const SHORT_EN: Record<SystemKey, string> = {
  strategy: 'Strategy', commercial: 'Commerce', customer: 'Customer',
  experience: 'Experience', operations: 'Operations', data: 'Data', org: 'Organization', expansion: 'Expansion',
};
export const shortOf = (k: SystemKey, lang: 'uk' | 'en') => (lang === 'en' ? SHORT_EN : SHORT)[k];

/** Англійський оверлей для System (title EN = поле `en`). localizeSystem накладає його. */
type SystemEn = Pick<System, 'feel' | 'when' | 'bigIdea' | 'flow' | 'sell' | 'pains' | 'domains'>;
const SYS_EN: Record<SystemKey, SystemEn> = {
  strategy: {
    feel: 'We keep growing, but I do not understand where to or why.',
    when: 'When the business does not know where to grow',
    bigIdea: 'A sales strategy you can actually manage.',
    flow: ['Strategy', 'Goals', 'Economics', 'Growth model', 'Management cycle'],
    sell: 'We build the strategy, goals, growth model and a regular plan → actual → causes → actions cycle.',
    pains: [
      'No clear online-sales strategy or annual goals',
      'Department goals are not tied to business goals',
      'No growth model: traffic → conversion → order value → repeat',
      'Focus on turnover without understanding margin',
      'Decisions are made ad hoc, not from data',
      'No regular management cycle',
      'Brand and positioning are not built — you compete on price, not value',
    ],
    domains: ['Strategy', 'Brand & positioning', 'Goals & decomposition', 'Growth model', 'Management cycle'],
  },
  commercial: {
    feel: 'We sell, but we do not manage the economics of our sales.',
    when: 'When there is turnover but no profit',
    bigIdea: 'More revenue is not enough. Make commerce profitable.',
    flow: ['Traffic', 'Conversion', 'Order value', 'Repeat', 'Margin', 'Contribution'],
    sell: 'We manage conversion, order value, repeat rate, assortment and promo — by margin, not turnover.',
    pains: [
      'Low conversion, average order value and repeat share',
      'High bounce, unpaid orders and returns',
      'No upsell / cross-sell or personalized offers',
      'Assortment is not managed by profitability (no ABC/XYZ)',
      'Low-margin products get promoted; promo eats contribution',
      'Excess SKUs freeze cash',
    ],
    domains: ['Conversion / order value / repeat', 'Assortment & SKUs', 'Promo & margin', 'Unit economics'],
  },
  customer: {
    feel: 'We acquire people expensively and turn them into loyal customers poorly.',
    when: 'When the customer is expensive and does not return',
    bigIdea: 'Turn traffic into customers, and customers into value.',
    flow: ['Acquisition', 'Conversion', 'Retention', 'Reactivation', 'LTV growth'],
    sell: 'We build attribution, retention and lifecycle: RFM, win-back, abandoned cart, post-purchase.',
    pains: [
      'High CAC and dependence on one paid channel',
      'No end-to-end analytics or proper attribution',
      'SEO and content are disconnected from commerce',
      'No systematic retention: RFM, lifecycle, win-back',
      'CRM channels (email/SMS/push) work in silos',
      'Customer complaints never return to product and marketing',
    ],
    domains: ['Acquisition & CAC', 'Attribution', 'Retention & CRM', 'Customer service & chatbots'],
  },
  experience: {
    feel: 'People come in, but they do not buy.',
    when: 'When the site does not work as a selling mechanism',
    bigIdea: 'Make every step of the customer journey work.',
    flow: ['Discover', 'Understand', 'Trust', 'Buy', 'Repeat'],
    sell: 'We rebuild the catalog, product page, checkout and mobile; we set up a CRO process and A/B testing.',
    pains: [
      'Complex navigation, weak catalog, filters and search',
      'Unclear product page, little content and social proof',
      'Complicated checkout, too many required fields',
      'No convenient mobile version',
      'No CRO process or A/B testing',
      'Unknown points where users drop off',
    ],
    domains: ['Navigation & catalog', 'Product page & content', 'Checkout & mobile', 'CRO & A/B'],
  },
  operations: {
    feel: 'Marketing brings orders, and the warehouse and delivery break everything.',
    when: 'When the sale happens but we cannot fulfill it',
    bigIdea: 'Selling is pointless if you cannot deliver.',
    flow: ['Order', 'Warehouse', 'Fulfillment', 'Delivery', 'Returns', 'Customer'],
    sell: 'We set SLAs, statuses, reservation and delivery-acceptance control — from cart to return.',
    pains: [
      'Orders are processed manually and get lost between systems',
      'No processing SLA; picking and address errors',
      'The customer cannot see the status — does not know where the order is',
      'High non-redemption rate; returns take long to close',
      'No SLA between e-commerce ↔ warehouse ↔ logistics',
      'Stock on the site does not match reality',
    ],
    domains: ['Order processing', 'Delivery acceptance', 'Returns', 'Warehouse & stock', 'SLAs at the seams'],
  },
  data: {
    feel: 'Everyone has their own numbers, and none of them can be trusted.',
    when: 'When the systems do not let you manage the process',
    bigIdea: 'One business. One source of truth.',
    flow: ['Sources', 'Integrations', 'Master data', 'Analytics', 'P&L'],
    sell: 'We build the digital infrastructure: integrations, master data, end-to-end analytics and a P&L.',
    pains: [
      'Different numbers; GA4 misconfigured, transactions lost',
      'No e-commerce P&L, contribution margin or unit economics',
      'CMS / CRM / ERP / WMS / marketing are not integrated',
      'Data is passed manually; API errors go unnoticed',
      'No single master data: prices, stock, statuses diverge',
      'Technical debt blocks growth',
    ],
    domains: ['Analytics & GA4', 'P&L & unit economics', 'CMS/CRM/ERP/WMS integrations', 'Master data'],
  },
  org: {
    feel: 'Everything rests on me and a few people.',
    when: 'When there are no owners, processes or accountability',
    bigIdea: 'Build a business that does not need heroes.',
    flow: ['Roles', 'RACI', 'KPIs', 'SOPs', 'Owner journey', 'Independence'],
    sell: 'We build the operating model: roles, RACI, non-conflicting KPIs, SOPs and a customer-journey owner.',
    pains: [
      'Unclear who is responsible for what; duplication and ownerless zones',
      'No RACI; KPIs conflict with each other',
      'E-commerce owns sales but does not control the warehouse',
      'No single owner of the customer journey',
      'Firefighting instead of growth; critical processes on one person',
      'No SOPs, knowledge base or roadmap; everything is “urgent”',
    ],
    domains: ['Owner & RACI', 'KPIs by role', 'SOPs & knowledge base', 'Cross-team interaction', 'Roadmap & change'],
  },
  expansion: {
    feel: 'Our market is nearly exhausted, and new ones feel scary and unclear.',
    when: 'When growth hits the ceiling of a single market',
    bigIdea: 'A new market is not “one more channel” — it is a separate business circuit.',
    flow: ['Market choice', 'Localization', 'Marketplaces', 'Logistics', 'Legal', 'Scaling'],
    sell: 'We launch into the EU & US systematically: own site, Amazon, Allegro, eBay and local platforms, logistics and taxes.',
    pains: [
      'Sales rest on one market — and it is running out',
      'No localized site, languages or currencies',
      'No accounts or rating on marketplaces (Amazon, Allegro)',
      'Cross-border logistics and fulfillment are not set up',
      'Legal and tax issues block the launch',
      'Past launches were chaotic, without new-market unit economics',
    ],
    domains: ['Market choice', 'Localization', 'Marketplaces', 'Logistics & taxes'],
  },
};

/** Локалізований вигляд системи: для EN накладає SYS_EN (title = поле en). */
export function localizeSystem(s: System, lang: 'uk' | 'en'): System {
  if (lang !== 'en') return s;
  return { ...s, title: s.en, ...SYS_EN[s.key] };
}

/** Питання X-Ray — по 2 на систему. answer 0..3 (Ні / Радше ні / Радше так / Так). */
export type Question = { id: string; text: string; system: SystemKey };
export const QUESTIONS: Question[] = [
  { id: 's1', text: 'У вас є чітка стратегія онлайн-продажів і річні цілі, пов’язані з цілями бізнесу.', system: 'strategy' },
  { id: 's2', text: 'Працює регулярний управлінський цикл: план → факт → причини → дії.', system: 'strategy' },
  { id: 'c1', text: 'Ви керуєте асортиментом і промо за маржею, а не лише за оборотом.', system: 'commercial' },
  { id: 'c2', text: 'Ви знаєте contribution margin і юніт-економіку по категоріях та SKU.', system: 'commercial' },
  { id: 'd1', text: 'CAC під контролем, і ви не залежите від одного платного каналу.', system: 'customer' },
  { id: 'd2', text: 'Працює retention: сегментація, win-back, abandoned cart, post-purchase.', system: 'customer' },
  { id: 'e1', text: 'Каталог, картка, пошук і checkout не втрачають покупця на шляху.', system: 'experience' },
  { id: 'e2', text: 'Є CRO-процес і A/B-тестування; ви знаєте точки втрати користувачів.', system: 'experience' },
  { id: 'o1', text: 'Замовлення обробляються за SLA, викуп і доставка під контролем.', system: 'operations' },
  { id: 'o2', text: 'Залишки на сайті відповідають реальності; є SLA між e-commerce, складом і логістикою.', system: 'operations' },
  { id: 't1', text: 'Системи інтегровані (CMS/CRM/ERP/WMS), є єдиний master data.', system: 'data' },
  { id: 't2', text: 'Є наскрізна аналітика й P&L по e-commerce — усі рахують метрики однаково.', system: 'data' },
  { id: 'g1', text: 'Ролі, RACI і KPI зрозумілі; за підсумковий прибуток хтось відповідає.', system: 'org' },
  { id: 'g2', text: 'Бізнес може працювати 2 тижні без щоденної участі власника (SOP, база знань).', system: 'org' },
  { id: 'x1', text: 'Ви системно присутні більш ніж на одному ринку — не лише на своєму.', system: 'expansion' },
  { id: 'x2', text: 'Є план виходу на нові ринки з юніт-економікою і локалізацією.', system: 'expansion' },
];

/** Розширений набір для повної діагностики (/diagnose/full) — глибше по кожній системі. */
export const QUESTIONS_EXTRA: Question[] = [
  { id: 's3', text: 'План продажів декомпозований на канали, категорії та місяці.', system: 'strategy' },
  { id: 's4', text: 'Є сценарії дій при недовиконанні плану.', system: 'strategy' },
  { id: 'c3', text: 'Є ABC/XYZ-аналіз і керування SKU за оборотністю.', system: 'commercial' },
  { id: 'c4', text: 'Промо плануються з урахуванням впливу на маржу, а не лише на оборот.', system: 'commercial' },
  { id: 'd3', text: 'Є єдиний профіль клієнта (customer ID), замовлення з різних каналів об’єднані.', system: 'customer' },
  { id: 'd4', text: 'Скарги й відгуки класифікуються і повертаються в продукт та маркетинг.', system: 'customer' },
  { id: 'e3', text: 'Мобільна версія зручна; помилки інтерфейсу відпрацьовані.', system: 'experience' },
  { id: 'e4', text: 'Картка товару має достатньо контенту і social proof для рішення про покупку.', system: 'experience' },
  { id: 'o3', text: 'Товар резервується під замовлення; немає продажу того, чого немає на складі.', system: 'operations' },
  { id: 'o4', text: 'Є система роботи з недоставленими замовленнями і контроль вартості fulfillment.', system: 'operations' },
  { id: 't3', text: 'Є моніторинг інтеграцій; помилки API помічаються й усуваються.', system: 'data' },
  { id: 't4', text: 'Є регулярні дашборди й автоматичні алерти по ключових метриках.', system: 'data' },
  { id: 'g3', text: 'Є roadmap і пріоритизація за impact/effort замість «усе терміново».', system: 'org' },
  { id: 'g4', text: 'Після великих змін проводиться post-mortem; підхід hypothesis-driven.', system: 'org' },
  { id: 'x3', text: 'Налагоджені логістика, фулфілмент і повернення для зовнішніх ринків.', system: 'expansion' },
  { id: 'x4', text: 'Є присутність і рейтинг на релевантних маркетплейсах (Amazon, Allegro, eBay).', system: 'expansion' },
];

export const QUESTIONS_FULL: Question[] = [...QUESTIONS, ...QUESTIONS_EXTRA];

export type Answers = Record<string, number>;

export type Level = { min: number; max: number; code: string; title: string; line: string };
export const LEVELS: Level[] = [
  { min: 0, max: 20, code: '00–20', title: 'Хаос', line: 'Усе тримається в голові власника. Кожне рішення — вручну.' },
  { min: 20, max: 40, code: '20–40', title: 'Залежність', line: 'Процеси існують, але зав’язані на конкретних людях.' },
  { min: 40, max: 60, code: '40–60', title: 'Функції', line: 'Системи працюють окремо, але ще не як єдине ціле.' },
  { min: 60, max: 80, code: '60–80', title: 'Система', line: 'Бізнес масштабується на власній операційній основі.' },
  { min: 80, max: 100, code: '80–100', title: 'Незалежність', line: 'Бізнес здатний працювати й зростати без героя.' },
];
export const levelFor = (score: number): Level =>
  LEVELS.find((l) => score >= l.min && score < l.max) ?? LEVELS[LEVELS.length - 1];

export type SystemScore = { key: SystemKey; title: string; score: number };
export type XrayResult = {
  health: number;
  independence: number;
  level: Level;
  systemScores: SystemScore[];
  bottleneck: SystemScore;
  gaps: SystemScore[];
};

export function scoreXray(answers: Answers, questions: Question[] = QUESTIONS): XrayResult {
  const systemScores: SystemScore[] = SYSTEMS.map((s) => {
    const qs = questions.filter((q) => q.system === s.key);
    const sum = qs.reduce((a, q) => a + Math.max(0, Math.min(3, answers[q.id] ?? 0)) / 3 * 100, 0);
    return { key: s.key, title: s.title, score: qs.length ? Math.round(sum / qs.length) : 0 };
  });
  const health = Math.round(systemScores.reduce((a, s) => a + s.score, 0) / systemScores.length);

  const wsum = Object.values(AUTONOMY_W).reduce((a, b) => a + b, 0);
  const independence = Math.round(systemScores.reduce((a, s) => a + s.score * AUTONOMY_W[s.key], 0) / wsum);

  const sorted = [...systemScores].sort((a, b) => a.score - b.score);
  return { health, independence, level: levelFor(independence), systemScores, bottleneck: sorted[0], gaps: sorted.slice(0, 3) };
}

export function opportunityLabel(independence: number): string {
  if (independence >= 80) return 'точкова оптимізація';
  if (independence >= 60) return '10–20% до обороту';
  if (independence >= 40) return '20–40% до обороту';
  if (independence >= 20) return '40–70% до обороту';
  return '×1,5–2 до обороту';
}

/** Ключ у localStorage, під яким лежить читабельний підсумок останньої діагностики. */
export const DIAG_SUMMARY_KEY = 'weexp:diag-summary';

/** Текстовий підсумок результату — вкладається в лід власнику. */
export function diagnosisSummary(r: XrayResult, full: boolean): string {
  const line = (s: SystemScore) => `${systemByKey(s.key).num}·${s.title} — ${s.score}/100`;
  return [
    `Тип: ${full ? `Повна діагностика (${QUESTIONS_FULL.length} питань)` : `Швидкий X-Ray (${QUESTIONS.length} питань)`}`,
    `Independence Score: ${r.independence}/100 — ${r.level.title}`,
    `Business Health: ${r.health}/100`,
    `Головний bottleneck: ${line(r.bottleneck)}`,
    `Три найслабші системи: ${r.gaps.map(line).join('; ')}`,
    `Оцінена можливість: ${opportunityLabel(r.independence)}`,
    `Профіль ${SYSTEMS.length} систем: ${r.systemScores.map((s) => `${systemByKey(s.key).num}:${s.score}`).join(' · ')}`,
  ].join('\n');
}
