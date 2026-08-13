import { useEffect, useRef, type ReactNode } from 'react';
import './interactions.css';

const canHover = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(pointer:fine)').matches &&
  !matchMedia('(prefers-reduced-motion:reduce)').matches;

/** Магнітна обгортка: елемент тягнеться до курсора й пружинить назад. Десктоп. */
export function Magnetic({ children, strength = 0.35, className }:
  { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current; if (!el || !canHover()) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <span ref={ref} className={`magnetic${className ? ` ${className}` : ''}`}
      onPointerMove={move} onPointerLeave={reset}>{children}</span>
  );
}

/**
 * 3D-нахил під курсор для будь-яких елементів із [data-tilt] — без обгорток
 * у DOM, тому не ламає grid/flex (transform не змінює розкладку). Значення
 * data-tilt = максимальний кут у градусах (за замовчанням 7). Десктоп.
 */
export function useTilt() {
  useEffect(() => {
    if (!canHover()) return;
    let active: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target && target.closest ? target.closest<HTMLElement>('[data-tilt]') : null;
      if (el !== active && active) { active.style.transform = ''; active.classList.remove('is-tilting'); }
      active = el;
      if (!el) return;
      el.classList.add('is-tilting');
      const max = parseFloat(el.dataset.tilt || '7');
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${(px * max).toFixed(2)}deg) rotateX(${(-py * max).toFixed(2)}deg)`;
    };
    const leave = () => { if (active) { active.style.transform = ''; active.classList.remove('is-tilting'); active = null; } };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerleave', leave, { passive: true });
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerleave', leave); };
  });
}

/**
 * Легкий скрол-паралакс: усі елементи з [data-parallax] зміщуються по Y
 * залежно від положення у вʼюпорті × коефіцієнт. Один rAF-цикл на сторінку.
 * Вимкнено на reduced-motion.
 */
export function useParallax() {
  useEffect(() => {
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    let raf = 0, ticking = false;
    const els = () => Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    let nodes = els();
    const apply = () => {
      const vh = innerHeight;
      for (const el of nodes) {
        const speed = parseFloat(el.dataset.parallax || '0.12');
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      }
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; raf = requestAnimationFrame(apply); } };
    // Перечитуємо вузли після зміни маршруту/контенту
    const remap = () => { nodes = els(); apply(); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', remap, { passive: true });
    const t = setTimeout(remap, 100);
    apply();
    return () => { cancelAnimationFrame(raf); clearTimeout(t); removeEventListener('scroll', onScroll); removeEventListener('resize', remap); };
  });
}
