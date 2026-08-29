/**
 * Loss Calculator — прозора модель оцінки втрат e-commerce. Свідомо НЕ фінансовий
 * аудит: порядок величини за наданими даними + бенчмарками, з чіткою позначкою
 * «estimate». Логіка ланцюгова: втрати важелів не складаються напряму (сумарна
 * можливість = найбільший важіль + частка решти), як і в методі WEEXP.
 */

import { SYS, SYS_LABEL_EN, sysLabel, ACTION, ACTION_EN, money, curOf, type SysKey, type Lang, type Cur } from './systems';
import { AUTONOMY_W } from '@/data/xray';
// Реекспорт: решта продукту історично тягне ці імена з lossModel.
export { SYS, SYS_LABEL_EN, sysLabel, localizeSys, actionText, money, curOf, signOf, CURRENCIES, DEFAULT_CUR, groupByCur } from './systems';
export type { Cur } from './systems';
export type { SysKey, Lang } from './systems';

export type NicheKey = 'fashion' | 'beauty' | 'electronics' | 'home' | 'kids' | 'sports' | 'health' | 'food' | 'auto' | 'jewelry' | 'hobby' | 'digital' | 'b2b' | 'other';
/** Сезонність поточного місяця: типовий / піковий (вище) / низький. */
export type Season = 'typical' | 'high' | 'low';

/** Швидкі «так/ні» — живі сигнали для систем, які не мають числових метрик
 *  (стратегія / дані / організація / експансія). undefined = не відповіли. */
export type Signals = { mgmtCycle?: boolean; analytics?: boolean; ownerFree?: boolean; exportSales?: boolean };

export type LossInput = {
  monthlyRevenue: number; aov: number; conversion: number; repeatRate: number;
  returnsRate: number; grossMargin: number; cac: number; symptoms: SysKey[];
  niche?: NicheKey;       // ніша — обирає набір бенчмарків (без ніші — універсальні)
  seasonal?: Season;      // чи типовий цей місяць за виторгом (корекція річної бази)
  signals?: Signals;      // швидкі так/ні → Health стратегії/даних/орг/експансії
  currency?: Cur;         // валюта введених сум; читається курсів немає — суми не конвертуються
};

export type Leak = { key: SysKey; label: string; labelEn: string; amount: number };
export type Health = { key: SysKey; label: string; score: number };
export type Confidence = 'high' | 'medium' | 'low';
export type LossResult = {
  annualRevenue: number;
  leaks: Leak[]; total: number; range: [number, number];
  primary: SysKey; secondary: SysKey; bottleneckNodes: number[];
  health: Health[]; overallHealth: number; actions: { key: SysKey; text: string }[];
  confidence: Confidence;   // повнота вхідних даних → ширина вилки та чесна позначка
};

/* ── Бенчмарки за нішами ──────────────────────────────────────────────────
 * Орієнтири з відкритих галузевих звітів (Littledata, Dynamic Yield, IRP,
 * Statista; e-commerce медіани, консервативні округлення). 'other' — універсальні
 * (історичні значення моделі). У майбутньому замінюються власною емпірикою
 * з леджера аудитів (learning-цикл воркера). */
export type Bench = { cr: number; repeat: number; returns: number; margin: number; aov: number };
export const NICHES: { key: NicheKey; uk: string; en: string }[] = [
  { key: 'fashion', uk: 'Мода й одяг', en: 'Fashion & apparel' },
  { key: 'beauty', uk: 'Косметика й бʼюті', en: 'Beauty & cosmetics' },
  { key: 'electronics', uk: 'Електроніка', en: 'Electronics' },
  { key: 'home', uk: 'Дім і меблі', en: 'Home & furniture' },
  { key: 'kids', uk: 'Дитячі товари', en: 'Kids' },
  { key: 'sports', uk: 'Спорт і активність', en: 'Sports' },
  { key: 'health', uk: 'Здоровʼя й аптека', en: 'Health & pharmacy' },
  { key: 'food', uk: 'Продукти й напої', en: 'Food & beverages' },
  { key: 'auto', uk: 'Авто й запчастини', en: 'Automotive' },
  { key: 'jewelry', uk: 'Прикраси й аксесуари', en: 'Jewelry & accessories' },
  { key: 'hobby', uk: 'Хобі та подарунки', en: 'Hobby & gifts' },
  { key: 'digital', uk: 'Цифрові товари / послуги', en: 'Digital goods / services' },
  { key: 'b2b', uk: 'B2B / опт', en: 'B2B / wholesale' },
  { key: 'other', uk: 'Інша / універсальні еталони', en: 'Other / universal benchmarks' },
];
export const NICHE_BENCH: Record<NicheKey, Bench> = {
  fashion:     { cr: 1.8, repeat: 30, returns: 18, margin: 55, aov: 80 },
  beauty:      { cr: 2.8, repeat: 40, returns: 8,  margin: 60, aov: 45 },
  electronics: { cr: 1.4, repeat: 20, returns: 8,  margin: 22, aov: 250 },
  home:        { cr: 0.9, repeat: 15, returns: 8,  margin: 45, aov: 350 },
  kids:        { cr: 2.2, repeat: 35, returns: 8,  margin: 45, aov: 60 },
  sports:      { cr: 1.7, repeat: 28, returns: 10, margin: 45, aov: 90 },
  health:      { cr: 3.2, repeat: 45, returns: 4,  margin: 35, aov: 40 },
  food:        { cr: 4.0, repeat: 50, returns: 3,  margin: 30, aov: 45 },
  auto:        { cr: 1.5, repeat: 25, returns: 6,  margin: 35, aov: 110 },
  jewelry:     { cr: 1.2, repeat: 20, returns: 8,  margin: 60, aov: 150 },
  hobby:       { cr: 2.0, repeat: 25, returns: 6,  margin: 50, aov: 55 },
  digital:     { cr: 3.5, repeat: 40, returns: 2,  margin: 80, aov: 60 },
  b2b:         { cr: 1.0, repeat: 55, returns: 3,  margin: 35, aov: 400 },
  other:       { cr: 2.5, repeat: 35, returns: 6,  margin: 45, aov: 75 },
};
export const benchFor = (n?: NicheKey): Bench => NICHE_BENCH[n || 'other'] || NICHE_BENCH.other;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const has = (s: SysKey[], k: SysKey) => s.includes(k);

/** Локалізований підпис витоку (Leak несе обидві мови). */
export const leakLabel = (l: Leak, lang: Lang): string => (lang === 'en' ? l.labelEn : l.label);

export function computeLoss(inp: LossInput): LossResult {
  const bn = benchFor(inp.niche);
  // Сезонність: піковий місяць завищує річну базу (×0.8), низький — занижує (×1.2).
  const seasonAdj = inp.seasonal === 'high' ? 0.8 : inp.seasonal === 'low' ? 1.2 : 1;
  const annual = Math.max(0, inp.monthlyRevenue) * 12 * seasonAdj;
  const sym = inp.symptoms;
  const floor = (k: SysKey, pct: number) => (has(sym, k) ? annual * pct : 0);

  // Кожен важіль рахується РІВНО ОДИН раз (без подвійного обліку):
  //   конверсія → «сайт/конверсія»; маржа+чек → «комерція»; повторні → «утримання»;
  //   CAC (лише нові замовлення) → «залучення»; повернення → «операції».

  // 1) Commercial = маржа проти еталона ніші + недобір середнього чека.
  let commercial = inp.grossMargin > 0 && inp.grossMargin < bn.margin
    ? annual * ((bn.margin - inp.grossMargin) / 100) * 0.4
    : 0;
  if (inp.aov > 0 && inp.aov < bn.aov)
    commercial += Math.min(annual * 0.15, annual * (bn.aov / inp.aov - 1) * 0.15);
  commercial = Math.max(commercial, floor('commercial', 0.12));

  // 2) Experience — єдиний власник важеля конверсії (uplift до еталона, ×0.35, стеля 40%).
  const experience = Math.max(
    inp.conversion > 0 && inp.conversion < bn.cr
      ? Math.min(annual * 0.4, annual * (bn.cr / inp.conversion - 1) * 0.35)
      : 0,
    floor('experience', 0.08),
  );

  // 3) Retention (повторні → LTV)
  const retention = Math.max(
    inp.repeatRate > 0 && inp.repeatRate < bn.repeat ? annual * ((bn.repeat - inp.repeatRate) / 100) * 0.5 : 0,
    floor('customer', 0.08),
  );

  // 4) Marketing / acquisition: CAC платиться лише за НОВІ замовлення —
  //    повторні його не несуть (інакше витік завищується на частку повторних).
  let marketing = 0;
  const contrib = inp.aov * (inp.grossMargin || bn.margin) / 100;
  if (inp.cac > 0 && inp.aov > 0 && inp.cac > contrib) {
    const orders = annual / Math.max(1, inp.aov);
    const newShare = 1 - clamp(inp.repeatRate, 0, 90) / 100;
    marketing = Math.min(annual * 0.3, (inp.cac - contrib) * orders * newShare * 0.5);
  }
  marketing = Math.max(marketing, floor('customer', 0.05));

  // 5) Operational (повернення/фулфілмент)
  const operational = Math.max(
    inp.returnsRate > bn.returns ? annual * ((inp.returnsRate - bn.returns) / 100) * (1 + (1 - (inp.grossMargin || bn.margin) / 100) * 0.5) : 0,
    floor('operations', 0.06),
  );

  const rawAll: Leak[] = [
    { key: 'commercial', label: 'Витік у комерції (маржа/чек)', labelEn: 'Commerce leak (margin/AOV)', amount: Math.round(commercial) },
    { key: 'customer', label: 'Витік у залученні', labelEn: 'Acquisition leak', amount: Math.round(marketing) },
    { key: 'operations', label: 'Витік в операціях', labelEn: 'Operations leak', amount: Math.round(operational) },
    { key: 'customer', label: 'Витік в утриманні', labelEn: 'Retention leak', amount: Math.round(retention) },
    { key: 'experience', label: 'Витік на конверсії', labelEn: 'Conversion leak', amount: Math.round(experience) },
  ];
  const raw: Leak[] = rawAll.filter((l) => l.amount > 0).sort((a, b) => b.amount - a.amount);

  // Повнота вводу → впевненість оцінки → ширина вилки (чесність замість точності).
  const filled = [inp.monthlyRevenue, inp.aov, inp.conversion, inp.repeatRate, inp.returnsRate, inp.grossMargin, inp.cac].filter((v) => v > 0).length;
  const confidence: Confidence = filled >= 6 ? 'high' : filled >= 4 ? 'medium' : 'low';
  const rangeLow = confidence === 'high' ? 0.6 : confidence === 'medium' ? 0.5 : 0.4;

  // Сумарна можливість — ланцюгова: найбільший важіль + 45% решти.
  const sorted = raw.map((l) => l.amount);
  const total = Math.round((sorted[0] ?? 0) + sorted.slice(1).reduce((s, x) => s + x, 0) * 0.45);
  const range: [number, number] = [Math.round(total * rangeLow), total];

  // Business Health (8 систем 0..100) — числові метрики відносно еталонів ніші,
  // «сліпі» системи (стратегія/дані/орг/експансія) оживляються сигналами так/ні.
  const sig = inp.signals || {};
  const health: Health[] = SYS.map(({ key, label }) => {
    let s = 55;
    if (key === 'commercial') s = clamp(50 + ((inp.grossMargin || bn.margin) - bn.margin) * 0.9 + (inp.aov > 0 ? clamp((inp.aov / bn.aov - 1) * 20, -12, 12) : 0), 5, 95);
    else if (key === 'customer') s = clamp(50 + (inp.repeatRate - bn.repeat) * 1.2, 5, 95);
    else if (key === 'experience') s = clamp(45 + (inp.conversion - bn.cr) * (25 / bn.cr), 5, 95);
    else if (key === 'operations') s = clamp(72 - (inp.returnsRate - bn.returns) * 4, 5, 95);
    else if (key === 'strategy' && sig.mgmtCycle !== undefined) s = sig.mgmtCycle ? 70 : 35;
    else if (key === 'data' && sig.analytics !== undefined) s = sig.analytics ? 70 : 32;
    else if (key === 'org' && sig.ownerFree !== undefined) s = sig.ownerFree ? 72 : 30;
    else if (key === 'expansion' && sig.exportSales !== undefined) s = sig.exportSales ? 65 : 45;
    if (has(sym, key)) s -= 22;
    return { key, label, score: Math.round(clamp(s, 5, 98)) };
  });
  /* Ваги — з data/xray (AUTONOMY_W). Тут стояла їхня друга копія: ті самі
     вісім чисел і та сама формула, лише підсумок звався інакше. */
  const wsum = Object.values(AUTONOMY_W).reduce((a, b) => a + b, 0);
  const overallHealth = Math.round(health.reduce((a, h) => a + h.score * AUTONOMY_W[h.key], 0) / wsum);

  // Bottleneck — за втратами (система з найбільшим витоком) + слабкі за Health.
  const byLeak = [...raw];
  const primary = byLeak[0]?.key ?? [...health].sort((a, b) => a.score - b.score)[0].key;
  const weak = [...health].sort((a, b) => a.score - b.score);
  const secondary = (byLeak[1]?.key && byLeak[1].key !== primary) ? byLeak[1].key : (weak.find((h) => h.key !== primary)?.key ?? 'operations');
  const bottleneckNodes = Array.from(new Set([primary, secondary].map((k) => SYS.find((s) => s.key === k)!.node)));

  const actionKeys = Array.from(new Set([primary, secondary, ...weak.map((h) => h.key)])).slice(0, 3);
  const actions = actionKeys.map((k) => ({ key: k, text: ACTION[k] }));

  return { annualRevenue: annual, leaks: raw, total, range, primary, secondary, bottleneckNodes, health, overallHealth, actions, confidence };
}


/* ── Проєкція «Зараз → Куди можемо прийти» ─────────────────────────────────
 * Не обіцянка, а КОНСЕРВАТИВНА ціль за 6–9 місяців системної роботи: беремо
 * поточні метрики клієнта й підтягуємо їх до бенчмарків (не далі), а приріст
 * доходу обмежуємо вже порахованою можливістю (total) — щоб «до/після» не
 * розходилось із цифрою витоку. Психологія: клієнт бачить не абстрактну втрату,
 * а конкретне майбутнє (день/місяць/рік, час, юніт-економіка) — і своє «Б». */
export type Delta = { label: string; before: string; after: string; pct: number; dir: 'up' | 'down'; hero?: boolean };
export type Projection = { income: Delta[]; unit: Delta[]; ops: Delta[]; upliftPct: number; horizon: string };

const r1 = (n: number) => Math.round(n * 10) / 10;
const pctUp = (a: number, b: number) => (a > 0 ? Math.round((b / a - 1) * 100) : 0);
const pctDown = (a: number, b: number) => (a > 0 ? Math.round((1 - b / a) * 100) : 0);

export function project(inp: LossInput, res: LossResult, lang: Lang = 'uk'): Projection {
  const L = (uk: string, en: string) => (lang === 'en' ? en : uk);
  const bn = benchFor(inp.niche);
  const nowM = Math.max(0, inp.monthlyRevenue);
  const nowA = nowM * 12;

  // Цільові метрики — тягнемось до бенчмарку СВОЄЇ ніші, але реалістично (не «в космос»).
  const crNow = inp.conversion;
  const crTgt = crNow > 0 ? r1(clamp(crNow * 1.55, crNow + 0.3, Math.max(bn.cr, crNow * 1.15))) : bn.cr;
  const repNow = inp.repeatRate;
  const repTgt = repNow > 0 ? Math.round(clamp(repNow * 1.4, repNow + 6, bn.repeat + 8)) : bn.repeat;
  const marNow = inp.grossMargin;
  const marTgt = marNow > 0 ? Math.round(clamp(marNow + (bn.margin - marNow) * 0.5, marNow + 2, bn.margin + 3)) : bn.margin;
  const cacNow = inp.cac;
  const cacTgt = cacNow > 0 ? Math.round(cacNow * 0.72) : 0;

  // Приріст доходу: комбінація конверсії й повторних, але не більше, ніж
  // порахована річна можливість (res.total) поверх поточного обороту.
  const crFactor = crNow > 0 ? crTgt / crNow : 1.15;
  const repFactor = repNow > 0 ? 1 + ((repTgt - repNow) / 100) * 0.5 : 1.05;
  const uplift = clamp(crFactor * repFactor, 1.05, 2.2);
  const afterA = nowA > 0 ? Math.min(nowA * uplift, nowA + res.total) : 0;
  const afterM = afterA / 12;
  const upliftPct = pctUp(nowA, afterA);

  const cur = curOf(inp.currency);
  const income: Delta[] = nowM > 0 ? [
    { label: L('Дохід / день', 'Revenue / day'), before: money(nowM / 30, cur), after: money(afterM / 30, cur), pct: upliftPct, dir: 'up' },
    { label: L('Дохід / місяць', 'Revenue / month'), before: money(nowM, cur), after: money(afterM, cur), pct: upliftPct, dir: 'up', hero: true },
    { label: L('Дохід / рік', 'Revenue / year'), before: money(nowA, cur), after: money(afterA, cur), pct: upliftPct, dir: 'up' },
  ] : [];

  const profitNow = nowM * (marNow || bn.margin) / 100;
  const profitAfter = afterM * marTgt / 100;

  const unit: Delta[] = [];
  if (crNow > 0) unit.push({ label: L('Конверсія', 'Conversion'), before: crNow + '%', after: crTgt + '%', pct: pctUp(crNow, crTgt), dir: 'up' });
  if (repNow > 0) unit.push({ label: L('Повторні продажі', 'Repeat sales'), before: repNow + '%', after: repTgt + '%', pct: pctUp(repNow, repTgt), dir: 'up' });
  if (cacNow > 0) unit.push({ label: L('Вартість клієнта (CAC)', 'Customer cost (CAC)'), before: money(cacNow, cur), after: money(cacTgt, cur), pct: pctDown(cacNow, cacTgt), dir: 'down' });
  if (marNow > 0) unit.push({ label: L('Валова маржа', 'Gross margin'), before: marNow + '%', after: marTgt + '%', pct: pctUp(marNow, marTgt), dir: 'up' });
  if (nowM > 0) unit.push({ label: L('Прибуток / місяць', 'Profit / month'), before: money(profitNow, cur), after: money(profitAfter, cur), pct: pctUp(profitNow, profitAfter), dir: 'up' });

  // Операції: час обробки замовлення — оцінка за зрілістю операцій (health).
  const ops = res.health.find((h) => h.key === 'operations')?.score ?? 55;
  const procNow = Math.round(clamp((100 - ops) / 100 * 40 + 6, 6, 42));
  const procAfter = Math.max(2, Math.round(procNow * 0.35));
  const opsRows: Delta[] = [
    { label: L('Час обробки замовлення', 'Order processing time'), before: procNow + L(' год', ' h'), after: procAfter + L(' год', ' h'), pct: pctDown(procNow, procAfter), dir: 'down' },
  ];

  return { income, unit, ops: opsRows, upliftPct, horizon: L('6–9 місяців системної роботи', '6–9 months of systematic work') };
}
