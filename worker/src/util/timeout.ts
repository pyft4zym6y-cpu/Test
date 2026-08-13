/**
 * Спільні охоронці часу для воркера аудиту. Жоден крок не має вішати весь
 * прогін: завислий проміс перетворюється на швидку помилку, яку ловить крок.
 */

/** Жорсткий таймаут поверх будь-якого проміса. Кидає Error при перевищенні. */
export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Таймаут ${Math.round(ms / 1000)}с: ${label}`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/** М'який дедлайн прогону: керує пропуском важких необов'язкових кроків. */
export function makeDeadline(maxMinutes: number): { exceeded: () => boolean; left: () => number } {
  const end = Date.now() + Math.max(1, maxMinutes) * 60_000;
  return { exceeded: () => Date.now() > end, left: () => Math.max(0, Math.round((end - Date.now()) / 1000)) };
}
