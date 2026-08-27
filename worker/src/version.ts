/**
 * Версии методологии и движка — для воспроизводимости и change control.
 *
 * ПРАВИЛО: METHODOLOGY_VERSION поднимается при ЛЮБОМ изменении, которое может изменить
 * результат аудита — вопросы, скоринг, веса, бенчмарки, пороги, тиры, промпты, модель по
 * умолчанию. Каждый прогон штампуется этой версией (см. runrecord.ts), чтобы результат
 * можно было отследить к конкретному состоянию методологии. См. data room: Change Control,
 * Methodology Governance, Audit Run Record.
 */

/** Семантическая версия методологии (CalVer-подобно): год.месяц.ревизия. */
export const METHODOLOGY_VERSION = '2026.08.1';

/** Версия движка — синхронизируется с worker/package.json (обновлять вместе). */
export const ENGINE_VERSION = '0.1.0';

/** Модель по умолчанию (переопределяется env AUDIT_MODEL). */
export const DEFAULT_MODEL = process.env.AUDIT_MODEL || 'claude-opus-5';

/** Версия схемы Audit Run Record — поднимать при изменении структуры записи. */
export const RUN_RECORD_SCHEMA_VERSION = '1.0.0';

export type BuildInfo = {
  methodologyVersion: string;
  engineVersion: string;
  model: string;
  runRecordSchemaVersion: string;
};

/**
 * Ориентировочные цены токенов, $/1M (input, output). ⚠️ Цены меняются — сверять с
 * прайс-страницей провайдера на дату; переопределяются env MODEL_PRICE_IN / MODEL_PRICE_OUT.
 * Значения по умолчанию — плейсхолдер frontier-тира; для cost per audit нужны актуальные.
 */
export const MODEL_PRICE_IN = Number(process.env.MODEL_PRICE_IN ?? 5); // $/1M input
export const MODEL_PRICE_OUT = Number(process.env.MODEL_PRICE_OUT ?? 25); // $/1M output
export const MODEL_PRICE_ASOF = process.env.MODEL_PRICE_ASOF ?? '2026-08 · Claude Opus 5 ($5/$25 за 1M)';

/*
 * Множители кеша промптов. Чтение из кеша стоит ~0.1x от входной ставки, запись —
 * ~1.25x (при TTL 5 минут) или ~2x (при TTL час). Мы пишем часовой кеш метода в
 * ask(), поэтому оценка записи — нижняя граница; для порядка величины этого
 * достаточно, а завышать счёт вдвое ради точности хуже, чем занижать на четверть.
 */
export const CACHE_READ_MULT = 0.1;
export const CACHE_WRITE_MULT = 1.25;

export type LlmUsage = {
  /** Токены, оплаченные по полной ставке (мимо кеша). */
  inputTokens: number;
  outputTokens: number;
  /** Прочитано из кеша — дешевле входа в десять раз. */
  cacheRead?: number;
  /** Записано в кеш — дороже входа. */
  cacheWrite?: number;
};

/**
 * Оценка стоимости LLM по токенам, $.
 *
 * Раньше сюда шла ОБЩАЯ сумма входных токенов, в которую счётчик складывает и
 * чтения из кеша, и записи. Всё это оценивалось по полной входной ставке — то
 * есть «cost per audit» в Run Record завышал стоимость любого прогона, где кеш
 * сработал, и тем сильнее, чем лучше он работал. Считаем по составу.
 */
export function estimateLlmCostUsd(u: LlmUsage): number {
  const inM = (n: number) => n / 1e6;
  return inM(u.inputTokens) * MODEL_PRICE_IN
    + inM(u.cacheRead ?? 0) * MODEL_PRICE_IN * CACHE_READ_MULT
    + inM(u.cacheWrite ?? 0) * MODEL_PRICE_IN * CACHE_WRITE_MULT
    + inM(u.outputTokens) * MODEL_PRICE_OUT;
}

export function buildInfo(model?: string): BuildInfo {
  return {
    methodologyVersion: METHODOLOGY_VERSION,
    engineVersion: ENGINE_VERSION,
    model: model || DEFAULT_MODEL,
    runRecordSchemaVersion: RUN_RECORD_SCHEMA_VERSION,
  };
}
