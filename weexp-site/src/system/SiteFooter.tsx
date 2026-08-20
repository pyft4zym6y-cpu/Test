import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import './system.css';

/** Мікропідвал сайту — на всіх сторінках (під контентом у SystemShell). Двомовний. */
const NAV = [
  { to: '/', uk: 'Система', en: 'System' },
  { to: '/diagnose', uk: 'Діагностика', en: 'Diagnostics' },
  { to: '/pricing', uk: 'Формати та ціни', en: 'Pricing' },
  { to: '/proof', uk: 'Докази', en: 'Proof' },
  { to: '/expansion', uk: 'Експансія', en: 'Expansion' },
  { to: '/people', uk: 'Команда', en: 'Team' },
  { to: '/cabinet', uk: 'Кабінет', en: 'Cabinet' },
  { to: '/contact', uk: 'Контакт', en: 'Contact' },
];
const MAIL = 'hello@weexp.agency';

export function SiteFooter() {
  const year = 2026;
  const t = useT();
  const lp = useLp();
  return (
    <footer className="sfoot sysx">
      <div className="sfoot-in">
        <div className="sfoot-brand">
          <b>WEEXP</b>
          <span className="sfoot-tag">{t('Система замість героїзму', 'A system instead of heroics')}</span>
        </div>
        <div className="sfoot-school">
          <span className="sfoot-school-l">{t('Освітній напрям', 'Education')}</span>
          <a href="https://school.weexp.agency/" target="_blank" rel="noopener noreferrer" className="sfoot-school-a">
            Commerce Architecture · {t('Школа', 'School')} <i aria-hidden="true">↗</i>
          </a>
          <span className="sfoot-school-d">{t('Від новачка до E-Commerce Director', 'From beginner to E-Commerce Director')}</span>
        </div>
        <nav className="sfoot-nav" aria-label={t('Підвал', 'Footer')}>
          {NAV.map((l) => <Link key={l.to} to={lp(l.to)} className="sfoot-link">{t(l.uk, l.en)}</Link>)}
        </nav>
        <div className="sfoot-meta mono">
          <a href={`mailto:${MAIL}`} className="sfoot-mail">{MAIL}</a>
          <span className="sfoot-legal">
            <a href="/privacy.html">{t('Політика', 'Privacy')}</a>
            <a href="/oferta.html">{t('Оферта', 'Terms')}</a>
          </span>
        </div>
      </div>
      <div className="sfoot-bottom mono">
        <span>© {year} WEEXP</span>
      </div>
    </footer>
  );
}
