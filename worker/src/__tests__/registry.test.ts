/**
 * Реестр находок — то, ради чего аудит и делается: клиент работает по этому
 * списку и в этом порядке.
 *
 * Найдено этим тестом:
 *  · рычаг с отрицательным вкладом раздавал находкам ОТРИЦАТЕЛЬНЫЙ
 *    revenueExposure — «недоотримано −68 293 ₴/рік» в документе читается как
 *    «почините и потеряете»;
 *  · неизвестный уровень доказательства давал NaN-уверенность, и находка молча
 *    уезжала в P2 (quality.ts от той же карты уже защищался — значит, наступали).
 */
import { describe, it, expect } from 'vitest';
import { buildRegistry, registrySummary, computeConfidence, type FindingInput } from '../registry.js';
import type { MoneyResult } from '../money.js';

const f = (o: Partial<FindingInput> & { title?: string } = {}): FindingInput => ({
  domain: 'website', title: 'находка', impact: 3, difficulty: 3,
  evidence: { url: 'https://x.ua' }, evidenceLevel: 'E3',
  reproducibility: 'подтверждено', source: 'сайт', ...o,
} as FindingInput);

const money = (...w: { key: string; contribYear: number }[]) =>
  ({ waterfall: w } as unknown as MoneyResult);

describe('атрибуция денег', () => {
  it('вклад рычага делится между его находками по impact × confidence', () => {
    const r = buildRegistry([
      f({ title: 'A', funnelStep: 'привлечение', impact: 5 }),
      f({ title: 'B', funnelStep: 'привлечение', impact: 2 }),
    ], { money: money({ key: 'traffic', contribYear: 600_000 }) });
    const [a, b] = ['A', 'B'].map((t) => r.find((x) => x.title === t)!);
    expect(a.revenueExposure).toBeGreaterThan(b.revenueExposure);
    expect(a.revenueExposure + b.revenueExposure).toBeCloseTo(600_000, -1);
  });

  it('находка без шага воронки денег не получает — рычага у неё нет', () => {
    const r = buildRegistry([f({ title: 'A' })], { money: money({ key: 'traffic', contribYear: 600_000 }) });
    expect(r[0].revenueExposure).toBe(0);
  });

  it('отрицательный вклад рычага не превращается в отрицательное «недополучено»', () => {
    // В money.ts отрицательный вклад ОДНОГО рычага допустим и осмыслен: размен
    // внутри воронки. Но находке раздавать по нему нечего.
    const r = buildRegistry([
      f({ title: 'A', funnelStep: 'привлечение' }),
      f({ title: 'B', funnelStep: 'каталог' }),
    ], { money: money({ key: 'traffic', contribYear: 600_000 }, { key: 'cr', contribYear: -120_000 }) });
    for (const x of r) expect(x.revenueExposure, x.title).toBeGreaterThanOrEqual(0);
  });

  it('итог реестра не занижается отрицательными слагаемыми', () => {
    const r = buildRegistry([
      f({ title: 'A', funnelStep: 'привлечение' }),
      f({ title: 'B', funnelStep: 'каталог' }),
    ], { money: money({ key: 'traffic', contribYear: 600_000 }, { key: 'cr', contribYear: -120_000 }) });
    expect(registrySummary(r).exposureYear).toBe(600_000);
  });

  it('без денег реестр строится и не падает', () => {
    const r = buildRegistry([f({ funnelStep: 'каталог' })]);
    expect(r[0].revenueExposure).toBe(0);
    expect(Number.isFinite(r[0].priorityScore)).toBe(true);
  });
});

describe('уверенность', () => {
  it('неизвестный уровень доказательства не даёт NaN', () => {
    const c = computeConfidence(f({ evidenceLevel: 'L1' as never }));
    expect(Number.isFinite(c)).toBe(true);
    expect(c).toBeGreaterThan(0);
  });

  it('неизвестный источник тоже деградирует мягко', () => {
    expect(Number.isFinite(computeConfidence(f({ source: 'телепатия' as never })))).toBe(true);
  });

  it('неизвестное покрытие домена не роняет расчёт', () => {
    expect(Number.isFinite(computeConfidence(f(), 'нет такого' as never))).toBe(true);
  });

  it('сильное доказательство даёт больше уверенности, чем слабое', () => {
    expect(computeConfidence(f({ evidenceLevel: 'E4' }))).toBeGreaterThan(computeConfidence(f({ evidenceLevel: 'E1' })));
  });

  it('невоспроизводимое наблюдение снижает уверенность', () => {
    expect(computeConfidence(f({ reproducibility: 'не воспроизвелось' })))
      .toBeLessThan(computeConfidence(f({ reproducibility: 'подтверждено' })));
  });

  it('модуль не может завысить свою уверенность сверх формулы больше чем на 0.15', () => {
    const c = computeConfidence(f({ evidenceLevel: 'E1', source: 'сеть', rawConfidence: 0.1 }));
    expect(c).toBeLessThanOrEqual(0.25);
  });
});

describe('слияние дублей', () => {
  it('держит сильнейший impact, а не первый встреченный', () => {
    const r = buildRegistry([f({ title: 'дубль', impact: 2 }), f({ title: 'дубль', impact: 5 })]);
    expect(r).toHaveLength(1);
    expect(r[0].impact).toBe(5);
  });

  it('объединяет ссылки на источники', () => {
    const r = buildRegistry([
      f({ title: 'дубль', refs: ['seoflow'] }),
      f({ title: 'дубль', refs: ['croflow', 'seoflow'] }),
    ]);
    expect(r[0].refs!.sort()).toEqual(['croflow', 'seoflow']);
  });

  it('поднимает уровень доказательства до сильнейшего', () => {
    const r = buildRegistry([f({ title: 'д', evidenceLevel: 'E1' }), f({ title: 'д', evidenceLevel: 'E4' })]);
    expect(r[0].evidenceLevel).toBe('E4');
  });

  it('дубли в разных доменах не склеиваются — это разные находки', () => {
    const r = buildRegistry([f({ title: 'одна и та же' }), f({ title: 'одна и та же', domain: 'seo' })]);
    expect(r).toHaveLength(2);
  });

  it('вход не мутируется', () => {
    const input = [f({ title: 'д', impact: 2 }), f({ title: 'д', impact: 5 })];
    const before = JSON.stringify(input);
    buildRegistry(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('идентификаторы уникальны и стабильны по формату', () => {
    const r = buildRegistry([f({ title: 'A' }), f({ title: 'B' }), f({ title: 'C', domain: 'seo' })]);
    const ids = r.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+-\d{3}$/);
  });
});
