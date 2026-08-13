// Vercel serverless (сайт weexp.agency): управление логинами/паролями брифа.
// Вызывается ТОЛЬКО админом портала (проверяем JWT → members.is_admin).
// Действия: create (создать пользователя с паролем), set_password (сменить),
// delete (удалить пользователя auth — вход закрыт немедленно).
// Env: SUPABASE_URL (или VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SRK) {
    res.status(200).json({ error: 'Не настроено: добавьте SUPABASE_SERVICE_ROLE_KEY в Vercel (Supabase → Settings → API → service_role).' });
    return;
  }
  const admin = { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json' };

  // 1) Кто зовёт? Проверяем токен пользователя и флаг is_admin в members.
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Нет токена' });
    return;
  }
  try {
    const uRes = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: SRK, Authorization: `Bearer ${token}` } });
    const u = await uRes.json();
    const callerEmail = (u?.email || '').toLowerCase();
    if (!callerEmail) {
      res.status(401).json({ error: 'Сессия не распознана — перезайдите' });
      return;
    }
    const mRes = await fetch(`${URL}/rest/v1/members?email=eq.${encodeURIComponent(callerEmail)}&select=is_admin`, { headers: admin });
    const m = await mRes.json();
    if (!Array.isArray(m) || !m[0]?.is_admin) {
      res.status(403).json({ error: 'Только для администраторов' });
      return;
    }

    const { action, email, password } = req.body ?? {};
    const em = String(email || '').trim().toLowerCase();
    if (!em) {
      res.status(400).json({ error: 'Нужен email' });
      return;
    }

    const findUser = async () => {
      const r = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=50&filter=${encodeURIComponent(em)}`, { headers: admin });
      const j = await r.json();
      return (j.users ?? []).find((x) => (x.email || '').toLowerCase() === em) ?? null;
    };

    if (action === 'create') {
      if (!password || String(password).length < 8) {
        res.status(400).json({ error: 'Пароль: минимум 8 символов' });
        return;
      }
      const existing = await findUser();
      if (existing) {
        // пользователь уже есть (например, входил по magic-link) — просто ставим пароль
        const r = await fetch(`${URL}/auth/v1/admin/users/${existing.id}`, { method: 'PUT', headers: admin, body: JSON.stringify({ password }) });
        const j = await r.json();
        res.status(200).json(j.id ? { ok: true, note: 'Пользователь уже существовал — пароль обновлён' } : { error: j.msg || j.message || 'update_failed' });
        return;
      }
      const r = await fetch(`${URL}/auth/v1/admin/users`, {
        method: 'POST', headers: admin,
        body: JSON.stringify({ email: em, password, email_confirm: true }),
      });
      const j = await r.json();
      res.status(200).json(j.id ? { ok: true } : { error: j.msg || j.message || 'create_failed' });
      return;
    }

    if (action === 'set_password') {
      if (!password || String(password).length < 8) {
        res.status(400).json({ error: 'Пароль: минимум 8 символов' });
        return;
      }
      const user = await findUser();
      if (!user) {
        res.status(200).json({ error: 'Пользователь не найден — сначала создайте доступ' });
        return;
      }
      const r = await fetch(`${URL}/auth/v1/admin/users/${user.id}`, { method: 'PUT', headers: admin, body: JSON.stringify({ password }) });
      const j = await r.json();
      res.status(200).json(j.id ? { ok: true } : { error: j.msg || j.message || 'update_failed' });
      return;
    }

    if (action === 'delete') {
      const user = await findUser();
      if (!user) {
        res.status(200).json({ ok: true, note: 'Пользователя в auth уже нет' });
        return;
      }
      const r = await fetch(`${URL}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers: admin });
      res.status(200).json(r.ok ? { ok: true } : { error: `delete_failed (${r.status})` });
      return;
    }

    res.status(400).json({ error: 'Неизвестное действие' });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 160) });
  }
}
