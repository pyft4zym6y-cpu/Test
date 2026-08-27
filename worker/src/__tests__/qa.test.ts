/**
 * Протокол синергии/QA — документ, в котором мы утверждаем перед клиентом, что
 * пакет проверен сам против себя. Формулировка сильная: «Пакет, который вы
 * читаете, уже прошёл собственного критического оппонента».
 *
 * Счётчик проверок увеличивался БЕЗУСЛОВНО, а сама сверка стояла под `if (p.X)`.
 * На прогоне без бенчмарка, journey, контента и техаудита клиент читал «11
 * перекрёстных проверок… числа, трактовки и логика всех документов проверены
 * друг против друга». Отрабатывала одна. Плюс одна из одиннадцати была голым
 * счётчиком с комментарием «проверка формальная» — она не делала ничего вообще.
 */
import { describe, it, expect } from 'vitest';
import { buildQa, plural, type QaParts } from '../qa.js';

const qa = (p: Partial<QaParts> = {}) => buildQa('ТОВ Тест', '2026-08-01T00:00:00Z', p as QaParts, []);

describe('счётчик проверок', () => {
  it('пустой прогон засчитывает только то, что реально проверялось', async () => {
    const r = await qa();
    expect(r.checksRun).toBe(1);            // единственная, которой данные не нужны
    expect(r.checksSkipped.length).toBeGreaterThan(5);
  });

  it('появились данные — появилась и проверка', async () => {
    const base = (await qa()).checksRun;
    const withTech = await qa({ tech: { categories: [], score: { pct: 80 } } as never });
    expect(withTech.checksRun).toBeGreaterThan(base);
  });

  it('непроведённые проверки названы поимённо, а не сосчитаны', async () => {
    const r = await qa();
    expect(r.checksSkipped).toContain('journey ↔ UX/UI');
    expect(r.checksSkipped).toContain('статистическая сила бенчмарка');
  });

  it('проведённая проверка из списка пропущенных уходит', async () => {
    const r = await qa({ bench: { totalSites: 3 } as never });
    expect(r.checksSkipped).not.toContain('статистическая сила бенчмарка');
    expect(r.findings.some((x) => /выборка мала/.test(x.what))).toBe(true);
  });
});

describe('что читает клиент', () => {
  it('текст называет непроведённые проверки, а не умалчивает о них', async () => {
    const r = await qa();
    expect(r.conclusion[0]).toMatch(/не проводилось|не проводились|не проводилась/);
    expect(r.verdict).toMatch(/Не проводились \(нет данных\)/);
  });

  it('на полном прогоне оговорки нет — сверять было чем', async () => {
    const full = await qa({
      money: { potentialYear: 1 } as never,
      bench: { totalSites: 9 } as never,
      ci: { maturity: { level: 3 } } as never,
      maturity: { observedAvg: 3 } as never,
      journey: { steps: [] } as never,
      siteAudit: { soft404: false } as never,
      backlog: { rawCount: 10, dedupedAway: 0 } as never,
      content: { unparsed: [], rows: [] } as never,
      tech: { categories: [], score: { pct: 80 } } as never,
    });
    expect(full.checksSkipped).toEqual([]);
    expect(full.conclusion[0]).not.toMatch(/не проводил/);
  });

  it('утверждение о критическом оппоненте осталось — но теперь оно обеспечено', async () => {
    expect((await qa()).conclusion[0]).toMatch(/критического оппонента/);
  });
});

describe('склонение числительных', () => {
  // В документе стояло «1 проверок» и «1 перекрёстных проверка» — мелочь, но
  // ровно там, где мы утверждаем тщательность.
  it('1 / 2 / 5 склоняются по-русски', () => {
    expect(plural(1, 'проверка', 'проверки', 'проверок')).toBe('проверка');
    expect(plural(2, 'проверка', 'проверки', 'проверок')).toBe('проверки');
    expect(plural(5, 'проверка', 'проверки', 'проверок')).toBe('проверок');
  });

  it('подводные 11–14 — «проверок», а не «проверка»', () => {
    for (const n of [11, 12, 13, 14, 111]) {
      expect(plural(n, 'проверка', 'проверки', 'проверок'), String(n)).toBe('проверок');
    }
  });

  it('21 и 22 склоняются как 1 и 2', () => {
    expect(plural(21, 'проверка', 'проверки', 'проверок')).toBe('проверка');
    expect(plural(22, 'проверка', 'проверки', 'проверок')).toBe('проверки');
  });

  it('ноль — множественное', () => {
    expect(plural(0, 'запись', 'записи', 'записей')).toBe('записей');
  });

  it('в вердикте числительные согласованы', async () => {
    const r = await qa();
    expect(r.verdict).not.toMatch(/\b1 проверок|\b1 находок|\b1 позиций/);
    expect(r.conclusion.join(' ')).not.toMatch(/\b1 перекрёстных проверка/);
  });
});
