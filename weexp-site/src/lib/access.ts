/**
 * Access-коди для поглибленого аудиту (Крок 4) і Кроку 5.
 * Джерело правди — VITE_ACCESS_CODES (через кому) у деплой-оточенні. Якщо не
 * налаштовано — приймаємо лише вбудований DEFAULT (а НЕ будь-який WEEXP-XXX),
 * щоб перехід у глибоку роботу справді був «тільки за кодом».
 *
 * Зауваження: це клієнтський гейт (коди у бандлі). Він фільтрує вхід, але не є
 * криптозахистом — сувора перевірка має жити на бекенді (майбутній крок).
 */
const DEFAULT_CODES = ['WEEXP-DEEP-2026'];

const ENV_CODES = ((import.meta.env.VITE_ACCESS_CODES as string | undefined) || '')
  .split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

const CODES = ENV_CODES.length ? ENV_CODES : DEFAULT_CODES;

/** true лише для кодів зі списку (env або DEFAULT). Порожній / довільний — false. */
export function isValidCode(code: string): boolean {
  const u = (code || '').trim().toUpperCase();
  return !!u && CODES.includes(u);
}
