/**
 * CrUX — Chrome UX Report: РЕАЛЬНЫЕ полевые Core Web Vitals от живых
 * пользователей Chrome. Бесплатно, ключ Google, без OAuth.
 *
 * Почему это в аудите важнее PageSpeed: PageSpeed — лабораторный замер одного
 * прогона с нашей машины. CrUX — распределение по реальным посетителям за 28
 * дней. И главное: данные отдаются по ЛЮБОМУ origin, то есть конкурентов можно
 * измерить, не имея от них ни одного доступа.
 *
 * Env: CRUX_API_KEY (ключ Google Cloud с включённым Chrome UX Report API).
 * Нет ключа — модуль возвращает null, аудит идёт дальше на лабораторных данных.
 */
const ENDPOINT = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

export type CruxMetric = { p75: number | null; good: number; ni: number; poor: number };
export type CruxRecord = {
  origin: string;
  formFactor: 'PHONE' | 'DESKTOP';
  period?: string;
  lcp: CruxMetric | null;
  inp: CruxMetric | null;
  cls: CruxMetric | null;
  ttfb: CruxMetric | null;
  /** true — у origin недостаточно трафика для публикации (сам по себе вывод). */
  insufficientData?: boolean;
};

export const hasCrux = (): boolean => Boolean(process.env.CRUX_API_KEY);

/** Доля наблюдений в бакете. CrUX отдаёт три бакета: good / needs improvement / poor. */
function parseMetric(m: unknown): CruxMetric | null {
  const o = m as { percentiles?: { p75?: number | string }; histogram?: { density?: number }[] } | undefined;
  if (!o) return null;
  const raw = o.percentiles?.p75;
  const p75 = raw == null ? null : Number(raw);
  const h = o.histogram || [];
  const d = (i: number) => Math.round(((h[i]?.density ?? 0) as number) * 1000) / 10;
  return { p75: Number.isFinite(p75 as number) ? (p75 as number) : null, good: d(0), ni: d(1), poor: d(2) };
}

export async function fetchCrux(
  origin: string,
  formFactor: 'PHONE' | 'DESKTOP' = 'PHONE',
  log?: (m: string) => void,
): Promise<CruxRecord | null> {
  const key = process.env.CRUX_API_KEY;
  if (!key) return null;
  let url: string;
  try {
    url = new URL(origin.startsWith('http') ? origin : `https://${origin}`).origin;
  } catch {
    return null;
  }
  try {
    const r = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ origin: url, formFactor }),
    });
    // 404 — у origin слишком мало трафика для публикации. Это не сбой, а факт:
    // «сайт ниже порога видимости CrUX» — сам по себе вывод для отчёта.
    if (r.status === 404) return { origin: url, formFactor, lcp: null, inp: null, cls: null, ttfb: null, insufficientData: true };
    if (!r.ok) {
      log?.(`⚠️ CrUX ${url}: HTTP ${r.status}`);
      return null;
    }
    const j = await r.json() as { record?: { metrics?: Record<string, unknown>; collectionPeriod?: { firstDate?: unknown; lastDate?: unknown } } };
    const m = j.record?.metrics || {};
    const per = j.record?.collectionPeriod;
    const day = (d: unknown) => {
      const o = d as { year?: number; month?: number; day?: number } | undefined;
      return o?.year ? `${o.year}-${String(o.month).padStart(2, '0')}-${String(o.day).padStart(2, '0')}` : '';
    };
    return {
      origin: url,
      formFactor,
      period: per ? `${day(per.firstDate)}…${day(per.lastDate)}` : undefined,
      lcp: parseMetric(m.largest_contentful_paint),
      inp: parseMetric(m.interaction_to_next_paint),
      cls: parseMetric(m.cumulative_layout_shift),
      ttfb: parseMetric(m.experimental_time_to_first_byte),
    };
  } catch (e) {
    log?.(`⚠️ CrUX ${url}: ${String(e).slice(0, 80)}`);
    return null;
  }
}

/** Клиент против конкурентов на РЕАЛЬНЫХ пользователях — без доступов к ним. */
export async function cruxBenchmark(
  client: string,
  competitors: string[],
  log?: (m: string) => void,
): Promise<{ client: CruxRecord | null; competitors: CruxRecord[]; note: string }> {
  if (!hasCrux()) {
    return { client: null, competitors: [], note: 'CRUX_API_KEY не задан — полевые данные не собраны, выводы по скорости опираются на лабораторный замер' };
  }
  log?.('· CrUX: полевые Core Web Vitals клиента и конкурентов…');
  const c = await fetchCrux(client, 'PHONE', log);
  const rivals: CruxRecord[] = [];
  for (const r of competitors.slice(0, 5)) {
    const rec = await fetchCrux(r, 'PHONE', log);
    if (rec) rivals.push(rec);
  }
  const thin = [c, ...rivals].filter((x) => x?.insufficientData).length;
  return {
    client: c,
    competitors: rivals,
    note: `Поле CrUX (мобайл), 28 дней. Сайтов ниже порога публикации: ${thin}.`,
  };
}

/** Строка для промпта: поле важнее лабы, поэтому подаётся отдельным фактом. */
export function cruxToFacts(b: { client: CruxRecord | null; competitors: CruxRecord[]; note: string }): string {
  const line = (r: CruxRecord, label: string) => {
    if (r.insufficientData) return `${label}: данных CrUX нет (трафик ниже порога публикации)`;
    const f = (m: CruxMetric | null, unit: string) => (m?.p75 == null ? '—' : `${m.p75}${unit} (good ${m.good}%, poor ${m.poor}%)`);
    return `${label}: LCP ${f(r.lcp, 'мс')} · INP ${f(r.inp, 'мс')} · CLS ${f(r.cls, '')}`;
  };
  const L = ['ПОЛЕВЫЕ ДАННЫЕ CrUX (реальные пользователи Chrome, 28 дней, мобайл):'];
  if (b.client) L.push(line(b.client, 'КЛИЕНТ'));
  b.competitors.forEach((r, i) => L.push(line(r, `конкурент ${i + 1} (${r.origin})`)));
  L.push(b.note);
  L.push('Это поле, а не лаборатория: если лабораторный замер расходится с CrUX — верь CrUX.');
  return L.join('\n');
}
