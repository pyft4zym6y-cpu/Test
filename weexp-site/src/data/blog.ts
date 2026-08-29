/**
 * Доступ до статей блогу.
 *
 * Тіла лонгридів у спільний бандл не потрапляють. Сорок статей по 1500+ слів —
 * це сотні кілобайт тексту, який 99% відвідувачів ніколи не відкриє: він
 * потрібен лише на сторінці самої статті. Тому два різні шляхи:
 *
 *  • INDEX — легкі записи (заголовок, опис, ключові, сторінки). Вантажиться
 *    одразу: з нього будуються блоки на сторінках сайту, хаб і карта сайту.
 *  • BODY — повна стаття. Вантажиться лише коли її відкрили, окремим чанком.
 *
 * Обидва зібрані з одних і тих самих JSON-файлів через import.meta.glob:
 * додати статтю — це покласти файл, а не вписати її ще й у три переліки.
 */
import type { BlogArticle, BlogTeaserItem, BlogCategory } from '@/data/blogTypes';

/* eager: лише метадані потрібні одразу — але Vite не вміє брати «частину
   JSON». Тому індекс збирається окремим кроком складання у blog-index.json,
   а сюди приходить уже легким. */
import INDEX from '@/data/blog-index.json';

/** Ліниві імпорти тіл: кожна стаття — свій чанк. */
const BODIES = import.meta.glob<{ default: BlogArticle }>('../content/blog/*.json');

export const ARTICLES: BlogTeaserItem[] = (INDEX as BlogTeaserItem[])
  .slice()
  .sort((a, b) => (a.published < b.published ? 1 : -1));

export const bySlug = (slug: string): BlogTeaserItem | undefined =>
  ARTICLES.find((a) => a.slug === slug);

/** Повна стаття — лише коли її відкрили. */
export async function loadArticle(slug: string): Promise<BlogArticle | null> {
  const key = Object.keys(BODIES).find((k) => k.endsWith(`/${slug}.json`));
  if (!key) return null;
  try {
    const m = await BODIES[key]();
    return m.default;
  } catch {
    return null;
  }
}

/**
 * Статті для конкретної сторінки сайту.
 *
 * Порядок — свіжіші вище, але з одним винятком: спершу ті, для яких ця
 * сторінка стоїть ПЕРШОЮ у списку pages. Це стаття «про цю сторінку», а не
 * та, що згадує її третьою серед чотирьох — і в блоці з пʼяти місць вона
 * корисніша за просто нову.
 */
export function articlesFor(path: string, limit = 5): BlogTeaserItem[] {
  const mine = ARTICLES.filter((a) => a.pages.includes(path));
  const primary = mine.filter((a) => a.pages[0] === path);
  const rest = mine.filter((a) => a.pages[0] !== path);
  return [...primary, ...rest].slice(0, limit);
}

/** Статті розділу. */
export const articlesOf = (c: BlogCategory): BlogTeaserItem[] =>
  ARTICLES.filter((a) => a.category === c);

/** Розділи, у яких є хоч одна стаття — щоб хаб не малював порожніх заголовків. */
export function filledCategories(): BlogCategory[] {
  const seen = new Set<BlogCategory>();
  for (const a of ARTICLES) seen.add(a.category);
  return [...seen];
}

/**
 * Схожі статті всередині блогу: спершу спільна сторінка, далі спільний розділ.
 *
 * Спільна сторінка сильніша за спільний розділ: дві статті, які ведуть на одну
 * послугу, ближчі одна до одної, ніж дві випадкові з того самого розділу.
 */
export function relatedTo(slug: string, limit = 3): BlogTeaserItem[] {
  const me = bySlug(slug);
  if (!me) return [];
  const score = (a: BlogTeaserItem) =>
    a.pages.filter((p) => me.pages.includes(p)).length * 10 + (a.category === me.category ? 1 : 0);
  return ARTICLES
    .filter((a) => a.slug !== slug && score(a) > 0)
    .sort((a, b) => score(b) - score(a) || (a.published < b.published ? 1 : -1))
    .slice(0, limit);
}
