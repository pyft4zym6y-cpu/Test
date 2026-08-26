// Vercel serverless: GA4 — два режими в одній функції (ліміт 12 функцій Hobby).
//
// 1) БЕЗ action (легасі): baseline WEEXP-сайту через сервісний акаунт.
//    Env: GA4_PROPERTY_ID, GA4_SA_EMAIL, GA4_SA_KEY (сервісний акаунт = Viewer у GA4).
//
// 2) action=… : РЕАЛЬНИЙ конектор клієнта до його Google Analytics (OAuth, read-only).
//    Env: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
//         (+ SUPABASE_URL|VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — сховище токенів)
//    Google Cloud Console → Credentials → OAuth client (Web):
//      Authorized redirect URI:  https://weexp.agency/api/ga4   (БЕЗ query-параметрів)
//    Дії:
//      ?action=oauth_start&u={userId}  → 302 на екран згоди Google (scope: analytics.readonly)
//      (callback приходить на /api/ga4?code=…&state=… — розпізнається за code)
//      ?action=status&u={userId}       → { connected, email, properties[], at }
//      ?action=disconnect&u={userId}   → відкликає токен і видаляє запис
//      ?action=pull&u={userId}&property={id} → 30-денний baseline по властивості клієнта
//    Таблиця Supabase: ga_connections(user_id text pk, email text, refresh_token text,
//                                     properties jsonb, at timestamptz)
import crypto from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

/* ── легасі: сервісний акаунт WEEXP ── */
async function saToken(email, key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const input = `${header}.${claims}`;
  const sig = crypto.createSign('RSA-SHA256').update(input).sign(key.replace(/\\n/g, '\n'));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${input}.${b64url(sig)}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error_description || 'Не вдалося отримати токен Google');
  return j.access_token;
}

/* ── Supabase REST (service role) ── */
function sb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const base = url.replace(/\/$/, '');
  const H = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  return {
    async get(userId) {
      const r = await fetch(`${base}/rest/v1/ga_connections?user_id=eq.${encodeURIComponent(userId)}&select=*`, { headers: H });
      const j = await r.json().catch(() => []);
      return Array.isArray(j) && j[0] ? j[0] : null;
    },
    async upsert(row) {
      const r = await fetch(`${base}/rest/v1/ga_connections`, {
        method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(row),
      });
      return r.ok;
    },
    async del(userId) {
      await fetch(`${base}/rest/v1/ga_connections?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE', headers: H });
    },
  };
}

/* ── OAuth helpers ── */
const OAUTH_SCOPE = 'openid email https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly';
function redirectUri(req) {
  return process.env.GOOGLE_OAUTH_REDIRECT || `https://${req.headers['x-forwarded-host'] || req.headers.host}/api/ga4`;
}
function signState(u, secret) {
  const ts = Date.now();
  const mac = crypto.createHmac('sha256', secret).update(`${u}.${ts}`).digest('base64url');
  return `${b64url(u)}.${ts}.${mac}`;
}
function verifyState(state, secret) {
  const [ub, ts, mac] = String(state || '').split('.');
  if (!ub || !ts || !mac) return null;
  const u = Buffer.from(ub, 'base64url').toString();
  const want = crypto.createHmac('sha256', secret).update(`${u}.${ts}`).digest('base64url');
  if (mac !== want) return null;
  if (Date.now() - Number(ts) > 15 * 60_000) return null; // 15 хв на згоду
  return u;
}
async function refreshAccess(refreshToken, id, secret) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: id, client_secret: secret }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error_description || 'refresh failed');
  return j.access_token;
}
async function listProperties(access) {
  const out = [];
  let pageToken = '';
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`, { headers: { Authorization: `Bearer ${access}` } });
    const j = await r.json();
    for (const acc of j.accountSummaries || []) {
      for (const p of acc.propertySummaries || []) {
        out.push({ id: (p.property || '').replace('properties/', ''), name: p.displayName, account: acc.displayName });
      }
    }
    pageToken = j.nextPageToken || '';
    if (!pageToken) break;
  }
  return out;
}
const back = (res, qs) => { res.statusCode = 302; res.setHeader('Location', `/cabinet?section=docs&${qs}`); res.end(); };

import { ga4Site } from './_lib/ga4-site.js';
import { requireSelfOrStaff, requireStaff } from './_lib/auth.js';

export default async function handler(req, res) {
  // /api/ga4-site → rewrite сюди з ?fn=site (ліміт 12 функцій Hobby).
  if (req.query?.fn === 'site') return ga4Site(req, res);

  const q = req.query || {};
  const action = String(q.action || '');
  const CID = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const CSECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const store = sb();

  /* ── Хто зве ───────────────────────────────────────────────────────────────
     Ендпоінт довго жив без жодної перевірки: за одним лише ?u=<uuid> він
     віддавав виторг і сесії клієнта з його GA4, email підключеного Google-
     акаунта, перелік property та сайтів GSC — і, гірше, дозволяв ВІДКЛЮЧИТИ
     інтеграцію клієнта (disconnect відкликає токен). Єдиним захистом була
     складність вгадати uuid.
     Виняток один — OAuth-callback: його викликає Google, сесії там немає, а
     достовірність підтверджує підписаний state. */
  const isOauthCallback = Boolean(q.code && q.state && !action);
  if (!isOauthCallback) {
    // Дії з даними конкретного користувача — сам користувач або команда.
    if (['status', 'disconnect', 'pull', 'pull_gsc', 'oauth_url'].includes(action)) {
      if (!(await requireSelfOrStaff(req, res, String(q.u || '')))) return;
    } else {
      // Решта (psi та все нове) — лише команда: це наш зовнішній виклик за гроші/квоту.
      if (!(await requireStaff(req, res))) return;
    }
  }

  /* ── OAuth-callback: Google повертає ?code&state на чистий /api/ga4 ── */
  if (q.code && q.state && !action) {
    if (!CID || !CSECRET || !store) return back(res, 'ga=error&reason=not_configured');
    const u = verifyState(q.state, CSECRET);
    if (!u) return back(res, 'ga=error&reason=state');
    try {
      const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code: String(q.code), client_id: CID, client_secret: CSECRET, redirect_uri: redirectUri(req) }),
      });
      const tok = await r.json();
      if (!tok.refresh_token && !tok.access_token) throw new Error(tok.error_description || 'no tokens');
      let email = '';
      try { email = JSON.parse(Buffer.from(String(tok.id_token).split('.')[1], 'base64url').toString()).email || ''; } catch { /* noop */ }
      let properties = [];
      try { properties = await listProperties(tok.access_token); } catch { /* покажемо пізніше через status */ }
      let sites = [];
      try {
        const rs = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { Authorization: `Bearer ${tok.access_token}` } });
        const js = await rs.json();
        sites = (js.siteEntry || []).map((x) => ({ url: x.siteUrl, level: x.permissionLevel }));
      } catch { /* GSC опційний */ }
      // refresh_token приходить лише з prompt=consent; якщо його нема — лишаємо старий
      const prev = tok.refresh_token ? null : await store.get(u);
      const ok = await store.upsert({
        user_id: u, email, refresh_token: tok.refresh_token || prev?.refresh_token || '',
        properties, sites, at: new Date().toISOString(),
      });
      if (!ok) return back(res, 'ga=error&reason=store');
      return back(res, 'ga=connected');
    } catch (e) {
      return back(res, `ga=error&reason=${encodeURIComponent(String(e.message || e).slice(0, 80))}`);
    }
  }

  /* Раніше тут був oauth_start: GET-редірект, який брав `u` із адреси. Оскільки
     це навігація, заголовок сесії до нього не доїде — тобто перевірити, що
     людина має право привʼязувати саме цей акаунт, було неможливо, і будь-хто
     міг ініціювати привʼязку до чужого uid. Тепер два кроки: авторизований
     виклик віддає посилання, і вже за ним переходить браузер. */
  if (action === 'oauth_url') {
    if (!CID || !CSECRET) { res.status(200).json({ error: 'not_configured', hint: 'Додайте GOOGLE_OAUTH_CLIENT_ID і GOOGLE_OAUTH_CLIENT_SECRET у Vercel; redirect URI: https://weexp.agency/api/ga4' }); return; }
    const u = String(q.u || '');
    if (!u) { res.status(400).json({ error: 'u required' }); return; }
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: CID, redirect_uri: redirectUri(req), response_type: 'code', scope: OAUTH_SCOPE,
      access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: signState(u, CSECRET),
    });
    res.status(200).json({ ok: true, url }); return;
  }

  if (action === 'status') {
    const u = String(q.u || '');
    if (!store) { res.status(200).json({ connected: false, error: 'not_configured' }); return; }
    const row = u ? await store.get(u) : null;
    res.status(200).json(row
      ? { connected: !!row.refresh_token, email: row.email || '', properties: row.properties || [], sites: row.sites || [], at: row.at }
      : { connected: false });
    return;
  }

  if (action === 'disconnect') {
    const u = String(q.u || '');
    if (store && u) {
      const row = await store.get(u);
      if (row?.refresh_token) { try { await fetch(`https://oauth2.googleapis.com/revoke?token=${row.refresh_token}`, { method: 'POST' }); } catch { /* noop */ } }
      await store.del(u);
    }
    res.status(200).json({ ok: true }); return;
  }

  /* PageSpeed Insights: публічний API по URL — без OAuth і згоди клієнта.
     Env (опційно): PAGESPEED_API_KEY — піднімає квоту до 25k/день. */
  if (action === 'psi') {
    const url = String(q.url || '');
    const strategy = q.strategy === 'desktop' ? 'desktop' : 'mobile';
    if (!/^https?:\/\//.test(url)) { res.status(400).json({ error: 'url required (https://…)' }); return; }
    try {
      const key = process.env.PAGESPEED_API_KEY;
      const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance${key ? `&key=${key}` : ''}`;
      const j = await (await fetch(api)).json();
      if (j.error) throw new Error(j.error.message);
      const lr = j.lighthouseResult || {};
      const audits = lr.audits || {};
      const ms = (k) => Math.round(audits[k]?.numericValue || 0);
      const crux = j.loadingExperience?.metrics || {};
      const cx = (k) => crux[k] ? { v: crux[k].percentile, cat: crux[k].category } : null;
      res.status(200).json({
        url, strategy,
        score: Math.round((lr.categories?.performance?.score || 0) * 100),
        lab: { lcpMs: ms('largest-contentful-paint'), cls: Math.round((audits['cumulative-layout-shift']?.numericValue || 0) * 1000) / 1000, tbtMs: ms('total-blocking-time'), fcpMs: ms('first-contentful-paint'), siMs: ms('speed-index') },
        field: { lcp: cx('LARGEST_CONTENTFUL_PAINT_MS'), inp: cx('INTERACTION_TO_NEXT_PAINT'), cls: cx('CUMULATIVE_LAYOUT_SHIFT_SCORE') },
        fieldOverall: j.loadingExperience?.overall_category || null,
      });
    } catch (e) {
      res.status(200).json({ error: String(e.message || e) });
    }
    return;
  }

  if (action === 'pull_gsc') {
    const u = String(q.u || ''); const site = String(q.site || '');
    if (!CID || !CSECRET || !store) { res.status(200).json({ error: 'not_configured' }); return; }
    const row = u ? await store.get(u) : null;
    if (!row?.refresh_token) { res.status(200).json({ error: 'not_connected' }); return; }
    if (!site) { res.status(400).json({ error: 'site required' }); return; }
    try {
      const access = await refreshAccess(row.refresh_token, CID, CSECRET);
      const end = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const start = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
      const qr = async (body) => {
        const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
          method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: start, endDate: end, ...body }),
        });
        const j = await r.json();
        if (j.error) throw new Error(j.error.message);
        return j;
      };
      const [tot, topq] = await Promise.all([
        qr({}),
        qr({ dimensions: ['query'], rowLimit: 10 }),
      ]);
      const t = tot.rows?.[0] || {};
      res.status(200).json({
        period: '28 днів',
        clicks: Math.round(t.clicks || 0), impressions: Math.round(t.impressions || 0),
        ctr: Math.round((t.ctr || 0) * 10000) / 100, position: Math.round((t.position || 0) * 10) / 10,
        queries: (topq.rows || []).map((r2) => ({ q: r2.keys?.[0] || '—', clicks: Math.round(r2.clicks || 0), impressions: Math.round(r2.impressions || 0), position: Math.round((r2.position || 0) * 10) / 10 })),
      });
    } catch (e) {
      res.status(200).json({ error: String(e.message || e) });
    }
    return;
  }

  if (action === 'pull') {
    const u = String(q.u || ''); const prop = String(q.property || '').replace(/\D/g, '');
    if (!CID || !CSECRET || !store) { res.status(200).json({ error: 'not_configured' }); return; }
    const row = u ? await store.get(u) : null;
    if (!row?.refresh_token) { res.status(200).json({ error: 'not_connected' }); return; }
    if (!prop) { res.status(400).json({ error: 'property required' }); return; }
    try {
      const access = await refreshAccess(row.refresh_token, CID, CSECRET);
      const run = async (body) => {
        const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`, {
          method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }], ...body }),
        });
        const j = await r.json();
        if (j.error) throw new Error(j.error.message);
        return j;
      };
      // Превʼю ключових даних: тотали + канали + пристрої (все read-only, 30 днів)
      const [tot, ch, dev] = await Promise.all([
        run({ metrics: [{ name: 'sessions' }, { name: 'transactions' }, { name: 'purchaseRevenue' }, { name: 'totalUsers' }] }),
        run({ dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }, { name: 'purchaseRevenue' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 }),
        run({ dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }, { name: 'transactions' }] }),
      ]);
      const tv = tot.rows?.[0]?.metricValues ?? [];
      const sessions = Number(tv[0]?.value ?? 0), transactions = Number(tv[1]?.value ?? 0), revenue = Number(tv[2]?.value ?? 0), users = Number(tv[3]?.value ?? 0);
      const channels = (ch.rows || []).map((r2) => ({ name: r2.dimensionValues?.[0]?.value || '—', sessions: Number(r2.metricValues?.[0]?.value ?? 0), revenue: Math.round(Number(r2.metricValues?.[1]?.value ?? 0)) }));
      const devices = (dev.rows || []).map((r2) => {
        const s2 = Number(r2.metricValues?.[0]?.value ?? 0), t2 = Number(r2.metricValues?.[1]?.value ?? 0);
        return { name: r2.dimensionValues?.[0]?.value || '—', sessions: s2, cr: s2 ? Math.round((t2 / s2) * 10000) / 100 : 0 };
      });
      res.status(200).json({ period: '30 днів', sessions, users, transactions, revenue: Math.round(revenue),
        cr: sessions ? Math.round((transactions / sessions) * 10000) / 100 : 0,
        aov: transactions ? Math.round(revenue / transactions) : 0,
        channels, devices });
    } catch (e) {
      res.status(200).json({ error: String(e.message || e) });
    }
    return;
  }

  /* ── легасі: baseline WEEXP-сайту через сервісний акаунт ── */
  const { GA4_PROPERTY_ID, GA4_SA_EMAIL, GA4_SA_KEY } = process.env;
  if (!GA4_PROPERTY_ID || !GA4_SA_EMAIL || !GA4_SA_KEY) {
    res.status(200).json({ error: 'GA4 не настроен: добавьте GA4_PROPERTY_ID, GA4_SA_EMAIL, GA4_SA_KEY в переменные окружения Vercel и выдайте сервисному аккаунту роль «Наблюдатель» в GA4.' });
    return;
  }
  try {
    const token = await saToken(GA4_SA_EMAIL, GA4_SA_KEY);
    const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '90daysAgo', endDate: 'yesterday' }],
        metrics: [{ name: 'sessions' }, { name: 'transactions' }, { name: 'purchaseRevenue' }],
      }),
    });
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
    res.status(200).json({ error: String(e.message || e) });
  }
}
