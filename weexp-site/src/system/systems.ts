/**
 * Системи WEEXP (8 напрямів), їхні підписи двома мовами й форматування грошей.
 * Винесено з lossModel окремим модулем БЕЗ залежностей: адмінці потрібні лише
 * `eur()` та підписи, а імпорт з lossModel тягнув за собою всю модель втрат.
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

/** Форматування суми в євро — єдине місце на весь продукт. */
export const eur = (n: number) => '€' + Math.round(n).toLocaleString('en-US');

