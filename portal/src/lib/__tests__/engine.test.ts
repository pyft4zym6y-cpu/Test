import { describe, it, expect } from 'vitest';
import { computeConfidence, activeChains, runDecisions, forecast, gapCosts, type Ctx } from '../engine';
import { buildReport } from '../report';
import type { AnswerRow } from '../supabase';
import type { Levers } from '../consultant';

const rows = (m: Record<string, string>): Record<string, AnswerRow> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, {
    client_id: 'c', question_id: k, answer: v, facts: null, updated_by: null,
  }]));

const levers = (p: Partial<Record<keyof Levers, number>> = {}): Levers => ({
  traffic: { fact: p.traffic ?? 0, target: 0 }, cr: { fact: p.cr ?? 0, target: 0 },
  aov: { fact: p.aov ?? 0, target: 0 }, pay: { fact: 100, target: 100 },
  redeem: { fact: 100, target: 100 }, base: { fact: p.base ?? 0, target: 0 },
  repeat: { fact: p.repeat ?? 0, target: 0 }, opr: { fact: 1, target: 1 },
});

const ctx = (over: Partial<Ctx> = {}): Ctx => ({
  report: buildReport({}, []), rows: {}, painIds: [], goalIds: [], ...over,
});

describe('Confidence Score', () => {
  /*
   * add() выбрасывал всё с delta === 0. У клиента с пустым опросником балл 5
   * приходил с ПУСТЫМ списком «почему», а строка «Baseline не зафиксирован» —
   * её писали ровно как нулевой фактор — не показывалась никогда.
   */
  it('объясняет и нулевой балл: список факторов не бывает пустым', () => {
    const empty = computeConfidence(buildReport({}, []), [], 0, null, false);
    expect(empty.score).toBe(5);
    expect(empty.factors.length).toBeGreaterThan(0);
    expect(empty.factors.some((f) => /Baseline не зафиксирован/.test(f.label))).toBe(true);
    expect(empty.factors.some((f) => /Внешних замеров нет/.test(f.label))).toBe(true);
    expect(empty.factors.some((f) => /Бриф ЛПР не заполнен/.test(f.label))).toBe(true);
  });

  it('знаменатель доступов берётся из каталога, а не из головы', () => {
    const c = computeConfidence(buildReport({}, []), [], 30, null, false);
    const access = c.factors.find((f) => /Доступы и выгрузки/.test(f.label))!;
    // прежний захардкоженный знаменатель 26 давал клиенту дробь «30/26»
    const [, granted, total] = access.label.match(/(\d+) из (\d+)/)!;
    expect(Number(granted)).toBeLessThanOrEqual(Number(total));
  });

  it('противоречия понижают балл, но не ниже нижней границы шкалы', () => {
    const many = Array.from({ length: 12 }, () => ({} as any));
    expect(computeConfidence(buildReport({}, []), many, 0, null, false).score).toBe(5);
  });
});

describe('причинные цепочки', () => {
  /*
   * Корень подтверждался подстрочным `/нет|вручную|не |никак/` по любому
   * ответу. Из 23 контрольных вопросов три — свободный ввод: для числа проверка
   * не срабатывала никогда, для текста срабатывала на любом «не» внутри фразы.
   */
  it('свободный текст не подтверждает корень случайным «не»', () => {
    const c = activeChains(ctx({
      painIds: ['low_repeat'],
      rows: rows({ 'CO-028': 'Ассортимент не только базовый, но и расширенный' }),
    }));
    const chain = c.find((x) => x.painId === 'low_repeat')!;
    expect(chain.confirmedRoots).not.toContain('Ассортимент не даёт повода вернуться');
  });

  it('числовой контрольный вопрос сверяется с порогом, а не с подстрокой', () => {
    // «8% выручки из email» — корень есть, но ни одного слова из старого regex
    const low = activeChains(ctx({ painIds: ['low_repeat'], rows: rows({ 'CR-001': '8' }) }));
    expect(low.find((x) => x.painId === 'low_repeat')!.confirmedRoots)
      .toContain('Нет CRM-контура (сегменты, цепочки)');
    const ok = activeChains(ctx({ painIds: ['low_repeat'], rows: rows({ 'CR-001': '22' }) }));
    expect(ok.find((x) => x.painId === 'low_repeat')!.confirmedRoots)
      .not.toContain('Нет CRM-контура (сегменты, цепочки)');
  });

  it('закрытый вариант «Нет» корень подтверждает', () => {
    const c = activeChains(ctx({ painIds: ['low_repeat'], rows: rows({ 'CR-004': 'Нет' }) }));
    expect(c.find((x) => x.painId === 'low_repeat')!.confirmedRoots)
      .toContain('Нет CRM-контура (сегменты, цепочки)');
  });
});

describe('движок решений', () => {
  it('тактика («пожар») всегда идёт первой', () => {
    const d = runDecisions(ctx({ painIds: ['fire_cash', 'no_brand'], rows: rows({ 'PX-013': 'Нет' }) }));
    expect(d[0].horizon).toBe('tactical');
  });

  it('DE-06 берёт знаменатель SEO-проверок из самого протокола', () => {
    const d = runDecisions(ctx({
      rows: rows({ 'SE-002': 'Нет' }),
      meta: { screen: [{ url: 'https://a', kind: 'client', score: 40, checks: [
        ...Array.from({ length: 6 }, (_, i) => ({ id: `s${i}`, group: 'SEO', label: `SEO ${i}`, pass: false })),
        { id: 's6', group: 'SEO', label: 'SEO 6', pass: true },
      ] }] } as any,
    }));
    const seo = d.find((x) => x.id === 'DE-04')!;
    // при захардкоженной десятке здесь стояло бы «6/10» на семи проверках
    expect(seo.why.some((w) => w.includes('6/7 SEO-проверок'))).toBe(true);
  });

  it('без денег прогноз и цена бездействия не выдумываются', () => {
    expect(forecast(null)).toBeNull();
    expect(forecast({ consMin: 100, levers: levers() } as any)).toBeNull();
    expect(gapCosts(buildReport({}, []), null).size).toBe(0);
  });
});
