/**
 * Loss Calculator — прозора модель оцінки втрат e-commerce. Свідомо НЕ фінансовий
 * аудит: порядок величини за наданими даними + бенчмарками, з чіткою позначкою
 * «estimate». Логіка ланцюгова: втрати важелів не складаються напряму (сумарна
 * можливість = найбільший важіль + частка решти), як і в методі WEEXP.
 */
export type SysKey = 'strategy' | 'commercial' | 'customer' | 'experience' | 'operations' | 'data' | 'org';

export const SYS: { key: SysKey; label: string; node: number }[] = [
  { key: 'strategy', label: 'Strategy & Management', node: 0 },
  { key: 'commercial', label: 'Commercial Performance', node: 1 },
  { key: 'customer', label: 'Demand & Customer', node: 2 },
  { key: 'experience', label: 'Experience & Conversion', node: 3 },
  { key: 'operations', label: 'Operations & Fulfillment', node: 4 },
  { key: 'data', label: 'Data & Technology', node: 5 },
  { key: 'org', label: 'Organization', node: 6 },
];

export type LossInput = {
  monthlyRevenue: number; aov: number; conversion: number; repeatRate: number;
  returnsRate: number; grossMargin: number; cac: number; symptoms: SysKey[];
};

export type Leak = { key: SysKey; label: string; amount: number };
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
};

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
    { key: 'commercial', label: 'Commercial leak', amount: Math.round(commercial) },
    { key: 'customer', label: 'Marketing leak', amount: Math.round(marketing) },
    { key: 'operations', label: 'Operational leak', amount: Math.round(operational) },
    { key: 'customer', label: 'Retention leak', amount: Math.round(retention) },
    { key: 'experience', label: 'Conversion leak', amount: Math.round(experience) },
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
  const W: Record<SysKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: .9, operations: 1.3, data: 1.2, org: 1.5 };
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
