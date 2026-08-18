import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Повноекранний крок діагностики. Портал у <body> — щоб position:fixed рахувався
 * від вьюпорта, а не від трансформованих/липких предків калькулятора.
 *
 * Надійне блокування скролу тла (важливо для iOS, де body{overflow:hidden} НЕ
 * фіксує сторінку — вона «пливе»): фіксуємо сам body через position:fixed зі
 * збереженням позиції. Лічильник lockCount коректно тримає блок при вкладених
 * оверлеях (Крок 4 → Крок 5) і знімає його лише коли закрито останній.
 */
let lockCount = 0;
let savedY = 0;

function lock() {
  if (lockCount === 0) {
    savedY = window.scrollY || window.pageYOffset || 0;
    const b = document.body.style;
    b.position = 'fixed';
    b.top = `-${savedY}px`;
    b.left = '0';
    b.right = '0';
    b.width = '100%';
    b.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
  }
  lockCount++;
}
function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const b = document.body.style;
    b.position = '';
    b.top = '';
    b.left = '';
    b.right = '';
    b.width = '';
    b.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
    window.scrollTo(0, savedY);
  }
}

export function StepOverlay({ children }: { children: ReactNode }) {
  useEffect(() => {
    lock();
    return unlock;
  }, []);
  return createPortal(children, document.body);
}
