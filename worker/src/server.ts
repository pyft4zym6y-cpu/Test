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
import { knowledgeCount } from './knowledge.js';

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

// Встроенная админ-страница: открываешь адрес сервера в браузере — форма с
// кнопкой «Запустить аудит», без отдельного портала/хостинга. Self-contained.
const PAGE = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Аудитор Commerce OS</title><style>
:root{--bg:#0f1115;--card:#171a21;--line:#262b36;--ink:#e8ecf3;--mut:#9aa4b2;--lime:#c7f24a;--lime2:#a9d92f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:28px 18px 60px}
h1{font-size:22px;margin:0 0 4px}.sub{color:var(--mut);margin:0 0 22px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:0 0 16px}
label{display:block;font-weight:600;margin:12px 0 5px}.hint{color:var(--mut);font-weight:400;font-size:13px}
input,select,textarea{width:100%;background:#0d1016;border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px 12px;font:inherit}
textarea{min-height:64px;resize:vertical}
.row{display:flex;gap:12px;flex-wrap:wrap}.row>div{flex:1;min-width:180px}
.chk{display:flex;align-items:center;gap:9px;margin-top:12px;font-weight:600}.chk input{width:auto}
button{cursor:pointer;border:0;border-radius:10px;padding:11px 18px;font:inherit;font-weight:700}
.primary{background:var(--lime);color:#12160a}.primary:hover{background:var(--lime2)}
.ghost{background:#0d1016;color:var(--ink);border:1px solid var(--line);font-weight:600}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:16px}
.status{font-size:13px;color:var(--mut)}.ok{color:var(--lime)}.err{color:#ff6b6b}
.files a{display:inline-block;margin:6px 10px 0 0;color:var(--lime);text-decoration:none;border:1px solid var(--line);border-radius:9px;padding:8px 12px}
.files a:hover{border-color:var(--lime)}
.hidden{display:none}.small{font-size:13px;color:var(--mut);margin-top:6px}
details{margin-top:6px}summary{cursor:pointer;color:var(--mut)}
</style></head><body><div class="wrap">
<h1>Аудитор Commerce OS</h1><p class="sub">Внутренняя панель. Введите токен один раз — сохранится в этом браузере.</p>

<div class="card">
  <label>Токен доступа <span class="hint">— значение AUDIT_SERVER_TOKEN с сервера</span></label>
  <input id="tok" type="password" placeholder="вставьте токен" autocomplete="off">
  <div class="bar"><button class="ghost" onclick="ping()">Проверить связь</button><span id="ping" class="status"></span></div>
</div>

<div class="card">
  <label>Сайт клиента <span class="hint">— напр. https://shop.example</span></label>
  <input id="site" type="url" placeholder="https://...">
  <label>Сайты конкурентов <span class="hint">— по одному в строке, необязательно</span></label>
  <textarea id="comp" placeholder="https://rival-1.example&#10;https://rival-2.example"></textarea>
  <div class="row">
    <div><label>Тир (полнота данных)</label>
      <select id="tier">
        <option value="1">T1 — только сайт (негласный аудит)</option>
        <option value="2">T2 — + конкуренты / частичные ответы</option>
        <option value="3">T3 — 80%+ данных</option>
        <option value="4">T4 — живые доступы</option>
      </select></div>
    <div><label>Вольный запрос <span class="hint">— что смотреть</span></label>
      <input id="req" type="text" placeholder="смотрите, анализируйте, где теряем деньги"></div>
  </div>
  <label class="chk"><input id="agentic" type="checkbox"> Агентный обход <span class="hint">— Claude сам добирает факты (дольше, глубже)</span></label>
  <details><summary>Проект без сайта (предзапуск)</summary>
    <label class="chk"><input id="pre" type="checkbox"> Сайта ещё нет / в разработке</label>
    <label>Бриф <span class="hint">— ниша, рынок, средний чек</span></label>
    <textarea id="brief" placeholder="Магазин эко-косметики, старт UA, чек ~900₴"></textarea>
  </details>
  <div class="bar"><button class="primary" onclick="run()" id="go">Запустить аудит</button><span id="run" class="status"></span></div>
  <div class="small">Аудит идёт несколько минут (обход сайта + анализ). Не закрывайте вкладку.</div>
  <div id="files" class="files"></div>
</div>

<script>
var $=function(id){return document.getElementById(id)};
$('tok').value=localStorage.getItem('audit_tok')||'';
$('tok').oninput=function(){localStorage.setItem('audit_tok',$('tok').value.trim())};
function ping(){var s=$('ping');s.textContent='проверяю…';s.className='status';
  fetch('/health').then(function(r){return r.json()}).then(function(d){
    if(d&&d.ok){s.textContent='сервер на связи · ключ Claude: '+(d.hasKey?'есть ✓':'НЕТ ✗')+(typeof d.knowledge==='number'?' · пакетов знаний: '+d.knowledge:'');s.className='status ok'}
    else{s.textContent='сервер ответил, но статус неожиданный';s.className='status err'}
  }).catch(function(){s.textContent='нет связи с сервером';s.className='status err'})}
function run(){
  var tok=$('tok').value.trim();var s=$('run');$('files').innerHTML='';
  if(!tok){s.textContent='сначала введите токен';s.className='status err';return}
  var body={tier:Number($('tier').value),site:$('site').value.trim(),
    competitors:$('comp').value.split('\\n').map(function(x){return x.trim()}).filter(Boolean),
    request:$('req').value.trim(),agentic:$('agentic').checked,
    prelaunch:$('pre').checked,brief:$('brief').value.trim()};
  if(!body.site&&!body.prelaunch){s.textContent='укажите сайт (или отметьте «сайта ещё нет»)';s.className='status err';return}
  $('go').disabled=true;s.textContent='аудит идёт… это несколько минут';s.className='status';
  fetch('/audit',{method:'POST',headers:{'content-type':'application/json','x-audit-token':tok},body:JSON.stringify(body)})
    .then(function(r){return r.json()}).then(function(d){
      $('go').disabled=false;
      if(!d||!d.ok){s.textContent='ошибка: '+((d&&d.error)||'неизвестно');s.className='status err';return}
      s.textContent='готово ✓';s.className='status ok';
      var h='<div style="margin-top:12px;color:var(--mut)">'+(d.summary||'')+'</div>';
      (d.files||[]).forEach(function(f){h+='<a href="'+f.url+'?t='+encodeURIComponent(tok)+'">⬇ '+f.name+'</a>'});
      $('files').innerHTML=h;
    }).catch(function(e){$('go').disabled=false;s.textContent='сбой запроса: '+e;s.className='status err'})}
</script></div></body></html>`;

const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/health') { json(res, 200, { ok: true, hasKey: hasKey(), knowledge: await knowledgeCount() }); return; }

  // Встроенная админ-панель (форма запуска аудита) — открывается в браузере.
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/admin')) {
    cors(res); res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(PAGE); return;
  }

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
// Слушаем на 0.0.0.0 — иначе прокси хостинга (Railway) не достучится до контейнера
// («Application failed to respond»), даже если порт совпадает.
server.listen(PORT, '0.0.0.0', () => console.log(`Аудит-сервер запущен на 0.0.0.0:${PORT} (ключ Claude: ${hasKey() ? 'есть' : 'НЕТ'})`));
