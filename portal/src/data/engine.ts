/**
 * Данные Decision Engine: уровни достоверности, лестницы зрелости,
 * причинно-следственные цепочки, граф зависимостей метрик, пререквизиты плейбуков.
 * Первоисточник подходов — portal/method/references/decision_engine.md.
 */

/* ── Evidence Levels: уровень достоверности каждого факта ── */
export type EvidenceLevel = 'E0' | 'E1' | 'E2' | 'E3' | 'E4';

export const EVIDENCE: Record<EvidenceLevel, { label: string; trust: number; color: string }> = {
  E0: { label: 'догадка', trust: 25, color: '#dc2626' },
  E1: { label: 'со слов клиента', trust: 50, color: '#b45309' },
  E2: { label: 'документ', trust: 75, color: '#4d7c0f' },
  E3: { label: 'данные системы', trust: 90, color: '#4d7c0f' },
  E4: { label: 'несколько источников', trust: 100, color: '#4d7c0f' },
};

/** Источник рычага baseline → уровень достоверности. */
export function evidenceForSource(source?: string): EvidenceLevel {
  if (!source) return 'E1';
  if (source === 'Оценка клиента') return 'E1';
  return 'E3'; // GA4 / CRM / Выгрузка заказов / Кабинет площадки
}

/* ── Capability Maturity: 18 доменов × L0–L5 (первоисточник: method/references/capability_maturity.md) ── */
import capabilityRaw from './capability.json';
import pbDepsRaw from './pb-deps.json';
import { MATURITY_DOMAINS } from './method';

export type Ladder = { domain: string; sheets: string[]; levels: string[] }; // L1…L5
export const LADDERS: Ladder[] = (capabilityRaw as { domain: string; levels: string[] }[]).map((c) => ({
  domain: c.domain,
  sheets: MATURITY_DOMAINS.find((m) => m.domain === c.domain)?.sheets ?? [],
  levels: c.levels,
}));

/** 0 = возможности нет вообще (L0 метода). Уровень — по здоровью домена. */
export const levelFromHealth = (h: number): 0 | 1 | 2 | 3 | 4 | 5 =>
  h < 0.05 ? 0 : h < 0.2 ? 1 : h < 0.4 ? 2 : h < 0.6 ? 3 : h < 0.8 ? 4 : 5;

/* ── Причинно-следственные цепочки: симптом → корни → влияние ── */
export type CausalChain = {
  id: string;
  symptom: string;
  painId?: string; // связь с болью клиента
  roots: { cause: string; checkQids: string[] }[];
  businessImpact: string;
  lever: string; // на какой рычаг модели выручки давит
};

export const CAUSAL_CHAINS: CausalChain[] = [
  {
    id: 'CC-1', symptom: 'Мало повторных покупок / низкий LTV', painId: 'low_repeat',
    roots: [
      { cause: 'Нет CRM-контура (сегменты, цепочки)', checkQids: ['CR-004', 'CR-001'] },
      { cause: 'Ассортимент не даёт повода вернуться', checkQids: ['PD-005', 'CO-028'] },
      { cause: 'Опыт доставки/сервиса отбивает желание', checkQids: ['CU-011', 'CX-003'] },
    ],
    businessImpact: 'LTV низкий → CAC не окупается → рост только за счёт дорожающей рекламы',
    lever: 'repeat',
  },
  {
    id: 'CC-2', symptom: 'Реклама дорожает, прибыль не растёт', painId: 'ads_expensive',
    roots: [
      { cause: 'Юнит-экономика не считается — льём в убыток', checkQids: ['FI-002', 'FI-127'] },
      { cause: 'Атрибуция кривая — бюджет не туда', checkQids: ['MK-011', 'AN-002'] },
      { cause: 'Вся выручка от новых — нет дешёвой повторной', checkQids: ['CR-001', 'CO-015'] },
    ],
    businessImpact: 'CAC растёт быстрее AOV → маржа тает при росте оборота',
    lever: 'cr',
  },
  {
    id: 'CC-3', symptom: 'Низкая конверсия сайта', painId: 'low_conversion',
    roots: [
      { cause: 'Скорость/мобильный опыт ниже конкурентов', checkQids: ['PL-009'] },
      { cause: 'Карточка/чекаут не снимают возражения', checkQids: ['PX-013', 'SE-009'] },
      { cause: 'Трафик нецелевой', checkQids: ['MK-011'] },
    ],
    businessImpact: 'Платите за трафик, который не конвертируется → CAC ×2–3 от возможного',
    lever: 'cr',
  },
  {
    id: 'CC-4', symptom: 'Решения без цифр', painId: 'no_data',
    roots: [
      { cause: 'Нет единого источника правды', checkQids: ['AN-003', 'AN-002'] },
      { cause: 'Нет управленческого P&L', checkQids: ['FI-001', 'FI-014'] },
    ],
    businessImpact: 'Каждое решение — лотерея; ошибки видны через месяцы, а не дни',
    lever: 'aov',
  },
  {
    id: 'CC-5', symptom: 'Упёрлись в потолок роста', painId: 'no_scale',
    roots: [
      { cause: 'Операции вручную — рост ×2 ломает исполнение', checkQids: ['SL-012', 'OP-009'] },
      { cause: 'Один канал даёт большую часть выручки', checkQids: ['CO-006', 'CO-007'] },
      { cause: 'Нет команды/владельцев KPI', checkQids: ['GV-003'] },
    ],
    businessImpact: 'Рост оборота повышает хаос, а не прибыль — команда тушит пожары',
    lever: 'traffic',
  },
  {
    id: 'CC-6', symptom: 'Кассовые разрывы при растущем обороте', painId: 'cashflow',
    roots: [
      { cause: 'Деньги заморожены в неликвидном стоке', checkQids: ['CO-028', 'PD-005'] },
      { cause: 'Нет календаря денег и сценариев', checkQids: ['FI-124', 'FI-014'] },
    ],
    businessImpact: 'Оборот есть — денег нет; закупка следующей партии срывается',
    lever: 'aov',
  },
];

/* ── Граф зависимостей метрик (что на что влияет) ── */
export const METRIC_DEPS: { from: string; to: string; note: string }[] = [
  { from: 'SEO', to: 'Трафик', note: 'бесплатный устойчивый канал' },
  { from: 'Реклама', to: 'Трафик', note: 'платный, дорожает' },
  { from: 'Скорость сайта', to: 'Конверсия', note: 'LCP > 4c — минус конверсия на мобильном' },
  { from: 'UX/карточка', to: 'Конверсия', note: 'возражения снимает контент' },
  { from: 'Трафик × Конверсия × Чек', to: 'Новая выручка', note: 'воронка, множители' },
  { from: 'CRM-контур', to: 'Повторные', note: 'цепочки возвращают базу' },
  { from: 'Опыт доставки', to: 'Повторные', note: 'NPS → возврат клиента' },
  { from: 'Повторные', to: 'LTV', note: 'частота × срок жизни' },
  { from: 'LTV', to: 'Допустимый CAC', note: 'LTV:CAC ≥ 3 — рычаг масштабирования рекламы' },
  { from: 'Юнит-экономика', to: 'Прибыль', note: 'знаем, что масштабировать' },
  { from: 'ERP/операции', to: 'Масштабируемость', note: 'рост без роста ошибок' },
];

/* ── Пререквизиты плейбуков: из method/data/playbook_dependencies.json (24 ребра, с «почему») ── */
type Dep = { before: string; after: string; why: string };
export const PB_DEPS = pbDepsRaw as Dep[];
export const PB_PREREQS: Record<string, string[]> = {};
export const PB_DEP_WHY: Record<string, string> = {};
for (const d of PB_DEPS) {
  (PB_PREREQS[d.after] ??= []).push(d.before);
  PB_DEP_WHY[`${d.before}→${d.after}`] = d.why;
}
