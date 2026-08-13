/**
 * Motion system WEEXP — спільний рушій «просторових» сцен.
 *
 * Замість PAGE = BLOCK + BLOCK сторінка будується як
 * EXPERIENCE → SCENES → STATES: одна закріплена сцена, крізь яку
 * відвідувач «рухається» скролом. Тут живе лише механіка (scroll-driver +
 * огинаючі акти + reduced-motion). Хореографію кожна сцена задає сама
 * в onFrame(p) — це і є «повторюваний UX-патерн».
 */
import { useEffect } from 'react';

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Нормалізує p у 0..1 на відрізку [s,e]. */
export const band = (p: number, s: number, e: number) => clamp((p - s) / (e - s), 0, 1);

/**
 * Огинаюча акту: тане всередину a→b, тримається b→c, тане назовні c→d.
 * Сусідні акти стикуються (out одного = in наступного), тож у кадрі
 * домінує рівно одна сцена — без «блочних» стиків.
 */
export const seg = (p: number, a: number, b: number, c: number, d: number) =>
  p < a || p > d ? 0 : p < b ? (p - a) / (b - a) : p > c ? (d - p) / (d - c) : 1;

/** Прогрес сцени: 0 коли верх секції торкнувся верху вікна, 1 — коли низ. */
export function sceneProgress(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const total = el.offsetHeight - innerHeight;
  return total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
}

/**
 * Підписує сцену на скрол. onFrame(p, reduce) викликається у rAF на кожен
 * рух — пише стилі напряму (без React-стану на кадр). Повертає нічого;
 * прибирання — автоматичне. За prefers-reduced-motion передає reduce=true,
 * але все одно кличе onFrame раз (щоб виставити фінальний стан).
 */
export function useScrollScene(
  ref: React.RefObject<HTMLElement | null>,
  onFrame: (p: number, reduce: boolean) => void,
): void {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    let raf = 0, ticking = false;
    const frame = () => {
      ticking = false;
      const el = ref.current; if (!el) return;
      onFrame(reduce ? 1 : sceneProgress(el), reduce);
    };
    const onScroll = () => { if (!ticking) { ticking = true; raf = requestAnimationFrame(frame); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    frame();
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); };
    // onFrame стабільна за домовленістю (визначена в тілі компонента без залежностей)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Дрібний хелпер: виставити opacity (+ optional transform) елементу. */
export const setLayer = (el: HTMLElement | null, o: number, tf?: string) => {
  if (!el) return;
  el.style.opacity = String(o);
  if (tf !== undefined) el.style.transform = tf;
};
