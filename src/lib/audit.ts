/*
 * ЄДИНА МОДЕЛЬ АУДИТУ — спільне джерело правди для калькулятора, кабінету і (згодом)
 * рушія глибокого аудиту. Стратегічно вся логіка — одна воронка:
 *   Відвідувач → Експрес-аудит → Лід → Акаунт → Профіль → Глибокий аудит (T1–T4)
 *   → Знахідки/Дорожня карта → Співпраця → Повторний аудит (Learning Core).
 * Гроші рахуються ЧЕСНО: важелі воронки перемножуються ланцюгом, показується
 * консервативна нижня межа. Уточнення підвищують достовірність, а не роздувають суму.
 */

export type Niche = { id: string; label: string; crNorm: number; crGold: number; repeatTarget: number; aovLow: number; aovHigh: number };

export const NICHES: Niche[] = [
  { id: 'fashion', label: 'Fashion · одяг і взуття', crNorm: 2.2, crGold: 3.2, repeatTarget: 35, aovLow: 1500, aovHigh: 3500 },
  { id: 'beauty', label: 'Beauty · косметика', crNorm: 2.8, crGold: 4.0, repeatTarget: 45, aovLow: 900, aovHigh: 2000 },
  { id: 'home', label: 'Дім · меблі · декор', crNorm: 1.4, crGold: 2.2, repeatTarget: 20, aovLow: 2500, aovHigh: 9000 },
  { id: 'electronics', label: 'Електроніка · техніка', crNorm: 1.8, crGold: 2.6, repeatTarget: 25, aovLow: 3000, aovHigh: 15000 },
  { id: 'fmcg', label: 'FMCG · товари щодня', crNorm: 3.2, crGold: 5.0, repeatTarget: 55, aovLow: 600, aovHigh: 1500 },
  { id: 'kids', label: 'Дитячі товари', crNorm: 2.4, crGold: 3.4, repeatTarget: 40, aovLow: 800, aovHigh: 2500 },
  { id: 'pets', label: 'Зоотовари', crNorm: 2.6, crGold: 3.8, repeatTarget: 50, aovLow: 600, aovHigh: 1500 },
  { id: 'sport', label: 'Спорт · outdoor', crNorm: 1.8, crGold: 2.6, repeatTarget: 28, aovLow: 1500, aovHigh: 4500 },
  { id: 'jewelry', label: 'Ювелірка · аксесуари', crNorm: 1.2, crGold: 2.0, repeatTarget: 22, aovLow: 2000, aovHigh: 8000 },
  { id: 'auto', label: 'Автотовари', crNorm: 1.6, crGold: 2.4, repeatTarget: 30, aovLow: 1000, aovHigh: 4000 },
  { id: 'health', label: 'Здоровʼя · аптека', crNorm: 3.0, crGold: 4.5, repeatTarget: 50, aovLow: 500, aovHigh: 1200 },
  { id: 'other', label: 'Інша ніша', crNorm: 2.0, crGold: 3.0, repeatTarget: 30, aovLow: 800, aovHigh: 4000 },
];
export const nicheById = (id: string | null): Niche => NICHES.find((n) => n.id === id) ?? NICHES[NICHES.length - 1];

export const ORGANIC_TARGET = 35;
export const EMAIL_TARGET = 20;

export const fmtUAH = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} млн ₴` : `${Math.round(n / 1000).toLocaleString('uk-UA')} тис ₴`;
export const num = (s: string) => parseFloat((s || '').replace(',', '.')) || 0;

export type Tone = 'red' | 'yellow' | 'green' | 'na';
export type Zone = { label: string; value: string; tone: Tone; hint: string };

/** Вхідні дані для розрахунку (підмножина стану калькулятора). */
export type AuditInputs = {
  nicheId: string | null; revenue: string; aov: string; cr: string; repeat: string;
  organic?: string; email?: string; margin?: string;
  // для достовірності (крок 2/3)
  extraFilled2?: number; extraFilled3?: number;
};

export type AuditResult = ReturnType<typeof compute>;

export function compute(s: AuditInputs) {
  const niche = nicheById(s.nicheId);
  const M = num(s.revenue) * 1000;
  const crC = Math.min(Math.max(num(s.cr), 0.1), 15);
  const rC = Math.min(Math.max(num(s.repeat) || 10, 0), 80) / 100;
  const aovC = num(s.aov);
  const orgC = !s.organic ? null : Math.min(Math.max(num(s.organic), 0), 100);
  const emC = !s.email ? null : Math.min(Math.max(num(s.email), 0), 100);
  const mgC = !s.margin ? null : Math.min(Math.max(num(s.margin), 5), 90);
  const R = M * 12;

  const inNorm = crC >= niche.crNorm;
  const crT = inNorm ? niche.crGold : niche.crNorm;
  const crFactor = Math.min(Math.max(crT / crC, 1), 3);
  const rT = Math.max(rC, niche.repeatTarget / 100);
  const repFactor = Math.min(Math.max((1 - rC) / (1 - rT), 1), 1.6);

  const upliftFull = crFactor * repFactor - 1;
  const potentialFull = R * upliftFull;
  const potentialCons = potentialFull * 0.55;
  const crShare = R * (crFactor - 1);
  const repShare = R * crFactor * (repFactor - 1);
  const orders = aovC > 0 ? Math.round(M / aovC) : null;
  const marginLoss = mgC !== null ? potentialCons * (mgC / 100) : null;

  const zones: Zone[] = [
    { label: 'Конверсія', value: `${crC}%`, tone: crC >= niche.crGold ? 'green' : crC >= niche.crNorm ? 'yellow' : 'red', hint: `норма ${niche.crNorm}% · золотий стандарт ${niche.crGold}%` },
    { label: 'Повторні', value: `${Math.round(rC * 100)}%`, tone: rC * 100 >= niche.repeatTarget ? 'green' : rC * 100 >= niche.repeatTarget * 0.6 ? 'yellow' : 'red', hint: `ціль ніші ${niche.repeatTarget}%` },
    { label: 'Середній чек', value: aovC > 0 ? `${aovC.toLocaleString('uk-UA')} ₴` : '—', tone: aovC <= 0 ? 'na' : aovC < niche.aovLow ? 'yellow' : 'green', hint: aovC <= 0 ? 'не вказано' : `діапазон ніші ${niche.aovLow.toLocaleString('uk-UA')}–${niche.aovHigh.toLocaleString('uk-UA')} ₴` },
    { label: 'Органіка', value: orgC === null ? '—' : `${orgC}%`, tone: orgC === null ? 'na' : orgC >= ORGANIC_TARGET ? 'green' : orgC >= 20 ? 'yellow' : 'red', hint: orgC === null ? 'уточнюється на кроці 2' : `ціль ≥${ORGANIC_TARGET}% — інакше ріст купується` },
    { label: 'Email / CRM', value: emC === null ? '—' : `${emC}%`, tone: emC === null ? 'na' : emC >= EMAIL_TARGET ? 'green' : emC >= 10 ? 'yellow' : 'red', hint: emC === null ? 'уточнюється на кроці 2' : `ціль ≥${EMAIL_TARGET}% виручки` },
  ];
  const confidence = Math.min(95, 40 + (s.extraFilled2 ?? 0) * 6 + (s.extraFilled3 ?? 0) * 3);

  return {
    niche, R, inNorm, crC, crT, rC: rC * 100, rT: rT * 100, potentialFull, potentialCons,
    monthlyCons: potentialCons / 12, crShare, repShare, upliftPct: Math.round(upliftFull * 100),
    orders, marginLoss, zones, redCount: zones.filter((z) => z.tone === 'red').length, confidence,
  };
}
