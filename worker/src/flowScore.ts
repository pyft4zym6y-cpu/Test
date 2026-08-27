/**
 * Общее правило для баллов, которые уходят в документы клиента.
 *
 * Восемь flow-модулей (SEO, CRO, мерчандайзинг, стратегия, структура, GEO,
 * блоки, страницы) считают свой балл по зонам и печатают его как «SEO Score
 * 3.6/10». Замер показал, что балл почти не зависит от объёма собранных данных:
 *
 *   страниц в обходе    SEO   CRO   Структура   GEO
 *   0                   3     2.2   2.9         2.8
 *   25                  3.6   2.2   3.1         3
 *
 * Причина механическая: формулы зон начинаются с оптимистичных констант
 * (`5 + commShare * 3`, `4 + …`, `3 + …`), поэтому при нулевых входах балл
 * складывается из этих констант. Отсутствие сигнала оценивается как
 * посредственный, но присутствующий сигнал.
 *
 * Здесь одно правило на все флоу: зона без данных не измеряется, а если
 * измеренных зон слишком мало — балла нет вовсе. `null` честнее числа,
 * неотличимого от полноценного.
 */

/**
 * Минимум, который нужен помощнику. Формы зон у флоу разные (у кого-то есть
 * note, у кого-то нет), и навязывать им одну — лишняя связанность: считать
 * средний балл можно, зная только сам балл и то, измеряли ли зону.
 */
export type ScoreZone = {
  score: number;
  /** false — зону нечем было измерить (нет обхода, нужен доступ). */
  measured: boolean;
};

export type FlowCoverage = {
  /** Сколько страниц реально разобрано. 0 — обхода не было. */
  pagesAnalysed: number;
  zonesMeasured: number;
  zonesTotal: number;
};

export type FlowScore<Z extends ScoreZone = ScoreZone> = {
  zones: Z[];
  /** null — измеренных зон слишком мало, чтобы называть число. */
  overall: number | null;
  coverage: FlowCoverage;
};

/** Минимум измеренных зон, при котором балл вообще имеет смысл. */
export const MIN_MEASURED_ZONES = 3;

export const clamp10 = (n: number): number =>
  Math.max(0, Math.min(10, Math.round((Number.isFinite(n) ? n : 0) * 10) / 10));

export function flowScore<Z extends ScoreZone>(
  zones: Z[],
  pagesAnalysed: number,
  minZones = MIN_MEASURED_ZONES,
): FlowScore<Z> {
  const measured = zones.filter((z) => z.measured);
  const enough = pagesAnalysed > 0 && measured.length >= minZones;
  return {
    zones,
    overall: enough ? clamp10(measured.reduce((s, z) => s + z.score, 0) / measured.length) : null,
    coverage: { pagesAnalysed, zonesMeasured: measured.length, zonesTotal: zones.length },
  };
}

/**
 * Как назвать балл в документе. Прочерк без объяснения читается как ошибка
 * вёрстки, а не как «не измеряли».
 */
export function scoreText(s: FlowScore<ScoreZone>, unit = '/10'): string {
  if (s.overall !== null) return `${s.overall}${unit}`;
  return s.coverage.pagesAnalysed === 0
    ? 'не вимірювався — обхід не дав жодної сторінки'
    : `не вимірювався — виміряно лише ${s.coverage.zonesMeasured} зон із ${s.coverage.zonesTotal}`;
}
