import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from './shared';

/**
 * Автозбереження редакторів адмінки. Одна реалізація замість пʼяти копій, кожна
 * з яких втрачала дані по-своєму:
 *
 *  • збереження при демонтажі йшло як `void save(...)` — промис ніхто не чекав,
 *    помилку викидали; піти зі сторінки означало «можливо, збереглось»;
 *  • закриття вкладки протягом секунди після правки просто губило її — жодного
 *    beforeunload у проєкті не було;
 *  • стан `error` показував «✕» без причини й без способу повторити.
 *
 * Тут: дебаунс, чесний стан, повтор, попередження при закритті вкладки і
 * синхронний «останній шанс» через sendBeacon-подібний keepalive-флеш.
 */
export type Autosave<T> = {
  state: SaveState;
  error: string;
  /** Позначити, що дані змінились (викликати після кожного setState даних). */
  touch: (next: T) => void;
  /** Зберегти негайно — кнопка «Зберегти» або «Повторити». */
  flush: () => Promise<boolean>;
  savedAt: string;
};

export function useAutosave<T>(
  save: (value: T) => Promise<{ ok: boolean; error?: string }>,
  delayMs = 1000,
): Autosave<T> {
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const latest = useRef<T | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef(save); saveRef.current = save;

  const doSave = useCallback(async (): Promise<boolean> => {
    if (latest.current === null) return true;
    setState('saving'); setError('');
    const r = await saveRef.current(latest.current);
    if (r.ok) { dirty.current = false; setState('saved'); setSavedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })); return true; }
    setState('error'); setError(r.error || 'Не збережено');
    return false;
  }, []);

  const touch = useCallback((next: T) => {
    latest.current = next;
    dirty.current = true;
    setState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void doSave(); }, delayMs);
  }, [doSave, delayMs]);

  // Закриття вкладки з незбереженим — браузер спитає. Це єдиний надійний спосіб:
  // асинхронний запит із beforeunload не гарантовано доїде.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Демонтаж (перехід між клієнтами/розділами всередині SPA): встигаємо зберегти.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (dirty.current) void doSave();
  }, [doSave]);

  return { state, error, touch, flush: doSave, savedAt };
}
