/**
 * Блог: вимоги, які легко не помітити очима.
 *
 * Сорок статей неможливо перевірити читанням: покриття сторінок, унікальність
 * описів, довжина meta, двобічність посилань — усе це видно тільки рахунком.
 * І кожна з цих речей ламається тихо: сторінка без статей просто не показує
 * блок, дубльований опис просто гірше ранжується, стаття без зворотного
 * посилання просто нікуди не веде. Нічого не падає — і саме тому потрібен тест.
 *
 * Джерело — файли в src/content/blog. Індекс (blog-index.json) генерується з
 * них скриптом; тест звіряє одне з одним, щоб індекс не почав жити своїм життям.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BlogArticle } from '@/data/blogTypes';
import { CATEGORY_LABEL } from '@/data/blogTypes';

const ROOT = join(__dirname, '..', '..');
const DIR = join(ROOT, 'src', 'content', 'blog');
const FILES = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.json')) : [];
const ARTICLES: BlogArticle[] = FILES.map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));
const INDEX = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'blog-index.json'), 'utf8')) as { slug: string }[];

/** Сторінки сайту, на яких має бути блок статей. */
const PAGES = (() => {
  const xray = readFileSync(join(ROOT, 'src', 'data', 'xray.ts'), 'utf8');
  const sys = [...xray.matchAll(/num: '\d+', slug: '([a-z-]+)'/g)].map((m) => `/systems/${m[1]}`);
  const exp = [...readFileSync(join(ROOT, 'src', 'system', 'expertises.ts'), 'utf8')
    .matchAll(/slug: '([a-z-]+)'/g)].map((m) => `/expansion/${m[1]}`);
  return ['/', '/systems', '/expansion', '/proof', '/people', '/pricing',
          '/diagnose', '/contact', '/audit-pack', ...sys, ...exp];
})();

const MIN_TOTAL = 40;
const MIN_PER_PAGE = 5;

describe('обсяг і покриття', () => {
  it(`статей не менше ${MIN_TOTAL}`, () => {
    expect(ARTICLES.length).toBeGreaterThanOrEqual(MIN_TOTAL);
  });

  it(`на кожній сторінці сайту не менше ${MIN_PER_PAGE} статей`, () => {
    /*
     * Порожня сторінка тут не «менш красива» — вона просто не показує блок,
     * і жодного сигналу про це немає. Список нижче називає винних поіменно.
     */
    const thin = PAGES
      .map((p) => ({ p, n: ARTICLES.filter((a) => a.pages.includes(p)).length }))
      .filter((x) => x.n < MIN_PER_PAGE)
      .map((x) => `${x.p} (${x.n})`);
    expect(thin, `сторінки без ${MIN_PER_PAGE} статей`).toEqual([]);
  });

  it('усі сторінки в статтях справді існують', () => {
    // Друкарська помилка в pages не падає — вона просто вішає статтю в нікуди.
    const bad = new Set<string>();
    for (const a of ARTICLES) for (const p of a.pages) if (!PAGES.includes(p)) bad.add(`${a.slug} → ${p}`);
    expect([...bad]).toEqual([]);
  });
});

describe('індекс збігається з файлами', () => {
  it('той самий набір статей', () => {
    // Індекс — похідна від файлів. Розійшовшись, він показує в блоках статті,
    // яких немає, або ховає ті, що є.
    expect(INDEX.map((a) => a.slug).sort()).toEqual(ARTICLES.map((a) => a.slug).sort());
  });

  it('імʼя файлу дорівнює slug', () => {
    // Інакше стаття доступна за однією адресою, а посилаються на неї за іншою.
    const bad = FILES.filter((f) => {
      const a = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
      return a.slug !== f.replace(/\.json$/, '');
    });
    expect(bad).toEqual([]);
  });
});

describe('те, що бачить видача', () => {
  it('заголовки й описи унікальні', () => {
    for (const key of ['title', 'description'] as const) {
      const vals = ARTICLES.map((a) => a[key]);
      const dupes = vals.filter((v, i) => vals.indexOf(v) !== i);
      expect([...new Set(dupes)], `дублі в ${key}`).toEqual([]);
    }
  });

  it('опис укладається в 140–170 символів', () => {
    // Коротший не займає рядок видачі, довший обрізається на півслові.
    const bad = ARTICLES
      .filter((a) => a.description.length < 140 || a.description.length > 170)
      .map((a) => `${a.slug} (${a.description.length})`);
    expect(bad).toEqual([]);
  });

  it('seoTitle, якщо заданий, не довший за 60 символів', () => {
    const bad = ARTICLES.filter((a) => a.seoTitle && a.seoTitle.length > 60)
      .map((a) => `${a.slug} (${a.seoTitle!.length})`);
    expect(bad).toEqual([]);
  });

  it('slug латиницею, без підкреслень і крапок', () => {
    const bad = ARTICLES.filter((a) => !/^[a-z0-9-]+$/.test(a.slug)).map((a) => a.slug);
    expect(bad).toEqual([]);
  });
});

describe('AEO: те, що цитує AI-видача', () => {
  it('у кожної статті є пряма відповідь', () => {
    const bad = ARTICLES.filter((a) => !a.answer || a.answer.trim().length < 80).map((a) => a.slug);
    expect(bad, 'немає прямої відповіді на початку').toEqual([]);
  });

  it('пряма відповідь коротка — інакше її не процитують', () => {
    // Орієнтир — до 60 слів: довші фрагменти видача переказує сама, і контроль
    // над формулюванням втрачається.
    const bad = ARTICLES.filter((a) => a.answer.split(/\s+/).length > 60)
      .map((a) => `${a.slug} (${a.answer.split(/\s+/).length} слів)`);
    expect(bad).toEqual([]);
  });

  it('FAQ є і в ньому щонайменше три питання', () => {
    const bad = ARTICLES.filter((a) => (a.faq?.length ?? 0) < 3).map((a) => `${a.slug} (${a.faq?.length ?? 0})`);
    expect(bad).toEqual([]);
  });

  it('питання FAQ сформульовані як питання', () => {
    const bad: string[] = [];
    for (const a of ARTICLES) for (const f of a.faq) if (!f.q.trim().endsWith('?')) bad.push(`${a.slug}: ${f.q}`);
    expect(bad).toEqual([]);
  });

  it('відповіді FAQ самодостатні', () => {
    // Відповідь «див. вище» у видачі опиниться без «вище».
    const bad: string[] = [];
    for (const a of ARTICLES) for (const f of a.faq) if (f.a.trim().length < 90) bad.push(`${a.slug}: ${f.q}`);
    expect(bad, 'надто коротка відповідь FAQ').toEqual([]);
  });
});

describe('структура лонгриду', () => {
  it('є висновок і щонайменше чотири розділи', () => {
    const bad = ARTICLES
      .filter((a) => a.sections.length < 4 || (a.takeaway?.length ?? 0) < 3)
      .map((a) => `${a.slug} (${a.sections.length} розділів, ${a.takeaway?.length ?? 0} висновків)`);
    expect(bad).toEqual([]);
  });

  it('заголовки розділів унікальні всередині статті', () => {
    const bad: string[] = [];
    for (const a of ARTICLES) {
      const hs = a.sections.map((s) => s.h);
      if (new Set(hs).size !== hs.length) bad.push(a.slug);
    }
    expect(bad).toEqual([]);
  });

  it('обсяг відповідає заявленому часу читання', () => {
    /*
     * readMin показується читачеві. Якщо він розходиться з текстом, це просто
     * неправда в інтерфейсі. Рахуємо приблизно: 180 слів на хвилину.
     */
    const bad: string[] = [];
    for (const a of ARTICLES) {
      const words = JSON.stringify(a.sections).split(/\s+/).length + a.lead.split(/\s+/).length;
      const est = Math.round(words / 180);
      if (Math.abs(est - a.readMin) > 4) bad.push(`${a.slug}: заявлено ${a.readMin}, вийшло ~${est}`);
    }
    expect(bad).toEqual([]);
  });

  it('лонгрид не коротший за 900 слів', () => {
    const bad = ARTICLES
      .map((a) => ({ s: a.slug, w: JSON.stringify(a.sections).split(/\s+/).length }))
      .filter((x) => x.w < 900)
      .map((x) => `${x.s} (${x.w})`);
    expect(bad).toEqual([]);
  });
});

describe('перелінковка двобічна', () => {
  it('кожна стаття має ключові слова', () => {
    const bad = ARTICLES.filter((a) => (a.keywords?.length ?? 0) < 3).map((a) => a.slug);
    expect(bad).toEqual([]);
  });

  it('головне ключове слово зустрічається в тексті', () => {
    /*
     * Ключове слово, якого немає в статті, — це обіцянка видачі, якої текст не
     * виконує. Перевіряємо перше (основне) за коренем: українська відмінює, і
     * точний збіг вимагав би писати неприродно.
     */
    const bad: string[] = [];
    for (const a of ARTICLES) {
      const body = (a.title + ' ' + a.lead + ' ' + a.answer + ' ' + JSON.stringify(a.sections)).toLowerCase();
      const root = a.keywords[0].toLowerCase().split(/\s+/)[0].slice(0, 6);
      if (!body.includes(root)) bad.push(`${a.slug}: «${a.keywords[0]}»`);
    }
    expect(bad).toEqual([]);
  });

  it('категорія стаття існує в переліку', () => {
    const bad = ARTICLES.filter((a) => !(a.category in CATEGORY_LABEL)).map((a) => `${a.slug}: ${a.category}`);
    expect(bad).toEqual([]);
  });

  it('стаття веде щонайменше на дві сторінки сайту', () => {
    // Одна сторінка — це вже не перелінковка, а підпис.
    const bad = ARTICLES.filter((a) => a.pages.length < 2).map((a) => a.slug);
    expect(bad).toEqual([]);
  });
});

describe('блок на сторінках і сторінка статті', () => {
  const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

  it('блок стоїть в оболонці, а не в кожній сторінці окремо', () => {
    // 26 сторінок: доданий руками, він на трьох буде забутий.
    expect(read('src/system/SystemShell.tsx')).toMatch(/<BlogTeaser\s*\/>/);
  });

  it('блок мовчить на англійській версії', () => {
    // Поки статті лише українською, вести на них англомовного читача гірше,
    // ніж не показати блок узагалі.
    expect(read('src/system/BlogTeaser.tsx')).toMatch(/lang === 'en'/);
  });

  it('стаття віддає Article, FAQPage і BreadcrumbList', () => {
    const post = read('src/system/BlogPost.tsx');
    for (const type of ['Article', 'FAQPage', 'BreadcrumbList']) {
      expect(post, `немає розмітки ${type}`).toContain(`'${type}'`);
    }
  });

  it('тіла статей не потрапляють у спільний бандл', () => {
    // Сорок лонгридів у спільному чанку — це сотні кілобайт тексту кожному,
    // хто відкрив головну.
    expect(read('src/data/blog.ts')).toMatch(/import\.meta\.glob/);
    expect(read('src/data/blog.ts'), 'тіла вантажаться одразу').not.toMatch(/eager:\s*true/);
  });
});
