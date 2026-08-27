/**
 * Health Score. Его число уходит в документ клиента, в полосу зрелости и в
 * рекомендацию «что делать» — то есть в разговор о цене работ.
 *
 * Шкала состоит из двух половин: A — взвешенная зрелость по доменам,
 * B — 100 минус штрафы за критические разрывы. Итог = 0.6×A + 0.4×B.
 *
 * У половины B было условие «отвечен ХОТЬ ОДИН контрольный вопрос», и это
 * давало ровно то, ради недопущения чего шкала и строилась: клиент, ответивший
 * на один вопрос из 22 благополучно, получал B = 100 — столько же, сколько
 * ответивший на все 22. Замер до починки:
 *
 *   контрольных отвечено   scoreB   итог
 *    0/22                   null      99
 *    1/22 благоприятно       100      99   ← неотличим от полного
 *   22/22 благоприятно       100      99
 *   22/22 честно «Нет»         7      56
 */
import { describe, it, expect } from 'vitest';
import { buildReport } from '../../../portal/src/lib/report.ts';
import { CRITICAL_GAPS } from '../../../portal/src/data/method.ts';
import { QUESTIONS } from '../../../portal/src/lib/model.ts';
import { computeEngine, engineFacts, normalizeAnswers } from '../portalEngine.js';

const GAP_QIDS: string[] = (CRITICAL_GAPS as { qids: string[] }[]).flatMap((g) => g.qids);
const isGap = new Set(GAP_QIDS);
type Q = { id: string; level: string; domain: string; options?: string[] | null };

/** Здоровая база ответов на всё, кроме контрольных вопросов. */
const BULK = Object.fromEntries(
  (QUESTIONS as Q[])
    .filter((q) => q.level === 'L1' && q.options?.length && !isGap.has(q.id))
    .map((q) => [q.id, q.options![0]]),
);
const report = (extra: Record<string, string> = {}) =>
  buildReport(normalizeAnswers({ ...BULK, ...extra }) as never, []);
const yes = (n: number) => Object.fromEntries(GAP_QIDS.slice(0, n).map((q) => [q, 'Да']));

describe('покрытие рисковой половины', () => {
  it('контрольные вопросы вообще есть — иначе тест пустой', () => {
    expect(CRITICAL_GAPS.length).toBeGreaterThan(10);
    expect(GAP_QIDS.length).toBeGreaterThan(CRITICAL_GAPS.length - 1);
  });

  it('один благоприятный ответ больше не даёт полный балл за риски', () => {
    expect(report(yes(1)).scoreB).toBeNull();
  });

  it('и три тоже — порог по смыслу, а не по факту ответа', () => {
    expect(report(yes(3)).scoreB).toBeNull();
  });

  it('проверив больше половины разрывов, оценку риска выпускаем', () => {
    const half = Math.ceil(CRITICAL_GAPS.length / 2);
    expect(report(yes(half)).scoreB).not.toBeNull();
  });

  it('проверив все и не найдя ничего — 100, и это заслуженно', () => {
    expect(report(yes(GAP_QIDS.length)).scoreB).toBe(100);
  });

  it('честные «Нет» по всем разрывам роняют итог', () => {
    const bad = report(Object.fromEntries(GAP_QIDS.map((q) => [q, 'Нет'])));
    expect(bad.gaps.length).toBeGreaterThan(10);
    expect(bad.score!).toBeLessThan(report(yes(GAP_QIDS.length)).score!);
  });

  it('покрытие отдаётся наружу всегда, даже когда scoreB не посчитан', () => {
    const r = report(yes(1));
    expect(r.gapCoverage.total).toBe(CRITICAL_GAPS.length);
    expect(r.gapCoverage.checked).toBeGreaterThan(0);
    expect(r.gapCoverage.checked).toBeLessThan(r.gapCoverage.total);
  });

  it('оценка помечается предварительной, когда риски не проверяли', () => {
    expect(report(yes(1)).scoreProvisional).toBe(true);
    expect(report(yes(GAP_QIDS.length)).scoreProvisional).toBe(false);
  });
});

describe('что об этом читает модель', () => {
  const facts = (extra: Record<string, string>) =>
    engineFacts(computeEngine(normalizeAnswers({ ...BULK, ...extra }) as never));

  it('при непроверенных рисках прямо сказано, что вывода «рисков нет» делать нельзя', () => {
    const t = facts(yes(1));
    expect(t).toMatch(/ПРЕДВАРИТЕЛЬНАЯ/);
    expect(t).toMatch(/рисков нет/);
  });

  it('пустой список разрывов при полной проверке не выглядит как молчание', () => {
    const t = facts(yes(GAP_QIDS.length));
    expect(t).toMatch(/не сработал ни один/);
    expect(t).not.toMatch(/ПРЕДВАРИТЕЛЬНАЯ/);
  });

  it('модели запрещено пересчитывать числа движка', () => {
    expect(facts(yes(1))).toMatch(/не пересчитывай/i);
  });
});
