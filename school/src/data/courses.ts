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
  featured?: boolean;
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
    result: 'Статус Middle: розумієте будову магазину, UX, воронку й SEO',
  },
  {
    id: 'professional',
    kind: 'general',
    name: 'Професіонал',
    hook: 'Система замість зоопарку сервісів.',
    levels: [5, 6, 7, 8],
    audience: 'Middle-спеціалістам, маркетологам, керівникам напрямів',
    result: 'Статус Senior+: архітектура, трафік, CRM і маркетплейси',
  },
  {
    id: 'director',
    kind: 'general',
    name: 'Директор',
    hook: 'P&L більше не кусається.',
    levels: [9, 10, 11, 12],
    audience: 'Senior-спеціалістам і керівникам, що ростуть до C-level',
    result: 'Статус E-Commerce Director: фінанси, команда, стратегія',
  },
  {
    id: 'full',
    kind: 'general',
    name: 'E-Commerce Director. Повний шлях',
    hook: 'Від «що таке кошик» до крісла директора.',
    levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    audience: 'Тим, хто йде повний шлях з нуля до директора',
    result: 'Готовність до ролі E-Commerce Director і незалежного експерта',
    featured: true,
  },

  // -------- Точкові курси --------
  {
    id: 'ux-cro',
    kind: 'targeted',
    name: 'UX/UI та CRO магазину',
    hook: 'Купують не банери. Купують зручність.',
    levels: [2],
    audience: 'Маркетологам, дизайнерам, продактам e-commerce',
    result: 'Вмієте знаходити UX-проблеми і вести CRO-тести',
  },
  {
    id: 'analytics',
    kind: 'targeted',
    name: 'Воронка продажів і аналітика',
    hook: 'Продажі впали? Тепер знатимеш чому.',
    levels: [3],
    audience: 'Власникам і керівникам, що приймають рішення за цифрами',
    result: 'Читаєте воронку, метрики і діагностуєте падіння продажів',
  },
  {
    id: 'seo-dev',
    kind: 'targeted',
    name: 'SEO і управління розробкою',
    hook: 'Google любить архітектуру. Ти теж полюбиш.',
    levels: [4],
    audience: 'Маркетологам і керівникам, що працюють із розробниками',
    result: 'Розумієте SEO-архітектуру і ставите задачі розробці',
  },
  {
    id: 'architecture',
    kind: 'targeted',
    name: 'Технічна архітектура та інтеграції',
    hook: 'ERP, CRM, PIM — і жодного страху абревіатур.',
    levels: [5],
    audience: 'Керівникам e-commerce і технічним менеджерам',
    result: 'Проєктуєте інтеграції і керуєте мастер-даними',
  },
  {
    id: 'marketing',
    kind: 'targeted',
    name: 'Маркетинг і трафік',
    hook: 'Бюджет — у канали, а не в порожнечу.',
    levels: [6],
    audience: 'Маркетологам і керівникам маркетингу',
    result: 'Керуєте каналами, атрибуцією і розподілом бюджету',
  },
  {
    id: 'crm-ltv',
    kind: 'targeted',
    name: 'CRM, утримання і LTV',
    hook: 'Новий клієнт — дорого. Повторний — розумно.',
    levels: [7],
    audience: 'CRM-маркетологам і керівникам retention',
    result: 'Будуєте повторні продажі, сегментацію і рахуєте LTV',
  },
  {
    id: 'marketplaces',
    kind: 'targeted',
    name: 'Маркетплейси і міжнародний e-com',
    hook: 'Алгоритм ранжування — не ворог, а інструкція.',
    levels: [8],
    audience: 'Менеджерам маркетплейсів і власникам брендів',
    result: 'Рахуєте економіку каналів і виходите на нові ринки',
  },
  {
    id: 'finance',
    kind: 'targeted',
    name: 'Фінанси та юніт-економіка',
    hook: 'Оборот — це марнославство. Прибуток — здоровʼя.',
    levels: [9],
    audience: 'Власникам і керівникам, що відповідають за прибуток',
    result: 'Читаєте P&L і рахуєте юніт-економіку до SKU',
  },
  {
    id: 'fractional',
    kind: 'targeted',
    name: 'Консалтинг і Fractional Director',
    hook: 'Твоя експертиза варта більше, ніж одна зарплата.',
    levels: [12],
    audience: 'Досвідченим спеціалістам, що виходять у консалтинг',
    result: 'Продаєте експертизу, ведете кілька проєктів, будуєте бренд',
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
  if (course.levels.length === 12) return 'Усі 12 рівнів';
  if (course.levels.length === 1) return `Рівень ${course.levels[0]}`;
  return `Рівні ${course.levels[0]}–${course.levels[course.levels.length - 1]}`;
}
