import { CountUp } from '@/lib/primitives';
import './global-reach.css';

const MARKETS = ['UA', 'PL', 'DE', 'FR', 'ES', 'IT', 'NL', 'UK', 'US', 'CY', 'AE'];
const STATS = [
  { n: 14, suf: '', l: 'країн у портфелі' },
  { n: 3, suf: '', l: 'континенти: EU · US · MENA' },
  { n: 6, suf: '', l: 'ринків ЄС в одному кейсі' },
];

/** Міжнародний вектор — пафосна смуга. Не локальне агентство, а партнер для виходу у світ. */
export function GlobalReach() {
  return (
    <section className="gr" data-say="Ми будуємо e-commerce, який виходить за кордон — від України до США і MENA.">
      <div className="wrap gr-in">
        <div className="gr-copy">
          <span className="page-kick">Global · US · EU · MENA</span>
          <h2 className="gr-h">Built to<br /><span className="mk">cross borders</span></h2>
          <p className="gr-lead">Ми не локальне агентство. Ми — операційний партнер для українських
            виробників і D2C-брендів, що виходять на <b>світові ринки</b>: від першого €1 до системи на кількох континентах.</p>
          <div className="gr-markets mono">
            {MARKETS.map((m) => <span key={m} className="gr-market">{m}</span>)}
          </div>
        </div>
        <div className="gr-stats">
          {STATS.map((s) => (
            <div key={s.l} className="gr-stat">
              <span className="gr-stat-n"><CountUp to={s.n} />{s.suf}</span>
              <span className="gr-stat-l">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <svg className="gr-arc" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="90" x2="1200" y2="90" className="gr-base" />
        {MARKETS.map((_, i) => {
          const x = 60 + (i * 1080) / (MARKETS.length - 1);
          return <g key={i}><circle cx={x} cy="90" r="3.5" className="gr-node" />
            {i < MARKETS.length - 1 && (() => { const x2 = 60 + ((i + 1) * 1080) / (MARKETS.length - 1); const mx = (x + x2) / 2;
              return <path d={`M${x},90 Q${mx},${30 + (i % 3) * 14} ${x2},90`} className="gr-link" style={{ animationDelay: `${i * 0.2}s` }} />; })()}
          </g>;
        })}
      </svg>
    </section>
  );
}
