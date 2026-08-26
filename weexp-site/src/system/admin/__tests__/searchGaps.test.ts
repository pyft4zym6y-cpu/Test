import { describe, it, expect } from 'vitest';
import {
  striking, cannibalization, ctrGap, decay, expectedCtr, buildSearchDigest, digestSummary,
  type GscRow,
} from '../searchGaps';

const row = (p: Partial<GscRow>): GscRow => ({
  page: 'https://shop.ua/a', query: 'q', clicks: 0, impressions: 0, ctr: 0, position: 1, ...p,
});

describe('expectedCtr', () => {
  it('спадає з позицією і не зростає назад', () => {
    for (let p = 1; p < 30; p += 1) expect(expectedCtr(p)).toBeGreaterThanOrEqual(expectedCtr(p + 1));
  });
  it('нуль на некоректній позиції — не вигадуємо CTR там, де немає позиції', () => {
    expect(expectedCtr(0)).toBe(0);
    expect(expectedCtr(Number.NaN)).toBe(0);
  });
});

describe('striking distance', () => {
  it('бере тільки 4–20 з відчутними показами', () => {
    const r = striking([
      row({ query: 'в зоні', position: 7, impressions: 800, clicks: 12 }),
      row({ query: 'вже в топі', position: 2, impressions: 900, clicks: 130 }),
      row({ query: 'занадто глибоко', position: 44, impressions: 900, clicks: 1 }),
      row({ query: 'шум', position: 8, impressions: 12, clicks: 0 }),
    ]);
    expect(r.map((x) => x.query)).toEqual(['в зоні']);
  });

  it('сортує за оцінкою приросту, а не за показами', () => {
    const r = striking([
      // Багато показів, але CTR уже близький до цілі — забирати майже нічого.
      row({ query: 'майже вибрано', position: 4, impressions: 1000, clicks: 105 }),
      // Показів менше, зате кліків майже немає — саме тут запас.
      row({ query: 'запас', position: 9, impressions: 700, clicks: 3 }),
    ]);
    expect(r[0].query).toBe('запас');
    expect(r[0].upliftEst).toBeGreaterThan(r[1].upliftEst);
  });

  it('приріст ніколи не відʼємний', () => {
    const r = striking([row({ query: 'аномалія', position: 5, impressions: 500, clicks: 495 })]);
    expect(r[0].upliftEst).toBe(0);
  });
});

describe('канібалізація', () => {
  it('ловить дві сторінки на один запит', () => {
    const r = cannibalization([
      row({ query: 'кавоварка', page: '/cat/coffee', impressions: 600, clicks: 30, position: 6 }),
      row({ query: 'кавоварка', page: '/blog/coffee', impressions: 400, clicks: 5, position: 14 }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].pages).toHaveLength(2);
    expect(r[0].impressions).toBe(1000);
    // Найсильніша сторінка — перша: менеджеру одразу видно, кого залишати.
    expect(r[0].pages[0].page).toBe('/cat/coffee');
  });

  it('випадковий хвіст не рахується канібалізацією', () => {
    const r = cannibalization([
      row({ query: 'кавоварка', page: '/cat/coffee', impressions: 990, clicks: 40 }),
      row({ query: 'кавоварка', page: '/about', impressions: 10, clicks: 0 }),
    ]);
    expect(r).toHaveLength(0);
  });

  it('одна сторінка на запит — не знахідка', () => {
    expect(cannibalization([row({ query: 'один', impressions: 900, clicks: 40 })])).toHaveLength(0);
  });
});

describe('розрив CTR', () => {
  it('бере позицію в топі з CTR істотно нижчим за очікуваний', () => {
    const r = ctrGap([
      // Позиція 3 очікує ~11 %, тут 1 % — сніпет не працює.
      row({ query: 'видно, не клікають', position: 3, impressions: 2000, clicks: 20 }),
      // Позиція 3 з нормальним CTR — не знахідка.
      row({ query: 'нормально', position: 3, impressions: 2000, clicks: 210 }),
    ]);
    expect(r.map((x) => x.query)).toEqual(['видно, не клікають']);
    expect(r[0].expectedCtr).toBeGreaterThan(r[0].ctr);
  });

  it('глибокі позиції сюди не потрапляють — там низький CTR це норма', () => {
    expect(ctrGap([row({ query: 'глибоко', position: 18, impressions: 5000, clicks: 3 })])).toHaveLength(0);
  });
});

describe('згасання', () => {
  it('рахує падіння кліків по сторінці', () => {
    const now = [row({ page: '/p1', clicks: 30, impressions: 900 })];
    const prev = [row({ page: '/p1', clicks: 100, impressions: 1000 })];
    const r = decay(now, prev);
    expect(r).toHaveLength(1);
    expect(r[0].dropPct).toBe(70);
  });

  it('дрібні числа не дають фальшивого «−67 %»', () => {
    const r = decay([row({ page: '/p1', clicks: 1 })], [row({ page: '/p1', clicks: 3 })]);
    expect(r).toHaveLength(0);
  });

  it('сторінка, що зникла повністю, — падіння на 100 %', () => {
    const r = decay([], [row({ page: '/gone', clicks: 80 })]);
    expect(r[0]).toMatchObject({ page: '/gone', clicksNow: 0, dropPct: 100 });
  });

  it('зростання не потрапляє у згасання', () => {
    expect(decay([row({ page: '/p', clicks: 200 })], [row({ page: '/p', clicks: 100 })])).toHaveLength(0);
  });
});

describe('buildSearchDigest', () => {
  const rows: GscRow[] = [
    row({ page: '/cat/a', query: 'a', clicks: 50, impressions: 1000, position: 6 }),
    row({ page: '/blog/a', query: 'a', clicks: 4, impressions: 500, position: 15 }),
    row({ page: '/cat/b', query: 'b', clicks: 2, impressions: 900, position: 3 }),
  ];

  it('середня позиція зважена за показами, а не проста', () => {
    const d = buildSearchDigest({ site: 'sc-domain:shop.ua', period: { start: '2026-07-01', end: '2026-07-28' }, rows });
    // Проста середня по трьох рядках = 8.0; зважена = (6*1000+15*500+3*900)/2400 = 6.75.
    expect(d.totals.position).toBe(6.8);
  });

  it('рахує підсумки й розміри вибірки', () => {
    const d = buildSearchDigest({ site: 's', period: { start: 'a', end: 'b' }, rows });
    expect(d.totals.clicks).toBe(56);
    expect(d.totals.impressions).toBe(2400);
    expect(d.counts.pages).toBe(3);
    expect(d.counts.queries).toBe(2);
  });

  it('без попереднього періоду згасання порожнє, а не вигадане', () => {
    const d = buildSearchDigest({ site: 's', period: { start: 'a', end: 'b' }, rows });
    expect(d.decay).toEqual([]);
    expect(d.prevPeriod).toBeUndefined();
  });

  it('CTR рахується з кліків і показів, навіть коли в рядку він приїхав у відсотках', () => {
    const d = buildSearchDigest({
      site: 's', period: { start: 'a', end: 'b' },
      rows: [row({ clicks: 10, impressions: 100, ctr: 10 })],   // 10 замість 0.1
    });
    expect(d.totals.ctr).toBe(10);
  });

  it('підсумковий рядок згадує згасання лише коли є з чим порівнювати', () => {
    const one = buildSearchDigest({ site: 's', period: { start: 'a', end: 'b' }, rows });
    expect(digestSummary(one)).not.toContain('згасают');
    const two = buildSearchDigest({
      site: 's', period: { start: 'a', end: 'b' }, prevPeriod: { start: 'c', end: 'd' },
      rows, prevRows: [row({ page: '/cat/a', clicks: 200 })],
    });
    expect(digestSummary(two)).toContain('згасают');
  });
});
