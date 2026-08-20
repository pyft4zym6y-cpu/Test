import { useLocation } from 'react-router-dom';

/**
 * Легка двомовність без залежностей. Мова визначається з URL: /en/* — англійська,
 * решта — українська (типово). SEO-коректно: обидві мови індексуються окремими
 * URL + hreflang. У компонентах: const t = useT(); t('Укр', 'Eng'). Для посилань:
 * const lp = useLp(); <Link to={lp('/proof')}> — додає /en у EN-режимі.
 */
export type Lang = 'uk' | 'en';

export function langOf(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'uk';
}

export function useLang(): Lang {
  return langOf(useLocation().pathname);
}

/** t('українською', 'in English') — обирає рядок за поточною мовою. */
export function useT() {
  const lang = useLang();
  return (uk: string, en: string) => (lang === 'en' ? en : uk);
}

/** Префіксер посилань: у EN-режимі додає /en (зберігаючи якорі та зовнішні URL). */
export function lpFor(lang: Lang) {
  return (to: string) => {
    if (lang !== 'en') return to;
    if (/^(https?:|mailto:|tel:)/.test(to)) return to;
    if (to === '/') return '/en';
    if (to.startsWith('/#')) return '/en' + to.slice(1); // '/en#systems'
    if (to.startsWith('#')) return to;
    return '/en' + to;
  };
}

export function useLp() {
  return lpFor(useLang());
}

/** Прибирає /en-префікс — щоб перемикач мов вів на той самий маршрут іншою мовою. */
export function stripLang(pathname: string): string {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3);
  return pathname;
}
