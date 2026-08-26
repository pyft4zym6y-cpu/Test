// Vercel serverless (сайт weexp.agency): приём лидов — контактная форма и
// результат Business X-Ray / повної діагностики. Письмо уходит консультанту
// через Resend; reply-to = адрес лида, чтобы отвечать в один клик.
// Env: RESEND_API_KEY (обязателен); NOTIFY_EMAIL / NOTIFY_FROM — опционально.
const DEFAULT_NOTIFY_EMAIL = 'pashasidorenko18@gmail.com';

// Запись лида в Supabase (REST, service-role) — ЭТО и есть «заявка в системе»,
// которую видит админка /admin. Требует env SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Возвращает true при успешной записи, false при отсутствии env или ошибке.
async function saveLeadToDb(row) {
  // Той самий набір env, що й у team.js (який уже працює): приймаємо і VITE_-варіант,
  // інакше з VITE_SUPABASE_URL заявки тихо не зберігались, хоч команда працює.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const base = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const post = async (payload) => {
    const r = await fetch(`${base}/rest/v1/leads`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
    });
    return r.ok ? { ok: true } : { ok: false, status: r.status, body: await r.text().catch(() => '') };
  };
  try {
    // 1) Повна вставка з усіма полями.
    const full = await post(row);
    if (full.ok) return true;
    // 2) Якщо таблиця у старішій формі й бракує колонок (PostgREST 400/PGRST204),
    //    не втрачаємо заявку — пишемо гарантований мінімум ядра. Так адмінка
    //    отримає лід навіть без міграції leads.sql.
    const CORE = ['source', 'email', 'phone', 'name', 'comment', 'status'];
    const minimal = {};
    for (const k of CORE) if (row[k] != null) minimal[k] = row[k];
    // Додаткові поля (роль/задача/бюджет тощо) складаємо у comment, щоб не втратити.
    const EXTRA = { role: 'Роль', store: 'Магазин', site: 'Сайт', turnover: 'Оборот', task: 'Задача', timeline: 'Терміни', budget: 'Бюджет' };
    const tail = Object.entries(EXTRA).filter(([k]) => row[k]).map(([k, lbl]) => `${lbl}: ${row[k]}`).join(' · ');
    if (tail) minimal.comment = [minimal.comment, tail].filter(Boolean).join(' — ');
    if (row.diag) minimal.comment = [minimal.comment, `\n${row.diag}`].filter(Boolean).join('');
    const fb = await post(minimal);
    return fb.ok;
  } catch {
    return false;
  }
}

import { rateOk, turnstileOk } from './_lib/guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  // Форма відкрита за задумом (заявку лишає незареєстрований відвідувач), тому
  // обмежуємо не доступ, а частоту й ботів. Обидва вмикаються наявністю
  // налаштувань: без них пропускаємо, щоб не зламати форми до налаштування.
  if (!(await rateOk(req, 'lead', 10, 3600))) {
    res.status(429).json({ error: 'Забагато заявок з цієї адреси. Спробуйте за годину або напишіть на hello@weexp.agency.' });
    return;
  }
  if (!(await turnstileOk(req, (req.body ?? {}).turnstile))) {
    res.status(400).json({ error: 'Не пройдено перевірку «я не робот». Оновіть сторінку й спробуйте ще раз.' });
    return;
  }
  const { RESEND_API_KEY, NOTIFY_FROM } = process.env;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;

  const b = req.body ?? {};
  // honeypot: боты заполняют скрытое поле — тихо принимаем и выбрасываем
  if (b.company_website) {
    res.status(200).json({ ok: true });
    return;
  }
  const source = String(b.source || 'site').slice(0, 40);
  const email = String(b.email || '').trim().slice(0, 120);
  const phone = String(b.phone || '').trim().slice(0, 40);
  if (!email && !phone) {
    res.status(400).json({ error: 'Потрібен email або телефон' });
    return;
  }

  // ── Заявка в системе: пишем лид в Supabase (таблица `leads`) — именно это
  // делает заявку видимой в админке /admin. Это ПЕРВИЧНЫЙ путь успеха. ──
  const clip = (v, n) => (v ? String(v).slice(0, n) : null);
  const dbOk = await saveLeadToDb({
    source, email: email || null, phone: phone || null,
    name: clip(b.name, 120), role: clip(b.role, 80), store: clip(b.store, 200), site: clip(b.site, 200),
    turnover: clip(b.turnover, 60), task: clip(b.task, 200), timeline: clip(b.timeline, 80),
    budget: clip(b.budget, 60), comment: clip(b.comment, 2000),
    diag: clip(b.diag, 4000), calc: clip(b.calc, 3000), status: 'new',
  });

  // Уведомление на почту — best-effort. Не настроен Resend → не ошибка,
  // если заявка уже записана в БД.
  let emailOk = false;
  const lines = [
    `Джерело: ${source}`,
    email && `Email: ${email}`,
    phone && `Телефон: ${phone}`,
    b.name && `Імʼя: ${String(b.name).slice(0, 120)}`,
    b.role && `Роль: ${String(b.role).slice(0, 80)}`,
    b.store && `Магазин: ${String(b.store).slice(0, 200)}`,
    b.site && `Сайт: ${String(b.site).slice(0, 200)}`,
    b.turnover && `Оборот / міс: ${String(b.turnover).slice(0, 60)}`,
    b.task && `Задача: ${String(b.task).slice(0, 120)}`,
    b.timeline && `Терміни: ${String(b.timeline).slice(0, 80)}`,
    b.budget && `Бюджет: ${String(b.budget).slice(0, 60)}`,
    b.comment && `Коментар / проблема: ${String(b.comment).slice(0, 1000)}`,
    b.diag && `\n— Результат діагностики (Business X-Ray) —\n${String(b.diag).slice(0, 2000)}`,
    b.calc && `\n— Розрахунок калькулятора —\n${String(b.calc).slice(0, 1500)}`,
  ].filter(Boolean);

  if (RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: NOTIFY_FROM || 'WEEXP <no-reply@weexp.agency>',
          to: [NOTIFY_EMAIL],
          ...(email ? { reply_to: email } : {}),
          subject: `Лід із сайту · ${source}${b.name ? ` · ${String(b.name).slice(0, 60)}` : ''}`,
          text: lines.join('\n'),
        }),
      });
      const j = await r.json().catch(() => ({}));
      emailOk = Boolean(j.id);
    } catch { emailOk = false; }
  }

  // Успех, если заявка записана в систему ИЛИ отправлено уведомление.
  if (dbOk || emailOk) { res.status(200).json({ ok: true, stored: dbOk, notified: emailOk }); return; }
  // Ни БД, ни почта не сконфигурированы/недоступны.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !RESEND_API_KEY) { res.status(200).json({ error: 'not_configured' }); return; }
  res.status(200).json({ error: 'save_failed' });
}
