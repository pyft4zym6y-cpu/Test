/**
 * «Page Audit» (клієнтський PDF): кожна сторінка як одиниця бізнесу — цілісний
 * стан (UX/UI/Content/SEO/GEO/CRO/Trust/Tech) + Page Health Matrix + картки з
 * 7 питаннями + Golden Standard/Gap. 19 артефактів; трафік/конверсія — «н/д».
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { PageFlowReport, PageCard, MatrixRow, DimScore } from '../pageflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };

function spine(r: PageFlowReport): string {
  const items = r.spine.map((L) => `<div class="pf-sp-row"><div class="pf-sp-id">${esc(L.id)}</div>
    <div class="pf-sp-b"><b>${esc(L.title.replace(/^PG\d+ · /, ''))}</b>
      <p class="pf-sp-pr">${esc(L.principle)}</p><p class="pf-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>Page Audit: 8 рівнів</h2>
    <p class="lead">Сторінка оцінюється не як набір візуальних елементів, а як ОДИНИЦЯ БІЗНЕСУ: об’єднує UX/UI/Content/SEO/GEO/CRO/Trust/Tech. Structure каже «які сторінки мають бути», Page Audit — «наскільки кожна виконує свою задачу».</p>
    <div class="pf-sp">${items}</div></section>`;
}

function matrix(r: PageFlowReport): string {
  const cell = (v: number) => `<td class="pf-m-c ${s10(v)}">${v}</td>`;
  const rows = r.matrix.map((m: MatrixRow) => `<tr><td class="pf-b">${esc(m.page)}</td>
    ${cell(m.strategic)}${cell(m.ux)}${cell(m.content)}${cell(m.seo)}${cell(m.cro)}${cell(m.tech)}
    <td class="pf-m-o ${s10(m.overall)}">${m.overall}</td></tr>`).join('');
  return `<section class="block"><h2>Page Health Matrix</h2>
    <p class="lead">Цілісний стан ключових сторінок за напрямами (0–10) + загальний Page Health. Одразу видно, де саме сторінка «просідає».</p>
    <table class="pf-m"><thead><tr><th>Сторінка</th><th>Strat</th><th>UX</th><th>Content</th><th>SEO</th><th>CRO</th><th>Tech</th><th>Overall</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function purposeMap(r: PageFlowReport): string {
  const rows = r.purposeMap.map((p) => `<tr><td class="pf-b">${esc(p.page)}</td><td>${esc(p.purpose)}</td>
    <td class="pf-mut">${esc(p.businessRole)}</td><td class="pf-mut">${esc(p.intent)}</td></tr>`).join('');
  return `<section class="block"><h2>Page Purpose &amp; Business Role Map</h2>
    <p class="lead">Одна основна функція на сторінку + вклад у бізнес + Intent користувача.</p>
    <table><thead><tr><th>Сторінка</th><th>Основна функція</th><th>Бізнес-роль</th><th>Intent</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function dimsRow(dims: DimScore[]): string {
  return dims.map((d) => `<div class="pf-dim ${d.measured ? s10(d.score) : 'na'}"><span>${esc(d.label)}</span><b>${d.measured ? d.score : 'н/д'}</b></div>`).join('');
}

function cardHtml(c: PageCard): string {
  const problems = c.problems.map((p) => `<li>${esc(p)}</li>`).join('');
  const gap = c.gap.map((g) => `<span class="pf-gap">${esc(g)}</span>`).join('');
  return `<div class="pf-card">
    <div class="pf-card-h"><span class="pf-pg">${esc(c.page)}</span><b class="pf-url">${esc(c.url)}</b>
      <span class="pf-hs ${s10(c.overall)}">${c.overall}<i>/10</i></span><span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="pf-q">
      <div><span class="pf-k">Навіщо (роль)</span>${esc(c.purpose)} — ${esc(c.businessRole)}</div>
      <div><span class="pf-k">Для кого / Intent</span>${esc(c.userIntent)}</div>
      <div><span class="pf-k">Цільова дія</span>${esc(c.goal)}</div>
      <div><span class="pf-k">Зараз</span>${esc(c.currentState)}</div>
    </div>
    <div class="pf-dims">${dimsRow(c.dims)}</div>
    <div class="pf-pg2">
      <div class="pf-prob"><div class="pf-lbl">Проблеми</div><ul>${problems}</ul></div>
      <div class="pf-gold"><div class="pf-lbl good">Golden Standard</div><p>${esc(c.golden)}</p>${gap ? `<div class="pf-gaps"><b>Бракує:</b> ${gap}</div>` : ''}</div>
    </div>
    <div class="pf-reco"><b>Рекомендація:</b> ${esc(c.recommendation)}</div>
    <div class="pf-eff"><b>Очікуваний ефект:</b> ${esc(c.effect)}</div>
  </div>`;
}

function cards(r: PageFlowReport): string {
  return `<section class="block"><h2>Page-by-Page Audit — картки сторінок</h2>
    <p class="lead">Кожна картка відповідає на 7 питань: навіщо · для кого · який Intent · яку дію · що заважає · Golden Standard · що змінити й який ефект. Плюс Page Score за 16 напрямами.</p>
    ${r.cards.map(cardHtml).join('')}</section>`;
}

function portfolio(r: PageFlowReport): string {
  const rows = r.portfolio.map((p) => `<tr><td class="pf-b">${esc(p.bucket)}</td>
    <td>${p.pages.map((x) => `<span class="pf-chip">${esc(x)}</span>`).join(' ')}</td>
    <td class="pf-mut">${esc(p.note)}</td></tr>`).join('');
  const rm = r.roadmap.map((s, i) => `<div class="pf-rm"><div class="pf-rm-n">${i + 1}</div><div class="pf-rm-b"><b>${esc(s.phase)}</b><span>${esc(s.pages)}</span></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="pf-c pf-mut">${a.n}</td><td class="pf-b">${esc(a.name)}</td>
    <td class="pf-c"><span class="pf-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'GA/SC'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Portfolio · Opportunity · Roadmap</h2>
    <p class="lead">Класифікація сторінок за бізнес-роллю + план і артефакти. ${esc(r.opportunityNote)}</p>
    <table><thead><tr><th>Група</th><th>Сторінки</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table>
    <h3 class="pf-h3">Page Roadmap</h3><div class="pf-rms">${rm}</div>
    <h3 class="pf-h3">Фінальні артефакти (19)</h3>
    <table class="pf-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const PF_CSS = `
  .pf-sp{display:flex;flex-direction:column;}
  .pf-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .pf-sp-row:last-child{border-bottom:0;}
  .pf-sp-id{flex:0 0 34px;font-weight:800;color:var(--lime);font-size:11px;}
  .pf-sp-b b{font-size:10.5px;} .pf-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .pf-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .pf-b{font-weight:700;} .pf-mut{color:var(--muted);font-size:9px;} .pf-c{text-align:center;} .pf-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .pf-m{width:100%;} .pf-m th{text-align:center;} .pf-m th:first-child{text-align:left;} .pf-m td{padding:4px 6px;border-bottom:1px solid var(--line);}
  .pf-m-c,.pf-m-o{text-align:center;font-weight:800;font-size:11px;} .pf-m-c.ok,.pf-m-o.ok{color:var(--ok);} .pf-m-c.check,.pf-m-o.check{color:var(--check);} .pf-m-c.gap,.pf-m-o.gap{color:var(--gap);}
  .pf-m-o{background:var(--soft);border-radius:4px;font-size:12px;}
  .pf-card{border:1px solid var(--line);border-radius:8px;margin:8px 0;overflow:hidden;page-break-inside:avoid;}
  .pf-card-h{display:flex;align-items:center;gap:7px;padding:7px 10px;background:var(--soft);border-bottom:1px solid var(--line);}
  .pf-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .pf-url{font-size:10px;font-family:monospace;flex:1;} .pf-hs{font-weight:800;font-size:14px;} .pf-hs i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;} .pf-hs.ok{color:var(--ok);} .pf-hs.check{color:var(--check);} .pf-hs.gap{color:var(--gap);}
  .pf-q{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;padding:7px 10px;font-size:9px;border-bottom:1px solid var(--line);}
  .pf-q>div{padding:2px 0;} .pf-k{display:block;font-size:7.5px;font-weight:800;letter-spacing:.3px;color:var(--muted);text-transform:uppercase;}
  .pf-dims{display:flex;flex-wrap:wrap;gap:3px;padding:7px 10px;border-bottom:1px solid var(--line);}
  .pf-dim{flex:0 0 auto;border:1px solid var(--line);border-radius:4px;padding:2px 5px;display:flex;align-items:center;gap:4px;}
  .pf-dim span{font-size:7px;color:#555;text-transform:uppercase;letter-spacing:.2px;} .pf-dim b{font-size:9px;font-weight:800;}
  .pf-dim.ok{background:#f0f9f2;} .pf-dim.ok b{color:var(--ok);} .pf-dim.check{background:#fdf7ec;} .pf-dim.check b{color:var(--check);} .pf-dim.gap{background:#fdeeee;} .pf-dim.gap b{color:var(--gap);} .pf-dim.na b{color:var(--muted);}
  .pf-pg2{display:grid;grid-template-columns:1fr 1fr;}
  .pf-prob,.pf-gold{padding:7px 10px;font-size:9px;} .pf-prob{border-right:1px solid var(--line);background:#fffafa;}
  .pf-lbl{font-size:8px;font-weight:800;letter-spacing:.4px;color:var(--muted);margin-bottom:4px;} .pf-lbl.good{color:var(--ok);}
  .pf-prob ul{margin:0;padding-left:15px;} .pf-prob li{color:#7a1f1f;line-height:1.35;margin:1px 0;}
  .pf-gold p{margin:0 0 4px;color:#333;line-height:1.35;} .pf-gaps{font-size:8.5px;color:#8a5a00;} .pf-gaps b{font-weight:700;}
  .pf-gap{display:inline-block;font-size:8px;background:#fdeaea;color:var(--gap);border-radius:8px;padding:1px 6px;margin:1px 2px 0 0;}
  .pf-reco{padding:6px 10px;font-size:9px;border-top:1px solid var(--line);background:#fbfcfd;} .pf-reco b{color:var(--muted);}
  .pf-eff{padding:5px 10px 7px;font-size:9px;color:var(--ok);font-weight:600;} .pf-eff b{color:var(--ok);}
  .pf-chip{display:inline-block;font-size:8px;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:1px 7px;margin:1px 2px 0 0;}
  .pf-rms{display:flex;flex-direction:column;gap:5px;}
  .pf-rm{display:flex;gap:9px;align-items:center;border:1px solid var(--line);border-radius:6px;padding:6px 10px;}
  .pf-rm-n{flex:0 0 20px;height:20px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:10px;display:flex;align-items:center;justify-content:center;}
  .pf-rm-b b{font-size:10px;} .pf-rm-b span{display:block;font-size:8.5px;color:var(--muted);}
  .pf-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .pf-badge.ok{background:#e7f6ec;color:var(--ok);} .pf-badge.na{background:#eef0f3;color:var(--muted);}
  .pf-ctx{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
`;

export function renderPageFlowHtml(r: PageFlowReport): string {
  const coverHtml = cover({
    kicker: 'Page Audit',
    title: 'Page Audit: кожна сторінка як одиниця бізнесу',
    verdict: `Середній Page Health Score — ${r.overall}/10 за розібраними типами сторінок.`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Page Health (сер.)', value: `${r.overall}/10` },
      { label: 'Типів сторінок', value: String(r.cards.length) },
    ],
    note: `<b>Об’єднує лінзи на рівні сторінки.</b> Не замінює UX/UI/Content/SEO/CRO, а показує цілісний стан кожної сторінки й відповідає на 7 питань: навіщо · для кого · Intent · дія · що заважає · Golden Standard · що змінити. Іде після Structure і перед Block-аудитом.`,
  });
  const ctx = `<section class="block"><div class="pf-ctx"><b>Принцип.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній Page Audit: 16 напрямів на сторінку з обходу (Strategic/Intent/UX/UI/Content/SEO/GEO/CRO/Trust/Nav/Linking/Tech/Mobile/A11y/Business Value). Analytics, трафік, конверсія, revenue, A/B — вхід із GA/Search Console, позначено «н/д». Цифри не вигадуються.');
  return doc(`Page Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + matrix(r) + purposeMap(r) + cards(r) + portfolio(r) + foot,
    PF_CSS);
}
