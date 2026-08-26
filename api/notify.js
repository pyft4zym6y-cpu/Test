// Vercel serverless: письмо консультанту о прогрессе клиента (через Resend).
// Env: RESEND_API_KEY — ключ resend.com (обязательный, только через Vercel env!);
//      NOTIFY_EMAIL — куда слать (по умолчанию — адрес консультанта ниже);
//      NOTIFY_FROM — от кого (по умолчанию onboarding@resend.dev, для боевого —
//      адрес на подтверждённом домене, напр. portal@weexp.agency).
const DEFAULT_NOTIFY_EMAIL = 'pashasidorenko18@gmail.com';

import { rateOk } from './_lib/guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  // Ендпоінт шле лист власнику й відкритий (його зве бриф без токена). Без
  // ліміту це безкоштовний спосіб залити пошту і спалити квоту Resend.
  if (!(await rateOk(req, 'notify', 20, 3600))) {
    res.status(429).json({ error: 'too_many' });
    return;
  }
  const { RESEND_API_KEY, NOTIFY_FROM } = process.env;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;
  if (!RESEND_API_KEY) {
    res.status(200).json({
      error: 'Уведомления не настроены: добавьте RESEND_API_KEY в Vercel.',
    });
    return;
  }
  // Эндпоинт открыт (его зовёт боевой бриф без токена), поэтому ограничиваем
  // ФОРМУ письма, а не только факт вызова: длины режем, перевод строки из темы
  // убираем, тему помечаем префиксом — чтобы чужая рассылка не притворялась
  // системным уведомлением и не била по репутации домена в Resend.
  const raw = req.body ?? {};
  const subject = String(raw.subject ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
  const text = String(raw.text ?? '').slice(0, 8000);
  if (!subject || !text) {
    res.status(400).json({ error: 'Нужны subject и text' });
    return;
  }
  const safeSubject = `[weexp] ${subject}`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: NOTIFY_FROM || 'WEEXP <no-reply@weexp.agency>',
        to: [NOTIFY_EMAIL],
        subject: safeSubject,
        text,
      }),
    });
    const j = await r.json();
    if (j.id) res.status(200).json({ ok: true });
    else res.status(200).json({ error: j.message || 'Resend отклонил письмо' });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 120) });
  }
}
