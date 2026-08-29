import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { SYSTEMS, localizeSystem } from '@/data/xray';
import './system.css';

/**
 * /systems — перелік восьми частин системи зростання.
 *
 * Сторінки /systems/:slug існували, але адреса /systems була редиректом на
 * якір головної, і в кільце восьми сторінок не входило нічого: кожна
 * посилалась лише на дві сусідні. Тепер у них є батьківська сторінка, пункт
 * меню й хлібна крихта — тобто нормальний шлях, а не тільки пошук.
 *
 * Тексти беруться з тієї самої моделі (data/xray.ts), що живить діагностику й
 * звіти: перелік на сайті й перелік у продукті не можуть розійтись.
 *
 * Мова йде через localizeSystem, а не через ручний вибір поля. Тут стояло
 * `lang === 'en' ? s.en : s.title` — заголовок перекладався, а цитата й
 * обіцянка бралися з UA-полів, хоч англійський оверлей SYS_EN уже існував і
 * застосовувався на /systems/:slug. Механізм був написаний і не підключений:
 * англійський хаб показував англійський заголовок з українською цитатою під ним.
 */
export function SystemsHub() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();

  return (
    <section className="sysx syshub">
      <span className="sysx-field" aria-hidden="true" />
      <div className="syshub-in">
        <header className="syshub-head">
          <span className="sysx-kick">{t('Система зростання · вісім частин', 'The growth system · eight parts')}</span>
          <h1 className="sysx-display syshub-h1">
            {t('Система сильна настільки, ', 'A system is only as strong ')}
            <span className="sysx-em">{t('наскільки сильна найслабша частина', 'as its weakest part')}</span>
          </h1>
          <p className="sysx-lead">
            {t('Онлайн-продажі — не набір каналів, а вісім систем, які працюють разом. Виторг витікає там, де найслабша. Нижче — кожна: що вона вирішує і як ми її будуємо.',
               'Online sales are not a set of channels but eight systems working together. Revenue leaks where the weakest one is. Below — each of them: what it solves and how we build it.')}
          </p>
        </header>

        <ol className="syshub-grid">
          {SYSTEMS.map((raw) => localizeSystem(raw, lang)).map((s) => (
            <li key={s.key}>
              <Link to={lp(`/systems/${s.slug}`)} className="syshub-card">
                <span className="syshub-n mono">{s.num}</span>
                <h2 className="sysx-display syshub-card-h">{s.title}</h2>
                <p className="syshub-feel">«{s.feel}»</p>
                <p className="syshub-idea">{s.bigIdea}</p>
                <span className="syshub-doms mono">{s.domains.length} {t('доменів діагностики', 'diagnostic domains')}</span>
                <span className="syshub-more mono">{t('Детальніше', 'Learn more')} →</span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="syshub-cta">
          <div>
            <span className="sysx-kick">{t('Яка з восьми ваша слабка ланка?', 'Which of the eight is your weak link?')}</span>
            <b className="sysx-display syshub-cta-h">
              {t('Express Audit рахує це ', 'The Express Audit answers that ')}
              <span className="hl-y">{t('за 2 хвилини', 'in 2 minutes')}</span>
            </b>
          </div>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/proof')} className="sysx-cta">{t('Наші перемоги', 'Our wins')} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
