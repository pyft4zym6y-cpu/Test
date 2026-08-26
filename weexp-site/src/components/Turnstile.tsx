import { useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile — перевірка «я не робот» на відкритих формах.
 *
 * Рендериться ЛИШЕ якщо задано VITE_TURNSTILE_SITE_KEY. Без ключа компонент
 * нічого не показує і одразу віддає порожній токен: форми працюють як раніше,
 * а захист вмикається додаванням двох змінних (сайт-ключ тут, секрет на сервері).
 *
 * Домен challenges.cloudflare.com уже дозволений у CSP — до цього моменту він
 * стояв там без діла: віджета в коді не було взагалі.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
export const turnstileEnabled = Boolean(SITE_KEY);

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile script failed'));
    document.head.appendChild(s);
  });
  return loading;
}

export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const cb = useRef(onToken); cb.current = onToken;

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let widgetId: string | undefined;
    let alive = true;
    loadScript().then(() => {
      if (!alive || !box.current || !window.turnstile) return;
      widgetId = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => cb.current(t),
        'expired-callback': () => cb.current(''),
        'error-callback': () => { setFailed(true); cb.current(''); },
        theme: 'light',
      });
    }).catch(() => setFailed(true));
    return () => { alive = false; if (widgetId && window.turnstile) try { window.turnstile.remove(widgetId); } catch { /* ignore */ } };
  }, []);

  if (!SITE_KEY) return null;
  return (
    <div className="ts-box">
      <div ref={box} />
      {failed && <p className="mono ts-err">Перевірку не вдалося завантажити. Напишіть на hello@weexp.agency.</p>}
    </div>
  );
}
