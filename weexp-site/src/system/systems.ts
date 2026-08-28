/**
 * Системи WEEXP (8 напрямів), їхні підписи двома мовами й форматування грошей.
 * Винесено з lossModel окремим модулем БЕЗ залежностей: адмінці потрібні лише
 * `money()` та підписи, а імпорт з lossModel тягнув за собою всю модель втрат.
 * Виграш у вазі невеликий (основа першого екрана /admin — це SDK Supabase),
 * але залежність тепер чесна: адмінка не залежить від калькулятора.
 */
export type SysKey = 'strategy' | 'commercial' | 'customer' | 'experience' | 'operations' | 'data' | 'org' | 'expansion';

export type Lang = 'uk' | 'en';

export const SYS: { key: SysKey; label: string; node: number }[] = [
  { key: 'strategy', label: 'Стратегія та управління', node: 0 },
  { key: 'commercial', label: 'Комерційна ефективність', node: 1 },
  { key: 'customer', label: 'Попит і клієнт', node: 2 },
  { key: 'experience', label: 'Досвід і конверсія', node: 3 },
  { key: 'operations', label: 'Операції та fulfillment', node: 4 },
  { key: 'data', label: 'Дані та технології', node: 5 },
  { key: 'org', label: 'Організація', node: 6 },
  { key: 'expansion', label: 'Експансія та ринки', node: 7 },
];

/** Англійські підписи систем (порядок і ключі — як у SYS). */
export const SYS_LABEL_EN: Record<SysKey, string> = {
  strategy: 'Strategy & Management',
  commercial: 'Commercial Performance',
  customer: 'Demand & Customer',
  experience: 'Experience & Conversion',
  operations: 'Operations & Fulfillment',
  data: 'Data & Technology',
  org: 'Organization',
  expansion: 'Expansion & Markets',
};

/** Локалізований підпис однієї системи за ключем. */
export const sysLabel = (key: SysKey, lang: Lang): string =>
  lang === 'en' ? SYS_LABEL_EN[key] : SYS.find((s) => s.key === key)!.label;

/** Локалізований масив SYS (той самий порядок/ключі/node, лише label мовою). */
export const localizeSys = (lang: Lang) => SYS.map((s) => ({ ...s, label: sysLabel(s.key, lang) }));

/** Ніша бізнесу — визначає, до яких еталонів порівнюємо метрики. */
export const ACTION: Record<SysKey, string> = {
  strategy: 'Задати модель росту й управлінський цикл: цілі → декомпозиція → факт → дії.',
  commercial: 'Керувати конверсією, чеком і маржею за юніт-економікою, а не оборотом.',
  customer: 'Побудувати retention і attribution: RFM, win-back, abandoned cart, LTV/CAC.',
  experience: 'Прибрати конверсійні витоки: каталог, картка, checkout, mobile, CRO/A-B.',
  operations: 'Поставити SLA обробки, викуп/доставку й контроль повернень — від кошика до returns.',
  data: 'Наскрізна аналітика + єдиний master data: одні цифри для всіх рішень.',
  org: 'Операційна модель: ролі, RACI, KPI, SOP — щоб бізнес працював без героя.',
  expansion: 'Вихід у ЄС/США як окремий контур: Allegro, Amazon і локальні майданчики.',
};

export const ACTION_EN: Record<SysKey, string> = {
  strategy: 'Set the growth model and management cycle: goals → breakdown → actuals → actions.',
  commercial: 'Manage conversion, order value and margin by unit economics, not turnover.',
  customer: 'Build retention and attribution: RFM, win-back, abandoned cart, LTV/CAC.',
  experience: 'Close conversion leaks: catalog, product card, checkout, mobile, CRO/A-B.',
  operations: 'Set processing SLAs, buy-out/delivery and returns control — from cart to returns.',
  data: 'End-to-end analytics + a single master data: one set of numbers for every decision.',
  org: 'Operating model: roles, RACI, KPIs, SOPs — so the business runs without a hero.',
  expansion: 'Enter the EU/US as a separate track: Allegro, Amazon and local marketplaces.',
};

/** Локалізований текст пріоритетної дії за ключем системи. */
export const actionText = (key: SysKey, lang: Lang): string => (lang === 'en' ? ACTION_EN : ACTION)[key];

/**
 * Гроші. Валюта — ОБОВʼЯЗКОВИЙ аргумент, і це навмисно.
 *
 * Раніше була функція `eur()`: калькулятор приймав тільки євро, і український
 * власник мусив переводити свій виторг у євро, щоб скористатися безкоштовним
 * інструментом, а потім переводити результат назад. Зробити валюту «просто
 * підписом» не можна: сума зберігається в заявці, і її потім читають кабінет,
 * адмінка й PDF — адмін побачив би € на числах, які клієнт вводив у гривні.
 *
 * Тому валюта живе в самій заявці, а тут її не можна не передати: підпис без
 * значення за замовчуванням змушує компілятор показати кожне місце, де гроші
 * малюються, не знаючи, чиї вони.
 *
 * Курсів у продукті немає і не вигадуємо: суми в різних валютах не додаються
 * (див. groupByCur нижче).
 */
export type Cur = 'UAH' | 'USD' | 'EUR' | 'PLN';

export const CURRENCIES: { code: Cur; sign: string; uk: string; en: string }[] = [
  { code: 'UAH', sign: '₴', uk: 'Гривня', en: 'Hryvnia' },
  { code: 'USD', sign: '$', uk: 'Долар', en: 'US dollar' },
  { code: 'EUR', sign: '€', uk: 'Євро', en: 'Euro' },
  { code: 'PLN', sign: 'zł', uk: 'Злотий', en: 'Zloty' },
];

/** Записи, зроблені до появи вибору, були в євро — це і є замовчування. */
export const DEFAULT_CUR: Cur = 'EUR';

export const isCur = (v: unknown): v is Cur => CURRENCIES.some((c) => c.code === v);
/** Валюта запису; невідоме або відсутнє значення читається як історичне євро. */
export const curOf = (v: unknown): Cur => (isCur(v) ? v : DEFAULT_CUR);
export const signOf = (c: Cur): string => CURRENCIES.find((x) => x.code === c)!.sign;

// Гривня і злотий пишуться ПІСЛЯ числа й групуються пробілом — так їх пишуть
// удома. Долар і євро — перед числом, комою.
//
// Групуємо самі, а не через toLocaleString: дані ICU в різних збірках Node і
// в різних браузерах різні. У цій збірці 'pl-PL' повертав «1200» без пробілу —
// тобто той самий код малював би суму по-різному в різних місцях.
const GROUP: Record<Cur, string> = { UAH: ' ', PLN: ' ', USD: ',', EUR: ',' };
const SUFFIXED: Cur[] = ['UAH', 'PLN'];

export const money = (n: number, cur: Cur): string => {
  const abs = Math.abs(Math.round(n));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, GROUP[cur]);
  const v = (Math.round(n) < 0 ? '-' : '') + grouped;
  return SUFFIXED.includes(cur) ? `${v} ${signOf(cur)}` : `${signOf(cur)}${v}`;
};

/**
 * Валюта внутрішнього обліку агентства: бюджети проєктів, тарифи, собівартість,
 * маржа. Позначена явно, бо раніше все малювалось однією функцією `eur()` і
 * гроші клієнта не відрізнялись від грошей агентства.
 *
 * Увага: публічний прайс на /pricing у доларах ($2,900 / $4,900 / $50 год),
 * а проєктний облік — у євро (так записано в supa.ts). Це розбіжність у
 * продукті, а не в коді: щоб її прибрати, треба рішення власника, у чому
 * компанія рахує свою економіку.
 */
export const AGENCY_CUR: Cur = 'EUR';

/**
 * Групування сум за валютою для зведень. Складати заявки в різних валютах без
 * курсу не можна — тому підсумок не одне число, а по числу на валюту.
 */
export const groupByCur = <T>(rows: T[], cur: (r: T) => Cur, amount: (r: T) => number): { cur: Cur; total: number; n: number }[] => {
  const m = new Map<Cur, { total: number; n: number }>();
  for (const r of rows) {
    const c = cur(r); const cell = m.get(c) ?? { total: 0, n: 0 };
    cell.total += amount(r); cell.n += 1; m.set(c, cell);
  }
  return CURRENCIES.map((c) => c.code).filter((c) => m.has(c)).map((c) => ({ cur: c, ...m.get(c)! }));
};

