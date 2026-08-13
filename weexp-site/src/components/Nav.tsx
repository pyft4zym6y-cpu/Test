import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import './nav.css';

type Sub = { to: string; label: string };
type Group = { to: string; label: string; sub?: Sub[] };

const MENU: Group[] = [
  { to: '/what-we-build', label: 'What we build', sub: [
    { to: '/what-we-build#diagnose', label: 'Diagnose' },
    { to: '/what-we-build#build', label: 'Build' },
    { to: '/what-we-build#scale', label: 'Scale' },
    { to: '/what-we-build#independence', label: 'Independence' },
  ]},
  { to: '/how-it-works', label: 'How it works', sub: [
    { to: '/how-it-works', label: 'WEEXP Method' },
    { to: '/how-it-works/business-health', label: 'Business Health' },
    { to: '/how-it-works/independence-score', label: 'Independence Score' },
  ]},
  { to: '/cases', label: 'Cases' },
  { to: '/intelligence', label: 'Intelligence' },
  { to: '/about', label: 'About', sub: [
    { to: '/about', label: 'WEEXP' },
    { to: '/about/founder', label: 'Founder' },
  ]},
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.5);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav className={`nav${solid ? ' is-solid' : ''}${open ? ' is-open' : ''}`}>
      <div className="wrap nav-inner">
        <Link className="nav-logo" to="/" aria-label="WEEXP — головна">WEEXP</Link>
        <div className="nav-links mono">
          {MENU.map((g) => (
            <div key={g.to} className="nav-item">
              <NavLink to={g.to} className={({ isActive }) => (isActive ? 'is-here' : undefined)}>{g.label}</NavLink>
              {g.sub && (
                <div className="nav-drop">
                  {g.sub.map((s) => <Link key={s.label} to={s.to}>{s.label}</Link>)}
                </div>
              )}
            </div>
          ))}
        </div>
        <Link className="nav-cta mono" to="/diagnose">Diagnose →</Link>
        <button className={`nav-burger${open ? ' is-x' : ''}`} type="button" aria-label="Меню"
          aria-expanded={open} onClick={() => setOpen((o) => !o)}><span /><span /></button>
      </div>
      <div className="nav-drawer">
        {MENU.map((g) => (
          <div key={g.to} className="nav-drawer-group">
            <NavLink to={g.to} className="mono nav-drawer-top">{g.label}</NavLink>
            {g.sub && <div className="nav-drawer-sub mono">{g.sub.map((s) => <Link key={s.label} to={s.to}>{s.label}</Link>)}</div>}
          </div>
        ))}
        <Link to="/diagnose" className="nav-drawer-cta mono">Діагностувати бізнес →</Link>
      </div>
    </nav>
  );
}
