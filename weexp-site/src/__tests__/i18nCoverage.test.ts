/**
 * Двуязычие держится на дисциплине: строка либо идёт через t('укр','eng'),
 * либо остаётся украинской на /en навсегда — и молча.
 *
 * Найдено этим тестом: экран ошибки всего приложения и сообщение о сбое капчи
 * были только украинскими. Оба — состояния ошибки, то есть самый неудачный
 * момент, чтобы англоязычный посетитель увидел непонятный текст.
 *
 * Админка и кабинет сюда НЕ входят: по CONVENTIONS.md это внутренний инструмент
 * украинской команды, и украинский там — решение, а не упущение.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const ROOT = join(__dirname, '..');
/** Экраны только для своих — украинский там по конвенции. */
const INTERNAL = ['system/admin/', 'system/AdminPanel', 'system/AuditBuilder', 'system/Cabinet', 'system/AuditForm'];

function resolveSpec(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null;
  const cands = extname(base) ? [base] : ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((x) => base + x);
  return cands.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

/** Файлы, до которых реально доходит приложение. */
function reachable(): string[] {
  const entries = ['main.tsx', 'App.tsx'].map((f) => join(ROOT, f)).filter(existsSync);
  const seen = new Set(entries);
  const q = [...entries];
  while (q.length) {
    const f = q.pop()!;
    const src = readFileSync(f, 'utf8');
    const specs = [
      ...[...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]),
      ...[...src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]),
    ];
    for (const s of specs) {
      const r = resolveSpec(s, f);
      if (r && !seen.has(r)) { seen.add(r); q.push(r); }
    }
  }
  return [...seen];
}

/** Кириллица в разметке, НЕ прошедшая через t('укр','eng'). */
function untranslated(file: string): string[] {
  const src = readFileSync(file, 'utf8')
    .replace(/\bt\(\s*'(?:[^'\\]|\\.)*'\s*,\s*'(?:[^'\\]|\\.)*'\s*\)/g, 'T()')
    .replace(/\btr\(\s*'(?:[^'\\]|\\.)*'\s*,\s*'(?:[^'\\]|\\.)*'\s*\)/g, 'T()');
  return [...src.matchAll(/>\s*([^<>{}\n]*[а-яїієґА-ЯЇІЄҐ][^<>{}\n]*?)\s*</g)]
    .map((m) => m[1].trim())
    .filter((x) => x.length >= 4);
}

const publicFiles = reachable()
  .filter((f) => f.endsWith('.tsx'))
  .filter((f) => !INTERNAL.some((p) => f.slice(ROOT.length + 1).startsWith(p)));

describe('английская версия', () => {
  it('обход графа вообще работает — иначе тест пустой', () => {
    expect(publicFiles.length).toBeGreaterThan(15);
  });

  it('на публичных страницах не остаётся украинского текста мимо t()', () => {
    const gaps = publicFiles
      .flatMap((f) => untranslated(f).map((s) => `${f.slice(ROOT.length + 1)}: «${s.slice(0, 60)}»`));
    expect(gaps).toEqual([]);
  });

  it('парных вызовов достаточно, чтобы считать сайт двуязычным', () => {
    const n = publicFiles.reduce((s, f) =>
      s + (readFileSync(f, 'utf8').match(/\bt\(\s*'(?:[^'\\]|\\.)*'\s*,\s*'/g)?.length ?? 0), 0);
    expect(n).toBeGreaterThan(200);
  });

  it('второй аргумент нигде не пуст и не равен первому', () => {
    const bad: string[] = [];
    for (const f of publicFiles) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) {
        const [, uk, en] = m;
        if (!en.trim()) bad.push(`${f.slice(ROOT.length + 1)}: пустой перевод «${uk.slice(0, 40)}»`);
        else if (uk.trim() === en.trim() && /[а-яїієґ]/i.test(uk)) bad.push(`${f.slice(ROOT.length + 1)}: не переведено «${uk.slice(0, 40)}»`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('экран ошибки приложения переведён — он показывается, когда сломалось всё', () => {
    const app = readFileSync(join(ROOT, 'App.tsx'), 'utf8');
    expect(app).toMatch(/This page failed to load/);
    // Мова береться з URL, а не з контексту: контекст у момент збою міг зламатись.
    expect(app).toMatch(/langOf\(location\.pathname\)/);
  });
});
