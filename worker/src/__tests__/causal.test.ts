/**
 * Причинно-следственная карта: симптом → причина → деньги. Клиент читает её как
 * объяснение, откуда берётся недополученный оборот.
 *
 * Найдено: одна находка цеплялась к нескольким узлам, и КАЖДЫЙ забирал её сумму
 * целиком. Три узла про каталог при одной находке на 300 000 заявляли 900 000
 * при общем потенциале 600 000 — читатель, складывающий числа по карте, получал
 * больше, чем весь недополученный оборот аудита. Ровно от этого предостерегает
 * сноска самой карты: «не додавати розриви напряму».
 */
import { describe, it, expect } from 'vitest';
import { buildCausal } from '../causal.js';
import type { MoneyResult } from '../money.js';

const money = (potentialYear = 600_000, ...w: { key: string; label: string; contribYear: number }[]) =>
  ({ potentialYear, waterfall: w.length ? w : [{ key: 'traffic', label: 'Трафік', contribYear: potentialYear }] } as unknown as MoneyResult);

const pains = (...causes: string[]) =>
  ({ pains: causes.map((cause) => ({ cause, symptoms: [], evidence: [] })), findings: [] } as never);

const finding = (id: string, title: string, revenueExposure: number, funnelStep?: string) =>
  ({ id, title, revenueExposure, funnelStep } as never);

const claimed = (nodes: { moneyLink: string }[]) =>
  nodes.reduce((s, n) => s + Number((n.moneyLink.match(/≈ ([\d\s ]+)/)?.[1] ?? '0').replace(/\D/g, '')), 0);

describe('деньги по узлам не задваиваются', () => {
  it('общая находка делится между узлами, а не копируется в каждый', () => {
    const r = buildCausal(
      pains('Каталога структура запутана', 'Фильтры каталога не работают', 'Витрина каталога перегружена'),
      money(),
      { findings: [finding('W-001', 'Каталога навигация ломается', 300_000, 'каталог')] } as never,
    );
    expect(claimed(r.nodes)).toBe(300_000);
  });

  it('сумма по узлам не превышает общий потенциал', () => {
    const r = buildCausal(
      pains('Каталога раз', 'Каталога два', 'Каталога три', 'Каталога четыре'),
      money(600_000),
      { findings: [finding('W-001', 'Каталога сбой', 600_000, 'каталог')] } as never,
    );
    expect(claimed(r.nodes)).toBeLessThanOrEqual(600_000);
  });

  it('узел с собственной находкой получает её целиком', () => {
    const r = buildCausal(
      pains('Оплата картой падает'),
      money(),
      { findings: [finding('W-002', 'Оплата картой возвращает ошибку', 200_000)] } as never,
    );
    expect(claimed(r.nodes)).toBe(200_000);
  });

  it('дробление названо прямо — иначе доля читается как полная сумма', () => {
    const r = buildCausal(
      pains('Каталога раз', 'Каталога два'),
      money(),
      { findings: [finding('W-001', 'Каталога сбой', 300_000, 'каталог')] } as never,
    );
    expect(r.nodes[0].moneyLink).toMatch(/суми вузлів не складаються/);
  });

  it('когда находка одна на один узел, оговорки нет', () => {
    const r = buildCausal(
      pains('Оплата картой падает'),
      money(),
      { findings: [finding('W-002', 'Оплата картой возвращает ошибку', 200_000)] } as never,
    );
    expect(r.nodes[0].moneyLink).not.toMatch(/не складаються/);
  });

  it('сумма считается по тем же находкам, что перечислены', () => {
    // Раньше деньги суммировались по ВСЕМ связанным, а в список шли первые
    // восемь — проверить число по документу было нечем.
    const many = Array.from({ length: 12 }, (_, i) => finding(`W-${i}`, `Каталога дефект ${i}`, 10_000, 'каталог'));
    const r = buildCausal(pains('Каталога общая слабина'), money(), { findings: many } as never);
    expect(r.nodes[0].findingIds).toHaveLength(8);
    expect(claimed(r.nodes)).toBe(80_000);   // ровно восемь по 10 000
  });
});

describe('устойчивость карты', () => {
  it('без денег карта строится и говорит об этом прямо', () => {
    const r = buildCausal(pains('Причина'), null);
    expect(r.moneyNote).toMatch(/за наявності базових показників/);
    expect(r.nodes[0].moneyLink).toMatch(/оцінюється за наявності/);
  });

  it('без анализа и без находок карта пуста, а не выдумана', () => {
    expect(buildCausal(null, null).nodes).toEqual([]);
  });

  it('самым крупным рычагом не становится отрицательный', () => {
    const r = buildCausal(pains('Причина'), money(600_000,
      { key: 'cr', label: 'Конверсія', contribYear: -120_000 },
      { key: 'traffic', label: 'Трафік', contribYear: 60_000 }));
    expect(r.nodes[0].moneyLink).toMatch(/Трафік/);
    expect(r.nodes[0].moneyLink).not.toMatch(/-/);
  });

  it('карта не разрастается без предела', () => {
    const chains = Array.from({ length: 20 }, (_, i) => ({ implies: `Причина ${i}`, observed: `симптом ${i}` }));
    const r = buildCausal(null, null, { chains } as never);
    expect(r.nodes.length).toBeLessThanOrEqual(7);
  });
});
