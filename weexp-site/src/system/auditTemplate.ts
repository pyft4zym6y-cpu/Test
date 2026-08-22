/*
 * Шаблон глибокого аудиту (конструктор). Один глобальний шаблон із версіонуванням.
 * Блоки → питання. Типи питань, обов’язковість, підказки, умовна логіка, ролі.
 * Зберігається в Supabase (audit_template) із локальним фолбеком для розробки.
 */
import { CONFIGURED, supabase } from '@/lib/supa';

export type QType = 'text' | 'longtext' | 'number' | 'single' | 'multi' | 'file' | 'access' | 'date' | 'scale';
export const Q_TYPES: { v: QType; label: string; hint: string }[] = [
  { v: 'text', label: 'Короткий текст', hint: 'один рядок' },
  { v: 'longtext', label: 'Довгий текст', hint: 'абзац' },
  { v: 'number', label: 'Число', hint: 'сума, кількість' },
  { v: 'single', label: 'Вибір один', hint: 'радіо' },
  { v: 'multi', label: 'Вибір декілька', hint: 'чекбокси' },
  { v: 'file', label: 'Файл', hint: 'завантаження' },
  { v: 'access', label: 'Доступ (email)', hint: 'GA4/CRM/реклама' },
  { v: 'date', label: 'Дата', hint: 'календар' },
  { v: 'scale', label: 'Шкала 1–10', hint: 'оцінка' },
];

export type Question = {
  key: string; label: string; type: QType;
  required?: boolean; hint?: string; options?: string[];
  condQKey?: string; condValue?: string;   // показати, якщо відповідь на condQKey === condValue
};
export type Block = { key: string; title: string; role?: string; cat?: string; questions: Question[] };
export type AuditTemplate = { version: number; blocks: Block[] };

/** Ролі всередині заказника — обмежують, хто які блоки заповнює. */
export const CLIENT_ROLES = ['Власник', 'Маркетинг', 'Аналітика', 'Фінанси', 'Технічний', 'Операції'];

export const uid = (p = 'q') => `${p}_${Math.random().toString(36).slice(2, 8)}`;

/** Стартовий шаблон — на базі методології Tier-2 (внутрішньо), клієнту як єдиний аудит. */
export const DEFAULT_TEMPLATE: AuditTemplate = {
  version: 1,
  blocks: [
    { key: 'company', title: 'Компанія та ціль', role: 'Власник', questions: [
      { key: 'goal', label: 'Головна бізнес-ціль на 6–12 міс', type: 'longtext', required: true, hint: 'напр.: вийти на €X виторгу / знизити CAC' },
      { key: 'niche', label: 'Ніша / категорія товарів', type: 'text', required: true },
      { key: 'markets', label: 'Ринки, де продаєте зараз', type: 'text' },
      { key: 'revenue', label: 'Оборот на місяць (€)', type: 'number' },
    ]},
    { key: 'analytics', title: 'Аналітика та доступи', role: 'Аналітика', questions: [
      { key: 'ga4', label: 'Доступ до Google Analytics 4 (email аналітика)', type: 'access', required: true, hint: 'додайте audit@weexp.agency як Переглядач' },
      { key: 'gsc', label: 'Доступ до Search Console', type: 'access' },
      { key: 'traffic', label: 'Основні джерела трафіку', type: 'multi', options: ['SEO', 'Google Ads', 'Meta Ads', 'Email/CRM', 'Маркетплейси', 'Реферали'] },
    ]},
    { key: 'economics', title: 'Юніт-економіка', role: 'Фінанси', questions: [
      { key: 'aov', label: 'Середній чек (€)', type: 'number' },
      { key: 'cogs', label: 'Собівартість / маржа', type: 'text', hint: 'хоча б приблизно' },
      { key: 'repeat', label: 'Частка повторних покупок', type: 'scale', hint: 'оцініть 1–10' },
      { key: 'orders', label: 'Вивантаження замовлень за 12 міс', type: 'file' },
    ]},
    { key: 'tech', title: 'Технічне та процеси', role: 'Технічний', questions: [
      { key: 'platform', label: 'Платформа магазину', type: 'single', options: ['Shopify', 'Magento', 'WooCommerce', 'OpenCart', 'Custom', 'Інше'] },
      { key: 'pains', label: 'Головні болі в процесах', type: 'longtext' },
      { key: 'cms', label: 'Доступ до CMS/адмінки (read-only)', type: 'access' },
    ]},
  ],
};

/* ── Повний C-level фреймворк аудиту (16 модулів A–P) ──
   Кожен модуль = блок із питаннями (Q), доступами (access) і файлами (file).
   Це стартовий каркас: адмін розширює/скорочує під тип бізнесу в конструкторі.
   Завантажується кнопкою «Завантажити фреймворк» (не перетирає збережене без згоди). */
type QI = [string, string, QType, (Partial<Question> | undefined)?];
const mod = (cat: string, key: string, title: string, role: string, items: QI[]): Block => ({
  key, cat, title, role,
  questions: items.map(([k, label, type, extra]) => ({ key: `${key}_${k}`, label, type, ...(extra || {}) })),
});
export const AUDIT_FRAMEWORK: AuditTemplate = {
  version: 1,
  blocks: [
    mod('A', 'company', 'Компанія та бізнес', 'Власник', [
      ['legal', 'Юридична структура, географія, ринки', 'longtext', { required: true }],
      ['model', 'Бізнес-модель', 'multi', { options: ['B2C', 'B2B', 'D2C', 'B2B2C', 'Marketplace'] }],
      ['revenue_src', 'Основні джерела виручки та продукти', 'longtext'],
      ['stage', 'Стадія розвитку', 'single', { options: ['Startup', 'Scale-up', 'Established', 'Enterprise'] }],
      ['goals', 'Цілі та стратегічні пріоритети на 12–36 міс', 'longtext', { required: true }],
      ['constraints', 'Ключові обмеження та проблеми', 'longtext'],
    ]),
    mod('B', 'finance', 'Фінанси та економіка', 'Фінанси', [
      ['turnover', 'Оборот на місяць (€)', 'number', { required: true }],
      ['margin', 'Валова маржа / contribution margin (%)', 'number'],
      ['aov', 'Середній чек (€)', 'number'],
      ['ltv_cac', 'LTV та CAC', 'text'],
      ['unit', 'Юніт-економіка / P&L (вивантаження)', 'file'],
      ['profit_by', 'Прибутковість за категоріями / каналами / ринками', 'longtext'],
    ]),
    mod('C', 'commercial', 'Комерція', 'Маркетинг', [
      ['assortment', 'Асортимент, SKU, hero-products', 'longtext'],
      ['abc', 'ABC/XYZ, прибуткові й збиткові категорії', 'longtext'],
      ['pricing', 'Pricing, discounting, promo-стратегія', 'longtext'],
      ['crosssell', 'Cross-sell / up-sell / bundles', 'text'],
      ['calendar', 'Комерційний календар і sales targets', 'text'],
      ['skus', 'Вивантаження каталогу / SKU', 'file'],
    ]),
    mod('D', 'customer', 'Клієнт / Customer Archetypes', 'Маркетинг', [
      ['ca_main', 'Основний клієнт (CA1): хто, потреби, болі, тригери', 'longtext', { required: true }],
      ['ca_second', 'Вторинний клієнт (CA2)', 'longtext'],
      ['jtbd', 'Jobs-to-be-done і критерії вибору', 'longtext'],
      ['journey', 'Customer journey і post-purchase поведінка', 'longtext'],
      ['retention', 'Retention / churn / частота покупки', 'text'],
      ['research', 'Дослідження аудиторії (файл)', 'file'],
    ]),
    mod('E', 'brand', 'Бренд', 'Маркетинг', [
      ['positioning', 'Позиціонування, місія, візія, цінності', 'longtext'],
      ['diff', 'Differentiation та brand promise', 'longtext'],
      ['awareness', 'Awareness / consideration / preference', 'text'],
      ['nps', 'NPS та репутація', 'text'],
      ['competitors', 'Ключові конкуренти бренду', 'longtext'],
      ['brandbook', 'Brand book / гайдлайни', 'file'],
    ]),
    mod('F', 'marketing', 'Маркетинг', 'Маркетинг', [
      ['strategy', 'Маркетинг-стратегія і channel mix', 'longtext'],
      ['budget', 'Бюджет, CAC, ROAS/ROMI', 'text'],
      ['paid', 'Google Ads / Meta / TikTok (доступ)', 'access'],
      ['channels', 'Активні канали', 'multi', { options: ['Paid search', 'Paid social', 'SEO', 'Email', 'Push/SMS', 'Influencer', 'Affiliate', 'PR', 'Маркетплейси'] }],
      ['attribution', 'Атрибуція та медіа-планування', 'longtext'],
      ['reports', 'Рекламні звіти (файл)', 'file'],
    ]),
    mod('G', 'seo', 'SEO / GEO / AEO / AI-visibility', 'Маркетинг', [
      ['gsc', 'Google Search Console (доступ)', 'access', { required: true }],
      ['organic', 'Органічний трафік: branded / non-branded', 'text'],
      ['tech_seo', 'Технічне SEO, індексація, crawlability', 'longtext'],
      ['backlinks', 'Backlinks / referring domains', 'text'],
      ['ai_visibility', 'AI-видимість: Google AI Overviews, ChatGPT/LLM citations', 'longtext'],
      ['seo_tools', 'Доступ до Ahrefs / Semrush', 'access'],
    ]),
    mod('H', 'ux', 'Сайт / UX / CRO', 'Технічний', [
      ['ia', 'Інформаційна архітектура, навігація, пошук', 'longtext'],
      ['pdp', 'Категорії, PDP, кошик, checkout, mobile UX', 'longtext'],
      ['funnel', 'Воронка конверсії та abandonment', 'text'],
      ['testing', 'A/B-тести, heatmaps, session recordings', 'text'],
      ['cms', 'Доступ до CMS/адмінки (read-only)', 'access'],
      ['cro_impact', 'Звʼязок UX із revenue / margin / conversion', 'longtext'],
    ]),
    mod('I', 'ops', 'E-commerce операції', 'Операції', [
      ['oms', 'Order management, fulfillment, склад', 'longtext'],
      ['inventory', 'Inventory, stock accuracy, forecasting', 'text'],
      ['delivery', 'Доставка, повернення, SLA', 'text'],
      ['support', 'Customer support і логістика', 'text'],
      ['suppliers', 'Постачальники / procurement / supply chain', 'longtext'],
      ['wms_access', 'Доступ до WMS / ERP операцій', 'access'],
    ]),
    mod('J', 'crm', 'CRM / Retention', 'Маркетинг', [
      ['crm_access', 'Доступ до CRM (Klaviyo/HubSpot/eSputnik...)', 'access', { required: true }],
      ['segmentation', 'Сегментація, RFM, lifecycle', 'longtext'],
      ['loyalty', 'Loyalty, cashback, referral, subscriptions', 'text'],
      ['flows', 'Abandoned cart, win-back, reactivation', 'text'],
      ['cohort', 'Cohort analysis, CLV', 'text'],
      ['crm_export', 'Вивантаження клієнтів / CRM (файл)', 'file'],
    ]),
    mod('K', 'analytics', 'Аналітика та BI', 'Аналітика', [
      ['ga4', 'Google Analytics 4 (доступ)', 'access', { required: true }],
      ['gtm', 'GTM та event tracking', 'access'],
      ['dwh', 'Data warehouse / dashboards / Power BI / Looker', 'longtext'],
      ['quality', 'Якість даних, data governance, source of truth', 'longtext'],
      ['kpi', 'KPI framework і forecasting', 'text'],
      ['seams', 'Розбіжності між платформою / аналітикою / рекламою / CRM', 'longtext'],
    ]),
    mod('L', 'tech', 'Технології', 'Технічний', [
      ['platform', 'Платформа магазину', 'single', { options: ['Shopify', 'WooCommerce', 'Magento', 'OpenCart', 'Custom', 'Інше'] }],
      ['stack', 'CRM / ERP / WMS / PIM / CDP', 'longtext'],
      ['integrations', 'Інтеграції, API, архітектура', 'longtext'],
      ['debt', 'Технічний борг, performance, security', 'longtext'],
      ['scalability', 'Scalability і monitoring', 'text'],
      ['arch', 'Схема архітектури / тех-документація (файл)', 'file'],
    ]),
    mod('M', 'people', 'Люди та організація', 'Власник', [
      ['team', 'Структура команди, ролі, headcount', 'longtext'],
      ['competencies', 'Компетенції, вакансії, аутсорс', 'text'],
      ['accountability', 'Accountability, KPI/OKR', 'text'],
      ['bottlenecks', 'Організаційні вузькі місця', 'longtext'],
      ['orgchart', 'Оргструктура (файл)', 'file'],
    ]),
    mod('N', 'processes', 'Процеси', 'Операції', [
      ['sales_proc', 'Sales / marketing / merchandising процеси', 'longtext'],
      ['fulfillment_proc', 'Procurement / fulfillment / customer service', 'longtext'],
      ['finance_proc', 'Finance / analytics / product management', 'text'],
      ['approvals', 'Approval / release / incident management', 'text'],
      ['maps', 'Process maps (файл)', 'file'],
    ]),
    mod('O', 'strategy', 'Стратегія', 'Власник', [
      ['vision', 'Стратегічна візія та growth-модель', 'longtext'],
      ['advantage', 'Конкурентна перевага і позиція на ринку', 'longtext'],
      ['expansion', 'Нові ринки / канали / продукти', 'longtext'],
      ['invest', 'Інвестиційні пріоритети та ризики', 'text'],
      ['roadmap', 'Roadmap 12/24/36 міс', 'longtext'],
    ]),
    mod('P', 'competition', 'Конкуренти', 'Маркетинг', [
      ['direct', 'Прямі та непрямі конкуренти, лідери ринку', 'longtext'],
      ['compare', 'Порівняння: ціни, асортимент, позиціонування', 'longtext'],
      ['channels_comp', 'Конкуренти: трафік, SEO, paid, UX, retention', 'longtext'],
      ['share', 'Частка ринку / share of voice', 'text'],
      ['research_comp', 'Конкурентний аналіз (файл)', 'file'],
    ]),
  ],
};

/* ── Пресети фреймворку під тип бізнесу ──
   Кожен пресет = підмножина модулів A–P у своєму порядку (скоуп під тип
   замовника). Адмін вантажить пресет як стартову структуру й доопрацьовує. */
export const FRAMEWORK_PRESETS: { id: string; label: string; modules: string[] }[] = [
  { id: 'full', label: 'Повний (D2C / e-commerce)', modules: ['company', 'finance', 'commercial', 'customer', 'brand', 'marketing', 'seo', 'ux', 'ops', 'crm', 'analytics', 'tech', 'people', 'processes', 'strategy', 'competition'] },
  { id: 'b2b', label: 'B2B', modules: ['company', 'strategy', 'commercial', 'customer', 'marketing', 'crm', 'finance', 'seo', 'ux', 'analytics', 'tech', 'people', 'processes', 'competition'] },
  { id: 'marketplace', label: 'Marketplace', modules: ['company', 'finance', 'commercial', 'ops', 'marketing', 'seo', 'analytics', 'competition', 'customer', 'ux', 'tech', 'strategy'] },
  { id: 'omnichannel', label: 'Omnichannel retail', modules: ['company', 'finance', 'commercial', 'customer', 'brand', 'marketing', 'seo', 'ux', 'ops', 'crm', 'analytics', 'tech', 'people', 'processes', 'strategy', 'competition'] },
  { id: 'saas', label: 'SaaS / послуги', modules: ['company', 'strategy', 'finance', 'customer', 'brand', 'marketing', 'seo', 'ux', 'crm', 'analytics', 'tech', 'people', 'processes', 'competition'] },
];
/** Свіжий блок «Customer Archetype» (CA1…CAn) — окремий набір питань під портрет аудиторії. */
export function customerArchetypeBlock(n: number): Block {
  const key = uid('ca');
  const items: [string, string, QType, (Partial<Question> | undefined)?][] = [
    ['who', `Хто цей клієнт (CA${n}): demographics / business profile`, 'longtext', { required: true }],
    ['geo', 'Географія, дохід / розмір бізнесу', 'text'],
    ['jtbd', 'Потреби та jobs-to-be-done', 'longtext'],
    ['pains', 'Болі, мотивація, барʼєри, заперечення', 'longtext'],
    ['criteria', 'Критерії вибору та тригери покупки', 'text'],
    ['value', 'Частота покупки, середній чек, LTV', 'text'],
    ['retention', 'Retention / churn / preferred channels', 'text'],
    ['journey', 'Customer journey і post-purchase поведінка', 'longtext'],
  ];
  return { key, cat: 'D', title: `Клієнт — CA${n}`, role: 'Маркетинг', questions: items.map(([k, label, type, extra]) => ({ key: `${key}_${k}`, label, type, ...(extra || {}) })) };
}

/** Побудувати шаблон під пресет: модулі AUDIT_FRAMEWORK у порядку пресету. */
export function frameworkFor(presetId: string): AuditTemplate {
  const preset = FRAMEWORK_PRESETS.find((p) => p.id === presetId) || FRAMEWORK_PRESETS[0];
  const byKey = new Map(AUDIT_FRAMEWORK.blocks.map((b) => [b.key, b]));
  const blocks = preset.modules.map((k) => byKey.get(k)).filter((b): b is Block => !!b);
  return { version: 1, blocks: structuredClone(blocks) };
}

const LS_KEY = 'weexp:audit-template-v1';

export async function loadTemplate(): Promise<AuditTemplate> {
  if (CONFIGURED) {
    try {
      const { data } = await supabase.from('audit_template').select('version,schema').eq('active', true).maybeSingle();
      const schema = data?.schema as { blocks?: Block[] } | undefined;
      if (schema?.blocks) return { version: (data?.version as number) || 1, blocks: schema.blocks };
    } catch { /* fallback */ }
  }
  try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r) as AuditTemplate; } catch { /* ignore */ }
  return DEFAULT_TEMPLATE;
}

export async function saveTemplate(t: AuditTemplate): Promise<{ ok: boolean; error?: string; local?: boolean }> {
  const next: AuditTemplate = { ...t, version: (t.version || 1) };
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  if (!CONFIGURED) return { ok: true, local: true };
  try {
    // Нова версія активна; попередні лишаються (заморожені для вже початих аудитів).
    await supabase.from('audit_template').update({ active: false }).eq('active', true);
    const { error } = await supabase.from('audit_template').upsert({ version: next.version, schema: { blocks: next.blocks }, active: true });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
