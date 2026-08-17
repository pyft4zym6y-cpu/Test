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
