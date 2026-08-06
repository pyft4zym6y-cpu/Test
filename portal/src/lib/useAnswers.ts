import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, DEMO, type AnswerRow } from './supabase';
import { useApp } from '../App';

const LS_KEY = 'weexp-demo-answers';

const lsLoad = (): Record<string, AnswerRow> => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
};
export const lsSaveAll = (rows: Record<string, AnswerRow>) =>
  localStorage.setItem(LS_KEY, JSON.stringify(rows));

/** Ответы клиента: загрузка + upsert с дебаунсом (Supabase или localStorage в демо). */
export function useAnswers() {
  const { session, member, locked } = useApp();
  const clientId = member.client_id!;
  const [rows, setRows] = useState<Record<string, AnswerRow>>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (DEMO) {
      setRows(lsLoad());
      setLoaded(true);
      return;
    }
    supabase
      .from('answers')
      .select('*')
      .eq('client_id', clientId)
      .then(({ data }) => {
        const map: Record<string, AnswerRow> = {};
        (data ?? []).forEach((r) => (map[r.question_id] = r as AnswerRow));
        setRows(map);
        setLoaded(true);
      });
  }, [clientId]);

  const save = useCallback(
    (questionId: string, patch: { answer?: string; facts?: string }) => {
      // Приём закрыт консультантом: RLS в базе всё равно не пропустит запись,
      // но и в интерфейсе не создаём иллюзию сохранения.
      if (locked && !member.is_admin) return;
      setRows((prev) => {
        const cur = prev[questionId] ?? {
          client_id: clientId,
          question_id: questionId,
          answer: null,
          facts: null,
          updated_by: session?.user.email ?? 'demo',
        };
        const next = { ...cur, ...patch, updated_by: session?.user.email ?? 'demo' };
        const all = { ...prev, [questionId]: next };
        clearTimeout(timers.current[questionId]);
        timers.current[questionId] = setTimeout(async () => {
          if (DEMO) lsSaveAll(all);
          else await supabase.from('answers').upsert(next, { onConflict: 'client_id,question_id' });
          setSavedAt(Date.now());
        }, 500);
        return all;
      });
    },
    [clientId, session, locked, member.is_admin],
  );

  return { rows, setRows, loaded, save, savedAt };
}

export function answerMap(rows: Record<string, AnswerRow>): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries(rows)) if (v.answer) m[k] = v.answer;
  return m;
}
