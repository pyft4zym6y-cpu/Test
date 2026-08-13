import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import './standard.css';

const NOW = [
  { t: 'Independence Score', d: 'Робоча метрика зрілості 0–100. Уже вимірюємо.' },
  { t: 'Business Health', d: '18 доменів у 5 системах. Уже вимірюємо.' },
  { t: 'Maturity model', d: '5 рівнів від Хаосу до Незалежності. Уже описано.' },
];
const FUTURE = [
  'Industry Benchmark — середній рівень для компаній вашого масштабу',
  'Certification — підтвердження незалежності бізнесу',
  'Reports — публічні дослідження ринку',
  'Partner ecosystem — мережа партнерів стандарту',
];

/** /about/standard — інституційна територія, що будується. Чесно: ще не визнаний ринком стандарт. */
export function StandardPage() {
  return (
    <>
      <PageHead
        kicker="Територія, що будується"
        title={<>WEEXP<br />Standard</>}
        lead={<>Як виглядає незалежний e-commerce-бізнес? Ми будуємо <b>стандарт незалежності</b> —
          і не вдаємо, що ринок його вже визнав. Це чесно позначена амбіція.</>}
      />
      <section className="wrap st-cols">
        <div className="st-col">
          <span className="page-kick">Уже працює</span>
          <div className="st-list">
            {NOW.map((n) => (
              <div key={n.t} className="st-item">
                <span className="st-item-t">{n.t}</span>
                <span className="st-item-d">{n.d}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="st-col">
          <span className="page-kick">У майбутньому</span>
          <ul className="st-future">
            {FUTURE.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <span className="st-note mono">Поки це не інституція, а напрям. Ми будуємо його публічно.</span>
        </div>
      </section>
      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Почніть із власного Independence Score.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Пройти X-Ray →</Link>
            <Link to="/diagnose" className="btn-ghost mono">Як рахується →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
