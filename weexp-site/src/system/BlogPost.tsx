import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { nameOf } from '@/lib/nav';
import { ORIGIN, useJsonLd } from '@/lib/seo';
import { loadArticle, relatedTo } from '@/data/blog';
import { CATEGORY_LABEL, type BlogArticle, type BlogSection } from '@/data/blogTypes';
import { SystemNotFound } from '@/system/SystemNotFound';
import './blog.css';

/**
 * Сторінка статті.
 *
 * Порядок блоків підпорядкований трьом читачам, а не смаку:
 *
 *  1. Прямий відповідь (`answer`) одразу під заголовком. Це те, що цитує
 *     AI-видача, і те, заради чого людина відкрила сторінку. Ховати відповідь
 *     під тисячу слів «підводки» — найдорожча звичка блогів: обидва читачі
 *     йдуть, не дочитавши.
 *  2. Зміст. На лонгриді він і навігація, і сигнал структури для пошуку.
 *  3. Тіло з H2-питаннями.
 *  4. FAQ з розміткою FAQPage — другий канал, яким стаття потрапляє у відповіді.
 *  5. Посилання на сторінки, про які стаття говорить: блог існує не сам по
 *     собі, а щоб вести на послугу.
 *
 * Тіло вантажиться окремим чанком (див. data/blog.ts): сорок лонгридів у
 * спільному бандлі означали б, що кожен відвідувач головної качає їх усі.
 */
export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const [a, setA] = useState<BlogArticle | null | 'loading'>('loading');

  useEffect(() => {
    let alive = true;
    setA('loading');
    void loadArticle(String(slug)).then((r) => { if (alive) setA(r); });
    return () => { alive = false; };
  }, [slug]);

  const url = `${ORIGIN}/blog/${slug}`;
  /*
   * Розмітка: Article + FAQPage + BreadcrumbList.
   *
   * Хук викликається завжди — правила хуків не дозволяють інакше, — але
   * порожній обʼєкт нічого не пише. Ставити useJsonLd після if (!a) означало б
   * умовний виклик хука: React зламається саме тоді, коли стаття довантажиться.
   */
  useJsonLd('article', a && a !== 'loading' ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': url + '#article',
        headline: a.title,
        description: a.description,
        inLanguage: 'uk',
        datePublished: a.published,
        dateModified: a.updated || a.published,
        keywords: a.keywords.join(', '),
        articleSection: CATEGORY_LABEL[a.category],
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        author: { '@type': 'Organization', name: 'WEEXP', url: ORIGIN + '/' },
        publisher: { '@type': 'Organization', name: 'WEEXP', url: ORIGIN + '/' },
      },
      {
        '@type': 'FAQPage',
        '@id': url + '#faq',
        mainEntity: a.faq.map((f) => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Головна', item: ORIGIN + '/' },
          { '@type': 'ListItem', position: 2, name: 'Блог', item: ORIGIN + '/blog' },
          { '@type': 'ListItem', position: 3, name: a.title, item: url },
        ],
      },
    ],
  } : {});

  if (a === 'loading') return <section className="sysx blogp"><div className="blogp-in"><p className="mono">{t('Завантаження…', 'Loading…')}</p></div></section>;
  if (!a) return <SystemNotFound />;

  const related = relatedTo(a.slug);
  const date = (s: string) =>
    new Date(s).toLocaleDateString(lang === 'en' ? 'en-GB' : 'uk-UA', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <article className="sysx blogp">
      <div className="blogp-in">
        <nav className="blogp-crumbs mono" aria-label={t('Хлібні крихти', 'Breadcrumbs')}>
          <Link to={lp('/')}>{t('Головна', 'Home')}</Link> <span aria-hidden="true">→</span>{' '}
          <Link to={lp('/blog')}>{t('Блог', 'Blog')}</Link> <span aria-hidden="true">→</span>{' '}
          <Link to={lp('/blog?c=' + a.category)}>{CATEGORY_LABEL[a.category]}</Link>
        </nav>

        <header className="blogp-head">
          <h1 className="sysx-display blogp-h1">{a.title}</h1>
          <div className="blogp-meta mono">
            <time dateTime={a.published}>{date(a.published)}</time>
            <i aria-hidden="true" />
            <span>{a.readMin} {t('хв читання', 'min read')}</span>
            {a.updated && <><i aria-hidden="true" /><span>{t('оновлено', 'updated')} {date(a.updated)}</span></>}
          </div>
          {/* Тексти поки лише українською — сказати це чесно на вході дешевше,
              ніж дати англомовному читачеві дійти до третього абзацу. */}
          {lang === 'en' && <p className="blogp-lang mono">This article is available in Ukrainian only.</p>}
        </header>

        {/* Пряма відповідь — до змісту й до тіла. */}
        <div className="blogp-answer">
          <span className="sysx-kick">{t('Коротко', 'In short')}</span>
          <p>{a.answer}</p>
        </div>

        <p className="blogp-lead">{a.lead}</p>

        {a.sections.length > 2 && (
          <nav className="blogp-toc" aria-label={t('Зміст статті', 'Table of contents')}>
            <span className="sysx-kick">{t('У статті', 'In this article')}</span>
            <ol>
              {a.sections.map((s, i) => (
                <li key={s.h}><a href={`#s${i + 1}`}>{s.h}</a></li>
              ))}
            </ol>
          </nav>
        )}

        <div className="blogp-body">
          {a.sections.map((s, i) => <Section key={s.h} s={s} n={i + 1} />)}
        </div>

        {!!a.takeaway.length && (
          <div className="blogp-take">
            <h2 className="sysx-display blogp-h2">{t('Головне', 'Key points')}</h2>
            <ul>{a.takeaway.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}

        {!!a.faq.length && (
          <section className="blogp-faq">
            <h2 className="sysx-display blogp-h2">{t('Часті питання', 'FAQ')}</h2>
            {a.faq.map((f) => (
              <details key={f.q} className="blogp-faq-i">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>
        )}

        {/* Куди веде стаття. Блог існує заради цього переходу. */}
        {!!a.pages.length && (
          <section className="blogp-next">
            <span className="sysx-kick">{t('Що з цим робити', 'What to do next')}</span>
            <div className="blogp-next-row">
              {a.pages.slice(0, 3).map((p) => (
                <Link key={p} to={lp(p)} className="sysx-cta is-wrap">{pageLabel(p, lang)} →</Link>
              ))}
              <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            </div>
          </section>
        )}

        {!!related.length && (
          <section className="blogp-rel">
            <h2 className="sysx-display blogp-h2">{t('Читати далі', 'Read next')}</h2>
            <ul className="blogp-rel-list">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link to={lp('/blog/' + r.slug)}>
                    <b>{r.title}</b>
                    <span>{r.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

function Section({ s, n }: { s: BlogSection; n: number }) {
  return (
    <section className="blogp-sec" id={`s${n}`}>
      <h2 className="sysx-display blogp-h2">{s.h}</h2>
      {s.p?.map((x) => <p key={x.slice(0, 40)}>{x}</p>)}
      {s.list && <ul className="blogp-ul">{s.list.map((x) => <li key={x.slice(0, 40)}>{x}</li>)}</ul>}
      {s.steps && <ol className="blogp-ol">{s.steps.map((x) => <li key={x.slice(0, 40)}>{x}</li>)}</ol>}
      {s.table && (
        // Таблиця в окремому контейнері зі скролом: на телефоні вона ширша за
        // екран, і без цього вся сторінка починає їхати вбік.
        <div className="blogp-tw">
          <table className="blogp-t">
            <thead><tr>{s.table[0].map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{s.table.slice(1).map((row) => (
              <tr key={row.join('|')}>{row.map((c) => <td key={c}>{c}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {s.note && <p className="blogp-note">{s.note}</p>}
    </section>
  );
}

/**
 * Людська назва сторінки для кнопки.
 *
 * Перша версія прикрашала слуг: '/systems/commercial-performance' ставало
 * «Commercial performance» — англійською, на українській сторінці, та ще й на
 * 24px ширше за кнопку на екрані 320px. Тепер назва береться з lib/nav — того
 * самого переліку, яким підписані меню, підвал і хлібні крихти, — тож підпис
 * кнопки не може розійтися з назвою сторінки, на яку вона веде.
 */
export function pageLabel(path: string, lang: 'uk' | 'en' = 'uk'): string {
  return nameOf(path, lang) || path;
}
