import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import './system.css';

/** Мікропідвал сайту — на всіх сторінках (під контентом у SystemShell). Двомовний. */
// Тримаємо в синхроні з головним меню (SystemShell): ті самі назви й порядок.
const NAV = [
  { to: '/', uk: 'Система', en: 'System' },
  { to: '/proof', uk: 'Наші перемоги', en: 'Our wins' },
  { to: '/expansion', uk: 'Експансія', en: 'Expansion' },
  { to: '/people', uk: 'Про нас', en: 'About' },
  { to: '/diagnose', uk: 'Express audit', en: 'Express audit' },
  { to: '/pricing', uk: 'Початок співпраці', en: 'Get started' },
  { to: '/contact', uk: 'Контакт', en: 'Contact' },
  { to: '/cabinet', uk: 'Кабінет', en: 'Cabinet' },
];
const MAIL = 'hello@weexp.agency';
// DMCA Protection Badge — ID з dmca.com (статичний бейдж, без зовнішнього helper-скрипта → CSP не чіпаємо).
const DMCA_ID = '715d145d-fa76-4b19-a69c-9143c8af7f20';

export function SiteFooter() {
  const year = 2026;
  const t = useT();
  const lp = useLp();
  // Helper DMCA реєструє адресу сторінки в dmca.com → сканування → статус «Protected».
  useEffect(() => {
    if (!DMCA_ID || document.getElementById('dmca-badge-helper')) return;
    const s = document.createElement('script');
    s.id = 'dmca-badge-helper'; s.src = 'https://images.dmca.com/Badges/DMCABadgeHelper.min.js'; s.async = true;
    document.body.appendChild(s);
  }, []);
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
        {DMCA_ID && (
          <a href={`https://www.dmca.com/Protection/Status.aspx?ID=${DMCA_ID}`} target="_blank" rel="noopener noreferrer"
            title="DMCA.com Protection Status" className="sfoot-dmca dmca-badge">
            <img src={`https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=${DMCA_ID}`} alt="DMCA.com Protection Status" height="20" loading="lazy" />
          </a>
        )}
      </div>
    </footer>
  );
}
