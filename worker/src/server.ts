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
import { readFile, readdir, writeFile, appendFile, stat, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { runAudit, type AuditMetrics } from './pipeline.js';
import { hasKey } from './anthropic.js';
import { knowledgeCount } from './knowledge.js';
import { CONSOLE_HTML } from './console.js';
import { catalogCards } from './experts/catalog.js';
import { makeZip } from './zip.js';
import { storeEnabled, getClientBundle, saveRun } from './store.js';

const TOKEN = process.env.AUDIT_SERVER_TOKEN || '';
const PORT = Number(process.env.PORT || 8787);
const OUT = process.env.AUDIT_OUT || 'results';

const MIME: Record<string, string> = {
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf', '.html': 'text/html; charset=utf-8',
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

// Стан джобів на диску — щоб рестарт воркера (редеплой) не губив прогін і не
// давав шторм 404. Пишемо в results/_jobs/<id>.json на кожному переході статусу
// + троттлінгом під час прогону; на старті відновлюємо.
const JOBS_DIR = join(OUT, '_jobs');
const lastPersist = new Map<string, number>();
async function persistJob(j: Job, throttleMs = 0): Promise<void> {
  if (throttleMs) { const now = Date.now(); if (now - (lastPersist.get(j.id) ?? 0) < throttleMs) return; lastPersist.set(j.id, now); }
  try { await mkdir(JOBS_DIR, { recursive: true }); await writeFile(join(JOBS_DIR, j.id + '.json'), JSON.stringify(persistView(j)), 'utf8'); } catch { /* best-effort */ }
}

function categorize(name: string): string {
  if (/-A0\.pdf$/i.test(name) || /Executive-Diagnostic|SEO-Architecture|Технический-аудит/i.test(name)) return 'Аудиты A0 (PDF)';
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

// Два архива на прогон:
//  • клиентский чистовой (pack.zip)      — только клиентские документы, без нашей кухни;
//  • внутренний полный  (pack-internal.zip) — всё, включая рабочие документы и JSON.
// Документ-артефакт = Word/Excel/PDF/PowerPoint.
const isDoc = (name: string) => /\.(pdf|docx|xlsx|pptx)$/i.test(name);
// Клиентский чистовой пакет = сгруппированные тематические документы (5 разделов +
// головний висновок, имена «1-…»…«5-…») + коммерческое предложение. Отдельные линзы
// (UX-UI-A0, SEO-…, Технический-… и т.д.) — это ВНУТРЕННИЙ разбор: они уходят только
// в наш полный архив, а клиент видит цельные разделы, а не 26 файлов.
const isThemeDoc = (name: string) => /^[1-5]-.+\.(pdf|docx)$/i.test(name);
const isProposal = (name: string) => /(коммерческое.?предложение|комерційна.?пропозиц|kp)\.(pdf|docx)$/i.test(name);
const isClientDoc = (name: string) => isDoc(name) && (isThemeDoc(name) || isProposal(name));

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
    void persistJob(job);
    const r = await runAudit({ ...(job.opts as any), out: OUT, log: (m: string) => { job.log.push(m); if (job.log.length > 800) job.log.shift(); void persistJob(job, 4000); } });
    job.resultId = r.id; job.summary = r.summary; job.metrics = r.metrics;
    job.files = r.files.filter(isClientDoc).map((n) => ({ name: n, url: `/result/${r.id}/${encodeURIComponent(n)}`, category: categorize(n) }));
    job.status = 'done'; job.finishedAt = Date.now();
    await writeFile(join(OUT, r.id, 'job.json'), JSON.stringify(persistView(job)), 'utf8').catch(() => {});
    void persistJob(job);
    if (job.clientId && storeEnabled()) {
      const ok = await saveRun(job.clientId, { runId: r.id, summary: r.summary, metrics: r.metrics, files: job.files.map((f) => ({ name: f.name, url: f.url })) });
      job.log.push(ok ? '· результат записан в карточку клиента (Supabase)' : '⚠️ не удалось записать результат в Supabase');
    }
  } catch (e) {
    job.status = 'error'; job.error = String(e).slice(0, 600); job.finishedAt = Date.now();
    void persistJob(job);
  } finally {
    job.opts = undefined; // не держим ответы/baseline в памяти дольше нужного
    running = false;
    setImmediate(processQueue);
  }
}

/** Восстановить джобы после рестарта (best-effort). Прерванный прогон помечаем
 *  ошибкой, а не оставляем в памяти отсутствующим — иначе портал ловит 404-шторм. */
async function loadHistory(): Promise<void> {
  // 1) Состояние джобов (_jobs): running/queued после рестарта → error (процесс мёртв).
  try {
    const files = await readdir(JOBS_DIR).catch(() => [] as string[]);
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try {
        const v = JSON.parse(await readFile(join(JOBS_DIR, f), 'utf8')) as Job;
        if (!v?.id) continue;
        if (v.status === 'running' || v.status === 'queued') {
          v.status = 'error'; v.error = 'Прогон прерван перезапуском воркера (редеплой) — запустите заново.'; v.finishedAt = Date.now();
          void persistJob(v);
        }
        jobs.set(v.id, { ...v, log: [] });
      } catch { /* битый файл — пропускаем */ }
    }
  } catch { /* noop */ }
  // 2) История завершённых из results/<id>/job.json — дополняет и вытесняет error, если прогон реально дошёл.
  try {
    const dirs = await readdir(OUT).catch(() => [] as string[]);
    for (const d of dirs) {
      if (d === '_jobs') continue;
      try {
        const v = JSON.parse(await readFile(join(OUT, d, 'job.json'), 'utf8')) as Job;
        if (v?.id && (!jobs.has(v.id) || jobs.get(v.id)!.status === 'error')) jobs.set(v.id, { ...v, log: [], resultId: v.resultId || d });
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
    // 30 МБ: обычный запрос крошечный, но резервный контур несёт base64 PDF со
    // скриншотами (лимит Anthropic для PDF — 32 МБ).
    req.on('data', (c) => { size += c.length; if (size > 30_000_000) reject(new Error('body too large')); else b += c; });
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

  // Чанк-загрузка резервных скриншотов: по одному файлу на запрос (чтобы не слать
  // 50 файлов одним огромным телом — прокси Railway рвёт большие запросы → «Failed to fetch»).
  if (req.method === 'POST' && path === '/upload') {
    try {
      const b = JSON.parse((await readBody(req)) || '{}');
      const batch = String(b.batch || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60);
      if (!batch || typeof b.data !== 'string' || !b.data.length) { json(res, 400, { ok: false, error: 'bad upload' }); return; }
      const type = typeof b.type === 'string' && b.type ? b.type : 'application/pdf';
      const ext = /pdf/i.test(type) ? 'pdf' : /png/i.test(type) ? 'png' : 'jpg';
      const seq = String(Math.max(0, Math.min(99, Number(b.seq) || 0))).padStart(2, '0');
      const part = Number(b.part) || 0; // индекс чанка файла (файл бьётся на куски)
      const dir = join(OUT, '_uploads', batch); await mkdir(dir, { recursive: true });
      const p = join(dir, `p${seq}.${ext}`);
      const bytes = Buffer.from(b.data.replace(/^data:[^;]+;base64,/, ''), 'base64');
      // part 0 — создаём/обнуляем файл, дальше дописываем куски. Так файл любого
      // размера собирается из мелких запросов (большой запрос прокси рвёт).
      if (part === 0) await writeFile(p, bytes); else await appendFile(p, bytes);
      json(res, 200, { ok: true });
    } catch (e) { json(res, 400, { ok: false, error: String(e).slice(0, 200) }); }
    return;
  }

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
      // Резервный контур: файлы-скриншоты (PDF/картинки) кладём на диск, а в opts
      // храним ПУТИ — иначе job.json раздувается на мегабайты и persist тормозит.
      const extOf = (mime: string) => /pdf/i.test(mime) ? 'pdf' : /png/i.test(mime) ? 'png' : 'jpg';
      const b64of = (s: string) => s.replace(/^data:[^;]+;base64,/, '');
      try {
        const upDir = join(OUT, '_uploads', id); await mkdir(upDir, { recursive: true });
        // Чанк-загрузка: файлы уже лежат в _uploads/<batch>/ — просто перечисляем.
        if (typeof opts.uploadBatch === 'string' && /^[a-z0-9-]{6,60}$/i.test(opts.uploadBatch)) {
          const bdir = join(OUT, '_uploads', opts.uploadBatch);
          const names = (await readdir(bdir).catch(() => [] as string[])).filter((n) => /\.(pdf|png|jpe?g)$/i.test(n)).sort();
          opts.backupFiles = names.slice(0, 50).map((n, i) => ({ path: join(bdir, n), type: /pdf$/i.test(n) ? 'application/pdf' : /png$/i.test(n) ? 'image/png' : 'image/jpeg', name: `Сторінка ${i + 1}` }));
        }
        // Инлайновый массив backupFiles [{name,type,data(dataURL)}] (мелкие наборы)
        else if (Array.isArray(opts.backupFiles) && opts.backupFiles.length) {
          const specs: { path: string; type: string; name?: string }[] = [];
          for (let i = 0; i < Math.min(opts.backupFiles.length, 50); i++) {
            const f = opts.backupFiles[i];
            if (!f || typeof f.data !== 'string' || f.data.length < 100) continue;
            const type = typeof f.type === 'string' && f.type ? f.type : (/^data:([^;]+)/.exec(f.data)?.[1] ?? 'application/pdf');
            const p = join(upDir, `p${String(i + 1).padStart(2, '0')}.${extOf(type)}`);
            await writeFile(p, Buffer.from(b64of(f.data), 'base64'));
            specs.push({ path: p, type, name: typeof f.name === 'string' ? f.name : `Сторінка ${i + 1}` });
          }
          opts.backupFiles = specs;
        }
        // Совместимость: одиночный backupPdf (base64) → тоже файл.
        if (typeof opts.backupPdf === 'string' && opts.backupPdf.length > 200) {
          const p = join(upDir, 'single.pdf');
          await writeFile(p, Buffer.from(b64of(opts.backupPdf), 'base64'));
          opts.backupPdf = p;
        }
      } catch (e) { delete opts.backupFiles; delete opts.backupPdf; }
      const client = (() => { try { return opts.prelaunch ? 'предзапуск' : new URL(opts.site).hostname.replace(/^www\./, ''); } catch { return bundleName || opts.site || clientId || '—'; } })();
      const job: Job = { id, client, tier: Number(opts.tier ?? 1), status: 'queued', startedAt: Date.now(), log: [], opts, clientId: clientId || undefined };
      jobs.set(id, job);
      void persistJob(job);
      queue.push(id);
      setImmediate(processQueue);
      json(res, 200, { ok: true, id });
    } catch (e) { json(res, 400, { ok: false, error: String(e).slice(0, 300) }); }
    return;
  }

  // Список прогонов (история)
  // Каталог премиум-агентов (перечень для тумблера «Премиум-экспертиза» в UI)
  if (req.method === 'GET' && path === '/experts') {
    json(res, 200, { ok: true, experts: catalogCards() });
    return;
  }

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

  // Zip-пакеты прогона: pack.zip — клиентский чистовой; pack-internal.zip — наш полный.
  const zm = path.match(/^\/job\/([^/]+)\/pack(-internal)?\.zip$/);
  if (req.method === 'GET' && zm) {
    const internal = Boolean(zm[2]);
    const j = jobs.get(zm[1]);
    if (!j || !j.resultId) { json(res, 404, { ok: false, error: 'пакет недоступен' }); return; }
    try {
      const dir = join(OUT, basename(j.resultId));
      // Клиентский: только клиентские документы. Внутренний: все документы + JSON-данные.
      const keep = (n: string) => !n.startsWith('.') && (internal ? (isDoc(n) || /\.json$/i.test(n)) : isClientDoc(n));
      const names = (await readdir(dir)).filter(keep);
      const entries = [];
      for (const n of names) { const st = await stat(join(dir, n)).catch(() => null); if (st && st.isFile()) entries.push({ name: n, data: await readFile(join(dir, n)) }); }
      const zip = makeZip(entries);
      cors(res);
      res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="audit-${basename(j.resultId)}${internal ? '-internal' : ''}.zip"` });
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
