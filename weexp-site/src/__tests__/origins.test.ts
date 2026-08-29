/**
 * Сайт і ведення проєкту розведені по двох походженнях: weexp.agency і
 * app.weexp.agency. Складання одне — розділення тримають маршрутизація за
 * хостом (root vercel.json) і сторож усередині застосунку.
 *
 * Найнебезпечніше тут — розділення, яке тримається на дисципліні: кожне нове
 * посилання треба не забути перевести на потрібний хост, а забути легко, бо
 * у розробці обидва розділи живуть на одному localhost і ЖОДНОЇ помилки не
 * видно. Тому тут перевіряється не «чи є правило», а чи не лишилось у сайті
 * роутерного посилання на кабінет — тобто чи не з'явився шлях в обхід.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_ORIGIN, SITE_ORIGIN, APP_PATHS, isAppPath, isAppHost, normalizeAppPath } from '@/lib/origins';
import { TABS, tabsOf, SURFACE_ROOT } from '@/system/admin/shared';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const vercel = JSON.parse(readFileSync(join(ROOT, '..', 'vercel.json'), 'utf8')) as {
  redirects: { source: string; destination: string; permanent?: boolean; has?: { type: string; value: string }[] }[];
  rewrites: { source: string; destination: string; has?: { type: string; value: string }[] }[];
  headers: { source: string; has?: { type: string; value: string }[]; headers: { key: string; value: string }[] }[];
};

const host = (r: { has?: { type: string; value: string }[] }) =>
  r.has?.find((h) => h.type === 'host')?.value;

describe('розпізнавання хоста', () => {
  it('приймає лише точний піддомен', () => {
    expect(isAppHost('app.weexp.agency')).toBe(true);
    expect(isAppHost('weexp.agency')).toBe(false);
    expect(isAppHost('www.weexp.agency')).toBe(false);
    // Підрядок нашого домену всередині чужого — класичний обхід перевірки
    // через includes(). Тут має бути false.
    expect(isAppHost('app.weexp.agency.evil.com')).toBe(false);
    expect(isAppHost('evil-app.weexp.agency')).toBe(false);
    expect(isAppHost('')).toBe(false);
  });
});

describe('розпізнавання шляху', () => {
  it('відносить до застосунку кабінет, адмінку і їхні підшляхи', () => {
    for (const p of APP_PATHS) {
      expect(isAppPath(p), p).toBe(true);
      expect(isAppPath(p + '/anything'), p + '/anything').toBe(true);
      expect(isAppPath('/en' + p), '/en' + p).toBe(true);
    }
  });

  it('не відносить до застосунку сторінки сайту', () => {
    for (const p of ['/', '/pricing', '/systems', '/systems/strategy-management',
                     '/proof', '/contact', '/en', '/en/pricing']) {
      expect(isAppPath(p), p).toBe(false);
    }
  });

  it('не ловиться на схожому початку', () => {
    // '/administration' починається з '/admin', але застосунком не є.
    expect(isAppPath('/administration')).toBe(false);
    expect(isAppPath('/cabinets')).toBe(false);
  });
});

describe('маршрутизація за хостом у vercel.json', () => {
  const fromSite = vercel.redirects.filter((r) => host(r) === 'weexp.agency');

  it('кожен розділ застосунку має 301 із сайту', () => {
    for (const p of APP_PATHS) {
      const r = fromSite.find((x) => x.source === p);
      expect(r, `немає редиректу ${p} → застосунок`).toBeTruthy();
      expect(r!.destination.startsWith(APP_ORIGIN), `${p} веде не на ${APP_ORIGIN}`).toBe(true);
      expect(r!.permanent, `${p}: редирект має бути постійним (301)`).toBe(true);
    }
  });

  it('підшляхи переносяться разом із хвостом', () => {
    // Інакше посилання на конкретну картку клієнта вело б у корінь консолі:
    // адресу можна переслати колезі — це і був сенс тримати розділ в URL.
    const deep = fromSite.find((x) => x.source === '/manage/:path*');
    expect(deep, 'немає редиректу для підшляхів консолі').toBeTruthy();
    expect(deep!.destination).toBe(`${APP_ORIGIN}/manage/:path*`);
  });

  it('адмінка сайту лишається на сайті', () => {
    /*
     * Спершу я переніс на app.* і /admin — ділив «сайт» проти «не сайт». Межа
     * проходить інакше: адмінка сайту — це заявки, які породжує сама сторінка,
     * і вона належить сайту так само, як форма, що їх створює. На app.* її
     * бути не має, а якщо хтось прийде туди за старим посиланням — повертаємо.
     */
    expect(fromSite.some((x) => x.source.startsWith('/admin')),
      '/admin знову тікає з сайту').toBe(false);
    const back = vercel.redirects.find((r) => r.source === '/admin' && host(r) === 'app.weexp.agency');
    expect(back, 'з app.* немає повернення на адмінку сайту').toBeTruthy();
    expect(back!.destination).toBe(`${SITE_ORIGIN}/admin`);
  });

  it('двомовний кабінет зберігає мову', () => {
    // Кабінет двомовний, і англомовний клієнт після переїзду не має опинитись
    // українською: розділення адрес не повинно мовчки міняти мову.
    const cab = fromSite.find((x) => x.source === '/en/cabinet');
    expect(cab, 'немає редиректу /en/cabinet').toBeTruthy();
    expect(cab!.destination).toBe(`${APP_ORIGIN}/en/cabinet`);
  });

  it('нормалізація шляху повторює те саме правило', () => {
    // Сторож усередині застосунку і серверні правила мають вирішувати
    // однаково, інакше клієнтський перехід і пряме відкриття дадуть різне.
    expect(normalizeAppPath('/en/cabinet')).toBe('/en/cabinet');
    expect(normalizeAppPath('/en/cabinet/company')).toBe('/en/cabinet/company');
    // Консоль одномовна: маршрута /en/manage немає.
    expect(normalizeAppPath('/en/manage')).toBe('/manage');
    expect(normalizeAppPath('/en/manage/users/c/42')).toBe('/manage/users/c/42');
    expect(normalizeAppPath('/manage')).toBe('/manage');
  });

  it('корінь застосунку веде в кабінет, а не на маркетингову головну', () => {
    const root = vercel.redirects.find((r) => r.source === '/' && host(r) === 'app.weexp.agency');
    expect(root, 'корінь app.* нікуди не веде').toBeTruthy();
    expect(root!.destination).toBe('/cabinet');
    // Не постійний: це зручність входу, а не переїзд адреси.
    expect(root!.permanent).toBe(false);
  });
});

describe('застосунок закритий від пошуку', () => {
  it('усі відповіді на app.* мають noindex', () => {
    const h = vercel.headers.find((x) => host(x) === 'app.weexp.agency' && x.source === '/(.*)');
    expect(h, 'на app.* немає заголовка noindex').toBeTruthy();
    const tag = h!.headers.find((k) => k.key === 'X-Robots-Tag');
    expect(tag?.value).toMatch(/noindex/);
    expect(tag?.value).toMatch(/nofollow/);
  });

  it('на app.* віддається власний robots.txt, який забороняє все', () => {
    const rw = vercel.rewrites.find((x) => x.source === '/robots.txt' && host(x) === 'app.weexp.agency');
    expect(rw, 'robots.txt на app.* не підмінено').toBeTruthy();
    expect(rw!.destination).toBe('/robots-app.txt');

    const robots = read('public/robots-app.txt');
    expect(robots).toMatch(/User-agent:\s*\*/);
    expect(robots).toMatch(/Disallow:\s*\//);
    // Карта сайту тут вела б на щойно заборонені сторінки.
    expect(robots).not.toMatch(/Sitemap:/);
  });

  it('robots.txt самого сайту лишився дозвільним', () => {
    const robots = read('public/robots.txt');
    expect(robots).toMatch(/Allow:\s*\//);
    expect(robots).toMatch(/Sitemap:\s*https:\/\/weexp\.agency/);
  });
});

describe('посилання між розділами', () => {
  it('сайт веде в кабінет через appHref, а не роутером', () => {
    /*
     * <Link> react-router будує відносний перехід у межах СВОГО застосунку —
     * на інший хост він не піде, а тихо відкриє /cabinet на маркетинговому
     * домені. Саме так розділення й розсипалося б: не помилкою в правилах, а
     * одним звичним <Link> у новому місці.
     */
    for (const f of ['src/system/SystemShell.tsx', 'src/system/SystemNotFound.tsx']) {
      const src = read(f);
      expect(src, `${f}: роутерне посилання на кабінет`).not.toMatch(/<Link[^>]*to=\{?['"`]?[^>]*\/cabinet/);
      expect(src, `${f}: не використовує appHref`).toContain('appHref(');
    }
  });

  it('адмінка повертає на сайт через siteHref', () => {
    const src = read('src/system/admin/shared.tsx');
    expect(src).toContain('siteHref(');
    expect(src).not.toMatch(/<Link to="\/" className="mc-back/);
  });

  it('кабінет веде в адмінку без мовного префікса', () => {
    // Маршрута /en/admin не існує — lp() вів менеджера з англійського
    // кабінету просто у 404.
    const src = read('src/system/Cabinet.tsx');
    expect(src).not.toMatch(/lp\('\/admin'\)/);
    expect(src).toMatch(/<Link to="\/admin"/);
  });

  it('сторож хоста змонтований у застосунку', () => {
    // Без нього розділення трималося б лише на серверних редиректах, які
    // клієнтської навігації не бачать.
    expect(read('src/App.tsx')).toMatch(/<HostGuard\s*\/>/);
  });

  it('походження не збігаються і задані повністю', () => {
    expect(SITE_ORIGIN).toBe('https://weexp.agency');
    expect(APP_ORIGIN).toBe('https://app.weexp.agency');
    expect(APP_ORIGIN).not.toBe(SITE_ORIGIN);
  });
});

describe('дві поверхні адміністрування', () => {
  /*
   * Межа проходить не між «сайтом» і «не сайтом», а між тим, що породжує сам
   * сайт, і тим, що живе далі. Адмінка сайту — це заявки: форма на сторінці їх
   * створює, з ними працюють до «беремо в роботу». Усе, що після — клієнти,
   * аудити, проєкти, воркер, методики — окремий сервіс із власним входом.
   *
   * Один список вкладок із полем surface — єдине джерело цієї межі. Якщо межу
   * почати повторювати руками в маршрутах, редиректах і меню, вона розійдеться
   * у трьох місцях по-різному, і «адмінка» знову означатиме два інструменти.
   */
  it('адмінка сайту — це заявки, і по суті лише вони', () => {
    expect(tabsOf('site').map((t) => t.id)).toEqual(['leads']);
  });

  it('усе, що після заявки, живе в сервісі ведення проєкту', () => {
    const pm = tabsOf('pm').map((t) => t.id);
    for (const must of ['users', 'auditreq', 'worker']) {
      expect(pm, `${must} має бути в сервісі, а не в адмінці сайту`).toContain(must);
    }
    expect(pm, 'заявки не дублюються в обох поверхнях').not.toContain('leads');
  });

  it('кожна вкладка належить рівно одній поверхні', () => {
    const ids = TABS.map((t) => t.id);
    expect(new Set(ids).size, 'вкладка оголошена двічі').toBe(ids.length);
    expect(tabsOf('site').length + tabsOf('pm').length).toBe(TABS.length);
  });

  it('корені поверхонь не перетинаються і збігаються з маршрутами', () => {
    expect(SURFACE_ROOT.site).toBe('/admin');
    expect(SURFACE_ROOT.pm).toBe('/manage');
    const app = read('src/App.tsx');
    for (const root of Object.values(SURFACE_ROOT)) {
      expect(app, `немає маршруту ${root}`).toContain(`path="${root}"`);
      expect(app, `немає маршруту ${root}/:tab`).toContain(`path="${root}/:tab"`);
    }
  });

  it('шляхи сервісу і поверхні кажуть одне', () => {
    // isAppPath вирішує, що перекидати на app.*: якщо він розійдеться з
    // SURFACE_ROOT, консоль відкриється не на тому домені.
    expect(isAppPath(SURFACE_ROOT.pm), 'консоль не вважається сервісом').toBe(true);
    expect(isAppPath(SURFACE_ROOT.site), 'адмінку сайту тягне на app.*').toBe(false);
  });
});
