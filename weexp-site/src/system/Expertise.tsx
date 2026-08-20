import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { applySeo } from '@/lib/seo';
import { EXPERTISES, L, expertiseBySlug } from '@/system/expertises';
import './system.css';

/**
 * Підсторінка експертизи /expansion/:slug. Дані з expertises.ts. SEO ставиться
 * тут (як у ServicePage), бо шлях динамічний. Бруталіст-верстка + reveal.
 */
export function Expertise() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const e = expertiseBySlug(slug);
  if (!e) return <Navigate to={lp('/expansion')} replace />;

  const idx = EXPERTISES.findIndex((x) => x.slug === e.slug);
  const prev = EXPERTISES[(idx - 1 + EXPERTISES.length) % EXPERTISES.length];
  const next = EXPERTISES[(idx + 1) % EXPERTISES.length];
  applySeo(`${L(e.title, lang)} — ${t('експертиза WEEXP', 'WEEXP expertise')}`, L(e.intro, lang), pathname);

  return (
    <section className="sysx xp2">
      <div className="sysx-field" aria-hidden="true" />
      <div className="xp2-in">
        <Link to={lp('/expansion')} className="xp2-back mono">← {t('Експансія', 'Expansion')}</Link>

        <header className="xp2-head">
          <span className="sysx-kick">{L(e.tag, lang)}</span>
          <h1 className="sysx-display xp2-h1">{L(e.title, lang)}</h1>
          <span className="script xp2-script">{L(e.tagline, lang)}</span>
          <p className="sysx-lead xp2-intro">{L(e.intro, lang)}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/contact')} className="sysx-cta is-primary">{t('Обговорити проєкт', 'Discuss the project')} →</Link>
            <Link to={lp('/diagnose')} className="sysx-cta">Express Audit →</Link>
          </div>
        </header>

        <div className="xp2-sec">
          <span className="sysx-kick">{t('Що входить', 'What’s included')}</span>
          <div className="xp2-serv">
            {e.services.map((s) => (
              <div key={s.name[0]} className="xp2-serv-i">
                <b>{L(s.name, lang)}</b>
                <span>{L(s.desc, lang)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xp2-two">
          <div className="xp2-sec">
            <span className="sysx-kick">{t('Що ви отримаєте', 'What you get')}</span>
            <ul className="xp2-deliv">
              {e.deliverables.map((d) => <li key={d[0]}>{L(d, lang)}</li>)}
            </ul>
          </div>
          <div className="xp2-sec xp2-outcome">
            <span className="sysx-kick">{t('Результат', 'Outcome')}</span>
            <p className="sysx-display xp2-outcome-t">{L(e.outcome, lang)}</p>
          </div>
        </div>

        <div className="xp2-sec">
          <span className="sysx-kick">{t('Як працюємо', 'How we work')}</span>
          <div className="xp2-proc">
            {e.process.map((p, i) => (
              <div key={p.t[0]} className="xp2-proc-i">
                <i className="xp2-proc-n mono">{String(i + 1).padStart(2, '0')}</i>
                <b>{L(p.t, lang)}</b>
                <span>{L(p.d, lang)}</span>
              </div>
            ))}
          </div>
        </div>

        <nav className="xp2-nav">
          <Link to={lp(`/expansion/${prev.slug}`)} className="xp2-sib">← {L(prev.title, lang)}</Link>
          <Link to={lp(`/expansion/${next.slug}`)} className="xp2-sib xp2-sib-r">{L(next.title, lang)} →</Link>
        </nav>
      </div>
    </section>
  );
}
