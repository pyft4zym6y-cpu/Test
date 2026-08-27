import { describe, it, expect } from 'vitest';
import { buildSnapshot, snapshotToContext, localAnswer } from '../assistant';
import type { AnswerRow } from '../supabase';

const rows = (m: Record<string, string> = {}): Record<string, AnswerRow> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, {
    client_id: 'c', question_id: k, answer: v, facts: null, updated_by: null,
  }]));

const snap = (m: Record<string, string> = {}, meta: any = null, access = 0) =>
  buildSnapshot(rows(m) as any, meta, access);

describe('снимок аудита', () => {
  it('пустой аудит не выдаёт ни одной уверенной цифры', () => {
    const s = snap();
    expect(s.health.score).toBeNull();
    expect(s.money.show).toBe(false);
    expect(s.money.forecast).toBeNull();
    expect(s.decisions).toEqual([]);
  });

  it('зона проблемы определяется её весом, а не вызовом-пустышкой', () => {
    // здесь стояло `zone(null).label && p.severity >= 3` — zone(null).label
    // это всегда строка «мало данных», то есть всегда истина
    const s = snap({ 'FI-001': 'Нет', 'AN-003': 'Нет', 'CR-004': 'Нет' });
    for (const p of s.problems) expect(['критично', 'внимание']).toContain(p.zone);
  });

  it('покрытие пар противоречий отдаётся всегда, даже когда пар нет', () => {
    expect(snap().contradictionCoverage).toEqual({ checked: 0, total: 12 });
    const both = snap({ 'GV-003': 'По данным', 'AN-003': 'Да' });
    expect(both.contradictionCoverage.checked).toBe(1);
  });
});

describe('ground truth для промпта', () => {
  /*
   * Пустой список — не результат проверки. Без строки о покрытии модель читает
   * молчание как «нестыковок нет» и «рисков нет» и пишет это клиенту.
   */
  it('называет непроверенное непроверенным, а не чистым', () => {
    const ctx = snapshotToContext(snap());
    expect(ctx).toMatch(/Противоречия: НЕ ПРОВЕРЯЛИСЬ/);
    expect(ctx).toMatch(/разрывы не проверялись/);
    expect(ctx).not.toMatch(/Противоречий не найдено\.$/m);
  });

  it('при заполненном аудите сообщает, сколько именно сверено', () => {
    const ctx = snapshotToContext(snap({ 'GV-003': 'По данным', 'AN-003': 'Да' }));
    expect(ctx).toMatch(/сверено 1 пар из 12/);
  });
});

describe('офлайн-ответчик (работает без API-ключа)', () => {
  it('про разрывы: сообщает покрытие, а не «разрывов нет»', () => {
    const a = localAnswer('какие есть разрывы?', snap());
    expect(a).toMatch(/проверено 0 из \d+/);
    expect(a).toMatch(/Непроверенный разрыв — не пройденный разрыв/);
  });

  it('про противоречия: «не сверяли» и «нет противоречий» — разные ответы', () => {
    const none = localAnswer('есть противоречия?', snap());
    expect(none).toMatch(/не сверяли/);
    const some = localAnswer('есть противоречия?', snap({ 'GV-003': 'По данным', 'AN-003': 'Да' }));
    expect(some).toMatch(/сверено 1 пар из 12/);
  });

  /*
   * Заголовок был «Сильнее всего балл поднимут», а перечислялись первые три
   * УЖЕ НАБРАННЫХ фактора в порядке добавления — одни и те же у любого
   * клиента и ровно противоположные по смыслу.
   */
  it('про заполненность: показывает недобранное, а не набранное', () => {
    const a = localAnswer('сколько заполнено?', snap());
    expect(a).not.toMatch(/Сильнее всего балл поднимут/);
    expect(a).toMatch(/Балл держат:/);
    expect(a).toMatch(/Baseline не зафиксирован|Внешних замеров нет/);
  });

  it('про деньги без baseline: отказывается называть цифру', () => {
    expect(localAnswer('сколько мы недополучаем?', snap())).toMatch(/выдумкой/);
  });
});
