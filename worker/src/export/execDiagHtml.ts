/**
 * Executive Diagnostic A0 — зонтичный клиентский PDF: сводит все аудиты
 * в 15–25 страниц, каждый раздел начинается с вывода (A0 §8-карточки), иерархия
 * вывод→факты (§14). Тянет то, что воркер уже считает (UX/UI, деньги, конкуренты,
 * зрелость, coverage, гипотезы); недостающее помечает PARTIAL/BLOCKED (§15).
 */
import { esc, dimBadges, scoreColor, doc, cover, pageFooter, conclusionSection } from './reportShell.js';
import { svgDonut, svgGauge } from './charts.js';
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
  registry?: import('../registry.js').Finding[];  // единый реестр — топ находок в exec
};

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;
const eLevel = (conf: number) => (conf >= 0.8 ? 'висока впевненість' : conf >= 0.6 ? 'підтверджено перевіркою' : 'спостереження'); // зовнішній аудит — стеля E3
const clientName = (ds: AuditDataset) => { try { return new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { return ds.client.finalUrl; } };

/** Карточка «главный вывод». «Влияние» показываем только если отличается от «Разрыва». */
function conclCard(c: { title: string; sev?: 'crit' | 'warn'; see: string; proof: string; ref: string; gap: string; impact: string; conf: string; unknown: string; next: string }): string {
  const impactRow = c.impact && c.impact !== c.gap ? `<span class="k">Вплив</span><span class="v">${esc(c.impact)}</span>` : '';
  const title = c.title.length > 120 ? c.title.slice(0, 117) + '…' : c.title;
  return `<div class="concl ${c.sev ?? ''}"><h3>${esc(title)}</h3><div class="concl-grid">
    <span class="k">Що бачимо</span><span class="v">${esc(c.see)}</span>
    <span class="k">Доказ</span><span class="v">${esc(c.proof)}</span>
    <span class="k">Порівняння</span><span class="v">${esc(c.ref)}</span>
    <span class="k">Розрив</span><span class="v">${esc(c.gap)}</span>
    ${impactRow}
    <span class="k">Впевненість</span><span class="v">${esc(c.conf)}</span>
    <span class="k">Що невідомо</span><span class="v">${esc(c.unknown)}</span>
    <span class="k">Наступний крок</span><span class="v">${esc(c.next)}</span>
  </div></div>`;
}

function keyFindings(inp: ExecInputs): string {
  const cards: string[] = [];
  const findings: Finding[] = inp.analysis?.findings ?? [];
  const firstClause = (t: string) => { const s = (t.split(/(?<=[.!?])\s/)[0] || t).split(/[,(]/)[0].trim(); return s.length > 58 ? s.slice(0, 55).trim() + '…' : s; };
  for (const f of findings.slice(0, 6)) {
    cards.push(conclCard({
      // Заголовок — короткий вывод (одна строка), не простыня: полный факт идёт в «Що бачимо».
      title: `${f.area}: ${firstClause(f.fact)}`,
      sev: f.confidence >= 0.75 ? 'crit' : 'warn',
      see: f.fact, proof: 'Зовнішній обхід вітрини без доступів (спостереження)', ref: 'Еталон композиції / голд-стандарт',
      gap: f.why, impact: f.why, conf: `${eLevel(f.confidence)} · ${Math.round(f.confidence * 100)}%`,
      unknown: 'Фактичний вплив на конверсію — після підключення аналітики та рекламних кабінетів', next: 'Перевірити на даних GA4/CRM після передачі доступів і підключення аналітики',
    }));
  }
  // добор из системных дефектов UX/UI, если находок мало
  if (cards.length < 3 && inp.siteAudit) {
    for (const s of inp.siteAudit.systemic.slice(0, 3)) {
      cards.push(conclCard({ title: s.title, sev: 'warn', see: s.title, proof: 'Проявляється на всіх розібраних сторінках', ref: 'Голд-стандарт', gap: s.detail, impact: s.detail, conf: 'підтверджено · системний', unknown: 'Точний масштаб — на повному crawl після передачі доступів (наступний етап)', next: 'Правка в шаблоні/налаштуваннях' }));
    }
  }
  return cards.length ? cards.join('') : '<p class="lead">Головні висновки з\'являться після аналізу (потрібен ANTHROPIC_API_KEY і дані обходу).</p>';
}

function section(title: string, conclusion: string, body: string, status?: 'DONE' | 'PARTIAL' | 'BLOCKED'): string {
  const statusWord = status === 'DONE' ? 'Готово' : status === 'PARTIAL' ? 'Частково' : 'Потрібні доступи';
  const chip = status ? `<span class="chip ${status === 'DONE' ? 'done' : status === 'PARTIAL' ? 'partial' : 'blocked'}">${statusWord}</span>` : '';
  return `<section class="block"><h2>${esc(title)} ${chip}</h2><p class="lead">${esc(conclusion)}</p>${body}</section>`;
}

export function renderExecDiagnostic(ds: AuditDataset, inp: ExecInputs): string {
  const name = clientName(ds);
  const ux = inp.siteAudit;
  const verdict = inp.analysis?.summary || ux?.verdict || 'Зовнішня діагностика вітрини.';
  const posture = ux ? ux.totalPct : null;

  // Cover: вивід — окремим рядком (.verdict), заголовок = коротка назва документа.
  const h1raw = verdict.split('. ')[0];
  const h1txt = (h1raw.length > 160 ? h1raw.slice(0, 157) + '…' : h1raw) + '.';
  const moneyWarn = inp.money ? '' : '<div style="color:var(--gap);margin-bottom:6px"><b>Економіку не пораховано — і це перше рішення, яке потрібно ухвалити.</b> Для грошової оцінки кожного розриву достатньо трьох цифр від власника: місячний трафік, конверсія в замовлення, середній чек. Після їх передачі беклог і причинна карта отримують грошові вилки замість орієнтирів. Аудит свідомо не вигадує цифри (принцип чесних даних).</div>';
  const coverHtml = cover({
    kicker: 'Виконавча діагностика',
    title: 'Виконавча діагностика',
    verdict: h1txt,
    metrics: [{ label: 'Клієнт', value: name }],
    score: posture != null ? { pct: posture, cap: 'зовнішня відповідність еталону (UX/UI)' } : undefined,
    note: `${moneyWarn}<b>Coverage Map:</b> зовнішній зріз вітрини без доступів. Розділи зі статусом: <span class="chip done">Готово</span> зовні доведено · <span class="chip partial">Частково</span> частково · <span class="chip blocked">Потрібні доступи</span> потрібен доступ/дані. Відсутність даних не видається за факт і не приховується.`,
  });

  // Разделы A0 §13
  const s: string[] = [];
  s.push(section('1. Що це за бізнес (попередня Commerce DNA)',
    'Профіль за зовнішніми ознаками — уточнюється даними після передачі доступів (наступний етап).',
    `<table><tbody>
      <tr><th>Платформа</th><td>${esc(ds.client.tech.platform ?? 'не визначена')}</td></tr>
      <tr><th>Аналітика</th><td>${esc(ds.client.tech.analytics.join(', ') || 'не виявлена')}</td></tr>
      <tr><th>Запит клієнта</th><td>${esc(ds.request || '— (ініціативний аудит)')}</td></tr>
      <tr><th>robots / sitemap</th><td>${ds.client.robotsTxt ? 'robots є' : 'robots немає'} · ${ds.client.sitemapXml ? 'sitemap є' : 'sitemap немає'}</td></tr>
    </tbody></table>`, 'PARTIAL'));

  s.push(section('2. Головні висновки', '5–10 управлінських висновків (кожен — з доказом і рівнем упевненості).', keyFindings(inp), inp.analysis ? 'DONE' : 'BLOCKED'));

  // Топ единого реестра находок — все аудиты сведены в одну приоритизированную таблицу.
  if (inp.registry?.length) {
    const top = inp.registry.slice(0, 8);
    const p0 = inp.registry.filter((f) => f.priority === 'P0').length;
    const p1 = inp.registry.filter((f) => f.priority === 'P1').length;
    const p2 = inp.registry.filter((f) => f.priority === 'P2').length;
    const prDonut = `<div class="chart-wrap">${svgDonut([
      { label: 'P0 — критично', value: p0, color: '#dc2626' },
      { label: 'P1 — важливо', value: p1, color: '#d97706' },
      { label: 'P2 — стратегія', value: p2, color: '#64748b' },
    ].filter((x) => x.value > 0), { title: 'Знахідки за пріоритетом', centerLabel: String(inp.registry.length) })}
      <p class="chart-cap">Єдиний реєстр усіх аудитів; смуга пріоритету = Impact × Confidence × Revenue / Cost. З червоного сектора починається робота.</p></div>`;
    const rows = top.map((f) => `<tr>
      <td style="font-weight:800;white-space:nowrap">${esc(f.id)}</td>
      <td><span class="pr ${f.priority}">${f.priority}</span></td>
      <td>${esc(f.title)}${f.refs?.length ? ` <span style="color:var(--muted);font-size:8px">${esc(f.refs.join(', '))}</span>` : ''}</td>
      <td style="text-align:right">${Math.round(f.confidence * 100)}%</td>
      <td style="text-align:right;white-space:nowrap">${f.revenueExposure ? `${Math.round(f.revenueExposure).toLocaleString('ru-RU')} ₴` : '—'}</td>
    </tr>`).join('');
    s.push(section('2а. Топ знахідок — єдиний реєстр',
      `Усі аудити зведені в один реєстр: ${inp.registry.length} знахідок, критичних P0 — ${p0}. Пріоритет = Impact × Confidence × Revenue / Cost; одна проблема = один ID через усі звіти.`,
      `${prDonut}<table><thead><tr><th>ID</th><th>Пріор.</th><th>Знахідка · де трапляється</th><th>Впевн.</th><th>Revenue/рік</th></tr></thead><tbody>${rows}</tbody></table>`, 'DONE'));
  }

  // Карта разрывов
  const gapRows: string[] = [];
  if (ux) gapRows.push(`<tr><td>UX/UI композиція</td><td class="${scoreColor(ux.totalPct)}">${ux.totalPct}% відповідності</td><td>${ux.systemic.length} системних дефектів</td></tr>`);
  if (inp.engine?.score != null) gapRows.push(`<tr><td>Health Score</td><td>${inp.engine.score}/100 «${esc(inp.engine.band)}»</td><td>${inp.engine.gaps.length} критичних розривів</td></tr>`);
  if (inp.bench) gapRows.push(`<tr><td>Конкурентний індекс</td><td>${inp.bench.clientIndex}/100</td><td>місце ${inp.bench.clientRank}/${inp.bench.totalSites}</td></tr>`);
  const healthGauge = inp.engine?.score != null
    ? `<div class="chart-wrap row"><div style="text-align:center">${svgGauge(inp.engine.score, { max: 100, label: `Health Score · «${inp.engine.band}»` })}</div>
        <p class="chart-cap" style="flex:1;min-width:180px">Зведений індекс здоров'я вітрини за зовнішніми ознаками (0–100). Це оцінка стану БІЗНЕСУ, на відміну від Confidence Score — достовірності нашого розбору.</p></div>`
    : '';
  s.push(section('3. Карта основних розривів', 'Де вітрина найдалі від еталона й ринку.',
    (gapRows.length ? `${healthGauge}<table><thead><tr><th>Домен</th><th>Оцінка</th><th>Розрив</th></tr></thead><tbody>${gapRows.join('')}</tbody></table>` : '<p class="lead">Карта розривів збирається з UX/UI, рушія та бенчмарка.</p>'),
    gapRows.length ? 'DONE' : 'PARTIAL'));

  // Экономика разрыва
  s.push(inp.money
    ? section('4. Економіка розриву', 'Недоотриманий оборот при доведенні воронки до цільової.',
      `<table><tbody>
        <tr><th>Виручка зараз</th><td>${rub(inp.money.currentMonth)}/міс</td></tr>
        <tr><th>За цільової воронки</th><td>${rub(inp.money.targetMonth)}/міс</td></tr>
        <tr><th>Недоотримано</th><td class="gap"><b>${rub(inp.money.potentialYear)}/рік</b></td></tr>
      </tbody></table>`, 'DONE')
    : section('4. Економіка розриву', 'Грошова оцінка потребує базових показників (трафік, конверсія, чек) — після передачі доступів (наступний етап).', '<p class="lead">Немає базових показників — економіка розриву не рахується, щоб не видавати оцінку за факт.</p>', 'BLOCKED'));

  // UX/UI карта
  s.push(section('5. Карта UX/UI', ux ? ux.verdict : 'UX/UI-зріз за типами сторінок.',
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
        + Array.from(extra.entries()).map(([base, e]) => { const avg = Math.round(e.sum / e.n); return `<tr><td>${esc(base)} — ще ${e.n} сторінок</td><td><span class="bar"><i class="fill ${scoreColor(avg)}" style="width:${avg}%"></i></span></td><td class="${scoreColor(avg)}">~${avg}%</td></tr>`; }).join('');
      return `<table><thead><tr><th>Тип сторінки</th><th>Відповідність</th><th>%</th></tr></thead><tbody>${rows}</tbody></table><p class="lead">Детально — в окремому документі «UX/UI Audit».</p>`;
    })() : '<p class="lead">Сторінки не розібрані.</p>', ux ? 'DONE' : 'BLOCKED'));

  // SEO карта
  const seoFails = countGroupFails(ds, 'SEO');
  s.push(section('6. Карта SEO-архітектури', ds.client.sitemapXml ? 'Базова індексованість є; дерево уточнюється після передачі доступів (наступний етап).' : 'Немає sitemap.xml — ризик індексації всього каталогу.',
    `<p class="lead">Провалів SEO-перевірок на розібраних сторінках: <b>${seoFails}</b>. sitemap.xml: ${ds.client.sitemapXml ? 'є' : '<span class="gap">немає</span>'}. Повне дерево та технічна SEO — окремий документ «SEO Architecture».</p>`, 'PARTIAL'));

  s.push(section('7. Карта контентних розривів', 'Здатність контенту знімати невизначеність і вести до рішення.', '<p class="lead">Контент-аудит (повнота/корисність/переконливість/інтент) — окремий документ «Content Audit».</p>', 'PARTIAL'));

  s.push(section('8. Карта каналів', ds.client.tech.analytics.length ? 'Трекінг встановлено — фактична ефективність каналів після підключення аналітики та рекламних кабінетів.' : 'Аналітика не виявлена — виміряти канали неможливо.',
    `<p class="lead">Аналітика: ${esc(ds.client.tech.analytics.join(', ') || 'не виявлена')}. Фактична ефективність каналів потребує доступу до рекламних кабінетів (наступний етап).</p>`, ds.client.tech.analytics.length ? 'PARTIAL' : 'BLOCKED'));

  s.push(section('9. Конкурентна позиція', inp.bench ? `Індекс клієнта ${inp.bench.clientIndex}/100, місце ${inp.bench.clientRank} з ${inp.bench.totalSites}.` : 'Конкуренти не задані для зовнішнього порівняння.',
    inp.bench ? `<p class="lead">Детальний розбір — документ «Конкурентний аналіз».</p>` : '<p class="lead">Додайте конкурентів для бенчмарка (розширений аудит з конкурентами).</p>', inp.bench ? 'DONE' : 'PARTIAL'));

  s.push(section('10. Комерційна пропозиція та довіра', 'Сигнали довіри вітрини (гарантії, відгуки, реквізити).', trustBody(inp.siteAudit), 'PARTIAL'));

  // Риски / возможности / доказательность
  s.push(section('11. Критичні ризики та можливості', 'Що загрожує і де найближче зростання.', riskOppBody(inp), 'PARTIAL'));

  const conf = inp.coverage?.confidence;
  s.push(section('12. Що доведено / гіпотеза / невідомо', conf ? `Confidence Score ${conf.score}/${conf.base} — «${esc(conf.band)}».` : 'Розподіл фактів, гіпотез і незнання.',
    `<p class="lead">${
      inp.analysis?.missingFacts?.length ? `Відсутні факти: ${esc(inp.analysis.missingFacts.slice(0, 6).join('; '))}.` : 'Більшість висновків — спостереження/гіпотези рівня зовнішнього обходу вітрини.'
    }</p>`, 'DONE'));

  s.push(section('13. Які дані потрібні (Data Request)', 'Що відкрити, щоб перевести гіпотези у факт після передачі доступів і підключення аналітики.',
    `<ul>${(inp.analysis?.openQuestions?.length ? inp.analysis.openQuestions : ['Доступ до GA4', 'Вивантаження замовлень за 6–12 міс', 'Доступ до CRM і рекламних кабінетів']).slice(0, 8).map((q) => `<li>${esc(q)}</li>`).join('')}</ul>`, 'DONE'));

  // 14. Итоговый вывод — законченная мысль зонтичного отчёта, а не обрыв на списке.
  const statuses = { done: 0, partial: 0, blocked: 0 };
  for (const html of s) { statuses.done += (html.match(/chip done/g) ?? []).length; statuses.partial += (html.match(/chip partial/g) ?? []).length; statuses.blocked += (html.match(/chip blocked/g) ?? []).length; }
  const worstUx = ux ? [...ux.pages].filter((p) => p.max).sort((a, b) => a.score / a.max - b.score / b.max)[0] : null;
  s.push(`${conclusionSection([
    `${verdict.split('. ').slice(0, 2).join('. ')}${/\.$/.test(verdict) ? '' : '.'} Діагностика охопила ${s.length} управлінських розділів: ${statuses.done} доведені зовні, ${statuses.partial} закриті частково, ${statuses.blocked} чекають доступів — статуси виставлені чесно, щоб рішення ухвалювалося на реальній, а не намальованій повноті даних.`,
    ux
      ? `Стан вітрини: ${ux.totalPct}% відповідності еталону; ${ux.systemic.length ? `${ux.systemic.length} системних дефектів рівня шаблону — найдешевша точка докладання зусиль (правляться один раз, працюють на всьому сайті)` : 'системних дефектів шаблонів немає'}${worstUx ? `; найслабша сторінка шляху — ${worstUx.title} (${Math.round((worstUx.score / worstUx.max) * 100)}%)` : ''}. ${inp.bench ? `Ринкова позиція — ${inp.bench.clientRank}/${inp.bench.totalSites} (індекс ${inp.bench.clientIndex}/100).` : ''}`
      : 'Вітрина не розібрана — стан UX/UI не оцінювався.',
    inp.money
      ? `Економіку розриву оцінено: недоотримано ≈ ${rub(inp.money.potentialYear)}/рік при доведенні воронки до цільової — це верхня рамка для бюджету програми змін.`
      : 'Економіку розриву на цьому шарі свідомо не рахували (немає базових показників): будь-яка цифра була б вигадкою. Вона з\'являється першою після передачі даних — і перетворює пріоритети цього звіту на бюджетні рішення.',
    `Порядок дій зафіксований у пов'язаних документах: причинно-наслідкова карта → scope за хвилями → реєстр гіпотез. Управлінське рішення, яке потрібне зараз, — не «які правки внести», а відкрити дані (розділ 13) і погодити хвилю 1.`,
  ], `Наступний етап: передати доступи з Data Request (розділ 13) — за ним ідуть підтвердження гіпотез, економіка та старт хвилі 1.`, '14. Підсумковий висновок')}
    ${pageFooter('Зовнішній обхід вітрини без доступів. Оцінки — спостереження, не факт за даними клієнта; відсутність даних не видається за факт і не приховується. Заблоковані розділи позначені статусом «Потрібні доступи» і закриваються на наступному рівні.')}`);

  return doc(`Виконавча діагностика · ${name}`, coverHtml + s.join(''));
}

function countGroupFails(ds: AuditDataset, group: string): number {
  let n = 0;
  for (const p of ds.client.pages) for (const c of p.checks) if (c.group === group && !c.pass) n++;
  return n;
}
function trustBody(ux: SiteAuditReport | null): string {
  if (!ux) return '<p class="lead">Даних щодо довіри немає.</p>';
  const missTrust = ux.pages.filter((p) => p.rows.some((r) => /довери|довір|отзыв|відгук/i.test(r.name) && r.state === 'gap')).map((p) => p.title);
  return `<p class="lead">${missTrust.length ? `Блок довіри/відгуків відсутній на: ${esc(missTrust.join(', '))}. Це прямо знижує оплату замовлень.` : 'Сигнали довіри загалом присутні — детально в UX/UI Audit.'}</p>`;
}
function riskOppBody(inp: ExecInputs): string {
  const risks: string[] = [];
  if (inp.engine?.gaps?.length) for (const g of inp.engine.gaps.slice(0, 4)) risks.push(esc(g.label));
  if (inp.siteAudit?.systemic?.length) for (const sdf of inp.siteAudit.systemic.slice(0, 3)) risks.push(esc(sdf.title));
  const opps: string[] = [];
  if (inp.analysis?.scope?.length) for (const sc of inp.analysis.scope.slice(0, 4)) opps.push(`${esc(sc.playbook)} — ${esc(sc.reason)}`);
  return `<div class="concl-grid" style="font-size:10.5px">
    <span class="k gap">Ризики</span><span class="v">${risks.length ? risks.join('; ') : 'див. карту розривів'}</span>
    <span class="k ok">Можливості</span><span class="v">${opps.length ? opps.join('; ') : 'пріоритетні активації — у scope-документі'}</span>
  </div>`;
}
