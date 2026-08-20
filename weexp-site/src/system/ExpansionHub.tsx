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
          <span className="sysx-kick">{t('Експертизи WEEXP', 'WEEXP expertise')}</span>
          <h1 className="sysx-display xhub-h1">{t('Фокусні ', 'Focused ')}<span className="hl">{t('експертизи', 'expertise')}</span></h1>
          <p className="sysx-lead">{t('Кожен напрям — зі своєю командою партнерів і результатом під вашу задачу. Ми не подаємо все як «внутрішню команду на всё»: під конкретні задачі залучаємо перевірених партнерів і лідерів ринку, кожен відповідає за свою експертизу.', 'Each practice has its own team of partners and an outcome for your task. We don\'t pass everything off as an «in-house team for everything»: for specific tasks we bring in vetted partners and market leaders — each accountable for their expertise.')}</p>
        </header>

        <div className="xhub-grid">
          {EXPERTISES.map((e, i) => (
            <Link key={e.slug} to={lp(`/expansion/${e.slug}`)} className="xhub-card">
              <span className="xhub-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="xhub-tag">{L(e.tag, lang)}</span>
              <h2 className="sysx-display xhub-card-h">{L(e.title, lang)}</h2>
              <span className="script xhub-script">{L(e.tagline, lang)}</span>
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
