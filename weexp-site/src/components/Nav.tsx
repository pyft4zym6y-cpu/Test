import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import './nav.css';

const LINKS = [
  { to: '/os', label: 'Commerce OS' },
  { to: '/services', label: 'Співпраця' },
  { to: '/cases', label: 'Кейси' },
  { to: '/about', label: 'Агенція' },
  { to: '/diagnostics', label: 'Діагностика' },
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  // закрыть drawer при смене маршрута
  useEffect(() => { setOpen(false); }, [pathname]);

  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-here' : undefined);

  return (
    <nav className={`nav${solid ? ' is-solid' : ''}${open ? ' is-open' : ''}`}>
      <div className="wrap nav-inner">
        <Link className="nav-logo" to="/" aria-label="WEEXP — головна">WEEXP</Link>
        <div className="nav-links mono">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>
          ))}
        </div>
        <Link className="nav-cta mono" to="/contact">Діагноз →</Link>
        <button className={`nav-burger${open ? ' is-x' : ''}`} type="button" aria-label="Меню"
          aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
      <div className="nav-drawer">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} className={`mono ${cls({ isActive: pathname === l.to }) || ''}`}>{l.label}</NavLink>
        ))}
        <Link to="/contact" className="nav-drawer-cta mono">Поставити діагноз →</Link>
      </div>
    </nav>
  );
}
