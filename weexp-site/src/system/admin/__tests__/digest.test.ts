/**
 * Тижневий зріз. Головна перевірка — розділення «хід за нами» і «чекаємо
 * клієнта»: якщо воно збоїть, менеджер щотижня отримує список, у якому чужа
 * бездіяльність виглядає як його власна, і перестає його читати.
 */
import { describe, it, expect } from 'vitest';
import { buildDigest, digestText } from '../digest';
import type { AdminRow } from '@/lib/supa';

/**
 * Дати рахуємо від РЕАЛЬНОГО часу, а не від фіксованої дати. `staleDays` у
 * auditRequests.ts бере `Date.now()` напряму — тобто вік стадії завжди
 * вимірюється від «зараз», і фіксована дата в фікстурі порівнювалась би з
 * сьогоднішнім днем, даючи випадковий вік. Це, до речі, і є причина, чому
 * SLA-шар складно тестувати на конкретних датах; тут ми з цим просто живемо.
 */
const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86400000).toISOString();

/** Заявка без модерації = стадія «new», норматив 2 дні (warn 1). */
const newReq = (id: string, ageDays: number): AdminRow => ({
  userId: id, email: `${id}@shop.ua`,
  updatedAt: daysAgo(ageDays),
  record: { funnel: { deepRequested: true, tierStatus: { DEEP: 'requested' } }, updatedAt: daysAgo(ageDays) },
} as unknown as AdminRow);

/** Код видано, клієнт не почав = «granted», норматив 14 (warn 5) — хід клієнта. */
const granted = (id: string, ageDays: number): AdminRow => ({
  userId: id, email: `${id}@shop.ua`,
  updatedAt: daysAgo(ageDays),
  record: { funnel: { tierStatus: { DEEP: 'granted' } }, updatedAt: daysAgo(ageDays) },
} as unknown as AdminRow);

describe('buildDigest — рух проти стану', () => {
  it('рахує, скільки карток зрушило за період, а скільки стоїть', () => {
    const d = buildDigest([newReq('a', 1), newReq('b', 30), granted('c', 2)], 7, NOW);
    expect(d.total).toBe(3);
    expect(d.moved).toBe(2);
    expect(d.still).toBe(1);
  });

  it('порожня база не ламає зріз', () => {
    const d = buildDigest([], 7, NOW);
    expect(d.total).toBe(0);
    expect(d.byStage).toEqual([]);
    expect(digestText(d)).toMatch(/Нічого не висить/);
  });

  it('картки без стадії (лід без заявки) у зріз не потрапляють', () => {
    const noStage = { userId: 'x', email: 'x@s.ua', record: {} } as unknown as AdminRow;
    expect(buildDigest([noStage], 7, NOW).byStage).toEqual([]);
  });
});

describe('buildDigest — чий хід', () => {
  it('нова заявка — хід за нами', () => {
    const d = buildDigest([newReq('a', 1)], 7, NOW);
    expect(d.ourMove.map((i) => i.userId)).toEqual(['a']);
    expect(d.clientMove).toEqual([]);
  });

  it('код видано, клієнт не почав — чекаємо клієнта, а не себе', () => {
    const d = buildDigest([granted('c', 7)], 7, NOW);
    expect(d.clientMove.map((i) => i.userId)).toEqual(['c']);
    expect(d.ourMove).toEqual([]);
  });

  it('прострочене йде в окремий список незалежно від того, чий хід', () => {
    const d = buildDigest([newReq('a', 10), granted('c', 30)], 7, NOW);
    expect(d.breached.map((i) => i.userId).sort()).toEqual(['a', 'c']);
    expect(d.ourMove).toEqual([]);
    expect(d.clientMove).toEqual([]);
  });

  it('свіжа картка в межах нормативу не потрапляє в жоден список очікування', () => {
    const d = buildDigest([granted('c', 1)], 7, NOW);
    expect(d.ourMove).toEqual([]);
    expect(d.clientMove).toEqual([]);
    expect(d.breached).toEqual([]);
  });

  it('найдовше висить — зверху', () => {
    const d = buildDigest([newReq('a', 5), newReq('b', 40), newReq('c', 12)], 7, NOW);
    expect(d.breached.map((i) => i.userId)).toEqual(['b', 'c', 'a']);
  });
});

describe('digestText', () => {
  it('розділи названі так, щоб дію було видно з заголовка', () => {
    const t = digestText(buildDigest([newReq('a', 10), granted('c', 7)], 7, NOW));
    expect(t).toMatch(/ПРОСТРОЧЕНО \(1\)/);
    expect(t).toMatch(/ЧЕКАЄМО КЛІЄНТА \(1\)/);
  });

  it('порожні розділи не друкуються — лист має бути коротким', () => {
    const t = digestText(buildDigest([granted('c', 7)], 7, NOW));
    expect(t).not.toMatch(/ПРОСТРОЧЕНО/);
    expect(t).toMatch(/ЧЕКАЄМО КЛІЄНТА/);
  });

  it('у рядку є і скільки стоїть, і норматив — інакше число ні з чим порівняти', () => {
    const t = digestText(buildDigest([newReq('a', 10)], 7, NOW));
    expect(t).toMatch(/10 дн\. \(норматив 2\)/);
  });

  it('назва клієнта, а не uuid: лист читає людина', () => {
    const row = { ...newReq('a', 10), company: 'Магазин «Кава»' } as AdminRow;
    expect(digestText(buildDigest([row], 7, NOW))).toContain('Магазин «Кава»');
  });

  it('розподіл по етапах є завжди — навіть у спокійний тиждень', () => {
    const t = digestText(buildDigest([granted('c', 1)], 7, NOW));
    expect(t).toMatch(/По етапах: .+ 1/);
  });
});
