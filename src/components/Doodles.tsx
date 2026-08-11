// Рисованные дудлы для мем-постерного стиля (референс agency meme).
// Тонкие «от руки» контуры: ракета, стрелки, звезда, спарк, каракуль-подчёрк.
import type { CSSProperties } from 'react';

type D = { className?: string; style?: CSSProperties; color?: string };

export const Rocket = ({ className, style, color = '#111' }: D) => (
  <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke={color} strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden>
    <path d="M24 4c7 4 10 12 9 22l-4 5h-10l-4-5C14 16 17 8 24 4Z" />
    <circle cx="24" cy="19" r="3.4" />
    <path d="M15 31c-3 1-5 4-5 9 4-1 7-2 8-4M33 31c3 1 5 4 5 9-4-1-7-2-8-4M24 36v6" />
  </svg>
);

export const ArrowUp = ({ className, style, color = '#4D7C0F' }: D) => (
  <svg viewBox="0 0 56 40" width="56" height="40" fill="none" stroke={color} strokeWidth="2.6"
    strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden>
    <path d="M4 34C14 30 22 20 30 8" />
    <path d="M22 8h9v9" />
  </svg>
);

export const Star = ({ className, style, color = '#FFD100' }: D) => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill={color} stroke="#111" strokeWidth="1.6"
    strokeLinejoin="round" className={className} style={style} aria-hidden>
    <path d="M16 3l3.4 8.2 8.9.7-6.8 5.8 2.1 8.7L16 21.9 8.4 26.4l2.1-8.7-6.8-5.8 8.9-.7L16 3Z" />
  </svg>
);

export const Spark = ({ className, style, color = '#111' }: D) => (
  <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke={color} strokeWidth="2.4"
    strokeLinecap="round" className={className} style={style} aria-hidden>
    <path d="M14 2v7M14 19v7M2 14h7M19 14h7M5 5l4 4M19 19l4 4M23 5l-4 4M9 19l-4 4" />
  </svg>
);

export const Scribble = ({ className, style, color = '#A3E635' }: D) => (
  <svg viewBox="0 0 140 16" width="140" height="16" fill="none" stroke={color} strokeWidth="5"
    strokeLinecap="round" className={className} style={style} aria-hidden>
    <path d="M4 11C28 4 44 4 68 9s44 5 68-2" />
  </svg>
);

export const Megaphone = ({ className, style, color = '#111' }: D) => (
  <svg viewBox="0 0 44 40" width="44" height="40" fill="none" stroke={color} strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden>
    <path d="M6 16v8l6 1 3 9h4l-2-8 17 6V9L19 15H9a3 3 0 0 0-3 1Z" />
    <path d="M37 15c3 1 3 8 0 10" />
  </svg>
);
