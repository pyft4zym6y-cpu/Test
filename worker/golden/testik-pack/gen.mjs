// Генератор пакета «Тестик» — 19 документів глибокого аудиту WEEXP на синтетичних даних.
// A4-портрет для документів, 16:9 для презентації. Система: Ink/Verdigris/Marker,
// без радіусів/тіней/градієнтів, заголовки-висновки, один герой на сторінку.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
mkdirSync(OUT, { recursive: true });

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --ink:#070d12; --ink8:#0F1A21; --ink6:#1E3038;
  --verd:#1F5648; --verd7:#2A6D5C; --verd5:#6FAA9A;
  --mark:#D6362B; --steel:#6E7C86; --steel6:#94A0A8; --steel4:#D3D9DC;
  --vel:#E7EAE7; --paper:#fff; --hair:#dfe4e6;
  --sans:'IBM Plex Sans','Golos Text',system-ui,Arial,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
}
html,body { background:#fff; }
body { font-family:var(--sans); color:#26292e; }
.mono, .num { font-family:var(--mono); font-variant-numeric:tabular-nums; letter-spacing:.02em; }

/* ── Сторінка A4 ── */
.pg { width: 210mm; height: 296mm; position: relative; overflow: hidden; page-break-after: always; background:#fff; padding: 16mm 16mm 14mm; display:flex; flex-direction:column; }
.pg.ink { background: var(--ink); color: #E8ECEA; }
.pg.verd { background: var(--verd); color: #EAF2EE; }

/* шапка/підвал документа */
.hd { display:flex; justify-content:space-between; align-items:baseline; border-bottom:2px solid var(--ink); padding-bottom:4mm; margin-bottom:8mm; }
.pg.ink .hd, .pg.verd .hd { border-color: rgba(255,255,255,.35); }
.hd .l { font-family:var(--mono); font-size:8.5pt; letter-spacing:.16em; text-transform:uppercase; }
.hd .r { font-family:var(--mono); font-size:8.5pt; color:var(--steel); }
.pg.ink .hd .r, .pg.verd .hd .r { color:rgba(255,255,255,.55); }
.ft { position:absolute; left:16mm; right:16mm; bottom:8mm; display:flex; justify-content:space-between; font-family:var(--mono); font-size:7.5pt; color:var(--steel6); border-top:1px solid var(--hair); padding-top:2.5mm; }
.pg.ink .ft, .pg.verd .ft { color:rgba(255,255,255,.45); border-color:rgba(255,255,255,.2); }
.proto { color:var(--mark); }

/* типографіка */
.ebrow { font-family:var(--mono); font-size:9pt; letter-spacing:.22em; text-transform:uppercase; color:var(--verd7); margin-bottom:5mm; }
.pg.ink .ebrow { color:var(--verd5); }
h1.big { font-weight:800; letter-spacing:-.03em; line-height:.98; font-size:34pt; color:var(--ink); }
.pg.ink h1.big, .pg.verd h1.big { color:#fff; }
h2.st { font-weight:800; letter-spacing:-.02em; font-size:16pt; color:var(--ink); margin:0 0 4mm; line-height:1.05; }
.pg.ink h2.st { color:#fff; }
p.lead { font-size:11pt; line-height:1.5; color:#3A3D42; max-width:150mm; }
.pg.ink p.lead, .pg.verd p.lead { color:rgba(255,255,255,.82); }
p.body { font-size:9.5pt; line-height:1.55; color:#33373c; margin-bottom:3mm; }
.marg { font-family:var(--mono); font-size:7.5pt; color:var(--steel); line-height:1.45; }
.src { font-family:var(--mono); font-size:7pt; color:var(--steel6); }
.mark { color: var(--mark); }
.verdc { color: var(--verd7); }

/* число-герой */
.hero { margin: 8mm 0 4mm; }
.hero .n { font-family:var(--mono); font-weight:700; font-size:64pt; letter-spacing:-.04em; line-height:1; color:var(--ink); }
.hero.m .n { color:var(--mark); } .hero.v .n { color:var(--verd7); }
.pg.ink .hero .n { color:#fff; }
.hero .cap { font-size:10pt; color:var(--steel); margin-top:2mm; max-width:120mm; }
.pg.ink .hero .cap { color:rgba(255,255,255,.65); }

/* KPI-ряд */
.kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:4mm; margin:5mm 0; }
.kpis.c3 { grid-template-columns:repeat(3,1fr); }
.kpi { border:1.5px solid var(--ink); padding:3.5mm 4mm; }
.kpi .v { font-family:var(--mono); font-weight:700; font-size:16pt; letter-spacing:-.02em; }
.kpi .v.bad { color:var(--mark); } .kpi .v.ok { color:var(--verd7); }
.kpi .k { font-family:var(--mono); font-size:7pt; letter-spacing:.1em; text-transform:uppercase; color:var(--steel); margin-top:1.5mm; }

/* таблиці */
table.t { width:100%; border-collapse:collapse; font-size:8.5pt; }
table.t th { font-family:var(--mono); font-size:7pt; letter-spacing:.12em; text-transform:uppercase; color:var(--steel); text-align:left; border-bottom:1.5px solid var(--ink); padding:1.8mm 2mm; }
table.t td { border-bottom:1px solid var(--hair); padding:1.9mm 2mm; vertical-align:top; line-height:1.35; }
table.t td.num, table.t th.num { text-align:right; font-family:var(--mono); }
table.t tr.hl td { background:#F4F6F5; }
table.t td b { font-weight:700; color:var(--ink); }
.sev { font-family:var(--mono); font-size:7pt; letter-spacing:.08em; padding:.5mm 1.5mm; border:1px solid; }
.sev.h { color:var(--mark); border-color:var(--mark); }
.sev.m { color:#a06a00; border-color:#a06a00; }
.sev.l { color:var(--steel); border-color:var(--steel6); }
.sev.ok { color:var(--verd7); border-color:var(--verd7); }

/* шкала-бенчмарк (D1) */
.bench { margin:3.5mm 0; }
.bench .lab { display:flex; justify-content:space-between; font-size:8.5pt; margin-bottom:1.2mm; }
.bench .lab .b { font-family:var(--mono); }
.bench .bar { position:relative; height:5.5mm; background:var(--vel); }
.bench .fill { position:absolute; left:0; top:0; bottom:0; background:var(--ink); }
.bench .fill.bad { background:var(--mark); }
.bench .tick { position:absolute; top:-1.2mm; bottom:-1.2mm; width:1px; background:var(--verd7); }
.bench .tick i { position:absolute; top:100%; left:-14mm; width:28mm; text-align:center; font-family:var(--mono); font-style:normal; font-size:6.5pt; color:var(--verd7); }

/* гант */
.gantt { width:100%; border-collapse:collapse; font-size:8pt; }
.gantt th { font-family:var(--mono); font-size:6.5pt; letter-spacing:.08em; color:var(--steel); border-bottom:1.5px solid var(--ink); padding:1.5mm 1mm; text-align:center; }
.gantt th.rn { text-align:left; }
.gantt td { border-bottom:1px solid var(--hair); padding:1.5mm 1mm; }
.gantt td.rn { font-size:8pt; line-height:1.25; width:52mm; }
.gantt .cell { height:4.5mm; }
.gantt .on { background:var(--ink); } .gantt .on.w1 { background:var(--mark); } .gantt .on.w3 { background:var(--verd7); }

/* блоки-виноски */
.callout { border-left:3px solid var(--mark); padding:2.5mm 4mm; background:#FBF3F2; font-size:9pt; line-height:1.45; margin:3mm 0; }
.callout.v { border-color:var(--verd7); background:#F1F6F4; }
.cols2 { display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
.cols3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:5mm; }

/* слайди 16:9 */
.sl { width:1280px; height:720px; position:relative; overflow:hidden; page-break-after:always; background:var(--paper); padding:56px 64px; display:flex; flex-direction:column; }
.sl.ink { background:var(--ink); color:#E8ECEA; }
.sl.verd { background:var(--verd); color:#EAF2EE; }
.sl .ebrow { font-size:12px; margin-bottom:18px; }
.sl h1 { font-weight:800; letter-spacing:-.03em; line-height:.98; font-size:64px; color:var(--ink); max-width:1000px; }
.sl.ink h1, .sl.verd h1 { color:#fff; }
.sl h1 .mk { color:var(--mark); }
.sl .heron { font-family:var(--mono); font-weight:700; font-size:220px; letter-spacing:-.05em; line-height:.95; }
.sl .foot { position:absolute; left:64px; right:64px; bottom:28px; display:flex; justify-content:space-between; font-family:var(--mono); font-size:11px; color:var(--steel6); }
.sl.ink .foot, .sl.verd .foot { color:rgba(255,255,255,.45); }

/* ── Постраничный разбор: блок-таблиця з оцінкою 0–5 ── */
.bt { width:100%; border-collapse:collapse; font-size:7.4pt; }
.bt th { font-family:var(--mono); font-size:6.6pt; letter-spacing:.1em; text-transform:uppercase; color:var(--steel); text-align:left; border-bottom:1.5px solid var(--ink); padding:1.5mm 1.8mm; }
.bt td { border-bottom:1px solid var(--hair); padding:1.7mm 1.8mm; vertical-align:top; line-height:1.35; }
.bt .bnum { font-family:var(--mono); font-weight:700; white-space:nowrap; }
.bt .score { font-family:var(--mono); font-weight:700; font-size:10pt; text-align:center; width:10mm; }
.bt .sc5 { color:var(--verd7); } .bt .sc4 { color:var(--ink); } .bt .sc2, .bt .sc3 { color:#a06a00; } .bt .sc0, .bt .sc1 { color:var(--mark); }
.tag { font-family:var(--mono); font-size:5.8pt; letter-spacing:.06em; border:1px solid var(--steel6); color:var(--steel); padding:.3mm 1mm; margin-right:.8mm; }
.okm { color:var(--verd7); font-weight:700; } .badm { color:var(--mark); font-weight:700; }

/* ── Wireframe ЗАРАЗ / ЯК ТРЕБА ── */
.wf2 { display:grid; grid-template-columns:1fr 1fr; gap:4mm; margin:2.5mm 0; }
.wf { border:2px solid; padding:2.5mm; }
.wf.cur { border-color:var(--mark); } .wf.should { border-color:var(--verd7); }
.wf .wfh { font-family:var(--mono); font-size:6.8pt; letter-spacing:.14em; margin-bottom:1.6mm; }
.wf.cur .wfh { color:var(--mark); } .wf.should .wfh { color:var(--verd7); }
.wf .m { background:#F4F6F5; border:1px solid var(--steel4); padding:1.6mm 2mm; margin-bottom:1.2mm; font-size:6.8pt; line-height:1.3; }
.wf .m b { font-size:7.2pt; }
.wf .m.ghost { border-style:dashed; color:var(--steel6); text-align:center; }
.wf .m.cta { background:var(--ink); color:#fff; text-align:center; font-weight:700; }
.wf .m.cta.mk { background:var(--mark); }
.wf .mrow { display:grid; gap:1.2mm; margin-bottom:1.2mm; }
.wf .note { font-size:6.6pt; color:var(--steel); line-height:1.35; margin-top:1mm; }
.wf .lnk { color:var(--verd7); font-weight:700; }
/* ── Поблочні пари (канон Fragstore): нумерований блок, chips, анотації, дельта ── */
.wfb { margin:0 0 3.2mm; break-inside:avoid; }
.wfb .bh { display:flex; align-items:baseline; gap:2mm; margin-bottom:1mm; }
.wfb .bh .n { font-family:var(--mono); font-size:7.5pt; font-weight:700; color:#fff; background:var(--ink); padding:.4mm 1.6mm; }
.wfb .bh .tt { font-size:10pt; font-weight:700; letter-spacing:-.01em; }
.wfb .bh .sb { font-size:7pt; color:var(--steel); }
.wf .m.miss { border:1.5px dashed var(--mark); background:none; color:var(--mark); text-align:center; padding:5mm 2mm; font-weight:700; }
.wf .cards { display:grid; gap:1mm; margin-bottom:1.2mm; }
.wf .c2 { grid-template-columns:1fr 1fr; } .wf .c3 { grid-template-columns:1fr 1fr 1fr; } .wf .c4 { grid-template-columns:1fr 1fr 1fr 1fr; }
.wf .card { border:1px solid var(--steel4); background:#fff; padding:1.2mm 1.4mm; font-size:5.9pt; line-height:1.25; }
.wf .card b { font-size:6.3pt; display:block; }
.wf .card .ph { height:6mm; background:#E8ECEA; margin-bottom:.8mm; }
.wf.should .card.nw { border-color:var(--verd7); }
.wf .ch { display:inline-block; border:1px solid var(--steel4); padding:.4mm 1.4mm; font-size:5.9pt; margin:0 .8mm .8mm 0; background:#fff; }
.wf .ch.g { border-color:var(--verd7); color:var(--verd7); font-weight:700; }
.wf .ann { font-size:6.2pt; line-height:1.3; padding:.8mm 1.5mm; border-left:2.5px solid; margin:1mm 0; }
.wf .ann.bad { border-color:var(--mark); color:var(--mark); background:#FBF0EF; }
.wf .ann.good { border-color:var(--verd7); color:var(--verd7); background:#EFF5F2; }
.wfd { font-family:var(--mono); font-size:7pt; font-weight:700; color:var(--verd7); margin-top:1mm; }
.wfd .neg { color:var(--mark); }

/* ── Дерево сайта ── */
.tree { font-family:var(--mono); font-size:7.2pt; line-height:1.55; }
.tree b { font-size:7.6pt; }
.tree .lvl1 { margin-left:5mm; } .tree .lvl2 { margin-left:10mm; color:#33373c; }
.tree .cnt { color:var(--steel6); } .tree .warn { color:var(--mark); font-weight:700; } .tree .good { color:var(--verd7); }
@media print { .pg, .sl { break-inside: avoid; } }
`;

const esc = (s) => s;
const fmtE = (n) => '€' + n.toLocaleString('uk-UA').replace(/ /g, ' ');

// ── хелпери розмітки ──
const DATE = '23.08.2026';
let docNo = '';
const ASOF = 'дані станом на 20.08.2026 · вивантаження TSK-0820';
const hd = (sub) => `<div class="hd"><span class="l">WEEXP · Глибокий аудит · «Тестик»</span><span class="r">${sub} · ${ASOF}</span></div>`;
const ft = (p, n) => `<div class="ft"><span>${docNo}</span><span class="proto">ПРОТОТИП · СИНТЕТИЧНІ ДАНІ</span><span>стор. ${p}/${n}</span></div>`;
const page = (cls, sub, body, p, n) => `<div class="pg ${cls}">${hd(sub)}${body}${ft(p, n)}</div>`;

const bench = (label, valTxt, pct, benchPct, benchTxt, bad = true) => `
<div class="bench">
  <div class="lab"><span>${label}</span><span class="b ${bad ? 'mark' : ''}">${valTxt}</span></div>
  <div class="bar"><div class="fill ${bad ? 'bad' : ''}" style="width:${pct}%"></div>
    <div class="tick" style="left:${benchPct}%"><i>${benchTxt}</i></div></div>
</div>`;

const kpi = (v, k, cls = '') => `<div class="kpi"><div class="v ${cls}">${v}</div><div class="k">${k}</div></div>`;

function doc(file, title, html) {
  const out = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${html}</body></html>`;
  writeFileSync(join(OUT, file), out);
  console.log('✓', file);
}

const cover = (num, title, value, meta) => `<div class="pg ink">
  <div class="hd"><span class="l">WEEXP · Глибокий аудит · «Тестик»</span><span class="r">${ASOF}</span></div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <span class="ebrow">Звіт ${num} із 5</span>
    <h1 class="big" style="font-size:40pt">${title}</h1>
    <p class="lead" style="margin-top:8mm">${value}</p>
    <p class="marg" style="margin-top:10mm;color:rgba(255,255,255,.5)">${meta}</p>
  </div>
  ${ft(1, '·')}</div>`;
const toc = (rows, pageNo, total) => page('', 'Зміст', `
  <span class="ebrow">Зміст звіту</span>
  <table class="t" style="margin-top:4mm">
    <tr><th style="width:16mm">Глава</th><th>Назва — і що вона дає</th><th class="num" style="width:14mm">стор.</th></tr>
    ${rows.map(([n, t2, p2]) => `<tr><td class="num"><b>${n}</b></td><td>${t2}</td><td class="num">${p2}</td></tr>`).join('')}
  </table>`, pageNo, total);
export { doc, page, hd, ft, bench, kpi, fmtE, esc, CSS, OUT, cover, toc };
export const setDocNo = (s) => { docNo = s; };
