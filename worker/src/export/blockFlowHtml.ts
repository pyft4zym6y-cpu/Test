/**
 * «Block-by-Block Audit» (клієнтський PDF): найдетальніший рівень — кожен блок як
 * функціональна одиниця з усіма лінзами. Block Health Matrix + 15-осьовий Score +
 * картки Problem-формату + рішення Keep/Improve/Move/Merge/Expand/Remove/Create +
 * Block Architecture Map. Score ≠ Priority. 24 артефакти.
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { BlockFlowReport, BlockRecord, MatrixRow, BlockDim } from '../blockflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const s5 = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const DEC: Record<string, string> = { Create: 'gap', Improve: 'check', Expand: 'check', Merge: 'lime', Move: 'lime', Remove: 'gap', Keep: 'ok' };
const IMP: Record<string, string> = { High: 'gap', Medium: 'check', Low: 'ok' };

function spine(r: BlockFlowReport): string {
  const items = r.spine.map((L) => `<div class="bl-sp-row"><div class="bl-sp-id">${esc(L.id)}</div>
    <div class="bl-sp-b"><b>${esc(L.title.replace(/^BL\d+ · /, ''))}</b>
      <p class="bl-sp-pr">${esc(L.principle)}</p><p class="bl-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>Block-by-Block Audit: 8 рівнів</h2>
    <p class="lead">Найдетальніший рівень. Формула: Block = Purpose + Context + Content + UX + UI + Interaction + CTA + Proof + SEO + GEO + CRO + Technical + Analytics. Блок описується не «добрий/поганий», а повним ланцюгом. Ключове: Block Score ≠ Priority.</p>
    <div class="bl-sp">${items}</div></section>`;
}

function matrix(r: BlockFlowReport): string {
  if (!r.matrix.length) return '';
  const cell = (v: number) => `<td class="bl-m-c ${s5(v)}">${v}</td>`;
  const rows = r.matrix.map((m: MatrixRow) => `<tr><td class="bl-b">${esc(m.block)}<span class="bl-pgn">${esc(m.page)}</span></td>
    ${cell(m.ux)}${cell(m.ui)}${cell(m.content)}${cell(m.cro)}${cell(m.seo)}${cell(m.geo)}
    <td class="bl-c"><span class="bl-imp ${IMP[m.impact]}">${esc(m.impact)}</span></td>
    <td class="bl-c"><span class="chip ${PRI[m.priority]}">${esc(m.priority)}</span></td></tr>`).join('');
  return `<section class="block"><h2>Block Health Matrix</h2>
    <p class="lead">Блоки, що потребують правок (0–5 за напрямами) + Impact + Priority. Impact окремо від Score: блок 4/5 на високотрафіковій сторінці важливіший за 5/5 у футері.</p>
    <table class="bl-m"><thead><tr><th>Блок</th><th>UX</th><th>UI</th><th>Content</th><th>CRO</th><th>SEO</th><th>GEO</th><th>Impact</th><th>Пріор.</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function classification(r: BlockFlowReport): string {
  const rows = r.classification.map((c) => `<tr><td class="bl-b">${esc(c.category)}</td>
    <td>${c.blocks.map((b) => `<span class="bl-chip">${esc(b)}</span>`).join(' ')}</td></tr>`).join('');
  return `<section class="block"><h2>Block Classification</h2>
    <p class="lead">Кожен блок — за функцією. Один блок може мати кілька функцій, але одну Primary Function.</p>
    <table><thead><tr><th>Категорія</th><th>Блоки</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function dimsRow(dims: BlockDim[]): string {
  return dims.map((d) => `<div class="bla-dim ${s5(d.score)}"><span>${esc(d.label)}</span><b>${d.score}</b></div>`).join('');
}

function card(c: BlockRecord): string {
  return `<div class="bl-card">
    <div class="bl-card-h"><span class="bl-pg">${esc(c.page)}</span><b>${esc(c.name)}</b>
      <span class="bl-cat">${esc(c.category)} · ${esc(c.valueClass)}</span>
      <span class="bl-hs ${s10(c.score)}">${c.score}<i>/10</i></span>
      <span class="bl-imp ${IMP[c.impact]}">${esc(c.impact)}</span>
      <span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span>
      <span class="bl-dec ${DEC[c.decision]}">${esc(c.decision)}</span></div>
    <div class="bl-meta"><span><b>Навіщо:</b> ${esc(c.purpose)}</span><span><b>Бізнес:</b> ${esc(c.businessFn)}</span><span><b>Користувач:</b> ${esc(c.userFn)}</span></div>
    <div class="bl-dims">${dimsRow(c.dims)}</div>
    <div class="bl-body">
      <div class="bl-row"><span class="bl-k">Current</span>${esc(c.current)}</div>
      <div class="bl-row"><span class="bl-k">Problem</span><span class="bl-prob">${esc(c.problem)}</span></div>
      <div class="bl-row"><span class="bl-k">Why</span>${esc(c.why)}</div>
      <div class="bl-row"><span class="bl-k">Golden Standard</span><span class="bl-gold">${esc(c.golden)}</span></div>
      <div class="bl-row"><span class="bl-k">Веде далі</span>${esc(c.leadsTo)}</div>
      <div class="bl-row"><span class="bl-k">Рекомендація</span>${esc(c.recommendation)}</div>
    </div>
    <div class="bl-foot"><span class="bl-eff"><b>Ефект:</b> ${esc(c.effect)}</span><span class="bl-ef2">Effort: ${esc(c.effort)}</span></div>
  </div>`;
}

function cards(r: BlockFlowReport): string {
  const show = r.cards.filter((c) => c.decision !== 'Keep').slice(0, 12);
  return `<section class="block"><h2>Block Problem Cards (Top-${show.length} за пріоритетом)</h2>
    <p class="lead">Кожен блок: що це → навіщо → для кого → Current → Problem → Why → Golden Standard → веде далі → рекомендація → 15-осьовий Score → Impact → Priority → Effort → ефект → рішення. Приклади FAQ і відгуків — за логікою прототипу.</p>
    ${show.map(card).join('')}</section>`;
}

function decisionsArch(r: BlockFlowReport): string {
  const map: Record<string, string> = { Create: 'gap', Improve: 'check', Keep: 'ok', Expand: 'check', Merge: 'lime', Move: 'lime', Remove: 'gap' };
  const dec = r.decisions.map((d) => `<div class="bl-dc"><span class="bl-dc-n ${map[d.decision] ?? ''}">${d.count}</span><span class="bl-dc-v">${esc(d.decision)}</span><span class="bl-dc-note">${esc(d.note)}</span></div>`).join('');
  const opps = r.opportunities.map((o) => `<div class="bl-opp"><b>${esc(o.block)}: ${esc(o.opportunity)}</b><div class="bl-opp-c">${esc(o.chain)}</div></div>`).join('');
  const arch = r.architecture.map((a) => `<div class="bl-arch"><b>${esc(a.page)}</b><div class="bl-arch-seq">${a.sequence.map((s, i) => `${i ? '<span class="bl-arr">→</span>' : ''}<span class="bl-node">${esc(s)}</span>`).join('')}</div></div>`).join('');
  return `<section class="block"><h2>Decisions · Opportunities · Block Architecture</h2>
    <p class="lead">Рішення по кожному блоку, недовикористані блоки (opportunity) і цільова послідовність блоків за типом сторінки.</p>
    <div class="bl-decs">${dec}</div>
    <h3 class="bl-h3">Block Opportunity Map (хороший, але недовикористаний)</h3>${opps}
    <h3 class="bl-h3">Block Architecture Map (цільова послідовність)</h3>${arch}</section>`;
}

function roadmap(r: BlockFlowReport): string {
  const rm = r.roadmap.map((s, i) => `<div class="bl-rm"><div class="bl-rm-n">${i + 1}</div><div class="bl-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="bl-c bl-mut">${a.n}</td><td class="bl-b">${esc(a.name)}</td><td class="bl-c"><span class="bl-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'GA/A-B'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Roadmap + 24 артефакти</h2>
    <p class="lead">План покращення блоків і повний перелік артефактів модуля.</p>
    <div class="bl-rms">${rm}</div>
    <h3 class="bl-h3">Фінальні артефакти (24)</h3>
    <table class="bl-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const BL_CSS = `
  .bl-sp{display:flex;flex-direction:column;}
  .bl-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .bl-sp-row:last-child{border-bottom:0;}
  .bl-sp-id{flex:0 0 34px;font-weight:800;color:var(--lime);font-size:11px;}
  .bl-sp-b b{font-size:10.5px;} .bl-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .bl-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .bl-b{font-weight:700;} .bl-mut{color:var(--muted);font-size:9px;} .bl-c{text-align:center;} .bl-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .bl-pgn{display:block;font-weight:400;font-size:8px;color:var(--muted);}
  .bl-m{width:100%;} .bl-m th{text-align:center;} .bl-m th:first-child{text-align:left;} .bl-m td{padding:4px 6px;border-bottom:1px solid var(--line);}
  .bl-m-c{text-align:center;font-weight:800;font-size:11px;} .bl-m-c.ok{color:var(--ok);} .bl-m-c.check{color:var(--check);} .bl-m-c.gap{color:var(--gap);}
  .bl-imp{font-size:8px;font-weight:800;padding:1px 6px;border-radius:8px;} .bl-imp.gap{background:#fdeaea;color:var(--gap);} .bl-imp.check{background:#fdf6e7;color:var(--check);} .bl-imp.ok{background:#e7f6ec;color:var(--ok);}
  .bl-chip{display:inline-block;font-size:8px;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:1px 7px;margin:1px 2px 0 0;}
  .bl-card{border:1px solid var(--line);border-radius:8px;margin:8px 0;overflow:hidden;page-break-inside:avoid;}
  .bl-card-h{display:flex;align-items:center;gap:6px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);flex-wrap:wrap;}
  .bl-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .bl-card-h b{font-size:11px;} .bl-cat{font-size:8px;color:var(--muted);} .bl-hs{margin-left:auto;font-weight:800;font-size:12px;} .bl-hs i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;} .bl-hs.ok{color:var(--ok);} .bl-hs.check{color:var(--check);} .bl-hs.gap{color:var(--gap);}
  .bl-dec{font-size:8px;font-weight:800;color:#fff;padding:2px 8px;border-radius:10px;} .bl-dec.gap{background:var(--gap);} .bl-dec.check{background:var(--check);} .bl-dec.lime{background:var(--lime);} .bl-dec.ok{background:var(--ok);}
  .bl-meta{display:flex;flex-wrap:wrap;gap:3px 12px;padding:6px 9px;font-size:8.5px;color:#444;border-bottom:1px solid var(--line);} .bl-meta b{color:var(--muted);}
  .bl-dims{display:flex;flex-wrap:wrap;gap:2px;padding:6px 9px;border-bottom:1px solid var(--line);}
  .bla-dim{flex:0 0 auto;border:1px solid var(--line);border-radius:3px;padding:1px 4px;display:flex;align-items:center;gap:3px;}
  .bla-dim span{font-size:6.5px;color:#555;text-transform:uppercase;} .bla-dim b{font-size:8px;font-weight:800;}
  .bla-dim.ok{background:#f0f9f2;} .bla-dim.ok b{color:var(--ok);} .bla-dim.check{background:#fdf7ec;} .bla-dim.check b{color:var(--check);} .bla-dim.gap{background:#fdeeee;} .bla-dim.gap b{color:var(--gap);}
  .bl-body{padding:6px 9px;} .bl-row{display:flex;gap:7px;font-size:9px;line-height:1.4;padding:1px 0;} .bl-k{flex:0 0 96px;color:var(--muted);font-weight:700;font-size:8px;text-transform:uppercase;letter-spacing:.3px;}
  .bl-prob{color:#7a1f1f;} .bl-gold{color:#166534;}
  .bl-foot{display:flex;justify-content:space-between;align-items:center;padding:5px 9px;border-top:1px solid var(--line);background:#fbfcfd;} .bl-eff{font-size:9px;color:var(--ok);font-weight:600;} .bl-eff b{color:var(--ok);} .bl-ef2{font-size:8px;color:var(--muted);}
  .bl-decs{display:flex;gap:6px;flex-wrap:wrap;}
  .bl-dc{flex:1;min-width:90px;border:1px solid var(--line);border-radius:6px;padding:7px 8px;text-align:center;}
  .bl-dc-n{display:block;font-size:20px;font-weight:800;} .bl-dc-n.ok{color:var(--ok);} .bl-dc-n.check{color:var(--check);} .bl-dc-n.gap{color:var(--gap);} .bl-dc-n.lime{color:var(--lime);}
  .bl-dc-v{display:block;font-size:9px;font-weight:800;margin:1px 0;} .bl-dc-note{display:block;font-size:7.5px;color:var(--muted);line-height:1.25;}
  .bl-opp{border:1px solid var(--line);border-left:3px solid var(--lime);border-radius:0 6px 6px 0;margin:5px 0;padding:6px 9px;}
  .bl-opp b{font-size:9.5px;} .bl-opp-c{font-size:8.5px;color:#334;margin-top:3px;font-family:monospace;}
  .bl-arch{margin:5px 0;} .bl-arch b{font-size:9.5px;} .bl-arch-seq{display:flex;flex-wrap:wrap;align-items:center;gap:3px;margin-top:3px;}
  .bl-node{font-size:8px;background:var(--soft);border:1px solid var(--line);border-radius:4px;padding:2px 6px;} .bl-arr{color:var(--lime);font-weight:800;font-size:9px;}
  .bl-rms{display:flex;flex-direction:column;gap:6px;}
  .bl-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .bl-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .bl-rm-b b{font-size:10px;} .bl-rm-b ul{margin:3px 0 0;padding-left:16px;} .bl-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .bl-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .bl-badge.ok{background:#e7f6ec;color:var(--ok);} .bl-badge.na{background:#eef0f3;color:var(--muted);}
  .bl-ctx{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
`;

export function renderBlockFlowHtml(r: BlockFlowReport): string {
  const coverHtml = cover({
    kicker: 'Block-by-Block Audit',
    title: 'Block-by-Block Audit: кожен блок як функціональна одиниця',
    verdict: `Середній Block Health Score — ${r.overall}/10; блоків розібрано — ${r.cards.length}.`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Block Health (сер.)', value: `${r.overall}/10` },
      { label: 'Блоків', value: String(r.cards.length) },
    ],
    note: `<b>Найдетальніший рівень.</b> Кожен блок — не «гарний/поганий», а: що це → навіщо → для кого → яку задачу → чому тут → що зараз → що не працює → Golden Standard → як має бути → що змінити → який KPI → ефект → пріоритет → складність. Block Score ≠ Priority (важить трафік-експозиція). Іде після Page Audit.`,
  });
  const ctx = `<section class="block"><div class="bl-ctx"><b>Принцип.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній Block Audit: 15 напрямів на блок з обходу (Strategic/User/UX/UI/Content/CRO/SEO/GEO/Trust/Nav/A11y/Mobile/Performance/Analytics/Technical) + рішення й пріоритет. Per-block Performance/Analytics/A-B — після інструментування (GA/тести), позначено окремо. Цифри не вигадуються.');
  return doc(`Block-by-Block Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + matrix(r) + classification(r) + cards(r) + decisionsArch(r) + roadmap(r) + foot,
    BL_CSS);
}
