/**
 * Единая книга аудита (ЕКП) в XLSX — закрывает табличные документы метода одним
 * файлом: сводка, таблица аудита (AD-02), зрелость (AD-16), scope по волнам
 * (AD-05), деньги/рычаги (AD-04), Гант (AD-18), дерево сайта (AD-08), техбэклог
 * (AD-10), гипотезы (AD-19). Заполняется тем, что есть на текущем тире.
 */
import type { AuditDataset } from './report.js';
import type { EngineResult } from './portalEngine.js';
import type { MoneyResult } from './money.js';
import type { MaturityReport } from './maturity.js';
import { levelLabel } from './maturity.js';
import type { ScopeReport } from './routing.js';
import type { CoverageReport } from './coverage.js';
import type { HypothesisRegister } from './hypotheses.js';
import type { Sheet } from './xlsx.js';

export type WorkbookParts = {
  engine?: EngineResult | null;
  money?: MoneyResult | null;
  maturity?: MaturityReport | null;
  scope?: ScopeReport | null;
  coverage?: CoverageReport | null;
  hypotheses?: HypothesisRegister | null;
  metrics?: { compliance: number | null };
};

const WAVE_WEEKS: Record<number, string> = { 1: '0–3 мес', 2: '3–6 мес', 3: '6–12 мес' };

export function buildWorkbook(ds: AuditDataset, p: WorkbookParts): Sheet[] {
  const sheets: Sheet[] = [];
  const site = ds.client.finalUrl || ds.client.rootUrl;

  // Сводка
  const summary: (string | number)[][] = [
    ['Клиент', site],
    ['Тир', `T${ds.tier}`],
    ['Дата', new Date(ds.takenAt).toLocaleDateString('ru-RU')],
    ['Соответствие голд-стандарту, %', p.metrics?.compliance ?? '—'],
    ['Health Score', p.engine?.score ?? '— (нужны ответы)'],
    ['Confidence Score', p.coverage ? `${p.coverage.confidence.score}/${p.coverage.confidence.base}` : '—'],
    ['Недополучено, ₴/год', p.money ? Math.round(p.money.potentialYear) : '— (нужен baseline)'],
  ];
  sheets.push({ name: 'Сводка', header: ['Показатель', 'Значение'], rows: summary, cols: [34, 40] });

  // Таблица аудита (AD-02) — проверки голд-стандарта по страницам
  const auditRows: (string | number)[][] = [];
  for (const pg of ds.client.pages) {
    if (pg.error) continue;
    for (const c of pg.checks) auditRows.push([pg.kind, pg.finalUrl || pg.url, c.group, c.label, c.pass ? 'ok' : 'провал', c.detail ?? '']);
  }
  sheets.push({ name: 'Таблица аудита', header: ['Страница', 'URL', 'Область', 'Проверка', 'Статус', 'Деталь'], rows: auditRows, cols: [12, 40, 12, 34, 10, 18] });

  // Зрелость (AD-16)
  if (p.maturity) {
    sheets.push({
      name: 'Зрелость',
      header: ['Домен', 'Что оценивается', 'Уровень', 'Основание'],
      rows: p.maturity.rows.map((d) => [d.domain, d.assesses, levelLabel(d.level), d.basis]),
      cols: [16, 40, 18, 38],
    });
  }

  // Scope по волнам (AD-05)
  if (p.scope) {
    const rows: (string | number)[][] = [];
    for (const w of p.scope.waves) for (const it of w.items) rows.push([`Волна ${w.n}`, WAVE_WEEKS[w.n] ?? '', it.playbook, it.name, it.reasons.join('; ')]);
    sheets.push({ name: 'Scope по волнам', header: ['Волна', 'Срок', 'Плейбук', 'Методика', 'Основание'], rows, cols: [10, 12, 12, 34, 50] });

    // Гант (AD-18) — задачи из scope, срок по волне
    const gantt: (string | number)[][] = [];
    for (const w of p.scope.waves) for (const it of w.items) gantt.push([w.n, WAVE_WEEKS[w.n] ?? '', `${it.playbook} · ${it.name}`, '≈3–4 недели', 'Исполнитель — назначить', 'DoD — задать']);
    sheets.push({ name: 'Гант (план)', header: ['Волна', 'Окно', 'Задача', 'Оценка', 'Исполнитель', 'Критерий завершения'], rows: gantt, cols: [8, 12, 44, 14, 24, 24] });
  }

  // Деньги/рычаги (AD-04)
  if (p.money) {
    const rows: (string | number)[][] = p.money.waterfall
      .slice().sort((a, b) => b.contribYear - a.contribYear)
      .map((w) => [w.label, w.fact, w.target, Math.round(w.contribYear)]);
    rows.push(['— Потенциал (Σ вкладов) —', '', '', Math.round(p.money.potentialYear)]);
    sheets.push({ name: 'Деньги (рычаги)', header: ['Рычаг воронки', 'Факт', 'Цель', '₴/год (вклад)'], rows, cols: [26, 12, 12, 18] });
  }

  // Дерево сайта (AD-08)
  const tree: (string | number)[][] = ds.client.pages.map((pg) => [pg.kind, pg.finalUrl || pg.url, pg.score ?? '—', pg.error ? 'ошибка/бот-защита' : 'разобрана']);
  sheets.push({ name: 'Дерево сайта', header: ['Тип', 'URL', 'Соответствие %', 'Статус'], rows: tree, cols: [12, 48, 16, 20] });

  // Техбэклог (AD-10) — проваленные проверки с частотой
  const failMap = new Map<string, { label: string; group: string; count: number }>();
  for (const pg of ds.client.pages) for (const c of pg.checks) if (!c.pass) {
    const cur = failMap.get(c.id) ?? { label: c.label, group: c.group, count: 0 };
    cur.count++; failMap.set(c.id, cur);
  }
  const prio = (g: string) => (/техник|seo/i.test(g) ? 'P1' : 'P2');
  const backlog = Array.from(failMap.values()).sort((a, b) => b.count - a.count).map((f) => [f.label, f.group, f.count, prio(f.group)]);
  sheets.push({ name: 'Техбэклог', header: ['Что исправить', 'Область', 'Провалов (стр.)', 'Приоритет'], rows: backlog, cols: [40, 14, 16, 12] });

  // Разрывы и решения движка (если есть ответы)
  if (p.engine?.gaps?.length) {
    sheets.push({ name: 'Критические разрывы', header: ['Разрыв', 'Штраф', 'Основание'], rows: p.engine.gaps.map((g) => [g.label, g.penalty, g.evidence]), cols: [40, 10, 44] });
  }
  if (p.engine?.decisions?.length) {
    sheets.push({
      name: 'Решения',
      header: ['ID', 'Решение', 'Impact', 'Сложность', 'Дней', 'ROI', 'Плейбуки'],
      rows: p.engine.decisions.map((d) => [d.id, d.title, d.impact, d.difficulty, d.timeDays, d.roi, d.playbooks.join(', ')]),
      cols: [8, 40, 10, 12, 8, 8, 20],
    });
  }

  // Гипотезы (AD-19)
  if (p.hypotheses?.items?.length) {
    sheets.push({
      name: 'Реестр гипотез',
      header: ['ID', 'Вид', 'Гипотеза', 'Как проверить', 'Критерий опровержения', 'Увер.'],
      rows: p.hypotheses.items.map((h) => [h.id, h.area, h.hypothesis, h.verifyBy, h.falsifyIf, h.confidence]),
      cols: [6, 12, 40, 34, 34, 8],
    });
  }

  return sheets;
}
