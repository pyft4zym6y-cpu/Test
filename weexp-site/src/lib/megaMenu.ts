import { PAGES, EXTRA_PAGES, type PageName } from '@/lib/nav';
import { SERVICES, servicePath } from '@/data/services';
import { EXPERTISES } from '@/system/expertises';
import { filledCategories, articlesOf } from '@/data/blog';
import { CATEGORY_LABEL } from '@/data/blogTypes';

/**
 * МЕГА-МЕНЮ: усе, що глибше першого рівня, видно з верхньої навігації.
 *
 * До цього меню показувало лише шість адрес першого рівня, а під ними жили ще
 * тринадцять сторінок — три формати послуг, девʼять експертиз, дев'ять розділів
 * блогу. Побачити їх можна було, лише зайшовши в розділ і здогадавшись, що там
 * усередині ще один рівень. Для власника сайту це виглядало так: сторінки є,
 * індексуються, приймають трафік — а в структурі їх немає.
 *
 * ПЕРЕЛІК РАХУЄТЬСЯ З ДАНИХ, а не набраний руками. Це не зручність, а єдиний
 * спосіб, щоб меню не розійшлося з сайтом: новий формат, нова експертиза чи
 * нова категорія блогу зʼявляються в меню самі. Набраний список відстає з
 * першою ж правкою — так уже було з дзеркалом меню в пререндері.
 */
export type MegaItem = {
  to: string;
  uk: string;
  en: string;
  /** Правий підпис: ціна формату, число статей у категорії. */
  note?: string;
};

export type MegaSection = PageName & {
  /** Порожній масив = звичайний пункт меню без панелі. */
  items: MegaItem[];
  /** Рядок під заголовком панелі — навіщо сюди заходити. */
  lead?: [string, string];
};

/** Заголовок «усі статті розділу» веде на хаб із фільтром у адресі. */
const blogCategoryPath = (c: string) => `/blog?c=${c}`;

const services = (): MegaItem[] =>
  SERVICES.map((s) => ({
    to: servicePath(s),
    uk: s.name[0],
    en: s.name[1],
    note: s.price[0],
  }));

const expertise = (): MegaItem[] =>
  EXPERTISES.map((e) => ({
    to: `/expansion/${e.slug}`,
    uk: e.title[0],
    en: e.title[1],
  }));

const blog = (): MegaItem[] =>
  filledCategories().map((c) => ({
    to: blogCategoryPath(c),
    uk: CATEGORY_LABEL[c],
    /*
     * Статті лише українською, тож англійська назва категорії тут була б
     * обіцянкою, якої розділ не виконує. Показуємо ту саму назву: людина
     * бачить, що вміст український, ще до кліку.
     */
    en: CATEGORY_LABEL[c],
    note: String(articlesOf(c).length),
  }));

/**
 * Секції верхнього меню з усім, що під ними.
 *
 * Порядок — з PAGES: меню, підвал і крихти мусять називати й сортувати
 * розділи однаково, інакше людина двічі зустрічає той самий розділ під різними
 * назвами й не зіставляє їх.
 */
export function megaSections(): MegaSection[] {
  const byPath: Record<string, { items: MegaItem[]; lead: [string, string] }> = {
    '/services': {
      items: services(),
      lead: ['Три формати. Відрізняються не «пакетом послуг», а тим, хто відповідає за результат.',
             'Three formats. They differ not by «service package» but by who is accountable for the result.'],
    },
    '/expansion': {
      items: expertise(),
      lead: ['Девʼять напрямів робіт. Входять у будь-який формат — змінюється лише те, хто тримає кермо.',
             'Nine areas of work. They go into any format — only who holds the wheel changes.'],
    },
    '/blog': {
      items: blog(),
      lead: ['Розбори за темами: що рахувати, де витікають гроші й що робити першим.',
             'Breakdowns by topic: what to count, where money leaks and what to fix first.'],
    },
  };
  return PAGES.map((p) => ({ ...p, items: byPath[p.to]?.items ?? [], lead: byPath[p.to]?.lead }));
}

/**
 * Адреси, які меню має показати додатково до розділів: дія-розрахунок і
 * кабінет. Вони не розділи, тож у ряду пунктів їм не місце, але сховати їх
 * повністю — знову зробити сторінку, якої немає в структурі.
 */
export const megaExtras = (): PageName[] =>
  EXTRA_PAGES.filter((p) => p.to === '/diagnose');
