// Міст admin → worker (аудит-рушій Commerce OS на Railway).
// Тримає токен воркера на сервері; браузер дьорга лише цей проксі.
// Env (Vercel): WORKER_URL (за замовч. — прод-URL), AUDIT_SERVER_TOKEN (= токен воркера).
const DEFAULT_WORKER = 'https://test-production-5713.up.railway.app';

import { requireStaff } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  // Запускає прогін воркера (Playwright + Claude на Railway) — лише команда.
  if (!(await requireStaff(req, res))) return;
  const base = (process.env.WORKER_URL || DEFAULT_WORKER).replace(/\/$/, '');
  const token = process.env.AUDIT_SERVER_TOKEN || process.env.WORKER_AUDIT_TOKEN;
  if (!token) { res.status(200).json({ error: 'not_configured: додайте AUDIT_SERVER_TOKEN у Vercel (те саме значення, що на воркері)' }); return; }
  const b = req.body ?? {};
  const hdr = { 'x-audit-token': token, 'content-type': 'application/json' };

  try {
    if (b.action === 'health') {
      const r = await fetch(`${base}/health`, { headers: hdr });
      res.status(200).json(await r.json());
      return;
    }
    if (b.action === 'start') {
      if (!b.site) { res.status(200).json({ error: 'Вкажіть сайт клієнта (домен) для аудиту' }); return; }
      const opts = { site: b.site, tier: Math.max(1, Math.min(4, Number(b.tier) || 1)), answers: b.answers || undefined };
      const r = await fetch(`${base}/audit`, { method: 'POST', headers: hdr, body: JSON.stringify(opts) });
      const j = await r.json();
      res.status(200).json(j.ok ? { ok: true, id: j.id } : { error: j.error || 'audit_start_failed' });
      return;
    }
    if (b.action === 'status') {
      if (!b.id) { res.status(200).json({ error: 'no_id' }); return; }
      const r = await fetch(`${base}/job/${encodeURIComponent(b.id)}`, { headers: hdr });
      const j = await r.json();
      res.status(200).json(j.ok ? { ok: true, job: j.job } : { error: j.error || 'not_found' });
      return;
    }
    if (b.action === 'learnSnapshot') {
      const r = await fetch(`${base}/learn/snapshot`, { headers: hdr });
      res.status(200).json(await r.json());
      return;
    }
    if (b.action === 'learn') {
      if (!b.auditId || !Array.isArray(b.verdicts) || !b.verdicts.length) { res.status(200).json({ error: 'need auditId + verdicts' }); return; }
      const body = { auditId: b.auditId, findings: b.findings || [], verdicts: b.verdicts, reviewer: b.reviewer || 'admin', observations: b.observations || {} };
      const r = await fetch(`${base}/learn`, { method: 'POST', headers: hdr, body: JSON.stringify(body) });
      res.status(200).json(await r.json());
      return;
    }
    if (b.action === 'pack') {
      if (!b.id) { res.status(200).json({ error: 'no_id' }); return; }
      const suffix = b.internal ? 'pack-internal.zip' : 'pack.zip';
      const r = await fetch(`${base}/job/${encodeURIComponent(b.id)}/${suffix}`, { headers: hdr });
      if (!r.ok) { res.status(200).json({ error: 'пакет недоступний (' + r.status + ')' }); return; }
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader('content-type', 'application/zip');
      res.setHeader('content-disposition', `attachment; filename="audit-${b.id}${b.internal ? '-internal' : ''}.zip"`);
      res.status(200).send(buf);
      return;
    }
    res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 200) });
  }
}
