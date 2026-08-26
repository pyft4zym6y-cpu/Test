import { useEffect, useState } from 'react';

/**
 * Чи варто уникати важкого декоративного 3D (WebGL/three.js) на цьому пристрої.
 * Повертає true, коли фон краще показати легким CSS-градієнтом, а не WebGL:
 *  — це сенсорний пристрій (телефон/планшет);
 *  — користувач увімкнув Save-Data;
 *  — мало памʼяті (deviceMemory ≤ 4 ГБ) або мало ядер (≤ 4);
 *  — prefers-reduced-motion.
 *
 * Про сенсорні окремо. Евристика «мало памʼяті або ядер» на iPhone не працює
 * зовсім: Safari не віддає deviceMemory, а ядер там 6 — тобто на телефоні за
 * формою заявки крутилась повноекранна WebGL-сцена. Ціна: постійна робота GPU
 * під час набору тексту й стрибки скролу, коли клавіатура змінює висоту
 * viewport під `position: fixed; height: 100vh`. Декоративний фон того не
 * вартий на жодному телефоні, навіть потужному.
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
      const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
      setLite(touch || saveData || reduce || (lowMem && fewCores));
    } catch { /* залишаємо false */ }
  }, []);
  return lite;
}
