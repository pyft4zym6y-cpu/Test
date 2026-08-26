// Vercel serverless: API міні-CRM адмінки (/admin).
// Дії: login | list | update. Заявки зберігаються в Supabase (таблиця leads).
// Env: ADMIN_LOGIN / ADMIN_PASSWORD — доступ до адмінки (є демо-дефолти,
//        на проді змініть через змінні оточення Vercel);
//      SUPABASE_URL + SUPABASE_SERVICE_KEY — підключення бази. Без них
//        API відповідає not_configured, а фронт працює в демо-режимі.
import { createHmac, timingSafeEqual } from 'node:crypto';

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'school2026';

function makeToken() {
  return createHmac('sha256', `${ADMIN_LOGIN}:${ADMIN_PASSWORD}`)
    .update('admin-session-v1')
    .digest('hex');
}

function safeEq(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

async function sb(path, init = {}) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return r;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const b = req.body ?? {};
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

  if (b.action === 'login') {
    if (safeEq(b.login, ADMIN_LOGIN) && safeEq(b.password, ADMIN_PASSWORD)) {
      res.status(200).json({ token: makeToken(), configured });
    } else {
      res.status(401).json({ error: 'Невірний логін або пароль' });
    }
    return;
  }

  // решта дій — лише з токеном
  if (!b.token || !safeEq(b.token, makeToken())) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  if (!configured) {
    res.status(200).json({ error: 'not_configured' });
    return;
  }

  try {
    if (b.action === 'list') {
      const r = await sb('leads?select=*&order=created_at.desc&limit=500');
      const leads = await r.json();
      res.status(200).json(r.ok ? { leads } : { error: leads.message || 'db_error' });
      return;
    }
    if (b.action === 'update') {
      const patch = {};
      if (typeof b.status === 'string') patch.status = b.status.slice(0, 30);
      if (typeof b.note === 'string') patch.note = b.note.slice(0, 2000);
      const r = await sb(`leads?id=eq.${encodeURIComponent(b.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(patch),
      });
      res.status(200).json(r.ok ? { ok: true } : { error: 'db_error' });
      return;
    }
    res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 160) });
  }
}
