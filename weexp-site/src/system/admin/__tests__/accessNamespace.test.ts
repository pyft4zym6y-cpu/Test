/**
 * Два каталога доступов, один префикс идентификаторов.
 *
 * `weexp-site/src/data/accessCatalog.ts` (кабинет клиента) и
 * `portal/src/data/accesses.json` (портал глубокого аудита) независимо
 * раздают идентификаторы вида AC-NN. Из 32 общих номеров 19 означают РАЗНЫЕ
 * системы: AC-22 в портале — «остатки и закупочные цены», в кабинете —
 * «CDP / програма лояльності».
 *
 * Свести их в один каталог нельзя дёшево: обе стороны персистят id как ключ
 * (`accessLog` в diagnostics; `access_status(client_id, access_id)` и пути в
 * Storage `uploads/<client>/<access_id>/…` в портале). Переименование — это
 * миграция и данных, и объектов хранилища, и она упирается в вопрос, нужны ли
 * два клиентских входа вообще. Это решение продукта, а не рефакторинг.
 *
 * Поэтому тест держит не «одинаковость», а то, что делает расхождение
 * безопасным: пространства имён не смешиваются в одном модуле, а
 * идентификатор не показывается человеку без названия системы рядом.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ACCESS_CATALOG } from '@/data/accessCatalog';
import { searchableOf } from '../search';
import type { AdminRow, DiagRecord } from '@/lib/supa';

const ROOT = join(__dirname, '..', '..', '..');   // weexp-site/src

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== '__tests__') walk(p, out); }
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

describe('пространства имён каталогов не смешиваются', () => {
  it('ни один модуль сайта не тянет каталог портала', () => {
    const files = walk(ROOT);
    /*
     * Проверка, что обход вообще что-то нашёл, — иначе тест зелёный на пустом
     * списке. Раньше здесь стоял порог «больше 100 файлов»; после удаления
     * легаси их стало 92, и порог упал вместе с ним, ничего при этом не найдя.
     * Число, взятое из головы, дрейфует; список обязательных модулей — нет.
     */
    const rel = files.map((f) => f.slice(ROOT.length + 1));
    for (const must of ['App.tsx', 'main.tsx', 'system/Cabinet.tsx', 'system/admin/panels-client.tsx'])
      expect(rel, `обход не нашёл ${must} — тест был бы пустым`).toContain(must);
    const guilty = files
      .filter((f) => /portal\/src\/data\/accesses|['"].*accesses\.json['"]/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(ROOT.length + 1));
    expect(guilty).toEqual([]);
  });

  it('идентификаторы кабинета уникальны внутри своего каталога', () => {
    const ids = ACCESS_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('форма идентификатора одна на весь каталог — иначе поиск по нему не соберётся', () => {
    for (const a of ACCESS_CATALOG) expect(a.id).toMatch(/^AC-\d{2}$/);
  });
});

describe('идентификатор не показывается без названия системы', () => {
  const row = (log: DiagRecord['accessLog']) =>
    ({ userId: 'u1', email: 'a@b.ua', record: { accessLog: log } }) as unknown as AdminRow;

  it('известный id резолвится в систему', () => {
    const hits = searchableOf(row({ 'AC-01': { status: 'granted' } }));
    const acc = hits.find((h) => h.where.startsWith('доступ ·'));
    expect(acc?.where).toBe('доступ · Google Analytics 4');
  });

  it('по самому id тоже находится — менеджер помнит его из переписки', () => {
    const hits = searchableOf(row({ 'AC-01': { status: 'granted' } }));
    const acc = hits.find((h) => h.where.startsWith('доступ ·'));
    expect(acc?.text).toContain('AC-01');
  });

  it('незнакомый id не роняет поиск и показывается как есть', () => {
    const hits = searchableOf(row({ 'AC-99': { status: 'granted' } }));
    expect(hits.find((h) => h.where === 'доступ · AC-99')).toBeTruthy();
  });

  it('пустой журнал доступов не даёт мусорных строк', () => {
    expect(searchableOf(row({})).filter((h) => h.where.startsWith('доступ'))).toEqual([]);
  });
});
