/**
 * Готовність до прогону: що рушій зможе, а чого — ні, ДО того як його запустили.
 *
 * Кнопка «Запустити аудит» активна завжди, навіть коли клієнт не відкрив
 * жодної системи й не завантажив жодного файлу. Прогін відпрацює, витратить
 * час і токени й видасть звіт, у якому пів документа буде «даних немає».
 * Дізнатись про це через сорок хвилин — дорого; дізнатись до запуску — безкоштовно.
 *
 * Це не заборона. Прогін без доступів має сенс: він дає зовнішній шар (обхід,
 * SEO, UX, швидкість) і сам собою корисний. Сенсу немає в іншому — запустити
 * його, НЕ ЗНАЮЧИ, що вийде, а потім пояснювати клієнту, чому фінансовий
 * розділ порожній.
 *
 * Тому оцінка каже не «можна / не можна», а «ось що вийде і чого бракує».
 */
import type { DiagRecord } from '@/lib/supa';

export type DocReadiness = {
  code: string;
  title: string;
  /** 0–100: яку частку входів документа ми маємо. */
  pct: number;
  /** Чого бракує — конкретними назвами, а не «немає даних». */
  missing: string[];
  /** Джерела, які вже є. */
  have: string[];
};

export type Readiness = {
  /** Середнє по документах — одне число для заголовка. */
  overall: number;
  docs: DocReadiness[];
  /** Що просити в клієнта в першу чергу: найбільший приріст за найменших зусиль. */
  asks: { what: string; unlocks: string[]; kind: 'access' | 'file' | 'answers' }[];
  verdict: string;
};

/** Що живить кожен документ. `crawl` — те, що ми беремо самі, без клієнта. */
type Need = { access?: string[]; file?: string[]; answers?: string[]; crawl?: number };

/** Вага обходу в кожному документі: скільки відсотків ми даємо БЕЗ клієнта. */
const NEEDS: Record<string, { title: string; need: Need }> = {
  A1: { title: 'Business', need: { crawl: 10, file: ['pnl', 'unit'], answers: ['business'] } },
  A2: { title: 'Market', need: { crawl: 55, answers: ['market'] } },
  A3: { title: 'Product', need: { crawl: 30, file: ['skusales', 'catalog'], answers: ['product'] } },
  A4: { title: 'Customer', need: { crawl: 20, file: ['orders'], answers: ['customer'] } },
  A5: { title: 'Website', need: { crawl: 90, answers: ['website'] } },
  A6: { title: 'SEO/GEO', need: { crawl: 60, access: ['CB-03'], answers: ['seo'] } },
  A7: { title: 'Acquisition', need: { crawl: 15, access: ['CB-07', 'CB-08'], answers: ['acquisition'] } },
  A8: { title: 'CRM', need: { crawl: 20, access: ['CB-09'], answers: ['crm'] } },
  A9: { title: 'Analytics', need: { crawl: 25, access: ['CB-01', 'CB-02'], answers: ['analytics'] } },
  A10: { title: 'Operations', need: { crawl: 30, access: ['CB-10'], answers: ['operations'] } },
  A11: { title: 'Technology', need: { crawl: 60, access: ['CB-05'], answers: ['technology'] } },
  A12: { title: 'Organization', need: { crawl: 0, answers: ['organization'] } },
  A13: { title: 'Експансія', need: { crawl: 35, answers: ['expansion'] } },
};

/** Людські назви систем — щоб «AC-03» не потрапляло в текст для менеджера. */
const ACCESS_LABEL: Record<string, string> = {
  'CB-01': 'Google Analytics 4', 'CB-02': 'Google Tag Manager', 'CB-03': 'Search Console',
  'CB-05': 'Адмінка сайту', 'CB-07': 'Google Ads', 'CB-08': 'Meta Ads', 'CB-09': 'CRM / ESP',
  'CB-10': 'ERP / 1C / Odoo',
};
const FILE_LABEL: Record<string, string> = {
  pnl: 'P&L за 12–24 міс', unit: 'Юніт-економіка', orders: 'Вивантаження замовлень',
  skusales: 'Продажі по SKU', catalog: 'Каталог товарів',
};

const granted = (rec: DiagRecord, id: string) => {
  const st = rec.accessLog?.[id]?.status;
  return st === 'granted' || st === 'verified';
};
const hasFile = (rec: DiagRecord, key: string) =>
  (rec.clientFiles || []).some((f) => `${f.title || ''} ${f.group || ''} ${f.type || ''}`.toLowerCase().includes(key.toLowerCase()))
  || (rec.clientFiles || []).some((f) => (f as { k?: string }).k === key);

/**
 * Чи був насправді прогін рушієм. Панель — ПРОГНОЗ («що вийде з прогону»), тож
 * вага обходу в ній нараховується авансом і це правильно. Неправильним було
 * слово: у списку «є» стояло «обхід сайту» — теперішнім часом, ніби ці дані вже
 * на руках. Менеджер відкривав картку клієнта, який не заповнив нічого, і бачив
 * «A5 90% · є: обхід сайту». Відсоток чесний, формулювання — ні.
 */
export const hasCrawl = (rec: DiagRecord): boolean =>
  (rec.auditJobs || []).some((j) => !/(fail|error|queued|running)/i.test(j.status || ''));

export function assessReadiness(rec: DiagRecord, answeredShare = 0): Readiness {
  const docs: DocReadiness[] = [];
  const crawled = hasCrawl(rec);

  for (const [code, { title, need }] of Object.entries(NEEDS)) {
    const base = need.crawl ?? 0;
    const have: string[] = [];
    const missing: string[] = [];

    // Решта відсотків ділиться порівну між доступами, файлами й анкетою —
    // рівно тими, що цей документ справді потребує.
    const slots = (need.access?.length ?? 0) + (need.file?.length ?? 0) + (need.answers?.length ? 1 : 0);
    const per = slots ? (100 - base) / slots : 0;
    let pct = base;
    if (base > 0) have.push(crawled ? 'обхід сайту' : 'обхід сайту — дасть прогін');

    for (const id of need.access ?? []) {
      if (granted(rec, id)) { pct += per; have.push(ACCESS_LABEL[id] || id); }
      else missing.push(ACCESS_LABEL[id] || id);
    }
    for (const key of need.file ?? []) {
      if (hasFile(rec, FILE_LABEL[key] || key)) { pct += per; have.push(FILE_LABEL[key] || key); }
      else missing.push(FILE_LABEL[key] || key);
    }
    if (need.answers?.length) {
      pct += per * answeredShare;
      if (answeredShare >= 0.6) have.push('анкета');
      else missing.push(`анкета (заповнено ${Math.round(answeredShare * 100)} %)`);
    }

    docs.push({ code, title, pct: Math.round(Math.min(100, pct)), missing, have });
  }

  const overall = Math.round(docs.reduce((s, d) => s + d.pct, 0) / docs.length);

  // Що просити першим: рахуємо, скільки документів розблокує кожен пункт.
  const unlockMap = new Map<string, { kind: 'access' | 'file' | 'answers'; docs: string[] }>();
  for (const d of docs) {
    for (const m of d.missing) {
      const kind: 'access' | 'file' | 'answers' = m.startsWith('анкета') ? 'answers'
        : Object.values(FILE_LABEL).includes(m) ? 'file' : 'access';
      const key = kind === 'answers' ? 'Заповнена анкета' : m;
      const cur = unlockMap.get(key) || { kind, docs: [] };
      cur.docs.push(d.code);
      unlockMap.set(key, cur);
    }
  }
  const asks = [...unlockMap.entries()]
    .map(([what, v]) => ({ what, unlocks: v.docs, kind: v.kind }))
    .sort((a, b) => b.unlocks.length - a.unlocks.length)
    .slice(0, 6);

  const verdict = overall >= 75
    ? 'Даних достатньо: прогін дасть повний звіт.'
    : overall >= 45
      ? 'Прогін має сенс, але частина розділів буде на зовнішніх даних. Нижче — що додати, щоб закрити прогалини.'
      : 'Зараз вийде переважно зовнішній аудит: сайт, SEO, UX, швидкість. Фінанси, реклама й клієнтська база лишаться без даних — це варто сказати клієнту ДО прогону, а не після.';

  return { overall, docs: docs.sort((a, b) => a.pct - b.pct), asks, verdict };
}
