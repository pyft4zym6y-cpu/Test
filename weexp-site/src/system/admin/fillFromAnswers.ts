/**
 * Профіль компанії з відповідей анкети.
 *
 * Клієнт заповнює сотні питань — і менеджер після цього руками переносить у
 * картку назву, платформу, ринки, канали. Дані вже є в системі; переписування
 * їх удруге не додає нічого, крім місця, де можна помилитись.
 *
 * Два принципи, від яких тут усе залежить.
 *
 * ПЕРШИЙ: нічого не перетирати. Якщо в картці вже є значення — воно виграє,
 * навіть коли анкета каже інше. Менеджер міг уточнити його в розмові, і його
 * правка не має зникати від того, що клієнт дозаповнив анкету.
 *
 * ДРУГИЙ: це ПРОПОЗИЦІЯ, а не запис. Функція повертає, що вона хоче поставити
 * і звідки взяла, а рішення лишається за людиною. Автозаповнення, яке пише
 * саме, рано чи пізно тихо зіпсує картку — і ніхто не згадає, звідки взялось
 * дивне значення.
 */
import type { AuditAnswer, CompanyProfile, DiagRecord } from '@/lib/supa';

export type Suggestion = {
  /** Поле профілю. */
  field: keyof CompanyProfile;
  label: string;
  value: string | string[];
  /** Ключ питання анкети, з якого взято — щоб можна було перевірити джерело. */
  from: string;
  /** Що зараз стоїть у картці (порожньо = поле вільне). */
  current?: string;
};

const str = (v: unknown): string => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean).join(', ');
  if (typeof v === 'object') return '';
  return String(v).trim();
};

const arr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  const s = str(v);
  return s ? s.split(/[,;]\s*/).filter(Boolean) : [];
};

/**
 * Карта «ключ анкети → поле профілю». Ключі — з шаблону адмінки
 * (`auditTemplate.ts`), бо саме він пише в `audit_answers`; каталог портала
 * має власні id і сюди не потрапляє.
 */
const MAP: { key: string; field: keyof CompanyProfile; label: string; list?: boolean }[] = [
  { key: 'company_niche', field: 'niche', label: 'Ніша' },
  { key: 'company_markets', field: 'markets', label: 'Ринки' },
  { key: 'company_revenue', field: 'revenue', label: 'Оборот' },
  { key: 'business_model_one', field: 'model', label: 'Бізнес-модель' },
  { key: 'business_model', field: 'bizType', label: 'Тип бізнесу', list: true },
  { key: 'business_geo_now', field: 'countries', label: 'Країни роботи' },
  { key: 'technology_platform_v', field: 'platform', label: 'Платформа' },
  { key: 'technology_integrations', field: 'crmErp', label: 'CRM / ERP', list: true },
  { key: 'expansion_focus', field: 'categories', label: 'Напрям експансії' },
  { key: 'analytics_traffic', field: 'acqChannels', label: 'Канали залучення', list: true },
  { key: 'organization_org', field: 'teamSize', label: 'Команда' },
];

/**
 * Що можна проставити з анкети. Порожні відповіді та вже заповнені поля
 * пропускаємо: пропонувати перезаписати те, що менеджер уточнив у розмові, —
 * найшвидший спосіб зробити автозаповнення шкідливим.
 */
export function suggestProfile(
  rec: DiagRecord,
  answers: Record<string, AuditAnswer>,
): Suggestion[] {
  const company = rec.company || {};
  const out: Suggestion[] = [];
  for (const m of MAP) {
    const raw = answers[m.key]?.value;
    const value = m.list ? arr(raw) : str(raw);
    if (!value || (Array.isArray(value) && !value.length)) continue;

    const cur = company[m.field];
    const currentStr = Array.isArray(cur) ? cur.join(', ') : str(cur);
    if (currentStr) continue;                    // зайнято — не чіпаємо

    out.push({ field: m.field, label: m.label, value, from: m.key });
  }
  return out;
}

/** Застосувати вибрані пропозиції. Повертає НОВИЙ профіль, вихідний не чіпає. */
export function applySuggestions(company: CompanyProfile, picked: Suggestion[]): CompanyProfile {
  const next: CompanyProfile = { ...company };
  for (const s of picked) {
    // Поля-списки в профілі мають тип string[], решта — string. Розводимо явно:
    // покласти масив у строкове поле означає отримати «[object Object]» у картці.
    if (s.field === 'channels' || s.field === 'acqChannels') {
      next[s.field] = Array.isArray(s.value) ? s.value : arr(s.value);
    } else if (s.field !== 'team') {
      (next as Record<string, unknown>)[s.field] = Array.isArray(s.value) ? s.value.join(', ') : s.value;
    }
  }
  return next;
}

/**
 * Скільки з анкети вже можна перенести. Потрібно для підказки в картці:
 * менеджер має бачити, що є що переносити, не відкриваючи окремий екран.
 */
export function fillableCount(rec: DiagRecord, answers: Record<string, AuditAnswer>): number {
  return suggestProfile(rec, answers).length;
}
