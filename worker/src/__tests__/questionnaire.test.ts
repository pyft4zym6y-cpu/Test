/**
 * Разбор файла опросника. Путь недоверенного ввода: файл приносит КЛИЕНТ,
 * поэтому здесь же и проверяем, что мы больше не зовём уязвимый парсер.
 *
 * Фикстуры Excel собирает НАШ собственный генератор (`src/xlsx.ts`, OOXML
 * поверх своего zip) — то есть читатель и писатель здесь независимые
 * реализации, и тест ловит расхождение между ними, а не согласованный баг.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { makeXlsx } from '../xlsx.js';
import { extract } from '../questionnaire.js';

let dir = '';
beforeAll(async () => { dir = await mkdtemp(join(tmpdir(), 'weexp-q-')); });
afterAll(async () => { await rm(dir, { recursive: true, force: true }); });

describe('extract — Excel', () => {
  it('читает книгу нашего генератора: листы, кириллица, числа, экранирование', async () => {
    const path = join(dir, 'q.xlsx');
    await writeFile(path, makeXlsx([
      { name: 'Опитувальник', header: ['Питання', 'Відповідь'], rows: [
        ['Головна бізнес-ціль', 'вийти на ринок Польщі'],
        ['Оборот на місяць (€)', 85000],
        ['Кома і "лапки"', 'значення з комою, і "лапками"'],
      ] },
      { name: 'Ринки', header: ['Країна', 'Частка'], rows: [['UA', 0.72], ['PL', 0.18]] },
    ]), );
    const { text } = await extract(path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(text).toContain('# Опитувальник');
    expect(text).toContain('# Ринки');
    expect(text).toContain('вийти на ринок Польщі');
    expect(text).toContain('85000');
    // Значение с запятой и кавычками обязано пережить сборку CSV.
    expect(text).toContain('"значення з комою, і ""лапками"""');
  });

  it('разворачивает формулы, ссылки, richText и даты — не в [object Object]', async () => {
    const path = join(dir, 'rich.xlsx');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Тест');
    ws.addRow(['Сума', 100]);
    ws.addRow(['Формула', { formula: 'B1*2', result: 200 }]);
    ws.addRow(['Лінк', { text: 'наш прайс', hyperlink: 'https://example.com/p.csv' }]);
    ws.addRow(['Rich', { richText: [{ text: 'жирне ' }, { text: 'і звичайне' }] }]);
    ws.addRow(['Дата', new Date('2026-03-01T00:00:00Z')]);
    await wb.xlsx.writeFile(path);

    const { text } = await extract(path, 'xlsx');
    expect(text).not.toContain('[object Object]');
    expect(text).toContain('200');
    expect(text).toContain('наш прайс');
    expect(text).toContain('жирне і звичайне');
    expect(text).toContain('2026-03-01');
  });

  it('пустые колонки посередине не схлопываются — таблица не съезжает', async () => {
    const path = join(dir, 'gap.xlsx');
    await writeFile(path, makeXlsx([
      { name: 'Лист', rows: [['A', '', 'C'], ['1', '', '3']] },
    ]));
    const { text } = await extract(path, 'xlsx');
    expect(text).toContain('A,,C');
    expect(text).toContain('1,,3');
  });
});

describe('extract — остальные форматы', () => {
  it('CSV отдаётся текстом, без парсера книги', async () => {
    const path = join(dir, 'q.csv');
    await writeFile(path, 'Питання,Відповідь\nЦіль,експансія в PL\n', 'utf8');
    const { text } = await extract(path, 'text/csv');
    expect(text).toContain('експансія в PL');
  });

  it('JSON возвращается как json, а не как текст', async () => {
    const path = join(dir, 'q.json');
    await writeFile(path, JSON.stringify({ business_goal: { answer: 'рост' } }), 'utf8');
    const { json, text } = await extract(path, 'application/json');
    expect(text).toBeUndefined();
    expect(json).toEqual({ business_goal: { answer: 'рост' } });
  });

  it('устаревший .xls отклоняется с внятной причиной, а не парсится', async () => {
    const path = join(dir, 'old.xls');
    await writeFile(path, 'что угодно', 'utf8');
    await expect(extract(path, 'application/vnd.ms-excel')).rejects.toThrow(/\.xls/);
  });

  it('.xlsx с mime ms-excel.sheet НЕ считается устаревшим .xls', async () => {
    const path = join(dir, 'new.xlsx');
    await writeFile(path, makeXlsx([{ name: 'Л', rows: [['ок']] }]));
    const { text } = await extract(path, 'application/vnd.ms-excel.sheet.macroEnabled.12');
    expect(text).toContain('ок');
  });
});
