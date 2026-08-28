import { Link } from 'react-router-dom';
import { CERTIFICATIONS, PARTNERSHIPS, PUBLICATIONS, PLATFORMS, type Credential } from '@/data/credentials';
import { useT, useLp } from '@/i18n';
import './system.css';

/**
 * Механіка довіри (ТЗ §6). Замість анонімних тез («10 років досвіду») —
 * метод, прозорий процес і реальні платформи. Сертифікати / партнерства /
 * публікації рендеримо лише коли заповнено (data/credentials) — без фейків.
 */

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
  const t = useT();
  const lp = useLp();

  const METHOD = [
    { t: t('Система зростання', 'Growth system'), d: t('Вісім систем онлайн-продажів як єдине ціле, а не набір послуг.', 'Eight online-sales systems as a single whole, not a set of services.') },
    { t: t('Рішення за даними', 'Data-driven decisions'), d: t('Кожен висновок звірено з CRM / ERP / GA4, а не «на око».', 'Every conclusion is checked against CRM / ERP / GA4, not by gut feel.') },
    { t: 'Definition of Done', d: t('Чіткий критерій готовності кожної роботи — без «зробили і зникли».', 'A clear completion criterion for every piece of work — no “did it and vanished”.') },
    { t: t('Власник у кожної системи', 'An owner for every system'), d: t('Не універсали — відповідальний за результат у кожній частині.', 'No generalists — someone accountable for the result in each part.') },
  ];
  const PROCESS = [
    { n: '01', t: t('Діагноз у грошах', 'Diagnosis in money'), d: t('Знаходимо, де саме витікає виторг і що дасть найбільшу дельту.', 'We find exactly where revenue leaks and what delivers the biggest delta.') },
    { n: '02', t: t('Побудова хвилями', 'Building in waves'), d: t('За пріоритетом віддачі, під Definition of Done.', 'By return priority, under Definition of Done.') },
    { n: '03', t: t('Доведення до економіки', 'Driving to economics'), d: t('Не «присутність», а прибуток і керована юніт-економіка.', 'Not “presence”, but profit and managed unit economics.') },
    { n: '04', t: t('Передача', 'Handover'), d: t('Власники, SOP, Independence Score — працює без нас.', 'Owners, SOPs, Independence Score — it runs without us.') },
  ];

  return (
    <section className="cred sysx" aria-label={t('Чому нам можна довіряти', 'Why you can trust us')}>
      <div className="cred-in">
        <div className="cred-head">
          <span className="sysx-kick">{t('Чому нам можна довіряти', 'Why you can trust us')}</span>
          <h2 className="sysx-display cred-h">{t('Не «10 років досвіду» —', 'Not “10 years of experience” —')}<br /><span className="sysx-em">{t('метод і прозорий процес', 'method and a transparent process')}</span></h2>
          <p className="cred-lead">{t('Довіра будується не на гаслах, а на тому, як ми думаємо, за чим ухвалюємо рішення і що лишається у вас після роботи.', 'Trust is built not on slogans, but on how we think, what we base decisions on and what stays with you after the work.')}</p>
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
          <span className="cred-lab mono">{t('Прозорий процес — від діагнозу до незалежності', 'Transparent process — from diagnosis to independence')}</span>
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
          <span className="cred-lab mono">{t('Будуємо на платформах, які ви вже знаєте', 'Built on the platforms you already know')}</span>
          <div className="cred-plat-list">
            {PLATFORMS.map((p) => <span key={p} className="cred-plat">{p}</span>)}
          </div>
        </div>

        {/* Реальні сигнали — показуємо, лише коли заповнено (data/credentials.ts) */}
        <CredRow title={t('Сертифікати та статуси', 'Certifications & statuses')} items={CERTIFICATIONS} />
        <CredRow title={t('Партнерства', 'Partnerships')} items={PARTNERSHIPS} />
        <CredRow title={t('Публікації та виступи', 'Publications & talks')} items={PUBLICATIONS} />

        <div className="cred-cta">
          <span className="cred-cta-note mono">{t('Найкращий доказ — на ваших даних. Діагностика покаже дельту саме для вас.', 'The best proof is on your data. Diagnostics will show the delta specifically for you.')}</span>
          <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік →', 'Calculate the leak →')}</Link>
          <Link to={lp('/proof')} className="sysx-cta">{t('Наші перемоги', 'Our wins')} →</Link>
        </div>
      </div>
    </section>
  );
}
