/**
 * Як влаштована співпраця — шість кроків від першого контакту до передачі.
 *
 * Цей перелік уже існував: він стояв усередині Pricing.tsx, зібраний прямо в
 * розмітці масивом літералів. Там його бачив лише той, хто дійшов до сторінки
 * цін і догортав її до середини, — тобто майже ніхто. Питання «а як ви
 * працюєте» при цьому людина ставить ДО ціни, а не після.
 *
 * Тому кроки переїхали сюди: одне джерело для головної і для трьох сторінок
 * форматів. Процес один на всі три формати — відрізняється не він, а те, хто
 * на кожному кроці тримає кермо (це каже поле `resp` у services.ts).
 */

/** Двомовна пара — та сама домовленість, що в services.ts. */
export type P = [uk: string, en: string];

export type Step = { n: string; title: P; text: P };

export const PROCESS: Step[] = [
  {
    n: '01',
    title: ['Діагноз', 'Diagnosis'],
    text: [
      'Глибокий аудит усієї структури e-commerce: від комерційної моделі й аналітики до операцій і технологій. 4–6 тижнів, розрив у грошах за CRM/ERP/GA4.',
      'A deep audit of the whole e-commerce structure: from the commercial model and analytics to operations and technology. 4–6 weeks, the revenue gap from CRM/ERP/GA4.',
    ],
  },
  {
    n: '02',
    title: ['Договір', 'Contract'],
    text: [
      'Договір із європейською компанією, зареєстрованою в ЄС: предмет, строки, обсяг і KPI — письмово, до старту робіт.',
      'A contract with a European company registered in the EU: scope, timelines and KPIs — in writing, before any work starts.',
    ],
  },
  {
    n: '03',
    title: ['Команда й доступи', 'Team & access'],
    text: [
      'Фіксуємо склад: Head of E-commerce і профільні ролі. Доступи ви відкриваєте контрольовано.',
      'We fix the team: a Head of E-commerce and specialist roles. You grant access in a controlled way.',
    ],
  },
  {
    n: '04',
    title: ['Робота хвилями', 'Delivery in waves'],
    text: [
      'Дорожня карта під Definition of Done. Транші під результат, а не «за години».',
      'A roadmap under a Definition of Done. Tranches tied to results, not «by the hour».',
    ],
  },
  {
    n: '05',
    title: ['Приймання', 'Acceptance'],
    text: [
      'Кожен етап приймається за DoD і вимірюваним ефектом — ви бачите, за що платите.',
      'Each stage is accepted against the DoD and a measurable effect — you see what you are paying for.',
    ],
  },
  {
    n: '06',
    title: ['Передача', 'Handover'],
    text: [
      'Система лишається у вас: процеси, доступи і знання — щоб працювало без нас.',
      'The system stays with you: processes, access and knowledge — so it runs without us.',
    ],
  },
];

/**
 * Життя після передачі.
 *
 * Окремим блоком, а не сьомим кроком: це не етап проєкту, а відповідь на
 * питання, яке власник ставить саме тоді, коли вже майже погодився, — «а що
 * буде, коли ви підете». Доти сайт відповідав на нього лише умовами формату 02
 * на сторінці цін.
 */
export const AFTER: { title: P; text: P[] } = {
  title: ['Життя після передачі', 'Life after handover'],
  text: [
    [
      'Працювати з нами далі можна як із партнером — це дешевше, ніж тримати ці ролі в штаті.',
      'You can keep working with us as a partner — that is cheaper than carrying these roles in-house.',
    ],
    [
      'Обсяг супроводу щоразу різний: комусь потрібні щотижневі сесії, комусь — ревʼю раз на квартал.',
      'The volume of support differs every time: some need weekly sessions, others a review once a quarter.',
    ],
    [
      'Ми знаємо, як тримати систему в актуальному стані, щоб через три роки її не довелося будувати наново.',
      'We know how to keep the system current, so that in three years it does not have to be rebuilt from scratch.',
    ],
  ],
};
