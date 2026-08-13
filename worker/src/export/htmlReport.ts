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

const STATE_MARK: Record<BlockState, string> = { ok: '✓', check: '◐', gap: '✕' };
const STATE_CLS: Record<BlockState, string> = { ok: 'ok', check: 'check', gap: 'gap' };
const WEIGHT_LABEL: Record<BlockRow['weight'], string> = { core: 'ядро', important: 'важливо', nice: 'опц.' };

/** Статус типу сторінки з обходу (модельні рядки — рос.) → україномовне відображення. */
const PT_STATUS: Record<string, { label: string; cls: string; mark: string }> = {
  'разобрана': { label: 'розібрана', cls: 'ok', mark: '✓' },
  'найдена': { label: 'знайдена', cls: 'check', mark: '◐' },
  'не найдена': { label: 'не знайдена', cls: 'gap', mark: '✕' },
};
const ptStatus = (s: string) => PT_STATUS[s] ?? { label: esc(s) || '—', cls: '', mark: '○' };

/** Агрегати станів еталонних блоків по всій вітрині — база трьох лічильників «Підсумку». */
function countStates(r: SiteAuditReport): { ok: number; check: number; gap: number } {
  const all = r.pages.flatMap((p) => p.rows);
  return {
    ok: all.filter((b) => b.state === 'ok').length,
    check: all.filter((b) => b.state === 'check').length,
    gap: all.filter((b) => b.state === 'gap').length,
  };
}

/** Аркуш «Підсумок»: бал X / Y, вивід одним рядком і три лічильники станів блоків. */
function summarySheet(r: SiteAuditReport): string {
  const c = countStates(r);
  const donut = (c.ok + c.check + c.gap) ? `<div class="chart-wrap">${svgDonut([
    { label: 'Закрито повністю', value: c.ok, color: '#16a34a' },
    { label: 'Частково', value: c.check, color: '#d97706' },
    { label: 'Відсутні', value: c.gap, color: '#dc2626' },
  ].filter((x) => x.value > 0), { title: 'Еталонні блоки по всій вітрині', centerLabel: `${r.totalPct}%` })}
    <p class="chart-cap">Скільки блоків еталонної композиції присутні, працюють частково або відсутні — сумарно за всіма розібраними сторінками.</p></div>` : '';
  return `<section class="block">
    <h2>Підсумок</h2>
    <div class="sum">
      <div class="sum-score">
        <div class="sum-big ${scoreColor(r.totalPct)}">${r.totalScore} / ${r.totalMax}</div>
        <div class="sum-cap">відповідність еталонній композиції · ${r.totalPct}%</div>
      </div>
      <p class="sum-verdict">${esc(r.verdict)}</p>
    </div>
    <div class="sum-tiles">
      <div class="sum-tile ok"><b>${c.ok}</b><span class="sum-t">Закрито повністю</span><span class="sum-s">Блоків, що працюють як має бути</span></div>
      <div class="sum-tile check"><b>${c.check}</b><span class="sum-t">Частково</span><span class="sum-s">Блок є, але не виконує функцію повністю</span></div>
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
    <div class="et-cap">Порядок блоків — еталонний. Червоне — блока немає, жовте — частково (може бути прихований).</div></div>`;
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
          <span class="cnt ok"><b>${p.counts.ok}</b> закрито</span>
          <span class="cnt check"><b>${p.counts.check}</b> частково</span>
          <span class="cnt gap"><b>${p.counts.gap}</b> відсутні</span>
          <span class="cnt total"><b>${p.score}/${p.max}</b> · ${pct}%</span>
        </div>
        ${strong}
      </div>
      <div class="page-et">${etalonStack(p)}</div>
    </div>
    <table class="block-table"><thead><tr><th>Блок еталона</th><th>Що на сайті зараз</th><th>Що має бути</th><th>Оцінка</th></tr></thead><tbody>${blockRows}</tbody></table>
    ${fixes}
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
  /* аркуш «Підсумок» */
  .sum{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;margin:4px 0 10px;}
  .sum-big{font-size:34px;font-weight:800;line-height:1;letter-spacing:-1px;white-space:nowrap;}
  .sum-cap{color:var(--muted);font-size:10px;margin-top:4px;}
  .sum-verdict{font-size:12.5px;line-height:1.4;font-weight:600;color:var(--ink);margin:0;flex:1;min-width:60mm;max-width:130mm;}
  .sum-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 4px;}
  .sum-tile{border:1px solid var(--line);border-top-width:3px;border-radius:6px;padding:9px 11px;}
  .sum-tile.ok{border-top-color:var(--ok);} .sum-tile.check{border-top-color:var(--check);} .sum-tile.gap{border-top-color:var(--gap);}
  .sum-tile b{display:block;font-size:26px;font-weight:800;line-height:1;}
  .sum-tile.ok b{color:var(--ok);} .sum-tile.check b{color:var(--check);} .sum-tile.gap b{color:var(--gap);}
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
  .cnt b{font-size:11px;} .cnt.ok b{color:var(--ok);} .cnt.check b{color:var(--check);} .cnt.gap b{color:var(--gap);} .cnt.total{background:var(--ink);color:#fff;border-color:var(--ink);}
  .strong{font-size:9.5px;color:#333;}
  /* лобове порівняння з еталоном */
  .etalon{border:1px solid var(--line);border-radius:6px;padding:8px 9px;background:var(--soft);}
  .et-h{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin-bottom:6px;}
  .et-b{position:relative;font-size:8.5px;font-weight:600;border:1px solid var(--line);border-left:3px solid var(--line);border-radius:4px;background:#fff;padding:4px 18px 4px 6px;margin:3px 0;color:#222;}
  .et-b i{font-style:normal;color:var(--muted);font-weight:700;margin-right:4px;font-size:7.5px;}
  .et-b s{position:absolute;right:5px;top:4px;text-decoration:none;font-size:9px;}
  .et-b.ok{border-left-color:var(--ok);} .et-b.ok s{color:var(--ok);}
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
  .st{font-size:11px;line-height:1;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}
  .row-gap .b-name{color:var(--gap);} .row-gap .b-now{color:var(--gap);}
  /* пріоритет доробок */
  .fixes{margin-top:12px;} .fix-table td{padding:4px 6px;border-bottom:1px solid var(--line);font-size:10px;vertical-align:top;}
  .fx-n{color:var(--muted);width:16px;} .fx-what{font-weight:700;} .fx-crit{font-weight:700;white-space:nowrap;} .fx-why{color:#333;}
  /* системні дефекти */
  .sys-list{margin:6px 0 0;padding-left:18px;} .sys-list li{margin:5px 0;} .s-dims{margin-left:4px;}
`;

export function renderAuditHtml(r: SiteAuditReport): string {
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

  const body = coverHtml
    + summarySheet(r)
    + cs.meth
    + treeSection(r)
    + pageTypesSection(r)
    + r.pages.map(pageSection).join('')
    + systemicSection(r)
    + cs.sw
    + cs.recs
    + cs.concl
    + footer;

  return doc(`UX/UI-аудит · ${r.client}`, body, EXTRA_CSS);
}
