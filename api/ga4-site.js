// Vercel serverless: трафик САМОГО сайта weexp.agency для админки /admin.
// Отдаёт сводку за 30 дней: сессии, пользователи, просмотры + топ источников и
// топ страниц. Тот же сервисный аккаунт, что и /api/ga4, но своё свойство сайта.
// Env: GA4_SITE_PROPERTY_ID (или GA4_PROPERTY_ID), GA4_SA_EMAIL, GA4_SA_KEY.
import crypto from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

async function getToken(email, key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: email, scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const input = `${header}.${claims}`;
  const sig = crypto.createSign('RSA-SHA256').update(input).sign(key.replace(/\\n/g, '\n'));
  const jwt = `${input}.${b64url(sig)}`;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error_description || 'Не удалось получить токен Google');
  return j.access_token;
}

async function runReport(token, propertyId, body) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j;
}

export default async function handler(req, res) {
  const propertyId = process.env.GA4_SITE_PROPERTY_ID || process.env.GA4_PROPERTY_ID;
  const { GA4_SA_EMAIL, GA4_SA_KEY } = process.env;
  if (!propertyId || !GA4_SA_EMAIL || !GA4_SA_KEY) {
    res.status(200).json({ error: 'GA4 не налаштовано: додайте GA4_SITE_PROPERTY_ID (або GA4_PROPERTY_ID), GA4_SA_EMAIL, GA4_SA_KEY у Vercel і дайте сервісному акаунту роль «Переглядач» у GA4.' });
    return;
  }
  try {
    const token = await getToken(GA4_SA_EMAIL, GA4_SA_KEY);
    const range = [{ startDate: '30daysAgo', endDate: 'yesterday' }];

    const totals = await runReport(token, propertyId, {
      dateRanges: range,
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }, { name: 'bounceRate' }],
    });
    const tRow = totals.rows?.[0]?.metricValues ?? [];

    const sources = await runReport(token, propertyId, {
      dateRanges: range, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6,
    });
    const pages = await runReport(token, propertyId, {
      dateRanges: range, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 8,
    });

    res.status(200).json({
      period: '30 днів',
      sessions: Number(tRow[0]?.value ?? 0),
      users: Number(tRow[1]?.value ?? 0),
      pageviews: Number(tRow[2]?.value ?? 0),
      bounceRate: Math.round(Number(tRow[3]?.value ?? 0) * 1000) / 10,
      sources: (sources.rows ?? []).map((r) => ({ name: r.dimensionValues[0].value, sessions: Number(r.metricValues[0].value) })),
      pages: (pages.rows ?? []).map((r) => ({ path: r.dimensionValues[0].value, views: Number(r.metricValues[0].value) })),
    });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}
