import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { HealthRadar } from '@/components/HealthRadar';
import { SYSTEMS } from '@/data/xray';
import './score-page.css';

// Демо-зріз (приклад результату) по 7 системах.
const DEMO = [
  { key: 'strategy', title: 'Стратегія', score: 64 },
  { key: 'commercial', title: 'Комерція', score: 48 },
  { key: 'customer', title: 'Клієнт', score: 71 },
  { key: 'experience', title: 'Досвід', score: 53 },
  { key: 'operations', title: 'Операції', score: 36 },
  { key: 'data', title: 'Дані', score: 42 },
  { key: 'org', title: 'Організація', score: 39 },
];

/** /how-it-works/business-health — 7 систем × 15 доменів + демо-радар з bottleneck. */
export function BusinessHealthPage() {
  return (
    <>
      <PageHead
        kicker="Метрика · Business Health"
        title={<>Наскільки здорова ваша<br />система онлайн-продажів</>}
        lead={<>Ми оцінюємо <b>7 систем бізнесу</b> і 15 діагностичних доменів — від стратегії до
          організації — і зводимо в один показник здоров’я 0–100 з головним вузьким місцем.</>}
      />

      <section className="wrap bh-demo">
        <div className="bh-demo-radar">
          <span className="page-kick">Приклад · Business Health 50/100 · bottleneck: Операції</span>
          <HealthRadar systems={DEMO} />
        </div>
        <div className="bh-systems">
          {SYSTEMS.map((s) => (
            <div key={s.key} className="bh-system">
              <span className="bh-system-t mono">{s.num} · {s.title}</span>
              <div className="bh-domains">
                {s.domains.map((d) => <span key={d} className="bh-domain">{d}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Отримайте власний зріз і знайдіть головний bottleneck.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Пройти X-Ray →</Link>
            <Link to="/challenges" className="btn-ghost mono">7 систем бізнесу →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
