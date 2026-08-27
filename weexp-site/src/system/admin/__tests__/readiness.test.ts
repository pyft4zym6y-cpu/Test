/**
 * Оцінка готовності до прогону. Головна вимога — чесність шкали: якщо вона
 * показує 70 % там, де реально є тільки обхід, менеджер запустить прогін
 * спокійно й дізнається правду через сорок хвилин.
 */
import { describe, it, expect } from 'vitest';
import { assessReadiness } from '../readiness';
import type { DiagRecord } from '@/lib/supa';

const withAccess = (...ids: string[]): DiagRecord => ({
  accessLog: Object.fromEntries(ids.map((id) => [id, { status: 'granted' as const }])),
});

describe('assessReadiness — порожній клієнт', () => {
  const r = assessReadiness({}, 0);

  it('загальна готовність низька, а не «майже все є»', () => {
    expect(r.overall).toBeLessThan(45);
  });

  it('вердикт прямо каже, що фінансів і реклами не буде', () => {
    expect(r.verdict).toMatch(/зовнішній аудит/i);
    expect(r.verdict).toMatch(/ДО прогону/);
  });

  it('Website готовий і без клієнта — його дає обхід', () => {
    expect(r.docs.find((d) => d.code === 'A5')!.pct).toBeGreaterThanOrEqual(90);
  });

  it('Business без P&L майже порожній', () => {
    expect(r.docs.find((d) => d.code === 'A1')!.pct).toBeLessThanOrEqual(15);
  });

  it('Organization без анкети — нуль: він цілком з інтервʼю', () => {
    expect(r.docs.find((d) => d.code === 'A12')!.pct).toBe(0);
  });

  it('найслабші документи стоять першими — щоб їх було видно', () => {
    expect(r.docs[0].pct).toBeLessThanOrEqual(r.docs[r.docs.length - 1].pct);
  });
});

describe('assessReadiness — доступи піднімають рівно свій документ', () => {
  it('Search Console піднімає SEO і не чіпає Business', () => {
    const before = assessReadiness({}, 0);
    const after = assessReadiness(withAccess('CB-03'), 0);
    expect(after.docs.find((d) => d.code === 'A6')!.pct).toBeGreaterThan(before.docs.find((d) => d.code === 'A6')!.pct);
    expect(after.docs.find((d) => d.code === 'A1')!.pct).toBe(before.docs.find((d) => d.code === 'A1')!.pct);
  });

  it('GA4 і GTM разом закривають Analytics повністю за наявності анкети', () => {
    const r = assessReadiness(withAccess('CB-01', 'CB-02'), 1);
    expect(r.docs.find((d) => d.code === 'A9')!.pct).toBe(100);
  });

  it('запитаний, але не виданий доступ не рахується', () => {
    const r = assessReadiness({ accessLog: { 'CB-03': { status: 'requested' } } } as DiagRecord, 0);
    const seo = r.docs.find((d) => d.code === 'A6')!;
    expect(seo.missing).toContain('Search Console');
  });

  it('чого бракує — названо системою, а не кодом AC-03', () => {
    const r = assessReadiness({}, 0);
    const acq = r.docs.find((d) => d.code === 'A7')!;
    expect(acq.missing).toEqual(expect.arrayContaining(['Google Ads', 'Meta Ads']));
    expect(acq.missing.join(' ')).not.toMatch(/AC-\d/);
  });
});

describe('assessReadiness — анкета', () => {
  it('частково заповнена анкета дає частковий приріст, а не все або нічого', () => {
    const half = assessReadiness({}, 0.5).docs.find((d) => d.code === 'A12')!.pct;
    const full = assessReadiness({}, 1).docs.find((d) => d.code === 'A12')!.pct;
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(full);
  });

  it('малозаповнена анкета лишається в «бракує» з відсотком', () => {
    const r = assessReadiness({}, 0.2);
    expect(r.docs.find((d) => d.code === 'A12')!.missing.join(' ')).toMatch(/анкета \(заповнено 20 %\)/);
  });
});

describe('assessReadiness — що просити першим', () => {
  it('нагорі те, що розблокує найбільше документів', () => {
    const r = assessReadiness({}, 0);
    expect(r.asks.length).toBeGreaterThan(0);
    expect(r.asks[0].unlocks.length).toBeGreaterThanOrEqual(r.asks[r.asks.length - 1].unlocks.length);
  });

  it('анкета збирається в один пункт, а не повторюється по документах', () => {
    const r = assessReadiness({}, 0);
    expect(r.asks.filter((a) => a.kind === 'answers')).toHaveLength(1);
  });

  it('те, що вже є, у списку прохань не зʼявляється', () => {
    const r = assessReadiness(withAccess('CB-01', 'CB-02', 'CB-03'), 1);
    expect(r.asks.some((a) => a.what === 'Search Console')).toBe(false);
  });
});

describe('assessReadiness — повний комплект', () => {
  it('з усіма доступами, файлами й анкетою вердикт стає впевненим', () => {
    const rec: DiagRecord = {
      ...withAccess('CB-01', 'CB-02', 'CB-03', 'CB-05', 'CB-07', 'CB-08', 'CB-09', 'CB-10'),
      clientFiles: [
        { id: 'f1', title: 'P&L за 12–24 міс', group: 'Фінанси' },
        { id: 'f2', title: 'Юніт-економіка', group: 'Фінанси' },
        { id: 'f3', title: 'Вивантаження замовлень', group: 'Дані' },
        { id: 'f4', title: 'Продажі по SKU', group: 'Дані' },
        { id: 'f5', title: 'Каталог товарів', group: 'Дані' },
      ],
    } as unknown as DiagRecord;
    const r = assessReadiness(rec, 1);
    expect(r.overall).toBeGreaterThanOrEqual(90);
    expect(r.verdict).toMatch(/достатньо/);
    expect(r.asks).toHaveLength(0);
  });

  it('відсоток ніколи не перевищує 100', () => {
    const r = assessReadiness(withAccess('CB-01', 'CB-02'), 1);
    expect(Math.max(...r.docs.map((d) => d.pct))).toBeLessThanOrEqual(100);
  });
});
