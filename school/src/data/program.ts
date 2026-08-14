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

export const TRACKS: { id: TrackId; label: string; range: string }[] = [
  { id: 'base', label: 'Базовий блок', range: 'Рівні 1–4' },
  { id: 'middle', label: 'Середній блок', range: 'Рівні 5–8' },
  { id: 'advanced', label: 'Просунутий блок', range: 'Рівні 9–12' },
];
