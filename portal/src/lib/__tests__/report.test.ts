import { describe, it, expect } from 'vitest';
import { buildReport, zone } from '../report';
import { QUESTIONS } from '../model';
import { CRITICAL_GAPS } from '../../data/method';

const answerAll = (qids: string[], v: string) =>
  Object.fromEntries(qids.map((q) => [q, { answer: v }]));

const gapQids = CRITICAL_GAPS.map((g) => g.qids[0]);

describe('Health Score', () => {
  it('без ответов балл не считается вовсе', () => {
    const r = buildReport({}, []);
    expect(r.score).toBeNull();
    expect(r.scoreA).toBeNull();
    expect(r.scoreB).toBeNull();
    expect(r.gapCoverage).toEqual({ checked: 0, total: CRITICAL_GAPS.length });
  });

  /*
   * scoreB выставлялся, если отвечен ХОТЬ ОДИН контрольный вопрос: клиент,
   * ответивший «Да» на один из 22, получал scoreB = 100 — столько же, сколько
   * ответивший благополучно на все 22. А scoreB весит 40% итога.
   */
  it('один благополучный ответ из 22 не даёт полный балл по разрывам', () => {
    const one = buildReport(answerAll([gapQids[0]], 'Да'), []);
    expect(one.gapCoverage.checked).toBe(1);
    expect(one.scoreB).toBeNull();
  });

  it('половина проверенных разрывов открывает шкалу B', () => {
    const half = Math.ceil(CRITICAL_GAPS.length / 2);
    const r = buildReport(answerAll(gapQids.slice(0, half), 'Да'), []);
    expect(r.gapCoverage.checked).toBeGreaterThanOrEqual(half);
    expect(r.scoreB).toBe(100);
  });

  it('«Нет» на контрольный вопрос штрафует и попадает в разрывы с доказательством', () => {
    const half = Math.ceil(CRITICAL_GAPS.length / 2);
    const r = buildReport(answerAll(gapQids.slice(0, half), 'Нет'), []);
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.scoreB!).toBeLessThan(100);
    for (const g of r.gaps) expect(g.evidence).toMatch(/^[A-Z]{2}-\d+/);
  });

  /*
   * Когда рисковая половина не проверена, итог подставляет scoreA вместо
   * scoreB. Это осознанно, но тогда балл означает «зрелость», а не «здоровье»,
   * и документы обязаны сказать об этом словами — флаг для этого и заведён.
   */
  it('итог на одной зрелости помечается предварительным', () => {
    const l1 = QUESTIONS.filter((q) => q.level === 'L1' && /Да\/Нет/.test(q.type)).map((q) => q.id);
    const r = buildReport(answerAll(l1.slice(0, 200), 'Да'), []);
    if (r.scoreA !== null && r.scoreB === null) {
      expect(r.scoreProvisional).toBe(true);
      expect(r.score).toBe(r.scoreA);
    }
  });

  it('покрытие разрывов отдаётся наружу всегда, даже когда балл не посчитан', () => {
    expect(buildReport({}, []).gapCoverage).toBeDefined();
    expect(buildReport(answerAll([gapQids[0]], 'Да'), []).gapCoverage.total).toBe(CRITICAL_GAPS.length);
  });
});

describe('зоны здоровья домена', () => {
  it('null — это «мало данных», а не «критично»', () => {
    expect(zone(null).label).toBe('мало данных');
    expect(zone(0).label).toBe('критично');
    expect(zone(1).label).toBe('норма');
  });

  it('домен со слишком малым числом скорируемых ответов остаётся без здоровья', () => {
    const r = buildReport(answerAll([QUESTIONS.find((q) => q.level === 'L1' && /Да\/Нет/.test(q.type))!.id], 'Нет'), []);
    const d = r.domains.find((x) => x.scorable > 0 && x.scorable < 3);
    if (d) expect(d.health).toBeNull();
  });
});
