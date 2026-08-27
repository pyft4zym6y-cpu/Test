import { describe, it, expect } from 'vitest';
import { sampleSize, plan, mde, readResult, MDE_MAX } from '../experiments';

describe('планировщик A/B', () => {
  it('размер выборки растёт при меньшем эффекте', () => {
    const small = sampleSize(0.02, 0.05).n;
    const big = sampleSize(0.02, 0.5).n;
    expect(small).toBeGreaterThan(big);
  });

  it('правило метода: дольше 8 недель — тест не окупается', () => {
    expect(plan(0.012, 0.1, 500).tooLong).toBe(true);
    expect(plan(0.05, 0.5, 100000).tooLong).toBe(false);
  });

  /*
   * mde возвращал верхнюю границу собственного бинарного поиска (5.0), и экран
   * печатал её как «детектируем подъём от 500.0% относительных». При нулевом
   * трафике это выдавалось всегда: предел алгоритма подавался как замер.
   */
  it('не выдаёт границу поиска за измеренный эффект', () => {
    expect(mde(0.012, 0, 4)).toBeNull();
    expect(mde(0.012, 1, 1)).toBeNull();
    const real = mde(0.02, 20000, 4);
    expect(real).not.toBeNull();
    expect(real!).toBeLessThan(MDE_MAX);
    expect(real!).toBeGreaterThan(0);
  });

  it('чтение результата: значимость совпадает с z-тестом', () => {
    const r = readResult(10000, 200, 10000, 300)!;
    expect(r.significant).toBe(true);
    expect(r.p).toBeLessThan(0.05);
    expect(r.lift).toBeCloseTo(0.5, 3);
    const flat = readResult(10000, 200, 10000, 205)!;
    expect(flat.significant).toBe(false);
  });

  /*
   * Пустая форма давала pA = 0/0 = NaN, а `se ? … : 0` глушил NaN в ноль:
   * наружу уходило «A NaN% → B NaN% · p=1.0000 · ✗ не значимо» — отсутствие
   * данных в виде проведённого теста.
   */
  it('на негодных входных данных отдаёт null, а не NaN', () => {
    expect(readResult(0, 0, 0, 0)).toBeNull();
    expect(readResult(100, 200, 100, 10)).toBeNull(); // конверсий больше визитов
    expect(readResult(NaN, 1, 100, 10)).toBeNull();
    expect(readResult(-5, 1, 100, 10)).toBeNull();
  });
});
