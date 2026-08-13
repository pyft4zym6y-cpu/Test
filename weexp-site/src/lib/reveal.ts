import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Єдина скрол-хореографія входу для всього сайту: секційні заголовки й картки
 * плавно проявляються при появі у в'юпорті. Без правок у кожному компоненті —
 * хук сам знаходить елементи за класами й додає .rv/.rv-in. Fallback-таймер
 * гарантує видимість, якщо спостерігач не спрацює. Вимкнено на reduced-motion.
 */
const SELECTOR = [
  '.proof-h', '.engine-h', '.usp-h', '.ts-h', '.gr-h', '.close-h',
  '.stat', '.ts-col', '.gr-stat', '.en-l', '.usp-rtb', '.usp-pyr', '.proof-chart', '.gr-arc',
  '.page-h1', '.page-lead',
  '.wwb-sec-head', '.wwb-pillar', '.wwb-card',
  '.ch-row', '.caselist-row', '.sys-idea-text', '.sys-cols',
  '.cd-arc-block', '.cd-metrics', '.cd-cols',
  '.dg-get-item', '.dg-how-step',
].join(',');

export function useReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    let els: HTMLElement[] = [];
    let io: IntersectionObserver | null = null;
    // Даємо маршруту змонтуватися, тоді збираємо елементи.
    const t0 = setTimeout(() => {
      els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
      io = new IntersectionObserver((ents) => {
        for (const e of ents) if (e.isIntersecting) { e.target.classList.add('rv-in'); io!.unobserve(e.target); }
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
      els.forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--rv-i', String(i % 5)); io!.observe(el); });
    }, 40);
    const t1 = setTimeout(() => els.forEach((el) => el.classList.add('rv-in')), 1800); // fallback
    return () => {
      clearTimeout(t0); clearTimeout(t1); io?.disconnect();
      els.forEach((el) => { el.classList.remove('rv', 'rv-in'); el.style.removeProperty('--rv-i'); });
    };
  }, [pathname]);
}
