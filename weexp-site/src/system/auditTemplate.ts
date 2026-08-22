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
export type Block = { key: string; title: string; role?: string; questions: Question[] };
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
