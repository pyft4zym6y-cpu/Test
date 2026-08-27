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
// Shopify Partner — вмикається ПІСЛЯ реєстрації в partners.shopify.com (безкоштовно, миттєво).
// Текстовий бейдж «Shopify Partner» за бренд-гайдами дозволено партнерам. Не заявляти до факту.
const SHOPIFY_PARTNER = false;
// Сертифікати (HubSpot / Google Skillshop тощо) — додати запис після складання іспиту.
// href = публічне посилання на сертифікат (перевіряється клієнтом). icon — емодзі.
const CERT_BADGES: { icon: string; label: string; href: string }[] = [
  // { icon: '🎓', label: 'HubSpot Certified', href: 'https://app.hubspot.com/academy/...' },
  // { icon: '📊', label: 'Google Analytics Certified', href: 'https://skillshop.exceedlms.com/...' },
];

export function SiteFooter() {
  const year = 2026;
  const t = useT();
  const lp = useLp();
  /*
   * Тут вантажився helper DMCA — сторонній скрипт із images.dmca.com на КОЖНІЙ
   * сторінці заради значка в підвалі. Коментар вище двадцятьма рядками при
   * цьому обіцяв рівно протилежне: «статичний бейдж, без зовнішнього
   * helper-скрипта → CSP не чіпаємо». Код казав одне, коментар інше.
   *
   * Скрипт прибрано: він єдиний ламав Content-Security-Policy, а натомість
   * давав чужому домену право виконувати будь-що на нашому походженні —
   * дорого за значок. Значок лишається посиланням-картинкою нижче: він і
   * веде на сторінку статусу, де перевірка й відбувається.
   */
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
            <a href="/cookies.html">{t('Cookie', 'Cookies')}</a>
            <a href="/oferta.html">{t('Оферта', 'Terms')}</a>
          </span>
        </div>
      </div>
      <div className="sfoot-trust mono">
        <span className="sfoot-trust-i">🇺🇦 {t('Зроблено в Україні', 'Made in Ukraine')}</span>
        <span className="sfoot-trust-i">⚡ {t('Відповідь ≤ 1 робочого дня', 'Reply ≤ 1 business day')}</span>
        <span className="sfoot-trust-i">🔒 {t('SSL / захищене зʼєднання', 'SSL / secure connection')}</span>
        <span className="sfoot-trust-i">🇪🇺 GDPR-ready</span>
        {SHOPIFY_PARTNER && <a className="sfoot-trust-i sfoot-trust-a" href="https://www.shopify.com/partners" target="_blank" rel="noopener noreferrer" title="Shopify Partner">🛍 Shopify Partner <i aria-hidden="true">↗</i></a>}
        {CERT_BADGES.map((c) => <a key={c.label} className="sfoot-trust-i sfoot-trust-a" href={c.href} target="_blank" rel="noopener noreferrer" title={c.label}>{c.icon} {c.label} <i aria-hidden="true">↗</i></a>)}
        <a className="sfoot-trust-i sfoot-trust-a" href="https://securityheaders.com/?q=https%3A%2F%2Fweexp.agency&followRedirects=on" target="_blank" rel="noopener noreferrer" title="Security Headers scan">🛡 {t('Security Headers', 'Security Headers')} <i aria-hidden="true">↗</i></a>
      </div>
      <div className="sfoot-bottom mono">
        <span>© {year} WEEXP</span>
        {DMCA_ID && (
          <a href={`https://www.dmca.com/Protection/Status.aspx?ID=${DMCA_ID}`} target="_blank" rel="noopener noreferrer"
            title="DMCA.com Protection Status" className="sfoot-dmca dmca-badge">
            <img src={`https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=${DMCA_ID}`} alt="DMCA.com Protection Status" width="121" height="20" loading="lazy" />
          </a>
        )}
      </div>
    </footer>
  );
}
