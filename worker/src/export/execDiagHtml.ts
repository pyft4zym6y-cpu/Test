/**
 * Executive Diagnostic A0 — зонтичный клиентский PDF (A0 §13): сводит все аудиты
 * в 15–25 страниц, каждый раздел начинается с вывода (A0 §8-карточки), иерархия
 * вывод→факты (§14). Тянет то, что воркер уже считает (UX/UI, деньги, конкуренты,
 * зрелость, coverage, гипотезы); недостающее помечает PARTIAL/BLOCKED (§15).
 */
import { esc, dimBadges, scoreColor, doc, conclusionSection } from './reportShell.js';
import type { AuditDataset } from '../report.js';
import type { SiteAuditReport } from '../pagereport.js';
import type { Analysis, Finding } from '../analyze.js';
import type { EngineResult } from '../portalEngine.js';
import type { MoneyResult } from '../money.js';
import type { BenchmarkReport } from '../competitor.js';

export type ExecInputs = {
  siteAudit: SiteAuditReport | null;
  analysis: Analysis | null;
  engine: EngineResult | null;
  money: MoneyResult | null;
  bench: BenchmarkReport | null;
  coverage: { confidence: { score: number; base: number; band: string } } | null;
};

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;
const eLevel = (conf: number) => (conf >= 0.8 ? 'E3' : conf >= 0.6 ? 'E2' : 'E1'); // L0 внешний — потолок E3
const clientName = (ds: AuditDataset) => { try { return new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { return ds.client.finalUrl; } };

/** Карточка «главный вывод» (A0 §8). «Влияние» показываем только если отличается от «Разрыва». */
function conclCard(c: { title: string; sev?: 'crit' | 'warn'; see: string; proof: string; ref: string; gap: string; impact: string; conf: string; unknown: string; next: string }): string {
  const impactRow = c.impact && c.impact !== c.gap ? `<span class="k">Влияние</span><span class="v">${esc(c.impact)}</span>` : '';
  const title = c.title.length > 120 ? c.title.slice(0, 117) + '…' : c.title;
  return `<div class="concl ${c.sev ?? ''}"><h3>${esc(title)}</h3><div class="concl-grid">
    <span class="k">Что видим</span><span class="v">${esc(c.see)}</span>
    <span class="k">Доказательство</span><span class="v">${esc(c.proof)}</span>
    <span class="k">Сравнение</span><span class="v">${esc(c.ref)}</span>
    <span class="k">Разрыв</span><span class="v">${esc(c.gap)}</span>
    ${impactRow}
    <span class="k">Уверенность</span><span class="v">${esc(c.conf)}</span>
    <span class="k">Что неизвестно</span><span class="v">${esc(c.unknown)}</span>
    <span class="k">Следующий шаг</span><span class="v">${esc(c.next)}</span>
  </div></div>`;
}

function keyFindings(inp: ExecInputs): string {
  const cards: string[] = [];
  const findings: Finding[] = inp.analysis?.findings ?? [];
  for (const f of findings.slice(0, 6)) {
    cards.push(conclCard({
      title: `${f.area}: ${f.fact}`.slice(0, 110),
      sev: f.confidence >= 0.75 ? 'crit' : 'warn',
      see: f.fact, proof: 'Внешний обход L0 (наблюдение)', ref: 'Эталон композиции / голд-стандарт',
      gap: f.why, impact: f.why, conf: `${eLevel(f.confidence)} · ${Math.round(f.confidence * 100)}%`,
      unknown: 'Фактическое влияние на конверсию — после аналитики (A2)', next: 'Проверить на данных GA4/CRM (A1–A2)',
    }));
  }
  // добор из системных дефектов UX/UI, если находок мало
  if (cards.length < 3 && inp.siteAudit) {
    for (const s of inp.siteAudit.systemic.slice(0, 3)) {
      cards.push(conclCard({ title: s.title, sev: 'warn', see: s.title, proof: 'Проявляется на всех разобранных страницах', ref: 'Голд-стандарт', gap: s.detail, impact: s.detail, conf: 'E2 · системный', unknown: 'Точный масштаб — на полном crawl (A1)', next: 'Правка в шаблоне/настройках' }));
    }
  }
  return cards.length ? cards.join('') : '<p class="lead">Главные выводы появятся после анализа (нужен ANTHROPIC_API_KEY и данные обхода).</p>';
}

function section(title: string, conclusion: string, body: string, status?: 'DONE' | 'PARTIAL' | 'BLOCKED'): string {
  const chip = status ? `<span class="chip ${status === 'DONE' ? 'done' : status === 'PARTIAL' ? 'partial' : 'blocked'}">${status}</span>` : '';
  return `<section class="block"><h2>${esc(title)} ${chip}</h2><p class="lead">${esc(conclusion)}</p>${body}</section>`;
}

export function renderExecDiagnostic(ds: AuditDataset, inp: ExecInputs): string {
  const name = clientName(ds);
  const date = new Date(ds.takenAt).toLocaleDateString('ru-RU');
  const ux = inp.siteAudit;
  const verdict = inp.analysis?.summary || ux?.verdict || 'Внешняя диагностика витрины по слою A0.';
  const posture = ux ? ux.totalPct : null;

  // Cover: заголовок = первое предложение вердикта, но обложка не резиновая —
  // длинный вывод усечь и уменьшить кегль (реальный прогон дал заголовок на 9 строк).
  const h1raw = verdict.split('. ')[0];
  const h1txt = (h1raw.length > 160 ? h1raw.slice(0, 157) + '…' : h1raw) + '.';
  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Executive Diagnostic · слой A0</div>
    <h1${h1txt.length > 90 ? ' style="font-size:22px"' : ''}>${esc(h1txt)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(name)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Тир</span><span class="val">T${ds.tier}</span></div>
    </div>
    ${posture != null ? `<div class="cov-score"><div class="big ${scoreColor(posture)}">${posture}<span>%</span></div><div class="big-cap">внешнее соответствие эталону (UX/UI)</div></div>` : ''}
    <div class="coverage"><b>Coverage Map (A0 §15):</b> A0 — внешний срез без доступов. Разделы со статусом:
      <span class="chip done">DONE</span> внешне доказано · <span class="chip partial">PARTIAL</span> частично ·
      <span class="chip blocked">BLOCKED</span> нужен доступ/данные. Отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7).</div>
  </div></section>`;

  // Разделы A0 §13
  const s: string[] = [];
  s.push(section('1. Что это за бизнес (предварительная Commerce DNA)',
    'Профиль по внешним признакам — уточняется данными на A1.',
    `<table><tbody>
      <tr><th>Платформа</th><td>${esc(ds.client.tech.platform ?? 'не определена')}</td></tr>
      <tr><th>Аналитика</th><td>${esc(ds.client.tech.analytics.join(', ') || 'не обнаружена')}</td></tr>
      <tr><th>Запрос клиента</th><td>${esc(ds.request || '— (инициативный аудит)')}</td></tr>
      <tr><th>robots / sitemap</th><td>${ds.client.robotsTxt ? 'robots есть' : 'robots нет'} · ${ds.client.sitemapXml ? 'sitemap есть' : 'sitemap нет'}</td></tr>
    </tbody></table>`, 'PARTIAL'));

  s.push(section('2. Главные выводы', '5–10 управленческих выводов по слою A0 (каждый — с доказательством и уровнем уверенности).', keyFindings(inp), inp.analysis ? 'DONE' : 'BLOCKED'));

  // Карта разрывов
  const gapRows: string[] = [];
  if (ux) gapRows.push(`<tr><td>UX/UI композиция</td><td class="${scoreColor(ux.totalPct)}">${ux.totalPct}% соответствия</td><td>${ux.systemic.length} системных дефектов</td></tr>`);
  if (inp.engine?.score != null) gapRows.push(`<tr><td>Health Score</td><td>${inp.engine.score}/100 «${esc(inp.engine.band)}»</td><td>${inp.engine.gaps.length} критических разрывов</td></tr>`);
  if (inp.bench) gapRows.push(`<tr><td>Конкурентный индекс</td><td>${inp.bench.clientIndex}/100</td><td>место ${inp.bench.clientRank}/${inp.bench.totalSites}</td></tr>`);
  s.push(section('3. Карта основных разрывов', 'Где витрина дальше всего от эталона и рынка.',
    gapRows.length ? `<table><thead><tr><th>Домен</th><th>Оценка</th><th>Разрыв</th></tr></thead><tbody>${gapRows.join('')}</tbody></table>` : '<p class="lead">Карта разрывов собирается из UX/UI, движка и бенчмарка.</p>',
    gapRows.length ? 'DONE' : 'PARTIAL'));

  // Экономика разрыва
  s.push(inp.money
    ? section('4. Экономика разрыва', 'Недополученный оборот при доведении воронки до целевой.',
      `<table><tbody>
        <tr><th>Выручка сейчас</th><td>${rub(inp.money.currentMonth)}/мес</td></tr>
        <tr><th>При целевой воронке</th><td>${rub(inp.money.targetMonth)}/мес</td></tr>
        <tr><th>Недополучено</th><td class="gap"><b>${rub(inp.money.potentialYear)}/год</b></td></tr>
      </tbody></table>`, 'DONE')
    : section('4. Экономика разрыва', 'Денежная оценка требует baseline (трафик, конверсия, чек) — заводится на A1.', '<p class="lead">Нет baseline — экономика разрыва не считается на A0, чтобы не выдавать оценку за факт.</p>', 'BLOCKED'));

  // UX/UI карта
  s.push(section('5. Карта UX/UI', ux ? ux.verdict : 'UX/UI-срез по типам страниц.',
    ux ? (() => {
      // Свернуть дубли типа «(доп.)»: показываем первые 2 на тип + агрегат остальных.
      const shown: typeof ux.tree = []; const extra = new Map<string, { n: number; sum: number }>();
      const seenN = new Map<string, number>();
      for (const t of ux.tree) {
        const base = t.title.replace(/ \(доп\.\)$/, '');
        const n = (seenN.get(base) ?? 0) + 1; seenN.set(base, n);
        if (n <= 2) shown.push(t);
        else { const e = extra.get(base) ?? { n: 0, sum: 0 }; e.n++; e.sum += t.pct; extra.set(base, e); }
      }
      const rows = shown.map((t) => `<tr><td>${esc(t.title)}</td><td><span class="bar"><i class="fill ${scoreColor(t.pct)}" style="width:${t.pct}%"></i></span></td><td class="${scoreColor(t.pct)}">${t.pct}%</td></tr>`).join('')
        + Array.from(extra.entries()).map(([base, e]) => { const avg = Math.round(e.sum / e.n); return `<tr><td>${esc(base)} — ещё ${e.n} страниц</td><td><span class="bar"><i class="fill ${scoreColor(avg)}" style="width:${avg}%"></i></span></td><td class="${scoreColor(avg)}">~${avg}%</td></tr>`; }).join('');
      return `<table><thead><tr><th>Тип страницы</th><th>Соответствие</th><th>%</th></tr></thead><tbody>${rows}</tbody></table><p class="lead">Детально — в отдельном документе «UX/UI Audit A0».</p>`;
    })() : '<p class="lead">Страницы не разобраны.</p>', ux ? 'DONE' : 'BLOCKED'));

  // SEO карта
  const seoFails = countGroupFails(ds, 'SEO');
  s.push(section('6. Карта SEO-архитектуры', ds.client.sitemapXml ? 'Базовая индексируемость есть; дерево уточняется на A1.' : 'Нет sitemap.xml — риск индексации всего каталога.',
    `<p class="lead">Провалов SEO-проверок на разобранных страницах: <b>${seoFails}</b>. sitemap.xml: ${ds.client.sitemapXml ? 'есть' : '<span class="gap">нет</span>'}. Полное дерево и техническая SEO — отдельный документ «SEO Architecture A0».</p>`, 'PARTIAL'));

  s.push(section('7. Карта контентных разрывов', 'Способность контента снимать неопределённость и вести к решению.', '<p class="lead">Контент-аудит (полнота/полезность/убедительность/интент) — отдельный документ «Content Audit A0».</p>', 'PARTIAL'));

  s.push(section('8. Карта каналов', ds.client.tech.analytics.length ? 'Трекинг установлен — фактическая эффективность каналов на A2.' : 'Аналитика не обнаружена — измерить каналы нельзя.',
    `<p class="lead">Аналитика: ${esc(ds.client.tech.analytics.join(', ') || 'не обнаружена')}. Фактическая эффективность каналов требует доступа к кабинетам (A2).</p>`, ds.client.tech.analytics.length ? 'PARTIAL' : 'BLOCKED'));

  s.push(section('9. Конкурентная позиция', inp.bench ? `Индекс клиента ${inp.bench.clientIndex}/100, место ${inp.bench.clientRank} из ${inp.bench.totalSites}.` : 'Конкуренты не заданы для внешнего сравнения.',
    inp.bench ? `<p class="lead">Детальный разбор — документ «Конкурентный анализ A0».</p>` : '<p class="lead">Добавьте конкурентов для бенчмарка (T2+).</p>', inp.bench ? 'DONE' : 'PARTIAL'));

  s.push(section('10. Коммерческое предложение и доверие', 'Сигналы доверия витрины (гарантии, отзывы, реквизиты).', trustBody(inp.siteAudit), 'PARTIAL'));

  // Риски / возможности / доказательность
  s.push(section('11. Критические риски и возможности', 'Что грозит и где ближайший рост.', riskOppBody(inp), 'PARTIAL'));

  const conf = inp.coverage?.confidence;
  s.push(section('12. Что доказано / гипотеза / неизвестно', conf ? `Confidence Score ${conf.score}/${conf.base} — «${esc(conf.band)}».` : 'Разделение фактов, гипотез и незнания.',
    `<p class="lead">${
      inp.analysis?.missingFacts?.length ? `Недостающие факты: ${esc(inp.analysis.missingFacts.slice(0, 6).join('; '))}.` : 'На A0 большинство выводов — наблюдения/гипотезы уровня L0.'
    }</p>`, 'DONE'));

  s.push(section('13. Какие данные нужны (Data Request)', 'Что открыть, чтобы перевести гипотезы в факт на A1–A2.',
    `<ul>${(inp.analysis?.openQuestions?.length ? inp.analysis.openQuestions : ['Доступ к GA4', 'Выгрузка заказов за 6–12 мес', 'Доступ к CRM и рекламным кабинетам']).slice(0, 8).map((q) => `<li>${esc(q)}</li>`).join('')}</ul>`, 'DONE'));

  // 14. Итоговый вывод — законченная мысль зонтичного отчёта, а не обрыв на списке.
  const statuses = { done: 0, partial: 0, blocked: 0 };
  for (const html of s) { statuses.done += (html.match(/chip done/g) ?? []).length; statuses.partial += (html.match(/chip partial/g) ?? []).length; statuses.blocked += (html.match(/chip blocked/g) ?? []).length; }
  const worstUx = ux ? [...ux.pages].filter((p) => p.max).sort((a, b) => a.score / a.max - b.score / b.max)[0] : null;
  s.push(`${conclusionSection([
    `${verdict.split('. ').slice(0, 2).join('. ')}${/\.$/.test(verdict) ? '' : '.'} Диагностика охватила ${s.length} управленческих разделов: ${statuses.done} доказаны внешне, ${statuses.partial} закрыты частично, ${statuses.blocked} ждут доступов — статусы выставлены честно, чтобы решение принималось на реальной, а не нарисованной полноте данных.`,
    ux
      ? `Состояние витрины: ${ux.totalPct}% соответствия эталону; ${ux.systemic.length ? `${ux.systemic.length} системных дефектов уровня шаблона — самая дешёвая точка приложения усилий (правятся один раз, работают на всём сайте)` : 'системных дефектов шаблонов нет'}${worstUx ? `; слабейшая страница пути — ${worstUx.title} (${Math.round((worstUx.score / worstUx.max) * 100)}%)` : ''}. ${inp.bench ? `Рыночная позиция — ${inp.bench.clientRank}/${inp.bench.totalSites} (индекс ${inp.bench.clientIndex}/100).` : ''}`
      : 'Витрина не разобрана — состояние UX/UI не оценивалось.',
    inp.money
      ? `Экономика разрыва оценена: недополучено ≈ ${rub(inp.money.potentialYear)}/год при доведении воронки до целевой — это верхняя рамка для бюджета программы изменений.`
      : 'Экономика разрыва на этом слое сознательно не считалась (нет baseline): любая цифра была бы выдумкой. Она появляется первой после передачи данных — и превращает приоритеты этого отчёта в бюджетные решения.',
    `Порядок действий зафиксирован в связанных документах: причинно-следственная карта → scope по волнам → реестр гипотез. Управленческое решение, которое требуется сейчас, — не «какие правки внести», а открыть данные (раздел 13) и согласовать волну 1.`,
  ], `A1: передать доступы из Data Request (раздел 13) — за ним следуют подтверждение гипотез, экономика и старт волны 1.`, '14. Итоговый вывод')}
    <section class="block"><div class="footer">Commerce OS · Executive Diagnostic A0 · ${esc(name)} · ${esc(date)}. Слой A0: внешний обход без доступов. Оценки — наблюдение, не факт по данным клиента; отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7). Заблокированные разделы отмечены статусом BLOCKED и закрываются на следующем уровне.</div></section>`);

  return doc(`Executive Diagnostic A0 · ${name}`, cover + s.join(''));
}

function countGroupFails(ds: AuditDataset, group: string): number {
  let n = 0;
  for (const p of ds.client.pages) for (const c of p.checks) if (c.group === group && !c.pass) n++;
  return n;
}
function trustBody(ux: SiteAuditReport | null): string {
  if (!ux) return '<p class="lead">Данных по доверию нет.</p>';
  const missTrust = ux.pages.filter((p) => p.rows.some((r) => /довери|отзыв/i.test(r.name) && r.state === 'gap')).map((p) => p.title);
  return `<p class="lead">${missTrust.length ? `Блок доверия/отзывов отсутствует на: ${esc(missTrust.join(', '))}. Это прямо роняет оплату заявок.` : 'Сигналы доверия в целом присутствуют — детально в UX/UI Audit A0.'}</p>`;
}
function riskOppBody(inp: ExecInputs): string {
  const risks: string[] = [];
  if (inp.engine?.gaps?.length) for (const g of inp.engine.gaps.slice(0, 4)) risks.push(esc(g.label));
  if (inp.siteAudit?.systemic?.length) for (const sdf of inp.siteAudit.systemic.slice(0, 3)) risks.push(esc(sdf.title));
  const opps: string[] = [];
  if (inp.analysis?.scope?.length) for (const sc of inp.analysis.scope.slice(0, 4)) opps.push(`${esc(sc.playbook)} — ${esc(sc.reason)}`);
  return `<div class="concl-grid" style="font-size:10.5px">
    <span class="k gap">Риски</span><span class="v">${risks.length ? risks.join('; ') : 'см. карту разрывов'}</span>
    <span class="k ok">Возможности</span><span class="v">${opps.length ? opps.join('; ') : 'приоритетные активации — в scope-документе'}</span>
  </div>`;
}
