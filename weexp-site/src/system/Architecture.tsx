import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { ARCHITECTURE } from '@/data/architecture';
import './system.css';

/**
 * «Як це влаштовано» — один ланцюг рівнів пропозиції на головній.
 *
 * Стоїть одразу після інтерактивного розбору восьми систем: людина щойно
 * побачила, ЩО ми будуємо, і наступне питання — хто це робить, як заходимо і
 * чим міряємо. Раніше відповіді лежали на трьох різних сторінках, між якими з
 * головної не було шляху, і кожна виглядала окремим каталогом послуг.
 *
 * Числа беруться з ARCHITECTURE, який рахує їх із тих самих даних, що живлять
 * сторінки: заголовок блоку не може пообіцяти інше число, ніж покаже сторінка.
 */
export function Architecture() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const L = (pair: [string, string]) => (lang === 'en' ? pair[1] : pair[0]);

  return (
    <section className="arch sysx" aria-label={t('Як влаштована пропозиція WEEXP', 'How the WEEXP offer is built')}>
      <div className="arch-in">
        <header className="arch-head">
          <span className="sysx-kick">{t('Як це влаштовано', 'How it is built')}</span>
          <h2 className="sysx-display arch-h">
            {t('Ми продаємо не послуги —', 'We do not sell services —')}<br />
            <span className="sysx-em">{t('одну керовану систему', 'one managed system')}</span>
          </h2>
          <p className="arch-lead">
            {t('Чотири рівні, які тримаються разом: що будуємо, хто будує, як заходимо і чим міряємо результат. Кожен рівень — окрема сторінка з деталями.',
               'Four levels that hold together: what we build, who builds it, how we come in and how we measure the result. Each level has its own page with the detail.')}
          </p>
        </header>

        <ol className="arch-grid">
          {ARCHITECTURE.map((l) => (
            <li key={l.key}>
              <Link to={lp(l.to)} className="arch-card">
                <span className="arch-count sysx-display">{l.count}</span>
                <span className="arch-title">{L(l.title)}</span>
                <span className="arch-q mono">{L(l.question)}</span>
                <p className="arch-body">{L(l.body)}</p>
                <span className="arch-more mono">{t('Детальніше', 'Learn more')} →</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
