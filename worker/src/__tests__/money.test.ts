/**
 * Денежная модель. 101 строка без единого теста, и при этом её число —
 * «недоотриманий оборот ≈ X ₴/рік» — уходит в двенадцать мест: презентацию,
 * docx, exec-диагностику, карту причин, промпт анализа, метрики прогона. По
 * нему клиент судит о размере проблемы, а мы — о рамке бюджета работ.
 *
 * Цепная атрибуция: вклад рычага считается ПОВЕРХ уже применённых, поэтому
 * складывать разрывы по рычагам напрямую нельзя — это завышает итог.
 */
import { describe, it, expect } from 'vitest';
import { computeMoney, moneyFacts, checkLevers, type Levers } from '../money.js';

type Pair = [number, number];
const base: Record<string, Pair> = {
  traffic: [10000, 12000], cr: [1, 1.5], aov: [1000, 1000], pay: [80, 80],
  redeem: [90, 90], base: [5000, 5000], repeat: [20, 20], opr: [1.5, 1.5],
};
const L = (o: Record<string, Pair> = {}): Levers =>
  Object.fromEntries(Object.entries({ ...base, ...o })
    .map(([k, [f, t]]) => [k, { fact: f, target: t }])) as Levers;

describe('расчёт', () => {
  it('выручка = новые + повторные, обе через оплату и выкуп', () => {
    const m = computeMoney(L())!;
    // 10000 × 1% × (1000 × 0.8 × 0.9) = 72 000 новых
    //  5000 × 20% × 1.5 × 720        = 1 080 000 повторных
    expect(Math.round(m.currentMonth)).toBe(1152000);
  });

  it('без разрывов денег нет — и это не ошибка', () => {
    const same = L(Object.fromEntries(Object.entries(base).map(([k, [f]]) => [k, [f, f]])));
    const m = computeMoney(same)!;
    expect(m.potentialYear).toBe(0);
    expect(m.waterfall).toEqual([]);
  });

  it('рычаг без разрыва в водопад не попадает', () => {
    const m = computeMoney(L())!;
    expect(m.waterfall.map((w) => w.key).sort()).toEqual(['cr', 'traffic']);
  });

  it('Σ вкладов = потенциал: складывать разрывы по рычагам напрямую нельзя', () => {
    const m = computeMoney(L({ cr: [1, 2], aov: [1000, 1300], traffic: [10000, 15000] }))!;
    const sum = m.waterfall.reduce((s, w) => s + w.contribMonth, 0);
    expect(sum).toBeCloseTo(m.potentialMonth, 6);
    expect(m.invariantOk).toBe(true);
  });

  it('цепная атрибуция даёт МЕНЬШЕ, чем сумма изолированных разрывов', () => {
    // Ровно то, ради чего она и введена: два рычага, умноженные друг на друга,
    // при раздельном счёте дают двойной учёт пересечения.
    const lv = L({ cr: [1, 2], aov: [1000, 2000] });
    const chain = computeMoney(lv)!.potentialMonth;
    const isolated = ['cr', 'aov'].reduce((s, k) => {
      const one = L({ [k]: base[k]! });
      (one as Record<string, { fact: number; target: number }>)[k] = { fact: base[k][0], target: k === 'cr' ? 2 : 2000 };
      return s + computeMoney(one as Levers)!.potentialMonth;
    }, 0);
    expect(chain).toBeLessThan(isolated);
  });

  it('новые потоки прибавляются отдельно от воронки', () => {
    const m = computeMoney(L(), [{ name: 'Маркетплейси', monthly: 100000 }])!;
    expect(m.extraYear).toBe(1200000);
    // потенциал воронки новые потоки не включает — они складываются только в consMax
    expect(m.consMaxYear).toBe(Math.round(m.potentialYear + m.extraYear));
  });

  it('консервативная вилка — половина расчётного, и min не больше max', () => {
    const m = computeMoney(L())!;
    expect(m.consMinYear).toBeLessThanOrEqual(m.consMaxYear);
    expect(m.consMinYear).toBe(Math.round(m.consMaxYear * 0.5));
  });
});

describe('вход, которому нельзя верить', () => {
  it('пропущенный показатель не превращается в «не число ₴» в документе клиента', () => {
    // toLocaleString('ru-RU') рисует NaN как «не число» — и эта строка уходила
    // в промпт и в двенадцать документов. Лучше не считать вовсе.
    expect(computeMoney(L({ aov: [NaN, 1000] }))).toBeNull();
    expect(computeMoney(L({ traffic: [Infinity, 1] }))).toBeNull();
  });

  it('причина отказа называется, а не молчит', () => {
    const p = checkLevers(L({ aov: [NaN, 1000] }));
    expect(p.join(' ')).toMatch(/aov|чек/i);
  });

  it('цель хуже факта — это опечатка в данных, а не отрицательная возможность', () => {
    // Иначе в документ уходит «недоотримано −691 200 ₴/рік… це верхня рамка
    // для бюджету програми змін».
    expect(computeMoney(L({ cr: [2, 1] }))).toBeNull();
    expect(checkLevers(L({ cr: [2, 1] })).join(' ')).toMatch(/ціль|цел|гірш|хуж/i);
  });

  it('отрицательный вклад ОДНОГО рычага при общем плюсе допустим', () => {
    // Размен внутри воронки — нормальная ситуация, её глушить нельзя.
    const m = computeMoney(L({ traffic: [10000, 30000], cr: [1.5, 1.4] }));
    expect(m).not.toBeNull();
    expect(m!.potentialMonth).toBeGreaterThan(0);
    expect(m!.waterfall.some((w) => w.contribMonth < 0)).toBe(true);
  });

  it('здоровый набор проблем не имеет', () => {
    expect(checkLevers(L())).toEqual([]);
  });
});

describe('клиент до запуска', () => {
  const pre = () => computeMoney(L({ traffic: [0, 12000], cr: [0, 1.5], base: [0, 0], repeat: [0, 0] }))!;

  it('потенциал считается, хотя выручки ещё нет', () => {
    expect(pre().forecast.withProgram).toBeGreaterThan(0);
  });

  it('прирост в процентах не выдумывается от нулевой базы', () => {
    // Было «сейчас 0 → с программой 1 555 200, прирост 0%»: ноль процентов
    // рядом с полуторамиллионной цифрой читается как ошибка расчёта.
    expect(pre().forecast.upliftPct).toBeNull();
  });

  it('в тексте вместо «+0%» говорится, что базы для сравнения нет', () => {
    const t = moneyFacts(pre());
    expect(t).not.toMatch(/\+0%/);
    expect(t).toMatch(/бази|базы|з нуля/i);
  });
});

describe('moneyFacts — то, что читает модель', () => {
  it('прямо запрещает пересчитывать вклады заново', () => {
    expect(moneyFacts(computeMoney(L())!)).toMatch(/не перераховуй|не додавай/i);
  });

  it('называет вклад каждого рычага с разрывом', () => {
    const t = moneyFacts(computeMoney(L())!);
    expect(t).toMatch(/Трафік/);
    expect(t).toMatch(/Конверсія/);
  });
});
