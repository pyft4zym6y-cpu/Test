import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { HealthRadar } from '@/components/HealthRadar';
import { SYSTEMS } from '@/data/xray';
import './score-page.css';

// Демо-зріз (приклад), щоб показати формат результату.
const DEMO = [
  { key: 'acq', title: 'Залучення', score: 62 },
  { key: 'conv', title: 'Конверсія', score: 41 },
  { key: 'ret', title: 'Утримання', score: 28 },
  { key: 'ops', title: 'Операції', score: 73 },
  { key: 'data', title: 'Дані', score: 55 },
];

/** /how-it-works/business-health — 18 доменів у 5 системах + демо-радар. Lead magnet. */
export function BusinessHealthPage() {
  return (
    <>
      <PageHead
        kicker="Метрика · Business Health"
        title={<>Наскільки здоровий<br />ваш e-commerce</>}
        lead={<>Ми оцінюємо <b>18 доменів</b> у 5 системах бізнесу — від залучення до фінансів —
          і зводимо в один показник здоров’я 0–100.</>}
      />

      <section className="wrap bh-demo">
        <div className="bh-demo-radar">
          <span className="page-kick">Приклад зрізу · Business Health 51/100</span>
          <HealthRadar systems={DEMO} />
        </div>
        <div className="bh-systems">
          {SYSTEMS.map((s) => (
            <div key={s.key} className="bh-system">
              <span className="bh-system-t mono">{s.title}</span>
              <div className="bh-domains">
                {s.domains.map((d) => <span key={d.key} className="bh-domain">{d.label}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Отримайте власний зріз здоров’я — безкоштовно.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Пройти X-Ray →</Link>
            <Link to="/how-it-works/independence-score" className="btn-ghost mono">Independence Score →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
