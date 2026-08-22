import { useEffect, useState } from 'react';

/**
 * Чи варто уникати важкого декоративного 3D (WebGL/three.js) на цьому пристрої.
 * Повертає true, коли фон краще показати легким CSS-градієнтом, а не WebGL:
 *  — користувач увімкнув Save-Data;
 *  — мало памʼяті (deviceMemory ≤ 4 ГБ) або мало ядер (≤ 4);
 *  — prefers-reduced-motion.
 * Це стосується ЛИШЕ декоративних фонів (калькулятор, контакт, люди) — там 3D
 * не несе контенту. Скрол-фільми головної лишаються 3D (там обʼєкт — це і є суть).
 * Ефект: на слабкому мобільному ці сторінки взагалі не тягнуть ~474 КБ three.js.
 *
 * SSR/prerender-безпечно: до маунта повертаємо false (десктоп-дефолт), рішення
 * уточнюється в useEffect уже в браузері.
 */
export function useLiteVisuals(): boolean {
  const [lite, setLite] = useState(false);
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
      const saveData = !!nav.connection?.saveData;
      const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
      const fewCores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setLite(saveData || reduce || (lowMem && fewCores));
    } catch { /* залишаємо false */ }
  }, []);
  return lite;
}
