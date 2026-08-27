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
 * Ліміт частоти. true — пропускаємо, false — забагато.
 * Лічильник у Postgres: у serverless памʼятний лічильник у кожного інстансу
 * свій, тобто ліміту фактично не існує.
 */
export async function rateOk(req, bucket, limit = 10, windowSeconds = 3600, key = null) {
  const URL_BASE = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL_BASE || !KEY) return true;          // не налаштовано — не блокуємо
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/rpc/weexp_rate_ok`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_bucket: bucket, p_key: key || clientIp(req), p_limit: limit, p_window_seconds: windowSeconds }),
    });
    if (!r.ok) return true;                     // міграція ще не застосована
    return (await r.json()) !== false;
  } catch { return true; }
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
