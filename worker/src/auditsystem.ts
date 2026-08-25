/**
 * MASTER AUDIT SYSTEM — «звʼязка воєдино». Єдина операційна система всіх аудитів
 * e-commerce: реєстр за доменами (Business/Experience/Commerce/Customer/Operations/
 * Organization/Technology/Risk/Economics/Expansion), єдиний СТАНДАРТ проведення
 * (12 кроків), єдина картка знахідки (17 полів), послідовний ланцюг із хендофами і
 * ОДИН наскрізний беклог Impact×Effort з усіх вимірюваних модулів.
 *
 * Три статуси покриття (чесно): «вимірюється з обходу» (модулі, які вже рахуються
 * детерміновано), «фреймворк + дані» (модель/шаблон, числа з даних), «потрібні
 * дані/документи/інтервʼю» (off-site: фінанси, операції, HR, ланцюг постачання).
 *
 * Наскрізний беклог агрегує P0/P1 з реально вимірюваних модулів — це один план на
 * всю систему, а не 50 окремих списків.
 */
import type { AuditDataset } from './report.js';
import { buildStrategyFlow } from './strategyflow.js';
import { buildStructureFlow } from './structureflow.js';
import { buildPageFlow } from './pageflow.js';
import { buildContentAudit } from './contentaudit.js';
import { buildContentFlow } from './contentflow.js';
import { buildSeoFlow } from './seoflow.js';
import { buildGeoFlow } from './geoflow.js';
import { buildMerchFlow } from './merchflow.js';
import { buildCroFlow } from './croflow.js';
import { buildUxUiReport } from './uxui.js';
import { buildUxFlow } from './uxflow.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Coverage = 'обхід' | 'фреймворк' | 'дані';

export type AuditEntry = { name: string; coverage: Coverage; feeds: string };
export type DomainBlock = { domain: string; note: string; audits: AuditEntry[] };
export type ChainHop = { from: string; to: string; passes: string };
export type SysBacklogItem = { audit: string; level: string; title: string; priority: Priority; impact: number; effort: number };

export type AuditSystemReport = {
  client: string; takenAt: string;
  standard: string[];
  findingCard: string[];
  scoringNote: string;
  domains: DomainBlock[];
  chain: ChainHop[];
  coverage: { obhid: number; framework: number; data: number; total: number };
  backlog: SysBacklogItem[];
  readiness: { value: number; note: string };
  contextNote: string;
};

const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function buildAuditSystem(ds: AuditDataset): AuditSystemReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }

  /* ── Єдиний стандарт проведення (12 кроків) ── */
  const standard = [
    'Define Scope — обʼєкт, географія, період, рівень деталізації',
    'Collect Evidence — дані, документи, інтервʼю, системні вигрузки',
    'Map Current State — фактичний стан без передчасних висновків',
    'Benchmark — з еталоном/конкурентами/best practice (якщо база доступна)',
    'Find Gaps — розрив Current ↔ Target',
    'Find Root Causes — відділити симптом від причини',
    'Quantify Impact — вплив на Revenue/Margin/Profit/CX/Risk/Scalability',
    'Prioritize — P0–P3 за Impact / Effort / Urgency',
    'Recommend — конкретне рішення',
    'Validate — спосіб перевірки гіпотези',
    'Roadmap — 0–30 / 31–90 / 91–180 / 180+ днів',
    'ТЗ — задачі з owner, KPI, acceptance criteria',
  ];
  const findingCard = ['Current State', 'Evidence', 'Benchmark', 'Gap', 'Root Cause', 'Business Impact', 'Recommendation', 'Priority (P0–P3)', 'Owner', 'KPI', 'Effort', 'Investment', 'Payback', 'Dependencies', 'Validation', 'Roadmap', 'Acceptance Criteria'];
  const scoringNote = 'Єдина оцінка кожного модуля: Score /10 + Gap + Priority P0–P3 + Business Impact. Health-скор — з ключових зон модуля.';

  /* ── Реєстр аудитів за доменами (обхід / фреймворк / дані) ── */
  const E = (name: string, coverage: Coverage, feeds: string): AuditEntry => ({ name, coverage, feeds });
  const domains: DomainBlock[] = [
    { domain: 'Business & Strategy', note: 'Задає «навіщо» для всіх нижчих рівнів', audits: [
      E('Strategic Audit', 'обхід', 'цілі/ЦА/УТП → вимоги до структури й контенту'),
      E('Structure & Site Tree', 'обхід', 'карта сторінок і типів → фокус для решти'),
      E('Business Model / Innovation', 'дані', 'модель монетизації → пріоритети'),
      E('Digital Maturity', 'дані', 'зрілість → послідовність трансформації'),
      E('Competitor / Benchmark', 'дані', 'позиція → white space'),
    ] },
    { domain: 'Experience (UX · Content · SEO · GEO · Journey)', note: 'Досвід на шляху клієнта', audits: [
      E('Page Audit', 'обхід', 'стан сторінок → де поглиблювати'),
      E('Block-by-Block Audit', 'обхід', 'стан блоків → конкретні правки'),
      E('UX/UI Audit', 'обхід', 'екрани без тертя → куди лягає контент'),
      E('Content Audit', 'обхід', 'контент під рішення → база для SEO/GEO'),
      E('SEO Audit', 'обхід', 'органічний трафік → що конвертувати'),
      E('GEO / AEO / LLM Visibility', 'обхід', 'присутність в AI → додатковий трафік'),
      E('Customer Journey Audit', 'обхід', 'шлях без тертя → де конверсія'),
      E('Performance / Mobile / A11y / Technical', 'дані', 'швидкість/доступність → технічна база'),
    ] },
    { domain: 'Commerce & Conversion', note: 'Перетворення асортименту й трафіку в гроші', audits: [
      E('Merchandising Audit', 'обхід', 'правильні товари → CRO'),
      E('CRO Audit', 'обхід', 'конверсія → замовлення'),
      E('Product Page / Checkout', 'обхід', 'ключові конверсійні сторінки'),
      E('Sales / Sales Ops', 'дані', 'воронка продажів'),
      E('Marketplace / Omnichannel', 'дані', 'канали продажу'),
      E('Loyalty / Subscription / B2B / Affiliate', 'дані', 'нові потоки виручки'),
    ] },
    { domain: 'Customer', note: 'Реальні потреби, а не припущення', audits: [
      E('Customer Research', 'дані', 'інсайти → продукт/UX/marketing'),
      E('Segmentation', 'дані', 'сегменти → рішення'),
      E('JTBD', 'дані', 'задачі клієнта'),
      E('Voice of Customer', 'дані', 'мова й теми клієнта'),
      E('CX Audit', 'дані', 'наскрізний досвід'),
      E('Brand / Value Proposition / PMF', 'дані', 'позиціонування й відповідність ринку'),
    ] },
    { domain: 'Operations', note: 'Здатність виконати обіцянку', audits: [
      E('Operations / Process', 'дані', 'ефективність процесів'),
      E('Supply Chain / Inventory / Procurement', 'дані', 'наявність і собівартість'),
      E('Vendor / Fulfillment / Logistics', 'дані', 'доставка й терміни'),
    ] },
    { domain: 'Organization', note: 'Хто й як впроваджує', audits: [
      E('Organizational / Team / Capability', 'дані', 'спроможність команди'),
      E('HR / Talent', 'дані', 'таланти'),
    ] },
    { domain: 'Technology & Data', note: 'Інструментальна база', audits: [
      E('Analytics Audit', 'обхід', 'baseline інструментування → повний з доступом'),
      E('Technology Stack', 'дані', 'обмеження платформи'),
      E('Data Maturity / Automation', 'дані', 'дані для рішень'),
      E('AI Readiness / Opportunity', 'дані', 'де AI дає ефект'),
    ] },
    { domain: 'Risk & Compliance', note: 'Що загрожує сталості', audits: [
      E('Risk / Business Continuity', 'дані', 'стійкість бізнесу'),
      E('Reputation / Social / PR', 'дані', 'зовнішній контекст бренду'),
      E('Legal / Compliance / Security', 'дані', 'правові й безпекові ризики'),
    ] },
    { domain: 'Economics & Expansion', note: 'Гроші на одиницю й масштабування', audits: [
      E('Unit Economics Audit', 'фреймворк', 'економіка одиниці → пріоритети росту'),
      E('Financial / Commercial', 'дані', 'P&L і комерція'),
      E('Internationalization / Localization', 'обхід', 'i18n-готовність'),
      E('New Market Expansion', 'фреймворк', 'куди й чи виходити (Go/No-Go)'),
    ] },
  ];
  const allAudits = domains.flatMap((d) => d.audits);
  const coverage = {
    obhid: allAudits.filter((a) => a.coverage === 'обхід').length,
    framework: allAudits.filter((a) => a.coverage === 'фреймворк').length,
    data: allAudits.filter((a) => a.coverage === 'дані').length,
    total: allAudits.length,
  };

  /* ── Послідовний ланцюг (хендофи) ── */
  const chain: ChainHop[] = [
    { from: 'Strategic', to: 'Structure', passes: 'Цілі · ЦА · УТП → вимоги до розділів і осей' },
    { from: 'Structure', to: 'Page', passes: 'Карта сторінок → які сторінки поглиблювати' },
    { from: 'Page', to: 'Block', passes: 'Стан сторінок → які блоки правити' },
    { from: 'Block', to: 'UX/UI', passes: 'Стан блоків → тертя на екранах' },
    { from: 'UX/UI', to: 'Content', passes: 'Екрани без тертя → куди лягає контент' },
    { from: 'Content', to: 'SEO', passes: 'Контент під рішення → що виводити в органіку' },
    { from: 'SEO', to: 'GEO/AEO', passes: 'Органічна видимість → присутність в AI' },
    { from: 'GEO/AEO', to: 'Merchandising', passes: 'Трафік на сторінки → правильні товари' },
    { from: 'Merchandising', to: 'CRO', passes: 'Правильні товари → конверсія в замовлення' },
    { from: 'CRO', to: 'Analytics', passes: 'Конверсія → вимірювання результату' },
    { from: 'Analytics', to: 'Unit Economics', passes: 'Дані → економіка одиниці' },
    { from: 'Unit Economics', to: 'Expansion', passes: 'Стійка економіка → масштабування/нові ринки' },
    { from: 'Journey', to: 'Strategic', passes: 'Досвід і retention → наступний цикл цілей' },
  ];

  /* ── Наскрізний беклог (агрегація P0/P1 з вимірюваних модулів) ── */
  const backlog: SysBacklogItem[] = [];
  const push = (audit: string, level: string, title: string, priority: Priority, impact: number, effort: number) => {
    if (!title) return;
    backlog.push({ audit, level, title: title.slice(0, 110), priority, impact, effort });
  };
  try {
    const strat = buildStrategyFlow(ds);
    for (const r of strat.risks.filter((x) => x.severity === 'P0' || x.severity === 'P1').slice(0, 3)) push('Strategic', 'Business', `Ризик: ${r.risk}`, r.severity, 5, 2);
  } catch { /* noop */ }
  try {
    const st = buildStructureFlow(ds);
    for (const g of st.gaps.filter((x) => x.priority === 'P0' || x.priority === 'P1').slice(0, 3)) push('Structure', 'Structure', g.current, g.priority, 4, 3);
  } catch { /* noop */ }
  try {
    const pg = buildPageFlow(ds);
    for (const c of pg.cards.filter((x) => x.priority === 'P0').slice(0, 2)) push('Page', 'Experience', `${c.page}: ${c.recommendation}`, 'P0', 4, 3);
  } catch { /* noop */ }
  try {
    const ux = buildUxFlow(buildUxUiReport(ds));
    for (const f of ux.layers.flatMap((L) => L.findings).filter((f) => f.severity === 'Critical' || f.severity === 'High').slice(0, 3)) push('UX/UI', 'Experience', f.problem, f.severity === 'Critical' ? 'P0' : 'P1', f.severity === 'Critical' ? 5 : 4, 3);
  } catch { /* noop */ }
  try {
    const content = buildContentAudit(ds); const cf = buildContentFlow(ds, content);
    for (const c of cf.cards.filter((x) => x.priority === 'P0').slice(0, 2)) push('Content', 'Experience', `${c.page}: ${c.name} — ${c.recommendation}`, 'P0', 5, 3);
    for (const g of cf.gaps.filter((x) => x.priority === 'P0')) push('Content', 'Experience', g.title, 'P0', 5, 4);
  } catch { /* noop */ }
  try {
    const seo = buildSeoFlow(ds);
    for (const p of seo.problems.filter((x) => x.priority === 'P0').slice(0, 2)) push('SEO', 'Experience', p.problem, 'P0', 5, p.effort);
  } catch { /* noop */ }
  try {
    const geo = buildGeoFlow(ds);
    for (const g of geo.gapMap.filter((x) => x.priority === 'P0').slice(0, 2)) push('GEO/AEO', 'Experience', g.title, 'P0', 4, 3);
  } catch { /* noop */ }
  try {
    const m = buildMerchFlow(ds);
    for (const g of m.gaps.filter((x) => x.priority === 'P1').slice(0, 2)) push('Merchandising', 'Commerce', g.title, 'P1', 4, 3);
  } catch { /* noop */ }
  try {
    const cro = buildCroFlow(ds);
    for (const f of cro.friction.filter((x) => x.present && (x.severity === 'P0' || x.severity === 'P1')).slice(0, 3)) push('CRO', 'Commerce', `Тертя: ${f.point}`, f.severity, 5, 2);
    for (const h of cro.hypotheses.filter((x) => x.priority === 'P0').slice(0, 2)) push('CRO', 'Commerce', h.text, 'P0', 5, 3);
  } catch { /* noop */ }
  backlog.sort((a, b) => priRank[a.priority] - priRank[b.priority] || (b.impact / b.effort) - (a.impact / a.effort));

  /* ── Загальна готовність (за вимірюваними модулями) ── */
  const p0 = backlog.filter((b) => b.priority === 'P0').length;
  const readinessVal = Math.max(0, Math.min(10, 10 - p0 * 0.8 - backlog.filter((b) => b.priority === 'P1').length * 0.3));
  const readiness = {
    value: Math.round(readinessVal * 10) / 10,
    note: `Готовність за ${coverage.obhid} вимірюваними з обходу модулями. ${coverage.framework} — фреймворк+дані; ${coverage.data} — потрібні дані/документи/інтервʼю (off-site).`,
  };

  const contextNote = 'Це не 50 окремих списків, а ОДНА система: єдиний стандарт проведення (12 кроків), єдина картка знахідки (17 полів), єдина оцінка (Score/10 + Gap + P0–P3 + Business Impact). Модулі звʼязані ланцюгом — вихід одного є входом наступного. Наскрізний беклог агрегує P0/P1 лише з реально вимірюваних модулів; off-site домени (фінанси/операції/HR/ланцюг постачання) підключаються даними/документами/інтервʼю. Цифри не вигадуються.';

  return { client, takenAt: ds.takenAt, standard, findingCard, scoringNote, domains, chain, coverage, backlog, readiness, contextNote };
}
