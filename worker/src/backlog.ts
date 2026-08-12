/**
 * Сводный бэклог: все рекомендации всех документов сюиты сводятся в ОДИН
 * дедуплицированный список с единым приоритетом (прод-претензия: «отзывы на PDP
 * рекомендуют пять документов с разными приоритетами — какой настоящий?»).
 * Дедупликация — по канонической теме (regex-нормализация), приоритет — максимум
 * по источникам, усилия — эвристика по теме (матрица Impact/Effort).
 */
import { esc, doc, methodologySection, conclusionSection } from './export/reportShell.js';
import type { Finding } from './registry.js';

export type RawRec = { pr: 'P0' | 'P1' | 'P2'; action: string; effect: string; source: string };
export type BacklogItem = {
  theme: string; pr: 'P0' | 'P1' | 'P2'; action: string; effect: string;
  sources: string[]; effort: 'S' | 'M' | 'L'; money: string;
};
export type BacklogReport = {
  client: string; takenAt: string;
  items: BacklogItem[]; rawCount: number; dedupedAway: number;
  verdict: string; conclusion: string[];
};

/** Канонические темы: одна правка = одна строка бэклога, откуда бы ни пришла. */
const THEMES: { theme: string; re: RegExp; effort: 'S' | 'M' | 'L'; money: string }[] = [
  { theme: 'Отзывы и соц. доказательство на карточке', re: /отзыв|review|соц.? ?доказ/i, effort: 'M', money: '+~60% к конверсии PDP (ориентир RaveCapture)' },
  { theme: 'Cross-sell / похожие товары', re: /cross.?sell|похожие|с этим покупают|рекоменда.*(pdp|карточк|корзин)|бандл|набор/i, effort: 'M', money: '+10–25% к AOV (ориентир)' },
  { theme: 'Захват контакта и retention-контур', re: /подписк|захват контакта|welcome|брошенн|retention|баллы|лояльн/i, effort: 'M', money: 'повторные — самый дешёвый оборот (ориентир: recovery ~10% корзин)' },
  { theme: 'Schema-разметка (Product/Crumbs/Organization)', re: /schema|разметк|rich|микроразметк/i, effort: 'S', money: 'CTR выдачи + AI-видимость (точность извлечения фактов LLM ~16%→54%, ориентир)' },
  { theme: 'Гостевой чекаут и сокращение формы', re: /гостев|guest|полей|формы чекаута|принудительн.*регистрац/i, effort: 'M', money: '−~19% брошенных из-за регистрации (ориентир Baymard)' },
  { theme: 'Порог/прогресс бесплатной доставки', re: /бесплатн.*достав|безкоштовн/i, effort: 'S', money: '+17–30% AOV (ориентир; сверить с экономикой доставки)' },
  { theme: 'Категорийные описания и контент листингов', re: /категор.*(описан|текст)|описан.*категор/i, effort: 'M', money: 'средне- и низкочастотный спрос (ориентир)' },
  { theme: 'Индексируемость (sitemap/robots/canonical)', re: /sitemap|robots|canonical|noindex|индексаци/i, effort: 'S', money: 'фундамент бесплатного трафика' },
  { theme: 'Подтверждение добавления в корзину', re: /добавлени.*корзину|счётчик корзины|видимой реакции/i, effort: 'S', money: 'прямые потери шага «в корзину» (journey)' },
  { theme: 'Избранное / wishlist', re: /избранн|wishlist/i, effort: 'M', money: 'захват отложенного спроса (триггеры ×2–3 к промо, ориентир)' },
  { theme: 'Доверие в точке решения (гарантия/возврат/оплата)', re: /довери|гарант|возврат|платёжн|payment.*(логотип|лого)/i, effort: 'S', money: 'снятие тревожности на последнем шаге' },
  { theme: 'Фильтры и фасеты каталога', re: /фильтр|фасет|facet/i, effort: 'L', money: 'конверсия выбора в широком каталоге' },
  { theme: 'Аналитика и события (GA4)', re: /ga4|аналитик|событи|dataLayer/i, effort: 'M', money: 'блокер измеримости всей воронки' },
  { theme: 'Оплата частями / BNPL', re: /частями|рассрочк|bnpl/i, effort: 'S', money: '+20–30% конверсии дорогих позиций (ориентир)' },
  { theme: 'Контент-хаб и связка с каталогом', re: /контент.?хаб|блог|гайд|подборк/i, effort: 'L', money: 'органика + GEO/AEO-видимость' },
  { theme: 'Мягкая 404 и тупиковые страницы', re: /404|тупик|мягк/i, effort: 'S', money: 'чистота индекса + удержание заблудившихся' },
];

const PR_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2 };

export function buildBacklog(client: string, takenAt: string, raw: RawRec[]): BacklogReport {
  const byTheme = new Map<string, { items: RawRec[]; meta: (typeof THEMES)[number] | null }>();
  for (const r of raw) {
    if (!r.action?.trim()) continue;
    const meta = THEMES.find((t) => t.re.test(r.action)) ?? null;
    const key = meta ? meta.theme : r.action.slice(0, 60).toLowerCase();
    const cur = byTheme.get(key) ?? { items: [], meta };
    cur.items.push(r);
    byTheme.set(key, cur);
  }
  const items: BacklogItem[] = Array.from(byTheme.entries()).map(([key, g]) => {
    const pr = g.items.reduce<'P0' | 'P1' | 'P2'>((best, r) => (PR_ORDER[r.pr] < PR_ORDER[best] ? r.pr : best), 'P2');
    const lead = g.items.slice().sort((a, b) => PR_ORDER[a.pr] - PR_ORDER[b.pr])[0];
    return {
      theme: g.meta?.theme ?? lead.action.slice(0, 70),
      pr, action: lead.action, effect: lead.effect,
      sources: Array.from(new Set(g.items.map((r) => r.source))),
      effort: g.meta?.effort ?? 'M',
      money: g.meta?.money ?? 'эффект в деньгах — после baseline (A1)',
    };
  }).sort((a, b) => PR_ORDER[a.pr] - PR_ORDER[b.pr] || b.sources.length - a.sources.length);

  const rawCount = raw.length;
  const dedupedAway = rawCount - items.length;
  const p0 = items.filter((i) => i.pr === 'P0').length;
  const verdict = `${rawCount} рекомендаций из всех документов сведены в ${items.length} работ (${dedupedAway} дублей снято); критичных P0 — ${p0}.`;
  const multi = items.filter((i) => i.sources.length >= 3);
  const conclusion = [
    `Это единственный список работ пакета: каждая правка встречается один раз, с одним приоритетом (максимальный по источникам) и списком документов, которые её потребовали. Спор «какой приоритет настоящий» снят по построению.`,
    multi.length
      ? `Работы, которые потребовали сразу ${multi[0].sources.length}+ документов (${multi.slice(0, 3).map((i) => i.theme.toLowerCase()).join('; ')}), — самые надёжные кандидаты волны 1: независимые линзы сошлись на одном и том же.`
      : 'Работ, подтверждённых тремя и более линзами, нет — приоритеты опираются на отдельные документы.',
    'Столбец «Деньги» — отраслевые ориентиры для приоритизации, не обещания: фактический эффект каждой работы меряется после внедрения против baseline.',
  ];
  return { client, takenAt, items, rawCount, dedupedAway, verdict, conclusion };
}

const effortFromDifficulty = (d: number): 'S' | 'M' | 'L' => (d <= 2 ? 'S' : d === 3 ? 'M' : 'L');
const fmtMoney = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

/**
 * Сводный бэклог ИЗ единого реестра находок: приоритеты, деньги (revenue exposure)
 * и дедуп уже посчитаны реестром — бэклог перестаёт считать их по-своему и
 * становится представлением одной точки правды. Столбец «Деньги» — реальная
 * атрибуция ₴/год, а не отраслевой ориентир (там, где рычаг привязан).
 */
export function buildBacklogFromRegistry(client: string, takenAt: string, findings: Finding[], rawCount: number): BacklogReport {
  const items: BacklogItem[] = findings.map((f): BacklogItem => {
    const theme = THEMES.find((t) => t.re.test(f.title) || Boolean(f.gap && t.re.test(f.gap)));
    return {
      theme: theme?.theme ?? f.title.slice(0, 70),
      pr: f.priority,
      action: f.title,
      effect: f.gap ?? f.to_be ?? f.as_is ?? '',
      sources: f.refs ?? [],
      effort: effortFromDifficulty(f.difficulty),
      money: f.revenueExposure > 0 ? `≈ ${fmtMoney(f.revenueExposure)}/год (revenue exposure)` : (theme?.money ?? 'эффект в деньгах — после baseline'),
    };
  }); // реестр уже отсортирован по приоритету и рангу
  const dedupedAway = Math.max(0, rawCount - items.length);
  const p0 = items.filter((i) => i.pr === 'P0').length;
  const verdict = `${rawCount} рекомендаций из всех документов сведены в ${items.length} работ (${dedupedAway} дублей снято); критичных P0 — ${p0}.`;
  const multi = items.filter((i) => i.sources.length >= 3);
  const conclusion = [
    'Это единственный список работ пакета: каждая правка встречается один раз, с одним приоритетом и списком документов, которые её потребовали. Приоритеты, деньги и дедуп берутся из единого реестра находок — спор «какой приоритет настоящий» снят по построению.',
    multi.length
      ? `Работы, которые потребовали сразу ${multi[0].sources.length}+ документов (${multi.slice(0, 3).map((i) => i.theme.toLowerCase()).join('; ')}), — самые надёжные кандидаты волны 1: независимые линзы сошлись на одном и том же.`
      : 'Работ, подтверждённых тремя и более линзами, нет — приоритеты опираются на отдельные документы.',
    'Столбец «Деньги» — revenue exposure из модели воронки (₴/год, которых касается работа, без задваивания); там, где рычаг ещё не привязан, показан отраслевой ориентир до baseline.',
  ];
  return { client, takenAt, items, rawCount, dedupedAway, verdict, conclusion };
}

const EFFORT_RU: Record<string, string> = { S: 'малые (дни)', M: 'средние (1–2 нед.)', L: 'крупные (3+ нед.)' };

export function renderBacklogHtml(r: BacklogReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Сводный бэклог работ · внешний аудит</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Работ / было рекомендаций</span><span class="val">${r.items.length} / ${r.rawCount}</span></div>
    </div>
    <div class="coverage"><b>Что это.</b> Единый список работ по итогам всех аудитов пакета: рекомендации из каждого документа дедуплицированы по темам, приоритет — максимальный из источников, усилия — по матрице Impact/Effort. Чем больше документов потребовали работу — тем она надёжнее.</div>
  </div></section>`;
  const meth = methodologySection({
    goal: 'Свести рекомендации всех документов пакета в один приоритизированный, дедуплицированный план работ без двойного счёта.',
    sources: ['Рекомендации всех отчётов сюиты (UX/UI, SEO, технический, контент, механики, путь клиента, каналы, CI)', 'Матрица Impact/Effort (стандарт приоритизации SEO/CRO-аудитов)'],
    scope: `${r.rawCount} исходных рекомендаций → ${r.items.length} уникальных работ.`,
    limits: 'Деньги — revenue exposure из модели воронки; где рычаг не привязан, показан отраслевой ориентир. Бюджеты и сроки уточняются при составлении сметы. Работы вне витрины (кабинеты, CRM) появляются после передачи доступов.',
  });
  const rows = r.items.map((i) => `<tr>
    <td style="width:34px"><span class="pr ${i.pr}">${i.pr}</span></td>
    <td class="bk-t"><b>${esc(i.theme)}</b><span>${esc(i.action)}</span></td>
    <td class="bk-e">${esc(i.effect)}</td>
    <td class="bk-m">${esc(i.money)}</td>
    <td class="bk-f">${EFFORT_RU[i.effort]}</td>
    <td class="bk-s">${i.sources.map((s) => `<span class="chip">${esc(s)}</span>`).join(' ')}</td>
  </tr>`).join('');
  const table = `<section class="block"><h2>План работ</h2>
    <p class="lead">P0 — сейчас (работает с уже оплаченным трафиком), P1 — квартал, P2 — стратегия.</p>
    <table><thead><tr><th>Приор.</th><th>Работа</th><th>Ожидаемый эффект</th><th>Деньги (ориентир)</th><th>Усилия</th><th>Требуют документы</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const concl = conclusionSection(r.conclusion, 'Согласовать P0-блок как волну 1; после baseline (3 цифры: трафик, конверсия, чек) каждая строка получает денежную вилку вместо ориентира.');
  const foot = `<section class="block"><div class="footer">Commerce OS · Сводный бэклог · ${esc(r.client)} · ${esc(date)}. Единственный источник приоритетов пакета; частные списки в документах — доказательная база, не конкурирующие планы.</div></section>`;
  const extra = `.bk-t b{display:block;font-size:10px;} .bk-t span{font-size:8.5px;color:var(--muted);} .bk-e,.bk-m{font-size:9px;color:#333;} .bk-f{font-size:9px;white-space:nowrap;} .bk-s .chip{font-size:7.5px;}`;
  return doc(`Сводный бэклог · ${r.client}`, cover + meth + table + concl + foot, extra);
}
