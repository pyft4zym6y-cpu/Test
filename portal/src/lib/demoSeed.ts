import { QUESTIONS, optionsFor } from './model';
import { PAINS_QID } from '../data/pains';
import { lsSaveAll } from './useAnswers';
import type { AnswerRow } from './supabase';

/** Заполняет демо-ответы: реалистичный «средний» бизнес с проблемами. */
export function seedDemo() {
  const rows: Record<string, AnswerRow> = {};
  const put = (id: string, answer: string) => {
    rows[id] = {
      client_id: 'demo',
      question_id: id,
      answer,
      facts: null,
      updated_by: 'demo',
    };
  };

  put(PAINS_QID, 'ads_expensive | low_repeat | no_data');

  for (const q of QUESTIONS) {
    if (q.level !== 'L1') continue;
    const opts = optionsFor(q);
    if (/Да\/Нет/.test(q.type) && opts) {
      const r = Math.random();
      put(q.id, r < 0.3 ? opts[0] : r < 0.55 ? (opts[1] ?? opts[0]) : opts[opts.length - 1]);
    } else if (q.type === 'Число') {
      put(q.id, String(Math.round(5 + Math.random() * 40)));
    } else if (q.type === 'Шкала 0-5') {
      put(q.id, String(Math.round(1 + Math.random() * 3)));
    } else if (q.type === 'Выбор' && opts && Math.random() < 0.6) {
      put(q.id, opts[Math.floor(Math.random() * opts.length)]);
    }
  }
  lsSaveAll(rows);
}
