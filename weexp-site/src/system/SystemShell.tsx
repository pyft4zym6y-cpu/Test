import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { SiteFooter } from '@/system/SiteFooter';
import { RouteBreadcrumbs } from '@/system/Breadcrumbs';
import './system.css';

/**
 * Оболонка cinematic-напряму: тонка світла шапка (десктоп) + app-подібна
 * навігація на мобільному — напівпрозора нижня панель із ключовими сторінками
 * (іконки) та класичний бургер, що відкриває повне меню. Fixed-overlay, аби
 * липкі WebGL-сцени під нею жили як є.
 */
// «Кабінет» свідомо не в меню: він представлений іконкою-акаунтом у шапці,
// щоб не дублювати вхід. LINKS — і для десктоп-навігації, і для мобільного меню.
const LINKS = [
  { to: '/', label: 'Система' },
  { to: '/proof', label: 'Докази' },
  { to: '/expansion', label: 'Експансія' },
  { to: '/people', label: 'Команда' },
  { to: '/diagnose', label: 'Діагностика' },
  { to: '/contact', label: 'Контакт' },
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

// Ключові сторінки для нижньої панелі (як таб-бар у застосунку).
const TABS = [
  { to: '/', label: 'Система', icon: I.home },
  { to: '/people', label: 'Команда', icon: I.people },
  { to: '/diagnose', label: 'Діагностика', icon: I.calc },
  { to: '/contact', label: 'Контакт', icon: I.chat },
];

export function SystemShell() {
  const nav = useRef<HTMLElement>(null);
  const sentinel = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Шапка: на головній (кінематографічний герой) — прозора вгорі, суцільна на скролі
  // (через IntersectionObserver). На всіх інших сторінках — ЗАВЖДИ суцільна, інакше
  // charcoal-лінки нечитабельні на тлі контенту (контраст ~1.5:1).
  useEffect(() => {
    const el = sentinel.current, navEl = nav.current; if (!el || !navEl) return;
    if (pathname !== '/') { navEl.classList.add('is-solid'); return; }
    navEl.classList.remove('is-solid');
    const io = new IntersectionObserver(
      ([e]) => navEl.classList.toggle('is-solid', !e.isIntersecting),
      { rootMargin: '-12px 0px 0px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);
  useEffect(() => { setOpen(false); }, [pathname]);   // закриваємо меню при переході
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <div className="sysh">
      <span ref={sentinel} className="sysh-sentinel" aria-hidden="true" />
      <header ref={nav} className="sysh-nav">
        <Link to="/" className="sysh-brand"><b>WEEXP</b><span className="mono">system</span></Link>
        <nav className="sysh-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => 'sysh-link mono' + (isActive ? ' is-on' : '')}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="sysh-right">
          <Link to="/cabinet" className={'sysh-account' + (isActive('/cabinet') ? ' is-on' : '')} aria-label="Особистий кабінет" title="Кабінет"><Icon d={I.user} /></Link>
          <Link to="/diagnose" className="sysh-cta mono">Діагностика →</Link>
        </div>
        <button className="sysh-burger" aria-label="Меню" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <Icon d={I.menu} />
        </button>
      </header>

      {/* Повне меню (мобільне) — напівпрозорий оверлей */}
      <div className={`sysh-sheet${open ? ' is-open' : ''}`} role="dialog" aria-label="Меню" aria-hidden={!open}>
        <div className="sysh-sheet-in">
          <div className="sysh-sheet-head">
            <span className="mono">Меню</span>
            <button className="sysh-sheet-x mono" onClick={() => setOpen(false)} aria-label="Закрити">✕</button>
          </div>
          <nav className="sysh-sheet-links">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={`sysh-sheet-link${isActive(l.to) ? ' is-on' : ''}`}>{l.label}</Link>
            ))}
          </nav>
          <Link to="/diagnose" className="sysx-cta is-primary sysh-sheet-cta">Безкоштовна діагностика →</Link>
        </div>
      </div>

      {/* App-подібна нижня панель (мобільна) — ключові сторінки іконками + бургер */}
      <nav className="sysh-tabs" aria-label="Швидка навігація">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} className={`sysh-tab${isActive(t.to) ? ' is-on' : ''}`}>
            <Icon d={t.icon} /><span>{t.label}</span>
          </Link>
        ))}
        <button className={`sysh-tab sysh-tab-more${open ? ' is-on' : ''}`} onClick={() => setOpen((v) => !v)} aria-label="Ще">
          <Icon d={I.menu} /><span>Меню</span>
        </button>
      </nav>

      <RouteBreadcrumbs />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
