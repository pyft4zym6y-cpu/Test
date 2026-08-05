// Vercel serverless: письмо консультанту о прогрессе клиента (через Resend).
// Env: RESEND_API_KEY — ключ resend.com; NOTIFY_EMAIL — куда слать;
//      NOTIFY_FROM — от кого (по умолчанию onboarding@resend.dev, для боевого —
//      адрес на подтверждённом домене, напр. portal@weexp.agency).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const { RESEND_API_KEY, NOTIFY_EMAIL, NOTIFY_FROM } = process.env;
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    res.status(200).json({
      error: 'Уведомления не настроены: добавьте RESEND_API_KEY и NOTIFY_EMAIL в Vercel.',
    });
    return;
  }
  const { subject, text } = req.body ?? {};
  if (!subject || !text) {
    res.status(400).json({ error: 'Нужны subject и text' });
    return;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: NOTIFY_FROM || 'Discovery Portal <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        subject: String(subject).slice(0, 150),
        text: String(text).slice(0, 4000),
      }),
    });
    const j = await r.json();
    if (j.id) res.status(200).json({ ok: true });
    else res.status(200).json({ error: j.message || 'Resend отклонил письмо' });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 120) });
  }
}
