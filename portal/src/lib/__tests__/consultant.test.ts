import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeGap8, runPSI, DEFAULT_LEVERS, LEVER_DEFS, type Levers } from '../consultant';

const withFetch = (body: unknown, ok = true, status = 200) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status, json: async () => body }));
afterEach(() => vi.unstubAllGlobals());

const L = (over: Partial<Record<string, { fact: number; target: number }>>): Levers =>
  ({ ...DEFAULT_LEVERS, ...over }) as Levers;

describe('runPSI', () => {
  it('отдаёт замер, когда PSI его вернул', async () => {
    withFetch({ lighthouseResult: { categories: { performance: { score: 0.42 } },
      audits: { 'largest-contentful-paint': { numericValue: 3400 }, 'cumulative-layout-shift': { numericValue: 0.11 } } } });
    const r = await runPSI('https://shop.ua');
    expect(r.score).toBe(42);
    expect(r.lcp).toBe(3.4);
    expect(r.cls).toBe(0.11);
  });

  /*
   * PSI отвечает 200 и на неудачный прогон: при runtimeError lighthouseResult
   * приходит без категории performance. Стояло `?? 0` — и «замер не удался»
   * печаталось как «PageSpeed 0», худшая возможная оценка, поданная как факт.
   * DE-06 фильтрует по `score != null`, так что ноль проходил как измеренный, и
   * клиент читал «у вас 0, у конкурентов в среднем 55».
   */
  it('несостоявшийся замер не превращается в ноль', async () => {
    withFetch({ lighthouseResult: { runtimeError: { code: 'ERRORED_DOCUMENT_REQUEST' } } });
    const r = await runPSI('https://shop.ua');
    expect(r.score).toBeNull();
    expect(r.error).toBe('ERRORED_DOCUMENT_REQUEST');
  });

  it('пустой ответ PSI — тоже не ноль', async () => {
    withFetch({});
    expect((await runPSI('https://shop.ua')).score).toBeNull();
  });

  it('HTTP-ошибка возвращается как ошибка', async () => {
    withFetch({}, false, 429);
    const r = await runPSI('https://shop.ua');
    expect(r.score).toBeNull();
    expect(r.error).toBe('HTTP 429');
  });
});

describe('computeGap8', () => {
  const real = L({
    traffic: { fact: 40000, target: 60000 }, cr: { fact: 1.2, target: 2 },
    aov: { fact: 1500, target: 1800 }, base: { fact: 8000, target: 8000 },
    repeat: { fact: 4, target: 8 },
  });

  it('цепная атрибуция сходится: Σ вкладов = потенциал', () => {
    const g = computeGap8(real);
    const sum = g.waterfall.reduce((s, w) => s + w.value, 0);
    expect(Math.abs(sum - g.potential)).toBeLessThanOrEqual(12);
    expect(g.potential).toBeGreaterThan(0);
    expect(g.conservative).toBe(Math.round(g.potential * 0.55));
  });

  /*
   * Прежний флаг назывался sumCheck и рисовал консультанту «Σ вкладов =
   * потенциал ✓». Сумма телескопируется тождественно, а допуск был max(12,
   * 0.1%) при погрешности округления ≤ 4 ₴ — флаг не мог стать false ни на
   * каких данных. Единственное, что здесь ломается по-настоящему, — нечисловой
   * рычаг, и именно это теперь и проверяется.
   */
  it('флаг ловит то единственное, что здесь может сломаться, — не-число', () => {
    expect(computeGap8(real).finite).toBe(true);
    const broken = L({ aov: { fact: NaN, target: 1800 }, traffic: { fact: 40000, target: 60000 } });
    expect(computeGap8(broken).finite).toBe(false);
  });

  /*
   * Цель НИЖЕ факта (опечатка в админке) проходила без правки и давала
   * отрицательный потенциал: «полный потенциал −6.5 млн ₴», а после записи в
   * money — прогноз «с программой меньше, чем без изменений».
   */
  it('цель ниже факта не даёт отрицательного потенциала', () => {
    const g = computeGap8(L({ traffic: { fact: 40000, target: 10000 }, cr: { fact: 1.2, target: 1.2 }, aov: { fact: 1500, target: 1500 } }));
    expect(g.potential).toBe(0);
    expect(g.conservative).toBe(0);
    expect(g.waterfall.every((w) => w.value >= 0)).toBe(true);
  });

  it('потенциал никогда не отрицателен ни на каком наборе целей', () => {
    const keys = ['traffic', 'cr', 'aov', 'pay', 'redeem', 'base', 'repeat', 'opr'] as const;
    for (const k of keys) {
      const g = computeGap8(L({
        traffic: { fact: 40000, target: 40000 }, cr: { fact: 1.2, target: 1.2 },
        aov: { fact: 1500, target: 1500 }, base: { fact: 8000, target: 8000 },
        repeat: { fact: 4, target: 4 },
        [k]: { fact: 100, target: 1 },
      } as any));
      expect(`${k}: ${g.potential}`).toBe(`${k}: ${Math.max(0, g.potential)}`);
    }
  });

  it('все восемь рычагов участвуют в модели', () => {
    expect(LEVER_DEFS).toHaveLength(8);
    expect(new Set(LEVER_DEFS.map((d) => d.key)).size).toBe(8);
  });
});
