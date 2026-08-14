/**
 * SEO Architecture A0 — клиентский PDF: видимое дерево → проблемные узлы
 * → рекомендуемое дерево. Единый визуальный стандарт (reportShell).
 */
import { esc, dimBadges, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import { svgBars, svgDonut } from './charts.js';
import { ONPAGE_COLS, ONPAGE_LABEL, type SeoArchReport, type Purpose } from '../seoarch.js';

const PURPOSE_RU: Record<Purpose, string> = { commercial: 'комерційний', informational: 'інформаційний', system: 'системний' };

export function renderSeoArchHtml(r: SeoArchReport): string {
  const paramShare = r.totals.links ? Math.round((r.totals.paramUrls / r.totals.links) * 100) : 0;

  const coverHtml = cover({
    kicker: 'Архітектура сайту',
    title: 'SEO-архітектура',
    verdict: r.verdict,
    metrics: [{ label: 'Клієнт', value: r.client }, { label: 'Посилань у дереві', value: String(r.totals.links) }],
    note: `<b>Що видно в зовнішньому аудиті:</b> дерево будується з внутрішніх посилань обходу — структурні дефекти (параметричні дублі, глибина, призначення вузлів) видно з URL. On-page SEO перевірено на ${r.totals.crawled} представницьких сторінках (вибірковий зовнішній обхід). Повне дерево й лог-аналіз — після передачі доступів (наступний етап). robots: ${r.indexability.robots ? 'є' : 'немає'} · sitemap.xml: ${r.indexability.sitemap ? 'є' : '<span class="gap">немає</span>'} · розділів L1: ${r.totals.l1} · глибина: ${r.totals.maxDepth} · URL з параметрами: ${paramShare}%.`,
  });

  const maxCount = Math.max(1, ...r.tree.map((t) => t.count));
  const treeRows = r.tree.map((t) => `<tr>
    <td class="t-node"><span class="st ${t.severity}">${t.severity === 'gap' ? '●' : t.severity === 'check' ? '◐' : '○'}</span> <b>${esc(t.label)}</b></td>
    <td class="t-purpose">${PURPOSE_RU[t.purpose]}</td>
    <td class="t-bar"><span class="bar"><i class="fill ${t.severity}" style="width:${Math.round((t.count / maxCount) * 100)}%"></i></span></td>
    <td class="t-count">${t.count}</td>
    <td class="t-note ${t.severity}">${esc(t.note)}</td>
  </tr>`).join('');
  const sevOk = r.tree.filter((t) => t.severity === 'ok').length;
  const sevCheck = r.tree.filter((t) => t.severity === 'check').length;
  const sevGap = r.tree.filter((t) => t.severity === 'gap').length;
  const treeDonut = r.tree.length ? `<div class="chart-wrap">${svgDonut([
    { label: 'Норма', value: sevOk, tone: 'ok' },
    { label: 'Увага', value: sevCheck, tone: 'check' },
    { label: 'Ризик дублів', value: sevGap, tone: 'gap' },
  ].filter((s) => s.value > 0), { title: 'Розділи L1 за сигналом', centerLabel: String(r.tree.length) })}
    <p class="chart-cap">Частка червоних секторів показує, наскільки дерево засмічується параметричними дублями: чим їх більше, тим сильніше вага розмивається по копіях фільтрів.<sup class="fn">1</sup></p></div>` : '';
  const tree = `<section class="block"><h2>Видиме дерево сайту</h2>
    <p class="lead">Розділи першого рівня за числом знайдених URL. Колонка «Сигнал» — коротка діагностика розділу: або ризик дублів (багато URL із GET-параметрами — їх треба закривати canonical/robots, інакше пошук індексує копії), або обсяг вкладеності (скільки підрозділів усередині). Колір: зелений — норма, жовтий — увага, червоний — ризик дублів.</p>
    ${treeDonut}
    <table><thead><tr><th>Розділ (L1)</th><th>Призначення</th><th>Обсяг URL</th><th>К-сть</th><th>Сигнал</th></tr></thead><tbody>${treeRows}</tbody></table>
    <p class="fn-note"><sup>1</sup> Сигнал розділу визначено за часткою URL із GET-параметрами у видимих посиланнях обходу (≥8 — ризик, ≥3 — увага). Реальні дублі в індексі підтверджуються після передачі доступів (наступний етап; Search Console, повний crawl).</p></section>`;

  const issueRows = r.issues.map((i) => `<tr>
    <td class="i-node"><b>${esc(i.node)}</b><span class="i-lvl">L${i.level}</span></td>
    <td>${PURPOSE_RU[i.purpose]}</td>
    <td class="gap">${esc(i.problem)}</td>
    <td>${esc(i.dupes)}</td>
    <td>${esc(i.index)}</td>
    <td class="i-act">${esc(i.action)}</td>
    <td>${dimBadges(i.dims)}</td>
  </tr>`).join('');
  const issues = `<section class="block"><h2>Проблемні вузли</h2>
    <p class="lead">Вузли дерева з SEO-прогалинами й структурними ризиками.</p>
    ${r.issues.length ? `<table><thead><tr><th>Вузол</th><th>Призначення</th><th>Проблема</th><th>Дублі</th><th>Індексованість</th><th>Рекомендована дія</th><th>Вим.</th></tr></thead><tbody>${issueRows}</tbody></table>` : '<p class="lead">Критичних SEO-вузлів на перевіреній вибірці не зафіксовано.</p>'}</section>`;

  // Постраничный on-page срез: фактические значения, а не только статусы.
  const opHead = ONPAGE_COLS.map((c) => `<th>${esc(ONPAGE_LABEL[c])}</th>`).join('');
  const opRows = r.onpage.map((row) => `<tr>
    <td class="op-url"><b>${esc(row.kind)}</b><span>${esc(row.url)}</span></td>
    ${ONPAGE_COLS.map((c) => { const cell = row.cells[c]; const na = cell?.note === 'н/з'; return `<td class="op-c ${na ? 'na' : cell?.ok ? 'ok' : 'gap'}">${na ? '·' : cell?.ok ? '✓' : '✕'} <i>${esc(cell?.note ?? '—')}</i></td>`; }).join('')}
  </tr>`).join('');
  const opScores = r.onpage.map((row) => {
    const applic = ONPAGE_COLS.filter((c) => row.cells[c] && row.cells[c].note !== 'н/з');
    const passed = applic.filter((c) => row.cells[c].ok).length;
    const pct = applic.length ? Math.round((passed / applic.length) * 100) : 0;
    return { label: row.kind, value: pct };
  });
  const opBars = r.onpage.length ? `<div class="chart-wrap">${svgBars(opScores.map((p) => ({ label: p.label, value: p.value, max: 100, tone: p.value >= 70 ? 'ok' : p.value >= 45 ? 'check' : 'gap' })), { title: 'On-page бал за сторінками', unit: '%' })}
    <p class="chart-cap">Бал — частка пройдених on-page перевірок із застосовних до типу сторінки. Що коротший стовпчик, то більше незакритих елементів на шаблоні цієї сторінки.<sup class="fn">1</sup></p></div>` : '';
  const onpage = r.onpage.length ? `<section class="block"><h2>On-page посторінково: фактичні значення</h2>
    <p class="lead">Норма: Title 15–70 символів, Description 50–170, рівно один H1, canonical на кожному шаблоні, Product-розмітка на картках і лістингах. «н/з» — перевірка незастосовна до типу сторінки.</p>
    ${opBars}
    <table><thead><tr><th>Сторінка</th>${opHead}</tr></thead><tbody>${opRows}</tbody></table>
    <p class="fn-note"><sup>1</sup> Бал рахується за застосовними до типу сторінки перевірками (Title, Description, H1, canonical, розмітка, Open Graph); «н/з» зі знаменника виключені. Оцінка за вибіркою ${r.totals.crawled} представницьких сторінок зовнішнього обходу — не за всім сайтом.</p></section>` : '';

  const rec = `<section class="block"><h2>Рекомендована архітектура</h2>
    <p class="lead">Як має виглядати архітектура, щоб не плодити дублі й роздавати вагу правильно.</p>
    <ul>${r.recommended.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;

  // Технічний свип (SF-класу): здоров'я посилань по всьому дереву.
  const lh = r.linkHealth;
  const sweep = lh ? `<section class="block"><h2>Технічний свип: здоров'я посилань по сайту</h2>
    <p class="lead">Статуси перевірено рівномірною вибіркою ${lh.checked} із ${lh.sampledFrom} внутрішніх URL дерева (не лише розібрані сторінки). Так знаходяться биті посилання й ланцюги редиректів по всьому магазину.</p>
    <div class="sweep-row">
      <div class="sw-tile ${lh.broken.length ? 'gap' : 'ok'}"><b>${lh.broken.length}</b><span>биті (4xx/5xx)</span></div>
      <div class="sw-tile ${lh.redirects > 5 ? 'check' : ''}"><b>${lh.redirects}</b><span>редиректи (3xx)</span></div>
      <div class="sw-tile ${lh.dupTitles.length ? 'check' : ''}"><b>${lh.dupTitles.reduce((s, d) => s + d.count, 0)}</b><span>сторінок з дубль-Title</span></div>
      <div class="sw-tile ${lh.missingMeta ? 'check' : ''}"><b>${lh.missingMeta}</b><span>без Title/Description</span></div>
    </div>
    ${lh.broken.length ? `<h3 class="gap">Биті посилання (перші ${Math.min(lh.broken.length, 12)})</h3><table><thead><tr><th>URL</th><th>Статус</th></tr></thead><tbody>${lh.broken.slice(0, 12).map((b) => `<tr><td class="op-url"><span>${esc(b.url.replace(/^https?:\/\//, ''))}</span></td><td class="gap"><b>${b.status}</b></td></tr>`).join('')}</tbody></table>` : `<p class="lead">Битих посилань у вибірці не знайдено — базова гігієна дерева в нормі.</p>`}
    ${lh.dupTitles.length ? `<h3>Дублі Title (тиражуються шаблоном)</h3><table><thead><tr><th>Title</th><th>Сторінок</th></tr></thead><tbody>${lh.dupTitles.map((d) => `<tr><td>${esc(d.title)}</td><td class="check"><b>${d.count}</b></td></tr>`).join('')}</tbody></table>` : ''}
  </section>` : '';

  // ── Консалтинговый каркас ──
  const meth = methodologySection({
    goal: 'Оцінити, чи допомагає архітектура сайту збирати пошуковий попит — чи розпорошує вагу по дублях і порожніх гілках.',
    sources: [`Внутрішні посилання обходу + sitemap.xml (${r.totals.links} URL у дереві)`, `On-page перевірка ${r.totals.crawled} представницьких сторінок`, 'robots.txt / sitemap.xml з кореня'],
    scope: `Дерево L1 (${r.totals.l1} розділів, глибина до ${r.totals.maxDepth}), проблемні вузли, індексованість, частка параметричних URL (${paramShare}%).`,
    limits: 'Зовнішній аудит будує дерево за видимими посиланнями — повне дерево, реальні дублі в індексі й позиції перевіряються після передачі доступів (наступний етап; Search Console, повний crawl).',
  });

  const okNodes = r.tree.filter((t) => t.severity === 'ok');
  const badNodes = r.tree.filter((t) => t.severity === 'gap');
  const strengths = [
    ...(r.indexability.robots && r.indexability.sitemap ? ['Індексованість керована: robots.txt і sitemap.xml на місці — пошуковик отримує карту сайту, а не збирає її сам'] : []),
    ...(paramShare <= 10 ? [`Низька частка параметричних URL (${paramShare}%) — дерево не роз’їдається фільтраційними дублями`] : []),
    ...(okNodes.length ? [`Здорові розділи: ${okNodes.slice(0, 4).map((t) => t.label).join(', ')} — структура цих гілок відповідає призначенню`] : []),
  ];
  const weaknesses = [
    ...(!r.indexability.sitemap ? ['Немає sitemap.xml — індексація віддана на волю обхідника, нові сторінки потрапляють в індекс із затримкою'] : []),
    ...(!r.indexability.robots ? ['Немає robots.txt — фасети й службові URL індексуються безконтрольно'] : []),
    ...(paramShare > 10 ? [`Параметричні URL — ${paramShare}% дерева: вага розмивається по дублях фільтрів`] : []),
    ...r.issues.slice(0, 5).map((i) => `${i.node} (L${i.level}): ${i.problem}`),
  ];
  const recsList: SectionRec[] = [
    ...r.issues.slice(0, 5).map((i): SectionRec => ({ pr: i.level <= 1 ? 'P0' : 'P1', action: `${i.node}: ${i.action}`, effect: `Закриває «${i.problem}»` })),
    ...r.recommended.slice(0, 3).map((x): SectionRec => ({ pr: 'P2', action: x, effect: 'Архітектура роздає вагу цільовим сторінкам' })),
  ];
  const concl = conclusionSection([
    `Дерево з ${r.totals.links} URL (${r.totals.l1} розділів першого рівня, глибина до ${r.totals.maxDepth}) ${badNodes.length ? `містить ${badNodes.length} проблемних вузлів і ${r.issues.length} зафіксованих SEO-розривів` : 'структурно здорове за видимими ознаками'}. ${paramShare > 10 ? `Частка URL із параметрами (${paramShare}%) означає, що помітна частина посилальної ваги йде в неіндексовані або дублюючі адреси.` : 'Паразитних параметричних гілок у значущому обсязі не видно.'}`,
    r.issues.length
      ? `Архітектурні проблеми каталогу — це не «технічні дрібниці»: кожна гілка з дублями чи без призначення конкурує за позиції сама із собою. Пріоритет — вузли верхніх рівнів (L1–L2): вони роздають вагу всім сторінкам нижче.`
      : 'Явних структурних конфліктів не виявлено; резерв зростання лежить у розширенні семантики (нові посадкові під попит), а не в ремонті наявного.',
    'Висновок зроблено за видимою архітектурою (зовнішній аудит). Фактичні позиції, канібалізація запитів і повнота індексу перевіряються після передачі доступів (наступний етап) через Search Console — там же підтверджується або знімається кожен із перелічених ризиків.',
  ], 'Наступний етап: Search Console (запити, позиції, покриття індексу) + повний crawl — перетворює карту ризиків на план відновлення трафіку з цифрами.');

  const foot = pageFooter('Дерево за видимими посиланнями обходу, on-page — вибірка. Відсутність даних не видається за факт; повне дерево, дублі й технічна SEO уточнюються після передачі доступів (наступний етап).');

  const extra = `
    .t-node{white-space:nowrap;} .t-purpose{color:#333;font-size:10px;} .t-count{font-weight:800;text-align:right;} .t-note{font-size:9.5px;}
    .op-url{white-space:nowrap;} .op-url b{display:block;font-size:9.5px;} .op-url span{font-size:8px;color:var(--muted);}
    .op-c{font-size:8.5px;font-weight:700;white-space:nowrap;} .op-c i{font-style:normal;font-weight:400;color:var(--muted);display:block;font-size:7.5px;}
    .op-c.ok{color:var(--ok);} .op-c.gap{color:var(--gap);} .op-c.na{color:var(--muted);}
    .st{font-size:11px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}
    .i-node{white-space:nowrap;} .i-lvl{display:inline-block;margin-left:5px;font-size:7.5px;color:var(--muted);} .i-act{color:#333;}
    .sweep-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:8px 0;}
    .sw-tile{border:1px solid var(--line);border-top-width:3px;border-radius:6px;padding:8px 10px;text-align:center;}
    .sw-tile b{display:block;font-size:24px;font-weight:800;line-height:1;} .sw-tile span{font-size:8.5px;color:var(--muted);}
    .sw-tile.ok{border-top-color:var(--ok);} .sw-tile.ok b{color:var(--ok);}
    .sw-tile.check{border-top-color:var(--check);} .sw-tile.check b{color:var(--check);}
    .sw-tile.gap{border-top-color:var(--gap);} .sw-tile.gap b{color:var(--gap);}`;
  return doc(`SEO-архітектура · ${r.client}`, coverHtml + meth + tree + onpage + sweep + issues + rec + swSection(strengths, weaknesses) + recsSection(recsList) + concl + foot, extra);
}
