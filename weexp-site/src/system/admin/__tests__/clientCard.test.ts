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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

/**
 * Друга ітерація структури картки: історія, зрозумілі проєкти, напрямки файлів
 * і розділення «матеріали про клієнта» ↔ «внутрішнє команди».
 */
describe('картка клієнта: назви кажуть, що це', () => {
  const detail = readFileSync(join(__dirname, '..', 'UserDetail.tsx'), 'utf8');
  const files = readFileSync(join(__dirname, '..', 'panels-client.tsx'), 'utf8');
  const proj = readFileSync(join(__dirname, '..', 'ProjectsManager.tsx'), 'utf8');

  it('внутрішній шар має власну вкладку, а не лежить серед матеріалів клієнта', () => {
    expect(U_TABS.map((t) => t.id)).toContain('inner');
    expect(detail).toMatch(/utab === 'inner' && <Block title="Нотатки команди/);
    expect(detail).not.toMatch(/utab === 'over' && <Block title="Внутрішні нотатки/);
  });

  it('в «Огляді» — історія взаємодії, зібрана з даних', () => {
    expect(detail).toMatch(/Історія взаємодії/);
    expect(detail).toMatch(/clientTimeline\(row, leads\)/);
  });

  it('файли названі за тим, що сталося, а не стрілками', () => {
    expect(files).toContain('Отримано від клієнта');
    expect(files).toContain('Передано клієнту');
    expect(files).not.toMatch(/Клієнт → агентство|Агентство → клієнт/);
  });

  it('новий проєкт не називається «Проект N»', () => {
    expect(proj).not.toMatch(/np\.title = `Проект \$\{list\.length \+ 1\}`/);
    expect(proj).toMatch(/\[company, 'проєкт'\]/);
  });

  it('картка проєкту називає клієнта, тип роботи, відповідального і старт', () => {
    for (const field of ['Клієнт', 'Тип роботи', 'Відповідальний', 'Старт']) {
      expect(proj, field).toContain(`<i>${field}</i>`);
    }
  });
});
