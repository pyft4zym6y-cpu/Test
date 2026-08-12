import { useEffect, useState } from 'react';
import './nav.css';

const LINKS = [
  { id: 'system', label: 'Система' },
  { id: 'cases', label: 'Кейси' },
  { id: 'calc', label: 'Розрив' },
  { id: 'contact', label: 'Контакт' },
];

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const l = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__lenis;
  if (l) l.scrollTo(el, { offset: -20 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  const nav = (id: string) => { setOpen(false); goTo(id); };
  return (
    <nav className={`nav${solid ? ' is-solid' : ''}${open ? ' is-open' : ''}`}>
      <div className="wrap nav-inner">
        <button className="nav-logo" type="button" onClick={() => goTo('top')}>WEEXP</button>
        <div className="nav-links mono">
          {LINKS.map((l) => <button key={l.id} type="button" onClick={() => nav(l.id)}>{l.label}</button>)}
        </div>
        <button className="nav-cta mono" type="button" onClick={() => nav('contact')}>Діагноз →</button>
        <button className={`nav-burger${open ? ' is-x' : ''}`} type="button" aria-label="Меню" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
      <div className="nav-drawer">
        {LINKS.map((l) => <button key={l.id} type="button" className="mono" onClick={() => nav(l.id)}>{l.label}</button>)}
        <button type="button" className="nav-drawer-cta mono" onClick={() => nav('contact')}>Поставити діагноз →</button>
      </div>
    </nav>
  );
}
