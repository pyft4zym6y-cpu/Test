/**
 * Loss Calculator — прозора модель оцінки втрат e-commerce. Свідомо НЕ фінансовий
 * аудит: порядок величини за наданими даними + бенчмарками, з чіткою позначкою
 * «estimate». Логіка ланцюгова: втрати важелів не складаються напряму (сумарна
 * можливість = найбільший важіль + частка решти), як і в методі WEEXP.
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

export type LossInput = {
  monthlyRevenue: number; aov: number; conversion: number; repeatRate: number;
  returnsRate: number; grossMargin: number; cac: number; symptoms: SysKey[];
};

export type Leak = { key: SysKey; label: string; labelEn: string; amount: number };
export type Health = { key: SysKey; label: string; score: number };
export type LossResult = {
  annualRevenue: number;
  leaks: Leak[]; total: number; range: [number, number];
  primary: SysKey; secondary: SysKey; bottleneckNodes: number[];
  health: Health[]; overallHealth: number; actions: { key: SysKey; text: string }[];
};

const B = { cr: 2.5, repeat: 35, returns: 6, margin: 45 };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const has = (s: SysKey[], k: SysKey) => s.includes(k);

const ACTION: Record<SysKey, string> = {
  strategy: 'Задати модель росту й управлінський цикл: цілі → декомпозиція → факт → дії.',
  commercial: 'Керувати конверсією, чеком і маржею за юніт-економікою, а не оборотом.',
  customer: 'Побудувати retention і attribution: RFM, win-back, abandoned cart, LTV/CAC.',
  experience: 'Прибрати конверсійні витоки: каталог, картка, checkout, mobile, CRO/A-B.',
  operations: 'Поставити SLA обробки, викуп/доставку й контроль повернень — від кошика до returns.',
  data: 'Наскрізна аналітика + єдиний master data: одні цифри для всіх рішень.',
  org: 'Операційна модель: ролі, RACI, KPI, SOP — щоб бізнес працював без героя.',
  expansion: 'Вихід у ЄС/США як окремий контур: Allegro, Amazon і локальні майданчики.',
};

const ACTION_EN: Record<SysKey, string> = {
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

/** Локалізований підпис витоку (Leak несе обидві мови). */
export const leakLabel = (l: Leak, lang: Lang): string => (lang === 'en' ? l.labelEn : l.label);

export function computeLoss(inp: LossInput): LossResult {
  const annual = Math.max(0, inp.monthlyRevenue) * 12;
  const sym = inp.symptoms;
  const floor = (k: SysKey, pct: number) => (has(sym, k) ? annual * pct : 0);

  // 1) Commercial (конверсія + маржа)
  let commercial = inp.conversion > 0 && inp.conversion < B.cr
    ? Math.min(annual * 0.5, annual * (B.cr / inp.conversion - 1) * 0.5)
    : 0;
  if (inp.grossMargin > 0 && inp.grossMargin < B.margin) commercial += annual * ((B.margin - inp.grossMargin) / 100) * 0.4;
  commercial = Math.max(commercial, floor('commercial', 0.12));

  // 2) Experience (конверсійні витоки на сайті)
  const experience = Math.max(
    inp.conversion > 0 && inp.conversion < B.cr ? annual * (B.cr - inp.conversion) / B.cr * 0.25 : 0,
    floor('experience', 0.08),
  );

  // 3) Retention (повторні → LTV)
  const retention = Math.max(
    inp.repeatRate > 0 && inp.repeatRate < B.repeat ? annual * ((B.repeat - inp.repeatRate) / 100) * 0.5 : 0,
    floor('customer', 0.08),
  );

  // 4) Marketing / acquisition (CAC проти контрибуції)
  let marketing = 0;
  const contrib = inp.aov * (inp.grossMargin || B.margin) / 100;
  if (inp.cac > 0 && inp.aov > 0 && inp.cac > contrib) {
    const orders = annual / Math.max(1, inp.aov);
    marketing = Math.min(annual * 0.3, (inp.cac - contrib) * orders * 0.5);
  }
  marketing = Math.max(marketing, floor('customer', 0.05));

  // 5) Operational (повернення/фулфілмент)
  const operational = Math.max(
    inp.returnsRate > B.returns ? annual * ((inp.returnsRate - B.returns) / 100) * (1 + (1 - (inp.grossMargin || B.margin) / 100) * 0.5) : 0,
    floor('operations', 0.06),
  );

  const rawAll: Leak[] = [
    { key: 'commercial', label: 'Витік у комерції', labelEn: 'Commerce leak', amount: Math.round(commercial) },
    { key: 'customer', label: 'Витік у залученні', labelEn: 'Acquisition leak', amount: Math.round(marketing) },
    { key: 'operations', label: 'Витік в операціях', labelEn: 'Operations leak', amount: Math.round(operational) },
    { key: 'customer', label: 'Витік в утриманні', labelEn: 'Retention leak', amount: Math.round(retention) },
    { key: 'experience', label: 'Витік на конверсії', labelEn: 'Conversion leak', amount: Math.round(experience) },
  ];
  const raw: Leak[] = rawAll.filter((l) => l.amount > 0).sort((a, b) => b.amount - a.amount);

  // Сумарна можливість — ланцюгова: найбільший важіль + 45% решти.
  const sorted = raw.map((l) => l.amount);
  const total = Math.round((sorted[0] ?? 0) + sorted.slice(1).reduce((s, x) => s + x, 0) * 0.45);
  const range: [number, number] = [Math.round(total * 0.6), total];

  // Business Health (7 систем 0..100)
  const health: Health[] = SYS.map(({ key, label }) => {
    let s = 55;
    if (key === 'commercial') s = clamp(50 + (inp.conversion - B.cr) * 8 + ((inp.grossMargin || B.margin) - B.margin) * 0.6, 5, 95);
    else if (key === 'customer') s = clamp(50 + (inp.repeatRate - B.repeat) * 1.2, 5, 95);
    else if (key === 'experience') s = clamp(45 + (inp.conversion - B.cr) * 10, 5, 95);
    else if (key === 'operations') s = clamp(72 - (inp.returnsRate - B.returns) * 4, 5, 95);
    if (has(sym, key)) s -= 22;
    return { key, label, score: Math.round(clamp(s, 5, 98)) };
  });
  const W: Record<SysKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: .9, operations: 1.3, data: 1.2, org: 1.5, expansion: .8 };
  const wsum = Object.values(W).reduce((a, b) => a + b, 0);
  const overallHealth = Math.round(health.reduce((a, h) => a + h.score * W[h.key], 0) / wsum);

  // Bottleneck — за втратами (система з найбільшим витоком) + слабкі за Health.
  const byLeak = [...raw];
  const primary = byLeak[0]?.key ?? [...health].sort((a, b) => a.score - b.score)[0].key;
  const weak = [...health].sort((a, b) => a.score - b.score);
  const secondary = (byLeak[1]?.key && byLeak[1].key !== primary) ? byLeak[1].key : (weak.find((h) => h.key !== primary)?.key ?? 'operations');
  const bottleneckNodes = Array.from(new Set([primary, secondary].map((k) => SYS.find((s) => s.key === k)!.node)));

  const actionKeys = Array.from(new Set([primary, secondary, ...weak.map((h) => h.key)])).slice(0, 3);
  const actions = actionKeys.map((k) => ({ key: k, text: ACTION[k] }));

  return { annualRevenue: annual, leaks: raw, total, range, primary, secondary, bottleneckNodes, health, overallHealth, actions };
}

export const eur = (n: number) => '€' + Math.round(n).toLocaleString('en-US');

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
  const nowM = Math.max(0, inp.monthlyRevenue);
  const nowA = nowM * 12;

  // Цільові метрики — тягнемось до бенчмарку, але реалістично (не «в космос»).
  const crNow = inp.conversion;
  const crTgt = crNow > 0 ? r1(clamp(crNow * 1.55, crNow + 0.3, Math.max(B.cr, crNow * 1.15))) : B.cr;
  const repNow = inp.repeatRate;
  const repTgt = repNow > 0 ? Math.round(clamp(repNow * 1.4, repNow + 6, B.repeat + 8)) : B.repeat;
  const marNow = inp.grossMargin;
  const marTgt = marNow > 0 ? Math.round(clamp(marNow + (B.margin - marNow) * 0.5, marNow + 2, B.margin + 3)) : B.margin;
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

  const income: Delta[] = nowM > 0 ? [
    { label: L('Дохід / день', 'Revenue / day'), before: eur(nowM / 30), after: eur(afterM / 30), pct: upliftPct, dir: 'up' },
    { label: L('Дохід / місяць', 'Revenue / month'), before: eur(nowM), after: eur(afterM), pct: upliftPct, dir: 'up', hero: true },
    { label: L('Дохід / рік', 'Revenue / year'), before: eur(nowA), after: eur(afterA), pct: upliftPct, dir: 'up' },
  ] : [];

  const profitNow = nowM * (marNow || B.margin) / 100;
  const profitAfter = afterM * marTgt / 100;

  const unit: Delta[] = [];
  if (crNow > 0) unit.push({ label: L('Конверсія', 'Conversion'), before: crNow + '%', after: crTgt + '%', pct: pctUp(crNow, crTgt), dir: 'up' });
  if (repNow > 0) unit.push({ label: L('Повторні продажі', 'Repeat sales'), before: repNow + '%', after: repTgt + '%', pct: pctUp(repNow, repTgt), dir: 'up' });
  if (cacNow > 0) unit.push({ label: L('Вартість клієнта (CAC)', 'Customer cost (CAC)'), before: eur(cacNow), after: eur(cacTgt), pct: pctDown(cacNow, cacTgt), dir: 'down' });
  if (marNow > 0) unit.push({ label: L('Валова маржа', 'Gross margin'), before: marNow + '%', after: marTgt + '%', pct: pctUp(marNow, marTgt), dir: 'up' });
  if (nowM > 0) unit.push({ label: L('Прибуток / місяць', 'Profit / month'), before: eur(profitNow), after: eur(profitAfter), pct: pctUp(profitNow, profitAfter), dir: 'up' });

  // Операції: час обробки замовлення — оцінка за зрілістю операцій (health).
  const ops = res.health.find((h) => h.key === 'operations')?.score ?? 55;
  const procNow = Math.round(clamp((100 - ops) / 100 * 40 + 6, 6, 42));
  const procAfter = Math.max(2, Math.round(procNow * 0.35));
  const opsRows: Delta[] = [
    { label: L('Час обробки замовлення', 'Order processing time'), before: procNow + L(' год', ' h'), after: procAfter + L(' год', ' h'), pct: pctDown(procNow, procAfter), dir: 'down' },
  ];

  return { income, unit, ops: opsRows, upliftPct, horizon: L('6–9 місяців системної роботи', '6–9 months of systematic work') };
}
