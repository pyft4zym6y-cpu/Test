/**
 * Редиректи проти маршрутів: те, що ламається мовчки і назовні.
 *
 * Маршрути живуть у App.tsx, редиректи — у vercel.json. Це дві правди в різних
 * файлах, і вони вже розійшлися двічі:
 *
 *   /blog і /blog/:path* вели 301 на /proof. Редирект лишився з часів, коли
 *   блогу не існувало. Потім зʼявилось 44 статті — і кожна з них віддавала
 *   Google перенаправлення замість сторінки. Search Console показав 24
 *   «Сторінки з переадресацією», і жоден тест цього не бачив: у застосунку
 *   блог працює, у зібраному dist HTML лежить, ламає все шар, якого немає
 *   в репозиторії тестів.
 *
 *   /services вело 301 на /systems — теж спадок. Нова сторінка послуг, перший
 *   пункт меню, у продакшні не відкрилась би взагалі.
 *
 * Тому тест читає обидва джерела й вимагає: жоден маршрут, який віддає
 * застосунок, не може бути перенаправлений геть. Це єдиний спосіб побачити
 * суперечність, не піднімаючи продакшн.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES, EXTRA_PAGES, SUB_PAGES } from '@/lib/nav';

const ROOT = join(__dirname, '..', '..', '..');
const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')) as {
  redirects: { source: string; destination: string; has?: unknown[] }[];
};

/** Маршрути застосунку з App.tsx — джерело того, що сайт реально віддає. */
const APP_ROUTES = (() => {
  const app = readFileSync(join(__dirname, '..', 'App.tsx'), 'utf8');
  const at = app.indexOf('const PAGES: { path: string; el: JSX.Element }[] = [');
  const block = app.slice(at, app.indexOf('\n];', at));
  return [...block.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
})();

/**
 * Чи накриває правило редиректу цю адресу.
 * Vercel-синтаксис: `:slug` — один сегмент, `:path*` — хвіст будь-якої довжини.
 */
const covers = (source: string, path: string): boolean => {
  const re = new RegExp('^' + source
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/:[a-zA-Z]+\*/g, '.*')
    .replace(/:[a-zA-Z]+/g, '[^/]+') + '$');
  return re.test(path);
};

describe('редиректи не ховають живі сторінки', () => {
  it('маршрути застосунку знайдені — інакше тест нічого не стереже', () => {
    expect(APP_ROUTES.length, 'перелік PAGES в App.tsx не розібрався').toBeGreaterThan(10);
    expect(APP_ROUTES).toContain('/');
    expect(APP_ROUTES).toContain('/blog/:slug');
  });

  it('жоден маршрут застосунку не перенаправлений геть', () => {
    /*
     * Правила з `has` (умова на хост) не рахуємо: вони розводять два домени —
     * /cabinet і /manage живуть на app.weexp.agency, /admin на weexp.agency, —
     * і це задумано, а не збіг.
     */
    const plain = vercel.redirects.filter((r) => !r.has);
    const bad: string[] = [];
    for (const route of APP_ROUTES) {
      // Параметр підставляємо зразком, щоб перевіряти справжню адресу.
      const sample = route.replace(/:[a-zA-Z]+/g, 'zrazok');
      for (const r of plain) {
        if (covers(r.source, sample)) bad.push(`${route} → ${r.destination} (правило ${r.source})`);
      }
    }
    expect(bad, `сторінки, які віддає застосунок, але забирає редирект:\n${bad.join('\n')}`).toEqual([]);
  });

  it('жодна названа сторінка не перенаправлена геть', () => {
    // Те саме з боку lib/nav: меню, підвал і крихти не мають вести в 301.
    const plain = vercel.redirects.filter((r) => !r.has);
    const named = [...PAGES, ...EXTRA_PAGES, ...SUB_PAGES].map((p) => p.to);
    const bad = named.flatMap((to) => plain.filter((r) => covers(r.source, to))
      .map((r) => `${to} → ${r.destination} (правило ${r.source})`));
    expect(bad, `названі сторінки під редиректом:\n${bad.join('\n')}`).toEqual([]);
  });

  it('одна адреса не має двох суперечливих правил', () => {
    /*
     * /manage мав два: за умовою на хост — на app.weexp.agency/manage, і без
     * умови — на /admin. Vercel бере перший збіг, тож на самому app-домені
     * консоль ведення проєктів ішла в /admin і далі назад на сайт. Тобто
     * поверхня, описана в INFRA.md, у продакшні не відкривалась.
     */
    const bySource = new Map<string, string[]>();
    for (const r of vercel.redirects) {
      const k = r.source;
      bySource.set(k, [...(bySource.get(k) ?? []), r.destination]);
    }
    const clash = [...bySource.entries()]
      .filter(([, d]) => new Set(d).size > 1)
      .map(([s, d]) => `${s}: ${[...new Set(d)].join(' / ')}`);
    expect(clash, `адреси з різними призначеннями:\n${clash.join('\n')}`).toEqual([]);
  });
});
