/**
 * Недополученный оборот — цепная атрибуция (порт gap_calculator.py, та же
 * формула выручки, что forecast() портала). Потенциал = разность двух состояний
 * воронки; вклад рычага = прирост выручки при его подмене факт→цель поверх уже
 * применённых. ИНВАРИАНТ: Σ вкладов = потенциал (складывать разрывы по рычагам
 * нельзя — это завышает итог). Новые потоки (МП, ЕС) прибавляются отдельно.
 *
 * Единицы — как в портале: cr/pay/redeem/repeat в % (÷100 внутри), aov ₴,
 * traffic сессии/мес, base чел., opr заказов на повторного клиента.
 */
export type LeverKey = 'traffic' | 'cr' | 'aov' | 'pay' | 'redeem' | 'base' | 'repeat' | 'opr';
export type LeverRow = { fact: number; target: number; source?: string };
export type Levers = Record<LeverKey, LeverRow>;

const LEVER_ORDER: { key: LeverKey; label: string }[] = [
  { key: 'traffic', label: 'Трафик / органика' },
  { key: 'cr', label: 'Конверсия сайта' },
  { key: 'aov', label: 'Средний чек' },
  { key: 'pay', label: 'Оплата заявок' },
  { key: 'redeem', label: 'Выкуп (отказы+возвраты)' },
  { key: 'base', label: 'Рост базы' },
  { key: 'repeat', label: 'Доля повторных' },
  { key: 'opr', label: 'Частота повторных' },
];

type State = Record<LeverKey, number>;

function revenue(s: State): number {
  const cr = s.cr / 100, pay = s.pay / 100, redeem = s.redeem / 100, repeat = s.repeat / 100;
  const perOrder = s.aov * pay * redeem;
  const rNew = s.traffic * cr * perOrder;
  const rRepeat = s.base * repeat * s.opr * perOrder;
  return rNew + rRepeat;
}

export type Waterfall = { key: LeverKey; label: string; fact: number; target: number; contribMonth: number; contribYear: number };
export type ExtraStream = { name: string; monthly: number };

export type MoneyResult = {
  currentMonth: number;
  targetMonth: number;
  potentialMonth: number; // существующая воронка
  potentialYear: number;
  extraYear: number; // новые потоки
  waterfall: Waterfall[];
  consMinYear: number; // консервативная нижняя граница (нижняя половина)
  consMaxYear: number;
  forecast: { current: number; withProgram: number; upliftPct: number };
  invariantOk: boolean; // Σ вкладов = потенциал
};

const stateFrom = (l: Levers, side: 'fact' | 'target'): State =>
  Object.fromEntries(LEVER_ORDER.map(({ key }) => [key, l[key][side]])) as State;

export function computeMoney(levers: Levers, extra: ExtraStream[] = []): MoneyResult {
  const fact = stateFrom(levers, 'fact');
  const target = stateFrom(levers, 'target');
  const currentMonth = revenue(fact);

  const cur: State = { ...fact };
  const waterfall: Waterfall[] = [];
  for (const { key, label } of LEVER_ORDER) {
    if (fact[key] === target[key]) continue;
    const before = revenue(cur);
    cur[key] = target[key];
    const contribMonth = revenue(cur) - before;
    waterfall.push({ key, label, fact: fact[key], target: target[key], contribMonth, contribYear: contribMonth * 12 });
  }
  const targetMonth = revenue(cur);
  const potentialMonth = targetMonth - currentMonth;
  const potentialYear = potentialMonth * 12;
  const extraYear = extra.reduce((s, e) => s + e.monthly * 12, 0);

  const sumContrib = waterfall.reduce((s, w) => s + w.contribMonth, 0);
  const invariantOk = Math.abs(sumContrib - potentialMonth) < Math.max(1, Math.abs(potentialMonth) * 1e-6);

  const grandYear = potentialYear + extraYear;
  const currentYear = currentMonth * 12;
  return {
    currentMonth, targetMonth, potentialMonth, potentialYear, extraYear, waterfall,
    consMinYear: Math.round(grandYear * 0.5), // нижняя половина расчётного диапазона (метод: консервативно)
    consMaxYear: Math.round(grandYear),
    forecast: { current: Math.round(currentYear), withProgram: Math.round(currentYear + grandYear), upliftPct: currentYear ? Math.round((grandYear / currentYear) * 100) : 0 },
    invariantOk,
  };
}

const fmt = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

/** Сводка денег для промпта анализа и материалов. */
export function moneyFacts(m: MoneyResult): string {
  const L: string[] = [];
  L.push('# ДЕНЬГИ (цепная атрибуция — не пересчитывай и не складывай вклады рычагов заново)');
  L.push(`Выручка сейчас: ${fmt(m.currentMonth)}/мес. При целевой воронке: ${fmt(m.targetMonth)}/мес.`);
  L.push(`Недополученный оборот (существующая воронка): ${fmt(m.potentialMonth)}/мес ≈ ${fmt(m.potentialYear)}/год.`);
  if (m.extraYear) L.push(`Новые потоки (МП/ЕС): +${fmt(m.extraYear)}/год.`);
  L.push(`Консервативно: ${fmt(m.consMinYear)}–${fmt(m.consMaxYear)}/год. Прогноз 12 мес: ${fmt(m.forecast.current)} → ${fmt(m.forecast.withProgram)} (+${m.forecast.upliftPct}%).`);
  L.push('Вклад рычагов (₴/год): ' + m.waterfall.map((w) => `${w.label} ${fmt(w.contribYear)}`).join('; '));
  if (!m.invariantOk) L.push('⚠️ Инвариант Σ вкладов = потенциал нарушен — проверь baseline.');
  return L.join('\n');
}
