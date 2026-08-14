/**
 * Конкурентный анализ A0 — клиентский PDF: клиент × рынок × эталон по
 * параметрам + вывод, рейтинг по взвешенному индексу, white space (свободная
 * ниша). Оборачивает готовый BenchmarkReport (competitor.ts) в единый стандарт.
 */
import { esc, scoreColor, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import { svgRadar } from './charts.js';
import type { BenchmarkReport, ParamRow } from '../competitor.js';

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const POS_CLS: Record<ParamRow['position'], string> = { lead: 'ok', par: 'check', behind: 'gap' };
const POS_WORD: Record<ParamRow['position'], string> = { lead: 'ведемо', par: 'нарівні', behind: 'відстаємо' };

export function renderCompetitorHtml(b: BenchmarkReport, client: string, _takenAt: string): string {
  // Статистическая честность: при выборке <5 сайтов «рыночное лидерство» не
  // заявляется — только позиция в выборке (QA-претензия «лидируем на 3 сайтах»).
  const small = b.totalSites < 5;
  const verdict = b.narrative?.summary
    || (b.clientRank === 1
      ? (small ? `Перше місце у вибірці з ${b.totalSites} сайтів (індекс ${b.clientIndex}/100) — для висновку про ринок потрібно 4+ конкурентів.`
        : `Лідируємо за зовнішніми ознаками: індекс ${b.clientIndex}/100, 1-е місце з ${b.totalSites}.`)
      : `Місце ${b.clientRank} з ${b.totalSites} ${small ? 'у вибірці' : 'за зовнішнім індексом'} (${b.clientIndex}/100) — попереду за ${b.clientBehind.length} параметрами інші сайти.`);

  const coverHtml = cover({
    kicker: 'Конкурентний аналіз',
    title: 'Конкурентний аналіз',
    verdict,
    metrics: [
      { label: 'Клієнт', value: client },
      { label: 'Місце', value: `${b.clientRank}/${b.totalSites}` },
    ],
    score: { pct: b.clientIndex, cap: 'зважений зовнішній індекс (із 100)' },
    note: `<b>Що видно у зовнішньому аудиті:</b> порівняння за публічними зовнішніми ознаками (обхід клієнта й конкурентів). Внутрішня економіка, ціни та performance конкурентів недоступні — лише те, що видно ззовні. Відсутність даних не видається за факт.`,
  });

  const rankRows = b.ranking.map((s, i) => `<tr class="${s.isClient ? 'me' : ''}">
    <td class="r-pos">${i + 1}</td>
    <td class="r-name">${s.isClient ? '★ ' : ''}${esc(host(s.name))}${s.isClient ? ' (клієнт)' : ''}</td>
    <td class="r-bar"><span class="bar"><i class="fill ${scoreColor(s.index)}" style="width:${s.index}%"></i></span></td>
    <td class="r-idx ${scoreColor(s.index)}">${s.index}</td>
  </tr>`).join('');
  const ranking = `<section class="block"><h2>Рейтинг за зовнішнім індексом</h2>
    <p class="lead">Зважена оцінка вітрин за набором параметрів (золотий стандарт, довіра, каталог, мобільні та ін.).</p>
    <table><thead><tr><th>#</th><th>Сайт</th><th>Індекс</th><th></th></tr></thead><tbody>${rankRows}</tbody></table></section>`;

  const paramRows = b.params.map((p) => `<tr>
    <td class="pm-name">${esc(p.name)}</td>
    <td class="pm-c ${scoreColor(p.client)}">${p.client}</td>
    <td class="pm-m">${p.marketMax}</td>
    <td class="pm-e">100</td>
    <td class="pm-pos ${POS_CLS[p.position]}">${POS_WORD[p.position]}</td>
  </tr>`).join('');
  const paramRadar = b.params.length >= 3 ? `<div class="chart-wrap">${svgRadar(b.params.map((p) => ({ axis: p.name, value: p.client })), { max: 100, title: 'Профіль клієнта за параметрами (0–100)' })}
    <p class="chart-cap">Форма показує, за якими параметрами вітрина веде, а за якими просідає. Значення ринку (найкращий конкурент) та еталона — у таблиці нижче.<sup class="fn">1</sup></p></div>` : '';
  const params = `<section class="block"><h2>Клієнт проти ринку за параметрами</h2>
    <p class="lead">Клієнт — значення клієнта; Ринок — найкращий із конкурентів; Еталон — 100. Висновок — позиція клієнта.</p>
    ${paramRadar}
    <table><thead><tr><th>Параметр</th><th>Клієнт</th><th>Ринок</th><th>Еталон</th><th>Висновок</th></tr></thead><tbody>${paramRows}</tbody></table>
    <p class="fn-note"><sup>1</sup> Радар будується за значенням клієнта (шкала 0–100, еталон = 100). Порівнюються лише публічні ознаки вітрин; трафік та економіка конкурентів зовнішньому аудиту не видні.</p></section>`;

  const ws = b.whiteSpace.length ? `<section class="block"><h2>Вільна ніша (white space)</h2>
    <p class="lead">Параметри, слабкі в усіх на ринку — тут можна вирватися вперед без гонки.</p>
    <ul>${b.whiteSpace.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';

  // ── Консалтинговый каркас ──
  const meth = methodologySection({
    goal: 'Визначити позицію клієнта відносно ринку за зовнішніми ознаками вітрини: де ведемо, де відстаємо, де на ринку вільна ніша.',
    sources: [`Обхід клієнта й ${b.totalSites - 1} конкурентів тим самим рушієм перевірок`, `Ваги індексу (опубліковані, сума = 100%): ${b.params.map((p) => p.name).join(', ')} — склад і вага кожного параметра наведені в таблиці нижче`],
    scope: `${b.params.length} параметрів порівняння · ${b.totalSites} сайтів · єдина шкала (еталон = 100).`,
    limits: `Порівнюються лише публічні ознаки вітрин; трафік та економіка конкурентів не видні. ${b.totalSites < 5 ? `Вибірка з ${b.totalSites} сайтів статистично мала: висновки читаються як «у вибірці», не як «на ринку».` : ''}`,
  });
  const behindRows = b.params.filter((p) => p.position === 'behind');
  const strengths = [
    ...(b.clientRank === 1 ? [`Перше місце у вибірці з ${b.totalSites} сайтів (${b.clientIndex}/100)${b.totalSites < 5 ? ' — висновок про ринок потребує розширення вибірки' : ' — вітрина задає стандарт'}`] : []),
    ...b.params.filter((p) => p.position === 'lead').map((p) => `${p.name}: ${p.client} проти найкращих ${p.marketMax} у ринку — параметр-опора`),
  ];
  const weaknesses = behindRows.map((p) => `${p.name}: ${p.client} проти ${p.marketMax} у найкращого конкурента — ринок тут задає очікування, якому вітрина не відповідає`);
  const recs: SectionRec[] = [
    ...behindRows.slice(0, 4).map((p, i): SectionRec => ({ pr: i < 2 ? 'P0' : 'P1', action: `Закрити відставання «${p.name}» до рівня найкращого на ринку (${p.marketMax})`, effect: 'Знімає причину вибору конкурента у порівнянні вітрин' })),
    ...b.whiteSpace.slice(0, 2).map((x): SectionRec => ({ pr: 'P2', action: `Зайняти вільну нішу: ${x}`, effect: 'Параметр слабкий в усіх — перевага без гонки' })),
  ];
  const concl = conclusionSection([
    `Позиція клієнта — ${b.clientRank} з ${b.totalSites} з індексом ${b.clientIndex}/100. ${b.clientRank === 1 ? 'Лідерство за зовнішніми ознаками — актив, але воно виміряне за вітринами: стійкість лідерства перевіряється трафіком і економікою.' : `Розрив із лідером зосереджений у ${behindRows.length} параметрах — це конкретний, скінченний список, а не «все погано».`}`,
    b.whiteSpace.length
      ? `Вільна ніша: ${b.whiteSpace.join('; ')}. Це параметри, слабкі в усіх учасників вибірки — вкладення тут дає відмінність, яку конкуренти не зможуть швидко скопіювати, бо їм доведеться починати з нуля.`
      : 'Вільних ніш у вибірці не виявлено: ринок щільний, вигравати доведеться виконанням, а не порожніми клітинами.',
    'Порівняння статичне (зріз на дату) і зовнішнє. Повторний замір після впровадження рекомендацій покаже динаміку позиції; економіка конкурентів залишається поза досяжністю і не імітується.',
  ], 'Розширений аудит із конкурентами: регулярний бенчмарк (раз на квартал) + аналіз трафіку конкурентів зовнішніми сервісами — позиція перетворюється з фото на кіно.');

  const summary = `<section class="block"><h2>Підсумок</h2>
    <div class="concl-grid" style="font-size:10.5px">
      <span class="k ok">Ведемо</span><span class="v">${b.clientLeads.length ? esc(b.clientLeads.join(', ')) : '—'}</span>
      <span class="k gap">Відстаємо</span><span class="v">${b.clientBehind.length ? esc(b.clientBehind.join(', ')) : '—'}</span>
    </div></section>`;
  const foot = pageFooter('Зовнішній аудит вітрини: лише публічні зовнішні ознаки. Відсутність даних не видається за факт і не приховується; performance та економіка конкурентів — поза зовнішнім аудитом.');

  const extra = `.r-pos{color:var(--muted);width:20px;} .r-name{font-weight:700;} .r-idx{font-weight:800;text-align:right;} tr.me{background:var(--soft);}
    .pm-name{font-weight:600;} .pm-c,.pm-m,.pm-e{font-weight:800;text-align:center;width:52px;} .pm-m,.pm-e{color:var(--muted);} .pm-pos{font-weight:700;white-space:nowrap;}`;
  return doc(`Конкурентний аналіз · ${client}`, coverHtml + meth + ranking + params + ws + swSection(strengths, weaknesses) + recsSection(recs) + concl + summary + foot, extra);
}
