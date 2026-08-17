import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Повноекранний крок діагностики. Портал у <body> — щоб position:fixed рахувався
 * від вьюпорта, а не від трансформованих/липких предків калькулятора (через що
 * на мобільному крок відкривався «поверх» попереднього). Плюс блокування скролу
 * тла: попередній крок повністю прихований і не прокручується — step-by-step.
 */
export function StepOverlay({ children }: { children: ReactNode }) {
  useEffect(() => {
    const b = document.body;
    const prevOverflow = b.style.overflow;
    b.style.overflow = 'hidden';
    return () => { b.style.overflow = prevOverflow; };
  }, []);
  return createPortal(children, document.body);
}
