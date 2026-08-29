import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePageSeo } from '@/lib/seo';
import { track } from '@/lib/analytics';
import { appHref } from '@/lib/origins';
import { useT, useLp } from '@/i18n';
import './system.css';

/**
 * Світла 404 у системі .sysx (замість старої тёмної) — єдина айдентика на всіх
 * маршрутах. noindex, щоб soft-404 не потрапляв в індекс. Живе під SystemShell,
 * тож отримує шапку/підвал автоматично.
 */
export function SystemNotFound() {
  const { pathname } = useLocation();
  const t = useT();
  const lp = useLp();
  usePageSeo(t('Сторінку не знайдено · WEEXP', 'Page not found · WEEXP'), t('Такої сторінки немає.', 'This page does not exist.'), pathname, true);
  // Трекінг 404 — щоб бачити биті посилання (шлях + звідки прийшли).
  useEffect(() => { track('page_not_found', { path: pathname, ref: typeof document !== 'undefined' ? document.referrer : '' }); }, [pathname]);
  return (
    <section className="sysx sysx-404" aria-label={t('Сторінку не знайдено', 'Page not found')}>
      <div className="sysx-404-in">
        <div className="sysx-kick mono">{t('404 · сторінки немає', '404 · page not found')}</div>
        <h1 className="sysx-display sysx-404-h">{t('Такої сторінки немає —', 'This page does not exist —')}<br />{t('але ', 'but the ')}<span className="sysx-em">{t('система', 'system')}</span>{t(' на місці.', ' is in place.')}</h1>
        <p className="sysx-lead">{t('Можливо, посилання застаріло. Повернімося на головну або подивимось докази в цифрах.', 'The link may be outdated. Go back to the homepage or see the proof in numbers.')}</p>
        <div className="sysx-cta-row">
          <Link to={lp('/')} className="sysx-cta is-primary">{t('На головну', 'Home')} →</Link>
          <Link to={lp('/diagnose')} className="sysx-cta">{t('Порахувати витік', 'Calculate the leak')} →</Link>
          <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
        </div>
        <nav className="sysx-404-nav mono" aria-label={t('Популярні сторінки', 'Popular pages')}>
          <span>{t('Куди далі:', 'Where to next:')}</span>
          <Link to={lp('/proof')}>{t('Докази', 'Proof')}</Link>
          <Link to={lp('/expansion')}>{t('Експансія', 'Expansion')}</Link>
          <Link to={lp('/people')}>{t('Про нас', 'About')}</Link>
          <Link to={lp('/pricing')}>{t('Формати і ціни', 'Pricing')}</Link>
          <a href={appHref('/cabinet')}>{t('Кабінет', 'Cabinet')}</a>
        </nav>
      </div>
    </section>
  );
}
