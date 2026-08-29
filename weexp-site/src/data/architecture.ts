/**
 * Архітектура бренду — рівні, з яких складається пропозиція WEEXP.
 *
 * Сайт називав ці рівні поодинці й у різних місцях: вісім систем жили на
 * /systems, девʼять напрямів експертизи — на /expansion, три формати — на
 * /pricing, Independence Score — у результаті експрес-аудиту. Ніде не було
 * сказано, як вони пов'язані, тому збоку це читалось як чотири різні каталоги
 * послуг, а не одна пропозиція. Питання «що ви взагалі продаєте» лишалось
 * без відповіді на головній.
 *
 * Тут — один ланцюг: ЩО будуємо → ХТО будує → ЯК заходимо → ЧИМ міряємо.
 * Числа рівнів рахуються з тих самих джерел, що живлять самі сторінки:
 * розійтись їм більше нема як.
 */
import { SYSTEMS } from '@/data/xray';
import { EXPERTISES } from '@/system/expertises';

/** Скільки форматів співпраці на /pricing. Джерело — картки MODELS у Pricing.tsx;
 *  вони складаються всередині компонента (потрібен t), тож звʼязок тримає тест. */
export const ENGAGEMENT_MODELS = 3;

export type ArchLevel = {
  key: string;
  /** Число рівня — рахується, а не пишеться. */
  count: string;
  /** [uk, en] */
  title: [string, string];
  question: [string, string];
  body: [string, string];
  to: string;
};

export const ARCHITECTURE: ArchLevel[] = [
  {
    key: 'systems',
    count: String(SYSTEMS.length),
    title: ['систем онлайн-продажів', 'systems of online sales'],
    question: ['Що ми будуємо', 'What we build'],
    body: [
      'Стратегія, комерція, попит, досвід, операції, дані, організація, експансія. Виторг витікає там, де найслабша.',
      'Strategy, commerce, demand, experience, operations, data, organization, expansion. Revenue leaks where the weakest one is.',
    ],
    to: '/systems',
  },
  {
    key: 'expertise',
    count: String(EXPERTISES.length),
    title: ['напрямів експертизи', 'areas of expertise'],
    question: ['Хто і чим будує', 'Who builds it, and with what'],
    body: [
      'Кожна система збирається руками профільної команди — від брендингу й UX до розробки, маркетингу й каналів продажів.',
      'Each system is built by a specialist team — from branding and UX to development, marketing and sales channels.',
    ],
    to: '/expansion',
  },
  {
    key: 'models',
    count: String(ENGAGEMENT_MODELS),
    title: ['формати співпраці', 'engagement formats'],
    question: ['Як ми заходимо', 'How we come in'],
    body: [
      'Аудит, консалтинг або управління під ключ — за рівнем нашої відповідальності за результат, а не за обсягом годин.',
      'Audit, consulting or turnkey management — by how much of the result we own, not by hours booked.',
    ],
    to: '/pricing',
  },
  {
    key: 'score',
    count: '0–100',
    title: ['Independence Score', 'Independence Score'],
    question: ['Чим міряємо результат', 'How we measure the result'],
    body: [
      'Наш стандарт зрілості: наскільки бізнес здатний рости без вас. Безкоштовний експрес-аудит дає першу оцінку — Business Health 0–100 і головне вузьке місце.',
      'Our maturity standard: how far the business can grow without you. The free express audit gives the first estimate — Business Health 0–100 and the main bottleneck.',
    ],
    to: '/diagnose',
  },
];
