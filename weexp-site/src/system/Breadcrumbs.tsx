import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import { ORIGIN } from '@/lib/seo';
import './system.css';

/**
 * Хлібні крихти: видима навігація «де я» + JSON-LD BreadcrumbList для пошуку.
 * Будуються з маршруту. На головній і в кабінеті не показуються (там своя логіка).
 */
export type Crumb = { label: string; to?: string };

const LABELS: Record<string, string> = {
  '/proof': 'Докази', '/people': 'Команда', '/expansion': 'Експансія',
  '/diagnose': 'Діагностика', '/contact': 'Контакт', '/systems': 'Системи', '/pricing': 'Формати та ціни',
};

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
  const home: Crumb = { label: 'Головна', to: '/' };
  const svc = pathname.match(/^\/systems\/(.+)$/);
  if (svc) {
    const sys = SYSTEMS.find((s) => s.slug === svc[1]);
    return [home, { label: 'Системи', to: '/#systems' }, { label: sys?.title ?? 'Система' }];
  }
  if (/^\/cases\/.+$/.test(pathname)) return [home, { label: 'Докази', to: '/proof' }, { label: 'Кейс' }];
  const label = LABELS[pathname];
  return label ? [home, { label, to: pathname }] : [];
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
