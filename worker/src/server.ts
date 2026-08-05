/**
 * HTTP-сервер аудитора — чтобы запускать аудит кнопкой из портала, без терминала.
 * Разворачивается один раз (Render/Railway/VPS), ключ Claude ставится в env сервера.
 *
 * Env:
 *   ANTHROPIC_API_KEY — ключ Claude (для анализа/материалов).
 *   AUDIT_SERVER_TOKEN — общий токен доступа (портал шлёт его в заголовке/квери).
 *   PORT — порт (по умолчанию 8787). AUDIT_OUT — папка результатов (results).
 *   AUDIT_MODEL — модель (по умолчанию claude-opus-5).
 *
 * Эндпоинты:
 *   GET  /health                — статус + есть ли ключ.
 *   POST /audit                 — тело JSON {tier,site,competitors,request,agentic,prelaunch,brief,answers,baseline}.
 *   GET  /result/:id/:file?t=…  — скачать готовый файл.
 */
import { createServer, type ServerResponse, type IncomingMessage } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { runAudit } from './pipeline.js';
import { hasKey } from './anthropic.js';

const TOKEN = process.env.AUDIT_SERVER_TOKEN || '';
const PORT = Number(process.env.PORT || 8787);
const OUT = process.env.AUDIT_OUT || 'results';

const MIME: Record<string, string> = {
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8',
};

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-audit-token');
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let b = ''; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 4_000_000) reject(new Error('body too large')); else b += c; });
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

  if (url.pathname === '/health') { json(res, 200, { ok: true, hasKey: hasKey() }); return; }

  const token = (req.headers['x-audit-token'] as string) || url.searchParams.get('t') || '';
  if (TOKEN && token !== TOKEN) { json(res, 401, { ok: false, error: 'Неверный токен доступа' }); return; }

  if (req.method === 'POST' && url.pathname === '/audit') {
    try {
      const opts = JSON.parse((await readBody(req)) || '{}');
      const r = await runAudit({ ...opts, out: OUT, log: (m) => console.log(m) });
      json(res, 200, { ok: true, id: r.id, summary: r.summary, files: r.files.map((f) => ({ name: f, url: `/result/${r.id}/${encodeURIComponent(f)}` })) });
    } catch (e) {
      json(res, 500, { ok: false, error: String(e).slice(0, 400) });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/result/')) {
    const [, , id, fileRaw] = url.pathname.split('/');
    const file = basename(decodeURIComponent(fileRaw || ''));
    try {
      const buf = await readFile(join(OUT, basename(id), file));
      cors(res);
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'content-disposition': `attachment; filename="${file}"` });
      res.end(buf);
    } catch {
      json(res, 404, { ok: false, error: 'Файл не найден' });
    }
    return;
  }

  json(res, 404, { ok: false, error: 'not found' });
});

// Аудит длинный (обход + агентный анализ) — снимаем таймауты соединения.
server.requestTimeout = 0;
server.headersTimeout = 0;
server.timeout = 0;
server.listen(PORT, () => console.log(`Аудит-сервер запущен на :${PORT} (ключ Claude: ${hasKey() ? 'есть' : 'НЕТ'})`));
