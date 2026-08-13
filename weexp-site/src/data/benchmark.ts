/**
 * WEEXP Benchmark — де стоїть ваш e-commerce відносно норми сегмента.
 * Профіль (індустрія × оборот × гео × модель) → Benchmark → Gap → Opportunity.
 * Значення — орієнтовні норми сегментів (не персональні дані клієнта); для точного
 * розрахунку веде на X-Ray / повний Diagnosis. Метрики: конверсія, повторні, органіка, LTV:CAC.
 */
export type Metric = { key: string; label: string; unit: string; typical: number; norm: number; gold: number };
export type Industry = { key: string; label: string; metrics: Metric[] };

export const INDUSTRIES: Industry[] = [
  { key: 'beauty', label: 'Beauty / Косметика', metrics: [
    { key: 'cr', label: 'Конверсія', unit: '%', typical: 1.1, norm: 2.2, gold: 3.6 },
    { key: 'repeat', label: 'Повторні покупки', unit: '%', typical: 18, norm: 35, gold: 55 },
    { key: 'organic', label: 'Органіка', unit: '%', typical: 12, norm: 30, gold: 45 },
    { key: 'ltvcac', label: 'LTV:CAC', unit: '×', typical: 1.8, norm: 3.0, gold: 4.5 },
  ]},
  { key: 'fashion', label: 'Fashion / Одяг', metrics: [
    { key: 'cr', label: 'Конверсія', unit: '%', typical: 1.3, norm: 2.4, gold: 4.2 },
    { key: 'repeat', label: 'Повторні покупки', unit: '%', typical: 20, norm: 32, gold: 48 },
    { key: 'organic', label: 'Органіка', unit: '%', typical: 14, norm: 30, gold: 45 },
    { key: 'ltvcac', label: 'LTV:CAC', unit: '×', typical: 1.9, norm: 3.0, gold: 4.0 },
  ]},
  { key: 'home', label: 'Home & Decor', metrics: [
    { key: 'cr', label: 'Конверсія', unit: '%', typical: 0.8, norm: 1.5, gold: 4.2 },
    { key: 'repeat', label: 'Повторні покупки', unit: '%', typical: 12, norm: 26, gold: 40 },
    { key: 'organic', label: 'Органіка', unit: '%', typical: 8, norm: 28, gold: 45 },
    { key: 'ltvcac', label: 'LTV:CAC', unit: '×', typical: 1.6, norm: 3.0, gold: 4.8 },
  ]},
  { key: 'fmcg', label: 'FMCG / Дистрибуція', metrics: [
    { key: 'cr', label: 'Конверсія', unit: '%', typical: 1.4, norm: 2.6, gold: 4.0 },
    { key: 'repeat', label: 'Повторні покупки', unit: '%', typical: 25, norm: 45, gold: 62 },
    { key: 'organic', label: 'Органіка', unit: '%', typical: 15, norm: 32, gold: 46 },
    { key: 'ltvcac', label: 'LTV:CAC', unit: '×', typical: 2.1, norm: 3.2, gold: 4.5 },
  ]},
  { key: 'electronics', label: 'Electronics', metrics: [
    { key: 'cr', label: 'Конверсія', unit: '%', typical: 1.0, norm: 1.8, gold: 3.2 },
    { key: 'repeat', label: 'Повторні покупки', unit: '%', typical: 10, norm: 22, gold: 38 },
    { key: 'organic', label: 'Органіка', unit: '%', typical: 16, norm: 34, gold: 50 },
    { key: 'ltvcac', label: 'LTV:CAC', unit: '×', typical: 1.7, norm: 3.0, gold: 4.2 },
  ]},
  { key: 'food', label: 'Food & Health', metrics: [
    { key: 'cr', label: 'Конверсія', unit: '%', typical: 1.5, norm: 2.8, gold: 4.4 },
    { key: 'repeat', label: 'Повторні покупки', unit: '%', typical: 28, norm: 50, gold: 68 },
    { key: 'organic', label: 'Органіка', unit: '%', typical: 14, norm: 30, gold: 44 },
    { key: 'ltvcac', label: 'LTV:CAC', unit: '×', typical: 2.0, norm: 3.2, gold: 4.6 },
  ]},
];

export const REVENUE_BANDS = [
  { key: 'a', label: '$0.5–1M', opp: '15–25%' },
  { key: 'b', label: '$1–3M', opp: '20–35%' },
  { key: 'c', label: '$3–10M', opp: '25–45%' },
];

export const GEOS = [
  { key: 'ua', label: 'Україна' },
  { key: 'eu', label: 'ЄС' },
  { key: 'us', label: 'США' },
];

export const MODELS = [
  { key: 'dtc', label: 'DTC / власний сайт' },
  { key: 'mp', label: 'Маркетплейси' },
  { key: 'retail', label: 'Ритейл / дистрибуція' },
];

export const industryByKey = (k: string) => INDUSTRIES.find((i) => i.key === k) ?? INDUSTRIES[0];
export const bandByKey = (k: string) => REVENUE_BANDS.find((b) => b.key === k) ?? REVENUE_BANDS[0];
