import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import './how.css';

const METHOD = [
  { n: 'SEE', t: 'Бачимо', d: 'Діагноз у грошах: Business Health, benchmark, причинна карта, розрив.' },
  { n: 'BUILD', t: 'Будуємо', d: 'Хвилями під Definition of Done: функція, інфраструктура, система росту.' },
  { n: 'SCALE', t: 'Масштабуємо', d: 'Нові ринки, ЄС, маркетплейси, AI — на власній операційній основі.' },
  { n: 'INDEPENDENCE', t: 'Робимо незалежним', d: 'Independence Score росте: бізнес працює без героя.' },
  { n: 'RETURN', t: 'Повертаємось', d: 'Рекалібрування й наступний рівень — коли з’являється новий розрив.' },
];

/** /how-it-works — методологія як філософія, а не timeline. SEE → … → RETURN. */
export function HowItWorks() {
  return (
    <>
      <PageHead
        kicker="Розділ · How it works"
        title={<>Метод, а не послуга</>}
        lead={<>Одна з головних причин обрати WEEXP — не ховаємо методологію, а робимо її
          <b> доказом</b>. П’ять станів роботи, які повторюються по колу.</>}
      />
      <section className="wrap how-method">
        {METHOD.map((m, i) => (
          <div key={m.n} className="how-step" style={{ ['--i' as string]: i / (METHOD.length - 1) }}>
            <span className="how-step-n mono">{m.n}</span>
            <div className="how-step-body">
              <span className="how-step-t">{m.t}</span>
              <span className="how-step-d">{m.d}</span>
            </div>
            <span className="how-step-idx mono">0{i + 1}</span>
          </div>
        ))}
      </section>
      <section className="wrap how-assets">
        <span className="page-kick">Інструменти методу</span>
        <div className="how-assets-row">
          <Link to="/how-it-works/business-health" className="how-asset">
            <span className="how-asset-t">Business Health</span>
            <span className="how-asset-d">18 доменів здоров’я бізнесу</span>
          </Link>
          <Link to="/how-it-works/independence-score" className="how-asset">
            <span className="how-asset-t">Independence Score</span>
            <span className="how-asset-d">Рівень зрілості 0–100</span>
          </Link>
          <Link to="/diagnose" className="how-asset how-asset--mark">
            <span className="how-asset-t">Business X-Ray</span>
            <span className="how-asset-d">Самодіагноз за 2 хвилини →</span>
          </Link>
        </div>
      </section>
    </>
  );
}
