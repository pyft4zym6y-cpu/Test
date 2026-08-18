/**
 * UNIT ECONOMICS AUDIT — детальна перевірка економіки однієї одиниці бізнесу
 * (клієнт / замовлення / товар / транзакція / канал / когорта): скільки бізнес
 * реально заробляє на кожній одиниці, скільки коштує її залучення й обслуговування,
 * коли вона стає прибутковою і наскільки результат стійкий до зміни параметрів.
 *
 * ЧЕСНО: юніт-економіка НА 100% залежить від бізнес-даних (revenue, COGS, CAC, LTV,
 * повернення, канали). Із зовнішнього обходу вона не вимірюється. Цей модуль —
 * FRAMEWORK + КАЛЬКУЛЯТОР-ШАБЛОН: повна декомпозиція, формули, сценарії й тест
 * чутливості. Числа підставляються з даних (GA4/CRM/ERP/фінзвіти), не вигадуються.
 * Якщо в аудит передані baseline-важелі — калькулятор рахує; інакше показує модель.
 */
import type { AuditDataset } from './report.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type UeLayer = { id: string; title: string; principle: string };
export type UnitDef = { unit: string; def: string; useWhen: string };
export type DecompRow = { metric: string; formula: string; group: string; note: string };
export type SensitivityRow = { change: string; effect: string; watch: string };
export type ScenarioRow = { scenario: string; assumptions: string; signal: string };

export type UnitEconReport = {
  client: string; takenAt: string;
  spine: UeLayer[];
  units: UnitDef[];
  decomposition: DecompRow[];
  ltvcac: { metric: string; formula: string; healthy: string }[];
  sensitivity: SensitivityRow[];
  scenarios: ScenarioRow[];
  maturity: { levels: string[]; note: string };
  roadmap: { phase: string; items: string[] }[];
  artifacts: string[];
  contextNote: string;
};

export function buildUnitEcon(ds: AuditDataset): UnitEconReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }

  const units: UnitDef[] = [
    { unit: 'Customer Unit', def: 'Один залучений клієнт', useWhen: 'LTV, retention, канальна економіка' },
    { unit: 'Order Unit', def: 'Одне замовлення', useWhen: 'AOV, маржа замовлення, доставка' },
    { unit: 'Product Unit', def: 'Один SKU / товар', useWhen: 'маржинальність асортименту' },
    { unit: 'Transaction Unit', def: 'Одна транзакція/платіж', useWhen: 'комісії, повернення' },
    { unit: 'Channel Unit', def: 'Одиниця в розрізі каналу', useWhen: 'CAC/payback за каналом' },
    { unit: 'Cohort Unit', def: 'Когорта за періодом залучення', useWhen: 'стійкість LTV у часі' },
  ];

  const D = (metric: string, formula: string, group: string, note: string): DecompRow => ({ metric, formula, group, note });
  const decomposition: DecompRow[] = [
    D('Revenue per Unit', 'Gross Sales / Units', 'Revenue', 'валовий дохід на одиницю'),
    D('Net Revenue per Order', 'Revenue − discounts − returns − refunds', 'Revenue', 'чистий дохід після повернень'),
    D('COGS per Order', 'собівартість товарів у замовленні', 'Cost', 'з ERP/PIM'),
    D('Gross Profit per Order', 'Net Revenue − COGS', 'Margin', 'валовий прибуток замовлення'),
    D('Gross Margin %', 'Gross Profit / Net Revenue', 'Margin', 'ключова маржа'),
    D('Variable Costs per Order', 'платіжні комісії + пакування + fulfillment + доставка', 'Cost', 'змінні витрати'),
    D('Contribution Margin', 'Gross Profit − Variable Costs', 'Margin', 'внесок до покриття fixed costs'),
    D('Fully Loaded Profit', 'Contribution − алокована частка fixed (payroll/soft/rent)', 'Margin', 'повний прибуток одиниці'),
    D('CAC', 'Marketing+Sales spend / Nnew customers', 'Acquisition', 'вартість залучення'),
    D('CAC Payback', 'CAC / (Contribution per order × orders/period)', 'Acquisition', 'коли повертається CAC'),
    D('LTV', 'AOV × Gross Margin × Purchase Frequency × Lifespan', 'Value', 'цінність за життєвий цикл'),
    D('Repeat / Retention Rate', 'repeat orders / customers', 'Value', 'драйвер LTV'),
    D('Return / Refund Rate', 'returns / orders', 'Risk', 'знищувач маржі'),
  ];

  const ltvcac = [
    { metric: 'LTV : CAC', formula: 'LTV / CAC', healthy: '≥ 3:1 (нижче — залучення дорожче за цінність)' },
    { metric: 'CAC Payback', formula: 'CAC / monthly contribution', healthy: '≤ 3–12 міс залежно від моделі' },
    { metric: 'Contribution Margin', formula: 'Contribution / Net Revenue', healthy: '> 0 і достатньо для покриття fixed' },
    { metric: 'Negative Units', formula: 'units, де Contribution < 0', healthy: '0 (від’ємні одиниці — пріоритет P0)' },
  ];

  const S = (change: string, effect: string, watch: string): SensitivityRow => ({ change, effect, watch });
  const sensitivity: SensitivityRow[] = [
    S('CAC +10%', 'LTV:CAC ↓, payback ↑', 'канальна залежність'),
    S('AOV −10%', 'Contribution ↓, payback ↑', 'promo/discount тиск'),
    S('Gross Margin −5%', 'Contribution ↓', 'ціна закупівлі/собівартість'),
    S('Repeat −10%', 'LTV ↓', 'retention-контур'),
    S('Return rate +10%', 'Net Revenue й маржа ↓', 'якість товару/опису'),
  ];

  const scenarios: ScenarioRow[] = [
    { scenario: 'Base', assumptions: 'поточні фактичні значення', signal: 'реальна економіка одиниці зараз' },
    { scenario: 'Best', assumptions: 'CAC↓, AOV↑, repeat↑, return↓', signal: 'стеля за поточної моделі' },
    { scenario: 'Worst', assumptions: 'CAC↑, AOV↓, margin↓', signal: 'стійкість / точка беззбитковості' },
  ];

  const maturity = {
    levels: ['L1 Revenue-Based (дивляться на sales)', 'L2 Margin-Based (керують gross margin)', 'L3 Contribution-Based (враховують variable costs)', 'L4 Customer Economics (LTV/CAC/cohort/payback)', 'L5 Predictive (прогноз LTV, канальна оптимізація, сценарії)'],
    note: 'Рівень зрілості юніт-економіки визначається за даними/документами компанії — не з обходу.',
  };

  const roadmap = [
    { phase: 'Phase 1 · Measurement', items: ['Визначити unit definitions', 'Побудувати contribution-модель', 'Налаштувати cohort tracking (дані)'] },
    { phase: 'Phase 2 · Fix Negative Units', items: ['Знайти й прибрати від’ємні одиниці (товари/канали/сегменти)', 'Знизити return rate і variable costs'] },
    { phase: 'Phase 3 · Improve LTV:CAC', items: ['Retention/repeat (кабінет, лояльність, email)', 'AOV (cross/upsell, бандли, пороги)', 'CAC за каналами (payback-орієнтована алокація)'] },
    { phase: 'Phase 4 · Predictive', items: ['Прогноз LTV, канальна оптимізація, сценарне планування'] },
  ];

  const artifacts = ['Unit Definition', 'Unit Economics Architecture', 'Revenue per Unit', 'Order Economics', 'Gross Profit/Margin per Order', 'Contribution Model', 'Fully Loaded Economics', 'CAC by Channel', 'CAC Payback', 'LTV Model', 'LTV:CAC Matrix', 'Cohort Analysis', 'Negative Units Map', 'Sensitivity Analysis', 'Scenario Analysis', 'Unit Economics Maturity', 'Unit Economics Roadmap', 'ТЗ на впровадження contribution-моделі'];

  const contextNote = 'Unit Economics Audit на 100% залежить від бізнес-даних (revenue, COGS, CAC, LTV, повернення, канали) — із зовнішнього обходу не вимірюється. Цей документ — framework + калькулятор-шаблон: декомпозиція, формули, LTV:CAC, тест чутливості й сценарії. Числа підставляються з даних (GA4/CRM/ERP/фінзвіти), не вигадуються.';

  const spine: UeLayer[] = [
    { id: 'UE1', title: 'UE1 · Unit Definition', principle: 'Спершу — що саме одиниця: клієнт/замовлення/товар/канал/когорта. Різні одиниці — різні рішення.' },
    { id: 'UE2', title: 'UE2 · Revenue → Contribution', principle: 'Декомпозиція: Revenue → Net Revenue → COGS → Gross → Variable → Contribution → Fully Loaded.' },
    { id: 'UE3', title: 'UE3 · CAC · Payback · LTV', principle: 'Вартість залучення й обслуговування vs цінність за життєвий цикл; коли одиниця окупається.' },
    { id: 'UE4', title: 'UE4 · LTV:CAC & Negative Units', principle: 'LTV:CAC ≥ 3:1; від’ємні одиниці (товари/канали/сегменти) — пріоритет виправлення.' },
    { id: 'UE5', title: 'UE5 · Cohort Economics', principle: 'Стійкість LTV у часі за когортами залучення — реальна, а не «середня» картина.' },
    { id: 'UE6', title: 'UE6 · Sensitivity & Scenarios', principle: 'Наскільки результат стійкий: CAC+10%/AOV−10%/margin−5%/repeat−10%/return+10%; Base/Best/Worst.' },
    { id: 'UE7', title: 'UE7 · Maturity & Roadmap', principle: 'Зрілість L1–L5 (Revenue→Predictive) і план: Measurement→Fix Negative→Improve LTV:CAC→Predictive.' },
  ];

  return { client, takenAt: ds.takenAt, spine, units, decomposition, ltvcac, sensitivity, scenarios, maturity, roadmap, artifacts, contextNote };
}
