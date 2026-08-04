import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, type AnswerRow } from './supabase';
import { useApp } from '../App';

/** Ответы клиента: загрузка + upsert с дебаунсом. */
export function useAnswers() {
  const { session, member } = useApp();
  const clientId = member.client_id!;
  const [rows, setRows] = useState<Record<string, AnswerRow>>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
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
      setRows((prev) => {
        const cur = prev[questionId] ?? {
          client_id: clientId,
          question_id: questionId,
          answer: null,
          facts: null,
          updated_by: session.user.email ?? null,
        };
        const next = { ...cur, ...patch, updated_by: session.user.email ?? null };
        clearTimeout(timers.current[questionId]);
        timers.current[questionId] = setTimeout(async () => {
          await supabase.from('answers').upsert(next, { onConflict: 'client_id,question_id' });
          setSavedAt(Date.now());
        }, 700);
        return { ...prev, [questionId]: next };
      });
    },
    [clientId, session.user.email],
  );

  return { rows, loaded, save, savedAt };
}

export function answerMap(rows: Record<string, AnswerRow>): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries(rows)) if (v.answer) m[k] = v.answer;
  return m;
}
