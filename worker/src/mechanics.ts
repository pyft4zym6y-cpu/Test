/**
 * Аудит маркетинговых механик магазина: реестр 34 механик в 5 контурах
 * (средний чек / удержание / конверсия / доверие / охват). Для каждой —
 * внешняя детекция из обхода (блоки, ссылки, сигналы, текст), статус
 * есть / не видно / проверить, эффект и приоритет внедрения.
 * «Не видно снаружи» честно отличается от «нет» — часть механик живёт в
 * email/CRM и подтверждается только на A1.
 */
import type { AuditDataset } from './report.js';
import type { Dim } from './pagereport.js';

export type MechStatus = 'есть' | 'нет' | 'проверить' | 'не видно снаружи';
export type MechRow = {
  group: string; name: string; what: string;
  status: MechStatus; signal: string; effect: string;
  pr: 'P0' | 'P1' | 'P2'; dims: Dim[];
};
export type MechanicsReport = {
  client: string; takenAt: string;
  rows: MechRow[];
  byGroup: { group: string; have: number; total: number }[];
  score: { have: number; measurable: number; pct: number };
  strengths: string[]; weaknesses: string[];
  recommendations: { pr: 'P0' | 'P1' | 'P2'; action: string; effect: string }[];
  verdict: string;
  conclusion: string[];
};

export function buildMechanics(ds: AuditDataset): MechanicsReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const block = (k: string) => pages.some((p) => p.ux?.blocks?.[k]);
  const links = ds.client.links ?? [];
  const href = (re: RegExp) => links.some((h) => { try { return re.test(new URL(h).pathname.toLowerCase()); } catch { return false; } });
  const sig = (re: RegExp) => ds.client.tech.signals.some((s) => re.test(s));
  const pt = (id: string) => ds.client.pageTypes?.find((t) => t.id === id);
  const ptFound = (id: string) => { const t = pt(id); return Boolean(t && t.status !== 'не найдена'); };

  const rows: MechRow[] = [];
  const add = (group: string, name: string, what: string, detected: boolean | null, signal: string, effect: string, pr: MechRow['pr'], dims: Dim[], uncertain = false) => {
    const status: MechStatus = detected === null ? 'не видно снаружи' : detected ? 'есть' : uncertain ? 'проверить' : 'нет';
    rows.push({ group, name, what, status, signal, effect, pr, dims });
  };

  /* ── 1 · Средний чек (AOV) ── */
  const G1 = 'Средний чек (AOV)';
  add(G1, 'Cross-sell на карточке', '«С этим покупают» / похожие товары на PDP', block('related'), block('related') ? 'блок рекомендаций найден' : 'блок рекомендаций не обнаружен на разобранных PDP', '+10–25% к AOV (ориентир, проверить данными)', 'P0', ['CRO', 'COMM']);
  add(G1, 'Cross-sell в корзине', 'Рекомендации в корзине перед чекаутом', pages.some((p) => p.kind === 'cart' && p.ux?.blocks?.related), 'по составу блоков корзины', 'Последний шанс дополнить заказ без давления', 'P1', ['CRO']);
  add(G1, 'Upsell (апгрейд выбора)', 'Предложение старшей версии/комплектации на PDP', null, 'внешне отличим от cross-sell только вручную', 'Сдвиг чека вверх без роста трафика', 'P1', ['CRO', 'PRICE']);
  add(G1, 'Наборы / бандлы', 'Готовые комплекты со скидкой от суммы позиций', href(/nabor|komplekt|bundle|set/) || block('related'), 'по URL-паттернам и блокам', 'AOV + распродажа связанных остатков', 'P1', ['COMM', 'PRICE']);
  add(G1, 'Порог бесплатной доставки', '«До бесплатной доставки осталось …»', block('free_ship_progress'), block('free_ship_progress') ? 'порог/прогресс бесплатной доставки упоминается' : 'индикатор порога бесплатной доставки не обнаружен', 'Классический двигатель дозаказа до порога', 'P0', ['CRO', 'COMM']);
  add(G1, 'Количественные скидки', 'Скидка от количества (2+1, опт от N шт.)', href(/opt|wholesale/) ? true : null, href(/opt|wholesale/) ? 'оптовый раздел найден' : 'снаружи не видно', 'Сдвиг распределения чека вправо', 'P2', ['PRICE']);
  add(G1, 'Подарочные сертификаты', 'Продажа сертификатов как товара', ptFound('gift-cert') || href(/gift|sertifikat|podarok/), 'по карте типов страниц', 'Новый сценарий покупки + предоплата без себестоимости', 'P2', ['COMM', 'MKT']);

  /* ── 2 · Удержание (Retention / LTV) ── */
  const G2 = 'Удержание (LTV)';
  add(G2, 'Захват контакта (подписка)', 'Email/SMS-подписка с внятной ценностью', block('newsletter'), block('newsletter') ? 'форма подписки найдена' : 'форма подписки не обнаружена', 'Вход в самый дешёвый канал повторных продаж', 'P0', ['MKT', 'CRO']);
  add(G2, 'Бонусные баллы / кэшбек', 'Программа накопления баллов за покупки', block('bonus_points') || href(/bonus|loyalty|cashback/), block('bonus_points') || href(/bonus|loyalty|cashback/) ? 'упоминание баллов/раздел лояльности найдены' : 'раздел/упоминание баллов не обнаружены', '+повторные покупки, защита от ценовой гонки', 'P0', ['MKT', 'COMM']);
  add(G2, 'Программа лояльности (уровни)', 'Статусы/уровни клиента с растущей выгодой', href(/loyalty|club|vip/), 'по URL-паттернам', 'Удержание тяжёлых покупателей', 'P2', ['MKT']);
  add(G2, 'Реферальная программа', '«Приведи друга» с выгодой обеим сторонам', block('referral') || href(/referral|refer|privedi/), block('referral') ? 'упоминание найдено' : 'снаружи не обнаружена', 'Самый дешёвый источник доверенного трафика', 'P2', ['MKT']);
  add(G2, 'Брошенная корзина', 'Email/push-триггер о забытых товарах', null, 'работает в email/CRM — снаружи не видно, проверяется на A1', 'Возврат 5–15% брошенных корзин (ориентир)', 'P1', ['MKT', 'CRO']);
  add(G2, 'Wishlist / избранное', 'Сохранение товаров на потом + триггеры по ним', block('wishlist') || ptFound('wishlist'), block('wishlist') ? 'кнопки избранного найдены' : 'кнопки/раздел избранного не обнаружены', 'Захват отложенного спроса + повод для триггеров', 'P1', ['UX', 'MKT']);
  add(G2, 'Личный кабинет с историей', 'Повторный заказ в один клик из истории', ptFound('account'), 'по карте типов страниц', 'Снижение трения повторной покупки', 'P1', ['UX', 'COMM']);
  add(G2, 'Подписка на товар (replenishment)', 'Регулярная доставка расходников со скидкой', null, 'внешне не видно', 'Предсказуемый повторный оборот', 'P2', ['COMM']);
  add(G2, 'Уведомление «снова в наличии»', 'Подписка на появление товара', block('back_in_stock') ? true : null, block('back_in_stock') ? 'механика найдена' : 'видно только на карточках отсутствующих товаров — проверяется на A1', 'Спасение спроса при out-of-stock', 'P2', ['CRO']);

  /* ── 3 · Конверсия (CRO) ── */
  const G3 = 'Конверсия';
  add(G3, 'Отзывы с фото на PDP', 'Социальное доказательство в точке решения', pages.some((p) => p.kind === 'pdp' && p.ux?.reviews), 'по разобранным карточкам', 'Двузначный вклад в конверсию карточки (ориентир)', 'P0', ['CRO', 'COMM']);
  add(G3, 'Промокоды', 'Поле промокода + активные промо-механики', block('promo_code'), block('promo_code') ? 'поле промокода найдено' : 'поле промокода не обнаружено', 'Инструмент кампаний и партнёрок', 'P1', ['MKT']);
  add(G3, 'Ограниченные предложения (urgency)', 'Таймеры, «осталось N штук» — честные', block('urgency'), block('urgency') ? 'таймер/срочность найдены' : 'не обнаружены на разобранных страницах', 'Ускорение решения; фальшивые таймеры дают обратный эффект', 'P2', ['CRO']);
  add(G3, 'Акции / распродажа', 'Раздел Sale и ценовые бейджи', ptFound('sale') || href(/sale|akci|promo/), 'по карте типов страниц', 'Трафик на ценовой спрос + распродажа остатков', 'P1', ['COMM', 'PRICE']);
  add(G3, 'Quiz / подбор товара', 'Мастер подбора под задачу («подобрать за 1 мин»)', href(/quiz|podbor|helper/), 'не обнаружен', 'Конверсия неопределившихся + захват контакта', 'P2', ['CRO', 'MKT']);
  add(G3, 'Live-чат / мессенджеры', 'Быстрый вопрос до покупки (чат, Viber/Telegram)', block('messenger') || sig(/chat|intercom|crisp|tawk/i), block('messenger') ? 'чат/мессенджер найден' : 'виджет чата не обнаружен', 'Снятие последнего возражения в моменте', 'P1', ['CRO', 'COMM']);
  add(G3, 'Обратный звонок', 'Callback-виджет / «перезвоним за N минут»', block('callback') ? true : null, block('callback') ? 'механика найдена' : 'часто грузится отложенно — проверить вручную', 'Конверсия телефонной аудитории', 'P2', ['CRO']);
  add(G3, 'Гостевой чекаут', 'Заказ без регистрации', pages.some((p) => p.ux?.guestCheckoutHint), 'по подсказкам на чекауте', 'Минус ~19% брошенных из-за принудительной регистрации (ориентир Baymard)', 'P0', ['CRO', 'UX']);
  add(G3, 'Оплата частями / рассрочка', 'BNPL: оплата частями банка/сервиса', block('installment'), block('installment') ? 'рассрочка/оплата частями упоминается' : 'упоминаний не обнаружено', 'Доступность дорогих позиций — рост конверсии и чека', 'P1', ['COMM', 'PRICE']);
  add(G3, 'Сравнение товаров', 'Инструмент сравнения характеристик', ptFound('compare'), 'по карте типов страниц', 'Помощь в выборе для рациональных категорий', 'P2', ['UX']);

  /* ── 4 · Доверие ── */
  const G4 = 'Доверие';
  add(G4, 'Гарантия и возврат на видном месте', 'Условия возврата в точке решения, не только в футере', block('trust'), 'по блокам доверия на страницах', 'Снятие риска — базовое условие оплаты', 'P0', ['COMM', 'LAW']);
  add(G4, 'Платёжные логотипы и способы', 'Visa/MC/Apple Pay/наложенный — видимые', block('payment'), 'по платёжным сигналам', 'Сигнал «здесь безопасно платить»', 'P1', ['COMM', 'SEC']);
  add(G4, 'Отзывы о магазине (не товаре)', 'Страница/виджет репутации магазина', ptFound('reviews-page'), 'по карте типов страниц', 'Доверие новичка к самому магазину', 'P1', ['COMM', 'MKT']);
  add(G4, 'Реальные реквизиты и адрес', 'Юрлицо, адрес, телефоны — легко находимы', pages.some((p) => p.checks.some((c) => c.id === 'contacts' && c.pass)), 'по проверкам контактов', 'Юридическое доверие + требования закона', 'P1', ['LAW', 'COMM']);
  add(G4, 'UGC / фото покупателей', 'Галереи покупателей, отметки из соцсетей', null, 'внешне сложно отличить от стоковых — вручную', 'Живое доказательство против студийных фото', 'P2', ['COMM', 'MKT']);

  /* ── 5 · Охват ── */
  const G5 = 'Охват';
  add(G5, 'Соцсети привязаны и живут', 'Ссылки на активные соцсети', pages.some((p) => p.checks.some((c) => c.id === 'social' && c.pass)), 'по проверкам соцсетей', 'Прогрев и ретаргетинг-аудитории', 'P1', ['MKT']);
  add(G5, 'Блог / контент-хаб', 'Материалы под информационный спрос, связанные с каталогом', ptFound('blog') || href(/blog|article/), 'по карте типов страниц', 'Органика + GEO/AEO-видимость', 'P1', ['SEO', 'CONT']);
  add(G5, 'Маркетплейс-присутствие', 'Собственные витрины на Rozetka/Prom и т.п.', null, 'вне сайта — проверяется внешним поиском на A1', 'Канал + контроль цены в канале', 'P1', ['MKT', 'COMP']);
  add(G5, 'Партнёрская программа', 'Партнёрки/аффилиаты для вебмастеров', href(/partner|affiliate/), 'не обнаружена', 'Оплата за результат вместо ставок аукциона', 'P2', ['MKT']);

  /* ── Агрегаты ── */
  const measurableRows = rows.filter((r) => r.status !== 'не видно снаружи');
  const haveRows = rows.filter((r) => r.status === 'есть');
  const groups = Array.from(new Set(rows.map((r) => r.group)));
  const byGroup = groups.map((g) => ({ group: g, have: rows.filter((r) => r.group === g && r.status === 'есть').length, total: rows.filter((r) => r.group === g).length }));
  const pct = measurableRows.length ? Math.round((haveRows.length / measurableRows.length) * 100) : 0;

  const missing = rows.filter((r) => r.status === 'нет');
  const strengths = haveRows.slice(0, 6).map((r) => `${r.name} (${r.group.toLowerCase()}): ${r.signal}`);
  const weakGroups = byGroup.filter((g) => g.have / Math.max(1, g.total) < 0.34).map((g) => g.group);
  const weaknesses = [
    ...(weakGroups.length ? [`Целые контуры почти не задействованы: ${weakGroups.join(', ')} — это не отдельные упущения, а незанятые направления`] : []),
    ...missing.filter((r) => r.pr === 'P0').map((r) => `${r.name}: ${r.signal} — ${r.effect.toLowerCase()}`),
  ];
  const recommendations = missing
    .sort((a, b) => a.pr.localeCompare(b.pr))
    .slice(0, 10)
    .map((r) => ({ pr: r.pr, action: `Внедрить: ${r.name} — ${r.what.toLowerCase()}`, effect: r.effect }));

  const verdict = !pages.length ? 'Механики не оценены — сайт не разобран.'
    : pct >= 60 ? `Маркетинговый каркас собран на ${pct}%: базовые механики работают, резерв — в тонких контурах.`
    : pct >= 35 ? `Из измеримых механик работает ${pct}% — витрина продаёт, но арсенал среднего чека и удержания задействован частично.`
    : `Работает лишь ${pct}% измеримых механик: магазин конкурирует товаром и ценой там, где конкуренты работают системой механик.`;

  const hidden = rows.filter((r) => r.status === 'не видно снаружи').length;
  const p0missing = missing.filter((r) => r.pr === 'P0');
  const conclusion = [
    `Реестр покрывает ${rows.length} механик в ${groups.length} контурах: средний чек, удержание, конверсия, доверие, охват. Внешне измеримы ${measurableRows.length}; из них активны ${haveRows.length} (${pct}%). Ещё ${hidden} механик живут в email/CRM/кампаниях и снаружи не видны — они помечены отдельным статусом и проверяются доступами, а не записываются в «нет».`,
    p0missing.length
      ? `Критичные отсутствующие механики (P0): ${p0missing.map((r) => r.name.toLowerCase()).join('; ')}. Их объединяет одно: каждая работает с уже оплаченным трафиком — то есть внедрение окупается без роста рекламного бюджета.`
      : 'Все критичные (P0) механики присутствуют — редкая конфигурация; фокус смещается на тонкую настройку и измерение вклада каждой механики.',
    `Контур с наибольшим незанятым полем — ${byGroup.slice().sort((a, b) => a.have / Math.max(1, a.total) - b.have / Math.max(1, b.total))[0]?.group.toLowerCase()}. Механики внедряются не залпом, а по приоритету P0 → P1 → P2 с замером эффекта каждой: без замера реестр превращается в карго-культ «у всех есть — и нам надо».`,
  ];

  return { client, takenAt: ds.takenAt, rows, byGroup, score: { have: haveRows.length, measurable: measurableRows.length, pct }, strengths, weaknesses, recommendations, verdict, conclusion };
}
