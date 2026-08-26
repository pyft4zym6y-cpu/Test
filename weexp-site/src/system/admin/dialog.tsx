import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Свій діалог замість нативних confirm/prompt.
 *
 * Нативні вікна: не мають стилю продукту, блокують потік, не дають багаторядкове
 * поле і не розрізняють «скасував» та «лишив порожнім». Найгірше було в модерації
 * анкети: коментар, який ПОБАЧИТЬ КЛІЄНТ, писався у вузький однорядковий prompt().
 * Тут — звичайна модалка з фокусом, Esc, Enter і полем потрібного розміру.
 */
type Ask = {
  title: string;
  text?: string;
  /** Є поле вводу — повертаємо рядок; немає — повертаємо true/false. */
  input?: { label?: string; placeholder?: string; initial?: string; rows?: number };
  confirmLabel?: string;
  tone?: 'ok' | 'bad' | 'wait';
};
type Pending = Ask & { resolve: (v: string | boolean | null) => void };

let open: ((a: Pending) => void) | null = null;

/** Питання «так/ні». Повертає true, якщо підтвердили. */
export function askConfirm(a: Ask): Promise<boolean> {
  if (!open) return Promise.resolve(window.confirm(a.title));
  return new Promise((resolve) => open!({ ...a, resolve: (v) => resolve(v === true) }));
}
/** Питання з полем. Повертає рядок або null, якщо скасували. */
export function askText(a: Ask & { input: NonNullable<Ask['input']> }): Promise<string | null> {
  if (!open) return Promise.resolve(window.prompt(a.title, a.input.initial || ''));
  return new Promise((resolve) => open!({ ...a, resolve: (v) => resolve(typeof v === 'string' ? v : null) }));
}

/** Ставиться один раз в адмінці. Без нього хелпери падають назад на нативні вікна. */
export function DialogHost() {
  const [cur, setCur] = useState<Pending | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // Куди повернути фокус після закриття — на кнопку, з якої діалог відкрили.
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    open = (a) => {
      returnTo.current = document.activeElement as HTMLElement | null;
      setCur(a); setValue(a.input?.initial || '');
    };
    return () => { open = null; };
  }, []);
  // Фокус ЗАВЖДИ всередині діалогу: у полі, якщо воно є, інакше на кнопці
  // підтвердження. Раніше фокус ставився лише на поле, тож confirm-діалог
  // клавіатурою підтвердити було неможливо.
  useEffect(() => {
    if (!cur) return;
    (cur.input ? inputRef.current : confirmRef.current)?.focus();
  }, [cur]);

  const close = useCallback((v: string | boolean | null) => {
    cur?.resolve(v);
    setCur(null);
    // Повертаємо фокус туди, звідки прийшли, інакше після закриття він падає
    // на <body> і клавіатурна навігація починається спочатку.
    const back = returnTo.current;
    returnTo.current = null;
    if (back && document.contains(back)) setTimeout(() => back.focus(), 0);
  }, [cur]);

  useEffect(() => {
    if (!cur) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(null); return; }
      // Ловушка фокуса: Tab не має виводити з модалки — інакше «модальність»
      // існує лише візуально, а клавіатурою можна натиснути що завгодно позаду.
      if (e.key === 'Tab' && boxRef.current) {
        const f = boxRef.current.querySelectorAll<HTMLElement>('button, textarea, input, select, a[href]');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !boxRef.current.contains(active))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
        return;
      }
      // Enter підтверджує; у багаторядковому полі — тільки з Ctrl/Cmd.
      if (e.key === 'Enter' && (!cur.input || (cur.input.rows ?? 1) <= 1 || e.metaKey || e.ctrlKey)) {
        e.preventDefault(); close(cur.input ? value : true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cur, value, close]);

  if (!cur) return null;
  return (
    <div className="adm-modal-wrap" onClick={() => close(null)}>
      <div ref={boxRef} className="adm-modal" role="dialog" aria-modal="true" aria-label={cur.title} onClick={(e) => e.stopPropagation()}>
        <b className="adm-modal-h">{cur.title}</b>
        {cur.text && <p className="adm-modal-p mono">{cur.text}</p>}
        {cur.input && (
          <textarea ref={inputRef} className="adm-modal-ta" rows={cur.input.rows ?? 3}
            placeholder={cur.input.placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
        )}
        <div className="adm-modal-act">
          <button className="mc-btn" onClick={() => close(null)}>Скасувати</button>
          <button ref={confirmRef} className={`mc-btn ${cur.tone || 'ok'}`} onClick={() => close(cur.input ? value : true)}>
            {cur.confirmLabel || 'Підтвердити'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Межа помилки навколо однієї панелі. Досі ErrorBoundary був один на весь
 * застосунок: помилка в будь-якому блоці картки забирала всю адмінку.
 */
export class PanelBoundary extends Component<{ title?: string; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="adm-panel adm-panel-broken">
        <span className="adm-col-h mono">{this.props.title || 'Блок'} — помилка</span>
        <p className="mono adm-empty">{this.state.error.message}</p>
        <button className="mc-btn ghost" onClick={() => this.setState({ error: null })}>Спробувати ще раз</button>
      </div>
    );
  }
}
