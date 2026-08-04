/** Боли и цели → рекомендуемый трек доменов (номера листов фреймворка). База 10/11/12 всегда. */
export type Horizon = 'tactical' | 'strategic';
export type Pain = {
  id: string;
  title: string;
  desc: string;
  sheets: string[];
  horizon?: Horizon; // по умолчанию strategic
  fix?: string; // тактические: первая помощь на 24–48 часов
  accesses?: string[]; // тактические: какие доступы нужны в первую очередь
};

/** Тактика: горит прямо сейчас — решается днями, не месяцами. */
export const TACTICAL_PAINS: Pain[] = [
  {
    id: 'fire_sales', title: 'Продажи обвалились на этой неделе', horizon: 'tactical',
    desc: 'Резкое падение к прошлой неделе/месяцу — причина неизвестна.',
    fix: 'Проверить три причины 80% обвалов: рекламные кабинеты (статус/бюджет), остатки топ-SKU, работоспособность чекаута.',
    sheets: ['21', '20', '28'], accesses: ['AC-01', 'AC-07', 'AC-08'],
  },
  {
    id: 'fire_ads', title: 'Реклама встала / кабинет заблокирован', horizon: 'tactical',
    desc: 'Meta/Google отклонили объявления или заблокировали аккаунт.',
    fix: 'Апелляция по регламенту площадки + резервный кабинет + временный перенос бюджета в работающий канал (email по базе — самый быстрый).',
    sheets: ['21', '23'], accesses: ['AC-07', 'AC-08', 'AC-09'],
  },
  {
    id: 'fire_site', title: 'Сайт тормозит / ошибки в чекауте', horizon: 'tactical',
    desc: 'Заказы падают из-за технических проблем прямо сейчас.',
    fix: 'Откат последнего релиза + мониторинг ошибок + ручной приём заказов через мессенджер, пока чинится.',
    sheets: ['28', '35'], accesses: ['AC-05', 'AC-06'],
  },
  {
    id: 'fire_cash', title: 'Кассовый разрыв в этом месяце', horizon: 'tactical',
    desc: 'Не хватает денег на закупку/зарплаты в ближайшие недели.',
    fix: 'Платёжный календарь на 4 недели + приоритизация платежей + быстрая распродажа неликвида + договорённости об отсрочках.',
    sheets: ['31', '30'], accesses: ['AC-12', 'AC-13', 'AC-14'],
  },
  {
    id: 'fire_mp', title: 'Маркетплейс заблокировал аккаунт / карточки', horizon: 'tactical',
    desc: 'Rozetka/Prom/Amazon сняли листинги или заморозили кабинет.',
    fix: 'Апелляция по регламенту площадки в первые 24 часа + перенос трафика на сайт + информирование постоянных клиентов.',
    sheets: ['26'], accesses: ['AC-11'],
  },
  {
    id: 'fire_stock', title: 'Сток кончается / поставка сорвалась', horizon: 'tactical',
    desc: 'Топовые позиции уходят в ноль, поставщик подвёл.',
    fix: 'Пересчёт покрытия по топ-SKU + альтернативный поставщик + снятие рекламы с позиций в нуле + честные сроки клиентам.',
    sheets: ['30', '29'], accesses: ['AC-14', 'AC-10'],
  },
  {
    id: 'fire_team', title: 'Ушёл ключевой человек', horizon: 'tactical',
    desc: 'Единственный, кто знал систему/рекламу/склад, — ушёл.',
    fix: 'Сменить пароли и доступы в первый день + карта задач недели + временное перераспределение + экстренная передача знаний.',
    sheets: ['32', '34'], accesses: ['EX-01'],
  },
  {
    id: 'fire_season', title: 'Сезон через 4–6 недель — не готовы', horizon: 'tactical',
    desc: 'Пик близко: сток, промо, логистика, люди — не собраны.',
    fix: 'Чек-лист готовности к пику: покрытие стока, промо-план, мощность логистики и поддержки, дежурства.',
    sheets: ['21', '30', '29'], accesses: ['AC-14', 'AC-16'],
  },
];

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

export type Goal = { id: string; title: string; sheets: string[]; horizon?: Horizon };

/** Тактические цели: 90 дней, измеримый результат. */
export const TACTICAL_GOALS: Goal[] = [
  { id: 'gt_stop', title: 'Остановить падение продаж', sheets: ['21', '20', '28'], horizon: 'tactical' },
  { id: 'gt_cash', title: 'Закрыть кассовый разрыв', sheets: ['31', '30'], horizon: 'tactical' },
  { id: 'gt_cr', title: 'Поднять конверсию за 30 дней', sheets: ['35', '28', '21'], horizon: 'tactical' },
  { id: 'gt_base', title: 'Быстрые продажи из своей базы', sheets: ['23'], horizon: 'tactical' },
  { id: 'gt_season', title: 'Подготовиться к сезону', sheets: ['30', '29', '21'], horizon: 'tactical' },
];

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

export type ChannelGroup = { title: string; items: string[] };

export const CHANNEL_GROUPS: ChannelGroup[] = [
  {
    title: 'Собственные каналы',
    items: [
      'Интернет-магазин',
      'Лендинги / промо-сайты',
      'Мобильное приложение',
      'Instagram Shop',
      'TikTok Shop',
      'Facebook Shop',
      'Telegram-магазин / бот',
    ],
  },
  {
    title: 'Маркетплейсы · Украина',
    items: ['Rozetka', 'Prom.ua', 'Епіцентр', 'Kasta', 'MAKEUP', 'OLX'],
  },
  {
    title: 'Маркетплейсы · Европа',
    items: ['Allegro (PL)', 'Amazon EU', 'eBay EU', 'Kaufland', 'eMAG', 'Zalando', 'Etsy', 'Cdiscount / bol.com'],
  },
  {
    title: 'Маркетплейсы · США и мир',
    items: ['Amazon US', 'eBay US', 'Etsy US', 'Walmart', 'TikTok Shop US'],
  },
  {
    title: 'Офлайн и B2B',
    items: ['Свои офлайн-точки', 'Розничные сети', 'Опт / дилеры', 'HoReCa', 'B2B-экспорт', 'Дистрибьюторы'],
  },
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
  sites?: string[];
  offer?: string;
  niche?: string;
  nicheOther?: string;
  channels?: string[];
  channelsOther?: string;
  geo?: string;
  revenue?: string;
  team?: string;
};

export const effectiveNiche = (p: Passport) =>
  p.niche === 'Другая' ? p.nicheOther || 'Другая' : p.niche;

export type LinkItem = { url: string; note: string };
export type Links = { direct: LinkItem[]; indirect: LinkItem[]; refs: LinkItem[] };

export const ALL_PAINS: Pain[] = [...TACTICAL_PAINS, ...PAINS];
export const ALL_GOALS: Goal[] = [...TACTICAL_GOALS, ...GOALS];
export const painById = (id: string) => ALL_PAINS.find((p) => p.id === id);
export const goalById = (id: string) => ALL_GOALS.find((g) => g.id === id);
export const tacticalPainsOf = (ids: string[]) =>
  ids.map(painById).filter((p): p is Pain => Boolean(p && p.horizon === 'tactical'));

/** Персональный трек: тактика ×1.5 (горит — отвечаем первыми), цели ×1.2, боли ×1. */
export function trackFor(painIds: string[], goalIds: string[] = []): string[] {
  const score: Record<string, number> = {};
  const bump = (sheets: string[], mult: number) =>
    sheets.forEach((s, i) => {
      score[s] = (score[s] ?? 0) + (sheets.length - i) * mult;
    });
  for (const gid of goalIds) {
    const g = goalById(gid);
    if (g) bump(g.sheets, g.horizon === 'tactical' ? 1.5 : 1.2);
  }
  for (const pid of painIds) {
    const p = painById(pid);
    if (p) bump(p.sheets, p.horizon === 'tactical' ? 1.5 : 1);
  }
  const ranked = Object.entries(score)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);
  return [...BASE_SHEETS, ...ranked.filter((s) => !BASE_SHEETS.includes(s))];
}
