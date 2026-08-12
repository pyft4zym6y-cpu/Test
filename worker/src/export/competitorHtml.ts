/**
 * Конкурентный анализ A0 — клиентский PDF: клиент × рынок × эталон по
 * параметрам + вывод, рейтинг по взвешенному индексу, white space (свободная
 * ниша). Оборачивает готовый BenchmarkReport (competitor.ts) в стандарт A0.
 */
import { esc, scoreColor, doc, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import type { BenchmarkReport, ParamRow } from '../competitor.js';

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const POS_CLS: Record<ParamRow['position'], string> = { lead: 'ok', par: 'check', behind: 'gap' };
const POS_WORD: Record<ParamRow['position'], string> = { lead: 'ведём', par: 'наравне', behind: 'отстаём' };

export function renderCompetitorHtml(b: BenchmarkReport, client: string, takenAt: string): string {
  const date = new Date(takenAt).toLocaleDateString('ru-RU');
  // Статистическая честность: при выборке <5 сайтов «рыночное лидерство» не
  // заявляется — только позиция в выборке (QA-претензия «лидируем на 3 сайтах»).
  const small = b.totalSites < 5;
  const verdict = b.narrative?.summary
    || (b.clientRank === 1
      ? (small ? `Первое место в выборке из ${b.totalSites} сайтов (индекс ${b.clientIndex}/100) — для вывода о рынке нужно 4+ конкурентов.`
        : `Лидируем по внешним признакам: индекс ${b.clientIndex}/100, 1-е место из ${b.totalSites}.`)
      : `Место ${b.clientRank} из ${b.totalSites} ${small ? 'в выборке' : 'по внешнему индексу'} (${b.clientIndex}/100) — впереди по ${b.clientBehind.length} параметрам другие сайты.`);

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Конкурентный анализ · внешний аудит витрины</div>
    <h1>${esc(verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Место</span><span class="val">${b.clientRank}/${b.totalSites}</span></div>
    </div>
    <div class="cov-score"><div class="big ${scoreColor(b.clientIndex)}">${b.clientIndex}<span>/100</span></div><div class="big-cap">взвешенный внешний индекс</div></div>
    <div class="coverage"><b>Что видно во внешнем аудите:</b> сравнение по публичным внешним признакам (обход клиента и конкурентов). Внутренняя экономика, цены и performance конкурентов недоступны — только то, что видно снаружи. Отсутствие данных не выдаётся за факт.</div>
  </div></section>`;

  const rankRows = b.ranking.map((s, i) => `<tr class="${s.isClient ? 'me' : ''}">
    <td class="r-pos">${i + 1}</td>
    <td class="r-name">${s.isClient ? '★ ' : ''}${esc(host(s.name))}${s.isClient ? ' (клиент)' : ''}</td>
    <td class="r-bar"><span class="bar"><i class="fill ${scoreColor(s.index)}" style="width:${s.index}%"></i></span></td>
    <td class="r-idx ${scoreColor(s.index)}">${s.index}</td>
  </tr>`).join('');
  const ranking = `<section class="block"><h2>Рейтинг по внешнему индексу</h2>
    <p class="lead">Взвешенная оценка витрин по набору параметров (голд-стандарт, доверие, каталог, мобильные и др.).</p>
    <table><thead><tr><th>#</th><th>Сайт</th><th>Индекс</th><th></th></tr></thead><tbody>${rankRows}</tbody></table></section>`;

  const paramRows = b.params.map((p) => `<tr>
    <td class="pm-name">${esc(p.name)}</td>
    <td class="pm-c ${scoreColor(p.client)}">${p.client}</td>
    <td class="pm-m">${p.marketMax}</td>
    <td class="pm-e">100</td>
    <td class="pm-pos ${POS_CLS[p.position]}">${POS_WORD[p.position]}</td>
  </tr>`).join('');
  const params = `<section class="block"><h2>Клиент против рынка по параметрам</h2>
    <p class="lead">Клиент — значение клиента; Рынок — лучший из конкурентов; Эталон — 100. Вывод — позиция клиента.</p>
    <table><thead><tr><th>Параметр</th><th>Клиент</th><th>Рынок</th><th>Эталон</th><th>Вывод</th></tr></thead><tbody>${paramRows}</tbody></table></section>`;

  const ws = b.whiteSpace.length ? `<section class="block"><h2>Свободная ниша (white space)</h2>
    <p class="lead">Параметры, слабые у всех на рынке — здесь можно вырваться вперёд без гонки.</p>
    <ul>${b.whiteSpace.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';

  // ── Консалтинговый каркас ──
  const meth = methodologySection({
    goal: 'Определить позицию клиента относительно рынка по внешним признакам витрины: где ведём, где отстаём, где на рынке свободная ниша.',
    sources: [`Обход клиента и ${b.totalSites - 1} конкурентов тем же движком проверок`, `Веса индекса (опубликованы, сумма = 100%): ${b.params.map((p) => p.name).join(', ')} — состав и вес каждого параметра приведены в таблице ниже`],
    scope: `${b.params.length} параметров сравнения · ${b.totalSites} сайтов · единая шкала (эталон = 100).`,
    limits: `Сравниваются только публичные признаки витрин; трафик и экономика конкурентов не видны. ${b.totalSites < 5 ? `Выборка из ${b.totalSites} сайтов статистически мала: выводы читаются как «в выборке», не как «на рынке».` : ''}`,
  });
  const behindRows = b.params.filter((p) => p.position === 'behind');
  const strengths = [
    ...(b.clientRank === 1 ? [`Первое место в выборке из ${b.totalSites} сайтов (${b.clientIndex}/100)${b.totalSites < 5 ? ' — вывод о рынке требует расширения выборки' : ' — витрина задаёт стандарт'}`] : []),
    ...b.params.filter((p) => p.position === 'lead').map((p) => `${p.name}: ${p.client} против лучших ${p.marketMax} у рынка — параметр-опора`),
  ];
  const weaknesses = behindRows.map((p) => `${p.name}: ${p.client} против ${p.marketMax} у лучшего конкурента — рынок здесь задаёт ожидание, которому витрина не отвечает`);
  const recs: SectionRec[] = [
    ...behindRows.slice(0, 4).map((p, i): SectionRec => ({ pr: i < 2 ? 'P0' : 'P1', action: `Закрыть отставание «${p.name}» до уровня лучшего на рынке (${p.marketMax})`, effect: 'Снимает причину выбора конкурента в сравнении витрин' })),
    ...b.whiteSpace.slice(0, 2).map((x): SectionRec => ({ pr: 'P2', action: `Занять свободную нишу: ${x}`, effect: 'Параметр слаб у всех — преимущество без гонки' })),
  ];
  const concl = conclusionSection([
    `Позиция клиента — ${b.clientRank} из ${b.totalSites} с индексом ${b.clientIndex}/100. ${b.clientRank === 1 ? 'Лидерство по внешним признакам — актив, но оно измерено по витринам: устойчивость лидерства проверяется трафиком и экономикой.' : `Разрыв с лидером сосредоточен в ${behindRows.length} параметрах — это конкретный, конечный список, а не «всё плохо».`}`,
    b.whiteSpace.length
      ? `Свободная ниша: ${b.whiteSpace.join('; ')}. Это параметры, слабые у всех участников выборки — вложение здесь даёт отличие, которое конкуренты не смогут быстро скопировать, потому что им придётся начинать с нуля.`
      : 'Свободных ниш в выборке не обнаружено: рынок плотный, выигрывать придётся исполнением, а не пустыми клетками.',
    'Сравнение статично (срез на дату) и внешне. Повторный замер после внедрения рекомендаций покажет динамику позиции; экономика конкурентов остаётся вне досягаемости и не имитируется.',
  ], 'Расширенный аудит с конкурентами: регулярный бенчмарк (раз в квартал) + анализ трафика конкурентов внешними сервисами — позиция превращается из фото в кино.');

  const foot = `<section class="block"><h2>Итог</h2>
    <div class="concl-grid" style="font-size:10.5px">
      <span class="k ok">Ведём</span><span class="v">${b.clientLeads.length ? esc(b.clientLeads.join(', ')) : '—'}</span>
      <span class="k gap">Отстаём</span><span class="v">${b.clientBehind.length ? esc(b.clientBehind.join(', ')) : '—'}</span>
    </div>
    <div class="footer">Commerce OS · Конкурентный анализ · ${esc(client)} · ${esc(date)}. Внешний аудит витрины: только публичные внешние признаки. Отсутствие данных не выдаётся за факт и не скрывается; performance и экономика конкурентов — вне внешнего аудита.</div></section>`;

  const extra = `.r-pos{color:var(--muted);width:20px;} .r-name{font-weight:700;} .r-idx{font-weight:800;text-align:right;} tr.me{background:var(--soft);}
    .pm-name{font-weight:600;} .pm-c,.pm-m,.pm-e{font-weight:800;text-align:center;width:52px;} .pm-m,.pm-e{color:var(--muted);} .pm-pos{font-weight:700;white-space:nowrap;}`;
  return doc(`Конкурентный анализ · ${client}`, cover + meth + ranking + params + ws + swSection(strengths, weaknesses) + recsSection(recs) + concl + foot, extra);
}
