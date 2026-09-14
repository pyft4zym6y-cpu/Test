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
/*
 * Кнопка внизу веде на заявку — на обох сторінках, де стоїть блок.
 *
 * Був прапорець `cta`: на головній блок вів у калькулятор, на діагностиці — у
 * заявку. Логіка була «спершу порахуй, потім пиши», але вона розсинхронізована
 * з тим, що відбувається в голові в людини, яка ЩОЙНО впізнала свій симптом.
 * У цю секунду в неї не питання «скільки я втрачаю» — вона вже це відчуває, —
 * а «ви таке лагодили?». На це відповідає розмова, а не калькулятор.
 */
export function Symptoms({ compact = false }: {
  compact?: boolean;
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
            {t('Що зараз відбувається', 'What is happening')}{' '}<br className="br-wide" />
            <span className="sysx-em">{t('з вашим e-commerce', 'to your e-commerce')}</span>?
          </h2>
          {/* Лід стоїть на ОБОХ сторінках. Доти на головній його ховав
              compact — і блок починався одразу вісьмома репліками, без рядка,
              який пояснює, чому вони в одному списку. */}
          <p className="sysx-lead symp-lead">
            {t(
              'Більшість проблем не виникає в одному місці. Вони накопичуються між стратегією, сайтом, маркетингом, клієнтським досвідом, операціями та даними.',
              /* Двокрапка з переліком, а не «between X, Y, Z»: заміряно девʼять
                 формулювань на семи ширинах — усі інші лишали на 540px
                 останній рядок у 14–21% міри («and data.»), це єдине, що не
                 падає нижче 40% ніде. Український варіант такої проблеми не
                 має: там слова довші й рядки лягають інакше. */
              'Most problems do not appear in one place. They build up in the gaps: strategy, the site, marketing, customer experience, operations, data.',
            )}
          </p>
        </header>

        <ol className="symp-grid">
          {items.map((s) => (
            <li key={s.systemTitle} className="symp-card">
              <p className="symp-say">«{s.say}»</p>
              {/* Причина стоїть НАД поясненням: спершу людина бачить, де
                  шукати, і аж потім читає абзац. Доти абзац ішов першим, і
                  назва причини діставалась тому, хто дочитав. */}
              <div className="symp-links">
                {/* Причина — текст, а не посилання: сторінок систем більше
                    немає. Людина має зрозуміти, ЩО зламалось; купує вона
                    аудит, який це й знаходить. */}
                <span className="symp-where mono">
                  {t('Причина', 'Cause')}: {s.systemTitle}
                </span>
                {/* compact тепер ховає РІВНО ОДНЕ: перелік експертиз. На
                    головній вони мають власний блок вище, і повторювати їх у
                    кожній із восьми карток означало б третій раз назвати те
                    саме на одному екрані. */}
                {!compact && (
                  <span className="symp-fix mono">
                    {t('Лагодимо', 'We fix it with')}:{' '}
                    {s.fix.map((f, i) => (
                      <span key={f.path}>
                        {i > 0 && ' · '}
                        <Link to={lp(f.path)}>{f.title}</Link>
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <p className="symp-mean">{s.mean}</p>
            </li>
          ))}
        </ol>

        {/*
          * Фінал блоку — впізнавання, а не перелік. Людина щойно прочитала
          * вісім чужих реплік; питання в її голові вже не «що у вас є», а «це
          * справді про мене?». Спершу відповідаємо на нього, і лише потім
          * просимо про крок.
          *
          * Дві дії, а не одна: заявка — головна, аудит — для тих, хто вже
          * знає, що хоче діагноз, а не знайомство. Слово «або» між ними стоїть
          * окремим рядком, щоб дві кнопки не читались як пара рівних.
          */}
        <footer className="symp-foot">
          <h3 className="symp-foot-h">{t('Впізнали себе?', 'Recognise yourself?')}</h3>
          <p className="symp-foot-p">
            {t(
              'Це не окремі проблеми. Це сигнали, що певна частина вашої e-commerce системи працює не на повну силу.',
              'These are not separate problems. They are signals that some part of your e-commerce system is not working at full strength.',
            )}
          </p>
          <p className="symp-foot-p">
            {t(
              'Ми допомагаємо знайти першопричину, визначити пріоритети та перетворити хаотичні точки втрат на зрозумілий план зростання.',
              'We help find the root cause, set the priorities and turn scattered points of loss into a clear growth plan.',
            )}
          </p>
          <div className="symp-foot-act">
            <Link to={lp('/contact')} className="sysx-cta is-primary">
              {t('Знайти точки росту', 'Find your growth points')} →
            </Link>
            <span className="symp-or mono">{t('або', 'or')}</span>
            <Link to={lp('/services/audit')} className="sysx-cta">
              {t('Замовити комплексний аудит', 'Order a full-scope audit')} →
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
}
