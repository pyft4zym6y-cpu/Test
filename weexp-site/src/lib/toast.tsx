import { useEffect, useState } from 'react';

/**
 * Легкі тости без залежностей і без контексту: модульний стор + <Toaster/>,
 * змонтований один раз у App. Викликати toast('...') можна звідусіль.
 */
export type ToastKind = 'ok' | 'err' | 'info';
type Toast = { id: number; msg: string; kind: ToastKind };
let seq = 1;
let items: Toast[] = [];
const subs = new Set<(t: Toast[]) => void>();
const emit = () => subs.forEach((f) => f(items));

export function toast(msg: string, kind: ToastKind = 'ok', ms = 3200) {
  const id = seq++;
  items = [...items, { id, msg, kind }];
  emit();
  setTimeout(() => { items = items.filter((t) => t.id !== id); emit(); }, ms);
}

export function Toaster() {
  const [list, setList] = useState<Toast[]>(items);
  useEffect(() => { subs.add(setList); return () => { subs.delete(setList); }; }, []);
  if (!list.length) return null;
  return (
    <div className="toaster" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast t-${t.kind}`}>
          <span className="toast-ic" aria-hidden="true">{t.kind === 'ok' ? '✓' : t.kind === 'err' ? '!' : 'i'}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
