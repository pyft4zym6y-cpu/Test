/**
 * Контент-аудит — клієнтський PDF: посторінково (усі розібрані
 * сторінки) — повнота / корисність / переконливість / відповідність інтенту
 * (1–5) + консалтинговий каркас: методологія, сильні/слабкі сторони,
 * рекомендації, підсумковий висновок. Єдиний візуальний стандарт (reportShell).
 */
import { esc, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import { svgRadar } from './charts.js';
import type { ContentReport, ContentRow } from '../contentaudit.js';

const rateCls = (v: number) => (v >= 4 ? 'ok' : v >= 3 ? 'check' : 'gap');
const critCls = (c: string) => (c === 'H' ? 'gap' : c === 'M' ? 'check' : 'ok');
const critWord = (c: string) => (c === 'H' ? 'висока' : c === 'M' ? 'середня' : 'низька');
const rate = (v: number) => `<span class="rate ${rateCls(v)}">${v}<i>/5</i></span>`;

export function renderContentAuditHtml(r: ContentReport): string {
  const overall = ((r.avg.completeness + r.avg.usefulness + r.avg.persuasiveness + r.avg.intent) / 4);

  const coverHtml = cover({
    kicker: 'Контент-аудит',
    title: 'Контент-аудит',
    verdict: r.verdict, // вивід — окремим рядком, а не гігантським заголовком
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Сторінок розібрано', value: String(r.rows.length) },
      { label: 'Середня здатність вести до рішення', value: `${overall.toFixed(1)}/5` },
    ],
    note: `<b>Що оцінюємо:</b> не «якість тексту», а здатність контенту знижувати невизначеність і допомагати комерційному рішенню. У зовнішньому аудиті — за наявністю вирішальних блоків (опис, характеристики, довіра, відповіді); реальна переконливість тексту уточнюється з доступом до контенту після передачі доступів (наступний етап). Відсутність даних не видається за факт.`,
  });

  const meth = methodologySection({
    goal: 'Оцінити, чи веде контент кожної розібраної сторінки покупця до рішення — і де він втрачає покупця.',
    sources: [`Зовнішній обхід: ${r.rows.length} сторінок, відрендерений DOM`, 'Каталог вирішальних блоків (опис, характеристики, довіра, відповіді)', 'Еталонні вимоги до контенту за типами сторінок'],
    scope: `Усі розібрані сторінки всіх типів (${r.rows.length} шт.), чотири виміри × шкала 1–5.`,
    limits: 'Зовнішній аудит оцінює наявність і склад вирішальних блоків. Якість формулювань, унікальність і відповідність пошуковому попиту перевіряються після передачі доступів (наступний етап; доступ до CMS, Search Console).',
  });

  // Методика: що саме означає кожен вимір і кожна оцінка — щоб шкала
  // читалася без усних пояснень.
  const legend = `<section class="block"><h2>Методика оцінки: чотири виміри, шкала 1–5</h2>
    <table class="lg"><thead><tr><th>Вимір</th><th>Питання, на яке відповідає</th><th>1 — провал</th><th>3 — середина</th><th>5 — еталон</th></tr></thead><tbody>
      <tr><td class="lg-n">Повнота</td><td>Чи є на сторінці вся інформація для рішення?</td><td>ключових блоків немає — покупець іде шукати</td><td>база є, деталі доводиться добувати</td><td>усі питання вибору закриті на сторінці</td></tr>
      <tr><td class="lg-n">Корисність</td><td>Чи допомагає контент зробити вибір швидше?</td><td>текст «для галочки», не допомагає обрати</td><td>допомагає частково (немає порівняння/умов)</td><td>веде за руку: характеристики, умови, відповіді</td></tr>
      <tr><td class="lg-n">Переконливість</td><td>Чи дає сторінка причини повірити?</td><td>ні відгуків, ні гарантій, ні доказів</td><td>частина доказів є, не в точці рішення</td><td>довіра вбудована там, де ухвалюється рішення</td></tr>
      <tr><td class="lg-n">Інтент</td><td>Чи збігається контент із метою візиту?</td><td>сторінка не відповідає на запит, з яким прийшли</td><td>відповідає, але змушує шукати по сторінці</td><td>мета візиту закривається одразу і без тертя</td></tr>
    </tbody></table>
    <p class="lead">Оцінка на цьому шарі ставиться за наявністю і складом вирішальних блоків (спостереження зовнішнього обходу); якість формулювань тексту уточнюється після передачі доступів (наступний етап).</p></section>`;

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
  const radar = `<div class="chart-wrap">${svgRadar([
    { axis: 'Повнота', value: r.avg.completeness },
    { axis: 'Корисність', value: r.avg.usefulness },
    { axis: 'Переконливість', value: r.avg.persuasiveness },
    { axis: 'Інтент', value: r.avg.intent },
  ], { max: 5, title: 'Профіль контенту за 4 вимірами (середнє, 0–5)' })}
    <p class="chart-cap">Провал будь-якої з осей до центру — це місце, де контент перестає вести до рішення. Найкоротша вісь задає, за що братися першим.<sup class="fn">1</sup></p></div>`;
  const table = `<section class="block"><h2>Контент посторінково</h2>
    <p class="lead">Оцінка 1–5 за кожною розібраною сторінкою: 1 — не знімає питання вибору, 5 — веде до рішення без зовнішніх пошуків.</p>
    ${radar}
    <p class="fn-note"><sup>1</sup> Значення — середнє за ${r.rows.length} розібраними сторінками. На зовнішньому шарі оцінка ставиться за наявністю і складом вирішальних блоків; якість формулювань уточнюється після доступу до контенту.</p>
    <table><thead><tr><th>Сторінка</th><th>Об'єкт</th><th>Повнота</th><th>Корисність</th><th>Переконл.</th><th>Інтент</th><th>Критич.</th><th>Коментар</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2">Середнє за ${r.rows.length} сторінками</td><td>${rate(r.avg.completeness)}</td><td>${rate(r.avg.usefulness)}</td><td>${rate(r.avg.persuasiveness)}</td><td>${rate(r.avg.intent)}</td><td colspan="2"></td></tr></tfoot></table></section>`;

  const unparsed = r.unparsed.length ? `<section class="block"><h2>Знайдені, але не розібрані в цьому прогоні</h2>
    <p class="lead">Ці сторінки є на сайті (карта типів), але не потрапили в розбір контенту — їхня оцінка додається розширеним обходом, відсутність оцінки не означає «все гаразд».</p>
    <ul>${r.unparsed.map((u) => `<li><b>${esc(u.label)}</b> — ${esc(u.url)}</li>`).join('')}</ul></section>` : '';

  const sw = swSection(r.strengths, r.weaknesses);
  const recs = recsSection(r.recommendations);
  const concl = conclusionSection(r.conclusion, 'Наступний етап: аудит тексту на живому сайті (унікальність, тональність, попит) + звʼязка контенту з конверсією за даними аналітики.');

  const foot = pageFooter('Зовнішній аудит вітрини: оцінка за наявністю вирішальних блоків, спостереження. Відсутність даних не видається за факт і не приховується.');

  const extra = `.rate{font-weight:800;font-size:12px;} .rate i{font-weight:400;font-size:8px;color:var(--muted);font-style:normal;}
    .rate.ok{color:var(--ok);} .rate.check{color:var(--check);} .rate.gap{color:var(--gap);}
    .p-type{font-weight:700;white-space:nowrap;} .p-type .p-url{display:block;font-weight:400;font-size:8px;color:var(--muted);max-width:110px;overflow:hidden;text-overflow:ellipsis;}
    .p-obj{color:#333;} .p-crit{font-weight:700;white-space:nowrap;} .p-note{color:#333;font-size:10px;}
    tfoot td{border-top:2px solid var(--ink);font-weight:800;padding-top:8px;}`;
  return doc(`Контент-аудит · ${r.client}`, coverHtml + meth + legend + table + unparsed + sw + recs + concl + foot, `${extra}
    .lg td{font-size:9px;color:#333;} .lg-n{font-weight:800;white-space:nowrap;}`);
}
