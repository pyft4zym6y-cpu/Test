// Каталог курсів: загальні (треки з кількох рівнів) і точкові (окремі теми)
import { LEVELS } from './program';

export type CourseKind = 'general' | 'targeted';

export interface Course {
  id: string;
  kind: CourseKind;
  name: string;
  hook: string; // короткий комікс-меседж на картці
  levels: number[]; // номери рівнів програми
  audience: string;
  result: string;
  price: number; // USD
  oldPrice?: number; // USD, для вигоди повного треку
  duration: string; // строк навчання
  practice: string[]; // практикуми, шаблони і hands-on всередині курсу
  next?: string; // id наступного курсу в апсел-ланцюжку «Куди далі»
  expert?: boolean; // преміум-курс з експертного блоку (рівні 13–15)
  featured?: boolean;
}

export function fmtPrice(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

export const COURSES: Course[] = [
  // -------- Загальні курси (треки) --------
  {
    id: 'foundation',
    kind: 'general',
    name: 'Фундамент',
    hook: 'Перестань плутати кошик із воронкою.',
    levels: [1, 2, 3, 4],
    audience: 'Новачкам, Junior-спеціалістам і власникам малих магазинів',
    price: 3200,
    duration: '4 місяці',
    practice: [
      'Практикум: налаштування GA4 і GTM руками — від event taxonomy до e-commerce tracking',
      'Міні-капстоун: повний розбір живого інтернет-магазину за чек-листом рівнів 1–4',
      'Шаблон UX-аудиту і карта Customer Journey для свого проєкту',
      'Business Model Canvas і TAM/SAM/SOM свого магазину',
    ],
    next: 'professional',
    result: 'Статус Middle: бізнес-модель, UX/CX, воронка, аналітика й SEO',
  },
  {
    id: 'professional',
    kind: 'general',
    name: 'Професіонал',
    hook: 'Система замість зоопарку сервісів.',
    levels: [5, 6, 7, 8],
    audience: 'Middle-спеціалістам, маркетологам, керівникам напрямів',
    price: 3900,
    duration: '4 місяці',
    practice: [
      'Наскрізний кейс: архітектура → трафік → CRM на одному магазині',
      'Шаблон медіаплану і модель розподілу бюджету за каналами',
      'Бібліотека тригерних CRM-сценаріїв (welcome, win-back, кинутий кошик)',
      'Карта вендорів: що обрати на кожен шар архітектури в Україні та ЄС',
    ],
    next: 'director',
    result: 'Статус Senior+: архітектура, дані, трафік, бренд, CRM і маркетплейси',
  },
  {
    id: 'director',
    kind: 'general',
    name: 'Директор',
    hook: 'P&L більше не кусається.',
    levels: [9, 10, 11, 12],
    audience: 'Senior-спеціалістам і керівникам, що ростуть до C-level',
    price: 4200,
    duration: '5 місяців',
    practice: [
      'Готова Excel/Sheets-модель P&L і юніт-економіки до SKU',
      'Захист фінального проєкту перед «радою директорів» (роль-плей)',
      'Шаблони: Board Report, KPI tree, річний бюджет, договір консультанта',
      'Розбір антикризового сценарію на реальному кейсі',
    ],
    next: 'full',
    result: 'Статус E-Commerce Director: фінанси, команда, стратегія',
  },
  {
    id: 'full',
    kind: 'general',
    name: 'E-Commerce Director. Повний шлях',
    hook: 'Від «що таке кошик» до захисту перед інвестором.',
    levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    audience: 'Тим, хто йде повний шлях з нуля до директора й архітектора',
    price: 10100,
    oldPrice: 22000,
    duration: '15 місяців',
    practice: [
      'Усі блоки програми, включно з експертними (окремо вони коштують $22,000) — і Capstone, який не продається окремо',
      'Capstone-проєкт: 24 артефакти власного e-commerce бізнесу — від бізнес-моделі й фінмоделі до IT-архітектури і стратегії на 3 роки',
      'Захист проєкту перед «власником/інвестором» — фінальний екзамен ролі директора',
      'Проміжні «ворота» між блоками: екзамен після кожного треку тримає темп 15 місяців',
      'Усі шаблони школи: P&L, юніт-економіка, медіаплан, Board Report, договори',
    ],
    result: 'Commerce Architect: готовність до ролі E-Commerce Director і захищений капстоун-проєкт у портфоліо',
    featured: true,
  },

  // -------- Точкові курси --------
  {
    id: 'ux-cro',
    kind: 'targeted',
    name: 'UX/UI, CX та CRO магазину',
    hook: 'Купують не банери. Купують зручність.',
    levels: [2],
    audience: 'Маркетологам, дизайнерам, продактам e-commerce',
    price: 1800,
    duration: '6 тижнів',
    practice: [
      'Hands-on: Figma для розбору макетів, Hotjar/Clarity для теплокарт і сесій',
      'Розбір 3 реальних A/B-тестів із цифрами: гіпотеза → тест → рішення',
      'UX-аудит твого магазину за чек-листом рівня',
      'Карта CX: CJM + NPS/CSAT/CES для свого проєкту',
    ],
    next: 'analytics',
    result: 'Вмієте знаходити UX/CX-проблеми і вести CRO-тести',
  },
  {
    id: 'analytics',
    kind: 'targeted',
    name: 'Воронка, аналітика і маркетингова математика',
    hook: 'Продажі впали? Тепер знатимеш чому.',
    levels: [3],
    audience: 'Власникам і керівникам, що приймають рішення за цифрами',
    price: 700,
    duration: '4 тижні',
    practice: [
      'Практикум: GA4 + GTM з нуля — event taxonomy, Data Layer, e-commerce tracking',
      'Збірка дашборда керівника в Looker Studio на своїх даних',
      'Розрахунок CAC/LTV/MER і contribution margin свого бізнесу',
      'Діагностика падіння продажів за фреймворком рівня',
    ],
    next: 'marketing',
    result: 'Читаєте воронку, атрибуцію, когорти і діагностуєте падіння продажів',
  },
  {
    id: 'seo-dev',
    kind: 'targeted',
    name: 'SEO, GEO/AEO і управління розробкою',
    hook: 'Google любить архітектуру. AI-пошук — тим паче.',
    levels: [4],
    audience: 'Маркетологам і керівникам, що працюють із розробниками',
    price: 1400,
    duration: '6 тижнів',
    practice: [
      'Technical SEO-аудит свого сайту: Core Web Vitals, crawl budget, індексація',
      'Чек-лист видимості в AI-пошуку: AI Overviews, GEO/AEO, LLM citations',
      'Зв’язний кейс: постановка SEO-задач розробці — від ТЗ до приймання',
      'Шаблон SEO-міграції без втрати трафіку',
    ],
    next: 'marketing',
    result: 'Розумієте SEO- і GEO-архітектуру та ставите задачі розробці',
  },
  {
    id: 'architecture',
    kind: 'targeted',
    name: 'Технічна архітектура, дані та безпека',
    hook: 'ERP, CRM, PIM — і жодного страху абревіатур.',
    levels: [5],
    audience: 'Керівникам e-commerce і технічним менеджерам',
    price: 1400,
    duration: '6 тижнів',
    practice: [
      'Розбір 2 реальних схем інтеграцій: від моноліту до event-driven',
      'Карта вендорів: що обрати на кожен шар в Україні та ЄС',
      'Аудит безпеки за чек-листом: PCI DSS, GDPR, backup, disaster recovery',
      'Проєктування власної data-архітектури: DWH, ETL, Single Source of Truth',
    ],
    next: 'crm-ltv',
    result: 'Проєктуєте інтеграції, data-архітектуру і керуєте ризиками безпеки',
  },
  {
    id: 'marketing',
    kind: 'targeted',
    name: 'Маркетинг, трафік і бренд',
    hook: 'Бюджет — у канали, а не в порожнечу.',
    levels: [6],
    audience: 'Маркетологам і керівникам маркетингу',
    price: 1800,
    duration: '7 тижнів',
    practice: [
      'Шаблон медіаплану і модель бюджетування за каналами',
      'Система тестування креативів: гіпотези, цикли, метрики',
      'Розрахунок incremental CAC і marginal ROAS на своїх цифрах',
      'Карта бренду: позиціонування, диференціація, brand vs performance',
    ],
    next: 'crm-ltv',
    result: 'Керуєте каналами, економікою залучення і брендом',
  },
  {
    id: 'crm-ltv',
    kind: 'targeted',
    name: 'CRM, CDP, утримання і LTV',
    hook: 'Новий клієнт — дорого. Повторний — розумно.',
    levels: [7],
    audience: 'CRM-маркетологам і керівникам retention',
    price: 1100,
    duration: '5 тижнів',
    practice: [
      'Hands-on: збірка тригерних сценаріїв в eSputnik/Klaviyo',
      'Бібліотека готових сценаріїв: welcome, кинутий кошик, win-back, реактивація',
      'RFM-сегментація своєї бази і розрахунок LTV по когортах',
      'Проєктування програми лояльності з економікою',
    ],
    next: 'marketplaces',
    result: 'Будуєте повторні продажі, сегментацію, лояльність і рахуєте LTV',
  },
  {
    id: 'marketplaces',
    kind: 'targeted',
    name: 'Маркетплейси і міжнародна експансія',
    hook: 'Алгоритм ранжування — не ворог, а інструкція.',
    levels: [8],
    audience: 'Менеджерам маркетплейсів і власникам брендів',
    price: 1100,
    duration: '5 тижнів',
    practice: [
      'Специфіка платформ окремими розборами: Rozetka, Prom, Amazon, eBay',
      'Операційка: фулфілмент, повернення, account health, захист карток',
      'Marketplace P&L і юніт-економіка каналу на своїх цифрах',
      'Roadmap виходу на новий ринок: від вибору країни до локальних платежів',
    ],
    next: 'finance',
    result: 'Рахуєте економіку каналів і виводите бренд на нові ринки',
  },
  {
    id: 'finance',
    kind: 'targeted',
    name: 'Фінанси, pricing і юніт-економіка',
    hook: 'Оборот — це марнославство. Прибуток — здоровʼя.',
    levels: [9],
    audience: 'Власникам і керівникам, що відповідають за прибуток',
    price: 1800,
    duration: '8 тижнів',
    practice: [
      'Готова Excel/Sheets-модель юніт-економіки — заповнюєш своїми цифрами',
      'Цінова стратегія: еластичність, промо-економіка, price waterfall',
      'ABC/XYZ-аналіз асортименту і GMROI своїх категорій',
      'Модель demand forecasting і safety stock для свого складу',
    ],
    next: 'director',
    result: 'Читаєте P&L, керуєте ціною, асортиментом і запасами за цифрами',
  },
  {
    id: 'fractional',
    kind: 'targeted',
    name: 'Консалтинг і Fractional Director',
    hook: 'Твоя експертиза варта більше, ніж одна зарплата.',
    levels: [12],
    audience: 'Досвідченим спеціалістам, що виходять у консалтинг',
    price: 1800,
    duration: '4 тижні',
    practice: [
      'Пакет шаблонів консультанта: договір, КП, звіт клієнту, діагностичний аудит',
      'Стажування через карʼєрний трек: участь у реальному аудиті поруч із практиками',
      'Розробка власної продуктової лінійки послуг і прайса',
      'Особистий бренд: контент-план і воронка вхідних лідів',
    ],
    next: 'full',
    result: 'Продаєте експертизу, ведете кілька проєктів, будуєте бренд',
  },

  // -------- Експертні курси (рівні 13–15) --------
  {
    id: 'product-management',
    kind: 'targeted',
    name: 'Product Management в e-commerce',
    hook: 'Магазин — це продукт. Керуй ним як продакт.',
    levels: [13],
    audience: 'Керівникам e-commerce, продактам і власникам, що будують продуктову культуру',
    price: 3300,
    duration: '8 тижнів',
    practice: [
      'Product roadmap свого магазину: від vision до кварталу',
      'Пріоритизація реального бэклогу за RICE/ICE із захистом рішень',
      'North Star Metric і дерево продуктових метрик для свого бізнесу',
      'Скрипт discovery-інтервʼю і перевірка продуктової гіпотези',
    ],
    next: 'ai-commerce',
    expert: true,
    result: 'Статус Head of Product: стратегія, discovery, експерименти, метрики',
  },
  {
    id: 'omni-b2b',
    kind: 'targeted',
    name: 'Omnichannel і B2B Commerce',
    hook: 'Один клієнт. Один склад. Одна ціна. Всюди.',
    levels: [14],
    audience: 'Ритейлу з офлайном, брендам із дилерами, B2B-виробникам',
    price: 3500,
    duration: '8 тижнів',
    practice: [
      'Omnichannel P&L: модель економіки всіх каналів разом',
      'Blueprint Click & Collect і Ship From Store для своєї мережі',
      'ТЗ на B2B-портал: customer-specific pricing, approval workflows, EDI',
      'Схема єдиного customer ID між офлайном, сайтом і маркетплейсами',
    ],
    next: 'full',
    expert: true,
    result: 'Статус Omnichannel Lead: єдина система каналів і B2B-продажі',
  },
  {
    id: 'ai-commerce',
    kind: 'targeted',
    name: 'AI Commerce',
    hook: 'Поки конкуренти «тестують ChatGPT», ти будуєш AI-систему.',
    levels: [15],
    audience: 'Директорам і власникам, що впроваджують AI системно, а не хаотично',
    price: 3900,
    duration: '8 тижнів',
    practice: [
      'AI maturity assessment свого бізнесу і карта use-case-ів з ROI',
      'Специфікація пілотного AI-агента: від сервісу до agentic commerce',
      'Чек-лист видимості бренду в AI-пошуку: GEO/AEO, LLM citations',
      'Шаблон AI governance: політика, ризики, контроль якості',
    ],
    next: 'full',
    expert: true,
    result: 'Статус AI-Driven Director: AI-стратегія, агенти, персоналізація, GEO',
  },
];

export function courseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function courseLevels(course: Course) {
  return LEVELS.filter((l) => course.levels.includes(l.n));
}

export function courseStats(course: Course) {
  const ls = courseLevels(course);
  return {
    modules: ls.reduce((s, l) => s + l.modules, 0),
    questions: ls.reduce((s, l) => s + l.questions, 0),
    levels: ls.length,
  };
}

export function levelsLabel(course: Course): string {
  if (course.levels.length === LEVELS.length) return `Усі ${LEVELS.length} рівнів`;
  if (course.levels.length === 1) return `Рівень ${course.levels[0]}`;
  return `Рівні ${course.levels[0]}–${course.levels[course.levels.length - 1]}`;
}
