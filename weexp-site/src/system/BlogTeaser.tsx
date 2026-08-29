import { Link, useLocation } from 'react-router-dom';
import { useLp, useLang, useT, stripLang } from '@/i18n';
import { articlesFor } from '@/data/blog';
import './blog.css';

/**
 * Блок статей на сторінці сайту.
 *
 * Не «схоже» й не «останнє»: статті привʼязані до сторінки явно, полем `pages`
 * у самій статті. Звʼязок двобічний — стаття зобовʼязана посилатись назад на ті
 * самі сторінки (за цим стежить тест). Інакше блок швидко стає стрічкою
 * випадкового, яку ніхто не читає, а внутрішня перелінковка — фікцією.
 *
 * Шлях беремо з адреси й чистимо від мовного префікса: на /en/pricing блок має
 * знайти статті, привʼязані до /pricing, а не шукати неіснуючий ключ.
 *
 * Поки блог тільки українською, на /en він не показується: вести англомовного
 * читача на український лонгрид гірше, ніж не показати нічого.
 */
export function BlogTeaser({ path, title, limit = 5 }: {
  path?: string; title?: string; limit?: number;
}) {
  const { pathname } = useLocation();
  const lp = useLp();
  const lang = useLang();
  const t = useT();
  const heading = title ?? t('Статті по темі', 'Related reading');
  const here = path ?? (stripLang(pathname) || '/');
  const items = articlesFor(here, limit);

  if (lang === 'en' || !items.length) return null;

  return (
    <section className="sysx blogt" aria-label={heading}>
      <div className="blogt-in">
        <header className="blogt-head">
          <span className="sysx-kick">{t('Блог', 'Blog')}</span>
          <h2 className="sysx-display blogt-h">{heading}</h2>
          <Link to={lp('/blog')} className="blogt-all mono">{t('Усі статті', 'All articles')} →</Link>
        </header>
        <ol className="blogt-list">
          {items.map((a) => (
            <li key={a.slug}>
              <Link to={lp('/blog/' + a.slug)} className="blogt-i">
                <b className="blogt-i-h">{a.title}</b>
                <span className="blogt-i-d">{a.description}</span>
                <span className="blogt-i-m mono">{a.readMin} {t('хв', 'min')}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
