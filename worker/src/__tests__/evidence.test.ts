/**
 * Уровни доказательства. Проверяется не форматирование, а смысл: чем именно мы
 * считаем источник и не считаем ли один и тот же источник дважды.
 */
import { describe, it, expect } from 'vitest';
import { buildEvidence, levelSummary } from '../evidence.js';

const gsc = {
  period: { start: '2026-07-30', end: '2026-08-26' },
  totals: { clicks: 4120, impressions: 210400, ctr: 1.96, position: 14.2 },
  counts: { rows: 5000, pages: 812, queries: 3910 },
};

describe('buildEvidence — Search Console', () => {
  it('разбор данных вытесняет строку «доступ выдан»: один источник, не два', () => {
    const src = buildEvidence({
      accesses: [{ system: 'Google Search Console', status: 'granted' }],
      search: gsc,
    });
    const l1 = src.filter((x) => x.level === 'L1');
    expect(l1).toHaveLength(1);
    expect(l1[0].id).toBe('l1:gsc');
    expect(l1[0].title).toContain('2026-07-30');
  });

  it('без разбора доступ остаётся L1 — доступ есть, данных мы просто не забрали', () => {
    const src = buildEvidence({ accesses: [{ system: 'Google Search Console', status: 'granted' }] });
    expect(src.filter((x) => x.level === 'L1')).toHaveLength(1);
    expect(src.find((x) => x.level === 'L1')?.id).toBe('acc:Google Search Console');
  });

  it('вытесняется только та система, по которой есть разбор', () => {
    const src = buildEvidence({
      accesses: [
        { system: 'Google Search Console', status: 'granted' },
        { system: 'Google Analytics 4', status: 'granted' },
      ],
      search: gsc,
    });
    const l1 = src.filter((x) => x.level === 'L1').map((x) => x.id);
    expect(l1).toContain('l1:gsc');
    expect(l1).toContain('acc:Google Analytics 4');
    expect(l1).toHaveLength(2);
  });

  it('чтение данных не равно проверке настройки: trust остаётся unverified', () => {
    const src = buildEvidence({ search: gsc });
    expect(src.find((x) => x.id === 'l1:gsc')?.trust).toBe('unverified');
  });

  it('показы есть, кликов ноль — это подозрение на поломку, а не отсутствие спроса', () => {
    const src = buildEvidence({ search: { ...gsc, totals: { ...gsc.totals, clicks: 0 } } });
    const s = src.find((x) => x.id === 'l1:gsc');
    expect(s?.trust).toBe('suspect');
    expect(s?.why).toMatch(/привязк/);
  });

  it('обрезанная выборка названа явно', () => {
    const src = buildEvidence({ search: { ...gsc, counts: { ...gsc.counts, truncated: true } } });
    expect(src.find((x) => x.id === 'l1:gsc')?.why).toMatch(/обрезан/);
  });
});

describe('buildEvidence — уровни не подменяют друг друга', () => {
  it('L1 не отменяет C: анкета остаётся отдельным источником', () => {
    const n = levelSummary(buildEvidence({
      accesses: [{ system: 'Google Search Console', status: 'granted' }],
      search: gsc,
      answersCount: { done: 400, total: 643 },
      notes: ['разговор с владельцем'],
    }));
    expect(n.L1).toBe(1);
    expect(n.C).toBe(2);
  });

  it('тонкая анкета помечается как подозрительная, а не отбрасывается', () => {
    const src = buildEvidence({ answersCount: { done: 40, total: 643 } });
    const survey = src.find((x) => x.id === 'c:survey');
    expect(survey?.level).toBe('C');
    expect(survey?.trust).toBe('suspect');
  });

  it('пустой пакет не выдумывает источников', () => {
    expect(buildEvidence({})).toEqual([]);
    expect(buildEvidence(null)).toEqual([]);
  });
});
