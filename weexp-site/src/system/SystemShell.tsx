import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import './system.css';

/**
 * Оболонка cinematic-напряму: тонка світла шапка (десктоп) + app-подібна
 * навігація на мобільному — напівпрозора нижня панель із ключовими сторінками
 * (іконки) та класичний бургер, що відкриває повне меню. Fixed-overlay, аби
 * липкі WebGL-сцени під нею жили як є.
 */
const LINKS = [
  { to: '/', label: 'Система' },
  { to: '/systems', label: '8 систем' },
  { to: '/proof', label: 'Докази' },
  { to: '/expansion', label: 'Експансія' },
  { to: '/people', label: 'Люди' },
  { to: '/loss', label: 'Калькулятор' },
  { to: '/contact', label: 'Контакт' },
];

const I = {
  home: 'M3 11.2 12 4l9 7.2M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  calc: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 11h2M12 11h2M8 15h2M12 15h2',
  chat: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  menu: 'M4 7h16M4 12h16M4 17h16',
};
const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

// Ключові сторінки для нижньої панелі (як таб-бар у застосунку).
const TABS = [
  { to: '/', label: 'Система', icon: I.home },
  { to: '/systems', label: 'Системи', icon: I.grid },
  { to: '/loss', label: 'Калькулятор', icon: I.calc },
  { to: '/contact', label: 'Контакт', icon: I.chat },
];

export function SystemShell() {
  const nav = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => nav.current?.classList.toggle('is-solid', scrollY > 12);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);   // закриваємо меню при переході
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <div className="sysh">
      <header ref={nav} className="sysh-nav">
        <Link to="/" className="sysh-brand"><b>WEEXP</b><span className="mono">system</span></Link>
        <nav className="sysh-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => 'sysh-link mono' + (isActive ? ' is-on' : '')}>{l.label}</NavLink>
          ))}
        </nav>
        <Link to="/diagnose" className="sysh-cta mono">Діагностика →</Link>
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

      <Outlet />
    </div>
  );
}
