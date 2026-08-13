import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import { Magnetic } from '@/lib/interactions';
import './nav.css';

type Sub = { to: string; label: string };
type Group = { to: string; label: string; sub?: Sub[] };

const MENU: Group[] = [
  { to: '/challenges', label: 'Виклики', sub: SYSTEMS.map((s) => ({ to: `/challenges/${s.slug}`, label: `${s.num} · ${s.title}` })) },
  { to: '/what-we-build', label: 'Що будуємо', sub: [
    { to: '/what-we-build#diagnose', label: 'Діагностика' },
    { to: '/what-we-build#build', label: 'Побудова' },
    { to: '/what-we-build#scale', label: 'Масштабування' },
    { to: '/what-we-build#independence', label: 'Незалежність' },
    { to: '/what-we-build/eu-expansion', label: 'Вихід у ЄС' },
  ]},
  { to: '/cases', label: 'Кейси' },
  { to: '/about', label: 'Агенція', sub: [
    { to: '/about', label: 'Про WEEXP' },
    { to: '/about/founder', label: 'Засновник' },
    { to: '/about#team', label: 'Команда' },
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
        <Magnetic strength={0.5} className="nav-cta-mag"><Link className="nav-cta mono" to="/diagnose">Калькулятор →</Link></Magnetic>
        <button className={`nav-burger${open ? ' is-x' : ''}`} type="button" aria-label="Меню"
          aria-expanded={open} onClick={() => setOpen((o) => !o)}><span /><span /></button>
      </div>
      <div className="nav-drawer">
        <Link to="/diagnose" className="nav-drawer-cta mono">Знайти bottleneck · калькулятор →</Link>
        {MENU.map((g) => (
          <NavLink key={g.to} to={g.to} className="mono nav-drawer-top">{g.label}</NavLink>
        ))}
        <a href="/oferta.html" className="mono nav-drawer-legal">Оферта · Приватність</a>
      </div>
    </nav>
  );
}
