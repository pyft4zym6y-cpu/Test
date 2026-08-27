/**
 * Ранжування в палітрі. Головна вимога — передбачуваність: у списку з двохсот
 * схожих назв людина мусить розуміти, ЧОМУ перший результат перший. Fuzzy-збіг
 * цю властивість втрачає, і тоді першому результату перестають довіряти —
 * а палітра без довіри до першого рядка не економить нічого.
 */
import { describe, it, expect, vi } from 'vitest';
import { score, rank, buildCommands, type Command } from '../commands';
import type { AdminRow } from '@/lib/supa';

const cmd = (label: string, kind: Command['kind'] = 'client', hint = ''): Command =>
  ({ id: label, label, hint, kind, run: () => {} });

describe('score', () => {
  it('точний збіг важить найбільше', () => {
    expect(score('Кава', 'кава')).toBeGreaterThan(score('Кавоварки', 'кава'));
  });

  it('початок назви важить більше за середину', () => {
    expect(score('Кавоварки', 'кав')).toBeGreaterThan(score('Магазин кавоварок', 'кав'));
  });

  it('початок будь-якого СЛОВА теж рахується', () => {
    expect(score('Магазин Кави', 'кав')).toBeGreaterThan(score('Прокава', 'кав'));
  });

  it('немає збігу — нуль, а не «трохи схоже»', () => {
    expect(score('Кава', 'взуття')).toBe(0);
  });

  it('порожній запит підходить усьому', () => {
    expect(score('будь-що', '')).toBeGreaterThan(0);
  });

  it('регістр і зайві пробіли не впливають', () => {
    expect(score('  КАВА  ', 'кава')).toBe(score('Кава', 'кава'));
  });
});

describe('rank', () => {
  const list = [
    cmd('Дашборд', 'nav'),
    cmd('Клієнти', 'nav'),
    cmd('Кава', 'client', 'owner@kava.ua'),
    cmd('Кавоварки', 'client', 'shop@kavovarky.ua'),
    cmd('Магазин кави', 'client', 'hi@magkava.ua'),
    cmd('Взуття', 'client', 'boots@shoes.ua'),
  ];

  it('порожній запит показує спершу розділи — з них починають', () => {
    expect(rank(list, '').slice(0, 2).every((c) => c.kind === 'nav')).toBe(true);
  });

  it('точний збіг стоїть першим', () => {
    expect(rank(list, 'кава')[0].label).toBe('Кава');
  });

  it('нерелевантне не потрапляє у видачу взагалі', () => {
    expect(rank(list, 'кав').some((c) => c.label === 'Взуття')).toBe(false);
  });

  it('шукає по пошті: менеджер частіше памʼятає її, ніж назву', () => {
    expect(rank(list, 'kavovarky')[0].label).toBe('Кавоварки');
  });

  it('при рівному збігу клієнт вище за розділ — до розділів є меню', () => {
    const both = [cmd('Аудити', 'nav'), cmd('Аудити', 'client', 'a@b.ua')];
    expect(rank(both, 'аудити')[0].kind).toBe('client');
  });

  it('видача обмежена — палітра не має ставати другим списком клієнтів', () => {
    const many = Array.from({ length: 100 }, (_, i) => cmd(`Клієнт ${i}`, 'client'));
    expect(rank(many, 'клієнт').length).toBeLessThanOrEqual(12);
  });

  it('порожній список не ламає ранжування', () => {
    expect(rank([], 'будь-що')).toEqual([]);
  });
});

describe('buildCommands', () => {
  const rows = [
    { userId: 'u1', email: 'owner@kava.ua', company: 'Кава' },
    { userId: 'u2', email: 'no-name@shop.ua' },
  ] as unknown as AdminRow[];

  it('розділи й клієнти потрапляють в один список', () => {
    const c = buildCommands([{ id: 'over', label: 'Дашборд' }], rows, { tab: () => {}, client: () => {} });
    expect(c.filter((x) => x.kind === 'nav')).toHaveLength(1);
    expect(c.filter((x) => x.kind === 'client')).toHaveLength(2);
  });

  it('клієнт без назви показується поштою, а не порожнім рядком', () => {
    const c = buildCommands([], rows, { tab: () => {}, client: () => {} });
    expect(c.find((x) => x.id === 'cli:u2')?.label).toBe('no-name@shop.ua');
  });

  it('запуск команди веде саме до цього клієнта', () => {
    const client = vi.fn();
    const c = buildCommands([], rows, { tab: () => {}, client });
    c.find((x) => x.id === 'cli:u1')!.run();
    expect(client).toHaveBeenCalledWith('u1');
  });

  it('порожня база дає лише розділи, без падінь', () => {
    const c = buildCommands([{ id: 'over', label: 'Дашборд' }], null, { tab: () => {}, client: () => {} });
    expect(c).toHaveLength(1);
  });
});
