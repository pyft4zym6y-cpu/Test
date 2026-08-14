/**
 * Сводный бэклог: все рекомендации всех документов сюиты сводятся в ОДИН
 * дедуплицированный список с единым приоритетом (прод-претензия: «отзывы на PDP
 * рекомендуют пять документов с разными приоритетами — какой настоящий?»).
 * Дедупликация — по канонической теме (regex-нормализация), приоритет — максимум
 * по источникам, усилия — эвристика по теме (матрица Impact/Effort).
 */
import { esc, doc, cover, pageFooter, methodologySection, conclusionSection } from './export/reportShell.js';
import { svgDonut } from './export/charts.js';
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
// re — двомовний матчер (рос./укр.), бо заголовки-джерела можуть бути будь-якою мовою; theme/money — клієнтський текст (укр.).
const THEMES: { theme: string; re: RegExp; effort: 'S' | 'M' | 'L'; money: string }[] = [
  { theme: 'Відгуки та соц. доказ на картці', re: /отзыв|відгук|review|соц.? ?доказ/i, effort: 'M', money: '+~60% до конверсії PDP (орієнтир RaveCapture)' },
  { theme: 'Cross-sell / схожі товари', re: /cross.?sell|похожие|схож|з цим купують|с этим покупают|рекоменда.*(pdp|карточк|картк|корзин|кошик)|бандл|набір|набор/i, effort: 'M', money: '+10–25% до AOV (орієнтир)' },
  { theme: 'Захоплення контакту та retention-контур', re: /подписк|підписк|захват контакта|захоплення контакту|welcome|брошенн|покинут|retention|баллы|бали|лояльн/i, effort: 'M', money: 'повторні — найдешевший оборот (орієнтир: recovery ~10% кошиків)' },
  { theme: 'Schema-розмітка (Product/Crumbs/Organization)', re: /schema|разметк|розмітк|rich|микроразметк|мікророзмітк/i, effort: 'S', money: 'CTR видачі + AI-видимість (точність вилучення фактів LLM ~16%→54%, орієнтир)' },
  { theme: 'Гостьовий чекаут і скорочення форми', re: /гостев|гостьов|guest|полей|полів|формы чекаута|форми чекауту|принудительн.*регистрац|примусов.*реєстрац/i, effort: 'M', money: '−~19% покинутих через реєстрацію (орієнтир Baymard)' },
  { theme: 'Поріг/прогрес безкоштовної доставки', re: /бесплатн.*достав|безкоштовн/i, effort: 'S', money: '+17–30% AOV (орієнтир; звірити з економікою доставки)' },
  { theme: 'Категорійні описи та контент лістингів', re: /категор.*(описан|опис|текст)|опис.*категор|описан.*категор/i, effort: 'M', money: 'середньо- та низькочастотний попит (орієнтир)' },
  { theme: 'Індексованість (sitemap/robots/canonical)', re: /sitemap|robots|canonical|noindex|индексаци|індексац/i, effort: 'S', money: 'фундамент безкоштовного трафіку' },
  { theme: 'Підтвердження додавання в кошик', re: /добавлени.*корзину|додаван.*кошик|счётчик корзины|лічильник кошика|видимой реакции|видимої реакції/i, effort: 'S', money: 'прямі втрати кроку «у кошик» (journey)' },
  { theme: 'Обране / wishlist', re: /избранн|обран|wishlist/i, effort: 'M', money: 'захоплення відкладеного попиту (тригери ×2–3 до промо, орієнтир)' },
  { theme: 'Довіра в точці рішення (гарантія/повернення/оплата)', re: /довери|довір|гарант|возврат|поверненн|платёжн|платіжн|payment.*(логотип|лого)/i, effort: 'S', money: 'зняття тривожності на останньому кроці' },
  { theme: 'Фільтри та фасети каталогу', re: /фильтр|фільтр|фасет|facet/i, effort: 'L', money: 'конверсія вибору в широкому каталозі' },
  { theme: 'Аналітика та події (GA4)', re: /ga4|аналитик|аналітик|событи|події|dataLayer/i, effort: 'M', money: 'блокер вимірності всієї воронки' },
  { theme: 'Оплата частинами / BNPL', re: /частями|частинами|рассрочк|розстрочк|bnpl/i, effort: 'S', money: '+20–30% конверсії дорогих позицій (орієнтир)' },
  { theme: 'Контент-хаб і зв\'язка з каталогом', re: /контент.?хаб|блог|гайд|подборк|добірк/i, effort: 'L', money: 'органіка + GEO/AEO-видимість' },
  { theme: 'М\'яка 404 і тупикові сторінки', re: /404|тупик|глухий кут|мягк|м'як/i, effort: 'S', money: 'чистота індексу + утримання заблукалих' },
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
      money: g.meta?.money ?? 'ефект у грошах — після базових вимірів',
    };
  }).sort((a, b) => PR_ORDER[a.pr] - PR_ORDER[b.pr] || b.sources.length - a.sources.length);

  const rawCount = raw.length;
  const dedupedAway = rawCount - items.length;
  const p0 = items.filter((i) => i.pr === 'P0').length;
  const verdict = `${rawCount} рекомендацій з усіх документів зведено в ${items.length} робіт (${dedupedAway} дублів знято); критичних P0 — ${p0}.`;
  const multi = items.filter((i) => i.sources.length >= 3);
  const conclusion = [
    `Це єдиний список робіт пакета: кожна правка трапляється один раз, з одним пріоритетом (максимальний за джерелами) і списком документів, які її вимагали. Суперечку «який пріоритет справжній» знято за побудовою.`,
    multi.length
      ? `Роботи, які вимагали одразу ${multi[0].sources.length}+ документів (${multi.slice(0, 3).map((i) => i.theme.toLowerCase()).join('; ')}), — найнадійніші кандидати хвилі 1: незалежні лінзи зійшлися на тому самому.`
      : 'Робіт, підтверджених трьома й більше лінзами, немає — пріоритети спираються на окремі документи.',
    'Стовпець «Гроші» — галузеві орієнтири для пріоритизації, не обіцянки: фактичний ефект кожної роботи міряється після впровадження проти базових вимірів.',
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
      money: f.revenueExposure > 0 ? `≈ ${fmtMoney(f.revenueExposure)}/рік (revenue exposure)` : (theme?.money ?? 'ефект у грошах — після базових вимірів'),
    };
  }); // реестр уже отсортирован по приоритету и рангу
  const dedupedAway = Math.max(0, rawCount - items.length);
  const p0 = items.filter((i) => i.pr === 'P0').length;
  const verdict = `${rawCount} рекомендацій з усіх документів зведено в ${items.length} робіт (${dedupedAway} дублів знято); критичних P0 — ${p0}.`;
  const multi = items.filter((i) => i.sources.length >= 3);
  const conclusion = [
    'Це єдиний список робіт пакета: кожна правка трапляється один раз, з одним пріоритетом і списком документів, які її вимагали. Пріоритети, гроші та дедуп беруться з єдиного реєстру знахідок — суперечку «який пріоритет справжній» знято за побудовою.',
    multi.length
      ? `Роботи, які вимагали одразу ${multi[0].sources.length}+ документів (${multi.slice(0, 3).map((i) => i.theme.toLowerCase()).join('; ')}), — найнадійніші кандидати хвилі 1: незалежні лінзи зійшлися на тому самому.`
      : 'Робіт, підтверджених трьома й більше лінзами, немає — пріоритети спираються на окремі документи.',
    'Стовпець «Гроші» — revenue exposure з моделі воронки (₴/рік, яких стосується робота, без подвоєння); там, де важіль ще не прив\'язаний, показано галузевий орієнтир до базових вимірів.',
  ];
  return { client, takenAt, items, rawCount, dedupedAway, verdict, conclusion };
}

const EFFORT_RU: Record<string, string> = { S: 'малі (дні)', M: 'середні (1–2 тиж.)', L: 'великі (3+ тиж.)' };

export function renderBacklogHtml(r: BacklogReport): string {
  const coverHtml = cover({
    kicker: 'Зведений беклог',
    title: 'Зведений беклог робіт',
    verdict: r.verdict,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Робіт / було рекомендацій', value: `${r.items.length} / ${r.rawCount}` },
    ],
    note: '<b>Що це.</b> Єдиний список робіт за підсумками всіх аудитів пакета: рекомендації з кожного документа дедупльовані за темами, пріоритет — максимальний із джерел, зусилля — за матрицею Impact/Effort. Чим більше документів вимагали роботу — тим вона надійніша.',
  });
  const meth = methodologySection({
    goal: 'Звести рекомендації всіх документів пакета в один пріоритизований, дедупльований план робіт без подвійного рахунку.',
    sources: ['Рекомендації всіх звітів сюїти (UX/UI, SEO, технічний, контент, механіки, шлях клієнта, канали, CI)', 'Матриця Impact/Effort (стандарт пріоритизації SEO/CRO-аудитів)'],
    scope: `${r.rawCount} вихідних рекомендацій → ${r.items.length} унікальних робіт.`,
    limits: 'Гроші — revenue exposure з моделі воронки; де важіль не прив\'язаний, показано галузевий орієнтир. Бюджети та строки уточнюються при складанні кошторису. Роботи поза вітриною (кабінети, CRM) з\'являються після передачі доступів.',
  });
  const rows = r.items.map((i) => `<tr>
    <td style="width:34px"><span class="pr ${i.pr}">${i.pr}</span></td>
    <td class="bk-t"><b>${esc(i.theme)}</b><span>${esc(i.action)}</span></td>
    <td class="bk-e">${esc(i.effect)}</td>
    <td class="bk-m">${esc(i.money)}</td>
    <td class="bk-f">${EFFORT_RU[i.effort]}</td>
    <td class="bk-s">${i.sources.map((s) => `<span class="chip">${esc(s)}</span>`).join(' ')}</td>
  </tr>`).join('');
  const nP = (p: string) => r.items.filter((i) => i.pr === p).length;
  const prDonut = r.items.length ? `<div class="chart-wrap">${svgDonut([
    { label: 'P0 — зараз', value: nP('P0'), color: '#dc2626' },
    { label: 'P1 — квартал', value: nP('P1'), color: '#d97706' },
    { label: 'P2 — стратегія', value: nP('P2'), color: '#64748b' },
  ].filter((x) => x.value > 0), { title: 'План робіт за пріоритетом', centerLabel: String(r.items.length) })}</div>` : '';
  const table = `<section class="block"><h2>План робіт</h2>
    <p class="lead">P0 — зараз (працює з уже оплаченим трафіком), P1 — квартал, P2 — стратегія.</p>
    ${prDonut}
    <table><thead><tr><th>Пріор.</th><th>Робота</th><th>Очікуваний ефект</th><th>Гроші (орієнтир)</th><th>Зусилля</th><th>Вимагають документи</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const concl = conclusionSection(r.conclusion, 'Погодити P0-блок як хвилю 1; після базових вимірів (3 цифри: трафік, конверсія, чек) кожен рядок отримує грошову вилку замість орієнтира.');
  const foot = pageFooter('Єдине джерело пріоритетів пакета; окремі списки в документах — доказова база, не конкурентні плани.');
  const extra = `.bk-t b{display:block;font-size:10px;} .bk-t span{font-size:8.5px;color:var(--muted);} .bk-e,.bk-m{font-size:9px;color:#333;} .bk-f{font-size:9px;white-space:nowrap;} .bk-s .chip{font-size:7.5px;}`;
  return doc(`Зведений беклог · ${r.client}`, coverHtml + meth + table + concl + foot, extra);
}
