/**
 * UX/UI-аудит вітрини — клієнтський PDF на спільному візуальному стандарті.
 * Один документ: (1) аркуш «Підсумок» з підсумковим балом і трьома лічильниками
 * блоків, (2) дерево сайту + карта типів сторінок, (3) постадійний розбір кожної
 * сторінки блок-за-блоком порівняно з еталоном, (4) загальні висновки.
 * Заголовок = назва документа; вивід — окремим рядком. Статусні кольори лише для
 * severity; скріншот першого екрана зі стрілками-анотаціями. Рендериться в PDF
 * уже встановленим Chromium (pdf.ts).
 */
import type { SiteAuditReport, PageReport, BlockRow, BlockState } from '../pagereport.js';
import type { Dim } from '../pagereport.js';
import {
  esc, dimBadges, scoreColor, doc, cover, pageFooter,
  methodologySection, swSection, recsSection, conclusionSection, type SectionRec,
} from './reportShell.js';
import { svgDonut } from './charts.js';
import { blockCard, WIREFRAME_CSS } from './wireframes.js';
import { buildUxFlow, type UxFlowReport } from '../uxflow.js';
import type { UxUiReport, Severity } from '../uxui.js';

const STATE_MARK: Record<BlockState, string> = { ok: '✓', weak: '◑', check: '◐', gap: '✕' };
const STATE_CLS: Record<BlockState, string> = { ok: 'ok', weak: 'weak', check: 'check', gap: 'gap' };
const WEIGHT_LABEL: Record<BlockRow['weight'], string> = { core: 'ядро', important: 'важливо', nice: 'опц.' };

/** Статус типу сторінки з обходу (модельні рядки — рос.) → україномовне відображення. */
const PT_STATUS: Record<string, { label: string; cls: string; mark: string }> = {
  'разобрана': { label: 'розібрана', cls: 'ok', mark: '✓' },
  'найдена': { label: 'знайдена', cls: 'check', mark: '◐' },
  'не найдена': { label: 'не знайдена', cls: 'gap', mark: '✕' },
};
const ptStatus = (s: string) => PT_STATUS[s] ?? { label: esc(s) || '—', cls: '', mark: '○' };

/** Агрегати станів еталонних блоків по всій вітрині — база трьох лічильників «Підсумку». */
function countStates(r: SiteAuditReport): { ok: number; weak: number; check: number; gap: number } {
  const all = r.pages.flatMap((p) => p.rows);
  return {
    ok: all.filter((b) => b.state === 'ok').length,
    weak: all.filter((b) => b.state === 'weak').length,
    check: all.filter((b) => b.state === 'check').length,
    gap: all.filter((b) => b.state === 'gap').length,
  };
}

/** Аркуш «Підсумок»: бал X / Y, вивід одним рядком і три лічильники станів блоків. */
function summarySheet(r: SiteAuditReport): string {
  const c = countStates(r);
  const donut = (c.ok + c.weak + c.check + c.gap) ? `<div class="chart-wrap">${svgDonut([
    { label: 'За еталоном', value: c.ok, color: '#16a34a' },
    { label: 'Є, але слабко', value: c.weak, color: '#ea580c' },
    { label: 'Приховано/перевірити', value: c.check, color: '#d97706' },
    { label: 'Відсутні', value: c.gap, color: '#dc2626' },
  ].filter((x) => x.value > 0), { title: 'Еталонні блоки по всій вітрині', centerLabel: `${r.totalPct}%` })}
    <p class="chart-cap">Скільки блоків еталонної композиції зроблено за еталоном, присутні але слабко (наявність ≠ правильно), приховані або відсутні — сумарно за всіма розібраними сторінками.</p></div>` : '';
  return `<section class="block">
    <h2>Підсумок</h2>
    <div class="sum">
      <div class="sum-score">
        <div class="sum-big ${scoreColor(r.totalPct)}">${r.totalScore} / ${r.totalMax}</div>
        <div class="sum-cap">відповідність еталонній композиції · ${r.totalPct}%</div>
      </div>
      <p class="sum-verdict">${esc(r.verdict)}</p>
    </div>
    <div class="sum-tiles four">
      <div class="sum-tile ok"><b>${c.ok}</b><span class="sum-t">За еталоном</span><span class="sum-s">Блок є і зроблений як має бути</span></div>
      <div class="sum-tile weak"><b>${c.weak}</b><span class="sum-t">Є, але слабко</span><span class="sum-s">Наявність ≠ правильно: блок є, але провалює еталон</span></div>
      <div class="sum-tile check"><b>${c.check}</b><span class="sum-t">Приховано</span><span class="sum-s">Не підтверджено обходом (таб/JS) — перевірити</span></div>
      <div class="sum-tile gap"><b>${c.gap}</b><span class="sum-t">Відсутні</span><span class="sum-s">Блоки, яких немає взагалі</span></div>
    </div>
    ${donut}
  </section>`;
}

/** Дерево сайту: постраничная оцінка відповідності еталону. */
function treeSection(r: SiteAuditReport): string {
  const rows = r.tree.map((t) => {
    const cls = scoreColor(t.pct);
    return `<tr>
      <td class="tree-name">${esc(t.title)}</td>
      <td class="tree-url">${esc(t.url.replace(/^https?:\/\//, ''))}</td>
      <td class="tree-bar"><span class="bar"><i class="fill ${cls}" style="width:${t.pct}%"></i></span></td>
      <td class="tree-pct ${cls}">${t.pct}%</td>
    </tr>`;
  }).join('');
  return `<section class="block">
    <h2>Дерево сайту: де рветься шлях клієнта</h2>
    <p class="lead">Постадійна оцінка відповідності еталонній композиції (частка виконаних блоків еталона). Колір — severity, не прикраса. Розбивка за балами блоків — у картці кожної сторінки нижче.</p>
    <table><thead><tr><th>Тип сторінки</th><th>URL</th><th>Відповідність еталону</th><th>Бал, %</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="3">Разом за розібраними сторінками (${r.totalScore}/${r.totalMax} блоків)</td><td class="${scoreColor(r.totalPct)}">${r.totalPct}%</td></tr></tfoot>
    </table>
  </section>`;
}

/** Карта унікальних типів сторінок: обов'язкові й змінні. */
function pageTypesSection(r: SiteAuditReport): string {
  if (!r.pageTypes.length) return '';
  const row = (t: SiteAuditReport['pageTypes'][number]) => {
    const st = ptStatus(t.status);
    return `<tr>
      <td class="pt-name">${esc(t.label)}</td>
      <td class="pt-st ${st.cls}">${st.mark} ${st.label}</td>
      <td class="pt-url">${t.url ? esc(t.url.replace(/^https?:\/\//, '')) : '—'}</td>
    </tr>`;
  };
  const mand = r.pageTypes.filter((t) => t.mandatory);
  const varr = r.pageTypes.filter((t) => !t.mandatory);
  const missing = mand.filter((t) => t.status === 'не найдена').length;
  return `<section class="block"><h2>Карта унікальних сторінок: обов'язкові та змінні</h2>
    <p class="lead">Правило: карта будується з sitemap + посилань обходу + активної проби стандартних адрес; розбирається представник кожного типу. ${missing ? `<b class="gap">Не знайдено обов'язкових сторінок: ${missing}</b> — це знахідки аудиту.` : "Усі обов'язкові сторінки знайдено."}${r.soft404 === true ? ' <b class="gap">Неіснуючі URL віддають 200 («м\'яка 404»).</b>' : ''}</p>
    <div class="pt-grid">
      <div><h3>Обов'язкові (мають бути завжди)</h3><table><thead><tr><th>Сторінка</th><th>Статус</th><th>URL</th></tr></thead><tbody>${mand.map(row).join('')}</tbody></table></div>
      <div><h3>Змінні (за моделлю бізнесу)</h3><table><thead><tr><th>Сторінка</th><th>Статус</th><th>URL</th></tr></thead><tbody>${varr.map(row).join('')}</tbody></table></div>
    </div></section>`;
}

/** Лобове порівняння: еталонна композиція сторінки стеком блоків. */
function etalonStack(p: PageReport): string {
  const items = p.rows.map((b, i) => `<div class="et-b ${STATE_CLS[b.state]}"><i>${String(i + 1).padStart(2, '0')}</i>${esc(b.name)}<s>${STATE_MARK[b.state]}</s></div>`).join('');
  return `<div class="etalon"><div class="et-h">Еталонна композиція ↔ сайт</div>${items}
    <div class="et-cap">Порядок блоків — еталонний. Зелене — за еталоном, помаранчеве — є, але слабко (наявність ≠ правильно), жовте — приховано/перевірити, червоне — блока немає.</div></div>`;
}

function pageSection(p: PageReport): string {
  const blockRows = p.rows.map((b: BlockRow, i: number) => `<tr class="row-${STATE_CLS[b.state]}">
    <td class="b-name"><span class="b-num">${String(i + 1).padStart(2, '0')}</span>${esc(b.name)}<span class="b-weight ${b.weight}">${WEIGHT_LABEL[b.weight]}</span><span class="b-dims">${dimBadges(b.dims as Dim[])}</span></td>
    <td class="b-now"><span class="st ${STATE_CLS[b.state]}">${STATE_MARK[b.state]}</span> ${esc(b.now)}</td>
    <td class="b-should">${esc(b.should)}</td>
    <td class="b-score ${STATE_CLS[b.state]}">${b.score}/${b.max}<span class="b-word">${esc(b.wordVerdict)}</span></td>
  </tr>`).join('');
  const pct = p.max ? Math.round((p.score / p.max) * 100) : 0;
  const anns = (p.annotations ?? []).map((a, i) => `<span class="ann ${a.tone}" style="left:${(a.x / 1366 * 100).toFixed(1)}%;top:${(a.y / 900 * 100).toFixed(1)}%;width:${(a.w / 1366 * 100).toFixed(1)}%;height:${(a.h / 900 * 100).toFixed(1)}%"><b>${i + 1}</b></span>`).join('');
  const annLegend = (p.annotations ?? []).length ? `<div class="ann-legend">${p.annotations.map((a, i) => `<span class="lg ${a.tone}">${i + 1} ${esc(a.label)}</span>`).join('')}</div>` : '';
  const shot = p.screenshot
    ? `<figure class="shot"><div class="shot-wrap"><img src="data:image/jpeg;base64,${p.screenshot}" alt="Перший екран ${esc(p.title)}"/>${anns}</div><figcaption>Поточний перший екран · ${esc(p.url.replace(/^https?:\/\//, ''))}</figcaption>${annLegend}</figure>`
    : `<div class="shot noshot">Скріншот першого екрана недоступний (обхід без скріншотів)</div>`;
  const strong = p.strong.length ? `<div class="strong"><b>Зроблено сильно:</b> ${p.strong.map(esc).join(' · ')}</div>` : '';
  const fixes = p.fixes.length ? `<div class="fixes"><h3>Пріоритет доробок</h3><table class="fix-table"><tbody>${
    p.fixes.slice(0, 6).map((f, i) => `<tr><td class="fx-n">${i + 1}</td><td class="fx-what">${esc(f.what)}</td><td class="fx-crit ${f.crit === 'Блокирующая' ? 'gap' : f.crit === 'Высокая' ? 'check' : ''}">${esc(f.crit === 'Блокирующая' ? 'Блокувальна' : f.crit === 'Высокая' ? 'Висока' : 'Середня')}</td><td class="fx-why">${esc(f.why)}</td></tr>`).join('')
  }</tbody></table></div>` : '';
  return `<section class="block page">
    <div class="page-head">
      <div class="page-kicker">UX/UI · ${esc(p.title)} · звірка з еталоном</div>
      <h2>${esc(p.conclusion)}</h2>
      ${p.principle ? `<p class="principle">Принцип еталона: ${esc(p.principle)}</p>` : ''}
    </div>
    <div class="page-grid">
      <div class="page-left">${shot}</div>
      <div class="page-right">
        <div class="counts">
          <span class="cnt ok"><b>${p.counts.ok}</b> за еталоном</span>
          <span class="cnt weak"><b>${p.counts.weak}</b> є, але слабко</span>
          <span class="cnt check"><b>${p.counts.check}</b> приховано</span>
          <span class="cnt gap"><b>${p.counts.gap}</b> відсутні</span>
          <span class="cnt total"><b>${p.score}/${p.max}</b> · ${pct}%</span>
        </div>
        ${strong}
      </div>
      <div class="page-et">${etalonStack(p)}</div>
    </div>
    <table class="block-table"><thead><tr><th>Блок еталона</th><th>Що на сайті зараз</th><th>Що має бути</th><th>Оцінка</th></tr></thead><tbody>${blockRows}</tbody></table>
    <div class="wf-detail">
      <h3 class="wf-h">Поблочно: яким блок має бути</h3>
      <p class="wf-lead">Вище — чи є блок. Тут — <b>яким він має бути</b>, щоб бал сторінки був максимальним. Ліворуч (де показано) — що зараз, праворуч — еталон. Блок, якого немає, показано таким, яким мав би бути.</p>
      ${p.rows.map((b, i) => blockCard(b, i)).join('')}
    </div>
    ${fixes}
  </section>`;
}

/** «На чём это сделано»: вердикт платформы/шаблона — то, что живой дизайнер видит за 10 секунд. */
function platformSection(r: SiteAuditReport): string {
  const s = r.stack;
  if (!s || (!s.cms && !s.theme && !s.builder)) return '';
  const chip = (label: string, val: string | null, tone = '') => val ? `<div class="stk ${tone}"><span>${esc(label)}</span><b>${esc(val)}</b></div>` : '';
  const tmpl = s.commercialTemplate ? 'готовий комерційний шаблон' : s.theme ? 'готова тема' : '—';
  const sigs = (s.signals ?? []).map((x) => `<li>${esc(x)}</li>`).join('');
  return `<section class="block">
    <h2>На чому це зроблено: платформа і шаблон</h2>
    <p class="lead">Перший вимір, який ставить дизайнер: це власна дизайн-система чи куплений шаблон на готовому движку. Знято з розмітки, скриптів і класів головної.</p>
    <div class="stk-row">
      ${chip('CMS / рушій', s.cms ? s.cms + (s.cmsVersion ? ` ${s.cmsVersion}` : '') : null, s.cmsVersion ? 'warn' : '')}
      ${chip('Тема', s.templateName ?? s.theme, s.commercialTemplate ? 'warn' : '')}
      ${chip('Тип', tmpl, s.commercialTemplate ? 'warn' : '')}
      ${chip('Білдер', s.builder, s.builder && /Elementor|WPBakery|Divi|Avada/.test(s.builder) ? 'warn' : '')}
      ${chip('Плагінів у стеку', s.plugins.length ? String(s.plugins.length) : null, s.plugins.length >= 10 ? 'warn' : '')}
    </div>
    ${sigs ? `<div class="stk-sig"><b>Що це означає:</b><ul>${sigs}</ul></div>` : ''}
  </section>`;
}

/** Дизайн-вердикт со зрением: senior design director посмотрел на страницы. */
function designSection(r: SiteAuditReport): string {
  const d = r.design;
  if (!d) return '';
  const scoreCls = d.overallScore >= 7 ? 'ok' : d.overallScore >= 5 ? 'check' : 'gap';
  const axes = (d.axes ?? []).map((a) => {
    const cls = a.score >= 7 ? 'ok' : a.score >= 5 ? 'check' : 'gap';
    return `<tr><td class="ax-n">${esc(a.name)}</td>
      <td class="ax-bar"><span class="bar"><i class="fill ${cls}" style="width:${Math.round((a.score / 10) * 100)}%"></i></span></td>
      <td class="ax-s ${cls}">${a.score}/10</td><td class="ax-note">${esc(a.note)}</td></tr>`;
  }).join('');
  const tells = (d.templateTells ?? []).map((x) => `<li>${esc(x)}</li>`).join('');
  const refs = (d.references ?? []).map((x) => `<li>${esc(x)}</li>`).join('');
  // Бренд-система (openbrand-класс): реальные свотчи палитры + гарнитуры.
  const b = r.stack?.brand;
  const brandStrip = b && (b.palette.length || b.headingFont) ? `<div class="brand-strip">
    <span class="bs-label">Бренд-система вітрини:</span>
    ${b.palette.map((c) => `<span class="sw" style="background:${esc(c)}" title="${esc(c)}"></span>`).join('')}
    ${b.headingFont ? `<span class="bs-font">Aa <i>${esc(b.headingFont)}</i>${b.bodyFont && b.bodyFont !== b.headingFont ? ` / ${esc(b.bodyFont)}` : ''}</span>` : ''}
    ${b.fontFamilies > 3 ? `<span class="bs-warn">${b.fontFamilies} гарнітур</span>` : ''}
    ${!b.logo ? '<span class="bs-warn">лого не знайдено</span>' : ''}
  </div>` : '';
  return `<section class="block">
    <h2>Дизайн-вердикт: дорого чи дешево</h2>
    <p class="lead">Оцінка ${d.source === 'зір' ? 'зі зором (дизайн-директор подивився на перші екрани)' : 'детермінована (без зору — з відбитка стека й замірів обходу)'}. Стек: ${esc(d.stackLine)}.</p>
    ${brandStrip}
    <div class="dz-head">
      <div class="dz-score ${scoreCls}"><b>${d.overallScore}</b><span>/10</span></div>
      <div class="dz-verdict"><div class="dz-tier">${esc(d.tier)}</div><p>${esc(d.verdict)}</p></div>
    </div>
    ${axes ? `<table class="ax-table"><thead><tr><th>Вісь дизайну</th><th>Рівень</th><th>Бал</th><th>Що саме</th></tr></thead><tbody>${axes}</tbody></table>` : ''}
    <div class="dz-grid">
      ${tells ? `<div><h3 class="gap">Улики шаблонності / датованості</h3><ul class="dz-list">${tells}</ul></div>` : ''}
      ${refs ? `<div><h3>Як має виглядати «дорого»</h3><ul class="dz-list">${refs}</ul></div>` : ''}
    </div>
  </section>`;
}

function systemicSection(r: SiteAuditReport): string {
  if (!r.systemic.length) return '';
  const items = r.systemic.map((s) => `<li><b>${esc(s.title)}.</b> ${esc(s.detail)} <span class="s-dims">${dimBadges(s.dims)}</span></li>`).join('');
  return `<section class="block">
    <h2>Системні дефекти: живуть у шаблоні, а не на сторінці</h2>
    <p class="lead">Проявляються на всіх розібраних сторінках — правляться один раз, ефект на всьому сайті.</p>
    <ul class="sys-list">${items}</ul>
  </section>`;
}

/** Консалтингові секції: методологія, сильні/слабкі сторони, рекомендації, підсумок. */
function consultSections(r: SiteAuditReport): { meth: string; sw: string; recs: string; concl: string } {
  const cov = r.tree.length;
  const meth = methodologySection({
    goal: 'Постадійно звірити вітрину з еталонною композицією: які вирішальні блоки є, які втрачено і що це означає для шляху клієнта.',
    sources: [`Зовнішній обхід: ${cov} сторінок, скріншоти першого екрана, відрендерений DOM`, 'Еталонні прототипи за типами сторінок', "Карта унікальних сторінок: sitemap + обхід + активна проба адрес"],
    scope: 'Кожна розібрана сторінка блок за блоком (ядро / важливо / опційно) + системні дефекти шаблонів.',
    limits: '«Не виявлено» ≠ «відсутнє»: приховані таби / JS позначено «частково». Вплив на конверсію в грошах стверджується лише після підключення аналітики та рекламних кабінетів.',
  });

  const goodPages = r.pages.filter((p) => p.max && (p.score / p.max) >= 0.7);
  const badPages = r.pages.filter((p) => p.max && (p.score / p.max) < 0.45);
  const strongBits = Array.from(new Set(r.pages.flatMap((p) => p.strong))).slice(0, 4);
  const missingMand = r.pageTypes.filter((t) => t.mandatory && t.status === 'не найдена');
  const strengths = [
    ...goodPages.slice(0, 3).map((p) => `${p.title}: ${Math.round((p.score / p.max) * 100)}% відповідності еталону — композиція сторінки працює на рішення`),
    ...(strongBits.length ? [`Сильні елементи вітрини: ${strongBits.join('; ')}`] : []),
    ...(r.systemic.length === 0 ? ['Системних дефектів шаблонів не виявлено — проблеми точкові, а не успадковані'] : []),
  ];
  const weaknesses = [
    ...badPages.slice(0, 3).map((p) => `${p.title}: ${Math.round((p.score / p.max) * 100)}% — сторінка втрачає ядрові блоки еталона`),
    ...r.systemic.slice(0, 4).map((s) => `${s.title} — дефект шаблона, тиражується на всі сторінки`),
    ...(missingMand.length ? [`Не знайдено обов'язкові сторінки: ${missingMand.map((t) => t.label).join(', ')}`] : []),
    ...(r.soft404 === true ? ["«М'яка 404»: неіснуючі URL віддають 200 — сміття в індексі та хибні проби"] : []),
  ];

  const critRank: Record<string, 'P0' | 'P1' | 'P2'> = { 'Блокирующая': 'P0', 'Высокая': 'P1' };
  const seen = new Set<string>();
  const recsList: SectionRec[] = [];
  for (const p of r.pages) for (const f of p.fixes) {
    if (seen.has(f.what) || recsList.length >= 8) continue;
    seen.add(f.what);
    recsList.push({ pr: critRank[f.crit] ?? 'P2', action: `${p.title}: ${f.what}`, effect: f.why });
  }

  const worst = [...r.pages].filter((p) => p.max).sort((a, b) => a.score / a.max - b.score / b.max)[0];
  const gapsOfWorst = worst ? worst.rows.filter((b) => b.state === 'gap' && b.weight === 'core').map((b) => b.name).slice(0, 4) : [];
  const concl = conclusionSection([
    `Відповідність вітрини еталону — ${r.totalPct}% (${r.totalScore}/${r.totalMax} за ${cov} типами сторінок). ${r.totalPct >= 70 ? 'Композиція загалом зібрана: шлях клієнта не рветься на рівні структури, резерв — у якості виконання блоків.' : r.totalPct >= 45 ? 'Каркас є, але на шляху клієнта є сторінки, де еталонну логіку «побачив → повірив → купив» порушено — саме там втрачається конверсія.' : 'Композиція вітрини суттєво розходиться з еталоном: клієнт змушений додумувати за сайт, і це прямі втрати на кожному кроці воронки.'}`,
    worst
      ? `Найслабша ланка — ${worst.title} (${Math.round((worst.score / worst.max) * 100)}%)${gapsOfWorst.length ? `: відсутні ядрові блоки ${gapsOfWorst.join(', ')}` : ''}. ${r.systemic.length ? `Плюс ${r.systemic.length} системних дефектів рівня шаблона — вони правляться один раз і дають ефект на всьому сайті, тож стоять першими в черзі.` : 'Системних дефектів рівня шаблона немає — робота постадійна.'}`
      : 'Сторінки для порівняння не розібрані — висновок за композицією неможливий.',
    `${r.warning ? `Обмеження покриття: ${r.warning} ` : ''}Оцінки цього шару — спостереження за зовнішнім обходом; блоки зі статусом «частково» можуть існувати у прихованих станах. Підтвердження впливу на виторг — після підключення аналітики та рекламних кабінетів (аналітика, записи сесій).`,
  ], 'Записи сесій і воронка GA4 по слабких сторінках → підтверджені точки втрат → дизайн-спринт за пріоритетами з цього звіту.');

  return { meth, sw: swSection(strengths, weaknesses), recs: recsSection(recsList), concl };
}

const EXTRA_CSS = `
  :root{--weak:#ea580c;} /* «є, але слабко»: наявність ≠ правильно — окремий колір, не як «приховано» */
  ${WIREFRAME_CSS}
  .wf-detail{margin-top:12px;} .wf-h{font-size:12px;margin:0 0 3px;} .wf-lead{font-size:9.5px;color:#444;margin:0 0 8px;line-height:1.4;}
  /* аркуш «Підсумок» */
  .sum{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;margin:4px 0 10px;}
  .sum-big{font-size:34px;font-weight:800;line-height:1;letter-spacing:-1px;white-space:nowrap;}
  .sum-cap{color:var(--muted);font-size:10px;margin-top:4px;}
  .sum-verdict{font-size:12.5px;line-height:1.4;font-weight:600;color:var(--ink);margin:0;flex:1;min-width:60mm;max-width:130mm;}
  .sum-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 4px;}
  .sum-tiles.four{grid-template-columns:repeat(4,1fr);}
  .sum-tile{border:1px solid var(--line);border-top-width:3px;border-radius:6px;padding:9px 11px;}
  .sum-tile.ok{border-top-color:var(--ok);} .sum-tile.weak{border-top-color:var(--weak);} .sum-tile.check{border-top-color:var(--check);} .sum-tile.gap{border-top-color:var(--gap);}
  .sum-tile b{display:block;font-size:24px;font-weight:800;line-height:1;}
  .sum-tile.ok b{color:var(--ok);} .sum-tile.weak b{color:var(--weak);} .sum-tile.check b{color:var(--check);} .sum-tile.gap b{color:var(--gap);}
  .sum-t{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin:5px 0 2px;}
  .sum-s{display:block;font-size:8.5px;color:var(--muted);line-height:1.3;}
  /* дерево + карта типів */
  .tree-name{font-weight:700;} .tree-url{color:var(--muted);font-size:9px;}
  .tree-pct{font-weight:800;text-align:right;white-space:nowrap;}
  tfoot td{border-top:2px solid var(--ink);font-weight:800;padding-top:7px;}
  .pt-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;}
  .pt-name{font-weight:600;font-size:9.5px;} .pt-st{white-space:nowrap;font-size:9px;font-weight:600;} .pt-url{color:var(--muted);font-size:8.5px;word-break:break-all;}
  /* картка сторінки */
  .page-head h2{margin-top:2px;} .principle{color:var(--muted);font-style:italic;margin:3px 0 10px;font-size:10px;}
  .page-grid{display:grid;grid-template-columns:60mm 1fr 44mm;gap:12px;align-items:start;margin-bottom:8px;}
  .shot img{width:100%;border:1px solid var(--line);border-radius:4px;display:block;}
  .shot figcaption{color:var(--muted);font-size:8.5px;margin-top:4px;}
  .shot-wrap{position:relative;line-height:0;}
  .ann{position:absolute;border:2px solid var(--ok);border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.5);}
  .ann.warn{border-color:var(--gap);} .ann b{position:absolute;top:-9px;left:-9px;width:15px;height:15px;border-radius:50%;background:var(--ok);color:#fff;font-size:9px;line-height:15px;text-align:center;font-weight:800;}
  .ann.warn b{background:var(--gap);}
  .ann-legend{margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;}
  .ann-legend .lg{font-size:8px;padding:1px 5px;border-radius:10px;background:var(--soft);border:1px solid var(--line);}
  .ann-legend .lg.warn{color:var(--gap);}
  .noshot{border:1px dashed var(--line);border-radius:4px;padding:24px 10px;text-align:center;color:var(--muted);font-size:9px;}
  .counts{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px;}
  .cnt{font-size:9px;padding:3px 7px;border-radius:20px;background:var(--soft);border:1px solid var(--line);}
  .cnt b{font-size:11px;} .cnt.ok b{color:var(--ok);} .cnt.weak b{color:var(--weak);} .cnt.check b{color:var(--check);} .cnt.gap b{color:var(--gap);} .cnt.total{background:var(--ink);color:#fff;border-color:var(--ink);}
  .strong{font-size:9.5px;color:#333;}
  /* лобове порівняння з еталоном */
  .etalon{border:1px solid var(--line);border-radius:6px;padding:8px 9px;background:var(--soft);}
  .et-h{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin-bottom:6px;}
  .et-b{position:relative;font-size:8.5px;font-weight:600;border:1px solid var(--line);border-left:3px solid var(--line);border-radius:4px;background:#fff;padding:4px 18px 4px 6px;margin:3px 0;color:#222;}
  .et-b i{font-style:normal;color:var(--muted);font-weight:700;margin-right:4px;font-size:7.5px;}
  .et-b s{position:absolute;right:5px;top:4px;text-decoration:none;font-size:9px;}
  .et-b.ok{border-left-color:var(--ok);} .et-b.ok s{color:var(--ok);}
  .et-b.weak{border-left-color:var(--weak);background:#fff6f0;} .et-b.weak s{color:var(--weak);}
  .et-b.check{border-left-color:var(--check);background:#fffaf2;} .et-b.check s{color:var(--check);}
  .et-b.gap{border-left-color:var(--gap);background:#fff5f5;color:var(--gap);} .et-b.gap s{color:var(--gap);}
  .et-cap{font-size:7.5px;color:var(--muted);margin-top:5px;line-height:1.35;}
  /* таблиця блоків */
  .block-table{margin-top:2px;}
  .b-name{font-weight:700;width:112px;font-size:10px;} .b-num{display:inline-block;color:var(--lime);font-weight:800;margin-right:4px;}
  .b-weight{display:block;font-size:7.5px;font-weight:600;color:var(--muted);text-transform:uppercase;}
  .b-weight.core{color:var(--ink);} .b-dims{display:block;margin-top:2px;}
  .b-now{font-size:9.5px;color:#222;width:132px;} .b-should{font-size:9px;color:#444;}
  .b-score{font-weight:800;white-space:nowrap;text-align:center;} .b-word{display:block;font-weight:600;font-size:8px;}
  .st{font-size:11px;line-height:1;} .st.ok{color:var(--ok);} .st.weak{color:var(--weak);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}
  .b-score.weak{color:var(--weak);}
  .row-weak .b-name{color:var(--weak);} .row-weak .b-now{color:#9a3412;}
  .row-gap .b-name{color:var(--gap);} .row-gap .b-now{color:var(--gap);}
  /* пріоритет доробок */
  .fixes{margin-top:12px;} .fix-table td{padding:4px 6px;border-bottom:1px solid var(--line);font-size:10px;vertical-align:top;}
  .fx-n{color:var(--muted);width:16px;} .fx-what{font-weight:700;} .fx-crit{font-weight:700;white-space:nowrap;} .fx-why{color:#333;}
  /* системні дефекти */
  .sys-list{margin:6px 0 0;padding-left:18px;} .sys-list li{margin:5px 0;} .s-dims{margin-left:4px;}
  /* платформа / шаблон */
  .stk-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;}
  .stk{border:1px solid var(--line);border-radius:6px;padding:6px 10px;min-width:70px;}
  .stk span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);}
  .stk b{font-size:12px;font-weight:800;} .stk.warn{border-color:var(--weak);border-left:3px solid var(--weak);} .stk.warn b{color:var(--weak);}
  .stk-sig{font-size:10px;margin-top:6px;} .stk-sig ul{margin:4px 0 0;padding-left:18px;} .stk-sig li{margin:3px 0;color:#333;}
  /* дизайн-вердикт */
  .dz-head{display:flex;gap:14px;align-items:stretch;margin:8px 0 10px;}
  .dz-score{border:1px solid var(--line);border-radius:8px;padding:10px 16px;text-align:center;display:flex;flex-direction:column;justify-content:center;min-width:64px;}
  .dz-score b{font-size:34px;font-weight:800;line-height:1;} .dz-score span{font-size:10px;color:var(--muted);}
  .dz-score.ok b{color:var(--ok);} .dz-score.ok{border-color:var(--ok);} .dz-score.check b{color:var(--check);} .dz-score.check{border-color:var(--check);} .dz-score.gap b{color:var(--gap);} .dz-score.gap{border-color:var(--gap);border-left-width:3px;}
  .dz-tier{font-size:12px;font-weight:800;margin-bottom:3px;} .dz-verdict p{font-size:11px;line-height:1.45;margin:0;color:#222;}
  .ax-table{margin:4px 0 8px;} .ax-n{font-weight:700;width:120px;font-size:10px;} .ax-bar{width:120px;}
  .ax-s{font-weight:800;text-align:right;white-space:nowrap;} .ax-note{font-size:9.5px;color:#444;}
  .dz-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;margin-top:6px;}
  .dz-grid h3{font-size:10px;text-transform:uppercase;letter-spacing:.4px;margin:0 0 4px;} .dz-grid h3.gap{color:var(--gap);}
  .dz-list{margin:0;padding-left:16px;} .dz-list li{margin:4px 0;font-size:10px;line-height:1.4;color:#333;}
  /* бренд-стрип: свотчи палитры + гарнитуры */
  .brand-strip{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:2px 0 10px;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--soft);}
  .bs-label{font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;}
  .sw{width:20px;height:20px;border-radius:4px;border:1px solid rgba(0,0,0,.12);display:inline-block;}
  .bs-font{font-size:11px;color:#222;} .bs-font i{font-style:normal;color:var(--muted);}
  .bs-warn{font-size:8.5px;font-weight:700;color:var(--weak);border:1px solid var(--weak);border-radius:10px;padding:1px 6px;}
`;

const SEV_CLS: Record<Severity, string> = { Critical: 'gap', High: 'weak', Medium: 'check', Low: 'ok' };
const SEV_LABEL: Record<Severity, string> = { Critical: 'критично', High: 'високий', Medium: 'середній', Low: 'низький' };

/** Спайн методології: порядок аудиту A0→A4 і принцип «не змішуємо UX/UI/CRO». */
function flowSpineSection(flow: UxFlowReport): string {
  const steps = [
    ['A0', 'Підготовка й дані', 'Цілі бізнесу й сайту, ЦА, аналітика (GA4/CRM/heatmaps), конкуренти, доступи.'],
    ['A1', 'Структура (IA)', 'Дерево сайту, навігація, меню, пошук, фільтри, звʼязки сторінок.'],
    ['A2', 'UX', 'User Journey → сценарії → сторінки → форми → checkout → тертя.'],
    ['A3', 'UI', 'Візуальна ієрархія, типографіка, компоненти, адаптив, accessibility.'],
    ['A4', 'CRO і результат', 'Конверсія, довіра, заперечення → Impact/Effort → пріоритети → roadmap → ТЗ.'],
  ];
  const rows = steps.map(([id, t, d]) =>
    `<tr><td class="flow-id">${esc(id)}</td><td class="flow-step">${esc(t)}</td><td class="flow-desc">${esc(d)}</td></tr>`).join('');
  return `<section class="block">
    <h2>Порядок аудиту: послідовність, а не список зауважень</h2>
    <p class="lead">UX, UI і CRO дивимось <b>окремо й по порядку</b>. Поганий UI часто — лише візуальний прояв глибшої UX-проблеми, а UX-проблема — наслідок кривої бізнес- чи інформаційної архітектури. Тож спершу структура, потім досвід, потім візуал, і лише тоді конверсія.</p>
    <table class="flow-spine">${rows}</table>
    <p class="muted small">Нижче знахідки згруповані саме за цими шарами (${flow.totalFindings} шт.), кожна — у форматі <b>Проблема → Причина → Наслідок → Рекомендація → Очікуваний ефект</b>.</p>
  </section>`;
}

/** Знахідки за шарами (UX / UI / CRO окремо), кожна — послідовністю причинності. */
function flowFindingsSection(flow: UxFlowReport): string {
  if (!flow.layers.length) return '';
  const layers = flow.layers.map((L) => {
    const cards = L.findings.map((f) => `
      <div class="flow-find">
        <div class="flow-find-head">
          <span class="flow-badge ${SEV_CLS[f.severity]}">${SEV_LABEL[f.severity]}</span>
          <b>${esc(f.problem)}</b>
          <span class="flow-pages">${f.pages} стор.</span>
        </div>
        <dl class="flow-chain">
          <dt>Причина</dt><dd>${esc(f.cause)}</dd>
          <dt>Наслідок</dt><dd>${esc(f.consequence)}</dd>
          <dt>Рекомендація</dt><dd>${esc(f.recommendation)}</dd>
          <dt>Очікуваний ефект</dt><dd class="flow-eff">${esc(f.effect)}</dd>
        </dl>
      </div>`).join('');
    return `<div class="flow-layer">
      <h3 class="flow-layer-h">${esc(L.title)}</h3>
      <p class="flow-principle">${esc(L.principle)}</p>
      ${cards}
    </div>`;
  }).join('');
  return `<section class="block flow-block">
    <h2>Знахідки за шарами: UX → UI → CRO окремо</h2>
    ${layers}
  </section>`;
}

const FLOW_CSS = `
.flow-spine{width:100%;border-collapse:collapse;margin-top:8px;}
.flow-spine td{padding:7px 9px;border-bottom:1px solid var(--line);vertical-align:top;font-size:10.5px;}
.flow-id{font-weight:800;color:#2f4fd0;width:34px;white-space:nowrap;}
.flow-step{font-weight:700;width:150px;}
.flow-desc{color:var(--muted);}
.flow-layer{margin-top:14px;break-inside:avoid;}
.flow-layer-h{font-size:13px;margin:0 0 3px;}
.flow-principle{font-size:10px;color:var(--muted);margin:0 0 8px;font-style:italic;}
.flow-find{border:1px solid var(--line);border-radius:8px;padding:9px 11px;margin-bottom:7px;break-inside:avoid;}
.flow-find-head{display:flex;align-items:baseline;gap:8px;margin-bottom:6px;}
.flow-find-head b{font-size:11px;flex:1;}
.flow-badge{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:20px;color:#fff;white-space:nowrap;}
.flow-badge.gap{background:#dc2626;} .flow-badge.weak{background:#ea580c;} .flow-badge.check{background:#d97706;} .flow-badge.ok{background:#16a34a;}
.flow-pages{font-size:9px;color:var(--muted);white-space:nowrap;}
.flow-chain{display:grid;grid-template-columns:88px 1fr;gap:2px 10px;margin:0;font-size:10px;}
.flow-chain dt{color:var(--muted);font-weight:700;}
.flow-chain dd{margin:0;color:var(--ink);}
.flow-chain dd.flow-eff{color:#16a34a;font-weight:600;}
`;

export function renderAuditHtml(r: SiteAuditReport, uxui?: UxUiReport | null): string {
  const cov = r.tree.length;
  const cs = consultSections(r);
  const coverHtml = cover({
    kicker: 'UX/UI-аудит · порівняння з еталоном',
    title: 'UX/UI-аудит вітрини',
    verdict: r.verdict, // вивід — окремим рядком, а не гігантським заголовком
    metrics: [{ label: 'Клієнт', value: r.client }],
    score: { pct: r.totalPct, cap: `відповідність еталону · ${r.totalScore}/${r.totalMax} за ${cov} типами сторінок` },
    note: `${r.warning ? `<b class="gap">⚠ Пробіл покриття.</b> ${esc(r.warning)} ` : ''}<b>Що видно у зовнішньому аудиті:</b> сторінки звіряються блок-за-блоком з еталонною композицією за відрендереним DOM і скріншотами першого екрана. «Не виявлено» ≠ «відсутнє» — приховані блоки / JS / таби позначено «частково». Фактичний вплив на конверсію не стверджується без підключення аналітики.`,
  });

  const footer = pageFooter('Зовнішній обхід вітрини без доступів. Оцінки — спостереження за клієнтською частиною, а не факт за даними клієнта; відсутність даних не видається за факт і не приховується.');

  const flow = uxui ? buildUxFlow(uxui) : null;

  const body = coverHtml
    + summarySheet(r)
    + platformSection(r)
    + designSection(r)
    + cs.meth
    + (flow ? flowSpineSection(flow) : '')
    + treeSection(r)
    + pageTypesSection(r)
    + r.pages.map(pageSection).join('')
    + (flow ? flowFindingsSection(flow) : '')
    + systemicSection(r)
    + cs.sw
    + cs.recs
    + cs.concl
    + footer;

  return doc(`UX/UI-аудит · ${r.client}`, body, EXTRA_CSS + FLOW_CSS);
}
