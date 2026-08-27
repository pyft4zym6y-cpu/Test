/**
 * BLOCK-BY-BLOCK AUDIT — найдетальніший рівень аудиту інтерфейсу. Консолідує ВСІ
 * лінзи на рівні окремого блоку: кожен блок — функціональна одиниця з формулою
 * Block = Purpose + Context + Content + UX + UI + Interaction + CTA + Proof + SEO +
 * GEO + CRO + Technical + Analytics.
 *
 * Кожен блок описується не «добрий/поганий», а: що це → навіщо → для кого → яку
 * задачу → чому тут → що зараз → що не працює → Golden Standard → як має бути →
 * що змінити → який KPI → ефект → пріоритет → складність → рішення.
 *
 * Важливо: Block Score ≠ Block Priority. Слабкий блок на високотрафіковій сторінці
 * важливіший за середній блок у футері. Priority = Impact × Severity / Effort.
 *
 * Детермінований: спирається на site-audit (BlockRow: role=Purpose, now=Current,
 * should=Golden Standard, state, weight, dims) + профілі блоків. Performance/
 * Analytics/A11y per-block — з page-сигналів + позначка глибини вимірювання.
 */
import type { AuditDataset } from './report.js';
import type { PageKind, PageAudit } from './crawl.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Decision = 'Keep' | 'Improve' | 'Move' | 'Merge' | 'Expand' | 'Remove' | 'Create';
export type Effort = 'S' | 'M' | 'L' | 'XL';
export type BlockCategory = 'Navigation' | 'Discovery' | 'Commercial' | 'Trust' | 'Content' | 'Conversion' | 'Retention' | 'Service';
export type ValueClass = 'Core' | 'Important' | 'Supporting' | 'Optional';

export type BlockLayer = { id: string; title: string; principle: string; state: string };
export type BlockDim = { key: string; label: string; score: number };
export type BlockRecord = {
  page: string; kind: PageKind; key: string; name: string;
  category: BlockCategory; valueClass: ValueClass;
  purpose: string; businessFn: string; userFn: string;   // навіщо · бізнес · користувач
  current: string; problem: string; why: string; golden: string;
  leadsTo: string;                                        // CTA / наступний крок
  dims: BlockDim[]; score: number;                        // 15 напрямів + Block Health Score
  impact: 'High' | 'Medium' | 'Low'; priority: Priority; effort: Effort;
  decision: Decision; recommendation: string; effect: string;
};
export type MatrixRow = { block: string; page: string; ux: number; ui: number; content: number; cro: number; seo: number; geo: number; impact: string; priority: Priority };
export type DecisionTally = { decision: Decision; count: number; note: string };

export type BlockFlowReport = {
  client: string; takenAt: string;
  spine: BlockLayer[];
  matrix: MatrixRow[];
  cards: BlockRecord[];
  classification: { category: BlockCategory; blocks: string[] }[];
  decisions: DecisionTally[];
  opportunities: { block: string; opportunity: string; chain: string }[];
  architecture: { page: string; sequence: string[] }[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: { n: number; name: string; source: 'обхід' | 'GA/A-B' }[];
  /** null — блоків не знайдено, середнє рахувати нема з чого. */
  overall: number | null;
  contextNote: string;
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const clamp5 = (n: number) => Math.max(0, Math.min(5, Math.round(n * 2) / 2));

// 15 напрямів Block Score.
const DIM_LABELS: [string, string][] = [
  ['strategic', 'Strategic'], ['user', 'User'], ['ux', 'UX'], ['ui', 'UI'], ['content', 'Content'],
  ['cro', 'CRO'], ['seo', 'SEO'], ['geo', 'GEO/AEO'], ['trust', 'Trust'], ['nav', 'Navigation'],
  ['a11y', 'A11y'], ['mobile', 'Mobile'], ['perf', 'Performance'], ['analytics', 'Analytics'], ['tech', 'Technical'],
];

// Профіль блоку: категорія, бізнес/користувацька функція, і які напрями блок ОБСЛУГОВУЄ.
type Prof = { cat: BlockCategory; biz: string; user: string; primary: string[]; leadsTo: string; problem: string; why: string };
const PROFILE: Record<string, Prof> = {
  nav: { cat: 'Navigation', biz: 'Навігація · точки входу в каталог', user: 'Швидко знайти напрям', primary: ['strategic', 'nav', 'ux'], leadsTo: 'категорії / комерційні осі', problem: 'меню не веде до головних осей за 1 клік', why: 'вхід у каталог — початок майже кожного сценарію' },
  search: { cat: 'Navigation', biz: 'Вхід у дерево без знання назв', user: 'Знайти товар «своїми словами»', primary: ['nav', 'ux', 'seo'], leadsTo: 'товари / категорії', problem: 'пошук слабкий/прихований', why: 'другий за частотою шлях до товару' },
  breadcrumbs: { cat: 'Navigation', biz: 'Положення + перелінковка ваги', user: 'Орієнтація й повернення вгору', primary: ['nav', 'seo'], leadsTo: 'категорія / підкатегорія', problem: 'немає повного шляху / розмітки', why: 'втрата орієнтації, слабша індексація' },
  footer_contacts: { cat: 'Service', biz: 'Реквізити довіри · 2-й рівень навігації', user: 'Перевірити «хто продавець»', primary: ['trust', 'nav', 'seo'], leadsTo: 'сервіс / бренди / правові', problem: 'футер — лише службові посилання', why: 'втрата довіри й перелінковки' },
  hero: { cat: 'Discovery', biz: 'Позиціонування + перший оффер', user: 'Зрозуміти «куди я потрапив»', primary: ['strategic', 'user', 'ux', 'ui', 'content', 'cro'], leadsTo: 'каталог / підбірка', problem: 'немає одного оффера й первинного CTA', why: 'відмови на вході, розмита пропозиція' },
  usp_bar: { cat: 'Trust', biz: 'Диференціація · причина купувати тут', user: 'Зрозуміти «чому ви»', primary: ['strategic', 'content', 'cro', 'trust'], leadsTo: 'гарантія / про нас', problem: 'загальні слова без конкретики й доказів', why: 'конкуренція ціною, менша довіра' },
  product_grid: { cat: 'Discovery', biz: 'Ядро лістингу · вхід у товари', user: 'Сканувати й перейти в товар', primary: ['ux', 'ui', 'cro', 'seo', 'nav'], leadsTo: 'картка товару', problem: 'некерований мерчандайзинг / бідна картка', why: 'менше проникнення в каталог' },
  filters: { cat: 'Discovery', biz: 'Звуження вибору', user: 'Швидко відсіяти зайве', primary: ['ux', 'nav', 'cro'], leadsTo: 'звужена видача', problem: 'фасети слабкі / некеровані URL', why: 'клієнт не доходить до потрібного SKU' },
  trust: { cat: 'Trust', biz: 'Зняття ризику перед оплатою', user: 'Впевненість, що платити безпечно', primary: ['trust', 'cro', 'content'], leadsTo: 'умови / гарантія', problem: 'іконки без конкретики й посилань', why: 'відмови на кроці оплати' },
  reviews: { cat: 'Trust', biz: 'Соц. доказ + комерційний перехід', user: 'Підтвердження від інших', primary: ['trust', 'cro', 'seo', 'geo', 'content'], leadsTo: 'картка товару (з відгуку!)', problem: 'соц. доказ — «тупик», без переходу в товар', why: 'втрачений conversion-path із trust-блоку' },
  faq: { cat: 'Content', biz: 'Зняття заперечень + AEO', user: 'Відповідь на питання вибору', primary: ['content', 'seo', 'geo', 'cro', 'nav'], leadsTo: 'доставка / оплата / каталог', problem: 'відповідь-тупик без переходів і розмітки', why: 'втрата AEO й переходів у комерцію' },
  qa: { cat: 'Content', biz: 'Реальні заперечення покупців', user: 'Закрити конкретний сумнів', primary: ['content', 'geo', 'cro'], leadsTo: 'схожі питання / товар', problem: 'немає QAPage / самодостатніх відповідей', why: 'втрата long-tail і AEO' },
  description: { cat: 'Content', biz: 'Інфо-приріст → рішення без менеджера', user: 'Зрозуміти «чи підійде»', primary: ['content', 'seo', 'geo'], leadsTo: 'характеристики / порівняння', problem: 'опис постачальника без сутностей', why: 'рішення відкладається, слабке AI-цитування' },
  specifications: { cat: 'Content', biz: 'Порівняння за атрибутами', user: 'Раціональний вибір', primary: ['content', 'seo', 'geo'], leadsTo: 'порівняння / схожі', problem: 'немає таблиці «значення+сенс»', why: 'не покриті атрибутивні запити' },
  category_description: { cat: 'Content', biz: 'Контекст вибору + видимість', user: 'Як обрати в категорії', primary: ['content', 'seo', 'geo', 'nav'], leadsTo: 'підкатегорії / гайди', problem: '«портянка» заради ключів / немає перелінковки', why: 'категорія не збирає попит' },
  related: { cat: 'Commercial', biz: 'Зростання AOV + горизонтальні звʼязки', user: 'Альтернатива й доповнення', primary: ['cro', 'nav', 'seo'], leadsTo: 'схожі / з цим беруть / інші кольори', problem: 'одна карусель замість 3 сценаріїв', why: 'втрачений AOV і глибина' },
  gallery: { cat: 'Discovery', biz: '«Чи підійде»: ракурси/деталі', user: 'Роздивитись товар', primary: ['ux', 'ui', 'user'], leadsTo: 'зум / варіанти', problem: 'мало типів медіа, немає зуму/відео', why: 'нижча впевненість у виборі' },
  price: { cat: 'Conversion', biz: '«Скільки коштує» — опора рішення', user: 'Побачити ціну й наявність', primary: ['cro', 'strategic', 'user'], leadsTo: 'до кошика', problem: 'ціна/наявність не поруч із CTA', why: 'тертя перед головною дією' },
  add_to_cart: { cat: 'Conversion', biz: 'Головна дія — транзакція', user: 'Купити', primary: ['cro', 'strategic', 'user', 'ux'], leadsTo: 'кошик / оформлення', problem: 'CTA тоне серед конкурентних елементів', why: 'пряма втрата конверсії' },
  variants: { cat: 'Commercial', biz: 'Вибір розмір/колір/комплектація', user: 'Обрати потрібний варіант', primary: ['ux', 'cro', 'user'], leadsTo: 'оновлення ціни/наявності', problem: 'недоступні варіанти приховані', why: 'помилки вибору, відмови' },
  author: { cat: 'Content', biz: 'E-E-A-T матеріалу', user: 'Довіра до джерела', primary: ['content', 'geo', 'trust'], leadsTo: 'інші матеріали автора', problem: 'немає автора/дати', why: 'слабший E-E-A-T для пошуку й AI' },
  newsletter: { cat: 'Retention', biz: 'Захоплення контакту → retention', user: 'Отримати цінність за контакт', primary: ['cro', 'content'], leadsTo: 'підписка / знижка', problem: 'немає зрозумілої цінності підписки', why: 'немає бази для повторних продажів' },
};

const stateScore: Record<BlockState, number> = { ok: 5, weak: 3, check: 2.5, gap: 1 };
const PAGE_EXPOSURE: Partial<Record<PageKind, number>> = { home: 3, plp: 3, pdp: 3, checkout: 2, faq: 1, content: 2 };

export function buildBlockFlow(ds: AuditDataset): BlockFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const site = buildSiteAudit(ds);
  const byUrl = new Map<string, PageAudit>();
  for (const p of ds.client.pages) if (!p.error) byUrl.set(p.finalUrl || p.url, p);
  const analyticsPresent = (ds.client.tech?.analytics ?? []).length > 0;

  const cards: BlockRecord[] = [];
  const KEY: PageKind[] = ['home', 'plp', 'pdp', 'content', 'faq'];
  for (const pr of site.pages) {
    if (!KEY.includes(pr.kind)) continue;
    const pa = byUrl.get(pr.url);
    // page-level cross-cutting сигнали (однакові для блоків сторінки).
    const pageA11y = clamp5(((pa && pa.checks.find((c) => c.id === 'alt')?.pass) ? 3.5 : 2) + ((pa?.ux?.baseFontPx ?? 16) >= 14 ? 1.5 : 0.5));
    const pageMobile = clamp5(((pa && pa.checks.find((c) => c.id === 'viewport')?.pass) ? 3.5 : 1.5) + ((pa?.ux?.smallTapTargets ?? 0) <= 3 ? 1.5 : 0));
    const pagePerf = clamp5(pr.kind === 'home' ? 3 : 3.5); // без польових даних — нейтрально-обережно
    const pageAnalytics = analyticsPresent ? 3.5 : 0.5;
    const pageTech = clamp5(((pa && pa.status === 200) ? 3.5 : 1.5) + ((pa && pa.checks.find((c) => c.id === 'canonical')?.pass) ? 1.5 : 0));

    for (const row of pr.rows) {
      const prof = PROFILE[row.key];
      if (!prof) continue; // без профілю — не консолідуємо
      const base = stateScore[row.state];
      const primary = new Set(prof.primary);
      const dimScore = (key: string): number => {
        if (['a11y', 'mobile', 'perf', 'analytics', 'tech'].includes(key)) {
          return key === 'a11y' ? pageA11y : key === 'mobile' ? pageMobile : key === 'perf' ? pagePerf : key === 'analytics' ? pageAnalytics : pageTech;
        }
        // напрям, який блок обслуговує — страждає при слабкому стані; інші — нейтрально вищі.
        return clamp5(primary.has(key) ? base : Math.min(5, base + 1.5));
      };
      const dims: BlockDim[] = DIM_LABELS.map(([key, label]) => ({ key, label, score: dimScore(key) }));
      const score = clamp10(dims.reduce((s, d) => s + d.score, 0) / dims.length * 2);

      // value class з ваги.
      const valueClass: ValueClass = row.weight === 'core' ? 'Core' : row.weight === 'important' ? 'Important' : 'Supporting';
      // impact = вага × експозиція сторінки.
      const exp = PAGE_EXPOSURE[pr.kind] ?? 1;
      const impactNum = (row.weight === 'core' ? 3 : row.weight === 'important' ? 2 : 1) * exp;
      const impact: BlockRecord['impact'] = impactNum >= 7 ? 'High' : impactNum >= 4 ? 'Medium' : 'Low';
      // priority = impact × severity / effort (Score ≠ Priority).
      const severity = row.state === 'gap' ? 3 : row.state === 'weak' ? 2 : row.state === 'check' ? 1.5 : 0.5;
      const effort: Effort = row.state === 'gap' ? (row.weight === 'core' ? 'L' : 'M') : 'S';
      const pscore = impactNum * severity;
      const priority: Priority = pscore >= 14 ? 'P0' : pscore >= 8 ? 'P1' : pscore >= 4 ? 'P2' : 'P3';
      // decision.
      const decision: Decision = row.state === 'gap' ? 'Create' : row.state === 'ok' ? 'Keep' : row.state === 'check' ? 'Improve' : 'Improve';

      cards.push({
        page: KIND_LABEL[pr.kind], kind: pr.kind, key: row.key, name: row.name,
        category: prof.cat, valueClass,
        purpose: row.role, businessFn: prof.biz, userFn: prof.user,
        current: row.now, problem: row.state === 'gap' ? `блок відсутній — ${prof.problem}` : row.state === 'weak' ? prof.problem : row.state === 'check' ? 'не підтверджено обходом (можливо приховано / за JS)' : 'працює за еталоном',
        why: prof.why, golden: row.should, leadsTo: prof.leadsTo,
        dims, score, impact, priority, effort, decision,
        recommendation: row.state === 'gap' ? `Створити «${row.name}»: ${row.should}` : row.state === 'ok' ? `Залишити; звірити консистентність між шаблонами.` : `Довести «${row.name}» до Golden Standard: ${row.should}`,
        effect: prof.cat === 'Trust' ? 'Менше тертя/ризику → вища конверсія й LTV' : prof.cat === 'Content' ? 'Тематичне покриття + перелінковка + AEO' : prof.cat === 'Conversion' ? 'Пряме зростання конверсії' : prof.cat === 'Discovery' ? 'Глибше проникнення в каталог' : prof.cat === 'Commercial' ? 'Зростання AOV' : 'Краща навігація й findability',
      });
    }
  }
  // сортуємо: P0 → за impact → за score (гірші вище).
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const impRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  cards.sort((a, b) => priRank[a.priority] - priRank[b.priority] || impRank[a.impact] - impRank[b.impact] || a.score - b.score);

  // Block Health Matrix (топ-найважливіші).
  const dv = (c: BlockRecord, k: string) => c.dims.find((d) => d.key === k)?.score ?? 0;
  const matrix: MatrixRow[] = cards.filter((c) => c.decision !== 'Keep').slice(0, 16).map((c) => ({
    block: c.name, page: c.page, ux: dv(c, 'ux'), ui: dv(c, 'ui'), content: dv(c, 'content'),
    cro: dv(c, 'cro'), seo: dv(c, 'seo'), geo: dv(c, 'geo'), impact: c.impact, priority: c.priority,
  }));

  // Classification.
  const cats: BlockCategory[] = ['Navigation', 'Discovery', 'Commercial', 'Trust', 'Content', 'Conversion', 'Retention', 'Service'];
  const classification = cats.map((cat) => ({ category: cat, blocks: [...new Set(cards.filter((c) => c.category === cat).map((c) => c.name))] })).filter((x) => x.blocks.length);

  // Decisions tally.
  const decNote: Record<Decision, string> = { Keep: 'блок за еталоном — залишити', Improve: 'довести до Golden Standard', Create: 'відсутній блок — створити', Move: 'правильний, але не там (переставити)', Merge: 'обʼєднати зі спорідненим', Expand: 'занадто короткий — розкрити з доказами', Remove: 'низька цінність — прибрати' };
  const decOrder: Decision[] = ['Create', 'Improve', 'Keep', 'Expand', 'Merge', 'Move', 'Remove'];
  const decisions: DecisionTally[] = decOrder.map((d) => ({ decision: d, count: cards.filter((c) => c.decision === d).length, note: decNote[d] })).filter((d) => d.count > 0 || d.decision === 'Keep' || d.decision === 'Improve' || d.decision === 'Create');

  // Opportunities (хороший, але недовикористаний).
  const opportunities: { block: string; opportunity: string; chain: string }[] = [];
  if (cards.some((c) => c.key === 'reviews')) opportunities.push({ block: 'Відгуки', opportunity: 'Звʼязати кожен відгук із карткою товару', chain: 'Review → Product Card → Product Page → Add to Cart' });
  if (cards.some((c) => c.key === 'usp_bar')) opportunities.push({ block: 'Переваги / УТП', opportunity: 'Розкрити 4 іконки в конкретні факти + докази + посилання', chain: 'Benefit → Specific Fact → Proof → Link' });
  if (cards.some((c) => c.key === 'faq')) opportunities.push({ block: 'FAQ', opportunity: 'Додати тематичні виходи й CTA замість «тупика»', chain: 'Question → Answer → Delivery/Category → Product' });

  // Block Architecture Map (цільова послідовність) — за типом сторінки.
  const ARCH: Partial<Record<PageKind, string[]>> = {
    home: ['Hero', 'USP / Trust', 'Categories', 'Bestsellers', 'Brands', 'Reviews', 'FAQ', 'SEO-контент', 'Footer'],
    plp: ['Breadcrumbs', 'H1 + Intro', 'Subcategories', 'Filters + Sort', 'Product Grid', 'USP', 'SEO-текст', 'FAQ', 'Related categories'],
    pdp: ['Breadcrumbs', 'Gallery', 'Title + Price + Availability', 'Variants', 'CTA + micro-trust', 'Delivery', 'Description', 'Specifications', 'Reviews (→товар)', 'FAQ', 'Related / Cross-sell'],
  };
  const architecture = Object.entries(ARCH).map(([k, seq]) => ({ page: KIND_LABEL[k as PageKind], sequence: seq }));

  const roadmap = [
    { phase: 'Phase 1 · P0-блоки критичних сторінок', items: cards.filter((c) => c.priority === 'P0').slice(0, 5).map((c) => `${c.page}: ${c.decision} «${c.name}»`) },
    { phase: 'Phase 2 · Conversion-блоки', items: cards.filter((c) => c.category === 'Conversion' || c.category === 'Trust').filter((c) => c.decision !== 'Keep').slice(0, 4).map((c) => `${c.page}: ${c.decision} «${c.name}»`) },
    { phase: 'Phase 3 · Content / SEO / GEO блоки', items: cards.filter((c) => c.category === 'Content').filter((c) => c.decision !== 'Keep').slice(0, 4).map((c) => `${c.page}: ${c.decision} «${c.name}»`) },
    { phase: 'Phase 4 · Opportunities (недовикористані блоки)', items: opportunities.map((o) => `${o.block}: ${o.opportunity}`) },
  ].map((p) => ({ phase: p.phase, items: p.items.filter(Boolean) })).filter((p) => p.items.length);

  const artifacts = [
    'Complete Block Inventory', 'Block Classification', 'Block Purpose Map', 'Business Function Map', 'User Function Map',
    'Block Sequence Map', 'Block Dependency Map', 'Block-by-Block Audit', 'Golden Standard Comparison', 'Block Health Score',
    'Block Health Matrix', 'Block Opportunity Map', 'Dead-End Map', 'Internal Linking Map', 'CTA Map', 'Interaction Map',
    'Responsive Behavior Map', 'Accessibility Map', 'Performance Impact Map', 'Analytics Event Map',
    'Keep/Improve/Move/Merge/Remove/Create Map', 'Priority Matrix', 'Block Improvement Roadmap', 'Детальне ТЗ на блоки',
  ].map((name, i) => ({ n: i + 1, name, source: (/(Analytics|Performance|Interaction)/.test(name) ? 'GA/A-B' : 'обхід') as 'обхід' | 'GA/A-B' }));

  // null, а не 0: нуль у документі читається як «перевірили — усе погано»,
  // тоді як карток просто не було з чого будувати.
  const overall = cards.length ? clamp10(cards.reduce((s, c) => s + c.score, 0) / cards.length) : null;
  const contextNote = 'Block-by-Block Audit — найдетальніший рівень: кожен блок як функціональна одиниця, а не «гарний/поганий». Іде після Page Audit. Block Score ≠ Priority: слабкий блок на високотрафіковій сторінці важливіший за середній у футері (Priority = Impact × Severity / Effort). Вимірюване з обходу рахуємо детерміновано; per-block Performance/Analytics/A-B — після інструментування (GA/тестів), позначено окремо.';

  const spine: BlockLayer[] = [
    { id: 'BL1', title: 'BL1 · Inventory & Classification', principle: 'Повний перелік блоків і класифікація за функцією (Navigation/Discovery/Commercial/Trust/Content/Conversion/Retention/Service).', state: `${cards.length} блоків розібрано на ключових сторінках; ${classification.length} функціональних груп.` },
    { id: 'BL2', title: 'BL2 · Purpose · Business · User', principle: 'Для кожного блоку: навіщо існує, вклад у бізнес, що отримує користувач — одна Primary Function.', state: `Середній Block Health ${overall}/10.` },
    { id: 'BL3', title: 'BL3 · Context · Position · Sequence', principle: 'Той самий блок правильний на одній сторінці й зайвий на іншій; важить порядок і етап journey.', state: `Цільова послідовність побудована для ${architecture.length} типів сторінок.` },
    { id: 'BL4', title: 'BL4 · Content · UX · UI · Interaction · CTA', principle: 'Копірайт, візуал, компоненти, стани, і головне — CTA та наступний крок (не тупик).', state: `Блоків із проблемним CTA/виходом: ${cards.filter((c) => (c.key === 'faq' || c.key === 'reviews' || c.key === 'related') && c.decision !== 'Keep').length}.` },
    { id: 'BL5', title: 'BL5 · CRO · Trust · SEO · GEO/AEO', principle: 'Чи підвищує блок імовірність дії, знімає ризик, дає видимість і прямий відповідь.', state: `Trust/Content-блоків потребують доробки: ${cards.filter((c) => (c.category === 'Trust' || c.category === 'Content') && c.decision !== 'Keep').length}.` },
    { id: 'BL6', title: 'BL6 · States · Edge Cases · Mobile · A11y · Performance', principle: 'Стани (hover/loading/empty/error), краї (0/100 товарів), адаптив, доступність, вклад у швидкість.', state: `Per-block Performance/Analytics — після інструментування (позначено).` },
    { id: 'BL7', title: 'BL7 · Golden Standard · Score · Impact', principle: 'Порівняння з еталоном блоку → 15-осьовий Score. Score ≠ Priority: важить трафік-експозиція.', state: `P0 блоків: ${cards.filter((c) => c.priority === 'P0').length}; High-impact: ${cards.filter((c) => c.impact === 'High').length}.` },
    { id: 'BL8', title: 'BL8 · Decision · Roadmap · ТЗ', principle: 'Кожен блок → рішення Keep/Improve/Move/Merge/Expand/Remove/Create → roadmap → детальне ТЗ.', state: `Create ${cards.filter((c) => c.decision === 'Create').length}, Improve ${cards.filter((c) => c.decision === 'Improve').length}, Keep ${cards.filter((c) => c.decision === 'Keep').length}; артефактів ${artifacts.length}.` },
  ];

  return { client, takenAt: ds.takenAt, spine, matrix, cards, classification, decisions, opportunities, architecture, roadmap, artifacts, overall, contextNote };
}
