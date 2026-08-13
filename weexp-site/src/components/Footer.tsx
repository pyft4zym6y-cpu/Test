import { Link } from 'react-router-dom';
import './footer.css';

/** Інженерна карта системи замість звичайного футера. */
const MAP: { h: string; links: { to: string; label: string; ext?: boolean }[] }[] = [
  { h: 'Будуємо', links: [
    { to: '/what-we-build#diagnose', label: 'Діагностика' },
    { to: '/what-we-build#build', label: 'Побудова' },
    { to: '/what-we-build#scale', label: 'Масштабування' },
    { to: '/what-we-build#independence', label: 'Незалежність' },
  ]},
  { h: 'Діагностика', links: [
    { to: '/diagnose', label: 'Business X-Ray' },
    { to: '/diagnose/full', label: 'Повна діагностика' },
    { to: '/cases', label: 'Кейси' },
  ]},
  { h: 'Агенція', links: [
    { to: '/about', label: 'Про WEEXP' },
    { to: '/about/founder', label: 'Засновник' },
    { to: '/about#team', label: 'Команда' },
  ]},
  { h: 'Правове', links: [
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
          <Link to="/diagnose" className="ft-diagnose mono">Діагностувати бізнес →</Link>
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
