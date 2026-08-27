/**
 * «Достоверность выводов, %» — число, которое клиент видит рядом с Health Score
 * и по которому решает, насколько верить остальному отчёту.
 *
 * Знаменатель в подписи про доступы был захардкожен как 26 — столько их когда-то
 * и было в каталоге. Каталог вырос до 38, число осталось, и клиент мог увидеть
 * дробь больше единицы. Причём в самой формуле стояло третье число — 12.
 */
import { describe, it, expect } from 'vitest';
import { computeConfidence } from '../../../portal/src/lib/engine.ts';
import { ACCESSES } from '../../../portal/src/lib/model.ts';
import type { Report } from '../../../portal/src/lib/report.ts';

const report = (answered: number, total = 100): Report => ({
  domains: [], score: null, scoreA: null, scoreB: null, gaps: [],
  answeredL1: answered, totalL1: total, problems: [], rules: [],
  gapCoverage: { checked: 0, total: 18 }, scoreProvisional: false,
});
const conf = (answered: number, access: number, extra: unknown[] = []) =>
  computeConfidence(report(answered), extra as never, access, null);

describe('доступы в достоверности', () => {
  it('знаменатель берётся из каталога, а не из памяти', () => {
    const f = conf(50, 5).factors.find((x) => x.label.startsWith('Доступы'));
    expect(f?.label).toContain(`из ${ACCESSES.length}`);
  });

  it('дробь не может превысить единицу — каталог сейчас больше двадцати шести', () => {
    expect(ACCESSES.length).toBeGreaterThan(26);
    const f = conf(50, 30).factors.find((x) => x.label.startsWith('Доступы'));
    expect(f?.label).toMatch(/30 из 3\d/);
  });

  it('подпись называет порог насыщения — иначе она спорит с формулой', () => {
    const f = conf(50, 5).factors.find((x) => x.label.startsWith('Доступы'));
    expect(f?.label).toMatch(/достаточно 12/);
  });

  it('после двенадцати доступов вклад не растёт', () => {
    const at12 = conf(50, 12).factors.find((x) => x.label.startsWith('Доступы'))!.delta;
    const at30 = conf(50, 30).factors.find((x) => x.label.startsWith('Доступы'))!.delta;
    expect(at30).toBe(at12);
  });
});

describe('шкала достоверности', () => {
  it('пустой опросник без доступов не даёт нуля — но и не даёт много', () => {
    const c = conf(0, 0);
    expect(c.score).toBeGreaterThanOrEqual(5);
    expect(c.score).toBeLessThan(15);
  });

  it('полный опросник и доступы дают высокую достоверность', () => {
    expect(conf(100, 12).score).toBeGreaterThan(50);
  });

  it('противоречия в ответах снижают достоверность', () => {
    const clean = conf(100, 12).score;
    const messy = conf(100, 12, [{}, {}, {}]).score;
    expect(messy).toBeLessThan(clean);
  });

  it('штраф за противоречия ограничен — десять противоречий не обнуляют отчёт', () => {
    const many = conf(100, 12, Array.from({ length: 20 }, () => ({}))).score;
    const five = conf(100, 12, Array.from({ length: 5 }, () => ({}))).score;
    expect(many).toBe(five);   // потолок −15
  });

  it('оценка не выходит за 5..100', () => {
    expect(conf(0, 0).score).toBeGreaterThanOrEqual(5);
    expect(conf(100, 38).score).toBeLessThanOrEqual(100);
  });
});
