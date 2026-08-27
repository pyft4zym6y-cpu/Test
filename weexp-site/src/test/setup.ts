import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Спільне оточення компонентних тестів.
 *
 * jsdom не реалізує частину браузерних API, на які адмінка спирається щодня:
 * без `matchMedia` падає визначення lite-режиму, без `IntersectionObserver` —
 * будь-яка поява блоку при скролі, без `scrollTo` — перехід між вкладками.
 * Це не «моки заради моків»: без них тест падає не на логіці панелі, а на
 * відсутньому браузері, і такий провал нічого не каже про код.
 */

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

class NoopObserver {
  observe() {} unobserve() {} disconnect() {} takeRecords() { return []; }
}
if (!('IntersectionObserver' in window)) {
  (window as unknown as Record<string, unknown>).IntersectionObserver = NoopObserver;
}
if (!('ResizeObserver' in window)) {
  (window as unknown as Record<string, unknown>).ResizeObserver = NoopObserver;
}
if (!window.scrollTo) window.scrollTo = (() => {}) as typeof window.scrollTo;

// Clipboard: панелі копіюють коди й помилки. jsdom його не дає.
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn().mockResolvedValue('') },
    configurable: true,
  });
}

afterEach(() => cleanup());
