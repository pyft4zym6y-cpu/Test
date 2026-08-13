import { Link } from 'react-router-dom';
import './founder-page.css';

const LAYERS = [
  { k: 'BUILD', t: 'Що побудував', d: 'E-commerce для брендів Forbes TOP-250 UA, вихід на 14 країн, кейси з обігом до €900K і ×18 за 18 місяців. 8+ років у міжнародному e-commerce (US, EU, MENA).' },
  { k: 'THINK', t: 'Як думає', d: 'Бізнес має працювати як система, а не триматися на герої. Діагноз — у грошах. Найдорожча помилка — плутати активність із результатом.' },
  { k: 'CHALLENGE', t: 'З чим не згоден', d: '«Більше бюджету → більше продажів» — міф. Купувати увагу без системи означає щоразу купувати клієнта наново. Правда дорожча за комфорт.' },
  { k: 'FUTURE', t: 'Яким бачить e-commerce', d: 'Незалежні бізнеси, що вимірюють зрілість через Independence Score, а не лише оборот. Стандарт незалежності — майбутня категорія ринку.' },
];

/** /about/founder — Павло як автор смислу, але не єдине джерело цінності. BUILD/THINK/CHALLENGE/FUTURE. */
export function FounderPage() {
  return (
    <article className="fp">
      <header className="page-head">
        <div className="wrap">
          <span className="page-kick">Founder & Architect of WEEXP</span>
          <h1 className="fp-quote">Я будую бізнеси, які можуть<br />працювати без героя.</h1>
          <p className="page-lead"><b>Павло Сидоренко</b> — архітектор, що перетворив досвід у міжнародному
            e-commerce на систему. WEEXP доводить — Павло пояснює.</p>
        </div>
      </header>

      <section className="wrap fp-layers">
        {LAYERS.map((l) => (
          <div key={l.k} className="fp-layer">
            <span className="fp-layer-k mono">{l.k}</span>
            <div className="fp-layer-body">
              <span className="fp-layer-t">{l.t}</span>
              <p className="fp-layer-d">{l.d}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="wrap fp-contact">
        <p className="fp-contact-lead">Павло — автор системи, а не сама система. Цінність WEEXP — у команді й методі.</p>
        <div className="home-cta-row">
          <a href="https://www.linkedin.com/in/pvsidorenko" target="_blank" rel="noopener noreferrer" className="btn-ghost mono">LinkedIn →</a>
          <Link to="/about" className="btn-ghost mono">Про WEEXP →</Link>
          <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
        </div>
      </section>
    </article>
  );
}
