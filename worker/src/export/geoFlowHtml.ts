/**
 * «GEO / AEO / LLM Visibility — аудит» (клієнтський PDF). Окремий великий модуль:
 * 12 артефактів + Score. Дві чесні зони — вимірюване з обходу і вимірюване лише
 * живим прогоном AI-запитів (позначене «н/д», без вигаданих цифр).
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { GeoFlowReport, GeoBlockCard, GeoScoreZone } from '../geoflow.js';
import { scoreText } from '../flowScore.js';

const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');
const s5 = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const ACC: Record<string, string> = { ok: 'ok', blocked: 'gap', na: 'na' };
const ACCW: Record<string, string> = { ok: 'відкрито', blocked: 'заблоковано', na: 'н/д' };
const yn = (b: boolean) => (b ? '<span class="ok">✓</span>' : '<span class="gap">✕</span>');
const mini = (l: string, v: number) => `<div class="gfa-mini"><span>${l}</span><b class="${s5(v)}">${v}<i>/5</i></b></div>`;

function spine(r: GeoFlowReport): string {
  const items = r.spine.map((L) => `<div class="gf-sp-row"><div class="gf-sp-id">${esc(L.id)}</div>
    <div class="gf-sp-b"><b>${esc(L.title.replace(/^G\d+ · /, ''))}</b>
      <p class="gf-sp-pr">${esc(L.principle)}</p><p class="gf-sp-st">${esc(L.state)}</p></div></div>`).join('');
  return `<section class="block"><h2>GEO / AEO / LLM Visibility як система: 8 рівнів</h2>
    <p class="lead">AEO — прямий відповідь · GEO — шанс стати джерелом · LLM Visibility — присутність і коректність бренду в AI. Логіка: Crawlability → Entity → Consistency → Answerability → Coverage → Page/Block → Authority/SoV → Roadmap.</p>
    <div class="gf-sp">${items}</div></section>`;
}

function liveBanner(r: GeoFlowReport): string {
  return `<section class="block"><div class="gf-live"><b>Чесна модель вимірювання.</b> ${esc(r.liveNote)}</div></section>`;
}

function score(r: GeoFlowReport): string {
  const rows = r.score.zones.map((z: GeoScoreZone) => {
    const pct = Math.round((z.score / 10) * 100);
    return `<tr><td class="gfs-l">${esc(z.label)}</td>
      <td class="gfs-bar"><span class="bar">${z.measured ? `<span class="fill ${s10(z.score)}" style="width:${pct}%"></span>` : ''}</span></td>
      <td class="gfs-v">${z.measured ? `<b class="${s10(z.score)}">${z.score}</b><i>/10</i>` : '<span class="gfs-na">н/д</span>'}</td>
      <td class="gfs-n">${esc(z.note)}</td></tr>`;
  }).join('');
  const na = r.score.zones.filter((z) => !z.measured).length;
  return `<section class="block"><h2>GEO / AEO / LLM Score — зони</h2>
    <p class="lead">Оцінка в один бал за зонами. ${na} зон (Brand/Citation Visibility, Share of Voice, Accuracy, External Authority, AI Conversion…) чесно «н/д» — вимірюються лише живим прогоном AI-запитів чи інструментами; у середнє не входять і не вигадуються.</p>
    ${r.score.overall === null
      ? `<div class="gf-shead"><span class="gf-scap"><b>GEO/AEO Score не вимірювався.</b><br><i>${scoreText(r.score)}. Без обходу число склалося б із базових констант формул, а не зі спостережень.</i></span></div>`
      : `<div class="gf-shead"><span class="gf-sbig ${s10(r.score.overall)}">${r.score.overall}</span><span class="gf-scap">/10 — GEO/AEO Score<br><i>середнє за ${r.score.coverage.zonesMeasured} виміряними зонами з ${r.score.coverage.zonesTotal} · розібрано сторінок: ${r.score.coverage.pagesAnalysed}</i></span></div>`}
    <table class="gfs"><tbody>${rows}</tbody></table></section>`;
}

function crawlability(r: GeoFlowReport): string {
  const rows = r.crawlability.map((b) => `<tr>
    <td class="gf-b">${esc(b.bot)}</td><td class="gf-mut">${esc(b.surface)}</td>
    <td class="gf-st"><span class="gf-badge ${ACC[b.access]}">${ACCW[b.access]}</span></td>
    <td class="gf-mut">${esc(b.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · AI Crawlability</h2>
    <p class="lead">Перший привід: чи AI взагалі бачить сайт. Доступ ключових AI-ботів (robots.txt) + llms.txt. Заблокований бот = сайт невидимий для відповідної AI-системи.</p>
    <table class="gf-bots"><thead><tr><th>AI-бот</th><th>Поверхня</th><th>Доступ</th><th>Деталі</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function entities(r: GeoFlowReport): string {
  const rows = r.entities.map((e) => `<tr>
    <td class="gf-b">${esc(e.entity)}</td>
    <td class="gf-c">${yn(e.named)}</td><td class="gf-c">${yn(e.described)}</td><td class="gf-c">${yn(e.schema)}</td>
    <td class="gf-c gf-mut">н/д</td><td class="gf-mut">${esc(e.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · Entity Map</h2>
    <p class="lead">Чи розуміє AI сутності бренду однозначно. «Зовнішнє підтвердження» — н/д до аудиту згадок (Wikidata/каталоги/СМІ).</p>
    <table><thead><tr><th>Сутність</th><th>Названа</th><th>Описана</th><th>Розмітка</th><th>Зовн. підтв.</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function answerability(r: GeoFlowReport): string {
  if (!r.answerability.length) return '';
  const rows = r.answerability.map((a) => `<tr>
    <td class="gf-b">${esc(a.page)}<span class="gf-url">${esc(a.url)}</span></td>
    <td class="gf-c">${yn(a.directAnswer)}</td><td class="gf-c">${yn(a.structured)}</td><td class="gf-c">${yn(a.facts)}</td><td class="gf-c">${yn(a.faq)}</td>
    <td class="gf-c"><b class="${s5(a.score)}">${a.score}</b><i>/5</i></td><td class="gf-mut">${esc(a.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · Answerability (AEO)</h2>
    <p class="lead">Чи може AI швидко витягти конкретну відповідь зі сторінки. Модель: питання → короткий прямий відповідь → деталі → доказ → джерело.</p>
    <table><thead><tr><th>Сторінка</th><th>Прямий відповідь</th><th>Структура</th><th>Факти</th><th>FAQ</th><th>Оцінка</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function blockCards(r: GeoFlowReport): string {
  if (!r.blockCards.length) return '';
  const cards = r.blockCards.map((c: GeoBlockCard) => `<div class="gf-bc">
    <div class="gf-bc-h"><span class="gf-pg">${esc(c.page)}</span><b>${esc(c.name)}</b>
      <span class="gf-bc-score ${s5(c.score)}">${c.score}<i>/5</i></span><span class="chip ${PRI[c.priority]}">${esc(c.priority)}</span></div>
    <div class="gf-bc-cols">
      <div class="gf-now"><div class="gf-lbl">ЗАРАЗ</div><p>${esc(c.now)}</p></div>
      <div class="gf-should"><div class="gf-lbl good">ЯК МАЄ БУТИ</div><p>${esc(c.should)}</p></div>
    </div>
    <div class="gf-axes">${mini('Answerability', c.answerability)}${mini('Структура', c.structure)}${mini('Entity', c.entity)}${mini('Докази', c.evidence)}${mini('Перелінк.', c.linking)}${mini('AEO', c.aeo)}</div>
    <div class="gf-bc-reco"><b>Рекомендація:</b> ${esc(c.recommendation)}</div>
    <div class="gf-bc-eff"><b>Ефект:</b> ${esc(c.effect)}</div></div>`).join('');
  return `<section class="block"><h2>Артефакт · Поблоковий GEO/AEO-аудит</h2>
    <p class="lead">Кожен GEO-значущий блок окремо: Зараз → Як має бути → оцінка Answerability/Структура/Entity/Докази/Перелінковка/AEO → рекомендація → ефект. Приклад FAQ: «глухий кут» → прямий відповідь + доказ + тематичні переходи.</p>${cards}</section>`;
}

function gaps(r: GeoFlowReport): string {
  if (!r.gapMap.length) return '';
  const rows = r.gapMap.map((g) => `<tr>
    <td class="gf-pri"><span class="chip ${PRI[g.priority]}">${esc(g.priority)}</span></td>
    <td class="gf-b">${esc(g.title)}</td><td>${esc(g.why)}</td><td class="gf-c2">${esc(g.create)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · AI Content Gap Map</h2>
    <p class="lead">Якого контенту бракує саме для AI-сценаріїв (порівняння, гайди, «для кого», прямі відповіді). Джерело нового контенту під генеративні запити.</p>
    <table><thead><tr><th>Пріор.</th><th>Розрив</th><th>Чому важливо для AI</th><th>Що створити</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function mainTable(r: GeoFlowReport): string {
  const rows = r.mainTable.map((m) => `<tr>
    <td class="gf-b">${esc(m.query)}</td><td class="gf-mut">${esc(m.intent)}</td>
    <td class="gf-url2">${esc(m.ourUrl)}</td>
    <td class="gf-na2">заповнюється в прогоні</td><td class="gf-na2">—</td><td class="gf-na2">—</td>
    <td class="gf-mut">${esc(m.note)}</td></tr>`).join('');
  return `<section class="block"><h2>Артефакт · Головна таблиця GEO (робочий документ)</h2>
    <p class="lead">Центральний робочий документ. Колонки Mention / Citation / Competitor / Accuracy заповнюються під час <b>живого прогону AI-запитів</b> — тут задано структуру й приклади запитів під сайт, без вигаданих даних.</p>
    <table class="gf-main"><thead><tr><th>AI-запит</th><th>Intent</th><th>Наш URL</th><th>Mention</th><th>Citation</th><th>Accuracy</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function roadmap(r: GeoFlowReport): string {
  if (!r.roadmap.length) return '';
  const st = r.roadmap.map((s, i) => `<div class="gf-rm"><div class="gf-rm-n">${i + 1}</div>
    <div class="gf-rm-b"><b>${esc(s.stage)}</b><ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div></div>`).join('');
  const opps = r.opportunities.map((o) => `<div class="gf-opp"><span class="chip ${PRI[o.priority]}">${esc(o.priority)}</span><b>${esc(o.title)}</b><div class="gf-opp-c">${esc(o.chain)}</div></div>`).join('');
  return `<section class="block"><h2>Артефакт · GEO Opportunity Map + Roadmap</h2>
    <p class="lead">Карта можливостей і послідовний план росту присутності в AI.</p>
    ${opps}
    <h3 class="gf-h3">GEO / AEO Roadmap</h3><div class="gf-rms">${st}</div></section>`;
}

function artifacts(r: GeoFlowReport): string {
  const rows = r.artifacts.map((a) => `<tr><td class="gf-c gf-mut">${a.n}</td><td class="gf-b">${esc(a.name)}</td>
    <td class="gf-st"><span class="gf-badge ${a.source === 'обхід' ? 'ok' : 'na'}">${a.source === 'обхід' ? 'з обходу' : 'живий прогін'}</span></td></tr>`).join('');
  return `<section class="block"><h2>12 артефактів GEO-аудиту</h2>
    <p class="lead">Що видає модуль. «З обходу» — готове зараз (детерміновано); «живий прогін» — заповнюється прогоном AI-запитів і підключенням інструментів (SC AI-звіти, Bing AI Performance, GA).</p>
    <table class="gf-arts"><thead><tr><th>#</th><th>Артефакт</th><th>Джерело</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

const GF_CSS = `
  .gf-sp{display:flex;flex-direction:column;}
  .gf-sp-row{display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);page-break-inside:avoid;} .gf-sp-row:last-child{border-bottom:0;}
  .gf-sp-id{flex:0 0 30px;font-weight:800;color:var(--lime);font-size:12px;}
  .gf-sp-b b{font-size:10.5px;} .gf-sp-pr{margin:2px 0;color:#444;font-size:9px;line-height:1.35;} .gf-sp-st{margin:0;color:var(--muted);font-size:8.5px;}
  .gf-live{border:1px solid #c9d4ff;background:#eef2ff;border-left:4px solid #2f4fd0;border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#1e2a5a;}
  .gf-shead{display:flex;align-items:center;gap:12px;margin:4px 0 8px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .gf-sbig{font-size:34px;font-weight:800;line-height:1;} .gf-scap{font-size:10px;color:#333;} .gf-scap i{color:var(--muted);font-size:8px;font-style:normal;}
  .gfs{width:100%;} .gfs td{padding:3px 6px;vertical-align:middle;border-bottom:1px solid var(--line);}
  .gfs-l{font-weight:700;white-space:nowrap;width:170px;} .gfs-bar{width:110px;} .gfs-v{white-space:nowrap;width:44px;text-align:right;} .gfs-v b{font-size:12px;font-weight:800;} .gfs-v i{color:var(--muted);font-size:8px;font-style:normal;} .gfs-n{color:#555;font-size:9px;} .gfs-na{color:var(--muted);font-size:9px;}
  .lime{color:var(--lime);}
  .gf-b{font-weight:700;} .gf-mut{color:var(--muted);} .gf-c{text-align:center;} .gf-c2{color:#334;font-size:9px;} .gf-pri{white-space:nowrap;}
  .gf-url{display:block;font-weight:400;font-size:8px;color:var(--muted);font-family:monospace;} .gf-url2{font-family:monospace;font-size:8.5px;color:#334;} .gf-st{text-align:center;white-space:nowrap;}
  .gf-badge{display:inline-block;font-weight:800;font-size:8px;padding:2px 7px;border-radius:10px;} .gf-badge.ok{background:#e7f6ec;color:var(--ok);} .gf-badge.gap{background:#fdeaea;color:var(--gap);} .gf-badge.na{background:#eef0f3;color:var(--muted);}
  .gf-bots td,.gf-arts td,.gf-main td{font-size:9px;} .gf-na2{color:var(--muted);font-size:8px;text-align:center;font-style:italic;}
  .gf-bc{border:1px solid var(--line);border-radius:7px;margin:7px 0;overflow:hidden;page-break-inside:avoid;}
  .gf-bc-h{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);}
  .gf-pg{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:1px 7px;}
  .gf-bc-h b{font-size:11px;flex:1;} .gf-bc-score{font-weight:800;font-size:12px;} .gf-bc-score i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;}
  .gf-bc-cols{display:grid;grid-template-columns:1fr 1fr;}
  .gf-now,.gf-should{padding:7px 9px;font-size:9px;} .gf-now{border-right:1px solid var(--line);background:#fcfcfc;}
  .gf-lbl{font-size:8px;font-weight:800;letter-spacing:.5px;color:var(--muted);margin-bottom:4px;} .gf-lbl.good{color:var(--ok);}
  .gf-now p,.gf-should p{margin:0;line-height:1.35;color:#333;}
  .gf-axes{display:flex;border-top:1px solid var(--line);} .gfa-mini{flex:1;text-align:center;padding:5px 1px;border-right:1px solid var(--line);} .gfa-mini:last-child{border-right:0;}
  .gfa-mini span{display:block;font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.2px;} .gfa-mini b{font-size:11px;font-weight:800;} .gfa-mini b i{font-size:6.5px;color:var(--muted);font-weight:400;font-style:normal;}
  .gf-bc-reco{padding:6px 9px;font-size:9px;border-top:1px solid var(--line);background:#fbfcfd;} .gf-bc-reco b{color:var(--muted);}
  .gf-bc-eff{padding:5px 9px 7px;font-size:9px;color:var(--ok);font-weight:600;} .gf-bc-eff b{color:var(--ok);}
  .gf-opp{border:1px solid var(--line);border-left:3px solid var(--lime);border-radius:0 6px 6px 0;margin:5px 0;padding:6px 9px;}
  .gf-opp b{font-size:10px;margin-left:6px;} .gf-opp-c{font-size:8.5px;color:#334;margin-top:3px;font-family:monospace;}
  .gf-h3{font-size:11px;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--line);}
  .gf-rms{display:flex;flex-direction:column;gap:6px;}
  .gf-rm{display:flex;gap:9px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;page-break-inside:avoid;}
  .gf-rm-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
  .gf-rm-b b{font-size:10px;} .gf-rm-b ul{margin:3px 0 0;padding-left:16px;} .gf-rm-b li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
`;

export function renderGeoFlowHtml(r: GeoFlowReport): string {
  const coverHtml = cover({
    kicker: 'GEO / AEO / LLM Visibility',
    title: 'GEO / AEO / LLM Visibility — аудит',
    verdict: r.score.overall === null
      ? `GEO/AEO Score ${scoreText(r.score)}.`
      : `GEO/AEO Score — ${r.score.overall}/10 за ${r.score.coverage.zonesMeasured} виміряними зонами (обхід); присутність в AI — окремий живий прогін.`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'GEO/AEO Score', value: scoreText(r.score) },
      { label: 'Артефактів', value: String(r.artifacts.length) },
    ],
    note: `<b>Окремий модуль, а не «добавка до SEO».</b> AEO (прямий відповідь) · GEO (шанс стати джерелом) · LLM Visibility (присутність бренду в AI). Не продаємо «магічні фактори» й не гарантуємо потрапляння в AI — вимірюємо ймовірність і фактичну присутність за ланцюгом visibility → mention → citation → accuracy → referral → conversion.`,
  });
  const foot = pageFooter('Зовнішній GEO/AEO-аудит: вимірюване з обходу (crawlability, answerability, сутності, розмітка, структура). Brand/Citation Visibility, Share of Voice, Accuracy, зовнішня авторитетність — живим прогоном AI-запитів та інструментами (Google SC AI-звіти, Bing AI Performance, GA utm_source=chatgpt.com). Цифри не вигадуються; «н/д» не видається за факт.');
  return doc(`GEO/AEO/LLM Visibility · ${r.client}`,
    coverHtml + liveBanner(r) + spine(r) + score(r) + crawlability(r) + entities(r) + answerability(r) + blockCards(r) + gaps(r) + mainTable(r) + roadmap(r) + artifacts(r) + foot,
    GF_CSS);
}
