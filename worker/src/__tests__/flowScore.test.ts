/**
 * Баллы flow-модулей: «SEO Score 3.6/10», «CRO Health Score», «Structure Health».
 * Каждый уходит крупной цифрой на первый экран своего PDF.
 *
 * Замер до починки — балл почти не зависел от того, сколько данных собрано:
 *
 *   страниц в обходе    SEO   CRO   Структура   GEO
 *   0                   3     2.2   2.9         2.8
 *   25                  3.6   2.2   3.1         3
 *
 * Механика простая: формулы зон начинаются с оптимистичных констант
 * (`5 + commShare * 3`, `4 + …`), поэтому при нулевых входах балл складывался
 * из этих констант. Отсутствие сигнала оценивалось как посредственный, но
 * присутствующий сигнал — и в документе это неотличимо от полноценного замера.
 */
import { describe, it, expect } from 'vitest';
import { flowScore, scoreText, clamp10, MIN_MEASURED_ZONES } from '../flowScore.js';
import { buildSeoFlow } from '../seoflow.js';
import { buildCroFlow } from '../croflow.js';
import { buildStructureFlow } from '../structureflow.js';
import { buildGeoFlow } from '../geoflow.js';
import type { AuditDataset } from '../report.js';

const zone = (score: number, measured = true) => ({ score, measured });

const page = (i: number) => ({
  url: `https://x.ua/p${i}`, kind: ['home', 'plp', 'pdp', 'content'][i % 4], status: 200,
  score: 70, error: null, title: `Стр ${i}`, h1: `Заголовок ${i}`, metaDescription: 'опис',
  checks: [], links: [], tech: [], html: '<html></html>', wordCount: 400,
  ux: { viewport: true, addToCart: true, cards: 12, variantSelector: true }, perf: {}, schema: [],
});
const ds = (n: number): AuditDataset => ({
  tier: 1, request: '', takenAt: '2026-08-01T00:00:00Z', competitors: [],
  client: {
    rootUrl: 'https://x.ua', finalUrl: 'https://x.ua', kind: 'client', reachable: n > 0,
    robotsTxt: n > 0, sitemapXml: n > 0, tech: { platform: 'OpenCart', analytics: [], signals: [] },
    pages: Array.from({ length: n }, (_, i) => page(i)), discoveredLinks: n * 3, links: [],
  },
} as unknown as AuditDataset);

describe('flowScore — общее правило', () => {
  it('без единой страницы балла нет вовсе', () => {
    expect(flowScore([zone(8), zone(7), zone(6)], 0).overall).toBeNull();
  });

  it('измеренных зон меньше порога — балла тоже нет', () => {
    const zones = [zone(8), zone(7), ...Array.from({ length: 5 }, () => zone(0, false))];
    expect(zones.filter((z) => z.measured).length).toBeLessThan(MIN_MEASURED_ZONES);
    expect(flowScore(zones, 10).overall).toBeNull();
  });

  it('данных достаточно — балл считается по измеренным зонам', () => {
    const s = flowScore([zone(9), zone(6), zone(3), zone(0, false)], 10);
    expect(s.overall).toBe(6);          // (9+6+3)/3, неизмеренная не в счёт
  });

  it('покрытие отдаётся всегда, даже когда балла нет', () => {
    const s = flowScore([zone(8), zone(0, false)], 0);
    expect(s.overall).toBeNull();
    expect(s.coverage).toEqual({ pagesAnalysed: 0, zonesMeasured: 1, zonesTotal: 2 });
  });

  it('балл не выходит за 0..10 даже на мусорных входах', () => {
    expect(clamp10(999)).toBe(10);
    expect(clamp10(-5)).toBe(0);
    expect(clamp10(NaN)).toBe(0);
  });
});

describe('как это называется в документе', () => {
  it('прочерк объясняется, а не оставляется прочерком', () => {
    // Пустое место читается как ошибка вёрстки, а не как «не измеряли».
    expect(scoreText(flowScore([zone(8)], 0))).toMatch(/не вимірювався.*обхід/i);
  });

  it('мало зон — сказано, сколько именно', () => {
    const t = scoreText(flowScore([zone(8), zone(0, false), zone(0, false)], 5));
    expect(t).toMatch(/1 зон із 3/);
  });

  it('есть балл — печатается он', () => {
    expect(scoreText(flowScore([zone(9), zone(6), zone(3)], 10))).toBe('6/10');
  });
});

describe('флоу перестали утверждать балл из ничего', () => {
  it('нулевой обход — ни один из четырёх не называет число', () => {
    expect(buildSeoFlow(ds(0)).score.overall).toBeNull();
    expect(buildCroFlow(ds(0)).score.overall).toBeNull();
    expect(buildCroFlow(ds(0)).health.overall).toBeNull();
    expect(buildStructureFlow(ds(0)).score.overall).toBeNull();
    expect(buildGeoFlow(ds(0)).score.overall).toBeNull();
  });

  it('появились страницы — появился и балл', () => {
    for (const [name, fn] of [['seo', buildSeoFlow], ['cro', buildCroFlow],
                              ['structure', buildStructureFlow], ['geo', buildGeoFlow]] as const) {
      expect(fn(ds(8)).score.overall, name).not.toBeNull();
    }
  });

  it('балл реагирует на объём данных, а не стоит на месте', () => {
    // Раньше структура давала 2.9 при нуле и 3.1 при двадцати пяти страницах.
    const thin = buildStructureFlow(ds(1)).score.overall!;
    const full = buildStructureFlow(ds(8)).score.overall!;
    expect(full).toBeGreaterThan(thin);
  });

  it('покрытие доезжает до результата — по нему видно, на чём стоит балл', () => {
    const c = buildSeoFlow(ds(8)).score.coverage;
    expect(c.pagesAnalysed).toBe(8);
    expect(c.zonesMeasured).toBeGreaterThan(0);
    expect(c.zonesMeasured).toBeLessThan(c.zonesTotal);   // зоны «потрібен доступ» не в счёт
  });

  it('зоны, требующие доступа, остаются неизмеренными и с данными обхода', () => {
    const zones = buildSeoFlow(ds(25)).score.zones;
    const needAccess = ['serpctr', 'backlinks', 'competitors', 'local', 'international'];
    for (const k of needAccess) {
      expect(zones.find((z) => z.key === k)?.measured, k).toBe(false);
    }
  });
});
