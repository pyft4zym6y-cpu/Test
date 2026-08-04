import questionsRaw from '../data/questions.json';
import accessesRaw from '../data/accesses.json';

export type Question = {
  id: string;
  domain: string;
  sheet: string;
  level: string;
  parent: string | null;
  branch: string | null;
  text: string;
  why: string | null;
  type: string;
  options: string[] | null;
  role: string | null;
};

export type Access = {
  id: string;
  system: string;
  category: string;
  why: string;
  level: string;
};

export const QUESTIONS = questionsRaw as Question[];
export const ACCESSES = accessesRaw as Access[];

export const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export const DOMAINS: { key: string; sheet: string; count: number; roles: string[] }[] = [];
for (const q of QUESTIONS) {
  let d = DOMAINS.find((x) => x.key === q.domain);
  if (!d) {
    d = { key: q.domain, sheet: q.sheet, count: 0, roles: [] };
    DOMAINS.push(d);
  }
  if (q.level === 'L1') d.count += 1;
  if (q.role && !d.roles.includes(q.role)) d.roles.push(q.role);
}

const norm = (s: string) => s.toLowerCase().replace(/[«»"']/g, '').trim();

/** Ветка L2 видима, когда родитель отвечен и ответ совпадает с меткой ветки. */
export function isVisible(q: Question, answers: Record<string, string>): boolean {
  if (q.level === 'L1') return true;
  const parentAnswer = q.parent ? answers[q.parent] : undefined;
  if (!parentAnswer || !parentAnswer.trim()) return false;
  if (!q.branch) return true;
  const a = norm(parentAnswer);
  const b = norm(q.branch);
  return a.includes(b) || b.includes(a) || a.includes(b.slice(0, 12));
}

export function optionsFor(q: Question): string[] | null {
  if (q.options && q.options.length) return q.options;
  if (q.type === 'Да/Нет') return ['Да', 'Нет'];
  if (q.type === 'Да/Нет/Частично') return ['Да', 'Частично', 'Нет'];
  if (q.type === 'Шкала 0-5') return ['0', '1', '2', '3', '4', '5'];
  return null;
}

export const ACCESS_GUIDES: Record<string, string> = {
  'AC-01': 'GA4: Администратор → Управление доступами → пригласить e-mail с ролью «Наблюдатель».',
  'AC-02': 'GTM: Администрирование → Управление пользователями → доступ «Чтение» на контейнер.',
  'AC-03': 'Search Console: Настройки → Пользователи и разрешения → добавить с полным доступом на чтение.',
  'AC-04': 'Ahrefs/Serpstat: если нет своего аккаунта — сообщите в комментарии, используем наш.',
  'AC-05': 'Админка сайта: создайте отдельного пользователя с правами «просмотр» на указанный e-mail.',
  'AC-06': 'Хостинг: доступ «только чтение» к панели или SSH read-only; пароли — только через одноразовую ссылку.',
  'AC-07': 'Google Ads: Инструменты → Доступ и безопасность → пригласить e-mail (уровень «Только чтение»).',
  'AC-08': 'Meta Ads: Business Manager → Пользователи → пригласить как «Аналитик» на рекламный аккаунт.',
  'AC-09': 'CRM/ESP: пользователь с правами просмотра; если не выходит — заявка в комментарий.',
  'AC-10': 'ERP/1C/Odoo: read-only пользователь или свежая выгрузка ключевых отчётов.',
  'AC-11': 'Маркетплейсы: доступ «менеджер/аналитик» без прав изменения цен и заказов.',
  'AC-12': 'Управленческая отчётность: файлы P&L за 12–24 мес в защищённую папку (ссылку пришлём).',
  'AC-13': 'Выгрузка заказов за 24 мес: CSV/XLSX из CRM или платформы — номер, дата, сумма, клиент, канал, статус.',
  'AC-14': 'Товары и себестоимость: выгрузка SKU · закупочная цена · остатки.',
  'AC-15': 'Helpdesk: пользователь-наблюдатель или выгрузка тикетов за 6 мес.',
  'AC-16': 'Склад/3PL: read-only доступ или отчёты по остаткам и срокам сборки.',
  'AC-17': 'Юрлица и налоги: перечень юрлиц и режимов — файлом в защищённую папку.',
  'AC-18': 'Бренд-бук: PDF/Figma-ссылка с правами просмотра.',
  'AC-19': 'Исследования клиентов: любые отчёты, опросы, интервью — файлами.',
  'AC-20': 'Отзывы и NPS: выгрузки/скриншоты дашбордов, экспорт отзывов с площадок.',
};

export const STATUSES = ['Не выдан', 'В процессе', 'Выдан', 'Нужна помощь'];
