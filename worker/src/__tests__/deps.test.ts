/**
 * Принятый риск в зависимостях — и условия, при которых он перестаёт быть
 * принятым.
 *
 * `npm audit` показывает в воркере две уязвимости, и обе НЕЛЬЗЯ закрыть
 * обновлением:
 *
 *   image-size (high, через pptxgenjs) — бесконечный цикл в разборе ICNS/JXL/
 *     HEIF. Уязвимы ВСЕ опубликованные версии (<=2.0.2 при последней 2.0.2),
 *     а pptxgenjs 4.0.1 тянет ^1.2.1 — то есть тоже уязвимую. `npm audit fix
 *     --force` предлагает pptxgenjs@1.1.5: откат на три мажора, который просто
 *     сломает экспорт презентаций.
 *
 *   uuid (moderate, через exceljs) — «missing buffer bounds check when buf is
 *     provided». exceljs 4.4.0 уже последний и держит uuid ^8, а исправление
 *     только в 11.1.1. Предлагаемый «фикс» exceljs@3.4.0 — снова откат.
 *
 * Единственная реальная защита здесь — недостижимость уязвимого кода. Она
 * проверяема, и этот тест её проверяет: перестанет быть правдой — упадёт, и
 * риск придётся пересматривать заново, а не считать принятым по инерции.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');
const sources = (() => {
  const out: string[] = [];
  (function walk(d: string) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) { if (e !== '__tests__') walk(p); }
      else if (/\.ts$/.test(e)) out.push(p);
    }
  })(SRC);
  return out;
})();
const code = sources.map((f) => ({ f: f.slice(SRC.length + 1), src: readFileSync(f, 'utf8') }));

describe('принятый риск: image-size через pptxgenjs', () => {
  it('обход исходников что-то нашёл', () => {
    expect(code.length).toBeGreaterThan(30);
    expect(code.map((c) => c.f)).toContain('export/pptx.ts');
  });

  /*
   * Единственный вход в image-size из pptxgenjs — addImage (и addMedia, который
   * зовёт его же). Пока их не зовут, разборщики ICNS/JXL/HEIF не исполняются
   * никогда: наши слайды состоят из текста и фигур.
   */
  it('addImage / addMedia не вызываются — уязвимый разборщик не исполняется', () => {
    const guilty = code
      .filter((c) => /\.(addImage|addMedia)\s*\(/.test(c.src))
      .map((c) => c.f);
    expect(guilty, 'появился вызов addImage: риск image-size больше не принятый — пересмотрите').toEqual([]);
  });

  it('состав API презентаций остался текстово-фигурным', () => {
    const pptx = code.find((c) => c.f === 'export/pptx.ts')!.src;
    const calls = [...pptx.matchAll(/\bslide\.(\w+)/g)].map((m) => m[1]);
    expect([...new Set(calls)].sort()).toEqual(['addShape', 'addText', 'background']);
  });
});

describe('принятый риск: uuid через exceljs', () => {
  /*
   * uuid в exceljs живёт в одном месте — сериализации расширенного условного
   * форматирования, то есть на пути ЗАПИСИ xlsx. Мы xlsx только читаем
   * (разбор опросника клиента), поэтому путь не исполняется. К тому же брешь
   * требует передачи буфера, чего exceljs не делает.
   */
  it('xlsx только читается, не записывается', () => {
    const writers = code
      .filter((c) => /\.xlsx\.write(File|Buffer)?\s*\(|addConditionalFormatting/.test(c.src))
      .map((c) => c.f);
    expect(writers, 'появилась запись xlsx: путь uuid стал достижим — пересмотрите риск').toEqual([]);
    // и убеждаемся, что чтение действительно есть — иначе тест ни о чём
    expect(code.some((c) => /\.xlsx\.readFile\s*\(/.test(c.src))).toBe(true);
  });
});

describe('дерево зависимостей не откатывали', () => {
  /*
   * Защита от «починки» через npm audit fix --force: он предлагает pptxgenjs
   * 1.1.5 вместо 3.12 и exceljs 3.4.0 вместо 4.4. Это не исправление, а откат
   * на мажоры назад, ломающий экспорт.
   */
  const pkg = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8'));
  const major = (r: string) => Number(String(r).replace(/^[^\d]*/, '').split('.')[0]);

  it('pptxgenjs не ниже 3, exceljs не ниже 4', () => {
    expect(major(pkg.dependencies.pptxgenjs)).toBeGreaterThanOrEqual(3);
    expect(major(pkg.dependencies.exceljs)).toBeGreaterThanOrEqual(4);
  });
});
