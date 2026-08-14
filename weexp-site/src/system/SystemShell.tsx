import { useEffect, useRef } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import './system.css';

/**
 * Оболонка нового cinematic-напряму: тонка світла шапка, що зшиває превʼю-фільми
 * (/system · /systems · /proof · /loss) в один продукт. Fixed-overlay, аби липкі
 * WebGL-сцени під нею жили як є; на скролі «застигає» у frosted-стан. Живий
 * (темний) сайт лишається під власним Layout — ця оболонка його не чіпає.
 */
const LINKS = [
  { to: '/', label: 'Система' },
  { to: '/systems', label: '7 систем' },
  { to: '/proof', label: 'Докази' },
  { to: '/people', label: 'Люди' },
  { to: '/loss', label: 'Калькулятор' },
];

export function SystemShell() {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => nav.current?.classList.toggle('is-solid', scrollY > 12);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

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
      </header>
      <Outlet />
    </div>
  );
}
