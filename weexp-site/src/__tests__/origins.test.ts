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
    // Інакше посилання на конкретну картку клієнта вело б у корінь кабінету:
    // адресу можна переслати колезі — це і був сенс тримати розділ в URL.
    const deep = fromSite.find((x) => x.source === '/admin/:path*');
    expect(deep, 'немає редиректу для підшляхів адмінки').toBeTruthy();
    expect(deep!.destination).toBe(`${APP_ORIGIN}/admin/:path*`);
  });

  it('двомовний кабінет зберігає мову, одномовна адмінка — ні', () => {
    /*
     * Спершу я скидав /en для обох розділів «бо ведення проєкту одномовне».
     * Це вірно лише для адмінки: маршрута /en/admin справді немає. А кабінет
     * двомовний, і англомовний клієнт після переїзду опинявся б українською —
     * тобто розділення адрес мовчки міняло б йому мову.
     */
    const cab = fromSite.find((x) => x.source === '/en/cabinet');
    expect(cab, 'немає редиректу /en/cabinet').toBeTruthy();
    expect(cab!.destination).toBe(`${APP_ORIGIN}/en/cabinet`);

    const adm = fromSite.find((x) => x.source === '/en/admin');
    expect(adm, 'немає редиректу /en/admin').toBeTruthy();
    expect(adm!.destination).toBe(`${APP_ORIGIN}/admin`);
  });

  it('нормалізація шляху повторює те саме правило', () => {
    // Сторож усередині застосунку і серверні правила мають вирішувати
    // однаково, інакше клієнтський перехід і пряме відкриття дадуть різне.
    expect(normalizeAppPath('/en/cabinet')).toBe('/en/cabinet');
    expect(normalizeAppPath('/en/cabinet/company')).toBe('/en/cabinet/company');
    expect(normalizeAppPath('/en/admin')).toBe('/admin');
    expect(normalizeAppPath('/en/admin/leads/c/42')).toBe('/admin/leads/c/42');
    expect(normalizeAppPath('/cabinet')).toBe('/cabinet');
    expect(normalizeAppPath('/admin')).toBe('/admin');
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
