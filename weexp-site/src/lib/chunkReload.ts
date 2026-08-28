/**
 * Застарілий бандл після деплою — одне місце на весь застосунок.
 *
 * Після кожного деплою хеші lazy-чанків змінюються. У клієнта з відкритою
 * старою index.html перший перехід на lazy-маршрут тягне чанк зі старим
 * хешем → 404. Полагодити це повтором НЕМОЖЛИВО: файла більше немає, і
 * друга спроба дасть той самий 404. Єдиний вихід — перезавантажити сторінку,
 * щоб браузер узяв свіжу index.html з новими іменами.
 *
 * Раніше перевірка жила у трьох місцях трьома різними регулярками (main.tsx і
 * App.tsx — з різним покриттям), а межа помилки адмінки про неї взагалі не
 * знала: вона ловила збій першою, пропонувала «спробувати ще раз» і після
 * двох спроб писала «повторна спроба не допомогла». Людина бачила кнопку,
 * яка за побудовою не могла спрацювати.
 */

/** Чи це збій завантаження чанка (а не помилка в коді сторінки). */
export function isChunkLoadError(msg: unknown): boolean {
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk .* failed|error loading dynamically imported module|module script failed/i
    .test(String(msg ?? ''));
}

/**
 * Перезавантажити ОДИН раз. `key` розділяє лічильники різних місць виклику,
 * щоб перезавантаження з межі адмінки не гасило лічильник глобального
 * обробника й навпаки. Вікно 20 секунд захищає від циклу, якщо свіжа
 * index.html чомусь теж не дає робочого чанка.
 */
export function reloadOnceForChunk(msg: unknown, key = 'app'): boolean {
  if (!isChunkLoadError(msg)) return false;
  try {
    const k = `weexp-chunk-reload:${key}`;
    const now = Date.now();
    const last = Number(sessionStorage.getItem(k) || 0);
    if (now - last < 20_000) return false;   // нещодавно перезавантажувались — не циклимо
    sessionStorage.setItem(k, String(now));
    location.reload();
    return true;
  } catch { return false; }
}
