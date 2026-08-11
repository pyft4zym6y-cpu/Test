/**
 * Content Audit A0 — клиентский PDF (A0 §11): постранично (все разобранные
 * страницы) — полнота / полезность / убедительность / соответствие интенту
 * (1–5) + консалтинговый каркас: методология, сильные/слабые стороны,
 * рекомендации, итоговый вывод. Единый визуальный стандарт (reportShell).
 */
import { esc, doc, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import type { ContentReport, ContentRow } from '../contentaudit.js';

const rateCls = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const critCls = (c: string) => (c === 'H' ? 'gap' : c === 'M' ? 'check' : 'ok');
const critWord = (c: string) => (c === 'H' ? 'высокая' : c === 'M' ? 'средняя' : 'низкая');
const rate = (v: number) => `<span class="rate ${rateCls(v)}">${v}<i>/5</i></span>`;

export function renderContentAuditHtml(r: ContentReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const overall = ((r.avg.completeness + r.avg.usefulness + r.avg.persuasiveness + r.avg.intent) / 4);

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Content Audit · слой A0</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Страниц разобрано</span><span class="val">${r.rows.length}</span></div>
    </div>
    <div class="cov-score"><div class="big ${rateCls(overall)}">${overall.toFixed(1)}<span>/5</span></div><div class="big-cap">средняя способность контента вести к решению</div></div>
    <div class="coverage"><b>Что оцениваем:</b> не «качество текста», а способность контента снижать неопределённость и помогать коммерческому решению (A0 §11). На A0 — по наличию решающих блоков (описание, характеристики, доверие, ответы); реальная убедительность текста уточняется с доступом к контенту на A1. Отсутствие данных не выдаётся за факт (A0 §15.7).</div>
  </div></section>`;

  const meth = methodologySection({
    goal: 'Оценить, ведёт ли контент каждой разобранной страницы покупателя к решению — и где он теряет покупателя.',
    sources: [`Внешний обход: ${r.rows.length} страниц, отрендеренный DOM`, 'Каталог решающих блоков Commerce OS (описание, характеристики, доверие, ответы)', 'Эталонные требования к контенту по типам страниц'],
    scope: `Все разобранные страницы всех типов (${r.rows.length} шт.), четыре измерения × шкала 1–5.`,
    limits: 'Слой A0 оценивает наличие и состав решающих блоков. Качество формулировок, уникальность и соответствие поисковому спросу проверяются на A1 (доступ к CMS, Search Console).',
  });

  const rows = r.rows.map((row: ContentRow) => `<tr>
    <td class="p-type">${esc(row.pageType)}<span class="p-url">${esc(row.url)}</span></td>
    <td class="p-obj">${esc(row.object)}</td>
    <td>${rate(row.completeness)}</td>
    <td>${rate(row.usefulness)}</td>
    <td>${rate(row.persuasiveness)}</td>
    <td>${rate(row.intent)}</td>
    <td class="p-crit ${critCls(row.crit)}">${critWord(row.crit)}</td>
    <td class="p-note">${esc(row.note)}</td>
  </tr>`).join('');
  const table = `<section class="block"><h2>Контент постранично</h2>
    <p class="lead">Оценка 1–5 по каждой разобранной странице: 1 — не снимает вопросы выбора, 5 — ведёт к решению без внешних поисков.</p>
    <table><thead><tr><th>Страница</th><th>Объект</th><th>Полнота</th><th>Полезность</th><th>Убедит.</th><th>Интент</th><th>Критич.</th><th>Комментарий</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2">Среднее по ${r.rows.length} страницам</td><td>${rate(r.avg.completeness)}</td><td>${rate(r.avg.usefulness)}</td><td>${rate(r.avg.persuasiveness)}</td><td>${rate(r.avg.intent)}</td><td colspan="2"></td></tr></tfoot></table></section>`;

  const sw = swSection(r.strengths, r.weaknesses);
  const recs = recsSection(r.recommendations);
  const concl = conclusionSection(r.conclusion, 'A1: аудит текста на живом сайте (уникальность, тональность, спрос) + связка контента с конверсией по данным аналитики.');

  const foot = `<section class="block"><div class="footer">Commerce OS · Content Audit A0 · ${esc(r.client)} · ${esc(date)}. Слой A0: оценка по наличию решающих блоков, наблюдение. Отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7).</div></section>`;

  const extra = `.rate{font-weight:800;font-size:12px;} .rate i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;}
    .rate.ok{color:var(--ok);} .rate.check{color:var(--check);} .rate.gap{color:var(--gap);}
    .p-type{font-weight:700;white-space:nowrap;} .p-type .p-url{display:block;font-weight:400;font-size:8px;color:var(--muted);max-width:110px;overflow:hidden;text-overflow:ellipsis;}
    .p-obj{color:#333;} .p-crit{font-weight:700;white-space:nowrap;} .p-note{color:#333;font-size:10px;}
    tfoot td{border-top:2px solid var(--ink);font-weight:800;padding-top:8px;}`;
  return doc(`Content Audit A0 · ${r.client}`, cover + meth + table + sw + recs + concl + foot, extra);
}
