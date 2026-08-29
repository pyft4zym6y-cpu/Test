/**
 * Английская версия ломается не в JSX, а в данных.
 *
 * i18nCoverage сторожит литералы в компонентах: строка либо идёт через
 * t('укр','eng'), либо ловится. Но текст сайта живёт в двух таблицах — CASES и
 * SYSTEMS, — и там перевод устроен оверлеем: c.en поверх c, SYS_EN поверх
 * системы. Оверлей можно забыть наложить (SystemsHub рендерил s.feel напрямую,
 * и /en/systems показывал английский заголовок с украинской цитатой под ним)
 * или наложить неполно (метрики внутри en-блоков кейсов были скопированы с
 * украинских: «6 днів → 4 години» на английской странице).
 *
 * Оба промаха молчаливы: типы сходятся, тесты зелёные, страница строится.
 * Поэтому проверяем не исходник, а РЕЗУЛЬТАТ локализации — тем же вызовом,
 * которым его получает страница.
 *
 * Валютные знаки (₴, €, $) — не кириллица и остаются: «≥19M ₴» по-английски
 * читается так же, как «€900K».
 */
import { describe, it, expect } from 'vitest';
import { CASES, localizeCase } from '@/data/cases';
import { SYSTEMS, localizeSystem, shortOf } from '@/data/xray';
import { TEAM, localizeRole } from '@/data/team';
import { PACK_VOLUMES } from '@/data/auditPack';

const CYRILLIC = /\p{Script=Cyrillic}/u;

/** Все строки внутри значения, с путём до каждой — чтобы отчёт называл поле. */
function strings(value: unknown, path: string): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  }
  return [];
}

const cyrillicIn = (value: unknown, path: string) =>
  strings(value, path).filter(([, s]) => CYRILLIC.test(s));

describe('EN-вид кейсов', () => {
  it('не содержит кириллицы ни в одном поле', () => {
    const leaks = CASES.flatMap((c) => {
      const en = localizeCase(c, 'en') as Record<string, unknown>;
      // `en` — сам оверлей, он украинского и не содержит; смотрим наложенный вид.
      const { en: _overlay, ...view } = en;
      return cyrillicIn(view, c.slug);
    });
    expect(leaks).toEqual([]);
  });

  it('переводит hero там, где число идёт с единицей', () => {
    // «×18» и «+65%» переводить нечего, а «18 хв» и «≥19 млн ₴» — это текст.
    const withUnits = CASES.filter((c) => /[\p{Script=Cyrillic}]/u.test(c.hero));
    for (const c of withUnits) {
      expect(c.en?.hero, `${c.slug}: hero с украинской единицей без en-версии`).toBeTruthy();
    }
  });

  it('каждый кейс с en-блоком переводит и метрики', () => {
    for (const c of CASES) {
      if (!c.en?.metrics) continue;
      expect(c.en.metrics.length, `${c.slug}: метрик в en меньше, чем в оригинале`)
        .toBe(c.metrics.length);
    }
  });
});

describe('EN-вид систем', () => {
  it('накладывает SYS_EN на все текстовые поля', () => {
    const leaks = SYSTEMS.flatMap((s) => cyrillicIn(localizeSystem(s, 'en'), s.key));
    expect(leaks).toEqual([]);
  });

  it('оставляет украинский вид нетронутым', () => {
    // Оверлей не должен «подтекать» в украинскую версию.
    for (const s of SYSTEMS) expect(localizeSystem(s, 'uk')).toBe(s);
  });

  it('короткие подписи систем существуют на обоих языках', () => {
    // Чипы кейсов на /proof брали SHORT напрямую, хотя SHORT_EN лежал рядом:
    // на английской странице системы подписаны «Стратегія», «Комерція».
    for (const s of SYSTEMS) {
      expect(shortOf(s.key, 'en'), s.key).not.toMatch(CYRILLIC);
      expect(shortOf(s.key, 'uk'), s.key).toBeTruthy();
    }
  });

  it('сохраняет длину domains — от неё зависит раскладка подузлов в 3D', () => {
    // ExplorerCanvas расставляет подписи по SYSTEMS[i].domains.length, а текст
    // берёт из локализованной копии: разъедься длины — подписи разъедутся с точками.
    for (const s of SYSTEMS) {
      expect(localizeSystem(s, 'en').domains.length, s.key).toBe(s.domains.length);
    }
  });
});

describe('EN-вид команды и состава пакета', () => {
  it('роли переводятся целиком, включая имя', () => {
    // Имя было единственным полем роли без EN-версии: на /en/people оно
    // стояло кириллицей посреди английского текста, хотя файл фотографии
    // уже назван транслитом. Поля «*En» — исходники оверлея, они по смыслу
    // содержат только английское, но лежат внутри объекта; их пропускаем.
    const leaks = TEAM
      .flatMap((r) => cyrillicIn(localizeRole(r, 'en'), r.role))
      .filter(([path]) => !/En(\[|\.|$)/.test(path));
    expect(leaks).toEqual([]);
  });

  it('объём каждого тома указан на обоих языках', () => {
    for (const v of PACK_VOLUMES) {
      expect(v.volEn, `${v.id}: нет английского объёма`).toBeTruthy();
      expect(v.volEn, `${v.id}: английский объём кириллицей`).not.toMatch(CYRILLIC);
    }
  });
});
