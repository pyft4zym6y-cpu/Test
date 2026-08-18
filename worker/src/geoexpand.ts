/**
 * GEO / NEW MARKET EXPANSION AUDIT — системна перевірка готовності бізнесу до
 * виходу в нову країну/регіон/географічний ринок. Питання: у який ринок виходити,
 * чому туди, чи є реальний попит, яку економіку отримаємо, які барʼєри й чи здатний
 * бізнес масштабуватися без руйнування unit economics і операційної моделі.
 *
 * ЧЕСНО: рішення про вихід залежить від РИНКОВИХ ДАНИХ і документів (попит, конкуренти,
 * юніт-економіка в новій гео, логістика, право, платежі). Із зовнішнього обходу
 * вимірюється лише ТЕХНІЧНА ГОТОВНІСТЬ сайту до мультигео (мовні версії, hreflang,
 * валюти, локальні платежі/доставка). Решта — research/intake, позначено. Без вигадок.
 */
import type { AuditDataset } from './report.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Source = 'обхід' | 'дані/дослідження';

export type GxLayer = { id: string; title: string; principle: string };
export type ReadyRow = { area: string; ok: boolean; note: string };
export type CriterionRow = { criterion: string; group: string; source: Source; note: string };
export type BarrierRow = { barrier: string; note: string };

export type GeoExpandReport = {
  client: string; takenAt: string;
  spine: GxLayer[];
  i18nReadiness: { score: number; rows: ReadyRow[] };
  criteria: CriterionRow[];
  barriers: BarrierRow[];
  entryModes: { mode: string; note: string }[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: string[];
  contextNote: string;
};

const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));

export function buildGeoExpand(ds: AuditDataset): GeoExpandReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const pages = ds.client.pages.filter((p) => !p.error);
  const links = ds.client.links ?? [];
  const lpath = (h: string) => { try { return new URL(h).pathname.toLowerCase(); } catch { return ''; } };
  const hasLink = (re: RegExp) => links.some((h) => re.test(lpath(h)));
  const hreflang = pages.some((p) => p.checks.find((c) => c.id === 'hreflang')?.pass);
  const langs = ['en', 'pl', 'de', 'ro', 'ua', 'ru'].filter((l) => hasLink(new RegExp(`^/${l}(/|$)`)));
  const multiLang = langs.length > 1;

  /* ── i18n technical readiness (єдине вимірюване з обходу) ── */
  const rows: ReadyRow[] = [
    { area: 'Мовні версії (URL)', ok: multiLang, note: multiLang ? `виявлено: ${langs.join(', ')}` : 'одна мовна версія' },
    { area: 'hreflang', ok: hreflang, note: hreflang ? 'є' : 'не виявлено — ризик дублів/невірної гео-видачі' },
    { area: 'Валюти / локальні ціни', ok: hasLink(/currency|valut|eur|usd/), note: 'мультивалютність — перевірити з доступом' },
    { area: 'Локальна доставка/оплата', ok: hasLink(/dostavka|delivery|oplata|payment/), note: 'локальні способи — з даних' },
    { area: 'Правові сторінки', ok: hasLink(/oferta|terms|privacy|policy/), note: 'локальний legal — research' },
  ];
  const score = clamp10((multiLang ? 4 : 1) + (hreflang ? 3 : 0) + (rows[2].ok ? 1 : 0) + (rows[3].ok ? 1 : 0) + (rows[4].ok ? 1 : 0));

  /* ── Критерії рішення (research/intake) ── */
  const C = (criterion: string, group: string, source: Source, note: string): CriterionRow => ({ criterion, group, source, note });
  const criteria: CriterionRow[] = [
    C('Market size / growth', 'Attractiveness', 'дані/дослідження', 'обсяг і динаміка ринку'),
    C('Real demand (search/marketplace)', 'Attractiveness', 'дані/дослідження', 'пошуковий/маркетплейс-попит'),
    C('Competition / saturation', 'Attractiveness', 'дані/дослідження', 'конкуренти й насиченість'),
    C('Unit economics in new geo', 'Economics', 'дані/дослідження', 'CAC/LTV/margin з урахуванням логістики й мит'),
    C('Logistics / fulfillment', 'Operations', 'дані/дослідження', 'склади, доставка, терміни'),
    C('Payments / currency', 'Operations', 'обхід', 'локальні платежі й валюта (частково видно)'),
    C('Legal / tax / compliance', 'Barriers', 'дані/дослідження', 'право, податки, сертифікація'),
    C('Localization (мова/культура/контент)', 'Barriers', 'обхід', 'мовні версії видно; глибина локалізації — research'),
    C('Brand / trust in new geo', 'Barriers', 'дані/дослідження', 'впізнаваність і довіра'),
    C('Operational scalability', 'Feasibility', 'дані/дослідження', 'чи витримає операційна модель'),
  ];

  const barriers: BarrierRow[] = [
    { barrier: 'Регуляторні / податкові', note: 'сертифікація, ПДВ/мита, локальні вимоги' },
    { barrier: 'Логістичні', note: 'склади, останню милю, терміни й вартість доставки' },
    { barrier: 'Платіжні', note: 'локальні методи оплати, валютні ризики' },
    { barrier: 'Культурні / мовні', note: 'локалізація контенту, tone of voice, очікування' },
    { barrier: 'Конкурентні', note: 'сильні локальні гравці, ціновий тиск' },
    { barrier: 'Юніт-економічні', note: 'вища вартість обслуговування руйнує margin' },
  ];

  const entryModes = [
    { mode: 'Marketplace-first', note: 'вихід через локальні маркетплейси — швидко, менший ризик' },
    { mode: 'Localized site (subfolder/ccTLD)', note: 'власний сайт із локалізацією й hreflang' },
    { mode: 'Cross-border shipping', note: 'доставка з наявної гео без локальної присутності' },
    { mode: 'Partnership / distributor', note: 'локальний партнер для операцій' },
  ];

  const roadmap = [
    { phase: 'Phase 1 · Research', items: ['Попит, конкуренти, обсяг ринку (дані)', 'Юніт-економіка в новій гео з логістикою й митами'] },
    { phase: 'Phase 2 · Feasibility', items: ['Право/податки/платежі/логістика', 'Вибір entry mode'] },
    { phase: 'Phase 3 · Localization', items: ['Мовні версії + hreflang + валюти + локальні способи оплати/доставки', 'Локалізація контенту (не переклад)'] },
    { phase: 'Phase 4 · Pilot & Scale', items: ['Пілот на обмеженому обсязі → звірка unit economics → масштабування'] },
  ];

  const artifacts = ['Market Attractiveness Map', 'Demand Validation', 'Competitive Landscape (new geo)', 'Geo Unit Economics', 'Barrier / Risk Map', 'i18n Technical Readiness', 'Localization Plan', 'Entry Mode Recommendation', 'Expansion Roadmap', 'Go/No-Go Decision + ТЗ'];

  const contextNote = 'GEO / New Market Expansion Audit: рішення про вихід залежить від ринкових даних і документів (попит, конкуренти, юніт-економіка в новій гео, логістика, право, платежі) — research/intake. Із зовнішнього обходу вимірюється лише технічна готовність сайту до мультигео (мовні версії, hreflang, валюти, локальні платежі/доставка). Числа не вигадуються.';

  const spine: GxLayer[] = [
    { id: 'GX1', title: 'GX1 · Market Attractiveness', principle: 'У який ринок і чому: обсяг, зростання, реальний попит, насиченість. Не «привабливий взагалі», а «правильний для нас».' },
    { id: 'GX2', title: 'GX2 · Geo Unit Economics', principle: 'Яку економіку отримаємо: CAC/LTV/margin з логістикою й митами — без руйнування unit economics.' },
    { id: 'GX3', title: 'GX3 · Barriers & Risk', principle: 'Регуляторні/логістичні/платіжні/культурні/конкурентні барʼєри та їх подоланність.' },
    { id: 'GX4', title: 'GX4 · i18n Technical Readiness', principle: 'Чи готовий сайт технічно: мовні версії, hreflang, валюти, локальні платежі/доставка (єдине вимірюване з обходу).' },
    { id: 'GX5', title: 'GX5 · Localization', principle: 'Локалізація ≠ переклад: контент, tone, очікування, локальні сигнали довіри.' },
    { id: 'GX6', title: 'GX6 · Entry Mode', principle: 'Marketplace-first / localized site / cross-border / partnership — за ризиком і швидкістю.' },
    { id: 'GX7', title: 'GX7 · Roadmap & Go/No-Go', principle: 'Research → Feasibility → Localization → Pilot → Scale; фінал — обґрунтоване Go/No-Go, а не «спробуємо».' },
  ];

  return { client, takenAt: ds.takenAt, spine, i18nReadiness: { score, rows }, criteria, barriers, entryModes, roadmap, artifacts, contextNote };
}
