import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Usp } from '@/components/Usp';
import { Alternatives } from '@/components/Alternatives';
import { Flywheel } from '@/components/Flywheel';
import './services.css';

const DOORS = [
  { code: 'D-01', name: 'Diagnostic Sprint', price: '$2–6K', term: '2–4 тижні',
    line: 'Діагноз у грошах. Знаходимо розрив і план під нього.', out: 'Discovery Report (PDF) + дорожня карта' },
  { code: 'D-02', name: 'Commerce OS™ Build', price: '$40–80K', term: '6–12 місяців',
    line: 'Побудова системи хвилями під Definition of Done.', out: 'Працююча операційна система росту', featured: true },
  { code: 'D-03', name: 'Fractional Head of Commerce', price: '$6–20K/міс', term: 'на утримання',
    line: 'Залишаємось у ролі керівника напряму — доки система не автономна.', out: 'Governance + власна команда' },
];

/** /services — модель співпраці: три двері, USP, маховик, порівняння з альтернативами. */
export function Services() {
  return (
    <>
      <PageHead
        kicker="Розділ · Співпраця"
        title={<>Три двері.<br />Один принцип.</>}
        lead={<>Вхід дешевий і чесний: спершу <b>діагноз у грошах</b>, лише потім побудова. Ми залишаємо систему працювати без вас.</>}
      />
      <section className="wrap doors">
        {DOORS.map((d) => (
          <article key={d.code} className={`door${d.featured ? ' is-featured' : ''}`}>
            <span className="door-code mono">{d.code}</span>
            <h3 className="door-name">{d.name}</h3>
            <div className="door-price">{d.price}</div>
            <div className="door-term mono">{d.term}</div>
            <p className="door-line">{d.line}</p>
            <div className="door-out mono">→ {d.out}</div>
          </article>
        ))}
      </section>
      <Usp />
      <Flywheel />
      <Alternatives />
      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Почніть із діагнозу — він окупається ще до побудови.</p>
          <div className="home-cta-row">
            <Link to="/diagnostics" className="btn-primary mono">Порахувати розрив →</Link>
            <Link to="/contact" className="btn-ghost mono">Обговорити проєкт →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
