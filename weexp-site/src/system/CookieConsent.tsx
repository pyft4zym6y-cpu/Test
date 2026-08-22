import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import './system.css';

/**
 * Cookie-consent банер (GDPR). Самодостатній: вибір зберігається локально, без
 * зовнішніх сервісів. Показується раз, поки не натиснуть «Прийняти»/«Лише необхідні».
 */
const KEY = 'weexp:cookie-consent-v1';

export function CookieConsent() {
  const t = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* ignore */ }
  }, []);
  const decide = (v: 'all' | 'necessary') => {
    try { localStorage.setItem(KEY, JSON.stringify({ v, at: new Date().toISOString() })); } catch { /* ignore */ }
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="ckc" role="dialog" aria-live="polite" aria-label={t('Згода на cookie', 'Cookie consent')}>
      <div className="ckc-in">
        <span className="ckc-ic" aria-hidden="true">🍪</span>
        <p className="ckc-text">
          {t('Ми використовуємо cookie, щоб сайт працював коректно й ставав кращим. ', 'We use cookies to keep the site working and make it better. ')}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="ckc-link">{t('Політика конфіденційності', 'Privacy policy')}</a>.
        </p>
        <div className="ckc-actions">
          <button className="ckc-btn ghost" onClick={() => decide('necessary')}>{t('Лише необхідні', 'Necessary only')}</button>
          <button className="ckc-btn primary" onClick={() => decide('all')}>{t('Прийняти всі', 'Accept all')}</button>
        </div>
      </div>
    </div>
  );
}
