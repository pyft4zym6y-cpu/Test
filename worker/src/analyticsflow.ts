/**
 * ANALYTICS AUDIT — аудит усієї системи вимірювання цифрового бізнесу: від
 * бізнес-цілей і KPI до події purchase, її передачі в GA4/CRM/рекламні системи й
 * управлінські звіти. Головне питання: чи можна за даними сайту точно зрозуміти,
 * звідки прийшов користувач, що робив, де загубився, чому купив, скільки приніс і
 * які дії бізнесу реально дають результат.
 *
 * Ланцюг: Business → KPI → Measurement Plan → Data Layer → Tracking → Analytics →
 * Attribution → Reporting → Decisions.
 *
 * ВАЖЛИВО (чесність): цей аудит на ~95% залежить від ДОСТУПУ до GA4/GTM/CRM/BI.
 * Зовнішній обхід підтверджує лише BASELINE інструментування (які теги стоять,
 * consent, HTTPS) і дає МАКСИМУМ нижню оцінку Maturity. Усе інше (dataLayer, події,
 * ecommerce-точність, атрибуція, звіти) — вимірюється лише з доступом і позначене
 * «потрібен доступ». Цей модуль — baseline-детекція + структурований план аудиту й
 * інтейк, а не вигадані цифри.
 */
import type { AuditDataset } from './report.js';

export type Status = 'обхід' | 'доступ';

export type AnLayer = { id: string; title: string; principle: string; state: string };
export type StackRow = { tool: string; present: boolean; note: string };
export type AreaRow = { area: string; group: string; status: Status; note: string };
export type KpiRow = { goal: string; kpi: string; event: string; tracked: 'baseline' | 'доступ' };

export type AnalyticsFlowReport = {
  client: string; takenAt: string;
  spine: AnLayer[];
  baseline: { instrumentation: number; note: string };  // 0..10 — тільки baseline
  maturity: { floor: number; note: string };             // нижня оцінка рівня 1..5
  stack: StackRow[];
  areas: AreaRow[];
  kpiFramework: KpiRow[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: { n: number; name: string; source: 'обхід' | 'доступ' }[];
  contextNote: string;
};

const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));

export function buildAnalyticsFlow(ds: AuditDataset): AnalyticsFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const detected = ds.client.tech?.analytics ?? [];
  const signals = ds.client.tech?.signals ?? [];
  const hay = (detected.join(' ') + ' ' + signals.join(' ')).toLowerCase();
  const pages = ds.client.pages.filter((p) => !p.error);
  const chkAny = (id: string) => pages.some((p) => p.checks.find((c) => c.id === id)?.pass);
  const hasGA = /ga4|gtm|gtag/i.test(hay);
  const hasGTM = /gtm|googletagmanager/i.test(hay);
  const hasMeta = /meta|pixel|fbq/i.test(hay);
  const hasHotjar = /hotjar/i.test(hay);
  const hasClarity = /clarity/i.test(hay);
  const consent = chkAny('cookies');
  const https = chkAny('https');

  /* ── Detected stack (з обходу) ── */
  const stack: StackRow[] = [
    { tool: 'GA4 / gtag', present: hasGA, note: hasGA ? 'тег виявлено — конфіг/події перевіряються з доступом' : 'не виявлено на сторінках' },
    { tool: 'Google Tag Manager', present: hasGTM, note: hasGTM ? 'GTM виявлено — контейнер перевіряється з доступом' : 'не виявлено' },
    { tool: 'Meta Pixel', present: hasMeta, note: hasMeta ? 'Pixel виявлено — CAPI/події з доступом' : 'не виявлено' },
    { tool: 'Hotjar / Clarity (heatmaps)', present: hasHotjar || hasClarity, note: (hasHotjar || hasClarity) ? 'інструмент поведінки виявлено' : 'не виявлено' },
    { tool: 'Consent / cookie-механіка', present: consent, note: consent ? 'механіка згоди виявлена — режим consent перевіряється з доступом' : 'не виявлено (ризик для ЄС + втрата даних)' },
    { tool: 'HTTPS', present: https, note: https ? 'є' : 'перевірити' },
  ];

  /* ── Maturity floor (нижня оцінка з обходу) ── */
  let floor = 1;
  if (!hasGA) floor = 0;
  else floor = 1; // GA4 присутній → щонайменше L1; L2+ підтверджується лише з доступом
  const maturity = {
    floor,
    note: floor === 0 ? 'GA4/GTM не виявлено — L0. Ризик: рішення без даних.' : 'GA4/GTM присутні → щонайменше L1 (Basic). Рівні L2–L5 (події, ecommerce, інтеграції, decision intelligence) підтверджуються ЛИШЕ з доступом до GA4/GTM/CRM.',
  };

  /* ── Analytics Baseline (єдине, що вимірюється зовні) ── */
  const instrumentation = clamp10((hasGA ? 4 : 0) + (hasGTM ? 2 : 0) + (hasMeta ? 1 : 0) + (consent ? 2 : 0) + (https ? 1 : 0));
  const baseline = { instrumentation, note: 'Baseline інструментування (наявність тегів + consent + HTTPS). Це НЕ Analytics Health Score — повний скор рахується після доступу до GA4/GTM/CRM.' };

  /* ── Audit framework (області × статус) ── */
  const A = (area: string, group: string, status: Status, note: string): AreaRow => ({ area, group, status, note });
  const areas: AreaRow[] = [
    // Business / KPI — інтейк
    A('Business Goals → KPI Map', 'Business', 'доступ', 'Цілі бізнесу й дерево KPI — з брифу/інтейку'),
    A('North Star Metric', 'Business', 'доступ', 'Головна метрика цінності (напр. Contribution Margin)'),
    A('Measurement Plan', 'Business', 'доступ', 'Єдиний план вимірювання (ціль→KPI→подія→параметри)'),
    // Architecture
    A('Наявність аналітики (теги)', 'Architecture', 'обхід', hasGA ? 'GA4/GTM виявлено' : 'не виявлено'),
    A('Tracking Architecture', 'Architecture', 'доступ', 'User→dataLayer→GTM→GA4→Ads/CRM/BI'),
    A('Data Layer (наявність/структура/якість)', 'Architecture', 'доступ', 'dataLayer, naming, ecommerce/user/transaction objects'),
    A('GTM Audit (tags/triggers/variables)', 'Architecture', 'доступ', 'дублі, unused, naming, environments, versions'),
    A('GA4 Configuration', 'Architecture', 'доступ', 'потоки даних, ключові події, налаштування'),
    // Events / Ecommerce
    A('Event Architecture + Parameters', 'Events', 'доступ', 'номенклатура подій і параметрів'),
    A('Ecommerce Tracking (view/cart/checkout/purchase)', 'Events', 'доступ', 'повний ecommerce-трекінг'),
    A('Transaction / Revenue Accuracy', 'Events', 'доступ', 'звірка purchase ↔ факт продажів (CRM/ERP)'),
    A('Refund / Cancellation', 'Events', 'доступ', 'повернення/скасування в даних'),
    A('Currency / Cross-Domain', 'Events', 'доступ', 'валюта, крос-домен, referral exclusions'),
    // Attribution
    A('UTM Audit', 'Attribution', 'доступ', 'єдина схема UTM, консистентність'),
    A('Attribution Model + Window', 'Attribution', 'доступ', 'модель (data-driven/last click…), вікна'),
    A('Channel Grouping', 'Attribution', 'доступ', 'коректність класифікації каналів'),
    A('Google Ads / Meta / Server-side (CAPI)', 'Attribution', 'обхід', hasMeta ? 'Meta Pixel виявлено; CAPI/серверний трекінг — з доступом' : 'рекламні теги — перевірити з доступом'),
    // Privacy / Identity
    A('Consent / Cookie mode', 'Privacy', 'обхід', consent ? 'механіка згоди виявлена; режим — з доступом' : 'consent не виявлено — ризик ЄС і втрата даних'),
    A('User Identification (user_id/CRM ID, без PII)', 'Privacy', 'доступ', 'ідентифікація без передачі PII'),
    // Analysis / Reporting
    A('Funnel Analytics', 'Reporting', 'доступ', 'воронки з drop-off за етапами'),
    A('Form / Search / Product / Category Analytics', 'Reporting', 'доступ', 'мікро-конверсії й поведінка'),
    A('Dashboards / Reporting / Decisions', 'Reporting', 'доступ', 'звіти для рішень, а не «дані заради даних»'),
    A('BI / CRM / ERP Integration', 'Reporting', 'доступ', 'єдині дані для decision intelligence'),
  ];
  const external = areas.filter((a) => a.status === 'обхід').length;

  /* ── KPI framework (шаблон Business→KPI→Event) ── */
  const kpiFramework: KpiRow[] = [
    { goal: 'Зростання виручки', kpi: 'Revenue · Orders · Conversion Rate', event: 'purchase', tracked: hasGA ? 'baseline' : 'доступ' },
    { goal: 'Вищий середній чек', kpi: 'AOV', event: 'purchase (value/items)', tracked: 'доступ' },
    { goal: 'Ефективність реклами', kpi: 'CAC · ROAS', event: 'purchase + ad cost', tracked: 'доступ' },
    { goal: 'Утримання', kpi: 'Repeat Purchase Rate · LTV', event: 'purchase + user_id', tracked: 'доступ' },
    { goal: 'Прибутковість', kpi: 'Gross Margin · Contribution Margin', event: 'purchase + COGS (ERP)', tracked: 'доступ' },
    { goal: 'Ліди (для lead-gen)', kpi: 'Leads · Qualified Leads', event: 'generate_lead + CRM', tracked: 'доступ' },
  ];

  /* ── Roadmap (5 фаз) ── */
  const roadmap = [
    { phase: 'Phase 1 · Foundation', items: [...(hasGA ? ['Перевірити/впорядкувати GA4 + GTM'] : ['Встановити GA4 + GTM']), 'dataLayer + naming convention', ...(consent ? ['Налаштувати consent mode коректно'] : ['Впровадити consent-механіку'])] },
    { phase: 'Phase 2 · Ecommerce', items: ['Повний ecommerce-трекінг: products/cart/checkout/purchase/refunds', 'Звірка revenue ↔ CRM/ERP (точність)'] },
    { phase: 'Phase 3 · Attribution', items: ['Єдина UTM-схема', 'Ads/Meta/CAPI + cross-domain + channel grouping'] },
    { phase: 'Phase 4 · Integration', items: ['CRM/ERP/BI + customer ID (без PII)'] },
    { phase: 'Phase 5 · Intelligence', items: ['Dashboards, alerts, anomaly detection, experimentation, predictive analytics'] },
  ].map((p) => ({ phase: p.phase, items: p.items.filter(Boolean) })).filter((p) => p.items.length);

  const artNames = ['Business KPI Map', 'Measurement Strategy', 'Measurement Plan', 'Analytics Architecture', 'Data Layer Audit', 'GTM Audit', 'GA4 Configuration Audit', 'Event Architecture', 'Parameter Audit', 'Ecommerce Tracking Audit', 'Product Tracking Audit', 'Transaction Audit', 'Revenue Accuracy Audit', 'Refund / Cancellation Audit', 'Currency Audit', 'Cross-Domain Audit', 'Referral Audit', 'UTM Audit', 'Attribution Audit', 'Channel Grouping Audit', 'Google Ads Tracking Audit', 'Meta Tracking Audit', 'Server-Side Tracking Audit', 'Consent Analytics Audit', 'User Identification Audit', 'Funnel Analytics', 'Micro Conversion Map', 'Form Analytics', 'Search Analytics', 'Product Analytics', 'Analytics Maturity Score', 'Analytics Roadmap', 'ТЗ на впровадження трекінгу'];
  // майже все — «доступ»; baseline-детекція тегів/consent — «обхід».
  const OBHID = /(Analytics Architecture|Consent|Maturity|Roadmap)/;
  const artifacts = artNames.map((name, i) => ({ n: i + 1, name, source: (OBHID.test(name) ? 'обхід' : 'доступ') as 'обхід' | 'доступ' }));

  const contextNote = 'Analytics Audit на ~95% залежить від ДОСТУПУ до GA4/GTM/CRM/BI. Зовнішній обхід підтверджує лише baseline інструментування (які теги стоять, consent, HTTPS) і дає нижню оцінку Maturity. Data Layer, події, ecommerce-точність, атрибуція, звіти — вимірюються ЛИШЕ з доступом і позначені «потрібен доступ». Цей звіт — baseline-детекція + структурований план аудиту й інтейк, без вигаданих цифр.';

  const spine: AnLayer[] = [
    { id: 'AN1', title: 'AN1 · Business → KPI → Measurement Plan', principle: 'Спершу — що бізнесу треба вимірювати: ціль→KPI→метрика→подія. Не обирати метрику лише тому, що її зручно дивитись у GA4.', state: 'KPI-дерево й Measurement Plan — з інтейку/доступу.' },
    { id: 'AN2', title: 'AN2 · Instrumentation Baseline', principle: 'Чи взагалі стоїть аналітика: GA4/GTM/Pixel + consent + HTTPS — єдине, що видно ззовні.', state: `Виявлено: ${stack.filter((s) => s.present).map((s) => s.tool.split(' ')[0]).join(', ') || 'нічого'}. Baseline ${instrumentation}/10.` },
    { id: 'AN3', title: 'AN3 · Data Layer · GTM · GA4', principle: 'Архітектура збору: dataLayer→GTM→GA4. Якість, naming, дублі, конфіг — фундамент точності.', state: 'Потрібен доступ до GTM/GA4 (позначено).' },
    { id: 'AN4', title: 'AN4 · Events · Ecommerce · Revenue accuracy', principle: 'Події й ecommerce-трекінг; головне — точність purchase і звірка виручки з CRM/ERP.', state: 'Ecommerce/transaction/revenue — з доступом.' },
    { id: 'AN5', title: 'AN5 · Attribution · UTM · Ads/Meta/CAPI', principle: 'Звідки прийшов і що дало результат: моделі, вікна, channel grouping, серверний трекінг.', state: `Meta Pixel: ${hasMeta ? 'є' : 'не виявлено'}; моделі/вікна — з доступом.` },
    { id: 'AN6', title: 'AN6 · Consent · Identity', principle: 'Згода й ідентифікація без PII: consent mode, cookie, user_id/CRM ID.', state: consent ? 'consent-механіка виявлена; режим — з доступом.' : 'consent не виявлено — ризик ЄС і втрата даних.' },
    { id: 'AN7', title: 'AN7 · Funnel · Reporting · Integration', principle: 'Воронки, мікро-конверсії, дашборди для РІШЕНЬ, інтеграція CRM/ERP/BI.', state: 'Funnel/reporting/integration — з доступом.' },
    { id: 'AN8', title: 'AN8 · Maturity · Roadmap', principle: 'Зрілість L1–L5 (Basic→Decision Intelligence) і план: Foundation→Ecommerce→Attribution→Integration→Intelligence.', state: `Maturity floor: L${floor}; ${areas.length} областей (${external} з обходу, ${areas.length - external} — доступ).` },
  ];

  return { client, takenAt: ds.takenAt, spine, baseline, maturity, stack, areas, kpiFramework, roadmap, artifacts, contextNote };
}
