/**
 * «Structure & Site Tree Audit» (клієнтський PDF): архітектура сайту як система —
 * дерево + граф + комерційні осі + точки входу/виходу + цільове дерево + roadmap.
 * 22 артефакти; вимірюване з обходу + позначене «зовн. дані».
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { StructureFlowReport, StructBlockCard, TargetBranch, StructScoreZone, StructHealthZone } from '../structureflow.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const SEV: Record<string, string> = { ok: 'ok', check: 'check', gap: 'gap' };
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');

function spine(r: StructureFlowReport): string {
  const items = r.spine.map((L) => `<div class="sr-sp-row"><div class="sr-sp-id">${esc(L.id)}</div>
    <div class="sr-sp-b"><b>${esc(L.title.replace(/^SR\d+ · /, ''))}</b>
      <p class="sr-sp-pr">${esc(L.principle)}</p><p class="sr-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>Structure &amp; Site Tree Audit: 8 рівнів</h2>
    <p class="lead">Не «чи гарне дерево», а чи правильно сайт організований на рівні сутностей, розділів, звʼязків і точок входу. Дерево + горизонтальні звʼязки (граф) + комерційні осі + точки входу/виходу.</p>
    <div class="sr-sp">${items}</div></section>`;
}

function health(r: StructureFlowReport): string {
  const cards = r.health.zones.map((z: StructHealthZone) => `<div class="sr-hz">
    <div class="sr-hz-v ${s10(z.score)}">${z.score}<i>/10</i></div>
    <div class="sr-hz-l">${esc(z.label)}</div><div class="sr-hz-n">${esc(z.note)}</div></div>`).join('');
  return `<section class="block"><h2>Structure Health Score</h2>
    <p class="lead">Пʼять головних показників архітектури. Далі кожен розкривається детально.</p>
    ${r.health.overall === null
      ? `<div class="sr-hhead"><span class="sr-hcap"><b>Бал не вимірювався.</b> Обхід не дав жодної сторінки — показники готовності рахувати нема з чого.</span></div>`
      : `<div class="sr-hhead"><span class="sr-hbig ${s10(r.health.overall)}">${r.health.overall}</span><span class="sr-hcap">/10 — Structure Health Score</span></div>`}
    <div class="sr-hzs">${cards}</div></section>`;
}

function scoreT(r: StructureFlowReport): string {
  const rows = r.score.zones.map((z: StructScoreZone) => {
    const pct = Math.round((z.score / 10) * 100);
    return `<tr><td class="sr-s-l">${esc(z.label)}</td>
      <td class="sr-s-bar"><span class="bar">${z.measured ? `<span class="fill ${s10(z.score)}" style="width:${pct}%"></span>` : ''}</span></td>
      <td class="sr-s-v">${z.measured ? `<b class="${s10(z.score)}">${z.score}</b><i>/10</i>` : '<span class="sr-na">н/д</span>'}</td></tr>`;
  }).join('');
  return `<section class="block"><h2>Structure Score — 18 напрямів</h2>
    <p class="lead">Деталізація. CMS Fit і конкурентний бенчмарк — «н/д»: потрібен доступ до CMS і дерев конкурентів (зовнішні дані).</p>
    <table class="sr-s"><tbody>${rows}</tbody></table></section>`;
}

function pageTypes(r: StructureFlowReport): string {
  const rows = r.pageTypes.map((t) => `<tr><td class="sr-c">${yn(t.present)}</td><td class="sr-b">${esc(t.type)}</td>
    <td class="sr-c sr-mut">${esc(t.count)}</td><td class="sr-mut">${esc(t.role)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · Page Type Map</h2>
    <p class="lead">Класифікація всіх URL за типом і функцією. Дві сторінки можуть виглядати однаково, але виконувати різні задачі.</p>
    <table><thead><tr><th></th><th>Тип сторінки</th><th>К-сть</th><th>Функція</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function currentTree(r: StructureFlowReport): string {
  if (!r.currentTree.length) return '';
  const rows = r.currentTree.map((t) => `<tr><td class="sr-b">${esc(t.label)}</td>
    <td class="sr-c">${t.count}</td><td class="sr-mut">${esc(t.purpose)}</td>
    <td class="sr-c"><span class="sr-badge ${SEV[t.severity]}">${t.severity === 'ok' ? '✓' : t.severity === 'check' ? '!' : '✕'}</span></td>
    <td class="sr-mut">${esc(t.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · Current Site Tree</h2>
    <p class="lead">Фактичне дерево верхнього рівня (гілки, к-сть сторінок, призначення, стан). Спершу фіксуємо як є.</p>
    <table><thead><tr><th>Гілка</th><th>URL</th><th>Тип</th><th>Стан</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function axes(r: StructureFlowReport): string {
  const rows = r.axes.map((a) => `<tr>
    <td class="sr-pri"><span class="chip ${PRI[a.priority]}">${esc(a.priority)}</span></td>
    <td class="sr-b">${esc(a.axis)}</td><td class="sr-c">${yn(a.exists)}</td><td class="sr-c">${yn(a.hasEntry)}</td>
    <td class="sr-mut">${esc(a.impl)}</td><td class="sr-mut">${esc(a.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · Commercial Axes Map</h2>
    <p class="lead">Сучасний e-commerce — не одне дерево «категорія→товар». Осі (бренди/колекції/подарунки/sale/сценарії) потребують окремих точок входу. Часта проблема: вісь існує, але без входу з шапки.</p>
    <table><thead><tr><th>Пріор.</th><th>Вісь</th><th>Існує</th><th>Точка входу</th><th>Реалізація</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function branch(b: TargetBranch, lvl: number): string {
  const kids = b.children?.length ? b.children.map((c) => branch(c, lvl + 1)).join('') : '';
  return `<div class="sr-tb" style="margin-left:${lvl * 16}px"><span class="sr-tb-m ${b.present ? 'on' : 'off'}">${b.present ? '✓' : '✕'}</span><b>${esc(b.name)}</b>${b.note ? `<i>${esc(b.note)}</i>` : ''}</div>${kids}`;
}
function targetTree(r: StructureFlowReport): string {
  const items = r.targetTree.map((b) => branch(b, 0)).join('');
  const miss = r.targetTree.filter((b) => !b.present).length;
  return `<section class="block"><h2>Артефакт · Target Site Tree</h2>
    <p class="lead">Доведене цільове дерево: ✓ — гілка вже є, ✕ — її бракує (${miss} на верхньому рівні). Головний результат аудиту — не «гарне дерево в Miro», а обґрунтована архітектура: навіщо гілка, який попит закриває, звідки вхід, куди веде, як масштабується.</p>
    <div class="sr-tree"><div class="sr-tb sr-tb-root"><b>HOME</b></div>${items}</div></section>`;
}

function connectivity(r: StructureFlowReport): string {
  const ep = r.entryPoints.map((e) => `<tr><td class="sr-b">${esc(e.page)}</td><td class="sr-c"><b class="${e.entries <= 1 ? 'gap' : 'ok'}">${e.entries}</b></td><td class="sr-mut">${esc(e.note)}</td></tr>`).join('');
  const orph = r.orphans.length ? `<p class="lead" style="margin-top:6px"><b>Orphan-сторінки</b> (${r.orphans.length}): ${r.orphans.map((o) => `${esc(o.label)} <span class="sr-url" style="display:inline">(${esc(o.url)})</span>`).join(', ')}.</p>` : '<p class="lead" style="margin-top:6px">Orphan-сторінок не виявлено.</p>';
  const dead = r.deadEnds.length ? `<p class="lead"><b>Структурні тупики</b> (${r.deadEnds.length}): ${r.deadEnds.map(esc).join('; ')}.</p>` : '<p class="lead">Структурних тупиків не виявлено.</p>';
  return `<section class="block"><h2>Артефакт · Entry / Exit · Orphan · Depth</h2>
    <p class="lead">Точки входу на кожну важливу сторінку, orphan (майже не звʼязані), тупики (немає виходу далі), глибина кліків.</p>
    <table><thead><tr><th>Сторінка</th><th>Входів</th><th>Коментар</th></tr></thead><tbody>${ep}</tbody></table>
    ${orph}${dead}
    <div class="sr-lk"><div class="sr-lk-m"><span class="sr-lk-v">${r.clickDepth.max}</span><span class="sr-lk-l">макс. глибина кліків — ${esc(r.clickDepth.note)}</span></div>
      <div class="sr-lk-m"><span class="sr-lk-v">${r.linking.internalUrls}</span><span class="sr-lk-l">унік. внутр. URL</span></div>
      <div class="sr-lk-m"><span class="sr-lk-v ${r.linking.paramUrls > 40 ? 'gap' : 'ok'}">${r.linking.paramUrls}</span><span class="sr-lk-l">параметричних URL</span></div></div></section>`;
}

function blockCards(r: StructureFlowReport): string {
  if (!r.blockCards.length) return '';
  const cards = r.blockCards.map((c: StructBlockCard) => `<div class="sr-bc">
    <div class="sr-bc-h"><span class="sr-pg">${esc(c.page)}</span><b>${esc(c.name)}</b><span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="sr-bc-meta"><span><b>Функція в архітектурі:</b> ${esc(c.fn)}</span><span><b>Веде до:</b> ${esc(c.leadsTo)}</span></div>
    <div class="sr-bc-cols">
      <div class="sr-now"><div class="sr-lbl">ЗАРАЗ</div><p>${esc(c.now)}</p><div class="sr-prob"><b>Проблема:</b> ${esc(c.problem)}</div></div>
      <div class="sr-should"><div class="sr-lbl good">ЯК МАЄ БУТИ</div><p>${esc(c.should)}</p></div>
    </div></div>`).join('');
  return `<section class="block"><h2>Артефакт · Поблоковий структурний аудит</h2>
    <p class="lead">Кожен блок — за функцією в архітектурі: що представляє (навігація/discovery/звʼязок) і куди має вести. Приклад: «Популярні запити» — входи в long-tail (посилання лише на наявні сторінки).</p>${cards}</section>`;
}

function gaps(r: StructureFlowReport): string {
  const rows = r.gaps.map((g) => `<tr><td class="sr-pri"><span class="chip ${PRI[g.priority]}">${esc(g.priority)}</span></td>
    <td class="sr-b">${esc(g.current)}</td><td>${esc(g.problem)}</td><td class="sr-c2">${esc(g.target)}</td></tr>`).join('');
  const opps = r.opportunities.map((o) => `<div class="sr-opp"><span class="chip ${PRI[o.priority]}">${esc(o.priority)}</span><b>${esc(o.title)}</b><div class="sr-opp-c">${esc(o.chain)}</div></div>`).join('');
  return `<section class="block"><h2>Артефакт · Structure Gap &amp; Opportunity Map</h2>
    <p class="lead">Розриви (current → problem → target) і можливості росту від архітектури до SEO/CRO.</p>
    <table><thead><tr><th>Пріор.</th><th>Зараз</th><th>Проблема</th><th>Ціль</th></tr></thead><tbody>${rows}</tbody></table>
    <h3 class="sr-h3">Можливості</h3>${opps}</section>`;
}

function roadmap(r: StructureFlowReport): string {
  const st = r.roadmap.map((s, i) => `<div class="sr-rm"><div class="sr-rm-n">${i + 1}</div>
    <div class="sr-rm-b"><b>${esc(s.phase)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const arts = r.artifacts.map((a) => `<tr><td class="sr-c sr-mut">${a.n}</td><td class="sr-b">${esc(a.name)}</td>
    <td class="sr-c"><span class="sr-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'зовн. дані'}</span></td></tr>`).join('');
  return `<section class="block"><h2>Structure Roadmap + 22 артефакти</h2>
    <p class="lead">План за 6 фазами: Cleanup → Core Tree → Commercial Axes → Content → SEO → Scale. І перелік артефактів модуля.</p>
    <div class="sr-rms">${st}</div>
    <h3 class="sr-h3">Фінальні артефакти (22)</h3>
    <table class="sr-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${arts}</tbody></table></section>`;
}

const SR_CSS = `
  .sr-sp{display:flex;flex-direction:column;}
  .sr-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .sr-sp-row:last-child{border-bottom:0;}
  .sr-sp-id{flex:0 0 34px;font-weight:800;color:var(--lime);font-size:11px;}
  .sr-sp-b b{font-size:10.5px;} .sr-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .sr-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .sr-hhead{display:flex;align-items:center;gap:12px;margin:4px 0 8px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .sr-hbig{font-size:36px;font-weight:800;line-height:1;} .sr-hcap{font-size:10px;color:#333;}
  .sr-hzs{display:flex;gap:7px;flex-wrap:wrap;}
  .sr-hz{flex:1;min-width:105px;border:1px solid var(--line);border-radius:6px;padding:8px 9px;text-align:center;}
  .sr-hz-v{font-size:20px;font-weight:800;} .sr-hz-v i{font-size:9px;color:var(--muted);font-weight:400;font-style:normal;} .sr-hz-v.ok{color:var(--ok);} .sr-hz-v.check{color:var(--check);} .sr-hz-v.gap{color:var(--gap);}
  .sr-hz-l{font-size:9px;font-weight:800;margin:2px 0;} .sr-hz-n{font-size:7.5px;color:var(--muted);line-height:1.3;}
  .sr-s{width:100%;} .sr-s td{padding:3px 6px;border-bottom:1px solid var(--line);vertical-align:middle;}
  .sr-s-l{font-weight:700;white-space:nowrap;width:200px;font-size:9.5px;} .sr-s-bar{width:130px;} .sr-s-v{white-space:nowrap;width:44px;text-align:right;} .sr-s-v b{font-size:12px;font-weight:800;} .sr-s-v i{color:var(--muted);font-size:8px;font-style:normal;} .sr-na{color:var(--muted);font-size:9px;}
  .sr-b{font-weight:700;} .sr-mut{color:var(--muted);font-size:9px;} .sr-c{text-align:center;} .sr-c2{color:#334;font-size:9px;} .sr-pri{white-space:nowrap;} .sr-url{font-family:monospace;font-size:8px;color:var(--muted);}
  .sr-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .sr-badge.ok{background:#e7f6ec;color:var(--ok);} .sr-badge.check{background:#fdf6e7;color:var(--check);} .sr-badge.gap{background:#fdeaea;color:var(--gap);} .sr-badge.na{background:#eef0f3;color:var(--muted);}
  .sr-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .sr-tree{border:1px solid var(--line);border-radius:6px;padding:8px 10px;background:var(--soft);}
  .sr-tb{display:flex;align-items:center;gap:6px;padding:2px 0;font-size:9.5px;} .sr-tb-root b{font-size:11px;}
  .sr-tb b{font-weight:700;} .sr-tb i{color:var(--muted);font-size:8.5px;font-style:normal;}
  .sr-tb-m{width:15px;height:15px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;} .sr-tb-m.on{background:var(--ok);} .sr-tb-m.off{background:var(--gap);}
  .sr-lk{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 0;}
  .sr-lk-m{flex:1;min-width:120px;border:1px solid var(--line);border-radius:6px;padding:8px 10px;text-align:center;background:var(--soft);}
  .sr-lk-v{display:block;font-size:22px;font-weight:800;line-height:1.1;} .sr-lk-v.ok{color:var(--ok);} .sr-lk-v.gap{color:var(--gap);} .sr-lk-l{display:block;font-size:8px;color:var(--muted);margin-top:2px;}
  .sr-bc{border:1px solid var(--line);border-radius:7px;margin:7px 0;overflow:hidden;page-break-inside:avoid;}
  .sr-bc-h{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);}
  .sr-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .sr-bc-h b{font-size:11px;flex:1;}
  .sr-bc-meta{display:flex;flex-wrap:wrap;gap:4px 14px;padding:6px 9px;font-size:8.5px;color:#444;border-bottom:1px solid var(--line);} .sr-bc-meta b{color:var(--muted);}
  .sr-bc-cols{display:grid;grid-template-columns:1fr 1fr;}
  .sr-now,.sr-should{padding:7px 9px;font-size:9px;} .sr-now{border-right:1px solid var(--line);background:#fcfcfc;}
  .sr-lbl{font-size:8px;font-weight:800;letter-spacing:.5px;color:var(--muted);margin-bottom:4px;} .sr-lbl.good{color:var(--ok);}
  .sr-now p,.sr-should p{margin:0 0 4px;line-height:1.35;color:#333;} .sr-prob{font-size:8.5px;color:#7a1f1f;} .sr-prob b{font-weight:700;}
  .sr-opp{border:1px solid var(--line);border-left:3px solid var(--lime);border-radius:0 6px 6px 0;margin:5px 0;padding:6px 9px;}
  .sr-opp b{font-size:9.5px;margin-left:6px;} .sr-opp-c{font-size:8.5px;color:#334;margin-top:3px;font-family:monospace;}
  .sr-rms{display:flex;flex-direction:column;gap:6px;}
  .sr-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .sr-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .sr-rm-b b{font-size:10px;} .sr-rm-b ul{margin:3px 0 0;padding-left:16px;} .sr-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .sr-ctx{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
`;

export function renderStructureFlowHtml(r: StructureFlowReport): string {
  const coverHtml = cover({
    kicker: 'Structure & Site Tree Audit',
    title: 'Structure & Site Tree Audit: архітектура сайту як система',
    verdict: `Structure Health Score — ${r.health.overall === null ? 'не вимірювався' : r.health.overall + '/10'} за виміряними зонами (обхід).`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Structure Health', value: `${r.health.overall === null ? 'не вимірювався' : r.health.overall + '/10'}` },
      { label: 'Розривів', value: String(r.gaps.length) },
    ],
    note: `<b>Дерево + граф + осі + точки входу.</b> Відповідає, чи правильно сайт організований на рівні сутностей, розділів, звʼязків і точок входу — чи швидко знаходить користувач, чи розуміє структуру пошук, чи масштабується каталог без перебудови. Іде після Strategic і перед Page/Block-аудитами: спершу визначаємо, які сторінки МАЮТЬ існувати.`,
  });
  const ctx = `<section class="block"><div class="sr-ctx"><b>Місце в системі.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Зовнішній структурний аудит: вимірюване з обходу (типи сторінок, дерево, осі, точки входу/виходу, orphan, глибина, перелінковка, параметри). Дерева конкурентів, дані Search Console/Analytics, CMS-обмеження — вхід ззовні, позначено «зовн. дані/н/д». Цифри не вигадуються.');
  return doc(`Structure & Site Tree Audit · ${r.client}`,
    coverHtml + ctx + spine(r) + health(r) + scoreT(r) + pageTypes(r) + currentTree(r) + axes(r) + targetTree(r) + connectivity(r) + blockCards(r) + gaps(r) + roadmap(r) + foot,
    SR_CSS);
}
