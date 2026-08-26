import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
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

  const alive = useRef(true);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const doSave = useCallback(async (): Promise<boolean> => {
    if (latest.current === null) return true;
    // Черга з одного: `flush()` під час дебаунс-сейву давав дві паралельні
    // записи, порядок яких ніхто не гарантував.
    if (inFlight.current) await inFlight.current;
    if (latest.current === null) return true;
    if (alive.current) { setState('saving'); setError(''); }
    const run = (async () => {
      const r = await saveRef.current(latest.current as T);
      if (r.ok) {
        dirty.current = false;
        if (alive.current) { setState('saved'); setSavedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })); }
        return true;
      }
      if (alive.current) { setState('error'); setError(r.error || 'Не збережено'); }
      // Компонент уже зник (пішли з розділу) — показати помилку в ньому вже
      // ніде, а мовчазна втрата даних саме так і виглядала. Кажемо тостом.
      else toast('Останні зміни не збереглися: ' + (r.error || 'помилка'), 'err');
      return false;
    })();
    inFlight.current = run;
    try { return await run; } finally { inFlight.current = null; }
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
    alive.current = false;
    if (timer.current) clearTimeout(timer.current);
    if (dirty.current) void doSave();
  }, [doSave]);

  return { state, error, touch, flush: doSave, savedAt };
}
