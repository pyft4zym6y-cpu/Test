import type { AnswerRow } from './supabase';
import { byId } from './model';

/**
 * Детектор противоречий: ответ A заявляет зрелость, ответ B отрицает её условие.
 * Сработавшие пары — готовые вопросы к интервью, не обвинения.
 */
export type CRule = {
  id: string;
  a: { qid: string; vals: string[] };
  b: { qid: string; vals: string[] };
  question: string; // формулировка для интервью
};

export const CONTRADICTION_RULES: CRule[] = [
  {
    id: 'C1',
    a: { qid: 'GV-003', vals: ['По данным'] },
    b: { qid: 'AN-003', vals: ['Нет'] },
    question: 'Решения принимаются «по данным», но единого источника правды по выручке нет. По каким данным принимаются решения?',
  },
  {
    id: 'C2',
    a: { qid: 'GV-003', vals: ['По данным'] },
    b: { qid: 'AN-002', vals: ['>15%', 'Не сверялось'] },
    question: 'Решения «по данным», при этом аналитика с бэкендом не сверялась или расходится сильнее 15%. Каким цифрам верит команда?',
  },
  {
    id: 'C3',
    a: { qid: 'FI-002', vals: ['Да'] },
    b: { qid: 'FI-127', vals: ['Не распределяются'] },
    question: 'Юнит-экономика «считается», но накладные расходы не распределяются по каналам — значит, CM2/CM3 неполные. Что именно входит в расчёт?',
  },
  {
    id: 'C4',
    a: { qid: 'FI-124', vals: ['Да'] },
    b: { qid: 'FI-001', vals: ['Нет'] },
    question: 'Есть сценарное моделирование, но нет управленческого P&L. На какой базе строятся сценарии?',
  },
  {
    id: 'C5',
    a: { qid: 'CR-015', vals: ['Да'] },
    b: { qid: 'CU-011', vals: ['Нет'] },
    question: 'Заявлена работа с NPS, но NPS не измеряется. Что имелось в виду под работой с NPS?',
  },
  {
    id: 'C6',
    a: { qid: 'CU-012', vals: ['Да'] },
    b: { qid: 'CX-003', vals: ['Мессенджеры'] },
    question: 'CSAT после обращений измеряется, но поддержка живёт в мессенджерах без helpdesk. Где и как фиксируется CSAT?',
  },
  {
    id: 'C7',
    a: { qid: 'PD-005', vals: ['Модель прогнозирования'] },
    b: { qid: 'AI-123', vals: ['Нет'] },
    question: 'Заявлена модель прогнозирования спроса, но автоматизации прогноза нет. Что за модель и кто её считает?',
  },
  {
    id: 'C8',
    a: { qid: 'MK-011', vals: ['Data-driven', 'Модель MMM'] },
    b: { qid: 'AN-002', vals: ['Не сверялось', '>15%'] },
    question: 'Атрибуция data-driven, но данные аналитики не сверены с бэкендом. Насколько можно верить распределению бюджета по каналам?',
  },
  {
    id: 'C9',
    a: { qid: 'PR-001', vals: ['По ценности'] },
    b: { qid: 'PX-013', vals: ['Нет'] },
    question: 'Цена формируется «по ценности», но письменного Value Proposition нет. Как ценность определена и кем?',
  },
  {
    id: 'C10',
    a: { qid: 'MK-017', vals: ['Да'] },
    b: { qid: 'PX-013', vals: ['Нет'] },
    question: 'Позиционирование зафиксировано письменно, а Value Proposition нет. На чём основано позиционирование?',
  },
  {
    id: 'C11',
    a: { qid: 'AN-008', vals: ['DWH'] },
    b: { qid: 'AN-003', vals: ['Нет'] },
    question: 'Есть DWH, но единого источника правды по выручке нет. Что мешает DWH стать этим источником?',
  },
  {
    id: 'C12',
    a: { qid: 'SL-012', vals: ['Автоматически'] },
    b: { qid: 'OP-009', vals: ['Нет ERP'] },
    question: 'Заказы обрабатываются «автоматически», но ERP нет. Где живёт эта автоматизация и что будет при росте ×2?',
  },
];

export type Contradiction = {
  rule: CRule;
  aAnswer: string;
  bAnswer: string;
  aBy: string | null;
  bBy: string | null;
  crossRole: boolean;
  aText: string;
  bText: string;
};

const hit = (answer: string | null | undefined, vals: string[]) => {
  if (!answer) return false;
  const parts = answer.split(' | ');
  return vals.some((v) => parts.includes(v) || answer === v);
};

/**
 * Сколько правил вообще можно было проверить: правило сверяет пару вопросов и
 * требует ответа на ОБА. Пустой список противоречий сам по себе ничего не
 * значит — значение ему придаёт только это число.
 */
export function contradictionCoverage(rows: Record<string, AnswerRow>): { checked: number; total: number } {
  const checked = CONTRADICTION_RULES.filter(
    (r) => rows[r.a.qid]?.answer && rows[r.b.qid]?.answer,
  ).length;
  return { checked, total: CONTRADICTION_RULES.length };
}

export function detectContradictions(rows: Record<string, AnswerRow>): Contradiction[] {
  const out: Contradiction[] = [];
  for (const rule of CONTRADICTION_RULES) {
    const a = rows[rule.a.qid];
    const b = rows[rule.b.qid];
    if (!hit(a?.answer, rule.a.vals) || !hit(b?.answer, rule.b.vals)) continue;
    out.push({
      rule,
      aAnswer: a!.answer!,
      bAnswer: b!.answer!,
      aBy: a?.updated_by ?? null,
      bBy: b?.updated_by ?? null,
      crossRole: Boolean(a?.updated_by && b?.updated_by && a.updated_by !== b.updated_by),
      aText: byId.get(rule.a.qid)?.text ?? rule.a.qid,
      bText: byId.get(rule.b.qid)?.text ?? rule.b.qid,
    });
  }
  return out;
}
