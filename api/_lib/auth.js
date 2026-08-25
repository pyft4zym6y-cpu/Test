// Хто саме зве ендпоінт. Джерело правди — Supabase: access-токен → користувач,
// роль із app_metadata.role (її ставить /api/team), бутстрап-супери — списком,
// як у team.js. Тримається на сервері: підмінити роль з UI не можна.
//
// Навіщо: ендпоінти, що витрачають гроші (Claude, прогін воркера), до цього
// приймали будь-який запит з інтернету.
const SUPERS = String(process.env.MANAGER_EMAILS || 'pashasidorenko18@gmail.com,hello@weexp.agency')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const STAFF_ROLES = ['super', 'admin', 'manager', 'auditor'];

const base = () => String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

/** Повертає { email, role } або null, якщо токена немає / він недійсний. */
export async function caller(req) {
  const URL = base();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const token = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
  if (!URL || !key || !token) return null;
  try {
    const r = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const u = await r.json();
    const email = String(u?.email || '').toLowerCase();
    if (!email) return null;
    const role = u?.app_metadata?.role || (SUPERS.includes(email) ? 'super' : null);
    return { email, role };
  } catch {
    return null;
  }
}

/** Будь-який автентифікований користувач (зокрема клієнт кабінету). */
export async function requireUser(req, res) {
  const c = await caller(req);
  if (!c) { res.status(401).json({ error: 'unauthorized: потрібен вхід' }); return null; }
  return c;
}

/** Лише команда weexp (super/admin/manager/auditor). */
export async function requireStaff(req, res) {
  const c = await caller(req);
  if (!c) { res.status(401).json({ error: 'unauthorized: потрібен вхід' }); return null; }
  if (!STAFF_ROLES.includes(String(c.role))) { res.status(403).json({ error: 'forbidden: доступ лише для команди' }); return null; }
  return c;
}
