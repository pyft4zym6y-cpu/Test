import { Link, useSearchParams } from 'react-router-dom';
import { useLp, useT, useLang } from '@/i18n';
import { ORIGIN, useJsonLd } from '@/lib/seo';
import { ARTICLES, articlesOf, filledCategories } from '@/data/blog';
import { CATEGORY_LABEL, CATEGORY_NOTE, type BlogCategory } from '@/data/blogTypes';
import './blog.css';

/**
 * /blog — теми по розділах, а не стрічка «останніх записів».
 *
 * Стрічка за датою відповідає на питання «що нового», якого читач не ставив.
 * Він приходить із питанням про свій бізнес: чому реклама не окупається, чому
 * склад не встигає, як виходити в ЄС. Тому верхній рівень — розділи, що
 * повторюють структуру сайту: у кожної теми сайту є своя тема в блозі.
 *
 * Фільтр живе в адресі (?c=commerce), а не в стані компонента: посилання на
 * розділ можна переслати, F5 не скидає вибір, «Назад» працює як очікується.
 *
 * Статті поки лише українською. Інтерфейс сторінки при цьому двомовний, а
 * англомовному читачеві про мову текстів сказано прямо: краще попередити на
 * вході, ніж дати йому відкрити лонгрид і зрозуміти це самому.
 */
export function BlogHub() {
  const lp = useLp();
  const t = useT();
  const lang = useLang();
  const [sp, setSp] = useSearchParams();
  const active = (sp.get('c') || '') as BlogCategory | '';
  const cats = filledCategories();
  const shown = active && cats.includes(active) ? [active] : cats;

  useJsonLd('blog', {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${ORIGIN}/blog#blog`,
    name: 'Блог WEEXP',
    description: 'Практика e-commerce: економіка продажів, конверсія, операції, дані, вихід на нові ринки.',
    inLanguage: 'uk',
    url: `${ORIGIN}/blog`,
    publisher: { '@type': 'Organization', name: 'WEEXP', url: ORIGIN + '/' },
    blogPost: ARTICLES.slice(0, 20).map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.description,
      datePublished: a.published,
      url: `${ORIGIN}/blog/${a.slug}`,
    })),
  });

  const pick = (c: BlogCategory | '') => {
    const next = new URLSearchParams(sp);
    if (c) next.set('c', c); else next.delete('c');
    setSp(next, { replace: true });
  };

  return (
    <section className="sysx blogh">
      <span className="sysx-field" aria-hidden="true" />
      <div className="blogh-in">
        <header className="blogh-head">
          <span className="sysx-kick">{t('Блог WEEXP', 'WEEXP blog')}</span>
          <h1 className="sysx-display blogh-h1">
            {t('Практика e-commerce —', 'E-commerce practice —')}<br />
            <span className="sysx-em">{t('без загальних слів', 'without the platitudes')}</span>
          </h1>
          <p className="sysx-lead">
            {t(
              'Кожна стаття відповідає на конкретне питання власника: що рахувати, де витікають гроші й що робити першим. Теми повторюють структуру нашої роботи — від економіки продажів до виходу на нові ринки.',
              'Every article answers a concrete owner question: what to count, where the money leaks and what to fix first. The topics mirror the structure of our work, from unit economics to entering new markets.',
            )}
          </p>
          {lang === 'en' && (
            <p className="blogh-lang mono">Articles are currently published in Ukrainian only.</p>
          )}
          <p className="blogh-count mono">
            {ARTICLES.length} {t('статей', 'articles')} · {cats.length} {t('тем', 'topics')}
          </p>
        </header>

        <nav className="blogh-cats" aria-label={t('Теми блогу', 'Blog topics')}>
          <button className={'blogh-cat mono' + (active ? '' : ' is-on')} onClick={() => pick('')}>
            {t('Усі теми', 'All topics')}
          </button>
          {cats.map((c) => (
            <button key={c} className={'blogh-cat mono' + (active === c ? ' is-on' : '')} onClick={() => pick(c)}>
              {CATEGORY_LABEL[c]} <i>{articlesOf(c).length}</i>
            </button>
          ))}
        </nav>

        {shown.map((c) => (
          <section key={c} className="blogh-sec" id={c}>
            <header className="blogh-sec-h">
              <h2 className="sysx-display blogh-h2">{CATEGORY_LABEL[c]}</h2>
              <p>{CATEGORY_NOTE[c]}</p>
            </header>
            <ol className="blogh-grid">
              {articlesOf(c).map((a) => (
                <li key={a.slug}>
                  <Link to={lp('/blog/' + a.slug)} className="blogh-card">
                    <h3 className="blogh-card-h">{a.title}</h3>
                    <p className="blogh-card-d">{a.description}</p>
                    <span className="blogh-card-m mono">{a.readMin} {t('хв', 'min')} · {a.keywords[0]}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
