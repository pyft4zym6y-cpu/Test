/**
 * A0-PDF для метод-документов (единый стандарт reportShell): матрица зрелости
 * (дашборд), охват и уверенность, реестр гипотез, scope по волнам, цена в канале,
 * синтез аудита. Оборачивают уже считаемые воркером модели.
 */
import { esc, doc, scoreColor } from './reportShell.js';
import type { MaturityReport } from '../maturity.js';
import type { CoverageReport, LensStatus } from '../coverage.js';
import type { HypothesisRegister } from '../hypotheses.js';
import type { ScopeReport } from '../routing.js';
import type { PriceChannelReport } from '../pricechannel.js';
import type { Synthesis } from '../synthesis.js';

const head = (kicker: string, h1: string, client: string, date: string, meta: [string, string][], scoreBig?: { val: string; cap: string; cls: string }, note?: string) => `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
  <div class="kicker">${esc(kicker)}</div><h1>${esc(h1)}</h1>
  <div class="cov-meta">${[['Клиент', client], ['Дата', date], ...meta].map(([l, v]) => `<div><span class="lbl">${esc(l)}</span><span class="val">${esc(v)}</span></div>`).join('')}</div>
  ${scoreBig ? `<div class="cov-score"><div class="big ${scoreBig.cls}">${esc(scoreBig.val)}</div><div class="big-cap">${esc(scoreBig.cap)}</div></div>` : ''}
  ${note ? `<div class="coverage">${note}</div>` : ''}
</div></section>`;

const foot = (name: string, client: string, date: string, extra = '') => `<section class="block"><div class="footer">Commerce OS · ${esc(name)} · ${esc(client)} · ${esc(date)}. Слой A0: внешний срез. Отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7).${extra ? ' ' + esc(extra) : ''}</div></section>`;

/* ── Матрица зрелости (дашборд) ── */
export function renderMaturityPdf(m: MaturityReport, client: string, date: string): string {
  const lvlCls = (l: number | null) => (l == null ? 'na' : l >= 4 ? 'ok' : l >= 3 ? 'check' : 'gap');
  const seg = (l: number | null) => Array.from({ length: 5 }, (_, i) => `<i class="sg ${l != null && i < l ? lvlCls(l) : ''}"></i>`).join('');
  const rows = m.rows.map((r) => `<tr>
    <td class="m-dom">${esc(r.domain)}</td>
    <td class="m-ass">${esc(r.assesses)}</td>
    <td class="m-bar"><span class="segs">${seg(r.level)}</span></td>
    <td class="m-lvl ${lvlCls(r.level)}">${r.level == null ? '—' : `${r.level}/5`}</td>
    <td class="m-src ${r.source === 'L0' ? '' : 'gap'}">${esc(r.source)}</td>
  </tr>`).join('');
  const avg = m.observedAvg;
  const body = `<section class="block"><h2>Зрелость по доменам (наблюдение L0)</h2>
    <p class="lead">Шкала 0–5: 0 — отсутствует, 5 — системно управляется. «Нужны данные» — уровень внешне не подтвердить (A1).</p>
    <table><thead><tr><th>Домен</th><th>Что оценивает</th><th>Уровень</th><th></th><th>Источник</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const extra = `.m-dom{font-weight:700;white-space:nowrap;} .m-ass{color:#333;font-size:10px;} .m-lvl{font-weight:800;white-space:nowrap;} .m-src{font-size:9px;color:var(--muted);}
    .segs{display:inline-flex;gap:2px;} .sg{width:16px;height:9px;border-radius:2px;background:var(--line);display:block;} .sg.ok{background:var(--ok);} .sg.check{background:var(--check);} .sg.gap{background:var(--gap);} .sg.na{background:var(--line);}`;
  return doc(`Матрица зрелости A0 · ${client}`, head('Commerce OS · Матрица зрелости · A0', avg != null ? `Средняя зрелость витрины — ${avg}/5 по внешним признакам` : 'Зрелость: базовый уровень, детали — после данных (A1)', client, date, [['Средняя', avg != null ? `${avg}/5` : '—']], avg != null ? { val: `${avg}`, cap: 'средний уровень зрелости (из 5)', cls: lvlCls(avg) } : undefined, 'Оценка зрелости по внешнему обходу. Домены «нужны данные» подтверждаются на A1 доступом к системам/процессам.') + body + foot('Матрица зрелости A0', client, date), extra);
}

/* ── Охват и уверенность ── */
export function renderCoveragePdf(c: CoverageReport, client: string, date: string): string {
  const cls: Record<LensStatus, string> = { covered: 'ok', partial: 'check', external: 'check', 'needs-access': 'gap' };
  const word: Record<LensStatus, string> = { covered: 'покрыто', partial: 'частично', external: 'внешне', 'needs-access': 'нужен доступ' };
  const rows = c.lenses.map((l) => `<tr><td class="cv-name">${esc(l.name)}</td><td class="cv-st ${cls[l.status]}">${word[l.status]}</td><td class="cv-note">${esc(l.note)}</td></tr>`).join('');
  const conf = c.confidence;
  const pct = conf.base ? Math.round((conf.score / conf.base) * 100) : 0;
  const body = `<section class="block"><h2>Что доказано, что требует данных</h2>
    <p class="lead">Охват по видам анализа и уверенность вывода. Уверенность = не выше самого слабого звена.</p>
    <table><thead><tr><th>Вид анализа</th><th>Статус</th><th>Комментарий</th></tr></thead><tbody>${rows}</tbody></table></section>
    ${conf.raisedBy.length ? `<section class="block"><h2>Что повысило уверенность</h2><ul>${conf.raisedBy.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}`;
  const extra = `.cv-name{font-weight:700;} .cv-st{font-weight:700;white-space:nowrap;} .cv-note{color:#333;font-size:10px;}`;
  return doc(`Охват и уверенность A0 · ${client}`, head('Commerce OS · Охват и уверенность · A0', `Confidence Score ${conf.score}/${conf.base} — «${conf.band}»`, client, date, [['Confidence', `${conf.score}/${conf.base}`]], { val: `${pct}%`, cap: `уверенность вывода · «${conf.band}»`, cls: scoreColor(pct) }, 'A0 — внешний срез; потолок уверенности низкий. Доступы и данные на A1–A2 поднимают Confidence.') + body + foot('Охват и уверенность A0', client, date), extra);
}

/* ── Реестр гипотез ── */
export function renderHypothesesPdf(h: HypothesisRegister, client: string, date: string): string {
  const cCls = (c: number) => (c >= 0.7 ? 'ok' : c >= 0.5 ? 'check' : 'gap');
  const rows = h.items.map((i) => `<tr>
    <td class="h-id">${esc(i.id)}</td>
    <td class="h-hyp"><b>${esc(i.hypothesis)}</b><span class="h-area">${esc(i.area)}</span></td>
    <td class="h-basis">${esc(i.basis)}</td>
    <td class="h-verify">✓ ${esc(i.verifyBy)}<br>✕ ${esc(i.falsifyIf)}</td>
    <td class="h-conf ${cCls(i.confidence)}">${Math.round(i.confidence * 100)}%</td>
  </tr>`).join('');
  const body = `<section class="block"><h2>Гипотезы: что проверить и чем опровергнуть</h2>
    <p class="lead">На L0 большинство выводов — гипотезы: у каждой способ подтверждения и условие опровержения (A1–A2).</p>
    ${h.items.length ? `<table><thead><tr><th>ID</th><th>Гипотеза</th><th>Основание</th><th>Проверка / опровержение</th><th>Увер.</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="lead">Гипотезы появятся после аналитического слоя (нужен ключ Claude).</p>'}</section>`;
  const extra = `.h-id{color:var(--muted);white-space:nowrap;} .h-hyp{font-weight:400;} .h-hyp b{display:block;} .h-area{font-size:8px;color:var(--muted);text-transform:uppercase;} .h-basis{color:#333;font-size:10px;} .h-verify{font-size:9px;color:#333;} .h-conf{font-weight:800;white-space:nowrap;}`;
  return doc(`Реестр гипотез A0 · ${client}`, head('Commerce OS · Реестр гипотез · A0', `${h.items.length} гипотез со способом проверки и опровержения`, client, date, [['Гипотез', String(h.items.length)]], undefined, 'Реестр незнания: то, что нельзя утверждать на A0. Каждая гипотеза закрывается конкретными данными на следующем уровне.') + body + foot('Реестр гипотез A0', client, date), extra);
}

/* ── Scope по волнам ── */
export function renderScopePdf(s: ScopeReport, client: string, date: string): string {
  const total = s.waves.reduce((n, w) => n + w.items.length, 0);
  const waves = s.waves.map((w) => `<section class="block"><h2>Волна ${w.n}. ${esc(w.title)}</h2>
    <p class="lead">Что даёт волна: ${w.items.length} активаций плейбуков; каждая волна — самостоятельный результат.</p>
    <table><thead><tr><th>Плейбук</th><th>Почему включён</th></tr></thead><tbody>${
      w.items.map((it) => `<tr><td class="sc-pb">${esc(it.name || it.playbook)}</td><td class="sc-why">${esc(it.reasons.join('; '))}</td></tr>`).join('')
    }</tbody></table></section>`).join('');
  const ni = s.notIncluded.length ? `<section class="block"><h2>Вне scope на этом этапе</h2><ul>${s.notIncluded.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const extra = `.sc-pb{font-weight:700;white-space:nowrap;} .sc-why{color:#333;}`;
  return doc(`Scope по волнам A0 · ${client}`, head('Commerce OS · Scope программы · A0', `Программа из ${s.waves.length} волн (${total} активаций), режем по волнам, а не по качеству`, client, date, [['Волн', String(s.waves.length)], ['Активаций', String(total)]], undefined, 'Разбивка работ на волны: каждая волна даёт измеримый результат сама по себе и не ждёт следующих. Приоритет — по остаточному вкладу и зависимостям.') + waves + ni + foot('Scope по волнам A0', client, date), extra);
}

/* ── Цена в канале ── */
export function renderPriceChannelPdf(p: PriceChannelReport, client: string, date: string): string {
  const roleRu: Record<PriceChannelReport['role'], string> = { producer: 'производитель', reseller: 'реселлер', hybrid: 'гибрид', unknown: 'не определена' };
  const rows = p.checklist.map((c) => `<tr><td class="pcx-item">${esc(c.item)}</td><td class="pcx-how">${esc(c.how)}</td><td class="pcx-st ${c.status === 'из обхода' ? 'ok' : 'check'}">${esc(c.status)}</td></tr>`).join('');
  const body = `<section class="block"><h2>Роль в цепочке и ценовая дисциплина</h2>
    <p class="lead">Роль: <b>${esc(roleRu[p.role])}</b> — ${esc(p.roleBasis)}.</p>
    <div class="concl warn"><b>Ценовой риск.</b> ${esc(p.risk)}</div></section>
    <section class="block"><h2>Чек-лист цены в канале</h2>
    <table><thead><tr><th>Проверка</th><th>Как проверяем</th><th>Статус</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const extra = `.pcx-item{font-weight:700;} .pcx-how{color:#333;font-size:10px;} .pcx-st{font-weight:700;white-space:nowrap;}`;
  return doc(`Цена в канале A0 · ${client}`, head('Commerce OS · Цена в канале · A0', `Ценовая позиция и роль в цепочке: ${roleRu[p.role]}`, client, date, [['Роль', roleRu[p.role]]], undefined, 'Цена в собственном канале не должна быть выше, чем на маркетплейсах и у реселлеров. Реальные уровни цен и MAP уточняются на A1.') + body + foot('Цена в канале A0', client, date), extra);
}

/* ── Синтез аудита ── */
export function renderSynthesisPdf(s: Synthesis, client: string, date: string): string {
  const cross = s.crossLinks.length ? `<section class="block"><h2>Взаимосвязи находок</h2>
    <p class="lead">Где дефекты усиливают друг друга — чинить нужно причину, а не каждую точку.</p>
    <table><thead><tr><th>A</th><th>B</th><th>Совместный эффект</th></tr></thead><tbody>${
      s.crossLinks.map((c) => `<tr><td>${esc(c.a)}</td><td>${esc(c.b)}</td><td class="sy-eff">${esc(c.effect)}</td></tr>`).join('')
    }</tbody></table></section>` : '';
  const roots = s.rootCauses.length ? `<section class="block"><h2>Корневые причины</h2>${
    s.rootCauses.map((r) => `<div class="concl crit"><h3>${esc(r.cause)}</h3><div class="concl-grid"><span class="k">Проявляется в</span><span class="v">${esc(r.from.join('; '))}</span><span class="k">Влияние</span><span class="v">${esc(r.impact)}</span></div></div>`).join('')
  }</section>` : '';
  const prio = s.priorities.length ? `<section class="block"><h2>Сквозной приоритет</h2><table><tbody>${
    s.priorities.map((p, i) => `<tr><td class="sy-n">${i + 1}</td><td class="sy-t"><b>${esc(p.title)}</b></td><td class="sy-w">${esc(p.why)}</td></tr>`).join('')
  }</tbody></table></section>` : '';
  const body = cross + roots + prio + `<section class="block"><h2>Вывод</h2><p class="lead" style="font-size:12px;color:var(--ink)">${esc(s.oneLine)}</p></section>`;
  const extra = `.sy-eff{color:#333;} .sy-n{color:var(--muted);width:16px;} .sy-t{white-space:nowrap;} .sy-w{color:#333;}`;
  return doc(`Синтез аудита A0 · ${client}`, head('Commerce OS · Синтез аудита · A0', s.headline, client, date, [['Приоритетов', String(s.priorities.length)]], undefined, 'Синтез сводит находки всех линз без двойного счёта: снимает пересечения, поднимает корневые причины, ранжирует по остаточному вкладу.') + body + foot('Синтез аудита A0', client, date), extra);
}
