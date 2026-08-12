/**
 * A0-PDF для метод-документов (единый стандарт reportShell): матрица зрелости
 * (дашборд), охват и уверенность, реестр гипотез, scope по волнам, цена в канале,
 * синтез аудита. Оборачивают уже считаемые воркером модели.
 */
import { esc, doc, scoreColor, methodologySection, conclusionSection } from './reportShell.js';
import type { MaturityReport } from '../maturity.js';
import type { CoverageReport, LensStatus } from '../coverage.js';
import type { HypothesisRegister } from '../hypotheses.js';
import { PB_META, type ScopeReport } from '../routing.js';
import type { PriceChannelReport } from '../pricechannel.js';
import type { Synthesis } from '../synthesis.js';
import type { CausalMap } from '../causal.js';

const head = (kicker: string, h1: string, client: string, date: string, meta: [string, string][], scoreBig?: { val: string; cap: string; cls: string }, note?: string) => `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
  <div class="kicker">${esc(kicker)}</div><h1>${esc(h1)}</h1>
  <div class="cov-meta">${[['Клиент', client], ['Дата', date], ...meta].map(([l, v]) => `<div><span class="lbl">${esc(l)}</span><span class="val">${esc(v)}</span></div>`).join('')}</div>
  ${scoreBig ? `<div class="cov-score"><div class="big ${scoreBig.cls}">${esc(scoreBig.val)}</div><div class="big-cap">${esc(scoreBig.cap)}</div></div>` : ''}
  ${note ? `<div class="coverage">${note}</div>` : ''}
</div></section>`;

const foot = (name: string, client: string, date: string, extra = '') => `<section class="block"><div class="footer">Commerce OS · ${esc(name)} · ${esc(client)} · ${esc(date)}. Внешний срез витрины. Отсутствие данных не выдаётся за факт и не скрывается.${extra ? ' ' + esc(extra) : ''}</div></section>`;

/* ── Матрица зрелости (дашборд) ── */
export function renderMaturityPdf(m: MaturityReport, client: string, date: string): string {
  const lvlCls = (l: number | null) => (l == null ? 'na' : l >= 4 ? 'ok' : l >= 3 ? 'check' : 'gap');
  const seg = (l: number | null) => Array.from({ length: 5 }, (_, i) => `<i class="sg ${l != null && i < l ? lvlCls(l) : ''}"></i>`).join('');
  const rows = m.rows.map((r) => `<tr>
    <td class="m-dom">${esc(r.domain)}</td>
    <td class="m-ass">${esc(r.assesses)}</td>
    <td class="m-bar"><span class="segs">${seg(r.level)}</span></td>
    <td class="m-lvl ${lvlCls(r.level)}">${r.level == null ? '—' : `${r.level}/5`}</td>
    <td class="m-src ${r.source === 'L0' ? '' : 'gap'}">${esc(r.source === 'L0' ? 'внешний обход' : r.source)}</td>
  </tr>`).join('');
  const avg = m.observedAvg;
  const body = `<section class="block"><h2>Зрелость по доменам (наблюдение внешнего обхода)</h2>
    <p class="lead">Шкала 0–5: 0 — отсутствует, 5 — системно управляется. «Нужны данные» — уровень внешне не подтвердить (следующий этап).</p>
    <table><thead><tr><th>Домен</th><th>Что оценивает</th><th>Уровень</th><th></th><th>Источник</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const observedRows = m.rows.filter((r) => r.level != null);
  const best = [...observedRows].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))[0];
  const worstD = [...observedRows].sort((a, b) => (a.level ?? 0) - (b.level ?? 0))[0];
  const meth = methodologySection({
    goal: 'Показать, насколько системно управляется каждый домен бизнеса — от хаоса (L1) до оптимизации (L5) — и где зрелость ограничивает рост.',
    sources: ['Внешний обход: проверки и блоки страниц по доменам', 'Пороговая модель Commerce OS (доля пройденных проверок → уровень)'],
    scope: `${m.rows.length} доменов; во внешнем аудите наблюдаемы ${observedRows.length}, остальные ждут данных.`,
    limits: 'Уровень домена «нужны данные» не оценивается и не усредняется — внешне его зрелость не видна. Важно: здесь измеряется управляемость отдельных ДОМЕНОВ (L1–L5); уровень в Commerce Intelligence — ступень развития бизнес-модели. Это разные шкалы, их числа и не должны совпадать.',
  });
  const conclM = conclusionSection([
    avg != null
      ? `Средняя зрелость по наблюдаемым доменам — ${avg}/5. ${avg >= 3.5 ? 'Управление системное: процессы определены, дальше — управляемость по данным.' : avg >= 2.5 ? 'Бизнес между «повторяемо» и «определено»: практики есть, но они держатся на людях, а не на системе — рост будет упираться в ручное управление.' : 'Зрелость низкая: большинство доменов работает в режиме реакций. Любая программа роста должна начинаться с систематизации, иначе эффект не удержится.'}`
      : 'Наблюдаемых доменов недостаточно для средней оценки — матрица заполняется данными после передачи доступов (следующий этап).',
    best && worstD && best !== worstD
      ? `Самый зрелый домен — ${best.domain} (${best.level}/5): на него можно опираться. Самый слабый — ${worstD.domain} (${worstD.level}/5): он задаёт потолок всей системе, потому что зрелость цепочки равна зрелости слабейшего звена.`
      : 'Разброс уровней между доменами минимален — система развивается равномерно.',
    `${m.rows.length - observedRows.length} доменов помечены «нужны данные»: их зрелость определяется опросником и доступами после передачи доступов (следующий этап). Матрица при этом не перестраивается — уточняется только уверенность (закон метода).`,
  ], 'Следующий этап: опросник собственника + доступы → полная матрица всех доменов и целевые уровни на 12 месяцев.');
  const extra = `.m-dom{font-weight:700;white-space:nowrap;} .m-ass{color:#333;font-size:10px;} .m-lvl{font-weight:800;white-space:nowrap;} .m-src{font-size:9px;color:var(--muted);}
    .segs{display:inline-flex;gap:2px;} .sg{width:16px;height:9px;border-radius:2px;background:var(--line);display:block;} .sg.ok{background:var(--ok);} .sg.check{background:var(--check);} .sg.gap{background:var(--gap);} .sg.na{background:var(--line);}`;
  return doc(`Матрица зрелости · ${client}`, head('Commerce OS · Матрица зрелости · внешний аудит витрины', avg != null ? `Средняя зрелость витрины — ${avg}/5 по внешним признакам` : 'Зрелость: базовый уровень, детали — после данных (следующий этап)', client, date, [['Средняя', avg != null ? `${avg}/5` : '—']], avg != null ? { val: `${avg}`, cap: 'средний уровень зрелости (из 5)', cls: lvlCls(avg) } : undefined, 'Оценка зрелости по внешнему обходу. Домены «нужны данные» подтверждаются после передачи доступов (следующий этап) доступом к системам/процессам.') + meth + body + conclM + foot('Матрица зрелости', client, date), extra);
}

/* ── Охват и уверенность ── */
export function renderCoveragePdf(c: CoverageReport, client: string, date: string): string {
  const cls: Record<LensStatus, string> = { covered: 'ok', partial: 'check', external: 'check', 'needs-access': 'gap' };
  const word: Record<LensStatus, string> = { covered: 'покрыто', partial: 'частично', external: 'внешне', 'needs-access': 'нужен доступ' };
  const rows = c.lenses.map((l) => `<tr><td class="cv-name">${esc(l.name)}</td><td class="cv-st ${cls[l.status]}">${word[l.status]}</td><td class="cv-note">${esc(l.note)}</td></tr>`).join('');
  const conf = c.confidence;
  const pct = conf.base ? Math.round((conf.score / conf.base) * 100) : 0;
  const body = `<section class="block"><h2>Что доказано, что требует данных</h2>
    <p class="lead">Охват по видам анализа и уверенность вывода. Уверенность зависит от полноты данных и качества доказательств (формула ниже) и ограничена потолком тира.</p>
    <table><thead><tr><th>Вид анализа</th><th>Статус</th><th>Комментарий</th></tr></thead><tbody>${rows}</tbody></table></section>
    <section class="block"><h2>Как считается уверенность</h2>
      <p class="lead">Confidence Score = потолок тира × полнота данных × качество доказательств. Это не «экспертное число»: качество доказательств — средняя уверенность находок реестра, где на уровне каждой находки уже учтены сила доказательства, воспроизводимость и источник (сайт / данные / тест).</p>
      ${conf.evidenceQuality != null ? `<div class="concl-grid"><span class="k">Полнота данных</span><span class="v">${Math.round((conf.dataCompleteness ?? 0) * 100)}%</span><span class="k">Качество доказательств</span><span class="v">${Math.round((conf.evidenceQuality ?? 0) * 100)}% (по реестру находок)</span><span class="k">Потолок тира</span><span class="v">${conf.base}</span></div>` : ''}</section>
    ${conf.raisedBy.length ? `<section class="block"><h2>Что поднимет уверенность</h2><ul>${conf.raisedBy.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}`;
  const covered = c.lenses.filter((l) => l.status === 'covered').length;
  const partial = c.lenses.filter((l) => l.status === 'partial').length;
  const gated = c.lenses.filter((l) => l.status === 'needs-access' || l.status === 'external').length;
  const conclC = conclusionSection([
    `Из ${c.lenses.length} видов анализа полностью покрыто ${covered}, частично — ${partial}, ${gated} требуют внешних сервисов или доступов. Confidence Score отчёта — ${conf.score}/${conf.base} («${conf.band}»): это достоверность НАШИХ выводов на текущих данных, не оценка бизнеса.`,
    conf.raisedBy.length
      ? `Уверенность поднимается конкретными шагами (${conf.raisedBy.length} шт., перечислены выше) — каждый из них добавляет данные, а не мнения. Пока они не сделаны, выводы аудита следует читать с этим коэффициентом доверия, и именно поэтому он опубликован, а не спрятан.`
      : 'Все факторы полноты данных на этом тире собраны — уверенность на потолке тира.',
    'Непокрытый вид анализа — не пробел и не «забыли»: это строка с указанием, чем он закрывается. Структура отчёта не меняется от тира к тиру — растёт только уверенность (закон метода Commerce OS).',
  ], 'Согласовать с владельцем 2–3 ближайших источника данных (доступы, опросник, конкуренты) — самый дешёвый способ поднять достоверность всех документов сразу.');
  const extra = `.cv-name{font-weight:700;} .cv-st{font-weight:700;white-space:nowrap;} .cv-note{color:#333;font-size:10px;}`;
  // Цвет большой цифры — не зелёный на A0 (потолок уверенности низкий по определению).
  const confCls = /высок/i.test(conf.band) ? 'ok' : 'check';
  return doc(`Охват и уверенность · ${client}`, head('Commerce OS · Охват и уверенность · внешний аудит витрины', `Confidence Score ${conf.score}/${conf.base} — «${conf.band}»`, client, date, [['Confidence', `${conf.score}/${conf.base}`]], { val: `${pct}%`, cap: `уверенность вывода · «${conf.band}»`, cls: confCls }, 'Внешний аудит витрины — внешний срез; потолок уверенности низкий. Доступы и данные после передачи доступов и подключения аналитики поднимают Confidence.') + body + conclC + foot('Охват и уверенность', client, date), extra);
}

/* ── Реестр гипотез ── */
export function renderHypothesesPdf(h: HypothesisRegister, client: string, date: string): string {
  const cCls = (c: number) => (c >= 0.7 ? 'ok' : c >= 0.5 ? 'check' : 'gap');
  const rows = h.items.map((i) => `<tr>
    <td class="h-id">${esc(i.id)}</td>
    <td class="h-hyp"><b>${esc(i.hypothesis)}</b><span class="h-area">${esc(i.area)}</span></td>
    <td class="h-basis">${esc(i.basis)}</td>
    <td class="h-verify">✓ ${esc(i.verifyBy)}<br>✕ ${esc(i.falsifyIf)}</td>
    <td class="h-own">${esc(i.owner)}<span class="h-cost">${esc(i.cost)}</span></td>
    <td class="h-conf ${cCls(i.confidence)}">${Math.round(i.confidence * 100)}%</td>
  </tr>`).join('');
  const body = `<section class="block"><h2>Гипотезы: что проверить и чем опровергнуть</h2>
    <p class="lead">Во внешнем аудите большинство выводов — гипотезы: у каждой способ подтверждения и условие опровержения (после передачи доступов и подключения аналитики).</p>
    ${h.items.length ? `<table><thead><tr><th>ID</th><th>Гипотеза</th><th>Основание</th><th>Проверка / опровержение</th><th>Владелец · стоимость</th><th>Увер.</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="lead">Гипотезы появятся после аналитического слоя (нужен ключ Claude).</p>'}</section>`;
  const areas = Array.from(new Set(h.items.map((i) => i.area)));
  const lowConf = h.items.filter((i) => i.confidence < 0.5).length;
  const conclH = conclusionSection([
    h.items.length
      ? `В реестре ${h.items.length} гипотез в ${areas.length} областях (${areas.slice(0, 6).join(', ')}${areas.length > 6 ? '…' : ''}); ${lowConf} из них с уверенностью ниже 50% — их нельзя класть в основу решений до проверки. Реестр — это карта незнания аудита, опубликованная сознательно: документ, который сам помечает недоказанное, невозможно поймать на манипуляции.`
      : 'Гипотез не выделено: находки текущего тира достаточно подтверждены наблюдением.',
    'У каждой гипотезы указано, какие данные её подтверждают и какой факт опровергает. Это превращает следующий шаг работ из «доверьтесь нам» в конечный список измерений с заранее известным критерием результата.',
    'По мере поступления данных гипотеза либо становится находкой-фактом (и попадает в основной отчёт), либо опровергается и снимается. Реестр живой: его пустение — метрика прогресса программы.',
  ], 'Следующий этап: выполнить проверки по столбцу «Как проверить», начиная с гипотез, стоящих за P0-рекомендациями других отчётов.');
  const extra = `.h-id{color:var(--muted);white-space:nowrap;} .h-hyp{font-weight:400;} .h-hyp b{display:block;} .h-area{font-size:8px;color:var(--muted);text-transform:uppercase;} .h-basis{color:#333;font-size:10px;} .h-verify{font-size:9px;color:#333;} .h-conf{font-weight:800;white-space:nowrap;} .h-own{font-size:8.5px;color:#333;} .h-cost{display:block;color:var(--muted);font-size:8px;}`;
  return doc(`Реестр гипотез · ${client}`, head('Commerce OS · Реестр гипотез · внешний аудит витрины', `${h.items.length} гипотез со способом проверки и опровержения`, client, date, [['Гипотез', String(h.items.length)]], undefined, 'Реестр незнания: то, что нельзя утверждать во внешнем аудите. Каждая гипотеза закрывается конкретными данными на следующем уровне.') + body + conclH + foot('Реестр гипотез', client, date), extra);
}

/* ── Scope по волнам ── */
export function renderScopePdf(s: ScopeReport, client: string, date: string): string {
  const total = s.waves.reduce((n, w) => n + w.items.length, 0);
  const waves = s.waves.map((w) => `<section class="block"><h2>${/^волна/i.test(w.title) ? esc(w.title) : `Волна ${w.n}. ${esc(w.title)}`}</h2>
    <p class="lead">Что даёт волна: ${w.items.length} активаций плейбуков; каждая волна — самостоятельный результат.</p>
    <table><thead><tr><th>Плейбук</th><th>Что входит</th><th>Почему включён</th><th>Усилия · срок</th></tr></thead><tbody>${
      w.items.map((it) => { const m = PB_META[it.playbook]; return `<tr><td class="sc-pb">${esc(it.name || it.playbook)}<span class="sc-code">${esc(it.playbook)}</span></td><td class="sc-what">${esc(m?.what ?? '—')}</td><td class="sc-why">${esc(it.reasons.join('; '))}</td><td class="sc-eff">${esc(m ? `${m.effort} · ${m.duration}` : '—')}</td></tr>`; }).join('')
    }</tbody></table></section>`).join('');
  const ni = s.notIncluded.length ? `<section class="block"><h2>Вне scope на этом этапе</h2><ul>${s.notIncluded.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const w1 = s.waves.find((w) => w.n === 1);
  const conclS = conclusionSection([
    total
      ? `Программа собрана из ${total} активаций в ${s.waves.length} волнах. Каждая активация имеет трассу «основание → плейбук → волна»: в scope не попало ничего, под чем нет наблюдения с адресом или цифрой. ${s.notIncluded.length} плейбуков осознанно вне scope — не потому что «не нужны», а потому что на текущих данных для них нет основания.`
      : 'Активаций не набрано: по наблюдаемым сигналам витрина близка к стандарту. Scope в этом случае формируется от целей роста, а не от дефектов.',
    w1 && w1.items.length
      ? `Волна 1 (${w1.items.map((i) => i.playbook).join(', ')}) — это работы, которые окупаются сами и разблокируют измеримость следующих: правильная последовательность здесь важнее объёма. Запускать волну 2 до завершения волны 1 — значит строить на непроверенном фундаменте.`
      : 'Тактических работ (волна 1) не требуется — программа начинается с ядровых изменений.',
    'Волны режутся по времени и зависимостям, а не по качеству: каждая волна — самостоятельный результат с измеримым эффектом, а не «этап большого проекта», который нельзя сдать частями.',
  ], 'Согласовать волну 1 и метрики её успеха; деньги на каждую активацию считаются после baseline-данных (следующий этап).');
  const extra = `.sc-pb{font-weight:700;white-space:nowrap;} .sc-pb .sc-code{display:block;font-weight:400;font-size:7.5px;color:var(--muted);} .sc-what{font-size:9px;color:#333;} .sc-why{color:#333;font-size:9px;} .sc-eff{font-size:9px;white-space:nowrap;color:#333;}`;
  return doc(`Scope по волнам · ${client}`, head('Commerce OS · Scope программы · внешний аудит витрины', `Программа из ${s.waves.length} волн (${total} активаций), режем по волнам, а не по качеству`, client, date, [['Волн', String(s.waves.length)], ['Активаций', String(total)]], undefined, 'Разбивка работ на волны: каждая волна даёт измеримый результат сама по себе и не ждёт следующих. Приоритет — по остаточному вкладу и зависимостям.') + waves + ni + conclS + foot('Scope по волнам', client, date), extra);
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
  const fromCrawl = p.checklist.filter((c) => c.status === 'из обхода').length;
  const needIn = p.checklist.length - fromCrawl;
  const conclP = conclusionSection([
    `Роль клиента в товарной цепочке (гипотеза): ${roleRu[p.role]} — ${p.roleBasis}. Роль определяет всю логику ценового блока: ${p.role === 'producer' ? 'производитель конкурирует со своими же посредниками, и его главный риск — потерять контроль цены в чужих каналах' : p.role === 'reseller' ? 'реселлер структурно проигрывает в закупке тем, кто стоит выше в цепочке, и его поле — сервис, скорость и ассортимент, а не цена' : 'до подтверждения роли ценовые выводы делать нельзя — они окажутся выводами про чужую бизнес-модель'}.`,
    `Из ${p.checklist.length} проверок протокола ${fromCrawl} закрыты обходом, ${needIn} требуют входов (прайс-агрегаторы, маркетплейсы, данные о дистрибуции). Ключевой риск сформулирован выше — он остаётся гипотезой ровно до первой проверки цен в канале.`,
    'Документ фиксирует протокол, по которому ценовая позиция будет измерена, — чтобы проверка после передачи доступов (следующий этап) заняла часы, а не недели, и чтобы её результат нельзя было оспорить («мы заранее договорились, что и как меряем»).',
  ], 'Следующий этап: пройти протокол по чек-листу — цены реселлеров, листинги на маркетплейсах, MAP-дисциплина; после этого блок получает цифры вместо статусов.');
  const extra = `.pcx-item{font-weight:700;} .pcx-how{color:#333;font-size:10px;} .pcx-st{font-weight:700;white-space:nowrap;}`;
  return doc(`Цена в канале · ${client}`, head('Commerce OS · Цена в канале · внешний аудит витрины', `Ценовая позиция и роль в цепочке: ${roleRu[p.role]}`, client, date, [['Роль', roleRu[p.role]]], undefined, 'Цена в собственном канале не должна быть выше, чем на маркетплейсах и у реселлеров. Реальные уровни цен и MAP уточняются после передачи доступов (следующий этап).') + body + conclP + foot('Цена в канале', client, date), extra);
}

/* ── Причинно-следственная карта ── */
export function renderCausalPdf(c: CausalMap, client: string, date: string): string {
  const nodes = c.nodes.map((n, i) => `<div class="cz">
    <div class="cz-n">${i + 1}</div>
    <div class="cz-flow">
      <div class="cz-col symptoms"><span class="cz-k">Симптомы (что видно)</span>${n.symptoms.length ? `<ul>${n.symptoms.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '<p>—</p>'}</div>
      <div class="cz-arrow">→</div>
      <div class="cz-col cause"><span class="cz-k">Корневая причина</span><b>${esc(n.rootCause)}</b>${n.evidence.length ? `<span class="cz-ev">Доказательство: ${esc(n.evidence.join('; '))}</span>` : ''}${n.findingIds?.length ? `<span class="cz-ev">Находки реестра: ${esc(n.findingIds.join(', '))}</span>` : ''}</div>
      <div class="cz-arrow">→</div>
      <div class="cz-col money"><span class="cz-k">Деньги</span>${esc(n.moneyLink)}</div>
    </div>
  </div>`).join('');
  const body = `<section class="block"><h2>Симптом → корневая причина → деньги</h2>
    <p class="lead">Работаем с причиной, а не с симптомом: один дефект даёт находки во многих местах, а чинится один раз. Деньги — один раз на узел, без двойного счёта.</p>
    ${c.nodes.length ? nodes : '<p class="lead">Причинных узлов не выделено на текущих данных.</p>'}
    <div class="concl warn" style="margin-top:10px"><b>Экономика.</b> ${esc(c.moneyNote)}</div></section>`;
  const extra = `.cz{display:flex;gap:8px;margin:10px 0;page-break-inside:avoid;}
    .cz-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
    .cz-flow{flex:1;display:grid;grid-template-columns:1fr auto 1.2fr auto 1fr;gap:6px;align-items:stretch;}
    .cz-col{border:1px solid var(--line);border-radius:6px;padding:7px 9px;font-size:9.5px;background:var(--soft);}
    .cz-col.cause{border-color:var(--gap);background:#fff5f5;} .cz-col.cause b{display:block;font-size:10.5px;}
    .cz-col.money{border-color:var(--check);}
    .cz-k{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);font-weight:700;margin-bottom:3px;}
    .cz-ev{display:block;margin-top:4px;font-size:8px;color:var(--muted);}
    .cz-arrow{align-self:center;color:var(--muted);font-size:13px;font-weight:700;}
    .cz-col ul{margin:0;padding-left:14px;} .cz-col li{margin:1px 0;}`;
  const totalSymptoms = c.nodes.reduce((n, x) => n + x.symptoms.length, 0);
  const conclCz = conclusionSection([
    c.nodes.length
      ? `${totalSymptoms} наблюдаемых симптомов сводятся к ${c.nodes.length} корневым причинам. Это главный экономический аргумент карты: чинить нужно ${c.nodes.length} причин, а не ${totalSymptoms} симптомов — иначе бюджет уходит на косметику, а дефекты возвращаются.`
      : 'Причинных узлов на текущих данных не выделено — либо симптомов недостаточно, либо они не группируются в системные причины.',
    `Деньги привязываются к узлу один раз — без двойного счёта, когда один и тот же недополученный оборот «продаётся» в трёх разных разделах отчёта. ${c.moneyNote}`,
    'Карта — мост между аудитом и программой: каждый плейбук в scope адресует конкретный узел этой карты, и наоборот — узел без плейбука означает осознанно принятый риск.',
  ], 'Сверить узлы карты со scope по волнам: каждая корневая причина должна иметь адресующую её активацию либо явную пометку «принятый риск».');
  return doc(`Причинно-следственная карта · ${client}`, head('Commerce OS · Причинно-следственная карта · внешний аудит витрины', `${c.nodes.length} корневых причин объясняют наблюдаемые симптомы`, client, date, [['Узлов', String(c.nodes.length)]], undefined, 'Карта связывает разрозненные симптомы с корневыми причинами: плейбук адресует причину; симптом без причины в roadmap не попадает.') + body + conclCz + foot('Причинно-следственная карта', client, date), extra);
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
  const conclSy = conclusionSection([
    `Синтез связал линзы аудита в единую картину: ${s.crossLinks.length} компаундных связок (где два дефекта усиливают друг друга), ${s.rootCauses.length} корневых причин, ${s.priorities.length} сквозных приоритетов. Ценность этого слоя — не новые находки, а порядок: он отвечает на вопрос «с чего начать», который отдельные аудиты по определению решить не могут.`,
    s.crossLinks.length
      ? 'Компаундные связки — самое дорогое в списке: там потери перемножаются, а не складываются, поэтому починка одной стороны связки без другой возвращает лишь часть эффекта.'
      : 'Компаундных связок не выявлено — дефекты независимы, их можно закрывать параллельно.',
    `Итог одним предложением: ${s.oneLine}`,
  ], 'Использовать сквозные приоритеты как порядок волны 1; после каждого внедрения синтез пересобирается по новым данным.');
  const body = cross + roots + prio;
  const extra = `.sy-eff{color:#333;} .sy-n{color:var(--muted);width:16px;} .sy-t{white-space:nowrap;} .sy-w{color:#333;}`;
  return doc(`Синтез аудита · ${client}`, head('Commerce OS · Синтез аудита · внешний аудит витрины', s.headline, client, date, [['Приоритетов', String(s.priorities.length)]], undefined, 'Синтез сводит находки всех линз без двойного счёта: снимает пересечения, поднимает корневые причины, ранжирует по остаточному вкладу.') + body + conclSy + foot('Синтез аудита', client, date), extra);
}
