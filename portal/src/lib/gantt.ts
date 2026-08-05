import type { Rule } from './report';

/**
 * Генератор плана работ (упрощённый AD-18): фаза 0 фиксирована,
 * дальше волны из роутинга. Параллельность в волне ≤ 4 плейбука.
 */
export type GanttTask = {
  phase: string;
  name: string;
  deliverable: string;
  owner: string;
  weeks: number;
  startWeek: number; // от старта программы, с 0
  dod: string;
};

const PHASE0: Omit<GanttTask, 'startWeek'>[] = [
  { phase: 'Фаза 0 · Подготовка', name: 'Доступы и выгрузки (AC-01…AC-20)', deliverable: 'AD-06', owner: 'Клиент + weexp', weeks: 1, dod: 'Блокирующие доступы выданы' },
  { phase: 'Фаза 0 · Подготовка', name: 'Фиксация baseline по 8 рычагам', deliverable: 'AD-13', owner: 'weexp', weeks: 1, dod: 'Baseline подписан клиентом' },
  { phase: 'Фаза 0 · Подготовка', name: 'Интервью с ЛПР и командой', deliverable: 'AD-01 (L3)', owner: 'weexp', weeks: 2, dod: 'Все роли пройдены, цитаты в отчёте' },
  { phase: 'Фаза 0 · Подготовка', name: 'Финальный отчёт + Health Score', deliverable: 'AD-01, AD-16', owner: 'weexp', weeks: 1, dod: 'Отчёт защищён перед владельцем' },
];

const wks = (r: Rule) => (r.days ? Math.max(1, Math.ceil(r.days / 7)) : r.priority?.startsWith('P0') ? 4 : r.priority?.startsWith('P1') ? 6 : 8);

export function buildGantt(rules: Rule[]): GanttTask[] {
  const p0 = rules.filter((r) => r.blocking || r.priority?.startsWith('P0'));
  const p1 = rules.filter((r) => !r.blocking && r.priority?.startsWith('P1'));
  const rest = rules.filter((r) => !r.blocking && !r.priority?.startsWith('P0') && !r.priority?.startsWith('P1'));
  const waves = [
    { phase: 'Волна 1 · 0–3 мес', items: p0.length ? p0 : rules.slice(0, 3) },
    { phase: 'Волна 2 · 3–6 мес', items: p1 },
    { phase: 'Волна 3 · 6–12 мес', items: rest },
  ].filter((w) => w.items.length);

  const tasks: GanttTask[] = [];
  let cursor = 0;
  for (const t of PHASE0) {
    tasks.push({ ...t, startWeek: cursor });
    cursor += t.weeks;
  }
  for (const w of waves) {
    const waveStart = cursor;
    let waveEnd = waveStart;
    w.items.slice(0, 8).forEach((r, i) => {
      const weeks = wks(r);
      const lane = i % 4; // ≤4 параллельно
      const start = waveStart + Math.floor(i / 4) * 2 + lane * 0; // ступенька каждые 4 задачи
      tasks.push({
        phase: w.phase,
        name: r.deliverable,
        deliverable: r.id,
        owner: 'weexp + подрядчик',
        weeks,
        startWeek: start,
        dod: `Принят результат: ${r.deliverable}`,
      });
      waveEnd = Math.max(waveEnd, start + weeks);
    });
    cursor = waveEnd;
  }
  return tasks;
}

export function ganttCsv(tasks: GanttTask[]): string {
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  return [
    ['Фаза', 'Задача', 'Deliverable', 'Владелец', 'Старт (нед)', 'Длительность (нед)', 'DoD'].map(esc).join(';'),
    ...tasks.map((t) => [t.phase, t.name, t.deliverable, t.owner, t.startWeek + 1, t.weeks, t.dod].map(esc).join(';')),
  ].join('\n');
}

/** Свод трудоёмкости scope: Σ effort_days сработавших правил (стартовая оценка, калибруется XX-01). */
export function scopeEffort(rules: Rule[]): number {
  return rules.reduce((s, r) => s + (r.effort_days ?? 0), 0);
}
