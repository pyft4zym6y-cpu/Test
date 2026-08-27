/**
 * Что уходит поисковику. Проверяем СОБРАННЫЙ dist, а не намерения в коде:
 * между ними стоит скрипт пререндера, и разъезжаются они молча.
 *
 * Главная находка, ради которой тест и написан: sitemap.xml заявлял
 * /privacy.html и /oferta.html, а обе страницы несли <meta robots="noindex">.
 * Search Console отдаёт это ошибкой «Submitted URL marked noindex». Мы
 * продаём SEO-аудит и именно это в чужом аудите и отмечаем.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(__dirname, '..', '..', 'dist');
const built = existsSync(join(DIST, 'sitemap.xml'));

const html = (rel: string) => readFileSync(join(DIST, rel), 'utf8');
const pages = () => {
  const out: string[] = [];
  (function walk(d: string, pre = '') {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p, `${pre}${e}/`);
      else if (e.endsWith('.html')) out.push(pre + e);
    }
  })(DIST);
  return out;
};
const sitemapUrls = () =>
  [...html('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));
/** Путь из sitemap → файл в dist. */
const fileFor = (u: string) => (u === '/' ? 'index.html' : u.endsWith('.html') ? u.slice(1) : `${u.slice(1)}/index.html`);

describe.skipIf(!built)('собранный dist', () => {
  it('sitemap не пуст и покрывает обе языковые версии', () => {
    const u = sitemapUrls();
    expect(u.length).toBeGreaterThan(30);
    expect(u).toContain('/');
    expect(u).toContain('/en');
  });

  it('каждый адрес из sitemap действительно собран', () => {
    const missing = sitemapUrls().filter((u) => !existsSync(join(DIST, fileFor(u))));
    expect(missing).toEqual([]);
  });

  it('ни одна страница из sitemap не помечена noindex', () => {
    // Прямое противоречие: карта сайта просит проиндексировать, страница
    // запрещает. Именно это и было у /privacy.html и /oferta.html.
    const bad = sitemapUrls().filter((u) => {
      const f = join(DIST, fileFor(u));
      return existsSync(f) && /<meta[^>]+name="robots"[^>]+noindex/i.test(readFileSync(f, 'utf8'));
    });
    expect(bad).toEqual([]);
  });

  it('у каждой страницы из sitemap есть title, description и canonical', () => {
    const gaps: string[] = [];
    for (const u of sitemapUrls()) {
      const f = join(DIST, fileFor(u));
      if (!existsSync(f)) continue;
      const s = readFileSync(f, 'utf8');
      if (!/<title>[^<]+<\/title>/.test(s)) gaps.push(`${u}: нет title`);
      if (!/<meta name="description" content="[^"]+"/.test(s)) gaps.push(`${u}: нет description`);
      if (!/<link rel="canonical"/.test(s)) gaps.push(`${u}: нет canonical`);
    }
    expect(gaps).toEqual([]);
  });

  it('title не повторяются: одинаковый заголовок на двух страницах — каннибализация', () => {
    const seen = new Map<string, string[]>();
    for (const u of sitemapUrls()) {
      const f = join(DIST, fileFor(u));
      if (!existsSync(f)) continue;
      const t = readFileSync(f, 'utf8').match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
      seen.set(t, [...(seen.get(t) ?? []), u]);
    }
    const dups = [...seen.entries()].filter(([, v]) => v.length > 1);
    expect(dups.map(([t, v]) => `${t}: ${v.join(', ')}`)).toEqual([]);
  });

  it('страницы, которых нет в sitemap, закрыты от индексации', () => {
    // Обратная сторона: 404, cookies и бриф в карту не входят и обязаны нести
    // noindex — иначе они попадут в индекс мимо карты.
    const inMap = new Set(sitemapUrls().map(fileFor));
    const leaks = pages()
      .filter((p) => !inMap.has(p))
      .filter((p) => !/^google[0-9a-f]+\.html$/.test(p))   // файл верификации
      .filter((p) => !/noindex/i.test(html(p)));
    expect(leaks).toEqual([]);
  });

  it('украинская и английская версии ссылаются друг на друга через hreflang', () => {
    for (const pair of [['index.html', 'en/index.html'], ['pricing/index.html', 'en/pricing/index.html']]) {
      for (const f of pair) expect(html(f), f).toMatch(/hreflang="(uk|en|x-default)"/);
    }
  });
});
