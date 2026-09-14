/**
 * Послуги: те, що ламається тихо.
 *
 * Три формати співпраці стали головною віссю сайту — перший пункт меню, блок
 * на головній, три власні сторінки, таблиця цін. Показуються вони в чотирьох
 * місцях, а джерело одне (data/services.ts). Саме такі конструкції й ламаються
 * без жодного сигналу:
 *
 *   — формат лишився в даних, але сторінки під нього немає (посилання в нікуди);
 *   — підстановка {audits} поїхала в розмітку сирою, бо новий споживач забув
 *     викликати fillCounts — і людина читає «E-commerce 360°: {audits} аудитів»;
 *   — ціна в статиці (prerender — окремий .mjs без доступу до TS) розійшлася з
 *     ціною в застосунку, і Google показує стару.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICES, SERVICE_COUNTS, fillCounts, servicePath } from '@/data/services';
import { PROCESS, AFTER } from '@/data/process';
import SEO_DATA from '@/lib/seo-data.json';
const SEO_ROUTES = SEO_DATA.routes;
import { PAGES, SUB_PAGES, nameOf } from '@/lib/nav';

const SRC = join(__dirname, '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const pre = readFileSync(join(SRC, '..', 'scripts', 'prerender.mjs'), 'utf8');

describe('три формати — і три сторінки під них', () => {
  it('номери йдуть підряд, слаги не повторюються', () => {
    expect(SERVICES.map((s) => s.n)).toEqual(['01', '02', '03']);
    expect(new Set(SERVICES.map((s) => s.slug)).size).toBe(SERVICES.length);
  });

  it('у кожного формату є названа сторінка', () => {
    // Без назви в lib/nav крихта покаже слаг, а посилання — адресу замість
    // підпису. Саме це вже сталося з підсторінками систем у блозі.
    for (const s of SERVICES) {
      const path = servicePath(s);
      expect(SUB_PAGES.map((p) => p.to), `${path} немає в переліку назв`).toContain(path);
      expect(nameOf(path, 'uk'), path).toBe(s.name[0]);
      expect(nameOf(path, 'en'), path).toBe(s.name[1]);
    }
  });

  it('послуги — перший пункт меню', () => {
    /*
     * Порядок тут не косметика. Меню починалось із «Головної» й вело далі по
     * нашій будові; те єдине, що клієнт купує, лежало всередині сторінки цін.
     */
    expect(PAGES[0].to).toBe('/services');
    expect(PAGES.map((p) => p.to), '«Головна» повернулась у меню — її роль виконує логотип')
      .not.toContain('/');
  });

  it('з головної можна дійти до кожного формату', () => {
    const home = read('system/HomeBlocks.tsx');
    expect(home, 'блок послуг не будує адрес зі спільного джерела').toContain('servicePath(s)');
    expect(home, 'блок послуг більше не перебирає всі формати').toContain('SERVICES.map');
  });
});

describe('підстановки чисел не їдуть у розмітку сирими', () => {
  it('усі підстановки в текстах — з відомого переліку', () => {
    const known = new Set<string>(SERVICE_COUNTS);
    const all = SERVICES.flatMap((s) => [...s.includes, s.forWhom, s.promise, s.format, s.terms, s.resp, s.priceNote])
      .flatMap((p) => p);
    const used = all.flatMap((x) => [...x.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
    expect(used.length, 'підстановок не лишилось — тест більше нічого не стереже').toBeGreaterThan(0);
    const bad = used.filter((k) => !known.has(k));
    expect(bad, `невідомі підстановки: ${bad.join(', ')}`).toEqual([]);
  });

  it('кожен, хто показує склад формату, підставляє числа', () => {
    /*
     * Це і є той сторож, заради якого підстановка взагалі існує. Новий
     * споживач, який просто виведе s.includes, покаже людині «{audits}».
     */
    const files = readdirSync(join(SRC, 'system')).filter((f) => f.endsWith('.tsx'));
    const consumers = files.filter((f) => {
      const src = read(`system/${f}`);
      return src.includes("@/data/services") && /\.includes\b/.test(src);
    });
    expect(consumers.length, 'складу формату не показує ніхто — тест нічого не стереже').toBeGreaterThan(0);
    for (const f of consumers)
      expect(read(`system/${f}`), `${f} показує склад формату без fillCounts`).toContain('fillCounts');
  });

  it('fillCounts справді підставляє', () => {
    const line = SERVICES[0].includes.find((x) => x[0].includes('{audits}'))!;
    const out = fillCounts(line[0], { audits: 13, domains: 35 });
    expect(out).toContain('13 аудитів');
    expect(out).not.toMatch(/[{}]/);
  });
});

describe('статика не розходиться із застосунком', () => {
  it('ціни у prerender ті самі, що в джерелі', () => {
    /*
     * prerender.mjs — окремий скрипт без доступу до TS, тож тексти форматів там
     * продубльовані свідомо. Ціна — те, що розійшлося б найдорожче: у видачі
     * стояла б стара сума. Звіряємо всі суми, які згадує статика.
     */
    const at = pre.indexOf('const FORMAT_PAGES = [');
    expect(at, 'дзеркала FORMAT_PAGES більше немає — тест треба переписати').toBeGreaterThan(0);
    const block = pre.slice(at, pre.indexOf('\n];', at));
    for (const s of SERVICES) {
      const row = block.split('\n').filter((l) => l.includes(`'${s.slug}'`) || l.startsWith('   '));
      expect(row.length, `у статиці немає формату ${s.slug}`).toBeGreaterThan(0);
    }
    // Сума закінчується цифрою: [\d,]+ жадібно хапав і кому після «$4,900,».
    const MONEY = /\$[\d,]*\d/g;
    const inStatic = new Set([...block.matchAll(MONEY)].map((m) => m[0]));
    const inSource = new Set([...SERVICES.flatMap((s) => [...s.price, ...s.priceNote, ...s.terms, ...(s.scopes ?? []).map((x) => x.price)])
      .join(' ').matchAll(MONEY)].map((m) => m[0]));
    const drift = [...inStatic].filter((x) => !inSource.has(x));
    expect(drift, `у статиці суми, яких немає в джерелі: ${drift.join(', ')}`).toEqual([]);
  });

  it('ціни в описах для пошуку ті самі, що в джерелі', () => {
    /*
     * Мета форматів переїхала з пререндера у спільну таблицю seo-data.json —
     * туди ж переїхали й суми. Перевірка вище дивиться лише в скрипт, тож без
     * цієї ціна в сніпеті могла б відстати мовчки: людина бачить у видачі одну
     * суму, на сторінці іншу.
     */
    const MONEY = /\$[\d,]*\d/g;
    const inSource = new Set([...SERVICES.flatMap((x) => [...x.price, ...x.priceNote, ...x.terms, ...(x.scopes ?? []).map((y) => y.price)])
      .join(' ').matchAll(MONEY)].map((m) => m[0]));
    for (const x of SERVICES) {
      const m = (SEO_ROUTES as Record<string, { uk: string[]; en: string[] }>)[servicePath(x)];
      expect(m, `у seo-data немає мети ${servicePath(x)} — заголовок у видачі буде чужий`).toBeTruthy();
      const drift = [...[...m.uk, ...m.en].join(' ').matchAll(MONEY)].map((n) => n[0]).filter((n) => !inSource.has(n));
      expect(drift, `в описі ${servicePath(x)} суми, яких немає в джерелі: ${drift.join(', ')}`).toEqual([]);
    }
  });

  it('усі три сторінки форматів є в статиці й у карті сайту — обома мовами', () => {
    /*
     * Доти тут стояла перевірка тексту скрипта: «у prerender згадується слаг».
     * Вона й не мала шансу впіймати те, що сталось насправді — англійські
     * сторінки форматів не збирались ЗОВСІМ: цикл EN брав мету лише з
     * seo-data.json, а форматів там немає. Слаг у файлі був, сторінки не було.
     * Тому дивимось у зібраний dist, а не в наміри в коді.
     */
    const DIST = join(__dirname, '..', '..', 'dist');
    if (existsSync(join(DIST, 'sitemap.xml'))) {
      const map = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
      for (const s of SERVICES)
        for (const pre2 of ['', '/en']) {
          const url = pre2 + servicePath(s);
          expect(existsSync(join(DIST, url.slice(1), 'index.html')), `немає статики ${url}`).toBe(true);
          expect(map, `${url} немає в sitemap`).toContain(`>https://weexp.agency${url}<`);
        }
    }
    // Без зібраного dist лишається хоч перевірка, що формати взагалі є в скрипті.
    for (const s of SERVICES)
      expect(pre, `у prerender немає ${servicePath(s)}`).toContain(`'${s.slug}'`);
  });
});

describe('процес — один на всі формати', () => {
  it('кроки нумеровані підряд і не порожні', () => {
    expect(PROCESS.map((s) => s.n)).toEqual(PROCESS.map((_, k) => String(k + 1).padStart(2, '0')));
    for (const s of [...PROCESS.map((x) => x.title), ...PROCESS.map((x) => x.text), AFTER.title, ...AFTER.text]) {
      expect(s[0], 'порожній укр. текст').toBeTruthy();
      expect(s[1], 'порожній англ. текст').toBeTruthy();
      expect(s[1], `англійська кирилицею: ${s[1]}`).not.toMatch(/\p{Script=Cyrillic}/u);
    }
  });

  it('кроки показуються з одного джерела — і лише там, де їх читають', () => {
    /*
     * Сторінка цін, яка тримала власний перелік кроків у розмітці, з сайту
     * пішла. Потім процес зник і з головної: шість кроків на цілий екран
     * читає той, хто вже обирає формат, а не той, хто щойно зайшов. Лишилась
     * сторінка формату — там питання «як це буде» ставлять насправді.
     *
     * Сторож тримає ДВІ речі: кроки беруться з даних (інакше вони розійдуться
     * між сторінками) і не повертаються туди, звідки їх прибрали.
     */
    expect(read('system/ServiceFormat.tsx'), 'кроки знову набрані в розмітці').toContain('PROCESS.map');
    expect(read('system/HomeBlocks.tsx'), 'шість кроків процесу повернулись на головну')
      .not.toContain('PROCESS.map');
  });

  it('порівняння форматів живе в даних, а не в розмітці', () => {
    // Таблиця переїхала зі сторінки цін у data/services.ts разом із форматами.
    expect(read('system/Services.tsx'), 'таблиця порівняння зникла').toContain('COMPARE.map');
    expect(read('data/services.ts'), 'рядки порівняння не в джерелі').toContain('export const COMPARE');
  });
});

describe('англійська версія форматів', () => {
  it('не лишає українського тексту', () => {
    const cyr = SERVICES.flatMap((s) => [s.name[1], s.tag[1], s.period[1], s.price[1], s.priceNote[1],
      s.promise[1], s.forWhom[1], s.format[1], s.terms[1], s.resp[1], ...s.includes.map((x) => x[1]),
      ...(s.scopes ?? []).map((x) => x.name[1])])
      .filter((x) => /\p{Script=Cyrillic}/u.test(x));
    expect(cyr, `кирилиця в англійській версії: ${cyr.join(' | ')}`).toEqual([]);
  });
});
