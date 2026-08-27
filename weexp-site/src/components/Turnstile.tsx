import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n';

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

export function Turnstile({ onToken, onFail }: { onToken: (t: string) => void; onFail?: (why: string) => void }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const cb = useRef(onToken); cb.current = onToken;
  const fail = useRef(onFail); fail.current = onFail;
  const got = useRef(false);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let widgetId: string | undefined;
    let alive = true;
    const broke = (why: string) => { if (!alive || got.current) return; setFailed(true); cb.current(''); fail.current?.(why); };
    // Блокувальники реклами часто ріжуть скрипт МОВЧКИ: onerror не спрацьовує,
    // callback не приходить, і без таймауту форма зависає назавжди.
    const timeout = setTimeout(() => broke('timeout'), 8000);
    loadScript().then(() => {
      if (!alive || !box.current || !window.turnstile) { broke('no-api'); return; }
      widgetId = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => { got.current = true; clearTimeout(timeout); setFailed(false); cb.current(t); },
        'expired-callback': () => { got.current = false; cb.current(''); },
        'error-callback': () => broke('error'),
        theme: 'light',
      });
    }).catch(() => broke('script'));
    return () => {
      alive = false; clearTimeout(timeout);
      if (widgetId && window.turnstile) try { window.turnstile.remove(widgetId); } catch { /* ignore */ }
    };
  }, []);

  if (!SITE_KEY) return null;
  return (
    <div className="ts-box">
      <div ref={box} />
      {/* Віджет стоїть на /diagnose і /contact — обидві сторінки мають англійську
          версію. Повідомлення про збій було лише українською: відвідувач, у якого
          капча не піднялась, не міг зрозуміти, чи можна взагалі надсилати форму. */}
      {failed && <p className="mono ts-err">{t(
        'Перевірку «я не робот» не вдалося завантажити (блокувальник реклами?). Форму все одно можна надіслати — якщо не пройде, напишіть на hello@weexp.agency.',
        'The “I’m not a robot” check failed to load (ad blocker?). You can still submit the form — if it does not go through, email hello@weexp.agency.',
      )}</p>}
    </div>
  );
}
