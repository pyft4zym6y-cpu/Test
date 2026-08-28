/**
 * Картка клієнта має відповідати менеджеру на пʼять питань: хто клієнт, що він
 * уже зробив, що замовив, що від нього треба зараз, що робить команда.
 *
 * Було інакше: аудит розрізаний на три вкладки («дані», «робота», «пакет»),
 * файли клієнта лежали в одних «Документах» разом із нашими дельіверабламі й
 * підключенням аналітики, а сайт клієнта — теж у «Документах». Сутності були
 * перемішані, і жодна вкладка не відповідала на питання цілком.
 */
import { describe, it, expect } from 'vitest';
import { U_TABS, DEEP_SECS, normalizeUTab, tierLabel, isLegacyTier } from '../shared';

describe('вкладки картки клієнта', () => {
  const ids = U_TABS.map((t) => t.id);

  it('аудит — одна вкладка, а не три', () => {
    expect(ids).toContain('deep');
    for (const gone of ['data', 'work', 'pack']) expect(ids).not.toContain(gone);
  });

  it('файли відокремлені від «Документів», яких більше немає', () => {
    expect(ids).toContain('files');
    expect(ids).not.toContain('docs');
  });

  it('кожна з пʼяти відповідей має свою вкладку', () => {
    for (const need of ['over', 'comp', 'express', 'deep', 'proj']) expect(ids).toContain(need);
  });

  it('старі адреси вкладок ведуть у нову структуру, а не мовчки на «Огляд»', () => {
    expect(normalizeUTab('data')).toBe('deep');
    expect(normalizeUTab('work')).toBe('deep');
    expect(normalizeUTab('pack')).toBe('deep');
    expect(normalizeUTab('docs')).toBe('files');
    expect(normalizeUTab('proj')).toBe('proj');
    expect(normalizeUTab('казна-що')).toBe('over');
    expect(normalizeUTab(undefined)).toBe('over');
  });
});

describe('один глибокий аудит замість рівнів', () => {
  it('усередині — рівно питання · доступи · файли · результат', () => {
    expect(DEEP_SECS.map((s) => s.l)).toEqual(['Питання', 'Доступи', 'Файли', 'Результат']);
  });

  it('коди рівнів не потрапляють в інтерфейс навіть зі старих записів', () => {
    expect(tierLabel('DEEP')).toBe('Глибокий аудит');
    for (const legacy of ['T1', 'T2', 'T3', 'T4']) {
      expect(isLegacyTier(legacy)).toBe(true);
      expect(tierLabel(legacy)).not.toMatch(/^T\d$/);
      expect(tierLabel(legacy)).toMatch(/Архівний/);
    }
  });

  it('невідомий ключ не ламає підпис', () => {
    expect(tierLabel('SOMETHING')).toBe('SOMETHING');
    expect(isLegacyTier('SOMETHING')).toBe(false);
  });
});
