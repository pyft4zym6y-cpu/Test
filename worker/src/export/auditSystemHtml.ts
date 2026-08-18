/**
 * «Master Audit System» (клієнтський PDF) — звʼязка воєдино: реєстр усіх аудитів за
 * доменами, єдиний стандарт (12 кроків), картка знахідки (17 полів), послідовний
 * ланцюг із хендофами й наскрізний беклог Impact×Effort.
 */
import { esc, doc, cover, pageFooter } from './reportShell.js';
import type { AuditSystemReport, DomainBlock, AuditEntry, SysBacklogItem } from '../auditsystem.js';

const PRI: Record<string, string> = { P0: 'gap', P1: 'check', P2: 'lime', P3: 'ok' };
const COV: Record<string, string> = { 'обхід': 'ok', 'фреймворк': 'check', 'дані': 'na' };
const COVW: Record<string, string> = { 'обхід': 'з обходу', 'фреймворк': 'фреймворк+дані', 'дані': 'потрібні дані' };
const s10 = (v: number) => (v >= 7 ? 'ok' : v >= 4 ? 'check' : 'gap');

function head(r: AuditSystemReport): string {
  return `<section class="block"><h2>Покриття системи</h2>
    <p class="lead">Це не 50 окремих аудитів, а одна система. Нижче — скільки модулів вимірюється зараз, скільки — фреймворк на даних, скільки потребує доступу/документів/інтервʼю.</p>
    <div class="as-head">
      <div class="as-h-box"><span class="as-h-v ${s10(r.readiness.value)}">${r.readiness.value}</span><span class="as-h-l">/10 — готовність (вимірювані модулі)<br><i>${esc(r.readiness.note)}</i></span></div>
      <div class="as-cov">
        <div class="as-cv ok"><b>${r.coverage.obhid}</b><span>з обходу</span></div>
        <div class="as-cv check"><b>${r.coverage.framework}</b><span>фреймворк+дані</span></div>
        <div class="as-cv na"><b>${r.coverage.data}</b><span>потрібні дані</span></div>
        <div class="as-cv tot"><b>${r.coverage.total}</b><span>аудитів усього</span></div>
      </div>
    </div></section>`;
}

function domains(r: AuditSystemReport): string {
  const blocks = r.domains.map((d: DomainBlock) => {
    const rows = d.audits.map((a: AuditEntry) => `<tr>
      <td class="as-c"><span class="as-badge ${COV[a.coverage]}">${COVW[a.coverage]}</span></td>
      <td class="as-b">${esc(a.name)}</td><td class="as-mut">→ ${esc(a.feeds)}</td></tr>`).join('');
    return `<div class="as-dom"><div class="as-dom-h"><b>${esc(d.domain)}</b><span>${esc(d.note)}</span></div>
      <table class="as-dt"><tbody>${rows}</tbody></table></div>`;
  }).join('');
  return `<section class="block"><h2>Реєстр аудитів за доменами</h2>
    <p class="lead">Повна карта системи: 10 доменів. Кожен аудит — зі статусом покриття і тим, що він передає далі по ланцюгу («→»).</p>
    ${blocks}</section>`;
}

function chain(r: AuditSystemReport): string {
  const rows = r.chain.map((h) => `<div class="as-ho"><span class="as-ho-a">${esc(h.from)}</span><span class="as-ho-arr">→</span><span class="as-ho-b">${esc(h.to)}</span><span class="as-ho-p">${esc(h.passes)}</span></div>`).join('');
  return `<section class="block"><h2>Послідовний ланцюг: вихід одного = вхід наступного</h2>
    <p class="lead">Модулі звʼязані, а не паралельні. Оптимізувати нижні рівні, поки болять верхні — марно; тому порядок робіт іде за ланцюгом (останній хоп замикає цикл через досвід/retention).</p>
    <div class="as-hos">${rows}</div></section>`;
}

function method(r: AuditSystemReport): string {
  const std = r.standard.map((s, i) => `<div class="as-std"><span class="as-std-n">${i + 1}</span>${esc(s)}</div>`).join('');
  const card = r.findingCard.map((f) => `<span class="as-fc">${esc(f)}</span>`).join('');
  return `<section class="block"><h2>Єдиний стандарт + картка знахідки</h2>
    <p class="lead">${esc(r.scoringNote)}</p>
    <div class="as-cols">
      <div><div class="as-lbl">Стандарт проведення (12 кроків)</div><div class="as-stds">${std}</div></div>
      <div><div class="as-lbl">Картка знахідки (17 полів)</div><div class="as-fcs">${card}</div></div>
    </div></section>`;
}

function backlog(r: AuditSystemReport): string {
  if (!r.backlog.length) return '';
  const rows = r.backlog.map((it: SysBacklogItem, i) => `<tr>
    <td class="as-bk-n">${i + 1}</td><td class="as-c"><span class="as-tag">${esc(it.audit)}</span></td>
    <td class="as-bk-t">${esc(it.title)}</td>
    <td class="as-c"><span class="as-dots imp">${'●'.repeat(it.impact)}<span class="as-dim">${'●'.repeat(5 - it.impact)}</span></span></td>
    <td class="as-c"><span class="as-dots eff">${'●'.repeat(it.effort)}<span class="as-dim">${'●'.repeat(5 - it.effort)}</span></span></td>
    <td class="as-c"><span class="chip ${PRI[it.priority]}">${esc(it.priority)}</span></td></tr>`).join('');
  return `<section class="block"><h2>Наскрізний беклог: один план на всю систему</h2>
    <p class="lead">Агрегація P0/P1 з реально вимірюваних модулів у ОДИН пріоритезований беклог Impact×Effort (не 50 окремих списків). Off-site домени доповнюють його після підключення даних.</p>
    <table class="as-bk"><thead><tr><th>#</th><th>Аудит</th><th>Задача</th><th>Impact</th><th>Effort</th><th>Пріор.</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="fn-note"><sup>*</sup> Impact — вплив на гроші/сценарії (5 макс). Effort — трудомісткість. Порядок — за ланцюгом Strategic → Structure → Experience → Commerce → Analytics → Economics.</p></section>`;
}

const AS_CSS = `
  .as-head{display:flex;gap:10px;margin:4px 0;flex-wrap:wrap;}
  .as-h-box{flex:1;min-width:200px;display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--soft);border-radius:6px;}
  .as-h-v{font-size:30px;font-weight:800;line-height:1;} .as-h-v.ok{color:var(--ok);} .as-h-v.check{color:var(--check);} .as-h-v.gap{color:var(--gap);}
  .as-h-l{font-size:9px;color:#333;} .as-h-l i{color:var(--muted);font-size:8px;font-style:normal;}
  .as-cov{flex:1;display:flex;gap:6px;} .as-cv{flex:1;border:1px solid var(--line);border-radius:6px;padding:6px 4px;text-align:center;} .as-cv b{font-size:18px;font-weight:800;display:block;} .as-cv span{font-size:7.5px;color:var(--muted);}
  .as-cv.ok b{color:var(--ok);} .as-cv.check b{color:var(--check);} .as-cv.na b{color:#b45309;} .as-cv.tot b{color:var(--ink);}
  .as-b{font-weight:700;} .as-mut{color:var(--muted);font-size:8.5px;} .as-c{text-align:center;white-space:nowrap;}
  .as-badge{display:inline-block;font-weight:800;font-size:7.5px;padding:2px 6px;border-radius:9px;} .as-badge.ok{background:#e7f6ec;color:var(--ok);} .as-badge.check{background:#fdf6e7;color:var(--check);} .as-badge.na{background:#fdf1e7;color:#b45309;}
  .as-dom{border:1px solid var(--line);border-radius:7px;margin:6px 0;overflow:hidden;page-break-inside:avoid;}
  .as-dom-h{padding:6px 10px;background:var(--soft);border-bottom:1px solid var(--line);} .as-dom-h b{font-size:10.5px;} .as-dom-h span{font-size:8.5px;color:var(--muted);margin-left:8px;}
  .as-dt td{font-size:9px;padding:3px 8px;border-bottom:1px solid #f1f2f4;} .as-dt tr:last-child td{border-bottom:0;}
  .as-hos{display:flex;flex-direction:column;}
  .as-ho{display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--line);font-size:9px;} .as-ho:last-child{border-bottom:0;}
  .as-ho-a,.as-ho-b{font-weight:800;white-space:nowrap;} .as-ho-arr{color:var(--lime);font-weight:800;} .as-ho-p{color:#444;margin-left:6px;}
  .as-cols{display:grid;grid-template-columns:1.1fr 1fr;gap:12px;} .as-lbl{font-size:9px;font-weight:800;color:var(--lime);text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px;}
  .as-stds{display:flex;flex-direction:column;gap:2px;} .as-std{font-size:8.5px;display:flex;gap:6px;align-items:flex-start;} .as-std-n{flex:0 0 16px;height:16px;border-radius:50%;background:var(--lime);color:#fff;font-weight:800;font-size:8px;display:flex;align-items:center;justify-content:center;}
  .as-fcs{display:flex;flex-wrap:wrap;gap:3px;} .as-fc{font-size:8px;background:var(--soft);border:1px solid var(--line);border-radius:9px;padding:2px 7px;}
  .as-bk td{font-size:9px;vertical-align:middle;} .as-bk-n{color:var(--muted);font-weight:700;width:16px;} .as-bk-t{color:#222;}
  .as-tag{display:inline-block;font-size:7.5px;font-weight:800;background:#eef2ff;color:#2f4fd0;border-radius:9px;padding:2px 7px;white-space:nowrap;}
  .as-dots.imp{color:#dc2626;letter-spacing:1px;font-size:8px;} .as-dots.eff{color:#2563eb;letter-spacing:1px;font-size:8px;} .as-dim{color:var(--line);}
  .as-ctx{border:1px solid var(--line);border-left:4px solid var(--lime);border-radius:0 6px 6px 0;padding:9px 12px;font-size:9.5px;line-height:1.45;color:#222;}
`;

export function renderAuditSystemHtml(r: AuditSystemReport): string {
  const coverHtml = cover({
    kicker: 'Master Audit System', title: 'Єдина система аудиту e-commerce',
    verdict: `Одна система з ${r.coverage.total} аудитів у 10 доменах. Готовність (вимірювані модулі) — ${r.readiness.value}/10.`,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Аудитів у системі', value: String(r.coverage.total) },
      { label: 'Наскрізних задач', value: String(r.backlog.length) },
    ],
    note: `<b>Звʼязка воєдино.</b> Усі аудити — одна операційна система: єдиний стандарт проведення, єдина картка знахідки, єдина оцінка. Модулі звʼязані ланцюгом (вихід одного = вхід наступного), а не існують як окремі списки. Наскрізний беклог агрегує P0/P1 з вимірюваних модулів; off-site домени підключаються даними.`,
  });
  const ctx = `<section class="block"><div class="as-ctx"><b>Принцип.</b> ${esc(r.contextNote)}</div></section>`;
  const foot = pageFooter('Master Audit System: реєстр усіх аудитів e-commerce, єдиний стандарт (12 кроків) і картка знахідки (17 полів), послідовний ланцюг і наскрізний беклог. «З обходу» — вимірюється зараз; «фреймворк+дані» — модель на даних; «потрібні дані» — off-site (фінанси/операції/HR/ланцюг постачання), підключаються документами/інтервʼю. Цифри не вигадуються.');
  return doc(`Master Audit System · ${r.client}`,
    coverHtml + ctx + head(r) + method(r) + chain(r) + domains(r) + backlog(r) + foot,
    AS_CSS);
}
