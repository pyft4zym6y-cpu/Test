import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import { useJsonLd } from '@/lib/seo';
import './system.css';

/**
 * Довіра під стрічкою доказів (/proof). Чесно закриває типові заперечення
 * зовнішнього рев'ю: як ми рахуємо й перевіряємо цифри, чому кейси анонімні,
 * хто працює над проєктом, як влаштований договір і відповідальність, і що
 * можна почати з пілота. Нічого не вигадуємо — лише робимо прозорою методику
 * та даємо шлях до перевірки (референси за запитом під NDA). Плюс FAQPage-
 * розмітка, щоб ці відповіді бачив і Google, і AI-асистенти.
 */
export function ProofTrust() {
  const t = useT();
  const lp = useLp();

  const METHOD = [
    { k: t('Джерело', 'Source'),
      v: t('Кожна дельта «до → після» береться з систем клієнта — CRM, ERP і GA4/аналітики, а не з наших слів.', 'Every “before → after” delta comes from the client’s own systems — CRM, ERP and GA4/analytics, not from our word.') },
    { k: t('Звірка', 'Reconciliation'),
      v: t('Стартові й фінальні значення фіксуємо на одному горизонті й звіряємо в присутності клієнта, щоб уникнути «вибіркових» місяців.', 'Baseline and final values are captured over the same window and reconciled together with the client, to avoid cherry-picked months.') },
    { k: t('Атрибуція', 'Attribution'),
      v: t('Розділяємо вплив системи від сезону й реклами: там, де ефект неоднозначний, показуємо консервативну оцінку.', 'We separate the system’s impact from seasonality and paid media: where the effect is ambiguous, we show the conservative estimate.') },
    { k: t('Анонімність', 'Anonymity'),
      v: t('Назви брендів приховані за NDA — тому кейси категорійні. Референс конкретного клієнта надаємо за запитом і з його згоди.', 'Brand names are hidden under NDA — that’s why cases are categorical. A specific client reference is provided on request and with their consent.') },
  ];

  const FAQ = [
    { q: t('Кейси анонімні — як їх перевірити?', 'Cases are anonymous — how can I verify them?'),
      a: t('Цифри в кейсах — це дельти з CRM/ERP/GA4 клієнта, а не маркетингові оцінки. Назви прибрані за NDA. На дзвінку ми показуємо методику розрахунку, а за запитом організовуємо референс-дзвінок із клієнтом суміжної категорії — з його згоди.', 'The numbers in the cases are deltas from the client’s CRM/ERP/GA4, not marketing estimates. Names are removed under NDA. On a call we walk through the calculation methodology, and on request we arrange a reference call with a client in an adjacent category — with their consent.') },
    { q: t('Хто саме працюватиме над моїм проєктом?', 'Who exactly will work on my project?'),
      a: t('Проєкт веде Head of E-commerce як лід доставки результату. Під конкретні задачі підключаються профільні ролі — стратегія, performance, retention/CRM, UX/CRO, аналітика, операції. У кожному кейсі показано, які ролі були задіяні. Склад команди під ваш проєкт фіксуємо в угоді до старту.', 'The project is led by a Head of E-commerce as the delivery lead. Specialist roles plug in per task — strategy, performance, retention/CRM, UX/CRO, analytics, operations. Each case shows which roles were engaged. The exact team for your project is fixed in the agreement before kickoff.') },
    { q: t('Як влаштований договір і відповідальність?', 'How are the contract and liability handled?'),
      a: t('Працюємо офіційно від ФОП (Україна). До старту — договір із предметом, строками, Definition of Done і порядком приймання. Обсяг і KPI узгоджуємо письмово, доступи ви відкриваєте контрольовано й у будь-який момент можете відкликати.', 'We operate officially as a sole proprietor (ФОП, Ukraine). Before kickoff — a contract with scope, timelines, a Definition of Done and an acceptance procedure. Scope and KPIs are agreed in writing, you grant access in a controlled way and can revoke it at any time.') },
    { q: t('Можна почати з невеликого пілота?', 'Can we start with a small pilot?'),
      a: t('Так — і ми це радимо. Почніть із безкоштовного експрес-аудиту, далі — платний глибокий аудит як обмежений пілот: він дає дорожню карту й перші вимірювані зміни за 30–60 днів без довгих зобов’язань. Масштаб співпраці — уже за фактом результату.', 'Yes — and we recommend it. Start with the free express audit, then a paid deep audit as a bounded pilot: it delivers a roadmap and the first measurable changes in 30–60 days with no long commitment. Scaling the engagement follows the result.') },
  ];

  useJsonLd('faq-proof', {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });

  return (
    <section className="sysx proof-trust" aria-label={t('Як ми перевіряємо цифри', 'How we verify the numbers')}>
      <div className="proof-trust-in">
        <span className="sysx-kick">{t('Прозорість', 'Transparency')}</span>
        <h2 className="sysx-display proof-trust-h">{t('Як ми рахуємо і перевіряємо цифри', 'How we count and verify the numbers')}</h2>
        <p className="sysx-lead proof-trust-lead">{t('Кейси анонімні за NDA, але методика — ні. Ось як влаштована перевірка й що можна запросити.', 'The cases are anonymous under NDA, but the methodology isn’t. Here’s how verification works and what you can request.')}</p>

        <div className="proof-method">
          {METHOD.map((m) => (
            <div key={m.k} className="proof-method-item">
              <span className="proof-method-k mono">{m.k}</span>
              <p className="proof-method-v">{m.v}</p>
            </div>
          ))}
        </div>

        <div className="home-faq-list proof-trust-faq">
          {FAQ.map((f, i) => (
            <details key={i} className="home-faq-item">
              <summary className="home-faq-q">{f.q}<i className="home-faq-mark" aria-hidden="true">+</i></summary>
              <p className="home-faq-a">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="proof-ref">
          <p className="proof-ref-t">{t('Хочете референс конкретного клієнта?', 'Want a specific client reference?')}</p>
          <p className="proof-ref-s">{t('Організуємо референс-дзвінок із клієнтом суміжної категорії — за запитом і з його згоди.', 'We’ll arrange a reference call with a client in an adjacent category — on request and with their consent.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/contact')} className="sysx-cta is-primary">{t('Запросити референс →', 'Request a reference →')}</Link>
            <Link to={lp('/diagnose')} className="sysx-cta">{t('Почати з експрес-аудиту', 'Start with the express audit')} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
