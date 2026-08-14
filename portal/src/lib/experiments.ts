/**
 * Планировщик A/B-экспериментов — порт method/scripts/experiment_planner.py.
 * Двусторонний тест, α = 0.05, мощность 80%. Правило метода: тест дольше
 * 8 недель не окупается — меняй подход, а не жди.
 */

const Z_A = 1.959964; // inv_cdf(0.975)
const Z_B = 0.841621; // inv_cdf(0.80)

/** Φ(x) через аппроксимацию erf (Абрамовиц–Стиган 7.1.26, точность ~1.5e-7). */
function normCdf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp((-x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** Размер выборки на вариант для относительного подъёма liftRel от базовой конверсии p1. */
export function sampleSize(p1: number, liftRel: number): { n: number; p2: number } {
  const p2 = p1 * (1 + liftRel);
  if (p2 >= 1) throw new Error('Целевая конверсия выше 100%');
  const num = (Z_A + Z_B) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2));
  return { n: Math.floor(num / (p2 - p1) ** 2) + 1, p2 };
}

/** План теста: выборка, всего наблюдений, недель при данном трафике. */
export function plan(p1: number, liftRel: number, weeklyTraffic: number) {
  const { n, p2 } = sampleSize(p1, liftRel);
  const total = n * 2;
  const weeks = weeklyTraffic > 0 ? total / weeklyTraffic : Infinity;
  return { n, p2, total, weeks, tooLong: weeks > 8 };
}

/** Минимально детектируемый относительный эффект при данной выборке (бинарный поиск). */
export function mde(p1: number, weeklyTraffic: number, weeks: number): number {
  const nPerVariant = (weeklyTraffic * weeks) / 2;
  let lo = 1e-5;
  let hi = 5.0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    let n: number;
    try {
      n = sampleSize(p1, mid).n;
    } catch {
      hi = mid;
      continue;
    }
    if (n > nPerVariant) lo = mid;
    else hi = mid;
  }
  return hi;
}

/** Чтение результата: двухпропорционный z-тест. */
export function readResult(nA: number, cA: number, nB: number, cB: number) {
  const pA = cA / nA;
  const pB = cB / nB;
  const lift = pA ? (pB - pA) / pA : NaN;
  const pPool = (cA + cB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  const z = se ? (pB - pA) / se : 0;
  const p = 2 * (1 - normCdf(Math.abs(z)));
  const seDiff = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);
  return {
    pA,
    pB,
    lift,
    z,
    p,
    ci: [pB - pA - Z_A * seDiff, pB - pA + Z_A * seDiff] as [number, number],
    significant: p < 0.05,
  };
}
