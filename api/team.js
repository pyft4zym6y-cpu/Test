// Керування командою (адміністраторами) через Supabase Auth Admin API.
// Ролі зберігаються в app_metadata.role кожного користувача (source of truth).
// Викликати може ЛИШЕ super-admin: перевіряємо токен викликача сервером.
// Env: SUPABASE_URL (або VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
//
// ВАЖЛИВО: service-role ключ живе лише тут (сервер), у клієнт не потрапляє.

const SUPERS = ['pashasidorenko18@gmail.com', 'hello@weexp.agency']; // бутстрап — щоб не залочити себе
const ROLES = ['super', 'admin', 'manager', 'auditor'];

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SRK) { res.status(200).json({ error: 'not_configured: додайте SUPABASE_SERVICE_ROLE_KEY у Vercel (Supabase → Settings → API → service_role)' }); return; }

  const b = req.body ?? {};
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) { res.status(401).json({ error: 'no_token' }); return; }

  // 1) Перевіряємо, хто викликає — за його access-токеном.
  const me = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: SRK, Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const myEmail = String(me?.email || '').toLowerCase();
  const myRole = me?.app_metadata?.role;
  const isSuper = !!me && (myRole === 'super' || SUPERS.includes(myEmail));
  if (!isSuper) { res.status(403).json({ error: 'forbidden: доступ лише для Super Admin' }); return; }

  const admin = (path, opts = {}) => fetch(`${URL}/auth/v1/admin${path}`, {
    ...opts,
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  const setRole = (userId, role) => admin(`/users/${userId}`, { method: 'PUT', body: JSON.stringify({ app_metadata: { role } }) });
  const valid = (r) => ROLES.includes(r);

  try {
    const a = b.action;

    if (a === 'list') {
      const j = await admin('/users?per_page=200').then((r) => r.json());
      const arr = j.users || j || [];
      const users = arr.map((u) => ({
        id: u.id, email: u.email,
        role: u.app_metadata?.role || null,
        banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
        lastSignIn: u.last_sign_in_at || null, createdAt: u.created_at || null,
        confirmed: !!u.email_confirmed_at,
      })).filter((u) => u.role); // показуємо лише членів команди (з роллю)
      res.status(200).json({ ok: true, users });
      return;
    }

    if (a === 'create') {
      if (!b.email || !b.password || String(b.password).length < 8) { res.status(200).json({ error: 'Потрібні email і пароль (мін. 8 символів)' }); return; }
      const role = valid(b.role) ? b.role : 'manager';
      const j = await admin('/users', { method: 'POST', body: JSON.stringify({ email: b.email, password: b.password, email_confirm: true, app_metadata: { role } }) }).then((r) => r.json());
      if (j.id) res.status(200).json({ ok: true, user: { id: j.id, email: j.email, role } });
      else res.status(200).json({ error: j.msg || j.error_description || j.error || 'create_failed' });
      return;
    }

    if (a === 'invite') {
      const role = valid(b.role) ? b.role : 'manager';
      // Інвайт-лист (потрібен налаштований SMTP у Supabase). Роль ставимо в app_metadata після створення.
      const j = await fetch(`${URL}/auth/v1/invite`, { method: 'POST', headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'content-type': 'application/json' }, body: JSON.stringify({ email: b.email }) })
        .then((r) => r.json());
      if (j.id) { await setRole(j.id, role); res.status(200).json({ ok: true, user: { id: j.id, email: j.email, role } }); }
      else res.status(200).json({ error: (j.msg || j.error_description || 'invite_failed') + ' (перевірте SMTP у Supabase)' });
      return;
    }

    if (a === 'set_role') {
      if (!b.userId || !valid(b.role)) { res.status(200).json({ error: 'bad_params' }); return; }
      if (SUPERS.includes(String(b.email || '').toLowerCase()) && b.role !== 'super') { res.status(200).json({ error: 'Не можна знизити бутстрап-super-адміна' }); return; }
      const r = await setRole(b.userId, b.role);
      res.status(200).json(r.ok ? { ok: true } : { error: 'set_role_failed' });
      return;
    }

    if (a === 'ban') {
      if (!b.userId) { res.status(200).json({ error: 'bad_params' }); return; }
      const r = await admin(`/users/${b.userId}`, { method: 'PUT', body: JSON.stringify({ ban_duration: b.banned ? '876000h' : 'none' }) });
      res.status(200).json(r.ok ? { ok: true } : { error: 'ban_failed' });
      return;
    }

    if (a === 'reset') {
      // Лист відновлення пароля (потрібен SMTP). Без сервіс-ролі — публічний recover.
      const r = await fetch(`${URL}/auth/v1/recover`, { method: 'POST', headers: { apikey: SRK, 'content-type': 'application/json' }, body: JSON.stringify({ email: b.email }) });
      res.status(200).json(r.ok ? { ok: true } : { error: 'reset_failed (перевірте SMTP)' });
      return;
    }

    if (a === 'remove') {
      if (!b.userId) { res.status(200).json({ error: 'bad_params' }); return; }
      if (SUPERS.includes(String(b.email || '').toLowerCase())) { res.status(200).json({ error: 'Не можна видалити бутстрап-super-адміна' }); return; }
      const r = await admin(`/users/${b.userId}`, { method: 'DELETE' });
      res.status(200).json(r.ok ? { ok: true } : { error: 'remove_failed' });
      return;
    }

    res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    res.status(200).json({ error: String(e) });
  }
}
