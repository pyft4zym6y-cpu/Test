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

export function buildInfo(model?: string): BuildInfo {
  return {
    methodologyVersion: METHODOLOGY_VERSION,
    engineVersion: ENGINE_VERSION,
    model: model || DEFAULT_MODEL,
    runRecordSchemaVersion: RUN_RECORD_SCHEMA_VERSION,
  };
}
