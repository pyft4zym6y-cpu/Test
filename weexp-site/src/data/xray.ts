/**
 * WEEXP — ядро інтелект-платформи. Діагностуємо не сайт і не канал, а всю
 * СИСТЕМУ онлайн-продажів як функцію бізнесу: 7 систем × 15 діагностичних доменів.
 *
 * Ланцюг: СИМПТОМ → BUSINESS CHALLENGE → 7 СИСТЕМ → 15 ДОМЕНІВ → ФАКТ → БЕНЧМАРК →
 * РОЗРИВ → ПЕРШОПРИЧИНА → ФІНАНСОВИЙ ЕФЕКТ → ПРІОРИТЕТ → ДІЯ → ПОБУДОВА → НЕЗАЛЕЖНІСТЬ.
 *
 * Business Health = 7 систем → загальний бал; bottleneck = найслабша система.
 * Independence Score = зважена на автономність зрілість 0–100.
 */

export type SystemKey = 'strategy' | 'commercial' | 'customer' | 'experience' | 'operations' | 'data' | 'org';

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
    ],
    domains: ['Стратегія', 'Цілі й декомпозиція', 'Модель росту', 'Управлінський цикл'],
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
    domains: ['Залучення і CAC', 'Attribution', 'Retention і CRM', 'Клієнтський сервіс'],
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
];

export const systemBySlug = (slug: string) => SYSTEMS.find((s) => s.slug === slug);
export const systemByKey = (k: SystemKey) => SYSTEMS.find((s) => s.key === k)!;

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
];

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

export function scoreXray(answers: Answers): XrayResult {
  const systemScores: SystemScore[] = SYSTEMS.map((s) => {
    const qs = QUESTIONS.filter((q) => q.system === s.key);
    const sum = qs.reduce((a, q) => a + Math.max(0, Math.min(3, answers[q.id] ?? 0)) / 3 * 100, 0);
    return { key: s.key, title: s.title, score: Math.round(sum / qs.length) };
  });
  const health = Math.round(systemScores.reduce((a, s) => a + s.score, 0) / systemScores.length);

  // Independence зважує автономність (операції/дані/організація/клієнт) сильніше.
  const W: Record<SystemKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: 0.9, operations: 1.3, data: 1.2, org: 1.5 };
  const wsum = Object.values(W).reduce((a, b) => a + b, 0);
  const independence = Math.round(systemScores.reduce((a, s) => a + s.score * W[s.key], 0) / wsum);

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
