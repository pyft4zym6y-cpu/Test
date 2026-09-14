import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import './home.css';

/**
 * ДРУГИЙ ЕКРАН ГОЛОВНОЇ: З ЧОГО СКЛАДАЄТЬСЯ ПЕРЕВАГА ЛІДЕРІВ.
 *
 * Десять напрямів, кожен двома реченнями: перше називає, ЧОМУ це взагалі
 * питання, друге — що саме ми з цим робимо. Порядок не випадковий і не за
 * важливістю: він іде від людей і структури до інтерфейсу, конверсії, шляху
 * клієнта, автоматизації, попиту, технологій, даних, контенту — і завершується
 * тим, що робить усе попереднє повторюваним.
 *
 * ЧОМУ ТУТ НЕМАЄ ПОСИЛАНЬ. Спокуса завести кожен пункт на сторінку велика, але
 * ці десять напрямів — НЕ ті девʼять експертиз, що живуть у меню: інший поділ,
 * інші назви. Десять посилань у сторінки, які називаються інакше, зробили б із
 * одного сайту два довідники. Тому це текст, який готує до наступного кроку, а
 * не друга навігація; єдиний вихід із блоку — кнопка внизу.
 */

/** [номер, заголовок, чому це питання, що робимо] — двомовними парами. */
const AREAS: [string, [string, string], [string, string], [string, string]][] = [
  ['01',
   ['Сильна e-commerce команда', 'A strong e-commerce team'],
   ['Зростання починається не лише з інструментів, а зі структури, відповідальності та правильної взаємодії між людьми.',
    'Growth starts not only with tools, but with structure, accountability and the right interaction between people.'],
   ['Допомагаємо вибудувати ефективну e-commerce функцію: ролі, процеси, KPI, зони відповідальності та систему управління, у якій маркетинг, продажі, продукт і операції працюють як єдиний механізм.',
    'We help build an effective e-commerce function: roles, processes, KPIs, areas of accountability and a management system in which marketing, sales, product and operations work as one mechanism.']],
  ['02',
   ['UX/UI, який працює на конверсію', 'UX/UI that works for conversion'],
   ['Дизайн має не просто виглядати сучасно. Він повинен допомагати клієнту швидше зрозуміти пропозицію, відчути довіру та зробити покупку.',
    'Design should not merely look modern. It must help the customer grasp the offer faster, feel trust and make the purchase.'],
   ['Аналізуємо поведінку користувачів і вдосконалюємо інтерфейс, структуру сторінок, навігацію, мобільний досвід і ключові точки взаємодії.',
    'We analyse user behaviour and improve the interface, page structure, navigation, mobile experience and the key points of interaction.']],
  ['03',
   ['CRO: більше продажів із наявного трафіку', 'CRO: more sales from the traffic you have'],
   ['Кожен відвідувач уже має свою ціну. Завдання — допомогти більшій кількості користувачів пройти шлях до покупки.',
    'Every visitor already has a price. The task is to help more of them complete the path to purchase.'],
   ['Знаходимо барʼєри у воронці, формуємо гіпотези, проводимо тести та системно підвищуємо конверсію без необхідності постійно збільшувати рекламний бюджет.',
    'We find the barriers in the funnel, form hypotheses, run tests and raise conversion systematically — without having to keep increasing the ad budget.']],
  ['04',
   ['Customer journey без втрат', 'A customer journey without losses'],
   ['Клієнтський досвід починається задовго до оформлення замовлення й не закінчується після покупки.',
    'The customer experience begins long before checkout and does not end after the purchase.'],
   ['Проєктуємо шлях клієнта на всіх етапах: від першого контакту та вибору продукту до оплати, доставки, повторної покупки й рекомендації бренду.',
    'We design the customer path at every stage: from first contact and product choice to payment, delivery, repeat purchase and recommending the brand.']],
  ['05',
   ['Автоматизація та AI', 'Automation and AI'],
   ['Ручні процеси забирають час, створюють помилки й обмежують масштабування.',
    'Manual processes take time, create errors and limit scaling.'],
   ['Виявляємо операції, які можна автоматизувати за допомогою AI, CRM, інтеграцій і цифрових інструментів — від обробки лідів та комунікацій до персоналізації, аналітики й підтримки клієнтів.',
    'We identify operations that can be automated with AI, CRM, integrations and digital tools — from lead handling and communications to personalisation, analytics and customer support.']],
  ['06',
   ['SEO та органічне зростання', 'SEO and organic growth'],
   ['Сильний e-commerce не повинен залежати лише від платного трафіку.',
    'Strong e-commerce must not depend on paid traffic alone.'],
   ['Розвиваємо органічну видимість магазину через технічне SEO, структуру категорій і товарних сторінок, контент, семантику та оптимізацію шляху користувача від пошуку до покупки.',
    'We grow the store’s organic visibility through technical SEO, the structure of categories and product pages, content, semantics and optimising the user path from search to purchase.']],
  ['07',
   ['Технології, які підсилюють бізнес', 'Technology that strengthens the business'],
   ['Технології мають спрощувати роботу, прискорювати розвиток і створювати додаткову цінність для клієнта.',
    'Technology should simplify the work, speed up development and create additional value for the customer.'],
   ['Допомагаємо сформувати технологічну основу e-commerce: платформи, інтеграції, аналітику, CRM, CDP, платіжні рішення, AI-інструменти та інші системи, які підтримують масштабування.',
    'We help shape the technology foundation of e-commerce: platforms, integrations, analytics, CRM, CDP, payment solutions, AI tools and other systems that support scaling.']],
  ['08',
   ['Дані, аналітика та система рішень', 'Data, analytics and a decision system'],
   ['Без якісних даних бізнес бачить лише результат, але не розуміє причин.',
    'Without good data a business sees only the result and does not understand the causes.'],
   ['Обʼєднуємо дані з маркетингу, продажів, сайту та клієнтської поведінки, щоб бачити реальну картину, знаходити точки втрат і приймати рішення на основі фактів.',
    'We bring together data from marketing, sales, the site and customer behaviour to see the real picture, find the points of loss and make decisions on facts.']],
  ['09',
   ['Контент, який допомагає продавати', 'Content that helps you sell'],
   ['Контент — це не просто візуальна присутність бренду. Це інструмент пояснення цінності, формування довіри та руху клієнта до покупки.',
    'Content is not just a brand’s visual presence. It is a tool for explaining value, building trust and moving the customer towards a purchase.'],
   ['Створюємо контентну систему для товарних сторінок, рекламних кампаній, email-комунікацій, соцмереж і всіх ключових точок контакту з аудиторією.',
    'We build a content system for product pages, ad campaigns, email communications, social media and every key point of contact with the audience.']],
  ['10',
   // «constant», а не «continuous»: довше слово лишало на 320px другий рядок
   // з одного «improvement» — єдиний такий випадок на всьому сайті.
   ['Система постійного покращення', 'A system of constant improvement'],
   ['E-commerce не можна налаштувати один раз і залишити без уваги.',
    'E-commerce cannot be set up once and left alone.'],
   ['Формуємо процес безперервної оптимізації: аналіз, гіпотеза, впровадження, тестування, вимірювання результату та наступний крок. Так бізнес не просто запускає зміни, а постійно стає ефективнішим.',
    'We build a process of continuous optimisation: analysis, hypothesis, rollout, testing, measuring the result and the next step. This way the business does not merely launch changes — it keeps getting more effective.']],
];

export function Leaders() {
  const t = useT();
  const lp = useLp();
  return (
    <section className="sysx hb hb-ldr" aria-labelledby="hb-ldr-h">
      <div className="hb-in">
        <h2 id="hb-ldr-h" className="sysx-display hb-h">
          {t('Як працюють лідери', 'How e-commerce leaders')}{' '}
          <span className="sysx-em">{t('e-commerce?', 'actually work')}</span>
        </h2>
        <p className="hb-ldr-l">
          {t('Ми знаємо, де ховається їхня перевага. І допомагаємо побудувати її у вашому бізнесі.',
             'We know where their advantage hides. And we help you build it inside your business.')}
        </p>

        <ol className="hb-ldr-list">
          {AREAS.map(([n, title, why, what]) => (
            <li key={n} className="hb-ldr-item">
              <i className="hb-ldr-n" aria-hidden="true">{n}</i>
              <h3 className="hb-ldr-t">{t(title[0], title[1])}</h3>
              <p className="hb-ldr-why">{t(why[0], why[1])}</p>
              <p className="hb-ldr-what">{t(what[0], what[1])}</p>
            </li>
          ))}
        </ol>

        {/*
          * Вихід із блоку рівно один. Десять пунктів — це десять причин
          * задуматись, і без наступного кроку вони лишаються переліком, після
          * якого людина просто гортає далі.
          */}
        <div className="hb-ldr-cta">
          <h3 className="hb-ldr-cta-h">
            {t('Ваш наступний рівень починається з діагностики',
               'Your next level starts with a diagnosis')}
          </h3>
          <p>
            {t('Ми допоможемо побачити, що саме стримує ваш e-commerce, де втрачається прибуток і які зміни варто впровадити першими.',
               'We will help you see what exactly is holding your e-commerce back, where profit leaks and which changes are worth making first.')}
          </p>
          <Link to={lp('/contact')} className="sysx-cta is-primary">
            {t('Знайти можливості для росту', 'Find opportunities for growth')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
