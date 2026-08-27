/**
 * Детектори аномалій. Тут важливіше не «спрацював», а «НЕ спрацював на
 * звичайному дні»: детектор, який шумить щодня, перестають читати на третій
 * день, і тоді він гірший за відсутній.
 */
import { describe, it, expect } from 'vitest';
import { findAnomalies, filterEvents, actorsOf, kindsOf } from '../eventAudit';
import type { AdminEventRow } from '@/lib/supa';

let seq = 0;
const ev = (p: Partial<AdminEventRow> & { at: string }): AdminEventRow => ({
  id: (seq += 1), actor: 'manager@weexp.agency', kind: 'patch', user_id: 'u-1', subject: null, detail: null, ...p,
});
/** База: робочий день, 10-та ранку. */
const at = (min: number, day = 12, hour = 10) => new Date(Date.UTC(2026, 7, day, hour, min)).toISOString();

describe('findAnomalies — сплеск руйнівних дій', () => {
  it('пʼять видалень за десять хвилин — це сигнал', () => {
    const rows = [0, 1, 2, 3, 4].map((i) => ev({ at: at(i), kind: 'tier_clear', detail: 'видалено доступ' }));
    const a = findAnomalies(rows);
    expect(a.some((x) => x.title.includes('руйнівних'))).toBe(true);
    expect(a.find((x) => x.title.includes('руйнівних'))?.level).toBe('warn');
  });

  it('ті самі пʼять, але за три години — не сигнал', () => {
    const rows = [0, 40, 80, 120, 160].map((i) => ev({ at: at(i), kind: 'tier_clear', detail: 'видалено' }));
    expect(findAnomalies(rows).some((x) => x.title.includes('руйнівних'))).toBe(false);
  });

  it('звичайні правки не рахуються руйнівними', () => {
    const rows = [0, 1, 2, 3, 4, 5].map((i) => ev({ at: at(i), kind: 'patch', detail: 'company' }));
    expect(findAnomalies(rows).some((x) => x.title.includes('руйнівних'))).toBe(false);
  });

  it('дії різних людей не складаються в один сплеск', () => {
    const rows = ['a@w.ua', 'b@w.ua', 'c@w.ua', 'd@w.ua', 'e@w.ua']
      .map((actor, i) => ev({ at: at(i), actor, kind: 'tier_clear', detail: 'видалено' }));
    expect(findAnomalies(rows).some((x) => x.title.includes('руйнівних'))).toBe(false);
  });
});

describe('findAnomalies — широта', () => {
  it('десять різних клієнтів за десять хвилин — схоже на скрипт', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ev({ at: at(i), user_id: `u-${i}` }));
    const a = findAnomalies(rows);
    expect(a.some((x) => x.title.includes('різних клієнтів'))).toBe(true);
  });

  it('десять дій по ОДНОМУ клієнту — це просто робота в картці', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ev({ at: at(i), user_id: 'u-1' }));
    expect(findAnomalies(rows).some((x) => x.title.includes('різних клієнтів'))).toBe(false);
  });

  it('події без клієнта не роздувають лічильник широти', () => {
    const rows = Array.from({ length: 12 }, (_, i) => ev({ at: at(i), user_id: null }));
    expect(findAnomalies(rows).some((x) => x.title.includes('різних клієнтів'))).toBe(false);
  });
});

describe('findAnomalies — ніч і нові актори', () => {
  it('поодинока нічна правка — не сигнал: це просто пізній вечір', () => {
    const rows = [ev({ at: at(0, 12, 23) })];
    expect(findAnomalies(rows).some((x) => x.title.includes('уночі'))).toBe(false);
  });

  it('багато нічних дій — info, а не попередження: сама по собі ніч нічого не означає', () => {
    const rows = Array.from({ length: 6 }, (_, i) => ev({ at: at(i, 12, 2), user_id: 'u-1' }));
    const night = findAnomalies(rows).find((x) => x.title.includes('уночі'));
    expect(night).toBeDefined();
    expect(night?.level).toBe('info');
  });

  it('новий актор помічається, але тільки якщо вже щось робив', () => {
    const rows = [
      ...Array.from({ length: 3 }, (_, i) => ev({ at: at(i), actor: 'new@w.ua' })),
      ev({ at: at(0, 1), actor: 'old@w.ua' }),
      ev({ at: at(0, 12), actor: 'old@w.ua' }),
    ];
    const a = findAnomalies(rows);
    expect(a.some((x) => x.actor === 'new@w.ua' && x.title === 'Новий у журналі')).toBe(true);
    expect(a.some((x) => x.actor === 'old@w.ua' && x.title === 'Новий у журналі')).toBe(false);
  });

  it('одна-дві дії нового актора ще не сигнал', () => {
    const rows = [ev({ at: at(0), actor: 'new@w.ua' }), ev({ at: at(1), actor: 'new@w.ua' })];
    expect(findAnomalies(rows).some((x) => x.title === 'Новий у журналі')).toBe(false);
  });
});

describe('findAnomalies — межові випадки', () => {
  it('порожній журнал не дає аномалій і не падає', () => {
    expect(findAnomalies([])).toEqual([]);
  });

  it('попередження стоять вище за info', () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, i) => ev({ at: at(i, 12, 2), kind: 'tier_clear', detail: 'видалено' })),
    ];
    const a = findAnomalies(rows);
    expect(a.length).toBeGreaterThan(1);
    expect(a[0].level).toBe('warn');
  });

  it('пороги налаштовуються: із суворішим порогом сигнал зникає', () => {
    const rows = [0, 1, 2, 3, 4].map((i) => ev({ at: at(i), kind: 'tier_clear', detail: 'видалено' }));
    expect(findAnomalies(rows, { destructiveBurst: 20 }).some((x) => x.title.includes('руйнівних'))).toBe(false);
  });
});

describe('фільтри журналу', () => {
  const rows = [
    ev({ at: at(0), actor: 'a@w.ua', kind: 'patch', detail: 'company' }),
    ev({ at: at(1), actor: 'b@w.ua', kind: 'tier_status', subject: 'DEEP' }),
    ev({ at: at(2), actor: 'a@w.ua', kind: 'projects', detail: 'створено проєкт' }),
  ];

  it('порожній фільтр не звужує — «усе» має бути станом за умовчанням', () => {
    expect(filterEvents(rows, {})).toHaveLength(3);
  });

  it('фільтр по людині', () => {
    expect(filterEvents(rows, { actor: 'a@w.ua' })).toHaveLength(2);
  });

  it('фільтр по типу дії', () => {
    expect(filterEvents(rows, { kind: 'tier_status' })).toHaveLength(1);
  });

  it('пошук іде і по деталях, і по темі', () => {
    expect(filterEvents(rows, { q: 'проєкт' })).toHaveLength(1);
    expect(filterEvents(rows, { q: 'deep' })).toHaveLength(1);
  });

  it('фільтри складаються', () => {
    expect(filterEvents(rows, { actor: 'a@w.ua', kind: 'projects' })).toHaveLength(1);
  });

  it('списки для фільтрів без дублів і відсортовані', () => {
    expect(actorsOf(rows)).toEqual(['a@w.ua', 'b@w.ua']);
    expect(kindsOf(rows)).toEqual(['patch', 'projects', 'tier_status']);
  });
});
