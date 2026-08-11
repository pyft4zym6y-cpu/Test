/**
 * SEO Architecture A0 — клиентский PDF: видимое дерево → проблемные узлы
 * → рекомендуемое дерево. Единый визуальный стандарт (reportShell).
 */
import { esc, dimBadges, doc, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import { ONPAGE_COLS, ONPAGE_LABEL, type SeoArchReport, type Purpose } from '../seoarch.js';

const PURPOSE_RU: Record<Purpose, string> = { commercial: 'коммерческий', informational: 'информационный', system: 'системный' };

export function renderSeoArchHtml(r: SeoArchReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const paramShare = r.totals.links ? Math.round((r.totals.paramUrls / r.totals.links) * 100) : 0;

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · SEO Architecture · слой A0</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Ссылок в дереве</span><span class="val">${r.totals.links}</span></div>
    </div>
    <div class="coverage"><b>Что видно на A0:</b> дерево строится из внутренних ссылок обхода — структурные дефекты (параметрические дубли, глубина, назначение узлов) видны из URL. On-page SEO проверено на ${r.totals.crawled} представительных страницах (выборка L0). Полное дерево и лог-анализ — на A1. robots: ${r.indexability.robots ? 'есть' : 'нет'} · sitemap.xml: ${r.indexability.sitemap ? 'есть' : '<span class="gap">нет</span>'} · разделов L1: ${r.totals.l1} · глубина: ${r.totals.maxDepth} · URL с параметрами: ${paramShare}%.</div>
  </div></section>`;

  const maxCount = Math.max(1, ...r.tree.map((t) => t.count));
  const treeRows = r.tree.map((t) => `<tr>
    <td class="t-node"><span class="st ${t.severity}">${t.severity === 'gap' ? '●' : t.severity === 'check' ? '◐' : '○'}</span> <b>${esc(t.label)}</b></td>
    <td class="t-purpose">${PURPOSE_RU[t.purpose]}</td>
    <td class="t-bar"><span class="bar"><i class="fill ${t.severity}" style="width:${Math.round((t.count / maxCount) * 100)}%"></i></span></td>
    <td class="t-count">${t.count}</td>
    <td class="t-note ${t.severity}">${esc(t.note)}</td>
  </tr>`).join('');
  const tree = `<section class="block"><h2>Видимое дерево сайта</h2>
    <p class="lead">Разделы первого уровня по числу найденных URL. Цвет — риск (параметрические дубли), не украшение.</p>
    <table><thead><tr><th>Раздел (L1)</th><th>Назначение</th><th>Объём URL</th><th>Кол-во</th><th>Сигнал</th></tr></thead><tbody>${treeRows}</tbody></table></section>`;

  const issueRows = r.issues.map((i) => `<tr>
    <td class="i-node"><b>${esc(i.node)}</b><span class="i-lvl">L${i.level}</span></td>
    <td>${PURPOSE_RU[i.purpose]}</td>
    <td class="gap">${esc(i.problem)}</td>
    <td>${esc(i.dupes)}</td>
    <td>${esc(i.index)}</td>
    <td class="i-act">${esc(i.action)}</td>
    <td>${dimBadges(i.dims)}</td>
  </tr>`).join('');
  const issues = `<section class="block"><h2>Проблемные узлы</h2>
    <p class="lead">Узлы дерева с SEO-пробелами и структурными рисками.</p>
    ${r.issues.length ? `<table><thead><tr><th>Узел</th><th>Назначение</th><th>Проблема</th><th>Дубли</th><th>Индексируемость</th><th>Рекомендуемое действие</th><th>Изм.</th></tr></thead><tbody>${issueRows}</tbody></table>` : '<p class="lead">Критичных SEO-узлов на выборке L0 не зафиксировано.</p>'}</section>`;

  // Постраничный on-page срез: фактические значения, а не только статусы.
  const opHead = ONPAGE_COLS.map((c) => `<th>${esc(ONPAGE_LABEL[c])}</th>`).join('');
  const opRows = r.onpage.map((row) => `<tr>
    <td class="op-url"><b>${esc(row.kind)}</b><span>${esc(row.url)}</span></td>
    ${ONPAGE_COLS.map((c) => { const cell = row.cells[c]; const na = cell?.note === 'н/п'; return `<td class="op-c ${na ? 'na' : cell?.ok ? 'ok' : 'gap'}">${na ? '·' : cell?.ok ? '✓' : '✕'} <i>${esc(cell?.note ?? '—')}</i></td>`; }).join('')}
  </tr>`).join('');
  const onpage = r.onpage.length ? `<section class="block"><h2>On-page постранично: фактические значения</h2>
    <p class="lead">Норма: Title 15–70 символов, Description 50–170, ровно один H1, canonical на каждом шаблоне, Product-разметка на карточках и листингах. «н/п» — проверка неприменима к типу страницы.</p>
    <table><thead><tr><th>Страница</th>${opHead}</tr></thead><tbody>${opRows}</tbody></table></section>` : '';

  const rec = `<section class="block"><h2>Рекомендуемое дерево</h2>
    <p class="lead">Как должна выглядеть архитектура, чтобы не плодить дубли и раздавать вес правильно.</p>
    <ul>${r.recommended.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;

  // ── Консалтинговый каркас ──
  const meth = methodologySection({
    goal: 'Оценить, помогает ли архитектура сайта собирать поисковый спрос — или распыляет вес по дублям и пустым веткам.',
    sources: [`Внутренние ссылки обхода + sitemap.xml (${r.totals.links} URL в дереве)`, `On-page проверка ${r.totals.crawled} представительных страниц`, 'robots.txt / sitemap.xml с корня'],
    scope: `Дерево L1 (${r.totals.l1} разделов, глубина до ${r.totals.maxDepth}), проблемные узлы, индексируемость, доля параметрических URL (${paramShare}%).`,
    limits: 'A0 строит дерево по видимым ссылкам — полное дерево, реальные дубли в индексе и позиции проверяются на A1 (Search Console, полный crawl).',
  });

  const okNodes = r.tree.filter((t) => t.severity === 'ok');
  const badNodes = r.tree.filter((t) => t.severity === 'gap');
  const strengths = [
    ...(r.indexability.robots && r.indexability.sitemap ? ['Индексируемость управляется: robots.txt и sitemap.xml на месте — поисковик получает карту сайта, а не собирает её сам'] : []),
    ...(paramShare <= 10 ? [`Низкая доля параметрических URL (${paramShare}%) — дерево не разъедается фильтрационными дублями`] : []),
    ...(okNodes.length ? [`Здоровые разделы: ${okNodes.slice(0, 4).map((t) => t.label).join(', ')} — структура этих веток отвечает назначению`] : []),
  ];
  const weaknesses = [
    ...(!r.indexability.sitemap ? ['Нет sitemap.xml — индексация отдана на волю обходчика, новые страницы попадают в индекс с задержкой'] : []),
    ...(!r.indexability.robots ? ['Нет robots.txt — фасеты и служебные URL индексируются бесконтрольно'] : []),
    ...(paramShare > 10 ? [`Параметрические URL — ${paramShare}% дерева: вес размывается по дублям фильтров`] : []),
    ...r.issues.slice(0, 5).map((i) => `${i.node} (L${i.level}): ${i.problem}`),
  ];
  const recsList: SectionRec[] = [
    ...r.issues.slice(0, 5).map((i): SectionRec => ({ pr: i.level <= 1 ? 'P0' : 'P1', action: `${i.node}: ${i.action}`, effect: `Закрывает «${i.problem}»` })),
    ...r.recommended.slice(0, 3).map((x): SectionRec => ({ pr: 'P2', action: x, effect: 'Архитектура раздаёт вес целевым страницам' })),
  ];
  const concl = conclusionSection([
    `Дерево из ${r.totals.links} URL (${r.totals.l1} разделов первого уровня, глубина до ${r.totals.maxDepth}) ${badNodes.length ? `содержит ${badNodes.length} проблемных узлов и ${r.issues.length} зафиксированных SEO-разрывов` : 'структурно здорово по видимым признакам'}. ${paramShare > 10 ? `Доля URL с параметрами (${paramShare}%) означает, что заметная часть ссылочного веса уходит в неиндексируемые или дублирующие адреса.` : 'Паразитных параметрических веток в значимом объёме не видно.'}`,
    r.issues.length
      ? `Архитектурные проблемы каталога — это не «технические мелочи»: каждая ветка с дублями или без назначения конкурирует за позиции сама с собой. Приоритет — узлы верхних уровней (L1–L2): они раздают вес всем страницам ниже.`
      : 'Явных структурных конфликтов не выявлено; резерв роста лежит в расширении семантики (новые посадочные под спрос), а не в починке существующего.',
    'Вывод сделан по видимой архитектуре (слой A0). Фактические позиции, каннибализация запросов и полнота индекса проверяются на A1 через Search Console — там же подтверждается или снимается каждый из перечисленных рисков.',
  ], 'A1: Search Console (запросы, позиции, покрытие индекса) + полный crawl — превращает карту рисков в план восстановления трафика с цифрами.');

  const foot = `<section class="block"><div class="footer">Commerce OS · SEO Architecture A0 · ${esc(r.client)} · ${esc(date)}. Слой A0: дерево по видимым ссылкам, on-page — выборка. Отсутствие данных не выдаётся за факт; полное дерево, дубли и техническая SEO уточняются на A1.</div></section>`;

  const extra = `
    .t-node{white-space:nowrap;} .t-purpose{color:#333;font-size:10px;} .t-count{font-weight:800;text-align:right;} .t-note{font-size:9.5px;}
    .op-url{white-space:nowrap;} .op-url b{display:block;font-size:9.5px;} .op-url span{font-size:8px;color:var(--muted);}
    .op-c{font-size:8.5px;font-weight:700;white-space:nowrap;} .op-c i{font-style:normal;font-weight:400;color:var(--muted);display:block;font-size:7.5px;}
    .op-c.ok{color:var(--ok);} .op-c.gap{color:var(--gap);} .op-c.na{color:var(--muted);}
    .st{font-size:11px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}
    .i-node{white-space:nowrap;} .i-lvl{display:inline-block;margin-left:5px;font-size:7.5px;color:var(--muted);} .i-act{color:#333;}`;
  return doc(`SEO Architecture A0 · ${r.client}`, cover + meth + tree + onpage + issues + rec + swSection(strengths, weaknesses) + recsSection(recsList) + concl + foot, extra);
}
