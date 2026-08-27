import { useEffect, useState } from 'react';

/**
 * Легкі тости без залежностей і без контексту: модульний стор + <Toaster/>,
 * змонтований один раз у App. Викликати toast('...') можна звідусіль.
 *
 * Тост із дією потрібен рівно для одного: скасувати щойно зроблене. Діалог
 * «ви впевнені?» цю задачу не розвʼязує — його перестають читати з третього
 * разу й тиснуть «так» на автоматі. Скасування працює інакше: дія проходить
 * одразу, без питання, а помилку можна відкотити протягом кількох секунд.
 */
export type ToastKind = 'ok' | 'err' | 'info';
export type ToastAction = { label: string; run: () => void | Promise<void> };
type Toast = { id: number; msg: string; kind: ToastKind; action?: ToastAction };

let seq = 1;
let items: Toast[] = [];
const subs = new Set<(t: Toast[]) => void>();
const emit = () => subs.forEach((f) => f(items));
const drop = (id: number) => { items = items.filter((t) => t.id !== id); emit(); };

export function toast(msg: string, kind: ToastKind = 'ok', ms = 3200) {
  const id = seq++;
  items = [...items, { id, msg, kind }];
  emit();
  setTimeout(() => drop(id), ms);
}

/**
 * Тост із кнопкою скасування. Живе довше звичайного (за замовчуванням 8 с):
 * три секунди — це менше, ніж людина встигає зрозуміти, що помилилась.
 */
export function toastUndo(msg: string, undo: () => void | Promise<void>, ms = 8000) {
  const id = seq++;
  items = [...items, { id, msg, kind: 'info', action: { label: 'Скасувати', run: undo } }];
  emit();
  setTimeout(() => drop(id), ms);
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
          {t.action && (
            <button
              type="button"
              className="toast-act"
              onClick={() => {
                // Прибираємо одразу: інакше подвійний клік відкотить двічі.
                drop(t.id);
                void t.action!.run();
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
