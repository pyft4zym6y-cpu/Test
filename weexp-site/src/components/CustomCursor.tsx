import { useEffect, useRef } from 'react';
import './cursor.css';

/**
 * Кастомний курсор преміум-рівня: точка йде миттєво, кільце наздоганяє з
 * інерцією й розширюється над інтерактивними елементами. Тільки десктоп
 * (pointer:fine) і не за reduced-motion — на тачі та в спрощеному режимі
 * рендериться нативний курсор, компонент вимикається.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = matchMedia('(pointer:fine)').matches;
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (!fine || reduce) return;

    document.body.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${mx}px, ${my}px)`;
    };
    const onOver = (e: PointerEvent) => {
      const hot = (e.target as HTMLElement)?.closest?.('a, button, [data-cursor], input, select, textarea, label, .xray-opt');
      document.body.classList.toggle('cursor-hot', !!hot);
    };
    const onDown = () => document.body.classList.add('cursor-down');
    const onUp = () => document.body.classList.remove('cursor-down');
    const loop = () => {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerover', onOver, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    loop();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerover', onOver);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      document.body.classList.remove('has-cursor', 'cursor-hot', 'cursor-down');
    };
  }, []);

  return (<><div ref={ring} className="cursor-ring" aria-hidden="true" /><div ref={dot} className="cursor-dot" aria-hidden="true" /></>);
}
