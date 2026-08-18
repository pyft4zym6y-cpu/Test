/**
 * WEEXP — генерація документів-шаблонів для завантаження (ТЗ §19), повністю на
 * фронті, без бекенду й без залежностей. З даних діагностики (Tier-2 звіт +
 * проєкція «зараз → куди прийдемо») збираємо два реальні офісні файли:
 *
 *   1) downloadReportDoc  → Word (.doc): фірмовий звіт про діагностику —
 *      обкладинка, оцінка зрілості, вузьке місце, попередній діагноз, ключові
 *      болі з доказами й пріоритетом, проєкція «зараз → ціль», дорожня карта,
 *      бали по системах, конкурентне поле, маркетинг/фінанси клієнта.
 *   2) downloadWorksheetXls → Excel (.xls, SpreadsheetML): робочі аркуші —
 *      Системи, Юніт-економіка «зараз → ціль», Маркетинг і фінанси, Дорожня
 *      карта. Відкривається в Excel / Google Sheets / LibreOffice.
 *
 * Word робимо як MSO-HTML (application/msword), Excel — як Excel 2003 XML
 * (кілька аркушів, кирилиця, числові клітинки). Завантаження — через Blob +
 * тимчасове <a download> (працює на живому сайті; пісочниця артефактів тут ні
 * до чого — це продакшн-браузер користувача).
 */

export type DocDelta = { label: string; before: string; after: string; pct: number; dir?: 'up' | 'down'; hero?: boolean };
export type DocData = {
  email: string;
  site?: string;
  createdAt: string; // ISO
  overall: number;
  levelTitle: string;
  levelLine: string;
  completeness: number;
  moneyStr?: string;
  bottleneck: { label: string; score: number };
  epiphany: string;
  goals: string[];
  systems: { label: string; score: number }[];
  pains: { label: string; detail?: string }[];
  roadmap: { title: string; detail: string }[];
  competitors: { direct: string[]; indirect: string[] };
  marketing: { label: string; value: string }[];
  finance: { label: string; value: string }[];
  projection?: { income: DocDelta[]; unit: DocDelta[]; ops: DocDelta[]; upliftPct: number; horizon: string };
};

// ── утиліти ────────────────────────────────────────────────────────────────
const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtDate = (iso: string) => {
  // без залежностей: ISO → dd.mm.yyyy (беремо частину до 'T')
  const d = (iso.split('T')[0] || '').split('-');
  return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : iso;
};

const confLabel = (completeness: number) => (completeness >= 70 ? 'висока' : completeness >= 45 ? 'середня' : 'попередня');

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // трохи згодом — щоб браузер устиг стартувати завантаження
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const slug = (d: DocData) => {
  const host = (d.site || d.email || 'weexp').replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'weexp';
  const day = (d.createdAt.split('T')[0] || '').replace(/-/g, '') || 'now';
  return `${host}-${day}`;
};

// ── 1) WORD (.doc) ──────────────────────────────────────────────────────────
export function downloadReportDoc(d: DocData) {
  triggerDownload(new Blob(['﻿', buildReportDoc(d)], { type: 'application/msword' }), `WEEXP-звіт-${slug(d)}.doc`);
}

/**
 * Надійний «Завантажити звіт (PDF)» для всіх пристроїв: відкриваємо фірмовий звіт
 * окремою вкладкою і викликаємо друк — користувач зберігає як PDF (працює і на
 * iOS, де blob-завантаження <a download> віддає порожній файл). Якщо попап
 * заблоковано — м'яко відкочуємось на завантаження .doc.
 */
export function openReportPage(d: DocData) {
  const w = window.open('', '_blank');
  if (!w) { downloadReportDoc(d); return; }
  w.document.open();
  w.document.write(buildPrintReport(d));
  w.document.close();
}

/**
 * Чистий, компактний звіт під друк/PDF (≤2 сторінки A4) — окремо від Word-версії
 * (та має MSO-розмітку, що «пливе» у браузерному друку на телефоні). Справжня
 * друкована типографіка, контроль розривів сторінок, кнопка «Зберегти як PDF».
 */
export function buildPrintReport(d: DocData): string {
  const DEEP = '#15171A', DATA = '#2f4fd0', GRAPH = '#61686F', LINE = '#E2E5E9', ALERT = '#D6362B';
  const sysColor = (s: number) => (s >= 65 ? '#1f9d55' : s >= 40 ? '#b8860b' : ALERT);

  const painRows = d.pains.slice(0, 5)
    .map((p, i) => `<tr><td class="pri">P${i + 1}</td><td class="pl"><b>${esc(p.label)}</b>${p.detail ? `<span>${esc(p.detail)}</span>` : ''}</td><td class="cf">${confLabel(d.completeness)}</td></tr>`)
    .join('');

  const proj = d.projection;
  const projRows = proj
    ? [...proj.income, ...proj.unit.slice(0, 3), ...proj.ops].slice(0, 7)
        .map((x) => `<tr><td>${esc(x.label)}</td><td class="g">${esc(x.before)}</td><td class="b">${esc(x.after)}</td><td class="d">${x.dir === 'down' ? '−' : '+'}${x.pct}%</td></tr>`)
        .join('')
    : '';

  const road = d.roadmap.slice(0, 5)
    .map((r, i) => `<li><i>${String(i + 1).padStart(2, '0')}</i><div><b>${esc(r.title)}</b><span>${esc(r.detail)}</span></div></li>`)
    .join('');

  const sysChips = d.systems
    .map((s) => `<span class="sys"><em style="color:${sysColor(s.score)}">${s.score}</em> ${esc(s.label.split(/\s|\//)[0])}</span>`)
    .join('');

  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WEEXP — звіт діагностики</title>
<style>
  :root{--deep:${DEEP};--data:${DATA};--graph:${GRAPH};--line:${LINE}}
  *{box-sizing:border-box}
  html,body{margin:0;background:#fff;color:#1c1e22;font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%}
  .wrap{max-width:760px;margin:0 auto;padding:22px 20px 90px}
  .kick{font:600 9px/1 ui-monospace,monospace;letter-spacing:2px;text-transform:uppercase;color:var(--graph);margin:0 0 5px}
  h1{font-size:24px;line-height:1.1;margin:0 0 4px;color:var(--deep)}
  h1 em{color:var(--data);font-style:normal}
  .lvl{font-size:12.5px;color:#333;margin:0 0 6px}
  .meta{font:10px/1.4 ui-monospace,monospace;color:var(--graph);margin:0 0 10px}
  .opp{display:inline-block;background:#eef2ff;color:var(--data);font-weight:600;font-size:12px;padding:6px 11px;border-radius:8px;margin:0 0 12px}
  h2{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--data);margin:16px 0 6px;font-family:ui-monospace,monospace}
  .epi{font-size:15px;line-height:1.4;color:#111;margin:0 0 6px}
  .sub{font-size:12px;color:#333;margin:0}
  table{width:100%;border-collapse:collapse;font-size:12px}
  td{padding:5px 7px;border-bottom:1px solid var(--line);vertical-align:top}
  .pri{font:700 11px ui-monospace,monospace;color:var(--data);width:30px}
  .pl b{display:block;color:var(--deep)}.pl span{display:block;color:#555;font-size:11px}
  .cf{text-align:right;color:var(--graph);white-space:nowrap;width:70px}
  .g{color:var(--graph)}.b{font-weight:700}.d{text-align:right;color:var(--data);white-space:nowrap}
  ol{list-style:none;margin:0;padding:0}
  ol li{display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);break-inside:avoid}
  ol li i{font:700 11px ui-monospace,monospace;color:var(--data);padding-top:2px}
  ol li b{display:block;color:var(--deep)}ol li span{display:block;color:#555;font-size:11.5px}
  .sysrow{display:flex;flex-wrap:wrap;gap:6px}
  .sys{font-size:11px;border:1px solid var(--line);border-radius:100px;padding:3px 9px;color:#333}
  .sys em{font-weight:700;font-style:normal}
  .foot{margin-top:18px;padding-top:8px;border-top:2px solid var(--deep);font:9.5px/1.5 ui-monospace,monospace;color:var(--graph)}
  section{break-inside:avoid}
  .bar{position:fixed;bottom:0;left:0;right:0;display:flex;gap:10px;justify-content:center;padding:11px;background:#fff;border-top:1px solid var(--line)}
  .bar button{font:600 14px -apple-system,sans-serif;padding:11px 22px;border-radius:100px;border:0;background:var(--deep);color:#fff}
  @media print{.bar{display:none}.wrap{padding-bottom:22px}@page{size:A4;margin:12mm}}
</style></head><body>
<div class="wrap">
  <p class="kick">WEEXP · Звіт діагностики</p>
  <h1>Зрілість e-commerce — <em>${d.overall}</em>/100</h1>
  <p class="lvl"><b>${esc(d.levelTitle)}.</b> ${esc(d.levelLine)}</p>
  <p class="meta">${esc(d.email)}${d.site ? ' · ' + esc(d.site) : ''} · ${fmtDate(d.createdAt)} · дані ${d.completeness}%</p>
  ${d.moneyStr ? `<div class="opp">Можливість: ${esc(d.moneyStr)} / рік</div>` : ''}

  <section><h2>Головний висновок</h2>
  <p class="epi">${esc(d.epiphany)}</p>
  <p class="sub">Вузьке місце — <b>«${esc(d.bottleneck.label)}»</b> (${d.bottleneck.score}/100).${d.goals.length ? ` Ціль: ${d.goals.map(esc).join(' · ')}.` : ''}</p></section>

  ${painRows ? `<section><h2>Ключові болі</h2><table>${painRows}</table></section>` : ''}
  ${projRows ? `<section><h2>Зараз → ціль${proj ? ` · ${esc(proj.horizon)}` : ''}</h2><table>${projRows}</table></section>` : ''}
  ${road ? `<section><h2>Дорожня карта</h2><ol>${road}</ol></section>` : ''}
  <section><h2>Бали по системах</h2><div class="sysrow">${sysChips}</div></section>

  <p class="foot">WEEXP — Система замість героїзму · weexp.agency<br>Попередня діагностика. Точний план під Definition of Done — на розборі з командою.</p>
</div>
<div class="bar"><button onclick="window.print()">Зберегти як PDF / Друк</button></div>
<script>setTimeout(function(){try{window.focus();window.print();}catch(e){}},600)</script>
</body></html>`;
}

export function buildReportDoc(d: DocData): string {
  const DEEP = '#15171A', DATA = '#2f4fd0', GRAPH = '#61686F', LINE = '#D9DDE1', ALERT = '#D6362B';
  const kick = (t: string) => `<p style="font-family:'Consolas',monospace;font-size:9pt;letter-spacing:2px;text-transform:uppercase;color:${DATA};margin:18pt 0 4pt">${esc(t)}</p>`;
  const p = (t: string, extra = '') => `<p style="font-size:11pt;line-height:1.5;color:#222;margin:4pt 0;${extra}">${t}</p>`;

  const sysRows = d.systems
    .map((s, i) => {
      const c = s.score >= 65 ? '#1f9d55' : s.score >= 40 ? '#b8860b' : ALERT;
      return `<tr><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE};font-family:monospace;color:${GRAPH}">${String(i + 1).padStart(2, '0')}</td><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE}">${esc(s.label)}</td><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE};text-align:right;font-weight:bold;color:${c}">${s.score}/100</td></tr>`;
    })
    .join('');

  const painRows = d.pains
    .map((pn, i) => `<tr><td style="padding:6pt 8pt;border-bottom:1px solid ${LINE};font-weight:bold;width:32%">${esc(pn.label)}</td><td style="padding:6pt 8pt;border-bottom:1px solid ${LINE};color:#333">${esc(pn.detail || 'за вашими відповідями')}</td><td style="padding:6pt 8pt;border-bottom:1px solid ${LINE};text-align:center">${confLabel(d.completeness)}</td><td style="padding:6pt 8pt;border-bottom:1px solid ${LINE};text-align:center;font-family:monospace">P${i + 1}</td></tr>`)
    .join('');

  const roadRows = d.roadmap
    .map((r, i) => `<tr><td style="padding:6pt 8pt;border-bottom:1px solid ${LINE};font-family:monospace;color:${DATA};vertical-align:top">${String(i + 1).padStart(2, '0')}</td><td style="padding:6pt 8pt;border-bottom:1px solid ${LINE}"><b>${esc(r.title)}</b><br><span style="color:#444;font-size:10.5pt">${esc(r.detail)}</span></td></tr>`)
    .join('');

  const projBlock = (() => {
    const j = d.projection;
    if (!j || (j.income.length === 0 && j.unit.length === 0 && j.ops.length === 0)) return '';
    const row = (x: DocDelta) => {
      const sign = x.dir === 'down' ? '−' : '+';
      return `<tr><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE}">${esc(x.label)}</td><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE};color:${GRAPH}">${esc(x.before)}</td><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE};font-weight:bold">${esc(x.after)}</td><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE};text-align:right;color:${DATA}">${sign}${x.pct}%</td></tr>`;
    };
    const rows = [...j.income, ...j.unit, ...j.ops].map(row).join('');
    return (
      kick('Зараз → куди можемо прийти · уточнена ціль (Tier-2)') +
      p(`Та сама модель, що й у калькуляторі, звужена вашими даними. Горизонт: <b>${esc(j.horizon)}</b>.`) +
      `<table style="border-collapse:collapse;width:100%;font-size:10.5pt;margin-top:6pt"><tr style="background:#F4F5F7"><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH}">Показник</td><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH}">Зараз</td><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH}">Ціль</td><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH};text-align:right">Δ</td></tr>${rows}</table>`
    );
  })();

  const comp = (arr: string[]) =>
    arr.length ? arr.map((u) => esc(u.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))).join(' · ') : '—';

  const metricRows = [...d.marketing, ...d.finance]
    .map((m) => `<tr><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE}">${esc(m.label)}</td><td style="padding:5pt 8pt;border-bottom:1px solid ${LINE};text-align:right;font-family:monospace">${esc(m.value)}</td></tr>`)
    .join('');

  const body = `
    <div style="border-left:4px solid ${DATA};padding-left:16pt;margin-bottom:8pt">
      <p style="font-family:monospace;font-size:9pt;letter-spacing:2px;text-transform:uppercase;color:${GRAPH};margin:0">WEEXP · Tier-2 звіт про діагностику</p>
      <h1 style="font-size:30pt;color:${DEEP};margin:6pt 0 2pt;line-height:1.05">Зрілість вашого e-commerce — <span style="color:${DATA}">${d.overall}</span>/100</h1>
      <p style="font-size:11pt;color:#333;margin:2pt 0"><b>${esc(d.levelTitle)}.</b> ${esc(d.levelLine)}</p>
      <p style="font-family:monospace;font-size:9pt;color:${GRAPH};margin:6pt 0 0">${esc(d.email)}${d.site ? ' · ' + esc(d.site) : ''} · ${fmtDate(d.createdAt)} · заповнено ${d.completeness}% даних</p>
    </div>
    ${d.moneyStr ? p(`<b>Можливість з Етапу 1:</b> ${esc(d.moneyStr)} на рік — тепер видно, де саме вона зосереджена.`, `background:#F4F6FF;padding:8pt 10pt;border-radius:4pt`) : ''}

    ${kick('Головний висновок')}
    ${p(`<i>${esc(d.epiphany)}</i>`, 'font-size:12.5pt;color:#111')}
    ${p(`Вузьке місце — <b>«${esc(d.bottleneck.label)}»</b> (${d.bottleneck.score}/100). Саме з цієї ланки почнеться Tier-2-побудова: спершу перевіряємо дані (UX, аналітику, конверсію, процеси), і лише тоді — рішення.`)}
    ${d.goals.length ? p(`<b>Ваша ціль:</b> ${d.goals.map(esc).join(' · ')}`) : ''}

    ${d.pains.length ? kick('Ключові болі — що ми побачили у ваших відповідях') +
      `<table style="border-collapse:collapse;width:100%;font-size:10.5pt"><tr style="background:#F4F5F7"><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH}">Проблема</td><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH}">Докази</td><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH};text-align:center">Впевненість</td><td style="padding:5pt 8pt;font-family:monospace;font-size:9pt;color:${GRAPH};text-align:center">Пріоритет</td></tr>${painRows}</table>` : ''}

    ${projBlock}

    ${d.roadmap.length ? kick('Вектори дорожньої карти' + (d.goals.length ? ' — до вашої цілі' : '')) +
      `<table style="border-collapse:collapse;width:100%">${roadRows}</table>` +
      p(`<span style="color:${GRAPH};font-size:9.5pt">Точні кроки, терміни й окупність — складемо разом на розборі.</span>`) : ''}

    ${kick('Оцінка по системах')}
    <table style="border-collapse:collapse;width:100%;font-size:10.5pt">${sysRows}</table>

    ${kick('Конкурентне поле')}
    ${p(`<b>Прямі:</b> ${comp(d.competitors.direct)}`)}
    ${p(`<b>Непрямі:</b> ${comp(d.competitors.indirect)}`)}

    ${metricRows ? kick('Маркетинг і фінанси (ваші дані)') +
      `<table style="border-collapse:collapse;width:100%;font-size:10.5pt">${metricRows}</table>` : ''}

    <p style="margin-top:22pt;padding-top:10pt;border-top:2px solid ${DEEP};font-family:monospace;font-size:9pt;color:${GRAPH}">WEEXP — Система замість героїзму · weexp.agency<br>Цей звіт — попередня діагностика. Точний план під Definition of Done складаємо на розборі з командою.</p>
  `;

  return `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>WEEXP — Tier-2 звіт</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:1.6cm}body{font-family:'Calibri','Segoe UI',sans-serif;color:#222}</style></head><body>${body}</body></html>`;
}

// ── 2) EXCEL (.xls, SpreadsheetML 2003) ─────────────────────────────────────
type Cell = { v: string | number; t?: 'String' | 'Number'; b?: boolean };
function sheet(name: string, rows: Cell[][], widths?: number[]) {
  const cols = (widths || []).map((w) => `<Column ss:Width="${w}"/>`).join('');
  const body = rows
    .map((r) => {
      const cells = r
        .map((c) => {
          const type = c.t || (typeof c.v === 'number' ? 'Number' : 'String');
          const styl = c.b ? ' ss:StyleID="h"' : '';
          const data = type === 'Number' ? String(c.v) : esc(c.v);
          return `<Cell${styl}><Data ss:Type="${type}">${data}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');
  return `<Worksheet ss:Name="${esc(name).slice(0, 31)}"><Table>${cols}${body}</Table></Worksheet>`;
}

export function downloadWorksheetXls(d: DocData) {
  triggerDownload(new Blob(['﻿', buildWorksheetXls(d)], { type: 'application/vnd.ms-excel' }), `WEEXP-юніт-економіка-${slug(d)}.xls`);
}

export function buildWorksheetXls(d: DocData): string {
  const H = (v: string): Cell => ({ v, b: true });
  const pctNum = (x: DocDelta) => (x.dir === 'down' ? -x.pct : x.pct);

  const sheets: string[] = [];

  // Аркуш 1 — Огляд + системи
  const overview: Cell[][] = [
    [H('WEEXP — Tier-2 діагностика')],
    [{ v: 'Клієнт' }, { v: d.email }],
    ...(d.site ? [[{ v: 'Сайт' }, { v: d.site }] as Cell[]] : []),
    [{ v: 'Дата' }, { v: fmtDate(d.createdAt) }],
    [{ v: 'Зрілість (0–100)' }, { v: d.overall, t: 'Number' }],
    [{ v: 'Рівень' }, { v: d.levelTitle }],
    [{ v: 'Заповнено даних, %' }, { v: d.completeness, t: 'Number' }],
    [{ v: 'Вузьке місце' }, { v: d.bottleneck.label }, { v: d.bottleneck.score, t: 'Number' }],
    ...(d.moneyStr ? [[{ v: 'Можливість (Етап 1)' }, { v: d.moneyStr }] as Cell[]] : []),
    [],
    [H('№'), H('Система'), H('Бал / 100')],
    ...d.systems.map((s, i) => [{ v: i + 1, t: 'Number' as const }, { v: s.label }, { v: s.score, t: 'Number' as const }] as Cell[]),
  ];
  sheets.push(sheet('Огляд', overview, [140, 260, 90]));

  // Аркуш 2 — Юніт-економіка «зараз → ціль»
  if (d.projection) {
    const j = d.projection;
    const rows: Cell[][] = [
      [H('Юніт-економіка: зараз → куди можемо прийти')],
      [{ v: 'Горизонт' }, { v: j.horizon }],
      [],
      [H('Показник'), H('Зараз'), H('Ціль'), H('Δ, %')],
      ...[...j.income, ...j.unit, ...j.ops].map((x) => [{ v: x.label }, { v: x.before }, { v: x.after }, { v: pctNum(x), t: 'Number' as const }] as Cell[]),
    ];
    sheets.push(sheet('Юніт-економіка', rows, [220, 130, 130, 80]));
  }

  // Аркуш 3 — Маркетинг і фінанси (введені клієнтом)
  const mf: Cell[][] = [[H('Показник'), H('Значення')], ...[...d.marketing, ...d.finance].map((m) => [{ v: m.label }, { v: m.value }] as Cell[])];
  if (mf.length > 1) sheets.push(sheet('Маркетинг і фінанси', mf, [240, 160]));

  // Аркуш 4 — Дорожня карта
  if (d.roadmap.length) {
    const rd: Cell[][] = [
      [H('Пріоритет'), H('Крок'), H('Що робимо')],
      ...d.roadmap.map((r, i) => [{ v: `P${i + 1}` }, { v: r.title }, { v: r.detail }] as Cell[]),
    ];
    sheets.push(sheet('Дорожня карта', rd, [80, 240, 380]));
  }

  // Аркуш 5 — Ключові болі
  if (d.pains.length) {
    const pn: Cell[][] = [
      [H('Пріоритет'), H('Проблема'), H('Докази'), H('Впевненість')],
      ...d.pains.map((x, i) => [{ v: `P${i + 1}` }, { v: x.label }, { v: x.detail || 'за вашими відповідями' }, { v: confLabel(d.completeness) }] as Cell[]),
    ];
    sheets.push(sheet('Ключові болі', pn, [80, 220, 360, 110]));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel"><Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#EEF1F6" ss:Pattern="Solid"/></Style></Styles>${sheets.join('')}</Workbook>`;

  return xml;
}
