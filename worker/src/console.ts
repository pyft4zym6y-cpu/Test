/**
 * Консоль оператора — встроенная одностраничная панель аудитора. Асинхронный
 * запуск с живым логом, история прогонов, дашборд результата с метриками и
 * группировкой документов, скачивание единого .zip-пакета, ввод T2–T4
 * (ответы опросника и финпоказатели файлом). Self-contained (без внешних CDN).
 * Внутри страницы намеренно НЕТ обратных кавычек и ${...} — чтобы шаблонная
 * строка ниже собиралась безопасно.
 */
export const CONSOLE_HTML = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Аудитор Commerce OS</title><style>
:root{--bg:#0f1115;--panel:#171a21;--panel2:#1e222b;--line:#2a2f3a;--ink:#e8ecf3;--mut:#9aa4b2;--lime:#c7f24a;--lime2:#a9d92f;--red:#ff6b6b;--warn:#ffb454;--ok:#8fd14f;--shadow:0 6px 24px rgba(0,0,0,.28)}
:root[data-theme=light]{--bg:#f4f6fa;--panel:#ffffff;--panel2:#f0f3f8;--line:#e2e7ef;--ink:#161a22;--mut:#5c6675;--shadow:0 6px 20px rgba(20,30,50,.08)}
@media (prefers-color-scheme:light){:root:not([data-theme=dark]){--bg:#f4f6fa;--panel:#ffffff;--panel2:#f0f3f8;--line:#e2e7ef;--ink:#161a22;--mut:#5c6675;--shadow:0 6px 20px rgba(20,30,50,.08)}}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.top{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:14px 20px;background:var(--panel);border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:17px}
.dot{width:14px;height:14px;border-radius:4px;background:var(--lime);box-shadow:0 0 0 4px rgba(199,242,74,.18)}
.spacer{flex:1}
.pill{font-size:12px;font-weight:600;padding:6px 11px;border-radius:999px;border:1px solid var(--line);color:var(--mut);white-space:nowrap}
.pill.on{color:#12160a;background:var(--lime);border-color:var(--lime)}
.pill.off{color:var(--red);border-color:var(--red)}
.iconbtn{cursor:pointer;border:1px solid var(--line);background:var(--panel2);color:var(--ink);border-radius:9px;padding:7px 10px;font:inherit}
.wrap{max-width:1080px;margin:0 auto;padding:20px 18px 70px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:820px){.wrap{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:var(--shadow)}
.card h2{margin:0 0 4px;font-size:16px}.card .desc{color:var(--mut);font-size:13px;margin:0 0 14px}
.col-2{grid-column:1 / -1}
label{display:block;font-weight:600;margin:12px 0 5px;font-size:14px}.hint{color:var(--mut);font-weight:400;font-size:12px}
input,select,textarea{width:100%;background:var(--panel2);border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:10px 12px;font:inherit}
textarea{min-height:56px;resize:vertical}
.row{display:flex;gap:12px;flex-wrap:wrap}.row>div{flex:1;min-width:150px}
.chk{display:flex;align-items:center;gap:9px;margin-top:12px;font-weight:600}.chk input{width:auto}
button{cursor:pointer;border:0;border-radius:11px;padding:11px 18px;font:inherit;font-weight:700}
.primary{background:var(--lime);color:#12160a}.primary:hover{background:var(--lime2)}.primary:disabled{opacity:.5;cursor:default}
.ghost{background:var(--panel2);color:var(--ink);border:1px solid var(--line);font-weight:600}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:16px}
.status{font-size:13px;color:var(--mut)}.ok{color:var(--lime2)}.err{color:var(--red)}
details>summary{cursor:pointer;color:var(--mut);font-size:13px;margin-top:4px}
.log{background:#0c0f14;color:#cfe;border:1px solid var(--line);border-radius:10px;padding:12px;height:240px;overflow:auto;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap}
:root[data-theme=light] .log{background:#0f1420;color:#d8ffe0}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:4px 0 14px}
@media(max-width:520px){.tiles{grid-template-columns:repeat(2,1fr)}}
.tile{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px}
.tile .k{font-size:12px;color:var(--mut)}.tile .v{font-size:22px;font-weight:800;margin-top:3px}
.group{margin-top:12px}.group h4{margin:0 0 6px;font-size:13px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}
.files a{display:inline-flex;align-items:center;gap:6px;margin:5px 8px 0 0;color:var(--ink);text-decoration:none;border:1px solid var(--line);background:var(--panel2);border-radius:9px;padding:7px 11px;font-size:13px}
.files a:hover{border-color:var(--lime)}
.hist{list-style:none;margin:0;padding:0}
.hist li{display:flex;align-items:center;gap:10px;padding:10px 8px;border-bottom:1px solid var(--line);cursor:pointer;border-radius:8px}
.hist li:hover{background:var(--panel2)}
.badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid var(--line);color:var(--mut)}
.badge.done{color:#12160a;background:var(--ok);border-color:var(--ok)}.badge.running{color:#12160a;background:var(--warn);border-color:var(--warn)}.badge.error{color:#fff;background:var(--red);border-color:var(--red)}
.hidden{display:none}
.small{font-size:12px;color:var(--mut);margin-top:6px}
</style></head><body>
<div class="top">
  <div class="brand"><span class="dot"></span> Аудитор Commerce OS</div>
  <div class="spacer"></div>
  <span id="conn" class="pill off">нет связи</span>
  <button class="iconbtn" id="theme" title="Тема">◐</button>
</div>
<div class="wrap">

  <div class="card" id="setupCard">
    <h2>Подключение</h2>
    <p class="desc">Токен вводится один раз — хранится в этом браузере.</p>
    <label>Токен доступа <span class="hint">— значение AUDIT_SERVER_TOKEN</span></label>
    <input id="tok" type="password" placeholder="вставьте токен" autocomplete="off">
    <div class="bar"><button class="ghost" onclick="ping()">Проверить связь</button><span id="ping" class="status"></span></div>
  </div>

  <div class="card">
    <h2>Новый аудит</h2>
    <p class="desc">Заполните и запустите. Аудит идёт в фоне — можно следить за прогрессом.</p>
    <label>Сайт клиента <span class="hint">— напр. https://shop.example</span></label>
    <input id="site" type="url" placeholder="https://...">
    <label>Конкуренты <span class="hint">— по одному в строке, для T2+</span></label>
    <textarea id="comp" placeholder="https://rival-1.example&#10;https://rival-2.example"></textarea>
    <div class="row">
      <div><label>Тир</label><select id="tier">
        <option value="1">T1 — только сайт (негласный)</option>
        <option value="2">T2 — + конкуренты</option>
        <option value="3">T3 — 80%+ данных</option>
        <option value="4">T4 — живые доступы</option>
      </select></div>
      <div><label>Запрос <span class="hint">— что смотреть</span></label><input id="req" type="text" placeholder="где теряем деньги"></div>
    </div>
    <label class="chk"><input id="agentic" type="checkbox"> Агентный обход <span class="hint">— глубже, дольше</span></label>
    <details><summary>Из базы опросника (Supabase, если подключена)</summary>
      <label>ID клиента <span class="hint">— тянет ответы опросника из базы портала и пишет итог в report_meta</span></label>
      <input id="clientId" type="text" placeholder="uuid клиента (таблица clients)">
    </details>
    <details><summary>Данные для T2–T4 (Health Score и деньги)</summary>
      <label>Ответы опросника <span class="hint">— файл .json (карта вопрос→ответ)</span></label>
      <input id="answers" type="file" accept=".json,application/json">
      <label>Финансовые показатели <span class="hint">— файл .json (levers + extra)</span></label>
      <input id="baseline" type="file" accept=".json,application/json">
    </details>
    <details><summary>Проект без сайта (предзапуск)</summary>
      <label class="chk"><input id="pre" type="checkbox"> Сайта ещё нет / в разработке</label>
      <label>Бриф <span class="hint">— ниша, рынок, чек</span></label>
      <textarea id="brief" placeholder="Магазин эко-косметики, старт UA, чек ~900"></textarea>
    </details>
    <div class="bar"><button class="primary" id="go" onclick="run()">Запустить аудит</button><span id="run" class="status"></span></div>
  </div>

  <div class="card col-2 hidden" id="runCard">
    <h2>Прогон <span id="runBadge" class="badge running">идёт</span></h2>
    <p class="desc" id="runSub">Аудит выполняется в фоне. Это несколько минут.</p>
    <div class="log" id="log"></div>
  </div>

  <div class="card col-2 hidden" id="resultCard">
    <h2>Результат <span id="resTitle" class="hint"></span></h2>
    <div class="tiles" id="tiles"></div>
    <div class="bar"><button class="primary" id="zipBtn">Скачать пакет .zip</button><span class="small" id="resSummary"></span></div>
    <div id="docs"></div>
  </div>

  <div class="card col-2">
    <h2>История аудитов</h2>
    <p class="desc">Прошлые прогоны на этом сервере. Нажмите, чтобы открыть результат.</p>
    <ul class="hist" id="hist"></ul>
  </div>

</div>
<script>
var $=function(id){return document.getElementById(id)};
var TOK=function(){return ($('tok').value||'').trim()};
var poll=null, curJob=null;

// theme
(function(){var t=localStorage.getItem('audit_theme'); if(t)document.documentElement.setAttribute('data-theme',t);})();
$('theme').onclick=function(){var d=document.documentElement; var cur=d.getAttribute('data-theme'); var next=cur==='light'?'dark':'light'; d.setAttribute('data-theme',next); localStorage.setItem('audit_theme',next);};

$('tok').value=localStorage.getItem('audit_tok')||'';
$('tok').oninput=function(){localStorage.setItem('audit_tok',TOK())};

function hdr(){return {'content-type':'application/json','x-audit-token':TOK()}}
function setConn(on,txt){var p=$('conn'); p.textContent=txt; p.className='pill '+(on?'on':'off')}

function ping(){var s=$('ping'); s.textContent='проверяю…'; s.className='status';
  fetch('/health').then(function(r){return r.json()}).then(function(d){
    if(d&&d.ok){var k=(typeof d.knowledge==='number'?' · знаний: '+d.knowledge:''); var st=(d.store?' · база: подключена':''); s.textContent='на связи · ключ Claude: '+(d.hasKey?'есть':'НЕТ')+k+st; s.className='status ok'; setConn(true,'на связи'+(d.hasKey?'':' · без ключа'));}
    else{s.textContent='неожиданный ответ'; s.className='status err'; setConn(false,'ошибка');}
  }).catch(function(){s.textContent='нет связи'; s.className='status err'; setConn(false,'нет связи');});
}

function readJson(inp){return new Promise(function(res){var f=inp.files&&inp.files[0]; if(!f){res(null);return;} var r=new FileReader(); r.onload=function(){try{res(JSON.parse(r.result))}catch(e){res({__error:'файл '+f.name+' не JSON'})}}; r.onerror=function(){res(null)}; r.readAsText(f);});
}

function run(){
  var s=$('run'); if(!TOK()){s.textContent='введите токен'; s.className='status err'; return;}
  Promise.all([readJson($('answers')), readJson($('baseline'))]).then(function(a){
    var answers=a[0], baseline=a[1];
    if(answers&&answers.__error){s.textContent=answers.__error; s.className='status err'; return;}
    if(baseline&&baseline.__error){s.textContent=baseline.__error; s.className='status err'; return;}
    var body={tier:Number($('tier').value), site:$('site').value.trim(),
      competitors:$('comp').value.split('\\n').map(function(x){return x.trim()}).filter(Boolean),
      request:$('req').value.trim(), agentic:$('agentic').checked,
      prelaunch:$('pre').checked, brief:$('brief').value.trim(),
      clientId:$('clientId').value.trim(),
      answers:answers||null, baseline:baseline||null};
    if(!body.site&&!body.prelaunch){s.textContent='укажите сайт (или отметьте предзапуск)'; s.className='status err'; return;}
    $('go').disabled=true; s.textContent='ставлю в очередь…'; s.className='status';
    fetch('/audit',{method:'POST',headers:hdr(),body:JSON.stringify(body)}).then(function(r){return r.json()}).then(function(d){
      if(!d||!d.ok){$('go').disabled=false; s.textContent='ошибка: '+((d&&d.error)||'неизвестно'); s.className='status err'; return;}
      s.textContent='запущено'; s.className='status ok';
      $('resultCard').classList.add('hidden');
      $('runCard').classList.remove('hidden'); $('log').textContent='';
      watch(d.id);
    }).catch(function(e){$('go').disabled=false; s.textContent='сбой: '+e; s.className='status err';});
  });
}

function watch(id){ if(poll)clearInterval(poll);
  var tick=function(){ fetch('/job/'+id,{headers:hdr()}).then(function(r){return r.json()}).then(function(d){
      if(!d||!d.ok)return; var j=d.job;
      $('log').textContent=(j.log||[]).join('\\n'); $('log').scrollTop=$('log').scrollHeight;
      var b=$('runBadge');
      if(j.status==='done'){clearInterval(poll); poll=null; b.className='badge done'; b.textContent='готово'; $('go').disabled=false; showResult(j); loadHistory();}
      else if(j.status==='error'){clearInterval(poll); poll=null; b.className='badge error'; b.textContent='ошибка'; $('runSub').textContent='Ошибка: '+(j.error||''); $('go').disabled=false; loadHistory();}
      else {b.className='badge running'; b.textContent=(j.status==='queued'?'в очереди':'идёт');}
  }).catch(function(){}); };
  tick(); poll=setInterval(tick,1600);
}

function tile(k,v){return '<div class="tile"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>'}
function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₴'}

function showResult(j){ curJob=j;
  $('resultCard').classList.remove('hidden');
  $('resTitle').textContent=(j.client||'')+' · T'+j.tier;
  $('resSummary').textContent=j.summary||'';
  var m=j.metrics||{}; var t='';
  if(m.compliance!=null)t+=tile('Соответствие стандарту',m.compliance+'%');
  if(m.confidence)t+=tile('Confidence Score',m.confidence.score+'/'+m.confidence.base);
  if(m.health!=null)t+=tile('Health Score',m.health+'/100');
  if(m.benchmarkIndex!=null)t+=tile('Индекс vs рынок',m.benchmarkIndex+'/100');
  if(m.aqcFails!=null)t+=tile('Провалов AQC',String(m.aqcFails));
  if(m.potentialYear!=null)t+=tile('Недополучено/год',money(m.potentialYear));
  $('tiles').innerHTML=t||'<div class="small">Метрики появятся при наличии ключа/данных.</div>';
  var groups={}; (j.files||[]).forEach(function(f){ (groups[f.category]=groups[f.category]||[]).push(f); });
  var order=['Синтез','План и презентация','Таблицы (XLSX)','UX / дизайн','Конкуренты','Деньги','Отчёт и диагностика','Данные (JSON)','Прочее'];
  var html=''; order.forEach(function(g){ if(!groups[g])return; html+='<div class="group"><h4>'+g+'</h4><div class="files">';
    groups[g].forEach(function(f){ html+='<a href="'+f.url+'?t='+encodeURIComponent(TOK())+'">⬇ '+f.name+'</a>'; }); html+='</div></div>'; });
  $('docs').innerHTML=html;
  $('zipBtn').onclick=function(){ window.location='/job/'+j.id+'/pack.zip?t='+encodeURIComponent(TOK()); };
}

function loadHistory(){ fetch('/jobs',{headers:hdr()}).then(function(r){return r.json()}).then(function(d){
    if(!d||!d.ok)return; var ul=$('hist'); ul.innerHTML='';
    if(!d.jobs.length){ul.innerHTML='<li class="small">Пока пусто — запустите первый аудит.</li>'; return;}
    d.jobs.forEach(function(j){ var li=document.createElement('li');
      var when=j.finishedAt?new Date(j.finishedAt).toLocaleString('ru-RU'):'';
      li.innerHTML='<span class="badge '+j.status+'">'+(j.status==='done'?'готово':j.status==='error'?'ошибка':'идёт')+'</span>'+
        '<b>'+(j.client||'—')+'</b><span class="hint">T'+j.tier+'</span><span class="spacer"></span><span class="hint">'+when+'</span>';
      li.onclick=function(){ if(j.status==='done'){ fetch('/job/'+j.id,{headers:hdr()}).then(function(r){return r.json()}).then(function(dd){ if(dd&&dd.ok){showResult(dd.job); window.scrollTo({top:0,behavior:'smooth'});} }); } };
      ul.appendChild(li);
    });
  }).catch(function(){});
}

ping(); loadHistory();
</script></body></html>`;
