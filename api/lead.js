// Vercel serverless (сайт weexp.agency): приём лидов — контактная форма и
// результат Business X-Ray / повної діагностики. Письмо уходит консультанту
// через Resend; reply-to = адрес лида, чтобы отвечать в один клик.
// Env: RESEND_API_KEY (обязателен); NOTIFY_EMAIL / NOTIFY_FROM — опционально.
const DEFAULT_NOTIFY_EMAIL = 'pashasidorenko18@gmail.com';

// Best-effort запись лида в Supabase (REST, service-role). Требует env
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Тихо no-op, если их нет.
async function saveLeadToDb(row) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const base = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  await fetch(`${base}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const { RESEND_API_KEY, NOTIFY_FROM } = process.env;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;
  if (!RESEND_API_KEY) {
    // Бэкенд не сконфигурирован — сообщаем явно, фронт покажет запасной путь.
    res.status(200).json({ error: 'not_configured' });
    return;
  }

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

  // Best-effort: пишем лид и в Supabase (таблица `leads`), чтобы он был виден в
  // админке /admin. Не блокирует письмо: любая ошибка БД — тихо игнорируется.
  const clip = (v, n) => (v ? String(v).slice(0, n) : null);
  await saveLeadToDb({
    source, email: email || null, phone: phone || null,
    name: clip(b.name, 120), role: clip(b.role, 80), store: clip(b.store, 200),
    turnover: clip(b.turnover, 60), task: clip(b.task, 200), timeline: clip(b.timeline, 80),
    budget: clip(b.budget, 60), comment: clip(b.comment, 2000),
    diag: clip(b.diag, 4000), calc: clip(b.calc, 3000), status: 'new',
  }).catch(() => {});

  const lines = [
    `Джерело: ${source}`,
    email && `Email: ${email}`,
    phone && `Телефон: ${phone}`,
    b.name && `Імʼя: ${String(b.name).slice(0, 120)}`,
    b.role && `Роль: ${String(b.role).slice(0, 80)}`,
    b.store && `Магазин / сайт: ${String(b.store).slice(0, 200)}`,
    b.turnover && `Оборот / міс: ${String(b.turnover).slice(0, 60)}`,
    b.task && `Задача: ${String(b.task).slice(0, 120)}`,
    b.timeline && `Терміни: ${String(b.timeline).slice(0, 80)}`,
    b.budget && `Бюджет: ${String(b.budget).slice(0, 60)}`,
    b.comment && `Коментар / проблема: ${String(b.comment).slice(0, 1000)}`,
    b.diag && `\n— Результат діагностики (Business X-Ray) —\n${String(b.diag).slice(0, 2000)}`,
    b.calc && `\n— Розрахунок калькулятора —\n${String(b.calc).slice(0, 1500)}`,
  ].filter(Boolean);

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: NOTIFY_FROM || 'weexp.agency <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        ...(email ? { reply_to: email } : {}),
        subject: `Лід із сайту · ${source}${b.name ? ` · ${String(b.name).slice(0, 60)}` : ''}`,
        text: lines.join('\n'),
      }),
    });
    const j = await r.json();
    if (j.id) res.status(200).json({ ok: true });
    else res.status(200).json({ error: j.message || 'send_failed' });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 120) });
  }
}
