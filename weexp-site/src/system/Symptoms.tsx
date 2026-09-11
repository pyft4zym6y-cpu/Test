import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { symptomsFor } from '@/data/symptoms';
import './symptoms.css';

/**
 * «Що зараз відбувається з вашим e-commerce» — другий екран після героя.
 *
 * Це вхід у сайт з боку клієнта. Перший рівень — не назва системи, а те, як
 * власник описує проблему вголос; назва системи стоїть нижче, як відповідь на
 * питання «де це живе». Доти сайт починав з таксономії: людина бачила
 * «Комерційна ефективність» і мусила сама здогадатись, що це про неї.
 *
 * Кожна картка замикає той самий ланцюг: симптом → де причина → чим лагодимо.
 * Тому вісім систем лишаються видимими навіть після того, як пішли з меню:
 * сюди й веде єдиний шлях до них з головної.
 */
export function Symptoms({ compact = false, cta = 'diagnose' }: {
  compact?: boolean;
  /** Куди веде кнопка внизу. На самій діагностиці посилання на неї ж марне. */
  cta?: 'diagnose' | 'contact';
}) {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const items = symptomsFor(lang);

  return (
    <section className="sysx symp" aria-labelledby="symp-h">
      <div className="symp-in">
        <header className="symp-head">
          <span className="sysx-kick">{t('З чого починається розмова', 'Where the conversation starts')}</span>
          <h2 id="symp-h" className="sysx-display symp-h">
            {t('Що зараз відбувається', 'What is happening')}<br />
            <span className="sysx-em">{t('з вашим e-commerce', 'to your e-commerce')}</span>?
          </h2>
          {!compact && (
            <p className="sysx-lead symp-lead">
              {t(
                'Оберіть те, що звучить знайомо. Під кожним симптомом — система, у якій лежить причина, і те, чим ми її лагодимо.',
                'Pick the one that sounds familiar. Under each symptom is the system where the cause sits, and what we fix it with.',
              )}
            </p>
          )}
        </header>

        <ol className="symp-grid">
          {items.map((s) => (
            <li key={s.systemPath} className="symp-card">
              <p className="symp-say">«{s.say}»</p>
              <p className="symp-mean">{s.mean}</p>
              <div className="symp-links">
                <Link to={lp(s.systemPath)} className="symp-where mono">
                  {t('Причина', 'Cause')}: {s.systemTitle} →
                </Link>
                <span className="symp-fix mono">
                  {t('Лагодимо', 'We fix it with')}:{' '}
                  {s.fix.map((f, i) => (
                    <span key={f.path}>
                      {i > 0 && ' · '}
                      <Link to={lp(f.path)}>{f.title}</Link>
                    </span>
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ol>

        <footer className="symp-foot">
          {/* Підписи канонічні. Свої формулювання тут були б шостою назвою
              для діагностики й другою для контакту — рівно те, від чого сайт
              уже одного разу лікували: одна дія має одне імʼя на всьому сайті.
              Контекст «не впізнали себе» несе рядок поруч, а не кнопка. */}
          <span className="symp-ask">
            {cta === 'diagnose'
              ? t('Не впізнали свій випадок?', 'None of these sound familiar?')
              : t('Хочете розібрати свій випадок?', 'Want your own case looked at?')}
          </span>
          {cta === 'diagnose' ? (
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">
              {t('Порахувати витік', 'Calculate the leak')} →
            </Link>
          ) : (
            <Link to={lp('/contact')} className="sysx-cta is-primary">
              {t('Залишити заявку', 'Leave a request')} →
            </Link>
          )}
          {/* Єдине посилання на оглядову сторінку восьми систем: у меню її
              більше немає, і без цього рядка вона лишилась би сиротою. */}
          <Link to={lp('/systems')} className="symp-all mono">
            {t('Вісім систем однією картою', 'The eight systems as one map')} →
          </Link>
        </footer>
      </div>
    </section>
  );
}
