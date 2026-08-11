/**
 * Конкурентный анализ A0 — клиентский PDF (A0 §12): клиент × рынок × эталон по
 * параметрам + вывод, рейтинг по взвешенному индексу, white space (свободная
 * ниша). Оборачивает готовый BenchmarkReport (competitor.ts) в стандарт A0.
 */
import { esc, scoreColor, doc } from './reportShell.js';
import type { BenchmarkReport, ParamRow } from '../competitor.js';

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const POS_CLS: Record<ParamRow['position'], string> = { lead: 'ok', par: 'check', behind: 'gap' };
const POS_WORD: Record<ParamRow['position'], string> = { lead: 'ведём', par: 'наравне', behind: 'отстаём' };

export function renderCompetitorHtml(b: BenchmarkReport, client: string, takenAt: string): string {
  const date = new Date(takenAt).toLocaleDateString('ru-RU');
  const verdict = b.narrative?.summary
    || (b.clientRank === 1 ? `Лидируем по внешним признакам: индекс ${b.clientIndex}/100, 1-е место из ${b.totalSites}.`
      : `Место ${b.clientRank} из ${b.totalSites} по внешнему индексу (${b.clientIndex}/100) — рынок опережает по ${b.clientBehind.length} параметрам.`);

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Конкурентный анализ · слой A0</div>
    <h1>${esc(verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Место</span><span class="val">${b.clientRank}/${b.totalSites}</span></div>
    </div>
    <div class="cov-score"><div class="big ${scoreColor(b.clientIndex)}">${b.clientIndex}<span>/100</span></div><div class="big-cap">взвешенный внешний индекс</div></div>
    <div class="coverage"><b>Что видно на A0:</b> сравнение по публичным внешним признакам (обход клиента и конкурентов). Внутренняя экономика, цены и performance конкурентов недоступны — только то, что видно снаружи. Отсутствие данных не выдаётся за факт (A0 §15.7).</div>
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
    <p class="lead">Клиент — значение клиента; Рынок — лучший из конкурентов; Эталон — 100. Вывод — позиция клиента (A0 §12).</p>
    <table><thead><tr><th>Параметр</th><th>Клиент</th><th>Рынок</th><th>Эталон</th><th>Вывод</th></tr></thead><tbody>${paramRows}</tbody></table></section>`;

  const ws = b.whiteSpace.length ? `<section class="block"><h2>Свободная ниша (white space)</h2>
    <p class="lead">Параметры, слабые у всех на рынке — здесь можно вырваться вперёд без гонки.</p>
    <ul>${b.whiteSpace.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';

  const foot = `<section class="block"><h2>Итог</h2>
    <div class="concl-grid" style="font-size:10.5px">
      <span class="k ok">Ведём</span><span class="v">${b.clientLeads.length ? esc(b.clientLeads.join(', ')) : '—'}</span>
      <span class="k gap">Отстаём</span><span class="v">${b.clientBehind.length ? esc(b.clientBehind.join(', ')) : '—'}</span>
    </div>
    <div class="footer">Commerce OS · Конкурентный анализ A0 · ${esc(client)} · ${esc(date)}. Слой A0: только публичные внешние признаки. Отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7); performance и экономика конкурентов — вне A0.</div></section>`;

  const extra = `.r-pos{color:var(--muted);width:20px;} .r-name{font-weight:700;} .r-idx{font-weight:800;text-align:right;} tr.me{background:var(--soft);}
    .pm-name{font-weight:600;} .pm-c,.pm-m,.pm-e{font-weight:800;text-align:center;width:52px;} .pm-m,.pm-e{color:var(--muted);} .pm-pos{font-weight:700;white-space:nowrap;}`;
  return doc(`Конкурентный анализ A0 · ${client}`, cover + ranking + params + ws + foot, extra);
}
