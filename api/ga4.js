// Vercel serverless: тянет baseline из GA4 Data API по сервисному аккаунту.
// Настройка (Vercel → Settings → Environment Variables):
//   GA4_PROPERTY_ID   — числовой ID ресурса GA4 (Admin → Property settings)
//   GA4_SA_EMAIL      — client_email сервисного аккаунта
//   GA4_SA_KEY        — private_key сервисного аккаунта (PEM, с \n)
// Сервисный аккаунт добавляется в GA4 как «Наблюдатель» (Admin → Property access).
import crypto from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

async function getToken(email, key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const input = `${header}.${claims}`;
  const sig = crypto.createSign('RSA-SHA256').update(input).sign(key.replace(/\\n/g, '\n'));
  const jwt = `${input}.${b64url(sig)}`;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error_description || 'Не удалось получить токен Google');
  return j.access_token;
}

export default async function handler(req, res) {
  const { GA4_PROPERTY_ID, GA4_SA_EMAIL, GA4_SA_KEY } = process.env;
  if (!GA4_PROPERTY_ID || !GA4_SA_EMAIL || !GA4_SA_KEY) {
    res.status(200).json({
      error:
        'GA4 не настроен: добавьте GA4_PROPERTY_ID, GA4_SA_EMAIL, GA4_SA_KEY в переменные окружения Vercel и выдайте сервисному аккаунту роль «Наблюдатель» в GA4.',
    });
    return;
  }
  try {
    const token = await getToken(GA4_SA_EMAIL, GA4_SA_KEY);
    const r = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: '90daysAgo', endDate: 'yesterday' }],
          metrics: [
            { name: 'sessions' },
            { name: 'transactions' },
            { name: 'purchaseRevenue' },
          ],
        }),
      },
    );
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    const row = j.rows?.[0]?.metricValues ?? [];
    const sessions = Number(row[0]?.value ?? 0);
    const transactions = Number(row[1]?.value ?? 0);
    const revenue = Number(row[2]?.value ?? 0);
    res.status(200).json({
      period: '90 дней',
      sessionsMonthly: Math.round(sessions / 3),
      ordersMonthly: Math.round(transactions / 3),
      revenueMonthly: Math.round(revenue / 3),
      cr: sessions ? Math.round((transactions / sessions) * 10000) / 100 : 0,
      aov: transactions ? Math.round(revenue / transactions) : 0,
    });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}
