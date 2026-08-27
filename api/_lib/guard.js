// Захист відкритих форм: ліміт частоти + Cloudflare Turnstile.
//
// Обидва вмикаються НАЯВНІСТЮ налаштувань і мовчки пропускають запит, якщо їх
// немає. Так код можна викотити до того, як заведені ключі, нічого не зламавши,
// а захист вмикається додаванням змінних оточення.
//
// Env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (лічильник), TURNSTILE_SECRET.

/** IP відвідувача за заголовками Vercel. */
export function clientIp(req) {
  const xf = String(req.headers?.['x-forwarded-for'] || '');
  return (xf.split(',')[0] || req.headers?.['x-real-ip'] || 'unknown').toString().trim().slice(0, 60);
}

/**
 * Стан лічильника з останнього виклику. Три випадки, які до цього були
 * нерозрізнимі: 'off' — не налаштовано; 'degraded' — налаштовано, але RPC не
 * відповідає (міграція не застосована, база лягла); 'on' — працює.
 * Читається GET /api/notify (для команди), щоб «ліміт мовчки не працює»
 * було видно не тільки в логах Vercel.
 */
export const limiterState = { mode: 'unknown', reason: '', at: 0 };
const seen = new Set();
/** Один рядок у лог на кожну НОВУ причину — щоб не засмічувати, але й не мовчати. */
function note(mode, reason) {
  limiterState.mode = mode;
  limiterState.reason = reason;
  limiterState.at = Date.now();
  const k = `${mode}:${reason}`;
  if (mode === 'on' || seen.has(k)) return;
  seen.add(k);
  console.warn(`[rate-limit] ${mode}: ${reason} — запити пропускаються без обмеження`);
}

/**
 * Ліміт частоти. true — пропускаємо, false — забагато.
 * Лічильник у Postgres: у serverless памʼятний лічильник у кожного інстансу
 * свій, тобто ліміту фактично не існує.
 */
export async function rateOk(req, bucket, limit = 10, windowSeconds = 3600, key = null) {
  const URL_BASE = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  /*
   * Пропускаємо запит на КОЖНОМУ збої — і це правильно: зламана форма гірша за
   * пропущений ліміт. Неправильним було інше — робити це мовчки. Три різні
   * стани («не налаштовано», «міграція не застосована», «база не відповіла»)
   * виглядали ззовні однаково: як дозвіл. Шість ендпоінтів спираються на цю
   * функцію, чотири з них бережуть не спокій, а рахунок — ключ Anthropic,
   * прогін Playwright на Railway, квоту Google. Дізнатися, що лічильник не
   * працює жодного дня, не було з чого.
   */
  if (!URL_BASE || !KEY) { note('off', 'немає SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); return true; }
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/rpc/weexp_rate_ok`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_bucket: bucket, p_key: key || clientIp(req), p_limit: limit, p_window_seconds: windowSeconds }),
    });
    if (!r.ok) {
      note('degraded', r.status === 404
        ? 'RPC weexp_rate_ok не знайдено — застосуйте docs/rate-limit.sql'
        : `RPC відповів HTTP ${r.status}`);
      return true;
    }
    note('on', '');
    return (await r.json()) !== false;
  } catch (e) {
    note('degraded', `RPC недоступний: ${String(e).slice(0, 80)}`);
    return true;
  }
}

/**
 * Ліміт для ЗАКРИТИХ ручок команди. Відрізняється від відкритих форм двома речами.
 *
 * По-перше, ключем іде id користувача, а не IP: команда сидить за спільним
 * офісним IP чи VPN, і ліміт по IP або блокує всіх разом, або не блокує нікого.
 *
 * По-друге, тут захищають не від спаму, а від рахунку: `ai-draft` і `aqc` палять
 * ключ Anthropic, `audit-run start` піднімає Playwright-прогін на Railway,
 * `ga4 pull` витрачає квоту Google. Автентифікація каже, ХТО прийшов, але не
 * скільки разів — залипла кнопка чи скомпрометована сесія співробітника
 * витрачає бюджет за ніч, і жодна перевірка ролі цього не помітить.
 *
 * Повертає true, якщо запит треба ВІДХИЛИТИ (відповідь 429 уже надіслана).
 */
export async function staffRateLimited(req, res, caller, bucket, limit, windowSeconds = 3600) {
  const key = caller?.id || caller?.email || clientIp(req);
  if (await rateOk(req, bucket, limit, windowSeconds, key)) return false;
  const mins = Math.max(1, Math.round(windowSeconds / 60));
  res.status(429).json({
    error: `Забагато запитів: ліміт ${limit} за ${mins} хв. Це захист від випадкового перевитрату бюджету — спробуйте за кілька хвилин або напишіть, якщо ліміт замалий для роботи.`,
  });
  return true;
}

/**
 * Перевірка токена Cloudflare Turnstile. Без TURNSTILE_SECRET — пропускаємо
 * (щоб форми не зламались до налаштування).
 */
export async function turnstileOk(req, token) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true;
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: String(token).slice(0, 3000), remoteip: clientIp(req) }),
    });
    const j = await r.json();
    return Boolean(j.success);
  } catch { return false; }   // не змогли перевірити — не пропускаємо
}
