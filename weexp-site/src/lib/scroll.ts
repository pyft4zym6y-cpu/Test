/** Плавный переход к секции по id (через Lenis, с фолбэком). Общий для Nav и Footer. */
export function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const l = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__lenis;
  if (l) l.scrollTo(el, { offset: -20 });
  else el.scrollIntoView({ behavior: 'smooth' });
}
