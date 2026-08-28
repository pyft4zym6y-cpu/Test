/**
 * Бібліотека агенції — ДРУГА сутність поруч із «Базою знань клієнта», а не
 * заміна їй.
 *
 * «База знань» у картці клієнта — досьє: збирається сама з його даних і нічого
 * не формує. Питання «хто формує матеріали» виникало саме тому, що бібліотеки
 * не існувало взагалі. Тепер вона є, у двох шарах: базовий у коді (працює
 * завжди) і командний у таблиці `kb_library`.
 *
 * Головне, що тут стережеться: відсутня таблиця не має виглядати як порожня
 * бібліотека. «Порожньо» і «не налаштовано» на екрані однакові, а означають
 * протилежне.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KB_BASE, KB_KINDS, kbMatches } from '@/data/kbLibrary';
import { SYSTEMS } from '@/data/xray';

const sel = vi.fn();
vi.mock('@/lib/supa', () => ({
  CONFIGURED: true,
  supabase: { from: () => ({ select: () => ({ order: () => ({ limit: () => sel() }) }) }) },
}));

const { loadKbTeam, mergeKb, kbForSystems } = await import('@/lib/kb');

beforeEach(() => sel.mockReset());

describe('базовий шар', () => {
  it('існує й не залежить від бази', () => {
    expect(KB_BASE.length).toBeGreaterThan(0);
    expect(KB_BASE.every((i) => i.source === 'base')).toBe(true);
  });

  it('у кожного матеріалу є назва, тип і опис — інакше він не знайдеться', () => {
    for (const i of KB_BASE) {
      expect(i.title.length, i.id).toBeGreaterThan(3);
      expect(i.summary.length, i.id).toBeGreaterThan(10);
      expect(KB_KINDS.map((k) => k.k)).toContain(i.kind);
    }
  });

  it('привʼязка йде до реальних систем продукту, а не до вигаданих ключів', () => {
    const keys = SYSTEMS.map((s) => s.key);
    for (const i of KB_BASE) for (const s of i.sys) expect(keys, `${i.id} → ${s}`).toContain(s);
  });

  it('за замовчуванням матеріал внутрішній', () => {
    expect(KB_BASE.filter((i) => i.forClient).length).toBeLessThan(KB_BASE.length);
  });
});

describe('відсутня таблиця ≠ порожня бібліотека', () => {
  it('про ненастроєну таблицю сказано текстом, і названо, що виконати', async () => {
    sel.mockResolvedValue({ data: null, error: { message: 'relation "public.kb_library" does not exist' } });
    const r = await loadKbTeam();
    expect(r.missing).toBe(true);
    expect(r.error).toMatch(/kb-library\.sql/);
    expect(r.team).toEqual([]);
  });

  it('відмову RLS не видаємо за порожній результат', async () => {
    sel.mockResolvedValue({ data: null, error: { message: 'permission denied for table kb_library' } });
    const r = await loadKbTeam();
    expect(r.missing).toBeFalsy();
    expect(r.error).toMatch(/permission denied/);
  });

  it('справді порожня таблиця не породжує помилки', async () => {
    sel.mockResolvedValue({ data: [], error: null });
    const r = await loadKbTeam();
    expect(r.error).toBeUndefined();
    expect(r.team).toEqual([]);
  });

  it('навіть коли живий шар недоступний, базовий лишається робочим', () => {
    expect(mergeKb([]).length).toBe(KB_BASE.length);
  });
});

describe('два шари разом', () => {
  const teamItem = { id: 'kb-loss-model', title: 'Наша версія', kind: 'method' as const, sys: [], summary: 'перевизначення', source: 'team' as const };

  it('матеріал команди перекриває базовий із тим самим id', () => {
    const merged = mergeKb([teamItem]);
    expect(merged.filter((i) => i.id === 'kb-loss-model')).toHaveLength(1);
    expect(merged.find((i) => i.id === 'kb-loss-model')!.title).toBe('Наша версія');
  });

  it('нові матеріали команди додаються, а не витісняють базу', () => {
    const merged = mergeKb([{ ...teamItem, id: 'kb-new' }]);
    expect(merged.length).toBe(KB_BASE.length + 1);
  });
});

describe('звʼязок із аудитом', () => {
  it('під слабкі системи клієнта підбираються матеріали саме цих систем', () => {
    const picked = kbForSystems(mergeKb([]), ['experience']);
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.every((i) => i.sys.includes('experience'))).toBe(true);
  });

  it('без слабких систем нічого не вигадуємо', () => {
    expect(kbForSystems(mergeKb([]), [])).toEqual([]);
  });
});

describe('пошук', () => {
  it('шукає по назві, опису й тексту', () => {
    const item = KB_BASE.find((i) => i.id === 'kb-checkout')!;
    expect(kbMatches(item, 'кошик')).toBe(true);
    expect(kbMatches(item, 'оформлення')).toBe(true);
    expect(kbMatches(item, 'зовсім інше слово')).toBe(false);
    expect(kbMatches(item, '')).toBe(true);
  });
});
