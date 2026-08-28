import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { EXPERTISES, L } from '@/system/expertises';
import './system.css';

/**
 * Хаб «Експансія» — перелік фокусних експертиз WEEXP. Кожна веде на свою
 * підсторінку /expansion/:slug. Бруталіст-картки, скрол-reveal.
 */
export function ExpansionHub() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  return (
    <section className="sysx xhub">
      <div className="sysx-field" aria-hidden="true" />
      <div className="xhub-in">
        <header className="xhub-head">
          <span className="sysx-kick">{t('Екосистема партнерів WEEXP', 'WEEXP partner ecosystem')}</span>
          <h1 className="sysx-display xhub-h1">{t('Екосистема ', 'Partner ')}<span className="hl">{t('партнерів', 'ecosystem')}</span></h1>
          <p className="sysx-lead">{t('Вам не потрібно самостійно шукати, перевіряти й порівнювати десятки виконавців. Ми вже сформували перевірену мережу лідерів ринку в ключових напрямах — і під конкретну задачу підбираємо найсильніших, синхронізуючи їхню роботу з вашими цілями в єдиній системі. Ви отримуєте доступ до перевіреної експертизи, а не ще одну рекомендацію підрядника.', 'You don\'t need to search for, vet and compare dozens of contractors yourself. We\'ve already built a trusted network of market leaders across the key areas — and for each task we pick the strongest, syncing their work to your goals within one system. You get access to proven expertise, not just another contractor referral.')}</p>
          <p className="xhub-arch">{t('Зверху екосистеми — WEEXP: ', 'On top of the ecosystem — WEEXP: ')}<b>E-commerce Architecture &amp; Management</b>. {t('Ми визначаємо, що, навіщо, у якій послідовності та з яким партнером робити, — а перевірена мережа закриває конкретні компетенції.', 'We define what, why, in what order and with which partner to do it — while the vetted network closes the specific competencies.')}</p>
        </header>

        <div className="xhub-grid">
          {EXPERTISES.map((e, i) => (
            <Link key={e.slug} to={lp(`/expansion/${e.slug}`)} className="xhub-card">
              <span className="xhub-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="xhub-tag">{L(e.tag, lang)}</span>
              <h2 className="sysx-display xhub-card-h">{L(e.title, lang)}</h2>
              <span className="script xhub-script">{L(e.tagline, lang)}</span>
              {/* Спершу задача власника, потім наш опис. Без цього рядка блок
                  читається як перелік послуг, з якого клієнт має сам здогадатись,
                  навіщо це йому. */}
              <p className="xhub-job">{L(e.job, lang)}</p>
              <p className="xhub-card-p">{L(e.intro, lang)}</p>
              <span className="xhub-more">{t('Детальніше', 'Learn more')} →</span>
            </Link>
          ))}
        </div>

        <div className="xhub-cta">
          <div>
            <span className="sysx-kick">{t('Не знаєте, з чого почати?', 'Not sure where to start?')}</span>
            <b className="sysx-display xhub-cta-h">{t('Почніть з ', 'Start with ')}<span className="hl-y">Express Audit</span></b>
          </div>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
