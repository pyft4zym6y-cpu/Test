import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { SiteFooter } from '@/system/SiteFooter';
import { CookieConsent } from '@/system/CookieConsent';
import { RouteBreadcrumbs } from '@/system/Breadcrumbs';
import { useT, useLp, useLang, stripLang } from '@/i18n';
import './system.css';

/**
 * Оболонка cinematic-напряму: тонка світла шапка (десктоп) + app-подібна
 * навігація на мобільному. Двомовна: посилання префіксуються /en у EN-режимі,
 * підписи — через t(). Перемикач мов веде на той самий маршрут іншою мовою.
 */
const LINKS = [
  { to: '/', uk: 'Система', en: 'System' },
  { to: '/proof', uk: 'Наші перемоги', en: 'Our wins' },
  { to: '/expansion', uk: 'Експансія', en: 'Expansion' },
  { to: '/people', uk: 'Про нас', en: 'About' },
  { to: '/diagnose', uk: 'Express audit', en: 'Express audit' },
  { to: '/pricing', uk: 'Початок співпраці', en: 'Get started' },
  { to: '/contact', uk: 'Контакт', en: 'Contact' },
];

const I = {
  home: 'M3 11.2 12 4l9 7.2M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  people: 'M17 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H7.4A3.4 3.4 0 0 0 4 18.4V20M10.5 11.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M20 20v-1.6a3.4 3.4 0 0 0-2.6-3.3M15.5 5.2a3.2 3.2 0 0 1 0 6.1',
  calc: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 11h2M12 11h2M8 15h2M12 15h2',
  chat: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  user: 'M20 21v-1.8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V21M12 11.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  menu: 'M4 7h16M4 12h16M4 17h16',
};
const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const TABS = [
  { to: '/', uk: 'Система', en: 'System', icon: I.home },
  { to: '/people', uk: 'Про нас', en: 'About', icon: I.people },
  { to: '/diagnose', uk: 'Express audit', en: 'Express audit', icon: I.calc },
  { to: '/contact', uk: 'Контакт', en: 'Contact', icon: I.chat },
];

export function SystemShell() {
  const nav = useRef<HTMLElement>(null);
  const sentinel = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const base = stripLang(pathname);           // маршрут без /en — для активного стану/перемикача
  const enHref = base === '/' ? '/en' : '/en' + base;

  useEffect(() => {
    const el = sentinel.current, navEl = nav.current; if (!el || !navEl) return;
    if (base !== '/') { navEl.classList.add('is-solid'); return; }
    navEl.classList.remove('is-solid');
    const io = new IntersectionObserver(
      ([e]) => navEl.classList.toggle('is-solid', !e.isIntersecting),
      { rootMargin: '-12px 0px 0px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [base]);
  useEffect(() => { setOpen(false); }, [pathname]);
  const isActive = (to: string) => (to === '/' ? base === '/' : base.startsWith(to));

  const LangToggle = ({ className = '' }: { className?: string }) => (
    <div className={'sysh-lang mono ' + className} role="group" aria-label="Мова / Language">
      <Link to={base} className={'sysh-lang-o' + (lang === 'uk' ? ' is-on' : '')} aria-current={lang === 'uk'} hrefLang="uk">UA</Link>
      <span aria-hidden="true">/</span>
      <Link to={enHref} className={'sysh-lang-o' + (lang === 'en' ? ' is-on' : '')} aria-current={lang === 'en'} hrefLang="en">EN</Link>
    </div>
  );

  return (
    <div className="sysh">
      <a href="#main-content" className="skip-link">{t('Перейти до вмісту', 'Skip to content')}</a>
      <ReadingProgress />
      <span ref={sentinel} className="sysh-sentinel" aria-hidden="true" />
      <header ref={nav} className="sysh-nav">
        <Link to={lp('/')} className="sysh-brand"><b>WEEXP</b><span className="mono">system</span></Link>
        <nav className="sysh-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={lp(l.to)} end={l.to === '/'} className={({ isActive }) => 'sysh-link mono' + (isActive ? ' is-on' : '')}>{t(l.uk, l.en)}</NavLink>
          ))}
        </nav>
        <div className="sysh-right">
          <LangToggle />
          <Link to={lp('/cabinet')} className={'sysh-account' + (isActive('/cabinet') ? ' is-on' : '')} aria-label={t('Особистий кабінет', 'Client cabinet')} title={t('Кабінет', 'Cabinet')}><Icon d={I.user} /></Link>
          <Link to={lp('/diagnose')} className="sysh-cta mono">Express audit →</Link>
        </div>
        <button className="sysh-burger" aria-label={t('Меню', 'Menu')} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <Icon d={I.menu} />
        </button>
      </header>

      {/* Повне меню (мобільне) */}
      <div className={`sysh-sheet${open ? ' is-open' : ''}`} role="dialog" aria-label={t('Меню', 'Menu')} aria-hidden={!open}>
        <div className="sysh-sheet-in">
          <div className="sysh-sheet-head">
            <span className="mono">{t('Меню', 'Menu')}</span>
            <button className="sysh-sheet-x mono" onClick={() => setOpen(false)} aria-label={t('Закрити', 'Close')}>✕</button>
          </div>
          <nav className="sysh-sheet-links">
            {LINKS.map((l) => (
              <Link key={l.to} to={lp(l.to)} className={`sysh-sheet-link${isActive(l.to) ? ' is-on' : ''}`}>{t(l.uk, l.en)}</Link>
            ))}
          </nav>
          <LangToggle className="sysh-sheet-lang" />
          <Link to={lp('/diagnose')} className="sysx-cta is-primary sysh-sheet-cta">{t('Безкоштовна діагностика', 'Free diagnostics')} →</Link>
        </div>
      </div>

      {/* Нижня панель (мобільна) */}
      <nav className="sysh-tabs" aria-label={t('Швидка навігація', 'Quick navigation')}>
        {TABS.map((tb) => (
          <Link key={tb.to} to={lp(tb.to)} className={`sysh-tab${isActive(tb.to) ? ' is-on' : ''}`}>
            <Icon d={tb.icon} /><span>{t(tb.uk, tb.en)}</span>
          </Link>
        ))}
        <button className={`sysh-tab sysh-tab-more${open ? ' is-on' : ''}`} onClick={() => setOpen((v) => !v)} aria-label={t('Ще', 'More')}>
          <Icon d={I.menu} /><span>{t('Меню', 'Menu')}</span>
        </button>
      </nav>

      <RouteBreadcrumbs />
      <div id="main-content" tabIndex={-1}><Outlet /></div>
      <SiteFooter />
      <CookieConsent />
      <BackToTop />
    </div>
  );
}

/** Кнопка «нагору» — зʼявляється після прокрутки, над мобільною таб-панеллю. */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button className="back-top" aria-label="Нагору" title="Нагору" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
  );
}

/** Тонка смуга прогресу читання зверху сторінки (оновлюється на скролі). */
function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setP(h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  return <div className="read-prog" aria-hidden="true"><span style={{ transform: `scaleX(${p / 100})` }} /></div>;
}
