import { describe, it, expect } from 'vitest';
import { parseOrdersCsv } from '../orders';

const csv = (rows: string[]) =>
  ['order_id;order_date;customer_email;total_uah;status;channel', ...rows].join('\n');

describe('parseOrdersCsv', () => {
  it('считает рычаги по нормальной выгрузке', () => {
    const r = parseOrdersCsv(csv([
      '1;2025-01-10;a@x;1000;выполнен;сайт',
      '2;2025-02-10;a@x;2000;выполнен;сайт',
      '3;2025-02-12;b@x;3000;выполнен;розетка',
      '4;2025-03-05;a@x;1000;выполнен;сайт',
      '5;2025-03-06;c@x;2000;выполнен;сайт',
    ]));
    expect('error' in r).toBe(false);
    const m = r as Exclude<typeof r, { error: string }>;
    expect(m.activeBase).toBe(3);
    expect(m.aov).toBe(1800);
    expect(Number.isFinite(m.monthlyRevenue)).toBe(true);
    expect(m.channels.every((c) => Number.isFinite(c.share))).toBe(true);
  });

  /*
   * Регресс, ради которого писан этот файл: выгрузка, где все заказы отменены,
   * разбиралась «успешно» и отдавала NaN в aov / repeatRevenueShare / долях
   * каналов. applyOrders записывал этот NaN прямо в рычаги, и весь денежный
   * блок отчёта клиента печатался как «NaN ₴».
   */
  it('не отдаёт метрики, когда ни одного оплаченного заказа нет', () => {
    const r = parseOrdersCsv(csv([
      '1;2025-01-10;a@x;1000;возврат;сайт',
      '2;2025-02-10;b@x;2000;отменён;сайт',
      '3;2025-02-11;c@x;0;выполнен;сайт',
    ]));
    expect(r).toHaveProperty('error');
  });

  it('ни одно поле метрик не является NaN ни на каких разобранных данных', () => {
    const r = parseOrdersCsv(csv([
      '1;2025-01-10;;1000;;',
      '2;2025-01-11;;500;;',
      '3;2025-01-12;;250;;',
    ]));
    expect('error' in r).toBe(false);
    const m = r as Exclude<typeof r, { error: string }>;
    const nan = Object.entries(m).filter(([, v]) => typeof v === 'number' && !Number.isFinite(v)).map(([k]) => k);
    expect(nan).toEqual([]);
    for (const c of m.channels) expect(Number.isFinite(c.share)).toBe(true);
  });

  it('отбрасывает неполный последний месяц уже при двух месяцах данных', () => {
    // январь полный (100 000), февраль оборван на одном заказе (1 000).
    const r = parseOrdersCsv(csv([
      '1;2025-01-05;a@x;50000;выполнен;сайт',
      '2;2025-01-20;b@x;50000;выполнен;сайт',
      '3;2025-02-01;c@x;1000;выполнен;сайт',
    ]));
    const m = r as Exclude<typeof r, { error: string }>;
    // при прежнем пороге `months.length > 3` февраль попадал в среднее и
    // ронял monthlyRevenue со 100 000 до 50 500
    expect(m.monthlyRevenue).toBe(100000);
  });
});
