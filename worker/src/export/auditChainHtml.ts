/**
 * «Єдина система аудиту» — верхньорівневий документ, що зв'язує 5 аудитів у
 * один потік Business → Structure → UX/UI → Content → SEO → CRO: візуальний конвеєр
 * готовності, хендофи (вихід→вхід), картки рівнів і НАСКРІЗНИЙ беклог
 * Impact×Effort з усіх рівнів. Єдиний візуальний стандарт (reportShell).
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { AuditChainReport, ChainLevel, ChainBacklogItem } from '../auditchain.js';

const rcls = (v: number) => (v >= 70 ? 'ok' : v >= 45 ? 'check' : 'gap');
const priCls = (p: string) => (p === 'P0' ? 'gap' : p === 'P1' ? 'check' : p === 'P2' ? 'lime' : 'ok');
const LID_COLOR: Record<string, string> = { B: '#7c3aed', S: '#2563eb', X: '#0891b2', C: '#65a30d', E: '#ea580c', R: '#dc2626' };

// Конвеєр готовності — 5 рівнів у ряд зі стрілками й барами.
function pipeline(levels: ChainLevel[]): string {
  const cells = levels.map((l, i) => `${i ? '<div class="ac-arrow">→</div>' : ''}
    <div class="ac-node">
      <div class="ac-badge" style="background:${LID_COLOR[l.id]}">${l.id}</div>
      <div class="ac-name">${esc(l.name)}</div>
      <div class="ac-ready ${rcls(l.readiness)}">${l.readiness}</div>
      <div class="ac-bar"><span class="ac-fill ${rcls(l.readiness)}" style="height:${l.readiness}%"></span></div>
      ${l.p0 ? `<div class="ac-p0">${l.p0} × P0</div>` : '<div class="ac-p0 ac-ok">✓</div>'}
    </div>`).join('');
  return `<div class="ac-pipe">${cells}</div>`;
}

// Хендофи: вихід одного рівня = вхід наступного.
function handoffs(r: AuditChainReport): string {
  const rows = r.handoffs.map((h) => `<div class="ac-ho">
    <span class="ac-ho-a">${esc(h.from)}</span><span class="ac-ho-arr">→</span><span class="ac-ho-b">${esc(h.to)}</span>
    <span class="ac-ho-p">${esc(h.passes)}</span></div>`).join('');
  return `<section class="block"><h2>Що кожен рівень передає далі</h2>
    <p class="lead">Рівні зв'язані: вихід одного — вхід наступного. Саме тому їх роблять послідовно, а не паралельно.</p>
    <div class="ac-hos">${rows}</div></section>`;
}

// Картка рівня.
function levelCard(l: ChainLevel): string {
  return `<div class="ac-card">
    <div class="ac-card-h"><span class="ac-badge sm" style="background:${LID_COLOR[l.id]}">${l.id}</span>
      <b>${esc(l.name)}</b><span class="ac-card-m">${esc(l.metric)}</span>
      <span class="ac-card-r ${rcls(l.readiness)}">${l.readiness}<i>/100</i></span></div>
    <p class="ac-q">${esc(l.question)}</p>
    <p class="ac-v ${rcls(l.readiness)}">${esc(l.verdict)}</p>
    <div class="ac-io">
      <div class="ac-in"><span class="ac-io-l">◂ Бере зверху</span>${esc(l.input)}</div>
      <div class="ac-out"><span class="ac-io-l">Передає далі ▸</span>${esc(l.output)}</div>
    </div>
    <ul class="ac-find">${l.findings.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  </div>`;
}

// Наскрізний беклог Impact×Effort.
function backlog(items: ChainBacklogItem[]): string {
  if (!items.length) return '';
  const rows = items.map((it, i) => `<tr>
    <td class="ac-bk-n">${i + 1}</td>
    <td><span class="ac-tag" style="background:${LID_COLOR[it.levelId]}">${esc(it.level)}</span></td>
    <td class="ac-bk-t">${esc(it.title)}</td>
    <td class="ac-bk-c"><span class="ac-imp">${'●'.repeat(it.impact)}<span class="ac-dim">${'●'.repeat(5 - it.impact)}</span></span></td>
    <td class="ac-bk-c"><span class="ac-eff">${'●'.repeat(it.effort)}<span class="ac-dim">${'●'.repeat(5 - it.effort)}</span></span></td>
    <td class="ac-bk-c"><span class="chip ${priCls(it.priority)}">${esc(it.priority)}</span></td></tr>`).join('');
  return `<section class="block"><h2>Наскрізний беклог: один план на всі 6 рівнів</h2>
    <p class="lead">Не окремі списки по кожному рівню, а один пріоритезований беклог Impact×Effort із усіх рівнів. Сортування — за співвідношенням віддача/зусилля (quick wins зверху).</p>
    <table class="ac-bk"><thead><tr><th>#</th><th>Рівень</th><th>Задача</th><th>Impact</th><th>Effort</th><th>Пріор.</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <p class="fn-note"><sup>*</sup> Impact — вплив на гроші/ключові сценарії (5 = максимум). Effort — трудомісткість (5 = найважче). Порядок робіт — за ланцюгом Business → Structure → UX/UI → Content → SEO → CRO з урахуванням quick wins.</p></section>`;
}

const AC_CSS = `
  .ac-pipe{display:flex;align-items:stretch;gap:0;margin:6px 0 10px;}
  .ac-node{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;}
  .ac-arrow{align-self:center;color:var(--muted);font-size:16px;font-weight:800;padding:0 2px;}
  .ac-badge{width:26px;height:26px;border-radius:50%;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;}
  .ac-badge.sm{width:20px;height:20px;font-size:10px;}
  .ac-name{font-size:9px;font-weight:700;text-align:center;}
  .ac-ready{font-size:17px;font-weight:800;line-height:1;} .ac-ready.ok{color:var(--ok);} .ac-ready.check{color:var(--check);} .ac-ready.gap{color:var(--gap);}
  .ac-bar{width:22px;height:44px;background:var(--line);border-radius:4px;overflow:hidden;display:flex;align-items:flex-end;}
  .ac-fill{width:100%;display:block;border-radius:4px;} .ac-fill.ok{background:var(--ok);} .ac-fill.check{background:var(--check);} .ac-fill.gap{background:var(--gap);}
  .ac-p0{font-size:7.5px;font-weight:800;color:var(--gap);} .ac-p0.ac-ok{color:var(--ok);}
  .ac-hos{display:flex;flex-direction:column;gap:0;}
  .ac-ho{display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--line);font-size:9px;}
  .ac-ho:last-child{border-bottom:0;}
  .ac-ho-a,.ac-ho-b{font-weight:800;white-space:nowrap;} .ac-ho-arr{color:var(--lime);font-weight:800;} .ac-ho-p{color:#444;margin-left:6px;}
  .ac-card{border:1px solid var(--line);border-radius:7px;margin:7px 0;padding:8px 10px;page-break-inside:avoid;}
  .ac-card-h{display:flex;align-items:center;gap:7px;}
  .ac-card-h b{font-size:12px;} .ac-card-m{font-size:8.5px;color:var(--muted);} .ac-card-r{margin-left:auto;font-weight:800;font-size:14px;} .ac-card-r i{font-size:8px;color:var(--muted);font-weight:400;font-style:normal;}
  .ac-card-r.ok{color:var(--ok);} .ac-card-r.check{color:var(--check);} .ac-card-r.gap{color:var(--gap);}
  .ac-q{margin:4px 0 2px;font-size:9px;color:var(--muted);font-style:italic;}
  .ac-v{margin:2px 0 6px;font-size:10px;font-weight:600;} .ac-v.ok{color:#166534;} .ac-v.check{color:#8a5a00;} .ac-v.gap{color:#7a1f1f;}
  .ac-io{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:5px 0;}
  .ac-in,.ac-out{border:1px solid var(--line);border-radius:5px;padding:5px 7px;font-size:8.5px;color:#333;line-height:1.35;}
  .ac-in{background:#fafbff;} .ac-out{background:#f6fbf3;}
  .ac-io-l{display:block;font-size:7.5px;font-weight:800;letter-spacing:.3px;color:var(--muted);margin-bottom:2px;text-transform:uppercase;}
  .ac-find{margin:4px 0 0;padding-left:16px;} .ac-find li{font-size:9px;color:#333;line-height:1.4;margin:1px 0;}
  .ac-bk td{font-size:9px;vertical-align:middle;} .ac-bk-n{color:var(--muted);font-weight:700;width:18px;} .ac-bk-t{color:#222;}
  .ac-tag{display:inline-block;color:#fff;font-weight:800;font-size:8px;padding:2px 8px;border-radius:10px;white-space:nowrap;}
  .ac-bk-c{text-align:center;white-space:nowrap;} .ac-imp{color:#dc2626;letter-spacing:1px;font-size:8px;} .ac-eff{color:#2563eb;letter-spacing:1px;font-size:8px;} .ac-dim{color:var(--line);}
  .ac-through{border:1px solid var(--line);border-left:4px solid var(--lime);border-radius:0 6px 6px 0;padding:9px 12px;margin:6px 0;font-size:10px;line-height:1.4;color:#222;}
`;

export function renderAuditChainHtml(r: AuditChainReport): string {
  const coverHtml = cover({
    kicker: 'Єдина система аудиту',
    title: 'Аудит як система: Business → Structure → UX/UI → Content → SEO → CRO',
    verdict: `Загальна готовність воронки — ${r.overall.value}/100 (${r.overall.label}).`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Рівнів у ланцюгу', value: String(r.levels.length) },
      { label: 'Наскрізних задач', value: String(r.backlog.length) },
    ],
    note: `<b>Навіщо разом:</b> це не 6 окремих звітів, а один потік. Кожен рівень бере результат попереднього і передає свій наступному. Оптимізувати нижні рівні (контент, конверсію), поки болять верхні (бізнес-цілі, структура) — марно: тому порядок робіт іде строго за ланцюгом.`,
  });

  const spine = `<section class="block"><h2>Ланцюг готовності: ${r.levels.length} рівнів воронки</h2>
    <p class="lead">Висота бару — готовність рівня (0–100 за спільною шкалою). Найнижчий стовпчик — вузьке місце, з якого починати.</p>
    ${pipeline(r.levels)}
    <div class="ac-through">${esc(r.throughline)}</div></section>`;

  const cards = `<section class="block"><h2>Рівні детально: вхід → робота → вихід</h2>
    ${r.levels.map(levelCard).join('')}</section>`;

  const foot = pageFooter('Єдина система аудиту зводить 5 детермінованих факт-слоїв (зрілість, структура, UX/UI, контент, CRO-механіки) в один послідовний потік. Кожен рівень — окремий звіт із власною методологією; тут показано їхній зв\'язок і наскрізний план.');

  return doc(`Єдина система аудиту · ${r.client}`, coverHtml + spine + handoffs(r) + cards + backlog(r.backlog) + foot, AC_CSS);
}
