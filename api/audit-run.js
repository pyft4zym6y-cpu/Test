// Міст admin → worker (аудит-рушій Commerce OS на Railway).
// Тримає токен воркера на сервері; браузер дьорга лише цей проксі.
// Env (Vercel): WORKER_URL (за замовч. — прод-URL), AUDIT_SERVER_TOKEN (= токен воркера).
const DEFAULT_WORKER = 'https://test-production-5713.up.railway.app';

import { requireStaff } from './_lib/auth.js';
import { staffRateLimited } from './_lib/guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  // Запускає прогін воркера (Playwright + Claude на Railway) — лише команда.
  const me = await requireStaff(req, res);
  if (!me) return;
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
      // Ліміт саме тут, а не на всій ручці: `status` опитується поллінгом кожні
      // кілька секунд за задумом, і обмежувати його означало б зламати прогрес.
      // Дорогий тільки `start` — він піднімає Playwright і платний аналіз.
      if (await staffRateLimited(req, res, me, 'audit-start', 10)) return;
      if (!b.site) { res.status(200).json({ error: 'Вкажіть сайт клієнта (домен) для аудиту' }); return; }
      // knowledge — база знань клієнта (профіль, доступи, файли, оцінки, попередні
      // прогони). Їде поруч із відповідями, щоб рушій бачив контекст усіх етапів.
      const opts = {
        site: b.site,
        tier: Math.max(1, Math.min(4, Number(b.tier) || 1)),
        answers: b.answers || undefined,
        knowledge: b.knowledge || undefined,
        // Чей прогон. Раньше не передавался вовсе, поэтому воркер не мог
        // сохранить его никуда, кроме диска контейнера.
        ownerKey: typeof b.ownerKey === 'string' ? b.ownerKey.slice(0, 200) : undefined,
      };
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
    // Один документ прогона. Нужен, чтобы перенести готовые документы из
    // движка прямо в файлы клиента: раньше единственным путём был zip →
    // распаковать руками → загрузить обратно.
    if (b.action === 'file') {
      if (!b.id || !b.name) { res.status(200).json({ error: 'need id + name' }); return; }
      const name = String(b.name).replace(/[\\/]/g, '');
      const r = await fetch(`${base}/result/${encodeURIComponent(b.id)}/${encodeURIComponent(name)}`, { headers: hdr });
      if (!r.ok) { res.status(200).json({ error: 'файл недоступний (' + r.status + ')' }); return; }
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader('content-type', r.headers.get('content-type') || 'application/octet-stream');
      res.status(200).send(buf);
      return;
    }
    res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 200) });
  }
}
