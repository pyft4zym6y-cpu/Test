import { Link } from 'react-router-dom';
import { CERTIFICATIONS, PARTNERSHIPS, PUBLICATIONS, PLATFORMS, type Credential } from '@/data/credentials';
import './system.css';

/**
 * Механіка довіри (ТЗ §6). Замість анонімних тез («10 років досвіду») —
 * метод, прозорий процес і реальні платформи. Сертифікати / партнерства /
 * публікації рендеримо лише коли заповнено (data/credentials) — без фейків.
 */
const METHOD = [
  { t: 'Commerce OS', d: 'Вісім систем онлайн-продажів як єдине ціле, а не набір послуг.' },
  { t: 'Рішення за даними', d: 'Кожен висновок звірено з CRM / ERP / GA4, а не «на око».' },
  { t: 'Definition of Done', d: 'Чіткий критерій готовності кожної роботи — без «зробили і зникли».' },
  { t: 'Власник у кожної системи', d: 'Не універсали — відповідальний за результат у кожній частині.' },
];
const PROCESS = [
  { n: '01', t: 'Діагноз у грошах', d: 'Знаходимо, де саме витікає виторг і що дасть найбільшу дельту.' },
  { n: '02', t: 'Побудова хвилями', d: 'За пріоритетом віддачі, під Definition of Done.' },
  { n: '03', t: 'Доведення до економіки', d: 'Не «присутність», а прибуток і керована юніт-економіка.' },
  { n: '04', t: 'Передача', d: 'Власники, SOP, Independence Score — працює без нас.' },
];

function CredRow({ title, items }: { title: string; items: Credential[] }) {
  if (!items.length) return null;
  return (
    <div className="cred-row">
      <span className="cred-row-lab mono">{title}</span>
      <div className="cred-row-items">
        {items.map((c) =>
          c.href ? (
            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className="cred-item is-link">{c.label}{c.detail && <i>{c.detail}</i>}</a>
          ) : (
            <span key={c.label} className="cred-item">{c.label}{c.detail && <i>{c.detail}</i>}</span>
          ),
        )}
      </div>
    </div>
  );
}

export function Credibility() {
  return (
    <section className="cred sysx" aria-label="Чому нам можна довіряти">
      <div className="cred-in">
        <div className="cred-head">
          <span className="sysx-kick">Чому нам можна довіряти</span>
          <h2 className="sysx-display cred-h">Не «10 років досвіду» —<br /><span className="sysx-em">метод і прозорий процес</span></h2>
          <p className="cred-lead">Довіра будується не на гаслах, а на тому, як ми думаємо, за чим ухвалюємо рішення і що лишається у вас після роботи.</p>
        </div>

        <div className="cred-method">
          {METHOD.map((m) => (
            <div key={m.t} className="cred-pillar">
              <b>{m.t}</b>
              <span>{m.d}</span>
            </div>
          ))}
        </div>

        <div className="cred-process">
          <span className="cred-lab mono">Прозорий процес — від діагнозу до незалежності</span>
          <div className="cred-steps">
            {PROCESS.map((p) => (
              <div key={p.n} className="cred-step">
                <i className="mono">{p.n}</i>
                <b>{p.t}</b>
                <span>{p.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cred-platforms">
          <span className="cred-lab mono">Будуємо на платформах, які ви вже знаєте</span>
          <div className="cred-plat-list">
            {PLATFORMS.map((p) => <span key={p} className="cred-plat">{p}</span>)}
          </div>
        </div>

        {/* Реальні сигнали — показуємо, лише коли заповнено (data/credentials.ts) */}
        <CredRow title="Сертифікати та статуси" items={CERTIFICATIONS} />
        <CredRow title="Партнерства" items={PARTNERSHIPS} />
        <CredRow title="Публікації та виступи" items={PUBLICATIONS} />

        <div className="cred-cta">
          <span className="cred-cta-note mono">Найкращий доказ — на ваших даних. Діагностика покаже дельту саме для вас.</span>
          <Link to="/diagnose" className="sysx-cta is-primary">Пройти діагностику →</Link>
          <Link to="/proof" className="sysx-cta">Дивитись кейси</Link>
        </div>
      </div>
    </section>
  );
}
