/**
 * HTML-отчёт UX/UI Audit A0 по визуальному стандарту A0 (Commerce OS):
 * A4, PDF — основной носитель; одна страница = одна мысль; заголовок = вывод;
 * статусные цвета только для severity; скриншот ↔ эталон; Coverage Map (A0 §15).
 * Рендерится в PDF уже установленным Chromium (pdf.ts).
 */
import type { SiteAuditReport, PageReport, BlockRow, BlockState } from '../pagereport.js';
import { DIMS, type Dim } from '../pagereport.js';

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STATE_MARK: Record<BlockState, string> = { ok: '✓', check: '◐', gap: '✕' };
const STATE_CLS: Record<BlockState, string> = { ok: 'ok', check: 'check', gap: 'gap' };
const STATE_WORD: Record<BlockState, string> = { ok: 'есть', check: 'проверить', gap: 'нет' };

const dimBadges = (dims: Dim[]) => dims.map((d) => `<span class="dim" title="${esc(DIMS[d])}">${d}</span>`).join('');

function scoreColor(pct: number): string {
  if (pct >= 70) return 'ok';
  if (pct >= 45) return 'check';
  return 'gap';
}

function treeSection(r: SiteAuditReport): string {
  const rows = r.tree.map((t) => {
    const cls = scoreColor(t.pct);
    return `<tr>
      <td class="tree-name">${esc(t.title)}</td>
      <td class="tree-url">${esc(t.url.replace(/^https?:\/\//, ''))}</td>
      <td class="tree-bar"><span class="bar"><i class="fill ${cls}" style="width:${t.pct}%"></i></span></td>
      <td class="tree-score ${cls}">${t.max ? `${t.score}/${t.max}` : '—'}</td>
      <td class="tree-pct ${cls}">${t.pct}%</td>
    </tr>`;
  }).join('');
  return `<section class="block tree">
    <h2>Дерево сайта: где рвётся путь клиента</h2>
    <p class="lead">Постраничная оценка соответствия эталонной композиции. Цвет — severity, не украшение.</p>
    <table class="tree-table"><thead><tr><th>Тип страницы</th><th>URL</th><th>Соответствие эталону</th><th>Балл</th><th>%</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3">Итого по разобранным страницам</td><td class="${scoreColor(r.totalPct)}">${r.totalScore}/${r.totalMax}</td><td class="${scoreColor(r.totalPct)}">${r.totalPct}%</td></tr></tfoot></table>
  </section>`;
}

function pageTypesSection(r: SiteAuditReport): string {
  if (!r.pageTypes.length) return '';
  const cls = (s: string) => (s === 'разобрана' ? 'ok' : s === 'найдена' ? 'check' : s === 'не найдена' ? 'gap' : '');
  const mark = (s: string) => (s === 'разобрана' ? '✓' : s === 'найдена' ? '◐' : s === 'не найдена' ? '✕' : '○');
  const row = (t: SiteAuditReport['pageTypes'][number]) => `<tr>
    <td class="pt-name">${esc(t.label)}</td>
    <td class="pt-st ${cls(t.status)}">${mark(t.status)} ${esc(t.status)}</td>
    <td class="pt-url">${t.url ? esc(t.url.replace(/^https?:\/\//, '')) : '—'}</td>
  </tr>`;
  const mand = r.pageTypes.filter((t) => t.mandatory);
  const varr = r.pageTypes.filter((t) => !t.mandatory);
  const missing = mand.filter((t) => t.status === 'не найдена').length;
  return `<section class="block"><h2>Карта уникальных страниц: обязательные и переменные</h2>
    <p class="lead">Правило: карта строится из sitemap + ссылок обхода + активной пробы стандартных адресов; разбирается представитель каждого типа. ${missing ? `<b class="gap">Не найдено обязательных страниц: ${missing}</b> — это находки аудита.` : 'Все обязательные страницы найдены.'}${r.soft404 === true ? ' <b class="gap">Несуществующие URL отдают 200 («мягкая 404»).</b>' : ''}</p>
    <div class="pt-grid">
      <div><h3>Обязательные (100% должны быть)</h3><table><thead><tr><th>Страница</th><th>Статус</th><th>URL</th></tr></thead><tbody>${mand.map(row).join('')}</tbody></table></div>
      <div><h3>Переменные (по модели бизнеса)</h3><table><thead><tr><th>Страница</th><th>Статус</th><th>URL</th></tr></thead><tbody>${varr.map(row).join('')}</tbody></table></div>
    </div></section>`;
}

function pageSection(p: PageReport): string {
  const blockRows = p.rows.map((b: BlockRow, i: number) => `<tr class="row-${STATE_CLS[b.state]}">
    <td class="b-name"><span class="b-num">${String(i + 1).padStart(2, '0')}</span>${esc(b.name)}<span class="b-weight ${b.weight}">${b.weight === 'core' ? 'ядро' : b.weight === 'important' ? 'важно' : 'опц.'}</span><span class="b-dims">${dimBadges(b.dims)}</span></td>
    <td class="b-now"><span class="st ${STATE_CLS[b.state]}">${STATE_MARK[b.state]}</span> ${esc(b.now)}</td>
    <td class="b-should">${esc(b.should)}</td>
    <td class="b-score ${STATE_CLS[b.state]}">${b.score}/${b.max}<span class="b-word">${esc(b.wordVerdict)}</span></td>
  </tr>`).join('');
  const pct = p.max ? Math.round((p.score / p.max) * 100) : 0;
  const anns = (p.annotations ?? []).map((a, i) => `<span class="ann ${a.tone}" style="left:${(a.x / 1366 * 100).toFixed(1)}%;top:${(a.y / 900 * 100).toFixed(1)}%;width:${(a.w / 1366 * 100).toFixed(1)}%;height:${(a.h / 900 * 100).toFixed(1)}%"><b>${i + 1}</b></span>`).join('');
  const annLegend = (p.annotations ?? []).length ? `<div class="ann-legend">${p.annotations.map((a, i) => `<span class="lg ${a.tone}">${i + 1} ${esc(a.label)}</span>`).join('')}</div>` : '';
  const shot = p.screenshot
    ? `<figure class="shot"><div class="shot-wrap"><img src="data:image/jpeg;base64,${p.screenshot}" alt="Первый экран ${esc(p.title)}"/>${anns}</div><figcaption>Текущий первый экран · ${esc(p.url.replace(/^https?:\/\//, ''))}</figcaption>${annLegend}</figure>`
    : `<div class="shot noshot">Скриншот первого экрана недоступен (обход без скриншотов)</div>`;
  const fixes = p.fixes.length ? `<div class="fixes"><h3>Приоритет доработок</h3><table class="fix-table"><tbody>${
    p.fixes.slice(0, 6).map((f, i) => `<tr><td class="fx-n">${i + 1}</td><td class="fx-what">${esc(f.what)}</td><td class="fx-crit ${f.crit === 'Блокирующая' ? 'gap' : f.crit === 'Высокая' ? 'check' : ''}">${f.crit}</td><td class="fx-why">${esc(f.why)}</td></tr>`).join('')
  }</tbody></table></div>` : '';
  const reqs = p.requirements.length ? `<div class="reqs"><h3>Сквозные требования</h3><table class="req-table"><thead><tr><th>Измерения</th><th>Требование</th><th>Почему</th></tr></thead><tbody>${
    p.requirements.map((q) => `<tr><td class="rq-dims">${dimBadges(q.dims)}</td><td class="rq-req">${esc(q.req)}</td><td class="rq-why">${esc(q.why)}</td></tr>`).join('')
  }</tbody></table></div>` : '';
  const strong = p.strong.length ? `<div class="strong"><b>Сделано сильно:</b> ${p.strong.map(esc).join(' · ')}</div>` : '';
  return `<section class="block page">
    <div class="page-head">
      <div class="page-kicker">UX/UI · ${esc(p.title)} · эталон ${esc(p.chapter)}</div>
      <h2>${esc(p.conclusion)}</h2>
      ${p.principle ? `<p class="principle">Принцип эталона: ${esc(p.principle)}</p>` : ''}
    </div>
    <div class="page-grid">
      <div class="page-left">${shot}</div>
      <div class="page-right">
        <div class="counts">
          <span class="cnt ok"><b>${p.counts.ok}</b> есть</span>
          <span class="cnt check"><b>${p.counts.check}</b> проверить</span>
          <span class="cnt gap"><b>${p.counts.gap}</b> нет</span>
          <span class="cnt total"><b>${p.score}/${p.max}</b> · ${pct}%</span>
        </div>
        ${strong}
      </div>
    </div>
    <table class="block-table"><thead><tr><th>Блок эталона</th><th>Что сейчас</th><th>Что должно быть (эталон)</th><th>Оценка</th></tr></thead><tbody>${blockRows}</tbody></table>
    ${reqs}
    ${fixes}
  </section>`;
}

function systemicSection(r: SiteAuditReport): string {
  if (!r.systemic.length) return '';
  const items = r.systemic.map((s) => `<li><b>${esc(s.title)}.</b> ${esc(s.detail)} <span class="s-dims">${dimBadges(s.dims)}</span></li>`).join('');
  return `<section class="block systemic">
    <h2>Системные дефекты: живут в шаблоне, а не на странице</h2>
    <p class="lead">Проявляются на всех разобранных страницах — правятся один раз, эффект на всём сайте.</p>
    <ul class="sys-list">${items}</ul>
  </section>`;
}

export function renderAuditHtml(r: SiteAuditReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const cov = r.tree.length;
  const cover = `<section class="cover">
    <div class="cov-bar"></div>
    <div class="cov-body">
      <div class="kicker">Commerce OS · UX/UI Аудит · слой A0 (внешний срез)</div>
      <h1>${esc(r.verdict)}</h1>
      <div class="cov-meta">
        <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
        <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
        <div><span class="lbl">Тир</span><span class="val">T${r.tier}</span></div>
      </div>
      <div class="cov-score">
        <div class="big ${scoreColor(r.totalPct)}">${r.totalPct}<span>%</span></div>
        <div class="big-cap">соответствие эталону · ${r.totalScore}/${r.totalMax} по ${cov} типам страниц</div>
      </div>
      ${r.warning ? `<div class="coverage" style="border-left-color:var(--gap);margin-bottom:8px"><b>⚠ Пробел покрытия.</b> ${esc(r.warning)}</div>` : ''}
      <div class="coverage">
        <b>Coverage Map (A0):</b> разобрано типов страниц — ${cov}. Слой A0 — внешний обход без доступов:
        оценки «наблюдение», не факт по данным клиента. «Не обнаружено» ≠ «отсутствует» (возможны скрытые блоки/JS/табы) — такие помечены «проверить».
        Фактическое влияние на конверсию/выручку не утверждается без аналитики (A2).
      </div>
    </div>
  </section>`;
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
  :root{--ink:#12161C;--muted:#5A6472;--line:#E4E7EC;--lime:#65A30D;--ok:#16a34a;--check:#d97706;--gap:#dc2626;--bg:#fff;--soft:#F7F8FA;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;color:var(--ink);background:var(--bg);font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.45;}
  @page{size:A4;margin:14mm 12mm;}
  h1{font-size:30px;line-height:1.15;margin:0 0 18px;font-weight:800;letter-spacing:-.5px;}
  h2{font-size:17px;margin:0 0 6px;font-weight:800;letter-spacing:-.2px;}
  h3{font-size:12px;margin:10px 0 4px;font-weight:700;}
  .lead{color:var(--muted);margin:0 0 8px;font-size:10.5px;}
  .ok{color:var(--ok);} .check{color:var(--check);} .gap{color:var(--gap);}
  .block{padding:10px 0 4px;border-top:1px solid var(--line);}
  .block h2{page-break-after:avoid;}
  .page{page-break-before:always;}
  /* cover */
  .cover{position:relative;min-height:250mm;padding:0;page-break-after:always;}
  .cov-bar{position:absolute;left:0;top:0;width:8px;height:100%;background:var(--lime);}
  .cov-body{padding:24px 6px 0 20px;}
  .kicker,.page-kicker{color:var(--lime);font-weight:700;text-transform:uppercase;letter-spacing:.6px;font-size:10px;margin-bottom:14px;}
  .cov-meta{display:flex;gap:34px;margin:22px 0 30px;}
  .cov-meta .lbl{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.5px;}
  .cov-meta .val{display:block;font-size:15px;font-weight:700;}
  .cov-score{display:flex;align-items:baseline;gap:16px;margin:8px 0 26px;}
  .cov-score .big{font-size:64px;font-weight:800;line-height:1;letter-spacing:-2px;}
  .cov-score .big span{font-size:26px;}
  .big-cap{color:var(--muted);font-size:12px;}
  .coverage{background:var(--soft);border-left:3px solid var(--lime);padding:12px 14px;border-radius:0 6px 6px 0;font-size:10px;color:#333;max-width:150mm;}
  /* tree */
  .tree-table,.block-table,.fix-table{width:100%;border-collapse:collapse;}
  .tree-table th,.tree-table td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:middle;}
  .tree-table th{font-size:9px;text-transform:uppercase;color:var(--muted);letter-spacing:.4px;}
  .tree-name{font-weight:700;} .tree-url{color:var(--muted);font-size:9.5px;}
  .tree-score,.tree-pct{font-weight:800;text-align:right;white-space:nowrap;}
  .tree-table tfoot td{border-top:2px solid var(--ink);border-bottom:none;font-weight:800;padding-top:8px;}
  .bar{display:block;width:100%;height:8px;background:var(--line);border-radius:5px;overflow:hidden;min-width:120px;}
  .fill{display:block;height:100%;border-radius:5px;} .fill.ok{background:var(--ok);} .fill.check{background:var(--check);} .fill.gap{background:var(--gap);}
  /* page section */
  .page-head h2{margin-top:2px;} .principle{color:var(--muted);font-style:italic;margin:4px 0 12px;font-size:10.5px;}
  .page-grid{display:grid;grid-template-columns:62mm 1fr;gap:14px;align-items:start;margin-bottom:10px;}
  .block-table{margin-top:2px;}
  .shot img{width:100%;border:1px solid var(--line);border-radius:4px;display:block;}
  .shot figcaption{color:var(--muted);font-size:8.5px;margin-top:4px;}
  .shot-wrap{position:relative;line-height:0;}
  .ann{position:absolute;border:2px solid var(--ok);border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.5);}
  .ann.warn{border-color:var(--gap);} .ann b{position:absolute;top:-9px;left:-9px;width:15px;height:15px;border-radius:50%;background:var(--ok);color:#fff;font-size:9px;line-height:15px;text-align:center;font-weight:800;}
  .ann.warn b{background:var(--gap);}
  .ann-legend{margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;}
  .ann-legend .lg{font-size:8px;padding:1px 5px;border-radius:10px;background:var(--soft);border:1px solid var(--line);}
  .ann-legend .lg.warn{color:var(--gap);}
  .noshot{border:1px dashed var(--line);border-radius:4px;padding:24px 10px;text-align:center;color:var(--muted);font-size:9px;}
  .counts{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 8px;}
  .cnt{font-size:9px;padding:3px 7px;border-radius:20px;background:var(--soft);border:1px solid var(--line);}
  .cnt b{font-size:11px;} .cnt.ok b{color:var(--ok);} .cnt.check b{color:var(--check);} .cnt.gap b{color:var(--gap);} .cnt.total{background:var(--ink);color:#fff;border-color:var(--ink);}
  .strong{font-size:9.5px;color:#333;margin-top:6px;}
  .block-table th{font-size:8.5px;text-transform:uppercase;color:var(--muted);text-align:left;padding:5px 6px;border-bottom:1px solid var(--line);letter-spacing:.3px;}
  .block-table td{padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top;}
  .b-name{font-weight:700;width:110px;font-size:10px;} .b-num{display:inline-block;color:var(--lime);font-weight:800;margin-right:4px;}
  .b-weight{display:block;font-size:7.5px;font-weight:600;color:var(--muted);text-transform:uppercase;}
  .b-weight.core{color:var(--ink);} .b-dims{display:block;margin-top:2px;}
  .b-now{font-size:9.5px;color:#222;width:130px;} .b-should{font-size:9px;color:#444;}
  .b-score{font-weight:800;white-space:nowrap;text-align:center;} .b-word{display:block;font-weight:600;font-size:8px;}
  .st{font-size:11px;line-height:1;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}
  .row-gap .b-name{color:var(--gap);} .row-gap .b-now{color:var(--gap);}
  .dim{display:inline-block;font-size:7px;font-weight:700;letter-spacing:.3px;color:#475467;background:#EEF1F4;border-radius:3px;padding:1px 3px;margin:1px 2px 1px 0;}
  .reqs{margin-top:12px;page-break-inside:avoid;} .req-table{width:100%;border-collapse:collapse;}
  .req-table th{font-size:8.5px;text-transform:uppercase;color:var(--muted);text-align:left;padding:5px 6px;border-bottom:1px solid var(--line);letter-spacing:.3px;}
  .req-table td{padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top;font-size:10px;}
  .rq-dims{white-space:nowrap;width:70px;} .rq-req{font-weight:600;color:var(--ink);} .rq-why{color:#333;}
  .fixes{margin-top:12px;} .fix-table td{padding:4px 6px;border-bottom:1px solid var(--line);font-size:10px;vertical-align:top;}
  .fx-n{color:var(--muted);width:16px;} .fx-what{font-weight:700;white-space:nowrap;} .fx-crit{font-weight:700;white-space:nowrap;} .fx-why{color:#333;}
  /* page types map */
  .pt-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;}
  .pt-name{font-weight:600;font-size:9.5px;} .pt-st{white-space:nowrap;font-size:9px;font-weight:600;} .pt-url{color:var(--muted);font-size:8.5px;word-break:break-all;}
  /* systemic */
  .sys-list{margin:6px 0 0;padding-left:18px;} .sys-list li{margin:5px 0;} .s-dims{margin-left:4px;}
  .footer{margin-top:16px;padding-top:8px;border-top:1px solid var(--line);color:var(--muted);font-size:8.5px;}
  </style></head><body>
  ${cover}
  ${treeSection(r)}
  ${pageTypesSection(r)}
  ${r.pages.map(pageSection).join('')}
  ${systemicSection(r)}
  <section class="block">
    <h2>Что дальше</h2>
    <p class="lead">A0 — внешний срез. Чтобы перевести наблюдения в факт и деньги, нужен следующий уровень доказательности (A1–A2): аналитика (GA4), выгрузка заказов, доступ к CRM и рекламным кабинетам.</p>
    <div class="footer">Commerce OS · UX/UI Аудит A0 · ${esc(r.client)} · ${esc(date)}. Слой A0: внешний обход без доступов. Оценки — наблюдение, не факт по данным клиента; отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7).</div>
  </section>
  </body></html>`;
}
