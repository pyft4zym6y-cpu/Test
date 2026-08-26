// Vercel serverless (school.weexp.agency): приём заявок на курсы школы.
// Письмо основателю через Resend (как на основном сайте) + опционально
// уведомление в Telegram.
// Env: RESEND_API_KEY — обязателен для email (тот же ключ, что у сайта);
//      NOTIFY_EMAIL / NOTIFY_FROM — опционально;
//      TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID — опционально, для Telegram.
// Куда фактически доставляются заявки (server-side, посетителям не видно).
// Публичный адрес школы — school@weexp.agency (пересылка на этот же ящик).
const DEFAULT_NOTIFY_EMAIL = 'pashasidorenko18@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const { RESEND_API_KEY, NOTIFY_FROM, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;

  const b = req.body ?? {};
  // honeypot: боты заполняют скрытое поле — тихо принимаем и выбрасываем
  if (b.company_website) {
    res.status(200).json({ ok: true });
    return;
  }
  const name = String(b.name || '').trim().slice(0, 120);
  const contact = String(b.contact || '').trim().slice(0, 120);
  const course = String(b.course || '').trim().slice(0, 160);
  const comment = String(b.comment || '').trim().slice(0, 1000);
  if (!contact) {
    res.status(400).json({ error: 'Потрібен email або телефон' });
    return;
  }

  const text = [
    `Курс: ${course || '—'}`,
    `Імʼя: ${name || '—'}`,
    `Контакт: ${contact}`,
    comment && `Коментар: ${comment}`,
  ]
    .filter(Boolean)
    .join('\n');
  const subject = `Заявка школи · ${course || 'курс не обрано'}${name ? ` · ${name}` : ''}`;

  const results = {};

  // Supabase: заявка падає в таблицю leads → видна у міні-CRM (/admin)
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ name, contact, course, comment, status: 'new' }),
      });
      results.db = r.ok ? 'ok' : `db_${r.status}`;
    } catch (e) {
      results.db = String(e).slice(0, 120);
    }
  }

  if (RESEND_API_KEY) {
    try {
      const looksEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: NOTIFY_FROM || 'Commerce Architecture <onboarding@resend.dev>',
          to: [NOTIFY_EMAIL],
          ...(looksEmail ? { reply_to: contact } : {}),
          subject,
          text,
        }),
      });
      const j = await r.json();
      results.email = j.id ? 'ok' : j.message || 'send_failed';
    } catch (e) {
      results.email = String(e).slice(0, 120);
    }
  }

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🔴 ${subject}\n\n${text}`,
        }),
      });
      const j = await r.json();
      results.telegram = j.ok ? 'ok' : j.description || 'send_failed';
    } catch (e) {
      results.telegram = String(e).slice(0, 120);
    }
  }

  if (!RESEND_API_KEY && !TELEGRAM_BOT_TOKEN) {
    // ни один канал не настроен — фронт откатится на mailto
    res.status(200).json({ error: 'not_configured' });
    return;
  }
  const ok = results.email === 'ok' || results.telegram === 'ok';
  res.status(200).json(ok ? { ok: true } : { error: results.email || results.telegram });
}
