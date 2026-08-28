import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import { ORIGIN } from '@/lib/seo';
import { langOf, lpFor, stripLang, type Lang } from '@/i18n';
import './system.css';
import { PAGES, EXTRA_PAGES } from '@/lib/nav';

/**
 * Хлібні крихти: видима навігація «де я» + JSON-LD BreadcrumbList для пошуку.
 * Двомовні: підписи через словник, посилання префіксуються /en у EN-режимі.
 */
export type Crumb = { label: string; to?: string };

// Назви беремо з lib/nav — того самого переліку, що малює меню й підвал.
// Свій словник тут розійшовся з меню: «Докази» проти «Наші перемоги»,
// «Команда» проти «Про нас», «Формати та ціни» проти «Початок співпраці».
const L2: Record<string, [string, string]> = Object.fromEntries(
  [...PAGES, ...EXTRA_PAGES].filter((p) => p.to !== '/').map((p) => [p.to, [p.uk, p.en] as [string, string]]),
);
const HOME: [string, string] = ['Головна', 'Home'];
const CASE: [string, string] = ['Кейс', 'Case'];

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;
  return (
    <nav className="sysx sysx-crumbs" aria-label="Хлібні крихти">
      <ol className="sysx-crumbs-in">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="sysx-crumb">
              {c.to && !last ? <Link to={c.to}>{c.label}</Link> : <span aria-current={last ? 'page' : undefined}>{c.label}</span>}
              {!last && <i className="sysx-crumb-sep" aria-hidden="true">/</i>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function crumbsFor(pathname: string): Crumb[] {
  const lang: Lang = langOf(pathname);
  const lp = lpFor(lang);
  const pick = (p: [string, string]) => p[lang === 'en' ? 1 : 0];
  const base = stripLang(pathname);
  const home: Crumb = { label: pick(HOME), to: lp('/') };
  const svc = base.match(/^\/systems\/(.+)$/);
  if (svc) {
    const sys = SYSTEMS.find((s) => s.slug === svc[1]);
    return [home, { label: pick(L2['/systems']), to: lp('/systems') }, { label: sys?.title ?? 'System' }];
  }
  if (/^\/cases\/.+$/.test(base)) return [home, { label: pick(L2['/proof']), to: lp('/proof') }, { label: pick(CASE) }];
  const l = L2[base];
  return l ? [home, { label: pick(l), to: lp(base) }] : [];
}

/** Витягує крихти з поточного маршруту, малює їх і додає JSON-LD у <head>. */
export function RouteBreadcrumbs() {
  const { pathname } = useLocation();
  const items = crumbsFor(pathname);

  useEffect(() => {
    const id = 'ld-breadcrumbs';
    document.getElementById(id)?.remove();
    if (items.length < 2) return;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((c, i) => ({
        '@type': 'ListItem', position: i + 1, name: c.label,
        // JSON-LD item має бути реальним індексованим URL — прибираємо фрагмент (#systems).
        ...(c.to ? { item: ORIGIN + (c.to === '/' ? '/' : (c.to.split('#')[0].replace(/\/$/, '') || '/')) } : {}),
      })),
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.id = id; s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
    return () => document.getElementById(id)?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <Breadcrumbs items={items} />;
}
