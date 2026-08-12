import { goTo } from '@/lib/scroll';
import './footer.css';

const NAV = [
  { id: 'system', label: 'Система' },
  { id: 'cases', label: 'Кейси' },
  { id: 'calc', label: 'Розрив' },
  { id: 'contact', label: 'Контакт' },
];

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap ft-grid">
        <div className="ft-brand">
          <button className="ft-logo" type="button" onClick={() => goTo('top')}>WEEXP</button>
          <p className="ft-tag">Операційний партнер з e-commerce. Система замість героїзму.</p>
          <a className="ft-mail mono" href="mailto:pashasidorenko18@gmail.com">pashasidorenko18@gmail.com</a>
        </div>
        <nav className="ft-col">
          <span className="ft-h mono">Навігація</span>
          {NAV.map((l) => <button key={l.id} type="button" onClick={() => goTo(l.id)}>{l.label}</button>)}
        </nav>
        <nav className="ft-col">
          <span className="ft-h mono">Правове</span>
          <a href="/oferta.html">Публічна оферта</a>
          <a href="/privacy.html">Політика приватності</a>
        </nav>
        <div className="ft-col">
          <span className="ft-h mono">Ринки</span>
          <span className="ft-meta mono">UA · EU · US</span>
          <span className="ft-meta mono">$0.5–10M обіг</span>
        </div>
      </div>
      <div className="wrap ft-bottom mono">
        <span>© 2026 WEEXP</span>
        <span>Зроблено як система, а не як лендинг</span>
      </div>
    </footer>
  );
}
