/**
 * HTTP-сервер аудитора с консолью оператора. Асинхронные прогоны (очередь),
 * живой лог, история, дашборд-метрики, единый .zip-пакет, ввод T2–T4 файлом.
 *
 * Env: ANTHROPIC_API_KEY, AUDIT_SERVER_TOKEN, PORT (8787), AUDIT_OUT (results), AUDIT_MODEL.
 *
 * Эндпоинты:
 *   GET  /                       — консоль оператора (HTML).
 *   GET  /health                 — статус + ключ + число пакетов знаний.
 *   POST /audit                  — ставит прогон в очередь, отдаёт {id}.
 *   GET  /jobs                   — список прогонов (история).
 *   GET  /job/:id                — статус/лог/метрики/файлы прогона.
 *   GET  /job/:id/pack.zip?t=…   — единый пакет документов прогона.
 *   GET  /result/:id/:file?t=…   — скачать один файл.
 */
import { createServer, type ServerResponse, type IncomingMessage } from 'node:http';
import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { runAudit, type AuditMetrics } from './pipeline.js';
import { hasKey } from './anthropic.js';
import { knowledgeCount } from './knowledge.js';
import { CONSOLE_HTML } from './console.js';
import { makeZip } from './zip.js';
import { storeEnabled, getClientBundle, saveRun } from './store.js';

const TOKEN = process.env.AUDIT_SERVER_TOKEN || '';
const PORT = Number(process.env.PORT || 8787);
const OUT = process.env.AUDIT_OUT || 'results';

const MIME: Record<string, string> = {
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8',
};

type FileRef = { name: string; url: string; category: string };
type Job = {
  id: string; client: string; tier: number; status: 'queued' | 'running' | 'done' | 'error';
  startedAt: number; finishedAt?: number; log: string[]; summary?: string;
  metrics?: AuditMetrics; resultId?: string; files?: FileRef[]; error?: string;
  opts?: Record<string, unknown>; clientId?: string;
};

const jobs = new Map<string, Job>();
const queue: string[] = [];
let running = false;

function categorize(name: string): string {
  if (/Синтез|synthesis/i.test(name)) return 'Синтез';
  if (/\.xlsx$/i.test(name) || /ЕКП/i.test(name)) return 'Таблицы (XLSX)';
  if (/AD-15|roadmap|Scope-|Матрица|дорожн|Коммерческое|КП/i.test(name)) return 'План и презентация';
  if (/UX-UI|Эталон|prototype|uxui/i.test(name)) return 'UX / дизайн';
  if (/Конкурент|benchmark/i.test(name)) return 'Конкуренты';
  if (/money|деньг|Причинно|Цена-в-канале/i.test(name)) return 'Деньги';
  if (/audit-report|L0-report|Реестр|Охват|hypoth|coverage|analysis/i.test(name)) return 'Отчёт и диагностика';
  if (/\.json$/i.test(name)) return 'Данные (JSON)';
  return 'Прочее';
}

const persistView = (j: Job) => ({ id: j.id, client: j.client, tier: j.tier, status: j.status, startedAt: j.startedAt, finishedAt: j.finishedAt, summary: j.summary, metrics: j.metrics, resultId: j.resultId, files: j.files });

async function processQueue(): Promise<void> {
  if (running) return;
  const id = queue.shift();
  if (!id) return;
  const job = jobs.get(id);
  if (!job) { setImmediate(processQueue); return; }
  running = true;
  try {
    job.status = 'running';
    const r = await runAudit({ ...(job.opts as any), out: OUT, log: (m: string) => { job.log.push(m); if (job.log.length > 800) job.log.shift(); } });
    job.resultId = r.id; job.summary = r.summary; job.metrics = r.metrics;
    job.files = r.files.filter((n) => n !== 'job.json').map((n) => ({ name: n, url: `/result/${r.id}/${encodeURIComponent(n)}`, category: categorize(n) }));
    job.status = 'done'; job.finishedAt = Date.now();
    await writeFile(join(OUT, r.id, 'job.json'), JSON.stringify(persistView(job)), 'utf8').catch(() => {});
    if (job.clientId && storeEnabled()) {
      const ok = await saveRun(job.clientId, { runId: r.id, summary: r.summary, metrics: r.metrics, files: job.files.map((f) => ({ name: f.name, url: f.url })) });
      job.log.push(ok ? '· результат записан в карточку клиента (Supabase)' : '⚠️ не удалось записать результат в Supabase');
    }
  } catch (e) {
    job.status = 'error'; job.error = String(e).slice(0, 600); job.finishedAt = Date.now();
  } finally {
    job.opts = undefined; // не держим ответы/baseline в памяти дольше нужного
    running = false;
    setImmediate(processQueue);
  }
}

/** Восстановить историю из results/<id>/job.json (best-effort, после рестарта). */
async function loadHistory(): Promise<void> {
  try {
    const dirs = await readdir(OUT).catch(() => [] as string[]);
    for (const d of dirs) {
      try {
        const raw = await readFile(join(OUT, d, 'job.json'), 'utf8');
        const v = JSON.parse(raw) as Job;
        if (v && v.id && !jobs.has(v.id)) jobs.set(v.id, { ...v, log: [], resultId: v.resultId || d });
      } catch { /* нет job.json — пропускаем */ }
    }
  } catch { /* noop */ }
}

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-audit-token');
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let b = ''; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 8_000_000) reject(new Error('body too large')); else b += c; });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

const json = (res: ServerResponse, code: number, obj: unknown) => {
  cors(res); res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj));
};

const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;

  if (path === '/health') { json(res, 200, { ok: true, hasKey: hasKey(), knowledge: await knowledgeCount(), store: storeEnabled() }); return; }
  if (req.method === 'GET' && (path === '/' || path === '/admin')) { cors(res); res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(CONSOLE_HTML); return; }

  // ниже — только по токену
  const token = (req.headers['x-audit-token'] as string) || url.searchParams.get('t') || '';
  if (TOKEN && token !== TOKEN) { json(res, 401, { ok: false, error: 'Неверный токен доступа' }); return; }

  // Поставить прогон в очередь
  if (req.method === 'POST' && path === '/audit') {
    try {
      const opts = JSON.parse((await readBody(req)) || '{}');
      const clientId = typeof opts.clientId === 'string' ? opts.clientId.trim() : '';
      // Коннектор: если задан clientId — дотягиваем ответы опросника из базы портала.
      let bundleName: string | undefined;
      if (clientId && storeEnabled()) {
        const b = await getClientBundle(clientId);
        if (b) { opts.answers = opts.answers || b.answers; bundleName = b.name; }
      }
      const id = randomUUID();
      const client = (() => { try { return opts.prelaunch ? 'предзапуск' : new URL(opts.site).hostname.replace(/^www\./, ''); } catch { return bundleName || opts.site || clientId || '—'; } })();
      const job: Job = { id, client, tier: Number(opts.tier ?? 1), status: 'queued', startedAt: Date.now(), log: [], opts, clientId: clientId || undefined };
      jobs.set(id, job);
      queue.push(id);
      setImmediate(processQueue);
      json(res, 200, { ok: true, id });
    } catch (e) { json(res, 400, { ok: false, error: String(e).slice(0, 300) }); }
    return;
  }

  // Список прогонов (история)
  if (req.method === 'GET' && path === '/jobs') {
    const list = Array.from(jobs.values()).sort((a, b) => b.startedAt - a.startedAt).slice(0, 40)
      .map((j) => ({ id: j.id, client: j.client, tier: j.tier, status: j.status, startedAt: j.startedAt, finishedAt: j.finishedAt, summary: j.summary }));
    json(res, 200, { ok: true, jobs: list });
    return;
  }

  // Статус одного прогона
  const jm = path.match(/^\/job\/([^/]+)$/);
  if (req.method === 'GET' && jm) {
    const j = jobs.get(jm[1]);
    if (!j) { json(res, 404, { ok: false, error: 'прогон не найден' }); return; }
    json(res, 200, { ok: true, job: { id: j.id, client: j.client, tier: j.tier, status: j.status, startedAt: j.startedAt, finishedAt: j.finishedAt, log: j.log, summary: j.summary, metrics: j.metrics, files: j.files, error: j.error } });
    return;
  }

  // Единый zip-пакет прогона
  const zm = path.match(/^\/job\/([^/]+)\/pack\.zip$/);
  if (req.method === 'GET' && zm) {
    const j = jobs.get(zm[1]);
    if (!j || !j.resultId) { json(res, 404, { ok: false, error: 'пакет недоступен' }); return; }
    try {
      const dir = join(OUT, basename(j.resultId));
      const names = (await readdir(dir)).filter((n) => n !== 'job.json' && !n.startsWith('.'));
      const entries = [];
      for (const n of names) { const st = await stat(join(dir, n)).catch(() => null); if (st && st.isFile()) entries.push({ name: n, data: await readFile(join(dir, n)) }); }
      const zip = makeZip(entries);
      cors(res);
      res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="audit-${basename(j.resultId)}.zip"` });
      res.end(zip);
    } catch (e) { json(res, 500, { ok: false, error: String(e).slice(0, 300) }); }
    return;
  }

  // Скачать один файл
  if (req.method === 'GET' && path.startsWith('/result/')) {
    const [, , id, fileRaw] = path.split('/');
    const file = basename(decodeURIComponent(fileRaw || ''));
    try {
      const buf = await readFile(join(OUT, basename(id), file));
      cors(res);
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'content-disposition': `attachment; filename="${encodeURIComponent(file)}"` });
      res.end(buf);
    } catch { json(res, 404, { ok: false, error: 'Файл не найден' }); }
    return;
  }

  json(res, 404, { ok: false, error: 'not found' });
});

server.requestTimeout = 0; server.headersTimeout = 0; server.timeout = 0;
loadHistory().finally(() => {
  server.listen(PORT, '0.0.0.0', () => console.log(`Аудит-сервер (консоль) на 0.0.0.0:${PORT} · ключ Claude: ${hasKey() ? 'есть' : 'НЕТ'} · прогонов в истории: ${jobs.size}`));
});
