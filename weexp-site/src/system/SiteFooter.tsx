import { Link } from 'react-router-dom';
import './system.css';

/**
 * Мікропідвал сайту — на всіх сторінках (під контентом у SystemShell). Компактна
 * навігація, контакт, юридичні лінки та мітка збірки (__BUILD_TIME__) — щоб було
 * видно, що деплой застосувався.
 */
const NAV = [
  { to: '/', label: 'Система' },
  { to: '/diagnose', label: 'Діагностика' },
  { to: '/pricing', label: 'Формати та ціни' },
  { to: '/proof', label: 'Докази' },
  { to: '/expansion', label: 'Експансія' },
  { to: '/people', label: 'Команда' },
  { to: '/cabinet', label: 'Кабінет' },
  { to: '/contact', label: 'Контакт' },
];
const MAIL = 'hello@weexp.agency';

export function SiteFooter() {
  const year = 2026; // без Date() у рантаймі; оновлюється зі збіркою за потреби
  return (
    <footer className="sfoot sysx">
      <div className="sfoot-in">
        <div className="sfoot-brand">
          <b>WEEXP</b>
          <span className="sfoot-tag">Система замість героїзму</span>
        </div>
        <div className="sfoot-school">
          <span className="sfoot-school-l">Освітній напрям</span>
          <a href="https://school.weexp.agency/" target="_blank" rel="noopener noreferrer" className="sfoot-school-a">
            Commerce Architecture · Школа <i aria-hidden="true">↗</i>
          </a>
          <span className="sfoot-school-d">Від новачка до E-Commerce Director</span>
        </div>
        <nav className="sfoot-nav" aria-label="Підвал">
          {NAV.map((l) => <Link key={l.to} to={l.to} className="sfoot-link">{l.label}</Link>)}
        </nav>
        <div className="sfoot-meta mono">
          <a href={`mailto:${MAIL}`} className="sfoot-mail">{MAIL}</a>
          <span className="sfoot-legal">
            <a href="/privacy.html">Політика</a>
            <a href="/oferta.html">Оферта</a>
          </span>
        </div>
      </div>
      <div className="sfoot-bottom mono">
        <span>© {year} WEEXP</span>
      </div>
    </footer>
  );
}
