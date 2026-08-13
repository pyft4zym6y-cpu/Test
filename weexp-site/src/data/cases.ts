/** Кейси — єдине джерело правди (з CRM/ERP/GA4). /cases, /cases/:slug.
 *  Структура кейсу — фірмова: BEFORE → DIAGNOSIS → MONEY → BUILD → AFTER → INDEPENDENCE → LEARNING.
 *  LEARNING робить кожен кейс частиною інтелектуального капіталу WEEXP (knowledge flywheel).
 */
export type Metric = { label: string; before: string; after: string; note?: string };

export type Challenge = 'Growth' | 'Profitability' | 'Operations' | 'CRM' | 'Marketplace' | 'EU' | 'Team' | 'Infrastructure';
export type Stage = 'Diagnose' | 'Build' | 'Scale' | 'Independence';
export type ResultTag = 'Revenue' | 'EBITDA' | 'CAC' | 'Retention' | 'OwnerLoad';

export type CaseStudy = {
  slug: string;
  cat: string;
  name: string;
  hero: string;
  heroLabel: string;
  window: string;
  lead: string;
  challenges: Challenge[];
  stage: Stage;
  results: ResultTag[];
  before: string;          // що було
  diagnosis: string[];     // що знайшли
  money: string;           // скільки це коштувало бізнесу
  system: string[];        // що побудували
  metrics: Metric[];       // до → після
  after: string;           // що змінилось
  independence: string;    // що клієнт може без WEEXP
  learning: string;        // чого кейс навчив систему WEEXP
};

export const CASES: CaseStudy[] = [
  {
    slug: 'premium-textile',
    cat: 'Home & Decor · UA → EU',
    name: 'Преміум-текстиль',
    hero: '×18', heroLabel: 'оборот за 18 місяців', window: '18 місяців · ROI 3.8×',
    lead: 'Флагманський кейс: із локального магазину — у бренд з обігом €900K і конверсією топ-1% сегмента.',
    challenges: ['Growth', 'CRM', 'EU'], stage: 'Independence', results: ['Revenue', 'Retention', 'CAC'],
    before: 'Локальний магазин: оборот €48K/рік, конверсія 0,8%, увесь трафік викуповувався рекламою.',
    diagnosis: [
      'Повторні покупки 12%, органіка 5%, email не приносив нічого.',
      'Рішення ухвалювались наосліп: жодної наскрізної аналітики.',
    ],
    money: 'До €288K маржі на рік недоотримувалось через відсутність системи.',
    system: [
      '7 шарів Commerce OS: від архітектури каталогу до retention-двигуна.',
      'CRO-програма: конверсія 0,8% → 4,2% (норма сегмента 0,7–1,5%).',
      'Органіка як актив: частка безкоштовного трафіку 45%.',
      'Retention: email + сегментація підняли повторні з 12% до 28%.',
    ],
    metrics: [
      { label: 'Оборот/рік', before: '€48K', after: '€900K', note: '×18' },
      { label: 'Конверсія', before: '0,8%', after: '4,2%', note: 'топ-1%' },
      { label: 'ROAS', before: '2,1×', after: '4,8×' },
      { label: 'Повторні', before: '12%', after: '28%' },
      { label: 'Органіка', before: '5%', after: '45%' },
      { label: 'Email-частка', before: '0%', after: '18%' },
    ],
    after: 'ROI 3.8× (€288K маржі на €75K інвестицій), стабільний топ-1% конверсії сегмента.',
    independence: 'Система росту працює без щоденної участі засновника.',
    learning: 'CRO + retention дають більший важіль, ніж нарощування рекламного бюджету.',
  },
  {
    slug: 'consumer-dtc',
    cat: 'Beauty / DTC · Forbes TOP-250',
    name: 'Consumer DTC-бренд',
    hero: '+65%', heroLabel: 'до обороту за 9 місяців', window: '2023–2025 · 6 ринків',
    lead: 'Споживчий бренд із Forbes TOP-250: масштабування на 6 ринків ЄС і США з перебудовою retention.',
    challenges: ['Growth', 'Operations', 'EU'], stage: 'Scale', results: ['Revenue', 'Retention'],
    before: 'Forbes TOP-250, але зростання коштувало дедалі дорожче: CAC $40–50, повторні 14,7%.',
    diagnosis: [
      'Стартова конверсія 0,64% — трафік не окупався системно.',
      'ERP і склад не встигали за амбіціями виходу на нові ринки.',
    ],
    money: 'Кожен новий ринок відкладався через операційні вузькі місця.',
    system: [
      'Retention-двигун: повторні покупки 14,7% → 60%.',
      'Вихід на 6 ринків: US · DE · FR · ES · IT · UK з єдиним контуром даних.',
      'ERP-ефективність +40%: операції перестали гальмувати продажі.',
    ],
    metrics: [
      { label: 'Продажі', before: 'база', after: '+65%', note: '9 міс' },
      { label: 'Повторні', before: '14,7%', after: '60%' },
      { label: 'ERP-ефективність', before: 'база', after: '+40%' },
      { label: 'Ринки', before: '1', after: '6' },
    ],
    after: '+65% до продажів за 9 місяців і масштабована операційна база під експансію.',
    independence: 'Операційна база тримає 6 ринків без ручного режиму.',
    learning: 'Retention — це маржа, яка вже у вас є; вона дешевша за нове залучення.',
  },
  {
    slug: 'fashion-apparel',
    cat: 'Fashion · Program of Record',
    name: 'Fashion-виробник',
    hero: '≥19 млн ₴', heroLabel: 'недоотриманого обороту на рік', window: 'програма 12 місяців',
    lead: 'Діагностика знайшла ≥19 млн ₴/рік розриву. Побудова системи з окупністю 4–8 місяців.',
    challenges: ['Profitability', 'Operations', 'EU'], stage: 'Diagnose', results: ['Revenue', 'EBITDA'],
    before: 'Оборот 23,2 млн ₴, але 18% замовлень не доходили до викупу. Європа — 0%.',
    diagnosis: [
      'Оплата заявок 63,4%, викуп 82% — гроші губились у логістиці й комунікації.',
      'SEO на позиції 14; готовий під експорт продукт без виходу в ЄС.',
    ],
    money: '≥19 млн ₴/рік недоотриманого обороту — оформлено в бюджет $56–79K з окупністю 4–8 міс.',
    system: [
      'Дорожня карта під DoD: конверсія 3,9% → 4,3–4,5%.',
      'Оплата заявок 63,4% → ≥75%, викуп 82% → ≥88%.',
      'SEO з позиції 14 у топ-5; вихід у Європу 0% → 12–18%.',
    ],
    metrics: [
      { label: 'Оборот', before: '23,2 млн ₴', after: '×2–2,5', note: 'ціль' },
      { label: 'Конверсія', before: '3,9%', after: '4,3–4,5%' },
      { label: 'Оплата заявок', before: '63,4%', after: '≥75%' },
      { label: 'Викуп', before: '82%', after: '≥88%' },
      { label: 'Європа', before: '0%', after: '12–18%' },
    ],
    after: 'Програма з окупністю 4–8 місяців і планом ×2–2,5 до обороту.',
    independence: 'План під DoD, який команда клієнта виконує самостійно.',
    learning: 'Найбільший розрив часто не в маркетингу, а в логістиці й викупі замовлень.',
  },
  {
    slug: 'fmcg-distribution',
    cat: 'FMCG · Дистрибуція',
    name: 'FMCG-дистриб’ютор',
    hero: '17K', heroLabel: 'SKU під контролем системи', window: 'національний масштаб',
    lead: 'Дистрибуція beauty-брендів: 17 000 SKU зведені в керований контур CRM + ERP.',
    challenges: ['Operations', 'CRM', 'Marketplace'], stage: 'Build', results: ['Revenue', 'OwnerLoad'],
    before: '17 000 SKU у таблицях; CRM і склад працювали окремо.',
    diagnosis: [
      'Втрати на стиках процесів при кожному замовленні.',
      'Масштаб на UA · PL · NL · CY гальмувався ручними операціями.',
    ],
    money: 'Ручні операції з’їдали маржу й час власника на кожному замовленні.',
    system: [
      'CRM-ефективність +25%: клієнтські дані стали активом.',
      'ERP + аналітика попиту звели 17K SKU у керований контур.',
      'Продажі +40% на національному масштабі.',
    ],
    metrics: [
      { label: 'Продажі', before: 'база', after: '+40%' },
      { label: 'CRM-ефективність', before: 'база', after: '+25%' },
      { label: 'SKU під контролем', before: '—', after: '17 000' },
      { label: 'Ринки', before: 'UA', after: 'UA·PL·NL·CY' },
    ],
    after: 'Керований асортимент із 17 000 SKU і +40% до продажів.',
    independence: 'Операційний контур працює без ручного втручання власника.',
    learning: 'ERP + CRM в одному контурі знімає операційне навантаження з власника.',
  },
];

export const caseBySlug = (slug: string) => CASES.find((c) => c.slug === slug);

export const CHALLENGES: Challenge[] = ['Growth', 'Profitability', 'Operations', 'CRM', 'Marketplace', 'EU', 'Team', 'Infrastructure'];
export const STAGES: Stage[] = ['Diagnose', 'Build', 'Scale', 'Independence'];
