import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export type Crumb = { to?: string; label: string };

/*
 * Хлібні крихти: видима навігація + BreadcrumbList JSON-LD для пошуку.
 * Головна («weexp») додається автоматично першим елементом.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  useEffect(() => {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'weexp', item: 'https://weexp.agency/' },
        ...items.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: c.label,
          ...(c.to ? { item: `https://weexp.agency${c.to}` } : {}),
        })),
      ],
    };
    let el = document.getElementById('breadcrumbs-ld') as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = 'breadcrumbs-ld';
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(ld);
    return () => {
      document.getElementById('breadcrumbs-ld')?.remove();
    };
  }, [items]);

  return (
    <nav
      aria-label="Хлібні крихти"
      className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 pt-7 -mb-8 font-mono text-xs uppercase tracking-wider"
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="text-[#5A6472] hover:text-[#4D7C0F] transition-colors">
            weexp
          </Link>
        </li>
        {items.map((c) => (
          <li key={c.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-black/30">/</span>
            {c.to ? (
              <Link to={c.to} className="text-[#5A6472] hover:text-[#4D7C0F] transition-colors">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[#12161C]">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
