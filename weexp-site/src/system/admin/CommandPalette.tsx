import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdminRow } from '@/lib/supa';
import { buildCommands, rank, type NavTab } from './commands';

/**
 * Палітра команд: Ctrl/⌘ + K.
 *
 * Відкривається поверх усього, шукає по розділах і клієнтах, ходить стрілками,
 * закривається Escape. Фокус повертається туди, звідки відкрили — інакше після
 * закриття таб починається з початку сторінки.
 *
 * Гарячу клавішу свідомо НЕ перехоплюємо, коли курсор у полі вводу з текстом:
 * ⌘K у деяких розкладках і редакторах означає інше, і красти її в момент
 * набору тексту — найшвидший спосіб зробити гарячу клавішу ворогом.
 */
export function CommandPalette({ tabs, rows, onTab, onClient }: {
  tabs: NavTab[];
  rows: AdminRow[] | null;
  onTab: (id: string) => void;
  onClient: (userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const cmds = useMemo(() => buildCommands(tabs, rows, { tab: onTab, client: onClient }), [tabs, rows, onTab, onClient]);
  const list = useMemo(() => rank(cmds, q), [cmds, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = /^(input|textarea|select)$/i.test((e.target as HTMLElement)?.tagName || '');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !inField) {
        e.preventDefault();
        returnTo.current = document.activeElement as HTMLElement;
        setOpen(true); setQ(''); setI(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { setI(0); }, [q]);

  const close = () => {
    setOpen(false);
    // Повертаємо фокус: без цього таб після закриття починається з початку сторінки.
    returnTo.current?.focus?.();
  };

  const pick = (n: number) => {
    const c = list[n];
    if (!c) return;
    close();
    c.run();
  };

  if (!open) return null;

  return (
    <div className="adm-cmd-back" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="adm-cmd" role="dialog" aria-modal="true" aria-label="Пошук по адмінці">
        <input
          ref={inputRef}
          className="adm-cmd-q"
          type="text"
          value={q}
          placeholder="Розділ або клієнт…"
          aria-label="Пошук"
          aria-activedescendant={list[i] ? `cmd-${list[i].id}` : undefined}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => Math.min(v + 1, list.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => Math.max(v - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); pick(i); }
          }}
        />
        {list.length === 0 ? (
          <p className="mono adm-empty adm-cmd-none">Нічого не знайшлось. Спробуйте пошту клієнта.</p>
        ) : (
          <ul className="adm-cmd-list" role="listbox" aria-label="Результати">
            {list.map((c, n) => (
              <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={n === i}>
                <button type="button" className={`adm-cmd-i${n === i ? ' on' : ''}`}
                  onMouseEnter={() => setI(n)} onClick={() => pick(n)}>
                  <span className="adm-cmd-kind mono">{c.kind === 'nav' ? 'розділ' : c.kind === 'client' ? 'клієнт' : 'дія'}</span>
                  <b>{c.label}</b>
                  {c.hint && <i>{c.hint}</i>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mono adm-cmd-foot">↑↓ — вибір · Enter — відкрити · Esc — закрити</p>
      </div>
    </div>
  );
}
