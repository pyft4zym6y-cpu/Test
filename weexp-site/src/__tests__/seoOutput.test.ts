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


/* ── Ниже: что именно уходит в выдачу (длины, пунктуация, заголовки сервера) ──
   Отдельный слой поверх проверок карты сайта выше: там — «страница существует и
   не спорит сама с собой», здесь — «строка, которую увидит человек в Google». */
const allPages = built ? (() => {
  const out: { url: string; html: string }[] = [];
  (function walk(d: string) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e === 'index.html') out.push({ url: '/' + p.slice(DIST.length + 1).replace(/index\.html$/, '').replace(/\/$/, ''), html: readFileSync(p, 'utf8') });
    }
  })(DIST);
  return out;
})() : [];
const meta = (html: string, re: RegExp) => (html.match(re) ?? [])[1] ?? '';
const title = (h: string) => meta(h, /<title>([^<]*)<\/title>/);
const desc = (h: string) => meta(h, /<meta name="description" content="([^"]*)"/);
const indexable = allPages.filter((p) => !/noindex/i.test(p.html));

describe.skipIf(!built)('то, что видно в выдаче', () => {
  it('страницы вообще собраны', () => {
    expect(allPages.length).toBeGreaterThan(30);
    expect(indexable.length).toBeGreaterThan(30);
  });

  /*
   * Google обрезает заголовок примерно на 60 символах. Суффикс страниц систем
   * был «— послуга WEEXP · Commerce OS», 29 символов, и самая длинная название
   * выводило заголовок на 62 — он обрезался ровно на бренде.
   */
  it('заголовок укладывается в 60 символов', () => {
    const long = indexable.filter((p) => title(p.html).length > 60).map((p) => `${p.url} (${title(p.html).length})`);
    expect(long).toEqual([]);
  });

  it('у каждой индексируемой страницы есть заголовок и описание', () => {
    for (const p of indexable) {
      expect(title(p.html).length, `${p.url}: нет title`).toBeGreaterThan(10);
      expect(desc(p.html).length, `${p.url}: нет description`).toBeGreaterThan(50);
    }
  });

  /*
   * Описания длиннее 170 символов обрезаются в сниппете. Хуже другое: четыре из
   * них были физически обрезаны на 300 символах прямо в источнике данных и
   * заканчивались посреди слова — «We pick the stack for», «and marg».
   */
  it('описание не длиннее 170 символов и не обрывается посреди слова', () => {
    for (const p of indexable) {
      const d = desc(p.html);
      expect(d.length, `${p.url}: описание ${d.length} символов`).toBeLessThanOrEqual(170);
      expect(d.trim().endsWith('.') || d.trim().endsWith('!') || d.trim().endsWith('?'),
        `${p.url}: описание не заканчивается точкой — «…${d.slice(-40)}»`).toBe(true);
    }
  });

  it('описание не начинает предложение со строчной буквы после точки', () => {
    // «…докази. один бізнес, одне джерело правди» — вторая половина строки
    // SYSTEMS приклеивалась после точки как есть.
    const bad = indexable.filter((p) => /[.!?]\s+[a-zа-яіїєґ]/.test(desc(p.html))).map((p) => p.url);
    expect(bad).toEqual([]);
  });

  it('заголовки и описания уникальны', () => {
    const t = indexable.map((p) => title(p.html));
    const d = indexable.map((p) => desc(p.html));
    expect(new Set(t).size, 'дубли title').toBe(t.length);
    expect(new Set(d).size, 'дубли description').toBe(d.length);
  });

  it('canonical, hreflang и структурированные данные на месте', () => {
    for (const p of indexable) {
      expect(p.html, `${p.url}: нет canonical`).toMatch(/<link rel="canonical" href="https:\/\/weexp\.agency/);
      expect(p.html, `${p.url}: нет hreflang x-default`).toMatch(/hreflang="x-default"/);
      expect(p.html, `${p.url}: нет JSON-LD`).toMatch(/application\/ld\+json/);
    }
  });

  it('ровно один H1 на странице', () => {
    for (const p of indexable)
      expect((p.html.match(/<h1[\s>]/g) ?? []).length, `${p.url}`).toBe(1);
  });

  it('HTML укладывается в 2 МБ, которые читает Googlebot', () => {
    for (const p of indexable)
      expect(Buffer.byteLength(p.html), `${p.url}`).toBeLessThan(2 * 1024 * 1024);
  });
});

describe.skipIf(!built)('карта сайта и правила обхода', () => {
  const sitemap = built && existsSync(join(DIST, 'sitemap.xml')) ? readFileSync(join(DIST, 'sitemap.xml'), 'utf8') : '';
  const robots = built && existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';

  it('в карте сайта только индексируемые страницы', () => {
    const inMap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://weexp.agency', '') || '/');
    const noindexUrls = allPages.filter((p) => /noindex/i.test(p.html)).map((p) => p.url || '/');
    expect(inMap.filter((u) => noindexUrls.includes(u)), 'noindex-страница в sitemap').toEqual([]);
  });

  it('каждая индексируемая страница есть в карте сайта', () => {
    const inMap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://weexp.agency', '').replace(/\/$/, '')));
    const missing = indexable.map((p) => p.url).filter((u) => !inMap.has(u === '/' ? '' : u) && !inMap.has(u));
    expect(missing).toEqual([]);
  });

  it('robots.txt называет карту сайта и не закрывает сайт', () => {
    expect(robots).toMatch(/Sitemap:\s*https:\/\/weexp\.agency\/sitemap\.xml/);
    expect(robots, 'сайт закрыт от обхода').not.toMatch(/User-agent:\s*\*\s*\n\s*Disallow:\s*\/\s*$/m);
  });
});

describe('серверные правила (vercel.json)', () => {
  const cfg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'vercel.json'), 'utf8'));

  /*
   * 22 устаревших адреса перенаправлялись клиентским <Navigate>: сервер отдавал
   * 200 с пустой оболочкой, а переход происходил уже после запуска JS. Для
   * поисковика это не переезд, а дубль — вес со старого адреса не передаётся.
   */
  it('устаревшие адреса перенаправляются сервером и постоянным кодом', () => {
    const red = cfg.redirects ?? [];
    expect(red.length, 'редиректы не заданы на сервере').toBeGreaterThanOrEqual(20);
    expect(red.filter((r: { permanent: boolean }) => !r.permanent), 'временные 302 вместо 301').toEqual([]);
    for (const must of ['/cases', '/about', '/how-it-works', '/loss', '/intelligence'])
      expect(red.map((r: { source: string }) => r.source), `нет редиректа ${must}`).toContain(must);
  });

  it('заголовки безопасности выставлены', () => {
    const h = (cfg.headers ?? []).find((x: { source: string }) => x.source === '/(.*)');
    const keys = (h?.headers ?? []).map((x: { key: string }) => x.key);
    for (const k of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Strict-Transport-Security'])
      expect(keys, `нет заголовка ${k}`).toContain(k);
    const hsts = h.headers.find((x: { key: string }) => x.key === 'Strict-Transport-Security').value;
    expect(hsts, 'HSTS короче года').toMatch(/max-age=(\d{8,})/);
  });
});
