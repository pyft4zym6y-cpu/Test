/**
 * Шина озвучки агента (переиздание speech.ts старого сайта). Любой элемент вызывает
 * say(text) на hover/click/скролле — агент проговаривает. sayIdle() возвращает дефолт.
 */
export const IDLE = 'WEEXP·OS · online. Гортайте — система збирається.';

export function say(text: string) {
  window.dispatchEvent(new CustomEvent('weexp-say', { detail: text }));
}
export function sayIdle() {
  window.dispatchEvent(new CustomEvent('weexp-idle'));
}
