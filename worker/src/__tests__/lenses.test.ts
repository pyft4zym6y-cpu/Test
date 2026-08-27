/**
 * Связь «модуль ↔ артефакт» держалась на честном слове и разъехалась.
 *
 * EXPECTED_LENSES в runrecord.ts описывает, по какому файлу считать линзу
 * выполненной. Шесть линз были названы `*flow`, а пайплайн писал `*audit.json` —
 * и эти шесть модулей числились «пропущенными» в КАЖДОМ прогоне, включая
 * идеальный. Заметить это по логу нельзя: там всё зелено.
 *
 * Комментарий «имена должны совпадать» такое не ловит. Тест — ловит: он читает
 * pipeline.ts как текст и сверяет с реальными вызовами writeFile.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EXPECTED_LENSES, buildRunRecord } from '../runrecord.js';

const SRC = readFileSync(join(__dirname, '..', 'pipeline.ts'), 'utf8');

/** Все json-артефакты, которые пайплайн реально кладёт в каталог прогона. */
const produced = [...SRC.matchAll(/join\(dir, '([\w.-]+\.json)'\)/g)].map((m) => m[1]);

/** Имена модулей из вызовов fail(...) — то, чем пайплайн помечает падения. */
const failedNames = [...SRC.matchAll(/\bfail\('([\w:.-]+)'/g)].map((m) => m[1]);

describe('EXPECTED_LENSES ↔ pipeline', () => {
  it('пайплайн вообще пишет артефакты (иначе тест ничего не проверяет)', () => {
    expect(produced.length).toBeGreaterThan(20);
  });

  it('каждая линза указывает на файл, который пайплайн действительно пишет', () => {
    const orphans = EXPECTED_LENSES
      .filter((l) => !produced.some((f) => l.file.test(f)))
      .map((l) => `${l.module} → ${l.file}`);
    expect(orphans).toEqual([]);
  });

  it('две линзы не забирают один и тот же файл', () => {
    for (const f of produced) {
      const owners = EXPECTED_LENSES.filter((l) => l.file.test(f)).map((l) => l.module);
      expect(owners.length, `${f} принадлежит ${owners.join(' и ')}`).toBeLessThanOrEqual(1);
    }
  });
});

describe('fail() в пайплайне', () => {
  it('падения вообще регистрируются — иначе гейт снова ослепнет', () => {
    expect(failedNames.length).toBeGreaterThan(20);
  });

  it('имена модулей уникальны в пределах одного смысла — без опечаток вроде seoflow/seo-flow', () => {
    for (const n of failedNames) expect(n).toMatch(/^[a-z][a-z0-9]*$/);
  });

  it('модуль-линза, если он падает, помечается своим именем из EXPECTED_LENSES', () => {
    // Обратное неверно: падать может и то, что линзой не считается
    // (презентация, итоговое резюме) — такие имена просто попадут в failed.
    const lens = new Set(EXPECTED_LENSES.map((l) => l.module));
    const covered = [...lens].filter((m) => failedNames.includes(m));
    expect(covered.length / lens.size).toBeGreaterThan(0.8);
  });

  it('достижимость в гейт идёт фактом, а не константой от режима', () => {
    // Было `reachabilityPassed: !prelaunch` — условие гейта сводилось к
    // `prelaunch || !prelaunch`, то есть critical-проверка не могла упасть.
    expect(SRC).not.toMatch(/reachabilityPassed:\s*!prelaunch/);
    expect(SRC).toMatch(/const reachabilityPassed = prelaunch/);
    expect(SRC).toMatch(/visualFallbackUsed/);
  });

  it('в гейт качества уходит собранный список, а не пустой литерал', () => {
    // Сравниваем извлечённое значение, а не весь файл: иначе провал теста
    // печатает diff на тысячу строк и в нём не видно, что именно сломалось.
    const arg = SRC.match(/modulesFailed:\s*([^,\n]+)/)?.[1]?.trim();
    expect(arg).toBe('failedModules');
  });
});

describe('buildRunRecord: упавший модуль не притворяется выполненным', () => {
  const base = {
    auditId: 'a1', client: 'ТОВ Тест', tier: 1 as const, takenAt: '2026-08-01T00:00:00Z',
    generatedAt: '2026-08-01T01:00:00Z',
    config: { agentic: false, prelaunch: false, premium: false, webSearch: false, hasApiKey: false },
    input: {
      site: 'https://x.ua', competitors: 0, pagesCrawled: 10, competitorPagesCrawled: 0,
      backupScreenshots: false, answersProvided: false,
    },
  };

  it('файл на диске есть, но модуль упал → он в failed, а не в executed', () => {
    const rr = buildRunRecord({ ...base, files: ['seoflow.json', 'qa.json'], failedModules: ['seoflow'] });
    expect(rr.modules.failed).toContain('seoflow');
    expect(rr.modules.executed).not.toContain('seoflow');
    expect(rr.modules.skipped).not.toContain('seoflow');
  });

  it('без падений список пуст, а не отсутствует', () => {
    const rr = buildRunRecord({ ...base, files: ['qa.json'] });
    expect(rr.modules.failed).toEqual([]);
  });

  it('шесть перепутанных линз теперь считаются выполненными', () => {
    const rr = buildRunRecord({
      ...base,
      files: ['pageaudit.json', 'blockaudit.json', 'merchaudit.json',
              'croaudit.json', 'analyticsaudit.json', 'cjmaudit.json'],
    });
    for (const m of ['pageflow', 'blockflow', 'merchflow', 'croflow', 'analyticsflow', 'cjmflow']) {
      expect(rr.modules.executed, m).toContain(m);
    }
  });
});
