import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import './standard.css';

const BUILD = [
  { t: 'Локалізація й логістика', d: 'Мова, оплата, доставка й повернення під кожен ринок ЄС.' },
  { t: 'Юридичний контур', d: 'Юрособа, податки, комплаєнс, договори під ЄС.' },
  { t: 'Маркетплейси й попит', d: 'Amazon, локальні майданчики, органіка й бренд у новій країні.' },
  { t: 'Юніт-економіка ринку', d: 'Окремий P&L: маржа виживає після мит, логістики й реклами.' },
];
const READY = [
  'є traction на домашньому ринку',
  'продукт готовий під експорт',
  'операції витримують другий контур',
  'є ресурс на 6–12 місяців побудови',
];

/** /what-we-build/eu-expansion — вихід українських брендів у ЄС як побудова, а не «спробуємо». */
export function EuExpansion() {
  return (
    <>
      <PageHead
        kicker="Scale · EU Expansion"
        title={<>Вихід у ЄС<br />як система, не спроба</>}
        lead={<>Європа — не «ще один канал», а <b>окремий бізнес-контур</b>. Ми будуємо його
          цілісно: від юніт-економіки ринку до логістики й попиту.</>}
      />
      <section className="wrap st-cols">
        <div className="st-col">
          <span className="page-kick">Що будуємо</span>
          <div className="st-list">
            {BUILD.map((b) => (
              <div key={b.t} className="st-item">
                <span className="st-item-t">{b.t}</span>
                <span className="st-item-d">{b.d}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="st-col">
          <span className="page-kick">Ви готові до ЄС, якщо</span>
          <ul className="st-future">
            {READY.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <span className="st-note mono">Кейс fashion-виробника: Європа 0% → 12–18% обороту.</span>
        </div>
      </section>
      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Порахуємо, чи витримує ваша економіка вихід у ЄС.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
            <Link to="/cases/fashion-apparel" className="btn-ghost mono">Кейс виходу в ЄС →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
