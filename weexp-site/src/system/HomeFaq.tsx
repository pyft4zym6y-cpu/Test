import { useT } from '@/i18n';
import { useJsonLd } from '@/lib/seo';
import './system.css';

/**
 * FAQ-блок головної: закриває основні заперечення + FAQPage-розмітка для Google.
 * Нативний акордеон (<details>) — доступний, без JS. Фірмовий .sysx-стиль.
 */
export function HomeFaq() {
  const t = useT();
  const FAQ = [
    { q: t('Що таке система зростання?', 'What is a growth system?'),
      a: t('Ми збираємо вісім систем магазину — від стратегії до операцій — в одну керовану, щоб виторг зростав за рахунок системи, а не ручного режиму й окремих героїв.', 'We assemble eight store systems — from strategy to operations — into one managed system, so revenue grows through the system rather than manual effort and lone heroes.') },
    { q: t('Для кого це?', 'Who is it for?'),
      a: t('Для D2C та e-commerce брендів, яким уже тісно в ручному управлінні: продажі є, а масштабування впирається в людей і хаос у процесах.', 'For D2C and e-commerce brands that have outgrown manual management: sales exist, but scaling hits a ceiling of people and process chaos.') },
    { q: t('З чого почати?', 'Where do I start?'),
      a: t('З безкоштовного експрес-аудиту: за ~2 хвилини він дає число — скільки виторгу витікає щороку — і головне вузьке місце. Далі можна замовити глибокий аудит.', 'With a free express audit: in ~2 minutes it gives you a number — how much revenue leaks each year — and the main bottleneck. Then you can order the deep audit.') },
    { q: t('Коли буде результат?', 'When will there be a result?'),
      a: t('Перші вимірювані зміни — за 30–60 днів. Швидкі перемоги йдуть у першій хвилі, глибші зміни — далі за дорожньою картою під Definition of Done.', 'The first measurable changes — within 30–60 days. Quick wins come in the first wave; deeper changes follow the roadmap under a Definition of Done.') },
    { q: t('Ви робите руками чи консультуєте?', 'Do you execute or consult?'),
      a: t('Залежить від формату. Аудит і консалтинг — руки вашої команди, ми архітектор і контроль. Управління — ваші люди + керована мережа партнерів під OKR і DoD.', 'It depends on the format. Audit and consulting — your team executes, we are the architect and control. Managed delivery — your people + a managed partner network under OKRs and DoD.') },
    { q: t('Чи безпечні мої дані?', 'Is my data safe?'),
      a: t('Доступ до глибокого аудиту — лише за кодом від менеджера, зʼєднання захищене SSL, дані обробляються за принципами GDPR. Ви контролюєте, що і кому відкриваєте.', 'Access to the deep audit is by a manager-issued code only, the connection is SSL-secured, and data is handled under GDPR principles. You control what you share and with whom.') },
  ];
  useJsonLd('faq-home', {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });

  return (
    <section className="sysx home-faq" aria-label="FAQ">
      <div className="home-faq-in">
        <span className="sysx-kick">FAQ</span>
        <h2 className="sysx-display home-faq-h">{t('Відповідаємо до того, як ви запитаєте', 'We answer before you ask')}</h2>
        <div className="home-faq-list">
          {FAQ.map((f, i) => (
            <details key={i} className="home-faq-item">
              <summary className="home-faq-q">{f.q}<i className="home-faq-mark" aria-hidden="true">+</i></summary>
              <p className="home-faq-a">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
