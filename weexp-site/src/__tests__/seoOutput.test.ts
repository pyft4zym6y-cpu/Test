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

  it('до каждой страницы есть путь по ссылкам от главной', () => {
    /*
     * Восемь страниц /systems/* были замкнутым кольцом: каждая ссылалась
     * только на две соседние, а извне в кольцо не входило НИЧЕГО. От главной
     * до них не существовало пути — глубина клика бесконечна. Это самые
     * коммерческие страницы сайта, по одной на каждую систему: ни человек их
     * не находил, ни вес ссылок с главной до них не доходил. При этом в карте
     * сайта они были — то есть проверка «страница в sitemap» их пропускала.
     *
     * Считаем по СТАТИЧЕСКОМУ html: это то, что видит краулер без JS.
     */
    if (!built) return;
    const pages = sitemapUrls().filter((u) => !u.endsWith('.html'));
    const linksOf = (u: string): string[] => {
      const f = join(DIST, fileFor(u));
      if (!existsSync(f)) return [];
      return [...readFileSync(f, 'utf8').matchAll(/href="(\/[^"#?]*)"/g)]
        .map((m) => m[1].replace(/\/$/, '') || '/');
    };
    const seen = new Set(['/']);
    const queue = ['/'];
    while (queue.length) {
      for (const l of linksOf(queue.shift()!)) {
        const norm = l === '' ? '/' : l;
        if (pages.includes(norm) && !seen.has(norm)) { seen.add(norm); queue.push(norm); }
      }
    }
    const unreachable = pages.filter((u) => !seen.has(u));
    expect(unreachable, `от главной не дойти: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('текст ссылки говорит, куда она ведёт — а не повторяет слаг', () => {
    /*
     * В статике /expansion ссылки на шесть направлений были подписаны слагами:
     * «international», «automation», «technology». Ни человеку, ни краулеру
     * это ничего не сообщает — а именно текст ссылки и есть сигнал о цели.
     */
    if (!built) return;
    const bad: string[] = [];
    /*
     * Только украинские страницы: там латинский слаг заведомо не может быть
     * названием. На английской «Marketing» законно совпадает со слагом
     * marketing — это имя направления, а не машинный идентификатор.
     */
    for (const u of sitemapUrls().filter((x) => !x.endsWith('.html') && !x.startsWith('/en'))) {
      const f = join(DIST, fileFor(u));
      if (!existsSync(f)) continue;
      for (const m of readFileSync(f, 'utf8').matchAll(/<a href="(\/[a-z/-]+)"[^>]*>([^<]{1,60})<\/a>/g)) {
        const [, href, text] = m;
        // Только вложенные адреса: /en/systems — это пункт меню, и «Systems»
        // там законная английская НАЗВА страницы, а не пересказ слага.
        const segs = href.replace(/^\/en(?=\/|$)/, '').split('/').filter(Boolean);
        if (segs.length < 2) continue;
        if (text.trim().toLowerCase() === segs[segs.length - 1]) bad.push(`${u}: «${text}»`);
      }
    }
    expect(bad, `текст ссылки = слаг: ${bad.slice(0, 6).join('; ')}`).toEqual([]);
  });

  it('у каждой страницы своя OG-карточка, а не общая заглушка', () => {
    /*
     * Восемь страниц систем и шесть направлений экспансии делили одну общую
     * /og.png: в ленте все они выглядели одной и той же ссылкой. Тест держит
     * два условия — заглушки нет ни на одной странице, и файл, на который
     * ссылается страница, действительно лежит в сборке.
     */
    if (!built) return;
    const missing: string[] = [];
    for (const u of sitemapUrls()) {
      const f = join(DIST, fileFor(u));
      if (!existsSync(f)) continue;
      const m = readFileSync(f, 'utf8').match(/<meta property="og:image" content="[^"]*?(\/og[^"]*)"/);
      if (!m) { missing.push(`${u}: нет og:image`); continue; }
      // Юридическим страницам своя карточка не нужна — они не продают, им
      // достаточно брендовой. Всем остальным общая заглушка запрещена.
      const legal = /\.html$/.test(u);
      if (m[1] === '/og.png' && !legal) { missing.push(`${u}: общая заглушка /og.png`); continue; }
      if (!existsSync(join(DIST, m[1]))) missing.push(`${u}: файл ${m[1]} не собран`);
    }
    expect(missing, missing.join('; ')).toEqual([]);
  });

  it('robots.txt называет карту сайта и не закрывает сайт', () => {
    expect(robots).toMatch(/Sitemap:\s*https:\/\/weexp\.agency\/sitemap\.xml/);
    expect(robots, 'сайт закрыт от обхода').not.toMatch(/User-agent:\s*\*\s*\n\s*Disallow:\s*\/\s*$/m);
  });
});

/*
 * Конфигов vercel.json было ДВА: корневой (его и читает Vercel — в нём
 * outputDirectory, rewrites и crons) и weexp-site/vercel.json. Этот тест читал
 * второй, csp.test.ts — первый. Полгода они расходились молча: редиректы и
 * строгий CSP лежали в файле, который никогда не деплоился. Дубль удалён,
 * оба теста смотрят в корневой; тест ниже стережёт, чтобы копия не вернулась.
 */
const ROOT = join(__dirname, '..', '..', '..');

describe('серверные правила (vercel.json)', () => {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

  /*
   * После разведения сайта и ведения проекта по двум origin у правил появилось
   * второе измерение — хост (`has`). Тесты ниже раньше считали конфиг плоским
   * и после разделения сообщали о проблемах, которых нет: правило для app.*
   * подменяло собой глобальное при поиске по source, а два редиректа на РАЗНЫХ
   * хостах выглядели цепочкой. Помечать это как «ложное срабатывание» и
   * ослаблять проверки нельзя — они стерегут реальные вещи; правильный ответ
   * в том, чтобы каждая смотрела на свой хост.
   */
  const hostOf = (r: { has?: { type: string; value: string }[] }): string | undefined =>
    r.has?.find((h) => h.type === 'host')?.value;
  /** Правила без условия по хосту — то есть общие для всех доменов. */
  const global = <T extends { has?: { type: string; value: string }[] }>(rules: T[]) =>
    rules.filter((r) => !hostOf(r));

  /*
   * 22 устаревших адреса перенаправлялись клиентским <Navigate>: сервер отдавал
   * 200 с пустой оболочкой, а переход происходил уже после запуска JS. Для
   * поисковика это не переезд, а дубль — вес со старого адреса не передаётся.
   */
  it('устаревшие адреса перенаправляются сервером и постоянным кодом', () => {
    const red = cfg.redirects ?? [];
    expect(red.length, 'редиректы не заданы на сервере').toBeGreaterThanOrEqual(20);
    // Постоянными должны быть переезды контента. Псевдонимы юридических
    // файлов (/privacy → /privacy.html) намеренно временные: страницы ещё
    // могут стать React-маршрутами, а закэшированный браузером 301 не отозвать.
    const LEGAL = /^\/(en\/)?(privacy|cookies|cookie-policy|terms|oferta|security\.txt)$/;
    // Корень app.* → /cabinet временный намеренно: это удобство входа внутри
    // одного домена, а не переезд адреса, и 301 тут закэшировался бы навсегда.
    const temp = red.filter((r: { source: string; permanent: boolean; has?: { type: string; value: string }[] }) =>
      !r.permanent && !LEGAL.test(r.source) && hostOf(r) !== 'app.weexp.agency');
    expect(temp, 'переезд контента отдаётся как временный 302').toEqual([]);
    for (const must of ['/cases', '/about', '/how-it-works', '/loss', '/intelligence'])
      expect(red.map((r: { source: string }) => r.source), `нет редиректа ${must}`).toContain(must);
  });

  it('заголовки безопасности выставлены', () => {
    // Именно глобальное правило: на app.* есть своё '/(.*)' с одним лишь
    // X-Robots-Tag, и поиск по source находил бы его, а не набор безопасности.
    type Hdr = { source: string; has?: { type: string; value: string }[]; headers: { key: string; value: string }[] };
    const h = global<Hdr>(cfg.headers ?? []).find((x) => x.source === '/(.*)');
    expect(h, 'нет глобального правила заголовков').toBeTruthy();
    const keys = (h?.headers ?? []).map((x) => x.key);
    for (const k of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Strict-Transport-Security'])
      expect(keys, `нет заголовка ${k}`).toContain(k);
    const hsts = h!.headers.find((x) => x.key === 'Strict-Transport-Security')!.value;
    expect(hsts, 'HSTS короче года').toMatch(/max-age=(\d{8,})/);
  });

  it('конфиг ровно один — второй молча не деплоится', () => {
    expect(existsSync(join(ROOT, 'weexp-site', 'vercel.json')),
      'вернулась копия vercel.json внутри weexp-site: Vercel читает только корневой').toBe(false);
    expect(cfg.outputDirectory, 'корневой конфиг обязан собирать weexp-site').toBe('weexp-site/dist');
    expect((cfg.rewrites ?? []).some((r: { source: string }) => r.source === '/(.*)'),
      'нет SPA-fallback: любая вложенная ссылка отдаст 404').toBe(true);
  });

  it('клиентские и серверные редиректы ведут в одно место', () => {
    /*
     * У одного адреса было ДВА назначения. Сервер (vercel.json) отправлял
     * /challenges, /what-we-build и /how-it-works на страницу /systems, а
     * клиентский <Navigate> в App.tsx — на якорь главной /#systems. Куда
     * попадёт человек, зависело от того, отработал ли серверный редирект
     * раньше: при переходе по внутренней ссылке — не отработает.
     */
    const app = readFileSync(join(ROOT, 'weexp-site', 'src', 'App.tsx'), 'utf8');
    const server = new Map<string, string>(
      (cfg.redirects ?? []).map((r: { source: string; destination: string }) => [r.source, r.destination]),
    );
    const mismatched: string[] = [];
    for (const m of app.matchAll(/<Route path="(\/[a-z-]+)" element=\{<Navigate to="([^"]+)"/g)) {
      const [, path, to] = m;
      const srv = server.get(path);
      if (srv && srv !== to) mismatched.push(`${path}: сервер → ${srv}, клиент → ${to}`);
    }
    expect(mismatched, mismatched.join('; ')).toEqual([]);
  });

  it('редиректы не строят цепочку из двух прыжков', () => {
    /*
     * Цепочка — это два прыжка, которые браузер делает ПОДРЯД, то есть на
     * одном хосте. После разделения / → /cabinet (на app.*) и /cabinet →
     * app.weexp.agency/cabinet (на сайте) выглядели цепочкой, хотя выполняются
     * на разных доменах и никогда не встречаются в одном запросе. Сравниваем
     * внутри хоста, а межхостовые переезды разворачиваем в путь.
     */
    type Red = { source: string; destination: string; has?: { type: string; value: string }[] };
    const red: Red[] = cfg.redirects ?? [];
    const byHost = new Map<string, Map<string, string>>();
    for (const r of red) {
      const h = hostOf(r) ?? '';
      if (!byHost.has(h)) byHost.set(h, new Map());
      byHost.get(h)!.set(r.source, r.destination);
    }
    for (const r of red) {
      const dest = r.destination.split('#')[0];
      // Переезд на другой origin: следующий прыжок, если он есть, будет уже
      // по правилам ТОГО хоста — здесь его искать бессмысленно.
      if (/^https?:\/\//.test(dest)) continue;
      const next = byHost.get(hostOf(r) ?? '')!.get(dest.replace(/\/$/, '') || '/');
      expect(next, `${r.source} → ${dest} → ${next}: лишний прыжок, вес теряется`).toBeUndefined();
    }
  });
});
