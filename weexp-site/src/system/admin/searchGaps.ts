/**
 * Розбір даних Search Console у зрізи, які реально ведуть до дії.
 *
 * Досі GSC у нас був превʼю: чотири KPI і топ-10 запитів на екрані менеджера.
 * Дані нікуди не зберігались і в рушій не їхали — тобто найдорожчий рівень
 * доказовості (L1, прямий доступ до системи клієнта) закінчувався картинкою.
 *
 * Тут — чотири класичні зрізи по парах «сторінка × запит», кожен зі своєю дією:
 *   • striking distance — позиції 4–20: найкоротший шлях до кліків;
 *   • канібалізація     — один запит тягне кілька сторінок: вони бʼються між собою;
 *   • розрив CTR        — позиція є, кліків немає: проблема в title/description;
 *   • згасання          — сторінка втрачає кліки період-до-періоду.
 *
 * ВАЖЛИВО про потенціал. Оцінка «скільки кліків можна забрати» рахується за
 * усередненою кривою CTR по позиціях. Це БЕНЧМАРК, а не факт цього сайту:
 * реальний CTR залежить від ніші, типу видачі й бренду. Тому потенціал завжди
 * підписаний як оцінка й ніколи не подається як виміряне значення — інакше ми
 * порушуємо власне правило про рівні доказовості.
 */

export type GscRow = {
  page: string; query: string;
  clicks: number; impressions: number; ctr: number; position: number;
};

export type StrikingItem = { query: string; page: string; impressions: number; clicks: number; position: number; upliftEst: number };
export type CannibalItem = { query: string; impressions: number; pages: { page: string; clicks: number; impressions: number; position: number }[] };
export type CtrGapItem = { query: string; page: string; impressions: number; clicks: number; position: number; ctr: number; expectedCtr: number };
export type DecayItem = { page: string; clicksNow: number; clicksPrev: number; dropPct: number };

export type SearchDigest = {
  at: string;
  site: string;
  period: { start: string; end: string };
  prevPeriod?: { start: string; end: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  counts: { rows: number; pages: number; queries: number; truncated?: boolean };
  striking: StrikingItem[];
  cannibal: CannibalItem[];
  ctrGap: CtrGapItem[];
  decay: DecayItem[];
};

/**
 * Усереднена крива CTR органічної видачі по позиціях. Значення — порядок
 * величини з публічних галузевих зведень, а не замір цього сайту. Використовується
 * ЛИШЕ для оцінки потенціалу й для того, щоб помітити аномально низький CTR;
 * жодне число звідси не потрапляє у звіт як факт.
 */
const CTR_CURVE: Record<number, number> = {
  1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.06,
  6: 0.05, 7: 0.04, 8: 0.032, 9: 0.028, 10: 0.025,
};
export const CTR_CURVE_NOTE = 'усереднена галузева крива CTR по позиціях — оцінка, не замір цього сайту';

/** Очікуваний CTR для позиції. Нижче топ-10 крива згасає повільно й передбачувано. */
export function expectedCtr(position: number): number {
  if (!Number.isFinite(position) || position < 1) return 0;
  const p = Math.round(position);
  if (p <= 10) return CTR_CURVE[p] ?? 0.025;
  if (p <= 20) return 0.012;
  if (p <= 50) return 0.004;
  return 0.001;
}

const norm = (r: GscRow): GscRow => ({
  page: String(r.page || ''),
  query: String(r.query || ''),
  clicks: Number(r.clicks) || 0,
  impressions: Number(r.impressions) || 0,
  // CTR у GSC приходить часткою (0.043). Якщо десь приїхало у відсотках — не
  // виправляємо мовчки: рахуємо свій з кліків і показів, це надійніше.
  ctr: Number(r.impressions) > 0 ? (Number(r.clicks) || 0) / Number(r.impressions) : 0,
  position: Number(r.position) || 0,
});

export type GapOptions = {
  /** Мінімум показів за період, нижче якого рядок — шум, а не сигнал. */
  minImpressions?: number;
  /** Скільки позицій віддавати в кожен зріз. */
  limit?: number;
};

/**
 * Запити, що стоять на позиціях 4–20 з відчутними показами. Класичний
 * «striking distance»: сторінка вже релевантна для Google, до кліків не вистачає
 * кількох позицій — це дешевше, ніж створювати нову сторінку з нуля.
 */
export function striking(rows: GscRow[], opts: GapOptions = {}): StrikingItem[] {
  const min = opts.minImpressions ?? 50;
  const limit = opts.limit ?? 40;
  return rows.map(norm)
    .filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= min)
    .map((r) => ({
      query: r.query, page: r.page,
      impressions: r.impressions, clicks: r.clicks,
      position: Math.round(r.position * 10) / 10,
      // Ціль — третя позиція, а не перша: обіцяти перше місце по кривій CTR
      // означало б продавати число, яке ми не контролюємо.
      upliftEst: Math.max(0, Math.round(r.impressions * (expectedCtr(3) - r.ctr))),
    }))
    .sort((a, b) => b.upliftEst - a.upliftEst || b.impressions - a.impressions)
    .slice(0, limit);
}

/**
 * Один запит — кілька сторінок у видачі. Сам факт не завжди шкода (бренд,
 * різні інтенти), тому фіксуємо як сигнал до перевірки, а не як діагноз.
 * Поріг у частці показів відсіює хвіст, де друга сторінка зачепилась випадково.
 */
export function cannibalization(rows: GscRow[], opts: GapOptions = {}): CannibalItem[] {
  const min = opts.minImpressions ?? 50;
  const limit = opts.limit ?? 20;
  const byQuery = new Map<string, GscRow[]>();
  for (const r of rows.map(norm)) {
    if (!r.query || !r.page) continue;
    const list = byQuery.get(r.query);
    if (list) list.push(r); else byQuery.set(r.query, [r]);
  }
  const out: CannibalItem[] = [];
  for (const [query, list] of byQuery) {
    const impressions = list.reduce((s, r) => s + r.impressions, 0);
    if (impressions < min) continue;
    // Сторінка враховується, якщо тягне щонайменше десяту частину показів запиту.
    const pages = list.filter((r) => r.impressions >= impressions * 0.1)
      .sort((a, b) => b.impressions - a.impressions);
    if (pages.length < 2) continue;
    out.push({
      query, impressions,
      pages: pages.map((r) => ({
        page: r.page, clicks: r.clicks, impressions: r.impressions,
        position: Math.round(r.position * 10) / 10,
      })),
    });
  }
  return out.sort((a, b) => b.impressions - a.impressions).slice(0, limit);
}

/**
 * Позиція є, кліків немає. Якщо фактичний CTR помітно нижчий за очікуваний для
 * цієї позиції — сторінку бачать і не обирають: причина в сніпеті, а не в SEO.
 */
export function ctrGap(rows: GscRow[], opts: GapOptions = {}): CtrGapItem[] {
  const min = opts.minImpressions ?? 100;
  const limit = opts.limit ?? 25;
  return rows.map(norm)
    .filter((r) => r.position >= 1 && r.position <= 10 && r.impressions >= min)
    .map((r) => ({ r, exp: expectedCtr(r.position) }))
    // Half of the benchmark: менший розрив крива не відрізняє від шуму ніші.
    .filter(({ r, exp }) => r.ctr < exp * 0.5)
    .map(({ r, exp }) => ({
      query: r.query, page: r.page, impressions: r.impressions, clicks: r.clicks,
      position: Math.round(r.position * 10) / 10,
      ctr: Math.round(r.ctr * 10000) / 100,
      expectedCtr: Math.round(exp * 10000) / 100,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

/**
 * Сторінки, що втратили кліки період-до-періоду. Абсолютний поріг обовʼязковий:
 * падіння з 3 кліків до 1 — це «−67 %» і чистий шум.
 */
export function decay(
  now: GscRow[], prev: GscRow[],
  opts: { minClicks?: number; minDropPct?: number; limit?: number } = {},
): DecayItem[] {
  const minClicks = opts.minClicks ?? 20;
  const minDrop = opts.minDropPct ?? 30;
  const limit = opts.limit ?? 25;
  const sum = (rows: GscRow[]) => {
    const m = new Map<string, number>();
    for (const r of rows.map(norm)) if (r.page) m.set(r.page, (m.get(r.page) ?? 0) + r.clicks);
    return m;
  };
  const a = sum(prev); const b = sum(now);
  const out: DecayItem[] = [];
  for (const [page, clicksPrev] of a) {
    if (clicksPrev < minClicks) continue;
    const clicksNow = b.get(page) ?? 0;
    const dropPct = Math.round(((clicksPrev - clicksNow) / clicksPrev) * 100);
    if (dropPct < minDrop) continue;
    out.push({ page, clicksNow, clicksPrev, dropPct });
  }
  return out.sort((x, y) => (y.clicksPrev - y.clicksNow) - (x.clicksPrev - x.clicksNow)).slice(0, limit);
}

/** Повний зріз під збереження в базу знань і відправку в рушій. */
export function buildSearchDigest(input: {
  site: string;
  period: { start: string; end: string };
  prevPeriod?: { start: string; end: string };
  rows: GscRow[];
  prevRows?: GscRow[];
  truncated?: boolean;
  at?: string;
}): SearchDigest {
  const rows = (input.rows || []).map(norm);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  // Середня позиція — зважена за показами. Проста середня по рядках дає перевагу
  // хвосту з трьома показами й малює позицію, якої в клієнта немає.
  const posWeighted = impressions > 0
    ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions
    : 0;
  return {
    at: input.at ?? new Date().toISOString(),
    site: input.site,
    period: input.period,
    prevPeriod: input.prevPeriod,
    totals: {
      clicks, impressions,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      position: Math.round(posWeighted * 10) / 10,
    },
    counts: {
      rows: rows.length,
      pages: new Set(rows.map((r) => r.page)).size,
      queries: new Set(rows.map((r) => r.query)).size,
      ...(input.truncated ? { truncated: true } : {}),
    },
    striking: striking(rows),
    cannibal: cannibalization(rows),
    ctrGap: ctrGap(rows),
    decay: input.prevRows?.length ? decay(rows, input.prevRows.map(norm)) : [],
  };
}

/** Один рядок підсумку для екрана менеджера. */
export function digestSummary(d: SearchDigest): string {
  const parts = [
    `${d.counts.queries} запитів на ${d.counts.pages} сторінках`,
    `${d.striking.length} у зоні 4–20`,
    `${d.cannibal.length} канібалізацій`,
    `${d.ctrGap.length} розривів CTR`,
  ];
  if (d.prevPeriod) parts.push(`${d.decay.length} сторінок згасають`);
  return parts.join(' · ');
}
