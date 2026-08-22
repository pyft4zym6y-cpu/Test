import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';

/**
 * Легка поведінкова аналітика через існуючий track() (self-hosted, без сторонніх).
 * Глибина скролу по сторінці, кліки по CTA й зовнішні посилання.
 */
export function Engagement() {
  const { pathname } = useLocation();

  useEffect(() => {
    const hit = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const pct = (window.scrollY / h) * 100;
      for (const m of [25, 50, 75, 100]) if (pct >= m && !hit.has(m)) { hit.add(m); track('scroll_depth', { percent: m, path: pathname }); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null; if (!el) return;
      const cta = el.closest('.sysx-cta') as HTMLElement | null;
      if (cta) track('cta_click', { label: (cta.textContent || '').trim().slice(0, 60), href: (cta as HTMLAnchorElement).href || '', path: pathname });
      const link = el.closest('a[href^="http"]') as HTMLAnchorElement | null;
      if (link && link.host !== location.host) track('outbound_click', { href: link.href });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [pathname]);

  return null;
}
