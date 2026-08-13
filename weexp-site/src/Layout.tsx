import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { ScoreProvider } from '@/lib/score';
import { ScrollTrigger } from '@/lib/gsap';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ScoreHUD } from '@/components/ScoreHUD';
import { Agent } from '@/components/Agent';
import { useLenis } from '@/lib/useLenis';
import './layout.css';

/**
 * Оболочка «WEEXP OS» — единая для всех маршрутов. Сквозные элементы (Nav,
 * Independence Score, агент-маркер, футер) живут здесь, страницы монтируются в Outlet.
 * Смена маршрута = смена «экрана» ОС: сброс скролла, refresh ScrollTrigger, морф-переход.
 */
export function Layout() {
  useLenis();
  const { pathname, hash } = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  // Смена экрана: к якорю (если есть hash) или наверх + пересчёт триггеров под новый контент.
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    const toTop = () => { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); };
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { requestAnimationFrame(() => { if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -70 }); else (el as HTMLElement).scrollIntoView(); }); }
      else toTop();
    } else {
      toTop();
      document.documentElement.style.setProperty('--p', '0');
    }
    const t = setTimeout(() => ScrollTrigger.refresh(), 60);
    return () => clearTimeout(t);
  }, [pathname, hash]);

  return (
    <ScoreProvider>
      <Nav />
      <span id="top" />
      <main ref={mainRef} key={pathname} className="screen">
        <Outlet />
      </main>
      <Footer />
      <ScoreHUD />
      <Agent />
    </ScoreProvider>
  );
}
