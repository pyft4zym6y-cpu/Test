/**
 * Три формати співпраці — ОДНЕ джерело для трьох місць, де вони показуються:
 * хаб послуг (/services), сторінка формату (/services/:slug) і таблиця
 * порівняння цін (/pricing).
 *
 * Доти вони жили всередині Pricing.tsx — у масиві MODELS, побудованому просто
 * в рендері через t(). Поки формати показувались на одній сторінці, це було
 * нормально. Тепер вони стали головною віссю сайту: перший пункт меню, блок на
 * головній, три власні сторінки. Скопіювати тексти в кожне з цих місць
 * означало б рівно те, від чого сайт уже одного разу лікували, — одна правда,
 * записана в чотирьох файлах, які розходяться мовчки.
 *
 * ЧОМУ ТУТ НЕМА ІМПОРТІВ ІЗ auditPack Й xray.
 * Один рядок складу аудиту називає числа: скільки аудитів і скільки доменів
 * діагностики. Їхнє джерело — AUDIT_BLOCKS і TOTAL_DOMAINS, разом 64 КБ. Блок
 * послуг на головній показує лише назву, ціну й одне речення — тягнути заради
 * двох чисел усю таксономію в його чанк дорожче, ніж лишити в тексті
 * підстановки {audits} і {domains} і підставити їх на тій сторінці, яка ці
 * модулі й так вантажить. Що підстановка не поїде в розмітку сирою, звіряє
 * services.test.ts.
 */

/** Двомовна пара — та сама домовленість, що в expertises.ts і symptoms.ts. */
export type P = [uk: string, en: string];

export type ServiceSlug = 'audit' | 'consulting' | 'managed';

export type ServiceModel = {
  slug: ServiceSlug;
  /** Номер формату. Він же порядок: аудит завжди перший, бо без нього не буває решти. */
  n: '01' | '02' | '03';
  name: P;
  tag: P;
  period: P;
  price: P;
  priceNote: P;
  scopes?: { name: P; price: string }[];
  featured?: boolean;
  /**
   * Одне речення про те, ЩО КЛІЄНТ ОТРИМУЄ. Не «що ми робимо».
   * Це той рядок, який людина читає в картці на головній і після якого має
   * розуміти, чи це про неї, — раніше такого речення не було взагалі: картка
   * починалась із «Diagnostic · разовий проєкт».
   */
  promise: P;
  forWhom: P;
  includes: P[];
  format: P;
  terms: P;
  resp: P;
};

export const SERVICES: ServiceModel[] = [
  {
    slug: 'audit',
    n: '01',
    name: ['Аудит', 'Audit'],
    tag: ['Разовий проєкт', 'One-off project'],
    period: ['4–6 тижнів', '4–6 weeks'],
    price: ['$2,900 / $4,900', '$2,900 / $4,900'],
    scopes: [
      { name: ['Аудит інтернет-магазину', 'Online-store audit'], price: '$2,900' },
      { name: ['Аудит відділу e-commerce в цілому', 'E-commerce department audit'], price: '$4,900' },
    ],
    priceNote: [
      'Обираєте глибину: сам магазин чи весь відділ e-commerce. Сума фіксується до старту.',
      'Choose the depth: the store itself or the whole e-commerce department. The amount is fixed before we start.',
    ],
    promise: [
      'Карта: де саме витікають гроші, скільки це коштує за рік, що робити першим.',
      'A map: exactly where the money leaks, what it costs per year and what to fix first.',
    ],
    forWhom: [
      'У вас сильна внутрішня команда. Потрібні не руки, а карта: де саме витікають гроші й що робити першим.',
      'You have a strong in-house team. You need a map, not hands: exactly where the money leaks and what to fix first.',
    ],
    includes: [
      ['Discovery-портал: опитувальники, передача доступів, бриф ЛПР', 'Discovery portal: questionnaires, access handover, decision-maker brief'],
      ['E-commerce 360°: {audits} аудитів · {domains} доменів діагностики', 'E-commerce 360°: {audits} audits · {domains} diagnostic domains'],
      ['Health Score і зрілість по 18 доменах', 'Health Score and maturity across 18 domains'],
      ['Розрив у грошах: 8 важелів, baseline, прогноз на 12 місяців', 'The gap in money: 8 levers, baseline, 12-month forecast'],
      ['Повний пакет: 5 звітів + посторінкові томи «зараз → як треба» + Гант-план Excel (зміст відкритий)', 'The full pack: 5 reports + page-by-page now/should-be volumes + an Excel Gantt (contents open)'],
      ['Роадмапа хвилями: пріоритети, бюджет, строки, команда', 'Roadmap in waves: priorities, budget, timelines, team'],
    ],
    format: [
      'Передача документів + 4 години консультацій із розбором + контрольний дзвінок через 30 днів: перевіряємо, що впровадження пішло.',
      'Document handover + 4 hours of consulting with a walkthrough + a check-in call after 30 days: we confirm implementation is underway.',
    ],
    terms: [
      '100% вартості аудиту зараховується в перший місяць формату 03 (50% — у формат 02), якщо старт упродовж 30 днів. Аудит фактично стає безкоштовним входом.',
      '100% of the audit fee is credited to the first month of format 03 (50% to format 02) if you start within 30 days. The audit effectively becomes a free entry.',
    ],
    resp: ['Впровадження та результат — ваша команда.', 'Implementation and the result — your team.'],
  },
  {
    slug: 'consulting',
    n: '02',
    name: ['Консалтинг', 'Consulting'],
    tag: ['Зовнішній експерт', 'External expert'],
    period: ['помісячно · від 1 міс', 'monthly · from 1 mo'],
    price: ['$50 / год', '$50 / hr'],
    priceNote: [
      'мінімум 30 год/міс — рахунок не буває менше $1,500/міс; понад мінімум — за фактом годин.',
      'minimum 30 hrs/mo — the invoice is never below $1,500/mo; above the minimum — by actual hours.',
    ],
    featured: true,
    promise: [
      'Зовнішній архітектор вашій команді: що робити, в якому порядку, чи зроблено якісно.',
      'An external architect for your team: what to do, in what order, and whether it is done well.',
    ],
    forWhom: [
      'У вас є виконавці та проджект-менеджер. Потрібен архітектор: що робити, в якому порядку і чи якісно зроблено.',
      "You have doers and a project manager. You need an architect: what to do, in what order, and whether it's done well.",
    ],
    includes: [
      ['Щотижневі спринт-сесії: пріоритети, розбори, рішення', 'Weekly sprint sessions: priorities, reviews, decisions'],
      ['Роадмапа та беклог трансформації під нашим контролем', 'Transformation roadmap and backlog under our control'],
      ['Ревʼю виконаного проти DoD і наших еталонів', 'Review of delivered work against DoD and our benchmarks'],
      ['Доступ до плейбуків, стандартів і чеклістів', 'Access to playbooks, standards, and checklists'],
      ['Прозорий звіт по годинах щомісяця', 'A transparent monthly hours report'],
    ],
    format: [
      'Обовʼязкова умова: на вашому боці є виділений проджект або відповідальний, який керує виконанням. Без нього рекомендації зависають — тоді чесніше одразу формат 03.',
      'A mandatory condition: on your side there is a dedicated project lead or owner who drives execution. Without one, recommendations stall — then format 03 is the honest choice from the start.',
    ],
    terms: [
      'Старт — після аудиту (формат 01): він дає карту, за якою ведемо. Початковий термін — 3 місяці, далі помісячно з відмовою за 30 днів. Передоплата на місяць; до 20% невикористаних годин переносяться. Щоквартальне ревʼю цінності.',
      'Start — after the audit (format 01): it provides the map we steer by. Initial term — 3 months, then monthly with 30-day notice. Prepaid monthly; up to 20% of unused hours roll over. Quarterly value review.',
    ],
    resp: [
      'Якість рішень і контроль — ми. Виконання руками та результат — ваша команда.',
      'Quality of decisions and control — us. Hands-on execution and the result — your team.',
    ],
  },
  {
    slug: 'managed',
    n: '03',
    name: ['Управління під ключ', 'Managed delivery'],
    tag: ['Трансформація', 'Transformation'],
    period: ['6–12 місяців', '6–12 months'],
    price: ['від $4,900 / міс', 'from $4,900 / mo'],
    priceNote: [
      'залежить від масштабу проєкту; фіксується після аудиту.',
      'depends on project scale; fixed after the audit.',
    ],
    promise: [
      'Проєкт ведемо ми — план, люди, бюджет і фінальна відповідальність за результат.',
      'We run the project — plan, people, budget and final accountability for the result.',
    ],
    forWhom: [
      'Нема кому вести це зсередини. Потрібен результат, а не поради — і один відповідальний за нього.',
      "There's no one to lead this from inside. You need a result, not advice — and one person accountable for it.",
    ],
    includes: [
      ['Керуємо всім проєктом: план, люди, бюджет, ризики', 'We run the whole project: plan, people, budget, risks'],
      ['Команда: ми + наші партнери з OKR і DoD; ваші люди — залучаються, де це посилює', 'Team: us + our partners with OKRs and DoD; your people join where it strengthens delivery'],
      ['KPI та RACI на кожну хвилю, транші під результат', 'KPIs and RACI for each wave, tranches tied to results'],
      ['Швидкі перемоги першої хвилі фінансують наступні', 'First-wave quick wins fund the ones that follow'],
      ['Щомісячна звітність власнику: цифри проти плану', 'Monthly reporting to the owner: numbers against plan'],
    ],
    format: [
      'Старт — тільки після аудиту (формат 01): без діагностики керувати проєктом означає вести його навмання.',
      'Start — only after the audit (format 01): without diagnostics, running the project means running it blind.',
    ],
    terms: [
      'Пілот — перші 3 місяці з фіксованими KPI першої хвилі; далі 6–12 міс. Продовження — рішення за цифрами. Опційно — бонус за результат (% від приросту, у договорі).',
      'Pilot — the first 3 months with fixed first-wave KPIs; then 6–12 mo. Renewal — a decision by the numbers. Optionally — a performance bonus (% of the uplift, in the contract).',
    ],
    resp: ['Фінальна відповідальність за результат — на нас.', 'Final responsibility for the result — on us.'],
  },
];

/** Підстановки, які дозволені в текстах форматів. Ключ → звідки береться число. */
export const SERVICE_COUNTS = ['audits', 'domains'] as const;
export type ServiceCounts = Record<(typeof SERVICE_COUNTS)[number], number>;

/**
 * Підставляє числа складу аудиту. Викликає та сторінка, яка й так вантажить
 * таксономію; блок на головній цих рядків не показує й лишається легким.
 */
export const fillCounts = (s: string, c: ServiceCounts): string =>
  s.replace(/\{(audits|domains)\}/g, (_, k: keyof ServiceCounts) => String(c[k]));

export const serviceBySlug = (slug: string | undefined): ServiceModel | undefined =>
  SERVICES.find((s) => s.slug === slug);

/** Адреса сторінки формату. Один вираз замість рядків, зібраних руками. */
export const servicePath = (s: Pick<ServiceModel, 'slug'>): string => `/services/${s.slug}`;

/**
 * Порівняння форматів поруч — головний інструмент вибору.
 *
 * Жив на окремій сторінці «Ціни», яка описувала ті самі три формати, що й
 * сторінка послуг: два пункти меню на одну сутність. Таблиця переїхала сюди,
 * сторінка цін пішла. Порядок значень завжди 01 → 02 → 03, як у SERVICES.
 */
export type CompareRow = { k: P; v: [P, P, P] };

export const COMPARE: CompareRow[] = [
  {
    k: ['Відповідає за результат', 'Accountable for the result'],
    v: [['Ваша команда', 'Your team'], ['Ви · ми за якість рішень', 'You · us for decision quality'], ['Ми', 'Us']],
  },
  {
    k: ['Хто виконує руками', 'Who does the hands-on work'],
    v: [['Ваша команда', 'Your team'], ['Ваша під нашим контролем', 'Yours, under our control'], ['Ми + партнери', 'Us + partners']],
  },
  {
    k: ['Що потрібно від вас', 'What we need from you'],
    v: [['Дані й доступи', 'Data and access'], ['Проджект + виконавці', 'A project lead + doers'], ['Рішення та бюджет', 'Decisions and budget']],
  },
  {
    k: ['Модель оплати', 'Payment model'],
    v: [['Фіксована за проєкт', 'Fixed per project'], ['$50/год · мін. 30 год', '$50/hr · min. 30 hrs'], ['від $4,900/міс', 'from $4,900/mo']],
  },
  {
    k: ['Мінімальний вхід', 'Minimum entry'],
    v: [['$2,900', '$2,900'], ['$1,500/міс', '$1,500/mo'], ['$4,900/міс', '$4,900/mo']],
  },
  {
    k: ['Мінімальний термін', 'Minimum term'],
    v: [['Разово', 'One-off'], ['3 місяці', '3 months'], ['Пілот 3 міс', 'Pilot 3 mo']],
  },
  {
    k: ['Аудит зараховується', 'Audit credited'],
    v: [['—', '—'], ['50% у 1-й місяць', '50% in month 1'], ['100% у 1-й місяць', '100% in month 1']],
  },
];
