/**
 * Эталонный прототип страницы ↔ композиция клиента. Инновация метода Commerce OS:
 * страница разбирается не как список дефектов, а как КОМПОЗИЦИЯ — состав и порядок
 * блоков, — и сверяется с эталонной композицией типа страницы из UX-энциклопедии
 * (главы: PDP 23, PLP 22, Cart 24, Checkout 25). Результат — «путь клиента против
 * эталонного пути»: какие блоки эталона есть, каких нет, что нарушает порядок
 * вопросов пользователя. Работает на T1/L0 (без доступов) — по блокам, снятым
 * обходом (`PageAudit.ux.blocks`).
 *
 * Это то, что в примерах называется pdp_comparison / lanavitta_vs_reference.
 */
import type { AuditDataset } from './report.js';
import type { PageAudit, PageKind } from './crawl.js';
import { ask, extractJson, hasKey } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

type Weight = 'core' | 'important' | 'nice';
type Block = { key: string; name: string; role: string; chapter: string; weight: Weight };

/** Эталонные композиции по типам страниц (блок-в-блок из глав UX-энциклопедии). */
const REFERENCE: Partial<Record<PageKind, { title: string; chapter: string; principle?: string; blocks: Block[] }>> = {
  home: {
    title: 'Главная', chapter: 'гл. 11–12, 26, 30',
    principle: 'Витрина за 5 секунд отвечает: куда я попал, что тут есть, можно ли доверять, с чего начать.',
    blocks: [
      { key: 'nav', name: 'Навигация / категории', role: 'информационный запах, вход в каталог', chapter: 'гл. 12', weight: 'core' },
      { key: 'search', name: 'Поиск', role: 'быстрый путь к товару', chapter: 'гл. 15', weight: 'important' },
      { key: 'hero', name: 'Первый экран / оффер', role: 'позиционирование и главный оффер', chapter: 'гл. 17', weight: 'important' },
      { key: 'usp_bar', name: 'УТП / преимущества', role: 'причина покупать здесь', chapter: 'гл. 26', weight: 'important' },
      { key: 'product_grid', name: 'Подборки товаров', role: 'вовлечение в каталог', chapter: 'гл. 30', weight: 'important' },
      { key: 'trust', name: 'Блок доверия', role: 'снятие тревоги на входе', chapter: 'гл. 26', weight: 'important' },
      { key: 'reviews', name: 'Отзывы / соц. доказательство', role: 'подтверждение репутации', chapter: 'гл. 26', weight: 'nice' },
      { key: 'newsletter', name: 'Подписка / удержание', role: 'захват контакта', chapter: 'гл. 45', weight: 'nice' },
      { key: 'footer_contacts', name: 'Футер: контакты, оплата, доставка', role: 'реквизиты доверия и навигация', chapter: 'гл. 26', weight: 'core' },
    ],
  },
  plp: {
    title: 'Каталог / PLP', chapter: 'гл. 22',
    principle: 'Листинг помогает быстро сузить выбор и перейти в карточку без потери контекста.',
    blocks: [
      { key: 'breadcrumbs', name: 'Хлебные крошки', role: 'положение в каталоге', chapter: 'гл. 22.5', weight: 'important' },
      { key: 'category_title', name: 'Заголовок категории (H1)', role: 'подтверждение места', chapter: 'гл. 22.6', weight: 'core' },
      { key: 'category_description', name: 'Описание категории (SEO)', role: 'контекст + видимость', chapter: 'гл. 22.19', weight: 'nice' },
      { key: 'product_count', name: 'Количество товаров', role: 'масштаб выбора', chapter: 'гл. 22.7', weight: 'important' },
      { key: 'filters', name: 'Фильтрация / фасеты', role: 'сужение выбора', chapter: 'гл. 22, 14', weight: 'core' },
      { key: 'sort', name: 'Сортировка', role: 'управление порядком выдачи', chapter: 'гл. 22.8', weight: 'important' },
      { key: 'view_toggle', name: 'Переключение вида', role: 'плотность/детальность', chapter: 'гл. 22.9', weight: 'nice' },
      { key: 'product_grid', name: 'Сетка товаров (карточки)', role: 'ядро листинга', chapter: 'гл. 22.10', weight: 'core' },
      { key: 'pagination', name: 'Пагинация / подгрузка', role: 'доступ ко всему ассортименту', chapter: 'гл. 22.15', weight: 'important' },
      { key: 'faq', name: 'FAQ по категории', role: 'снятие возражений + SEO', chapter: 'гл. 22', weight: 'nice' },
    ],
  },
  pdp: {
    title: 'Карточка товара / PDP', chapter: 'гл. 23',
    principle: 'Карточка отвечает на вопросы в порядке их возникновения: что это → подойдёт ли → сколько → есть ли → когда → можно ли доверять → что говорят другие → есть ли альтернатива → покупать ли.',
    blocks: [
      { key: 'breadcrumbs', name: 'Хлебные крошки', role: 'возврат на уровень выше', chapter: 'гл. 23.4', weight: 'important' },
      { key: 'product_header', name: 'Заголовок товара (H1)', role: '«что это»', chapter: 'гл. 23.5', weight: 'core' },
      { key: 'gallery', name: 'Галерея', role: '«подойдёт ли»: ракурсы, детали', chapter: 'гл. 23.4', weight: 'core' },
      { key: 'price', name: 'Цена / блок покупки', role: '«сколько стоит»', chapter: 'гл. 23.5', weight: 'core' },
      { key: 'add_to_cart', name: 'Кнопка «В корзину»', role: 'главное действие', chapter: 'гл. 23.4', weight: 'core' },
      { key: 'variants', name: 'Выбор варианта', role: 'размер/цвет/комплектация', chapter: 'гл. 23.4', weight: 'important' },
      { key: 'trust', name: 'Блок доверия', role: '«можно ли доверять»', chapter: 'гл. 23.4, 26', weight: 'important' },
      { key: 'delivery', name: 'Доставка', role: '«когда получу»', chapter: 'гл. 23.4', weight: 'important' },
      { key: 'payment', name: 'Оплата', role: 'способы оплаты', chapter: 'гл. 23.4', weight: 'important' },
      { key: 'description', name: 'Описание', role: 'детали товара', chapter: 'гл. 23.4', weight: 'core' },
      { key: 'specifications', name: 'Характеристики', role: 'сравнение и выбор', chapter: 'гл. 23.4', weight: 'important' },
      { key: 'reviews', name: 'Отзывы', role: '«что говорят другие»', chapter: 'гл. 23.4', weight: 'important' },
      { key: 'qa', name: 'Вопросы и ответы', role: 'снятие возражений', chapter: 'гл. 23.4', weight: 'nice' },
      { key: 'video', name: 'Видео', role: 'демонстрация', chapter: 'гл. 23.4', weight: 'nice' },
      { key: 'related', name: 'Cross-sell / похожие', role: '«есть ли альтернатива», рост AOV', chapter: 'гл. 23.4', weight: 'important' },
      { key: 'recently_viewed', name: 'Недавно просмотренные', role: 'возврат к выбору', chapter: 'гл. 23.4', weight: 'nice' },
    ],
  },
  cart: {
    title: 'Корзина', chapter: 'гл. 24',
    principle: 'Корзина удерживает решение и без трения ведёт в чекаут, попутно повышая чек.',
    blocks: [
      { key: 'qty_control', name: 'Список товаров + изменение количества', role: 'контроль заказа', chapter: 'гл. 24.3', weight: 'core' },
      { key: 'wishlist', name: 'Сохранить на потом / Wishlist', role: 'снижение отказа', chapter: 'гл. 24.3', weight: 'nice' },
      { key: 'promo_code', name: 'Промокод', role: 'применение скидки', chapter: 'гл. 24.3', weight: 'important' },
      { key: 'delivery_calc', name: 'Расчёт доставки', role: 'прозрачность стоимости', chapter: 'гл. 24.3', weight: 'important' },
      { key: 'order_summary', name: 'Стоимость заказа', role: 'итог без сюрпризов', chapter: 'гл. 24.3', weight: 'core' },
      { key: 'related', name: 'Cross-sell', role: 'рост AOV', chapter: 'гл. 24.3', weight: 'nice' },
      { key: 'add_to_cart', name: 'Главный CTA → чекаут', role: 'переход к оплате', chapter: 'гл. 24.3', weight: 'core' },
      { key: 'continue_shopping', name: 'Продолжить покупки', role: 'возврат в каталог', chapter: 'гл. 24.3', weight: 'nice' },
    ],
  },
  checkout: {
    title: 'Чекаут', chapter: 'гл. 25',
    principle: 'Минимум этапов: корзина → контакты → доставка → оплата → проверка → подтверждение. Каждый лишний шаг роняет завершение.',
    blocks: [
      { key: 'order_summary', name: 'Проверка заказа / сумма', role: 'уверенность в составе', chapter: 'гл. 25.15', weight: 'core' },
      { key: 'contact_form', name: 'Контактные данные', role: 'связь по заказу', chapter: 'гл. 25.7', weight: 'core' },
      { key: 'delivery_selection', name: 'Выбор доставки', role: 'способ и срок', chapter: 'гл. 25.10', weight: 'core' },
      { key: 'payment_selection', name: 'Выбор оплаты', role: 'способ оплаты', chapter: 'гл. 25.11', weight: 'core' },
      { key: 'guest_checkout', name: 'Гостевой чекаут', role: 'без обязательной регистрации (−19% брошенных)', chapter: 'гл. 25.5', weight: 'important' },
      { key: 'trust', name: 'Элементы доверия', role: 'безопасность оплаты', chapter: 'гл. 25.16', weight: 'important' },
    ],
  },
  content: {
    title: 'Контент / блог', chapter: 'гл. 35–36',
    principle: 'Статья ведёт от вопроса к товару: отвечает на запрос и мягко переводит в каталог.',
    blocks: [
      { key: 'breadcrumbs', name: 'Хлебные крошки', role: 'навигация', chapter: 'гл. 11', weight: 'nice' },
      { key: 'product_header', name: 'Заголовок (H1)', role: 'тема материала', chapter: 'гл. 36', weight: 'core' },
      { key: 'author', name: 'Автор / дата', role: 'экспертность (E-E-A-T)', chapter: 'гл. 36', weight: 'nice' },
      { key: 'toc', name: 'Оглавление', role: 'навигация по длинному тексту', chapter: 'гл. 36', weight: 'nice' },
      { key: 'related', name: 'Ссылки на товары / похожие статьи', role: 'перевод в каталог', chapter: 'гл. 35', weight: 'important' },
      { key: 'share', name: 'Шеринг', role: 'дистрибуция', chapter: 'гл. 36', weight: 'nice' },
      { key: 'newsletter', name: 'Подписка', role: 'захват контакта', chapter: 'гл. 45', weight: 'nice' },
    ],
  },
};

export type BlockVerdict = 'present' | 'missing';
export type PageComposition = {
  kind: PageKind;
  title: string;
  chapter: string;
  principle?: string;
  url: string;
  blocks: { name: string; role: string; chapter: string; weight: Weight; verdict: BlockVerdict }[];
  coverage: number;                 // % присутствующих core+important блоков
  missingCore: string[];
};

export type PrototypeReport = {
  pages: PageComposition[];
  narrative?: PrototypeNarrative;
};

export type PrototypeNarrative = {
  summary: string;
  perPage: { title: string; pathVsReference: string }[];
};

function comparePage(p: PageAudit): PageComposition | null {
  const ref = REFERENCE[p.kind];
  if (!ref) return null;
  const present = p.ux?.blocks ?? {};
  const blocks = ref.blocks.map((b) => ({ name: b.name, role: b.role, chapter: b.chapter, weight: b.weight, verdict: (present[b.key] ? 'present' : 'missing') as BlockVerdict }));
  const weighed = blocks.filter((b) => b.weight !== 'nice');
  const have = weighed.filter((b) => b.verdict === 'present').length;
  const coverage = weighed.length ? Math.round((have / weighed.length) * 100) : 0;
  const missingCore = blocks.filter((b) => b.weight === 'core' && b.verdict === 'missing').map((b) => b.name);
  return { kind: p.kind, title: ref.title, chapter: ref.chapter, principle: ref.principle, url: p.finalUrl || p.url, blocks, coverage, missingCore };
}

/** Детерминированная сверка композиции разобранных страниц с эталонными прототипами. */
export function buildPrototypeReport(ds: AuditDataset): PrototypeReport {
  const seen = new Set<PageKind>();
  const pages: PageComposition[] = [];
  for (const p of ds.client.pages) {
    if (p.error || !p.checks.length) continue;
    if (seen.has(p.kind)) continue; // один представитель на тип
    const c = comparePage(p);
    if (c) { pages.push(c); seen.add(p.kind); }
  }
  return { pages };
}

export function prototypeFacts(r: PrototypeReport): string {
  const out: string[] = [];
  for (const pg of r.pages) {
    out.push(`\n[${pg.title}] ${pg.url} — покрытие эталонной композиции ${pg.coverage}% (принцип: ${pg.principle ?? '—'})`);
    for (const b of pg.blocks) out.push(`  ${b.verdict === 'present' ? 'ЕСТЬ' : 'НЕТ'} · ${b.name} (${b.weight}) — ${b.role} [${b.chapter}]`);
    if (pg.missingCore.length) out.push(`  Отсутствуют ядровые блоки: ${pg.missingCore.join(', ')}`);
  }
  return out.join('\n');
}

const SYSTEM = `Ты — ведущий UX-архитектор Commerce OS. Разбираешь страницы e-commerce как КОМПОЗИЦИЮ (состав и порядок блоков), а не как список дефектов. Тебе дана сверка композиции клиента с эталонной композицией типа страницы из UX-энциклопедии метода.

Задача: описать ПУТЬ КЛИЕНТА против эталонного пути. Правила:
- Только по фактам сверки. Ничего не выдумывай.
- Это L0 (внешний обход без доступов): «не обнаружено» ≠ «отсутствует» — учитывай паттерны скрытия (за табом, свёрнуто, другой брейкпоинт). Формулируй как наблюдение/гипотезу.
- Для карточки товара опирайся на порядок вопросов пользователя (что это → подойдёт → сколько → есть ли → когда → доверие → что говорят → альтернатива → покупать). Покажи, на каком вопросе путь клиента рвётся из-за отсутствующего/смещённого блока.
- Язык русский, тон профессиональный. Пиши о пути и решении пользователя, а не «блок X отсутствует» сухо — свяжи с потерей конверсии/доверия.

Верни СТРОГО JSON:
{
  "summary": "3–4 предложения: насколько композиция витрины близка к эталону, где системно рвётся путь клиента",
  "perPage": [{"title": "Главная|Каталог / PLP|Карточка товара / PDP|Корзина|Чекаут|Контент / блог", "pathVsReference": "путь клиента на этой странице против эталонного: что ведёт к решению, где обрыв из-за отсутствующего блока, эффект"}]
}`;

export async function narratePrototype(ds: AuditDataset, r: PrototypeReport): Promise<PrototypeNarrative | null> {
  if (!hasKey() || !r.pages.length) return null;
  const user = `Клиент: ${ds.client.finalUrl || ds.client.rootUrl}. Тир T${ds.tier}.\n\nСВЕРКА КОМПОЗИЦИИ С ЭТАЛОНОМ:\n${prototypeFacts(r)}\n\nСобери JSON. perPage — по одному объекту на каждый тип страницы из сверки.`;
  try {
    const text = await ask(SYSTEM + (await knowledgeFor('prototype')), user, 8000);
    const n = extractJson<PrototypeNarrative>(text);
    if (!n.summary || !Array.isArray(n.perPage)) return null;
    return n;
  } catch { return null; }
}

const MARK: Record<BlockVerdict, string> = { present: '✓ есть', missing: '✕ нет' };

export function renderPrototypeMd(ds: AuditDataset, r: PrototypeReport): string {
  const out: string[] = [];
  out.push(`# Эталонный прототип ↔ композиция клиента — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · слой L0 · разбор композиции страниц против эталона (главы UX-энциклопедии) · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  out.push('Страница разбирается как **композиция** — состав и порядок блоков, — и сверяется с эталонной композицией своего типа. Результат — путь клиента против эталонного пути. Оценки — наблюдение L0; «не обнаружено» ≠ «отсутствует» (проверьте паттерны скрытия).');
  out.push('');
  if (!r.pages.length) { out.push('> Страницы не разобраны (сайт недоступен/бот-защита).'); return out.join('\n'); }

  if (r.narrative?.summary) { out.push('## Резюме'); out.push(r.narrative.summary); out.push(''); }

  for (const pg of r.pages) {
    out.push(`## ${pg.title} — ${pg.url}`);
    out.push(`Покрытие эталонной композиции: **${pg.coverage}%**. Эталон: ${pg.chapter}.`);
    if (pg.principle) out.push(`> Принцип эталона: ${pg.principle}`);
    const narr = r.narrative?.perPage.find((x) => x.title === pg.title);
    if (narr) { out.push(''); out.push(narr.pathVsReference); }
    out.push('');
    out.push('| Эталонный блок | Важность | У клиента | Роль в пути клиента | Глава |');
    out.push('| --- | --- | --- | --- | --- |');
    for (const b of pg.blocks) out.push(`| ${b.name} | ${b.weight} | ${MARK[b.verdict]} | ${b.role} | ${b.chapter} |`);
    if (pg.missingCore.length) { out.push(''); out.push(`**Отсутствуют ядровые блоки:** ${pg.missingCore.join(', ')} — путь клиента рвётся здесь.`); }
    out.push('');
  }
  out.push('---');
  out.push('_Метод: страница = композиция, а не набор дефектов. Эталонные прототипы — из UX-энциклопедии (PDP гл. 23, PLP гл. 22, Cart гл. 24, Checkout гл. 25). С доступами уточняется, скрыт блок или отсутствует._');
  return out.join('\n');
}
