// Доступи КЛІЄНТІВ до сервісу ведення проєкту.
//
// Самореєстрації в сервісі немає: акаунт клієнта заводить менеджер із картки.
// Це не адміністративна забаганка — сервіс містить дані проєктів, і відкрита
// реєстрація означала б, що будь-хто з інтернету створює там акаунт.
//
// Чим це НЕ є: керуванням командою. Ролі staff живуть у /api/team і ставляться
// лише super-адміном. Тут не можна видати роль узагалі — див. гард нижче.
//
// Env: SUPABASE_URL (або VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
// Сервісний ключ живе ЛИШЕ тут, на сервері, і в бандл не потрапляє.

import { requireStaff, logServerEvent } from './_lib/auth.js';

const STAFF_ROLES = ['super', 'admin', 'manager', 'auditor'];

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const URL = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SRK) {
    res.status(200).json({ error: 'not_configured: додайте SUPABASE_SERVICE_ROLE_KEY у Vercel (Supabase → Settings → API → service_role)' });
    return;
  }

  // Заводити клієнта може будь-хто з команди — це щоденна операція менеджера,
  // а не привілей super. Роль при цьому не видається (див. нижче).
  const me = await requireStaff(req, res);
  if (!me) return;

  const b = req.body ?? {};
  const email = String(b.email || '').trim().toLowerCase();
  const redirectTo = typeof b.redirectTo === 'string' && /^https:\/\/[a-z0-9.-]+\/[^\s]*$/i.test(b.redirectTo)
    ? b.redirectTo : undefined;

  const admin = (path, opts = {}) => fetch(`${URL}/auth/v1/admin${path}`, {
    ...opts,
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'content-type': 'application/json', ...(opts.headers || {}) },
  });

  const findByEmail = async (want) => {
    if (!want) return null;
    const j = await admin('/users?per_page=200').then((r) => r.json()).catch(() => null);
    if (!j) return null;
    return (j.users || j || []).find((u) => String(u.email || '').toLowerCase() === want) || null;
  };

  /*
   * Головний гард: цей ендпоінт не має влади над акаунтами КОМАНДИ.
   *
   * Без нього менеджер міг би надіслати сюди пошту super-адміна і, залежно від
   * дії, поставити йому пароль або скинути його — тобто забрати найвищий
   * доступ, маючи найнижчий. Ендпоінт «про клієнтів» став би шляхом підвищення
   * привілеїв усередині команди.
   *
   * Перевіряємо роль ЦІЛІ за базою, а не за тим, що прислали в тілі запиту:
   * інакше гард перевіряв би одне, а дія працювала б над іншим.
   */
  const refuseIfStaff = (target) => {
    const role = target?.app_metadata?.role;
    if (role && STAFF_ROLES.includes(String(role))) {
      res.status(403).json({ error: 'forbidden: це акаунт команди — керується в розділі «Команда»' });
      return true;
    }
    return false;
  };

  const journal = (kind, detail) => logServerEvent(me.email, kind, { subject: email || b.userId || null, detail });

  try {
    const a = b.action;

    /* ── Запросити клієнта: лист із посиланням, пароль задає він сам ────── */
    if (a === 'invite') {
      if (!email) { res.status(200).json({ error: 'Вкажіть email' }); return; }
      const existing = await findByEmail(email);
      if (refuseIfStaff(existing)) return;
      if (existing) {
        res.status(200).json({ error: 'Такий акаунт уже існує — надішліть посилання на встановлення пароля' });
        return;
      }
      const j = await fetch(`${URL}/auth/v1/invite`, {
        method: 'POST',
        headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'content-type': 'application/json' },
        body: JSON.stringify(redirectTo ? { email, redirect_to: redirectTo } : { email }),
      }).then((r) => r.json()).catch(() => null);
      if (j?.id) {
        void journal('client_invite', `запрошено ${email}`);
        res.status(200).json({ ok: true, user: { id: j.id, email: j.email } });
      } else {
        res.status(200).json({ error: (j?.msg || j?.error_description || 'invite_failed') + ' — перевірте SMTP у Supabase' });
      }
      return;
    }

    /* ── Створити з паролем: коли пошта клієнта не приймає наші листи ───── */
    if (a === 'create') {
      if (!email) { res.status(200).json({ error: 'Вкажіть email' }); return; }
      if (String(b.password || '').length < 10) {
        // Довше за звичайні 8: цей пароль передається людині в переписці й
        // живе довше, ніж той, який людина придумує собі сама.
        res.status(200).json({ error: 'Пароль — мінімум 10 символів' });
        return;
      }
      const existing = await findByEmail(email);
      if (refuseIfStaff(existing)) return;
      if (existing) { res.status(200).json({ error: 'Такий акаунт уже існує' }); return; }
      const j = await admin('/users', {
        method: 'POST',
        // app_metadata НЕ передаємо взагалі: клієнт — це користувач БЕЗ ролі.
        // Порожній об'єкт теж не шлемо, щоб у полі не було на що спертись.
        body: JSON.stringify({ email, password: String(b.password), email_confirm: true }),
      }).then((r) => r.json()).catch(() => null);
      if (j?.id) {
        void journal('client_create', `створено ${email}`);
        res.status(200).json({ ok: true, user: { id: j.id, email: j.email } });
      } else {
        res.status(200).json({ error: j?.msg || j?.error_description || j?.error || 'create_failed' });
      }
      return;
    }

    /* ── Надіслати посилання на встановлення / зміну пароля ─────────────── */
    if (a === 'reset') {
      if (!email) { res.status(200).json({ error: 'Вкажіть email' }); return; }
      const existing = await findByEmail(email);
      if (refuseIfStaff(existing)) return;
      if (!existing) { res.status(200).json({ error: 'Такого акаунта немає — спершу запросіть клієнта' }); return; }
      const j = await fetch(`${URL}/auth/v1/recover`, {
        method: 'POST',
        headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'content-type': 'application/json' },
        body: JSON.stringify(redirectTo ? { email, redirect_to: redirectTo } : { email }),
      }).then((r) => (r.ok ? { ok: true } : r.json())).catch(() => null);
      if (j?.ok) {
        void journal('client_reset', `надіслано лист зміни пароля ${email}`);
        res.status(200).json({ ok: true });
      } else {
        res.status(200).json({ error: (j?.msg || j?.error_description || 'reset_failed') + ' — перевірте SMTP у Supabase' });
      }
      return;
    }

    /* ── Забрати доступ: бан замість видалення ─────────────────────────── */
    if (a === 'revoke' || a === 'restore') {
      if (!email) { res.status(200).json({ error: 'Вкажіть email' }); return; }
      const existing = await findByEmail(email);
      if (refuseIfStaff(existing)) return;
      if (!existing) { res.status(200).json({ error: 'Такого акаунта немає' }); return; }
      /*
       * Бан, а не видалення: дані проєкту звʼязані з user_id. Видалення
       * акаунта лишило б їх без власника — а це саме той запис, заради якого
       * велася робота. Доступ забирається, історія лишається.
       */
      // 876000h ≈ 100 років: Supabase приймає тривалість, а не дату.
      const j = await admin(`/users/${existing.id}`, { method: 'PUT', body: JSON.stringify({ ban_duration: a === 'revoke' ? '876000h' : 'none' }) })
        .then((r) => r.json()).catch(() => null);
      if (j?.id) {
        void journal(a === 'revoke' ? 'client_revoke' : 'client_restore', `${email}`);
        res.status(200).json({ ok: true, banned: a === 'revoke' });
      } else {
        res.status(200).json({ error: j?.msg || j?.error_description || 'update_failed' });
      }
      return;
    }

    /* ── Стан доступу одного клієнта ────────────────────────────────────── */
    if (a === 'status') {
      if (!email) { res.status(200).json({ error: 'Вкажіть email' }); return; }
      const u = await findByEmail(email);
      if (!u) { res.status(200).json({ ok: true, exists: false }); return; }
      // Роль повертаємо лише як ознаку «це команда» — без деталей.
      const staff = !!u.app_metadata?.role && STAFF_ROLES.includes(String(u.app_metadata.role));
      res.status(200).json({
        ok: true, exists: true, staff,
        confirmed: !!u.email_confirmed_at,
        banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
        lastSignIn: u.last_sign_in_at || null,
      });
      return;
    }

    res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
