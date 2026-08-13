import { Link } from 'react-router-dom';
import './footer.css';

/** Інженерна карта системи замість звичайного футера. */
const MAP: { h: string; links: { to: string; label: string; ext?: boolean }[] }[] = [
  { h: 'Build', links: [
    { to: '/what-we-build#diagnose', label: 'Diagnose' },
    { to: '/what-we-build#build', label: 'Build' },
    { to: '/what-we-build#scale', label: 'Scale' },
    { to: '/what-we-build#independence', label: 'Independence' },
  ]},
  { h: 'System', links: [
    { to: '/how-it-works', label: 'WEEXP Method' },
    { to: '/how-it-works/business-health', label: 'Business Health' },
    { to: '/how-it-works/independence-score', label: 'Independence Score' },
    { to: '/how-it-works/benchmark', label: 'Benchmark' },
  ]},
  { h: 'Proof', links: [
    { to: '/cases', label: 'Cases' },
    { to: '/intelligence', label: 'Intelligence' },
  ]},
  { h: 'People', links: [
    { to: '/about', label: 'WEEXP' },
    { to: '/about/founder', label: 'Founder' },
    { to: '/about/standard', label: 'WEEXP Standard' },
  ]},
  { h: 'Legal', links: [
    { to: '/oferta.html', label: 'Публічна оферта', ext: true },
    { to: '/privacy.html', label: 'Політика приватності', ext: true },
  ]},
];

export function Footer() {
  return (
    <footer className="ft" id="site-footer">
      <div className="wrap ft-grid">
        <div className="ft-brand">
          <Link className="ft-logo" to="/">WEEXP</Link>
          <p className="ft-tag">Операційний партнер з e-commerce.</p>
          <a className="ft-mail mono" href="mailto:pashasidorenko18@gmail.com">pashasidorenko18@gmail.com</a>
          <Link to="/diagnose" className="ft-diagnose mono">Diagnose your business →</Link>
        </div>
        {MAP.map((col) => (
          <nav key={col.h} className="ft-col">
            <span className="ft-h mono">{col.h}</span>
            {col.links.map((l) => l.ext
              ? <a key={l.label} href={l.to}>{l.label}</a>
              : <Link key={l.label} to={l.to}>{l.label}</Link>)}
          </nav>
        ))}
      </div>
      <div className="wrap ft-bottom">
        <span className="ft-slogan">Система замість героїзму.</span>
        <span className="mono">© 2026 WEEXP · UA · EU · US</span>
      </div>
    </footer>
  );
}
