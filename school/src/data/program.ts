// Програма «E-Commerce Director» — з методології школи Commerce Architecture
// Джерело: Ecommerce_Training_ByLevels_v10 (12 рівнів · 114 модулів · 1325 питань)

export type TrackId = 'base' | 'middle' | 'advanced';

export interface Level {
  n: number;
  title: string;
  status: string;
  modules: number;
  questions: number;
  track: TrackId;
  summary: string;
}

export const LEVELS: Level[] = [
  {
    n: 1,
    title: 'Що таке інтернет-магазин',
    status: 'Новачок',
    modules: 6,
    questions: 70,
    track: 'base',
    summary:
      'Будова інтернет-магазину: сторінки, шлях покупця сайтом, перше враження, картка товару, фільтри та пошук.',
  },
  {
    n: 2,
    title: 'UX/UI і поведінка користувача',
    status: 'Junior',
    modules: 15,
    questions: 160,
    track: 'base',
    summary:
      'Як думає покупець: візуальна ієрархія, CRO та A/B-тести, UX-дослідження, мобільний UX, персоналізація та AI.',
  },
  {
    n: 3,
    title: 'Воронка продажів і базова аналітика',
    status: 'Junior+',
    modules: 3,
    questions: 46,
    track: 'base',
    summary:
      'Читання воронки продажів, ключові метрики магазину, джерела трафіку та діагностика падіння продажів.',
  },
  {
    n: 4,
    title: 'SEO, технології та управління розробкою',
    status: 'Middle',
    modules: 9,
    questions: 106,
    track: 'base',
    summary:
      'SEO-архітектура, технологічний стек інтернет-магазину та професійне управління командою розробки.',
  },
  {
    n: 5,
    title: 'Технічна архітектура та інтеграції',
    status: 'Technical Director',
    modules: 9,
    questions: 88,
    track: 'middle',
    summary:
      'E-commerce система як єдине ціле: інтеграції, ERP/CRM/PIM/CDP, мастер-дані та відмовостійка інфраструктура.',
  },
  {
    n: 6,
    title: 'Маркетинг і трафік',
    status: 'Middle+',
    modules: 12,
    questions: 146,
    track: 'middle',
    summary:
      'Управління маркетинговими каналами, задачі PPC- і SEO-командам, атрибуція та розподіл бюджету.',
  },
  {
    n: 7,
    title: 'CRM, утримання і LTV',
    status: 'Senior',
    modules: 7,
    questions: 79,
    track: 'middle',
    summary:
      'Система повторних продажів: RFM-сегментація, життєвий цикл клієнта та розрахунок LTV.',
  },
  {
    n: 8,
    title: 'Маркетплейси та міжнародний e-com',
    status: 'Senior+',
    modules: 6,
    questions: 79,
    track: 'middle',
    summary:
      'Продажі через маркетплейси, юніт-економіка каналів та вихід на закордонні ринки.',
  },
  {
    n: 9,
    title: 'Фінанси, операції та асортимент',
    status: 'Lead',
    modules: 11,
    questions: 141,
    track: 'advanced',
    summary:
      'P&L і Cash Flow, юніт-економіка на рівні SKU, операції, логістика, асортимент і закупівлі на основі даних.',
  },
  {
    n: 10,
    title: 'Команда, аналітика та управління проєктами',
    status: 'Director−',
    modules: 10,
    questions: 137,
    track: 'advanced',
    summary:
      'Побудова команди, підрядники, просунута аналітика, впровадження AI та ведення проєктів до результату.',
  },
  {
    n: 11,
    title: 'Стратегія, масштабування та директорське мислення',
    status: 'E-Commerce Director',
    modules: 16,
    questions: 170,
    track: 'advanced',
    summary:
      'Мислення на рівні директора: стратегія на 1–3 роки, ріст і кризи, інвестиційні рішення, Soft Skills керівника.',
  },
  {
    n: 12,
    title: 'Консалтинг і Fractional Director',
    status: 'Незалежний експерт',
    modules: 10,
    questions: 103,
    track: 'advanced',
    summary:
      'Монетизація експертизи поза наймом: продаж консалтингу, кілька проєктів одночасно, особистий бренд і масштабування практики.',
  },
];

export const TOTALS = {
  levels: LEVELS.length,
  modules: LEVELS.reduce((s, l) => s + l.modules, 0),
  questions: LEVELS.reduce((s, l) => s + l.questions, 0),
};

export interface Course {
  id: string;
  name: string;
  levels: string;
  audience: string;
  result: string;
  points: string[];
  featured?: boolean;
}

export const COURSES: Course[] = [
  {
    id: 'foundation',
    name: 'Фундамент',
    levels: 'Рівні 1–4',
    audience: 'Новачкам і Junior-спеціалістам, власникам малих магазинів',
    result: 'Статус: Middle-спеціаліст',
    points: [
      'Будова інтернет-магазину та шлях покупця',
      'UX/UI, CRO та поведінка користувача',
      'Воронка продажів і базова аналітика',
      'SEO-архітектура та управління розробкою',
    ],
  },
  {
    id: 'professional',
    name: 'Професіонал',
    levels: 'Рівні 5–8',
    audience: 'Middle-спеціалістам, маркетологам, керівникам напрямів',
    result: 'Статус: Senior+ спеціаліст',
    points: [
      'Технічна архітектура та інтеграції (ERP, CRM, PIM)',
      'Маркетинг, трафік і розподіл бюджету',
      'CRM, утримання клієнтів і LTV',
      'Маркетплейси та міжнародний e-com',
    ],
  },
  {
    id: 'director',
    name: 'Директор',
    levels: 'Рівні 9–12',
    audience: 'Senior-спеціалістам і керівникам, що ростуть до C-level',
    result: 'Статус: E-Commerce Director / незалежний експерт',
    points: [
      'Фінанси, P&L та юніт-економіка',
      'Команда, просунута аналітика, AI',
      'Стратегія та директорське мислення',
      'Консалтинг і модель Fractional Director',
    ],
  },
  {
    id: 'full',
    name: 'E-Commerce Director. Повна програма',
    levels: 'Усі 12 рівнів',
    audience: 'Тим, хто йде повний шлях: від новачка до директора',
    result: 'Готовність до ролі E-Commerce Director і архітектора e-commerce систем',
    points: [
      '12 рівнів компетентності — від Новачка до Незалежного експерта',
      '114 навчальних модулів',
      '1325 екзаменаційних питань',
      'Чек-листи компетенцій після кожного рівня',
    ],
    featured: true,
  },
];

export const CONTACTS = {
  email: 'pashasidorenko18@gmail.com',
  phone: '+38 099 918 82 60',
  phoneHref: 'tel:+380999188260',
  linkedin: 'https://linkedin.com/in/pvsidorenko',
  agency: 'https://weexp.agency',
  agencyAbout: 'https://weexp.agency/about',
};
