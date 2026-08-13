import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Team } from '@/components/Team';
import './about.css';

const EXISTS = [
  { k: 'Problem', d: 'E-commerce часто тримається на героях — на власнику, який усе тягне на собі.' },
  { k: 'Belief', d: 'Бізнес має працювати як система, а не як щоденний подвиг.' },
  { k: 'Method', d: 'SEE → BUILD → SCALE → INDEPENDENCE. Діагноз у грошах, потім побудова.' },
  { k: 'Proof', d: 'Кейси й дані — не обіцянки. Зміна стану, зведена з CRM, ERP і GA4.' },
  { k: 'Ambition', d: 'Стандарт незалежності e-commerce як категорія ринку.' },
];

const WHY = [
  { n: '01', t: 'Ми ставимо діагноз у грошах.' },
  { n: '02', t: 'Ми будуємо, а не радимо.' },
  { n: '03', t: 'Ми вимірюємо зміну стану.' },
  { n: '04', t: 'Ми будуємо так, щоб піти.' },
];

const FIT = ['у вас уже є бізнес', 'є traction', 'є проблема масштабування', 'власник став bottleneck', 'потрібен новий рівень системи'];
const NOFIT = ['потрібен лише сайт', 'потрібен лише таргет', 'потрібен лише SEO', 'потрібен виконавець окремих задач', 'шукаєте «агентство подешевше»'];

const DONT = [
  'Ми не продаємо години.',
  'Ми не даємо рекомендації заради рекомендацій.',
  'Ми не будуємо залежність від себе.',
  'Ми не маскуємо відсутність результату звітами.',
  'Ми не беремось за задачу без економічного сенсу.',
];

/** /about — не «динамічна команда», а WHY WEEXP EXISTS + відстройка бренду. */
export function About() {
  return (
    <>
      <PageHead
        kicker="Розділ · About"
        title={<>Чому WEEXP<br />взагалі існує</>}
        lead={<>Без корпоративної води. Ми існуємо, щоб бізнеси перестали триматися на героях
          і почали працювати як <b>система</b>.</>}
      />

      <section className="wrap ab-exists">
        {EXISTS.map((e) => (
          <div key={e.k} className="ab-exists-row">
            <span className="ab-exists-k mono">{e.k}</span>
            <span className="ab-exists-d">{e.d}</span>
          </div>
        ))}
      </section>

      <section className="wrap ab-why">
        <span className="page-kick">Why WEEXP · чотири докази</span>
        <div className="ab-why-grid">
          {WHY.map((w) => (
            <div key={w.n} className="ab-why-item">
              <span className="ab-why-n mono">{w.n}</span>
              <span className="ab-why-t">{w.t}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap ab-fit">
        <h2 className="ab-h2">Is WEEXP for you?</h2>
        <div className="ab-fit-cols">
          <div className="ab-fit-col ab-fit-col--yes">
            <span className="ab-fit-k mono">Ми підходимо, якщо</span>
            <ul>{FIT.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
          <div className="ab-fit-col ab-fit-col--no">
            <span className="ab-fit-k mono">Ми не підходимо, якщо</span>
            <ul>{NOFIT.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
        </div>
        <p className="ab-fit-note mono">Правда дорожча за комфорт.</p>
      </section>

      <section className="wrap ab-dont">
        <span className="page-kick">What we don’t do</span>
        <div className="ab-dont-list">
          {DONT.map((d) => <div key={d} className="ab-dont-item">{d}</div>)}
        </div>
      </section>

      <Team />

      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Павло — автор смислу. Але цінність WEEXP — у системі й команді.</p>
          <div className="home-cta-row">
            <Link to="/about/founder" className="btn-ghost mono">Про засновника →</Link>
            <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
