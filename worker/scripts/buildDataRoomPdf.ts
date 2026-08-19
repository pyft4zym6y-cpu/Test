/**
 * Сборка всего data room (docs/audit-dataroom/*.md) в один брендированный PDF WEEXP
 * для передачи внешнему аудитору. Обложка + оглавление + все разделы + нумерация.
 *
 * Система WEEXP (по SKILL weeexp-creative-director): Ink-фон обложки, Marker (lime) —
 * акцент, Verdigris — результат/передача; без радиусов/теней/градиентов; числа
 * моноширинным. Носитель — «Стратегический документ / отчёт», A4 портрет.
 *
 * Запуск: CHROME_PATH=<chrome> npx tsx scripts/buildDataRoomPdf.ts [outfile]
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { marked } from 'marked';
import { chromium } from 'playwright';

const DOCS = resolve(process.cwd(), '../docs/audit-dataroom');
const OUT = process.argv[2] || resolve(process.cwd(), 'proto-out/WEEXP-Commerce-OS-Data-Room.pdf');

marked.setOptions({ gfm: true, breaks: false });

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Порядок: README → 00 → 01..17 → 18..35. */
async function orderedFiles(): Promise<string[]> {
  const all = (await readdir(DOCS)).filter((f) => f.endsWith('.md'));
  const num = (f: string) => { const m = f.match(/^(\d+)/); return m ? parseInt(m[1], 10) : -1; };
  const readme = all.filter((f) => f.toLowerCase() === 'readme.md');
  const numbered = all.filter((f) => /^\d/.test(f)).sort((a, b) => num(a) - num(b));
  return [...readme, ...numbered];
}

/** Первый H1 файла → заголовок раздела; остальной markdown → тело. */
function splitTitle(md: string): { title: string; body: string } {
  const lines = md.split('\n');
  let title = '';
  const out: string[] = [];
  for (const l of lines) {
    if (!title && /^#\s+/.test(l)) { title = l.replace(/^#\s+/, '').trim(); continue; }
    out.push(l);
  }
  return { title: title || 'Раздел', body: out.join('\n') };
}

const CSS = `
:root{
  --ink:#12160A; --paper:#ffffff; --marker:#A3E635; --marker-dk:#5f7d10;
  --verd:#0E7C6B; --muted:#6b7280; --line:#e4e7dd; --soft:#f5f8ec; --code:#12160A;
}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);font-size:9.6pt;line-height:1.5;}
.mono,code,pre,td .n{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;}

/* ── Обложка ── */
.cover{background:var(--ink);color:#fff;min-height:257mm;padding:26mm 22mm;display:flex;flex-direction:column;break-after:page;}
.cover .eyebrow{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:var(--marker);}
.cover h1{font-size:40pt;line-height:1.02;margin:14mm 0 0;font-weight:800;letter-spacing:-0.5px;max-width:16cm;}
.cover .verdict{font-size:13.5pt;line-height:1.45;color:#e9edd8;margin-top:9mm;max-width:15cm;border-left:3px solid var(--verd);padding-left:5mm;}
.cover .spacer{flex:1;}
.cover .meta{display:flex;gap:14mm;flex-wrap:wrap;border-top:1px solid #2c2f22;padding-top:6mm;}
.cover .meta div{font-size:9pt;}
.cover .meta .k{font-family:'JetBrains Mono',monospace;font-size:8pt;color:var(--marker);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:1.5mm;}
.cover .note{font-size:8pt;color:#9aa08a;margin-top:6mm;font-family:'JetBrains Mono',monospace;}

/* ── Часть-разделитель ── */
.part{background:var(--verd);color:#fff;min-height:120mm;padding:24mm 22mm;display:flex;flex-direction:column;justify-content:center;break-before:page;break-after:page;}
.part .eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#bff3e6;}
.part h2{font-size:30pt;line-height:1.05;margin:6mm 0 0;font-weight:800;border:0;padding:0;}
.part p{font-size:11pt;color:#e6fbf4;max-width:14cm;margin-top:5mm;}

/* ── Оглавление ── */
.toc{break-before:page;padding:4mm 0;}
.toc h2{font-size:17pt;border:0;}
.toc ol{list-style:none;padding:0;margin:6mm 0 0;}
.toc li{display:flex;gap:4mm;align-items:baseline;padding:2.1mm 0;border-bottom:1px solid var(--line);font-size:9.5pt;}
.toc .id{font-family:'JetBrains Mono',monospace;font-size:8.5pt;color:var(--marker-dk);flex:0 0 12mm;}
.toc a{color:var(--ink);text-decoration:none;}

/* ── Разделы ── */
.doc{break-before:page;}
.doc .kicker{font-family:'JetBrains Mono',monospace;font-size:8.5pt;letter-spacing:1.5px;text-transform:uppercase;color:var(--marker-dk);}
.doc h1.sec{font-size:20pt;line-height:1.1;margin:2mm 0 4mm;font-weight:800;letter-spacing:-0.3px;padding-bottom:3mm;border-bottom:2px solid var(--ink);}
h2{font-size:12.5pt;margin:6mm 0 2mm;font-weight:700;border-top:1px solid var(--line);padding-top:3mm;}
h3{font-size:10.5pt;margin:4mm 0 1.5mm;font-weight:700;color:#2b2f20;}
p{margin:1.6mm 0;}
a{color:var(--marker-dk);text-decoration:none;}
strong{font-weight:700;}
blockquote{margin:2.5mm 0;padding:2mm 4mm;border-left:3px solid var(--marker);background:var(--soft);font-size:8.8pt;color:#3a3d2f;}
blockquote p{margin:1mm 0;}
ul,ol{margin:1.6mm 0;padding-left:6mm;}
li{margin:0.8mm 0;}
hr{border:0;border-top:1px solid var(--line);margin:4mm 0;}
code{background:var(--soft);padding:0.3mm 1.2mm;font-size:8.4pt;border:1px solid var(--line);}
pre{background:var(--ink);color:#dbe7c4;padding:3mm 4mm;overflow-x:auto;font-size:7.8pt;line-height:1.45;white-space:pre-wrap;word-break:break-word;}
pre code{background:none;border:0;color:inherit;padding:0;}

/* ── Таблицы ── */
table{width:100%;border-collapse:collapse;margin:3mm 0;font-size:7.6pt;line-height:1.35;table-layout:auto;}
th,td{border:1px solid var(--line);padding:1.6mm 2mm;text-align:left;vertical-align:top;word-break:normal;overflow-wrap:anywhere;}
thead th{background:var(--soft);font-weight:700;color:#2b2f20;border-bottom:1.5px solid var(--marker-dk);}
tbody tr:nth-child(even){background:#fbfcf7;}

.doc, table, tr, pre, blockquote{break-inside:avoid;}
h1,h2,h3{break-after:avoid;}
`;

function coverHtml(dateStr: string, fileCount: number): string {
  return `<section class="cover">
    <div class="eyebrow">WEEXP Commerce OS · Data Room для внешнего независимого аудита</div>
    <h1>Систему можно положить под микроскоп.</h1>
    <div class="verdict">Полный пакет по продукту и процессам: архитектура, данные, безопасность, методология,
      экономика и управление. Каждый ключевой вывод прослеживается от требования до доказательства;
      каждый пробел показан честно — с владельцем и планом.</div>
    <div class="spacer"></div>
    <div class="meta">
      <div><span class="k">Продукт</span>WEEXP Commerce OS<br>движок аудита + портал</div>
      <div><span class="k">Разделов</span>${fileCount} документов · 35 доменов</div>
      <div><span class="k">Слои</span>Evidence · Validation · Governance · Measurement</div>
      <div><span class="k">Дата</span>${dateStr}</div>
    </div>
    <div class="note">Конфиденциально. Секреты, токены и необезличенные клиентские данные в пакет не включены.
      Числа с внешними бенчмарками сопровождаются источником; незакрытое помечено ⛔/📝.</div>
  </section>`;
}

const partHtml = (eyebrow: string, title: string, sub: string) =>
  `<section class="part"><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2><p>${esc(sub)}</p></section>`;

async function main() {
  const files = await orderedFiles();
  const sections: { id: string; title: string; html: string }[] = [];
  for (const f of files) {
    const md = await readFile(join(DOCS, f), 'utf8');
    const { title, body } = splitTitle(md);
    const id = 'sec-' + f.replace(/\.md$/, '').toLowerCase();
    const bodyHtml = await marked.parse(body);
    sections.push({ id, title, html: bodyHtml });
  }

  // оглавление
  const toc = `<section class="toc"><h2>Содержание</h2><ol>${sections.map((s) => {
    const m = s.title.match(/^(\d+|README)/i);
    const id = m ? m[0] : '·';
    return `<li><span class="id">${esc(id === s.title ? '' : id)}</span><a href="#${s.id}">${esc(s.title.replace(/^\d+\s*·\s*/, ''))}</a></li>`;
  }).join('')}</ol></section>`;

  // разделы с part-разделителями перед 00 и 18
  const rendered = sections.map((s) => {
    let pre = '';
    if (/^00\b/.test(s.title)) pre = partHtml('Часть I', 'Ядро data room', 'Продукт, архитектура, данные, безопасность, методология, процессы, право, финансы, люди, риски, логистика аудита (разделы 00–17).');
    if (/^18\b/.test(s.title)) pre = partHtml('Часть II', 'Слой глубины v2', 'Evidence · Validation · Governance · Measurement. Доказательность, воспроизводимость, управляемость и измеримость — реализованы в коде и заземлены на источниках (разделы 18–35).');
    const kicker = s.title.match(/^(\d+|README)/i)?.[0] ?? '';
    const cleanTitle = s.title.replace(/^\d+\s*·\s*/, '');
    return `${pre}<section class="doc" id="${s.id}">
      <div class="kicker">${esc(kicker === s.title ? 'WEEXP · Data Room' : `Раздел ${kicker}`)}</div>
      <h1 class="sec">${esc(cleanTitle)}</h1>${s.html}</section>`;
  }).join('\n');

  const dateStr = '19.08.2026';
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>${CSS}</style></head><body>
    ${coverHtml(dateStr, files.length)}${toc}${rendered}</body></html>`;

  await writeFile('/tmp/claude-0/dataroom.html', html, 'utf8').catch(() => {});

  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: OUT, format: 'A4', printBackground: true,
    margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-family:'JetBrains Mono',monospace;font-size:6.5pt;color:#9aa08a;width:100%;padding:0 15mm;display:flex;justify-content:space-between;"><span>WEEXP Commerce OS · Data Room</span><span>Конфиденциально</span></div>`,
    footerTemplate: `<div style="font-family:'JetBrains Mono',monospace;font-size:6.5pt;color:#9aa08a;width:100%;padding:0 15mm;display:flex;justify-content:space-between;"><span>Внешний независимый аудит · 19.08.2026</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
  });
  await browser.close();
  console.log(`✓ ${OUT}`);
  console.log(`  разделов: ${files.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
