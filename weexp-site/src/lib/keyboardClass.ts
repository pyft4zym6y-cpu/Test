import { useEffect } from 'react';

/**
 * Позначає `<body>` класом `kb-open`, поки на сенсорному пристрої відкрита
 * екранна клавіатура.
 *
 * Навіщо. На iOS `position: fixed` прив'язується до ВІЗУАЛЬНОГО viewport, тому
 * нижня app-панель під час набору тексту переїжджає нагору й сідає просто на
 * клавіатуру — закриваючи поля форми, які людина в цю мить заповнює. Плюс той
 * самий стрибок висоти смикає скрол сторінки.
 *
 * Визначаємо не «клавіатура», а «фокус у полі вводу» — це надійніше за
 * порівняння висот viewport, яке бреше при повороті екрана й при появі панелі
 * автозаповнення. visualViewport використовуємо як підтвердження, якщо він є.
 */
const isField = (el: Element | null): boolean =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);

export function useKeyboardClass(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    const set = (on: boolean) => document.body.classList.toggle('kb-open', on);
    const onFocusIn = (e: FocusEvent) => { if (isField(e.target as Element)) set(true); };
    const onFocusOut = () => {
      // Перехід між полями: не блимаємо класом — перевіряємо в наступному кадрі.
      setTimeout(() => set(isField(document.activeElement)), 60);
    };
    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('focusout', onFocusOut);
      document.body.classList.remove('kb-open');
    };
  }, []);
}
