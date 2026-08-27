/**
 * Пробелы в наборе линз. Скилл, не влезший в лимит или отсутствующий в образе,
 * раньше жил одной строкой лога: аудит, прошедший без трёх линз, в Run Record
 * выглядел ровно как полный, и понять это постфактум было неоткуда.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resetSkillGaps, getSkillGaps } from '../skillRegistry.js';

const PIPELINE = readFileSync(join(__dirname, '..', 'pipeline.ts'), 'utf8');
const REGISTRY = readFileSync(join(__dirname, '..', 'skillRegistry.ts'), 'utf8');

describe('накопитель пробелов', () => {
  beforeEach(() => resetSkillGaps());

  it('чистый прогон не даёт пробелов', () => {
    expect(getSkillGaps()).toEqual({});
  });

  it('сброс между прогонами обязателен — иначе чужие пробелы приедут в чужой отчёт', () => {
    expect(PIPELINE).toContain('resetSkillGaps()');
    // Сброс должен стоять рядом с обнулением счётчика токенов, то есть в начале
    // прогона, а не где-нибудь после сборки документов.
    const reset = PIPELINE.indexOf('resetSkillGaps()');
    const firstDoc = PIPELINE.indexOf("join(dir, 'dataset.json')");
    expect(reset).toBeGreaterThan(0);
    expect(reset).toBeLessThan(firstDoc);
  });

  it('пробелы попадают в метрики прогона, а не только в лог', () => {
    expect(PIPELINE).toContain('getSkillGaps()');
    expect(PIPELINE).toContain('skillGaps = gaps');
  });
});

describe('промпт называет то, чего в нём нет', () => {
  it('и отброшенные по лимиту, и отсутствующие в образе', () => {
    // Раньше в примечание для модели уходили только отброшенные. Отсутствующий
    // скилл — случай хуже: линзы нет вовсе, а модель об этом не знала.
    expect(REGISTRY).toContain('const missing = [...dropped, ...absent];');
    expect(REGISTRY).toMatch(/Не вошли в этот прогон: \$\{missing\.join/);
  });

  it('модели прямо запрещено делать выводы по отсутствующему предмету', () => {
    expect(REGISTRY).toContain('Выводы по их предмету делать нельзя');
  });
});
