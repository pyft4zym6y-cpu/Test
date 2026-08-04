/** Боли и цели → рекомендуемый трек доменов (номера листов фреймворка). База 10/11/12 всегда. */
export type Pain = { id: string; title: string; desc: string; sheets: string[] };

export const PAINS: Pain[] = [
  { id: 'sales_drop', title: 'Падают продажи', desc: 'Оборот снижается или стоит, хотя раньше рос.', sheets: ['21', '22', '20', '24', '35'] },
  { id: 'no_scale', title: 'Упёрлись в потолок', desc: 'Рост ×2 ломает процессы: платформа, склад, команда или деньги.', sheets: ['28', '29', '32', '31', '30'] },
  { id: 'ads_expensive', title: 'Реклама дорожает, прибыль — нет', desc: 'CAC растёт, выключили бюджет — продажи упали.', sheets: ['21', '22', '23', '24', '25'] },
  { id: 'low_conversion', title: 'Низкая конверсия сайта', desc: 'Трафик есть, а покупок мало: корзина, чекаут, карточки.', sheets: ['35', '28', '21', '24', '13'] },
  { id: 'low_repeat', title: 'Мало повторных покупок', desc: 'База есть, но покупают один раз. Email почти не работает.', sheets: ['23', '14', '35', '21'] },
  { id: 'channel_dep', title: 'Зависимость от одного канала', desc: 'Один канал даёт большую часть выручки — риск, а не система.', sheets: ['21', '26', '22', '20'] },
  { id: 'no_brand', title: 'Не отличаемся от конкурентов', desc: 'Покупатель сравнивает только цену. Бренд не продаёт.', sheets: ['15', '16', '17', '18', '13'] },
  { id: 'returns', title: 'Высокие возвраты и невыкуп', desc: 'Заказы не доходят до выручки: отказы на почте, возвраты.', sheets: ['29', '35', '13', '30'] },
  { id: 'eu_markets', title: 'Хотим на новые рынки / в ЕС', desc: 'Экспорт, маркетплейсы ЕС, юрлицо, логистика, локализация.', sheets: ['27', '26', '28', '31'] },
  { id: 'ops_chaos', title: 'Ручные операции и хаос', desc: 'Заказы, остатки, статусы — руками. Ошибки растут с объёмом.', sheets: ['29', '28', '30', '34', '33'] },
  { id: 'assortment', title: 'Ассортимент не управляется', desc: 'Непонятно, что заказывать и что лежит мёртвым складом.', sheets: ['30', '31', '25', '29'] },
  { id: 'no_data', title: 'Решения без цифр', desc: 'Нет сквозной аналитики и юнит-экономики.', sheets: ['24', '31', '23', '34'] },
  { id: 'cashflow', title: 'Кассовые разрывы', desc: 'Оборот есть, а денег постоянно не хватает.', sheets: ['31', '30', '25', '29'] },
  { id: 'old_tech', title: 'Платформа тормозит развитие', desc: 'Сайт/учёт устарели: каждое изменение — боль и долго.', sheets: ['28', '33', '29', '24'] },
  { id: 'no_team', title: 'Нет команды или компетенций', desc: 'Некому делать: e-com держится на 1–2 людях.', sheets: ['32', '34', '12'] },
  { id: 'exit_prep', title: 'Готовим к инвестору / продаже', desc: 'Нужны управляемость, цифры и рост стоимости бизнеса.', sheets: ['31', '34', '11', '32', '15'] },
];

export type Goal = { id: string; title: string; sheets: string[] };

export const GOALS: Goal[] = [
  { id: 'g_sales', title: 'Рост продаж в Украине', sheets: ['21', '22', '20'] },
  { id: 'g_eu', title: 'Выход в Европу / экспорт', sheets: ['27', '26', '31'] },
  { id: 'g_profit', title: 'Рост прибыли и маржи', sheets: ['31', '25', '30'] },
  { id: 'g_organic', title: 'Меньше зависеть от платного трафика', sheets: ['22', '23', '16'] },
  { id: 'g_ltv', title: 'Повторные покупки и LTV', sheets: ['23', '35', '14'] },
  { id: 'g_brand', title: 'Построить сильный бренд', sheets: ['16', '17', '18', '15'] },
  { id: 'g_system', title: 'Систематизация и автоматизация', sheets: ['29', '28', '34', '33'] },
  { id: 'g_channels', title: 'Новые каналы (D2C, маркетплейсы)', sheets: ['26', '20', '21'] },
  { id: 'g_invest', title: 'Инвестор / продажа компании', sheets: ['31', '34', '32'] },
];

export const CHANNELS = [
  'Свой интернет-магазин',
  'Rozetka',
  'Prom.ua',
  'Другие маркетплейсы UA',
  'Instagram / TikTok',
  'Amazon / eBay',
  'Allegro / Kaufland',
  'Офлайн-точки',
  'Опт / B2B / дилеры',
];

export const BASE_SHEETS = ['10', '11', '12'];

/* Спец-ID в таблице answers */
export const PAINS_QID = 'PAINS';
export const PAINS_CUSTOM_QID = 'PAINS-CUSTOM';
export const GOALS_QID = 'GOALS';
export const GOALS_CUSTOM_QID = 'GOALS-CUSTOM';
export const PASSPORT_QID = 'PASSPORT'; // JSON
export const LINKS_QID = 'LINKS'; // JSON {direct, indirect, refs}

export type Passport = {
  name?: string;
  site?: string;
  offer?: string;
  niche?: string;
  channels?: string[];
  geo?: string;
  revenue?: string;
  team?: string;
};

export type LinkItem = { url: string; note: string };
export type Links = { direct: LinkItem[]; indirect: LinkItem[]; refs: LinkItem[] };

/** Персональный трек: база + домены целей и болей по частоте. */
export function trackFor(painIds: string[], goalIds: string[] = []): string[] {
  const score: Record<string, number> = {};
  const bump = (sheets: string[], mult: number) =>
    sheets.forEach((s, i) => {
      score[s] = (score[s] ?? 0) + (sheets.length - i) * mult;
    });
  for (const gid of goalIds) {
    const g = GOALS.find((x) => x.id === gid);
    if (g) bump(g.sheets, 1.2);
  }
  for (const pid of painIds) {
    const p = PAINS.find((x) => x.id === pid);
    if (p) bump(p.sheets, 1);
  }
  const ranked = Object.entries(score)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);
  return [...BASE_SHEETS, ...ranked.filter((s) => !BASE_SHEETS.includes(s))];
}
