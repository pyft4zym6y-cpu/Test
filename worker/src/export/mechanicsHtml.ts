/**
 * Маркетингові механіки — клієнтський PDF: реєстр механік у 6 контурах
 * (середній чек / утримання / конверсія / довіра / охоплення / ціноутворення)
 * зі статусом, зовнішнім сигналом та ефектом + консалтинговий каркас.
 */
import { esc, dimBadges, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import { svgDonut } from './charts.js';
import type { MechanicsReport, MechRow, MechStatus } from '../mechanics.js';

const CLS: Record<MechStatus, string> = { 'есть': 'ok', 'нет': 'gap', 'проверить': 'check', 'не видно снаружи': 'na' };
const MARK: Record<MechStatus, string> = { 'есть': '✓', 'нет': '✕', 'проверить': '◐', 'не видно снаружи': '◌' };
/** Україномовне відображення статусу механіки (внутрішній ключ моделі — рос.). */
const WORD: Record<MechStatus, string> = { 'есть': 'є', 'нет': 'немає', 'проверить': 'перевірити', 'не видно снаружи': 'не видно ззовні' };

export function renderMechanicsHtml(r: MechanicsReport): string {
  const coverHtml = cover({
    kicker: 'Маркетингові механіки',
    title: 'Маркетингові механіки',
    verdict: r.verdict, // вивід — окремим рядком, а не гігантським заголовком
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Активно механік', value: `${r.score.have}/${r.score.measurable}` },
    ],
    score: { pct: r.score.pct, cap: 'вимірних ззовні механік активно' },
    note: `<b>Що це.</b> Реєстр комерційних механік магазину: середній чек (cross-sell, бандли, пороги), утримання (бали, тригери, wishlist), конверсія (відгуки, розстрочка, чат), довіра й охоплення. «Не видно ззовні» — механіка живе в email/CRM і перевіряється доступами, це не «немає».`,
  });

  const meth = methodologySection({
    goal: 'Визначити, якими комерційними механіками магазин уже грає, які простоюють — і які впроваджувати першими, щоб заробляти більше з того самого трафіку.',
    sources: ['Зовнішній обхід: блоки сторінок, текстові сигнали, віджети', 'Дерево сайту й карта типів сторінок (розділи лояльності, сертифікатів тощо)', 'Технологічні сигнали (чати, трекінг)'],
    scope: `${r.rows.length} механік у ${r.byGroup.length} контурах; кожна — статус, зовнішній сигнал, ефект, пріоритет впровадження.`,
    limits: 'Зовнішній зріз бачить вітрину, але не email/CRM-контури: такі механіки позначені «не видно ззовні» і підтверджуються після передачі доступів (наступний етап). Ефекти вказано як галузеві орієнтири — фактичний внесок міряється після впровадження.',
  });

  const nOk = r.rows.filter((x) => x.status === 'есть').length;
  const nCheck = r.rows.filter((x) => x.status === 'проверить').length;
  const nGap = r.rows.filter((x) => x.status === 'нет').length;
  const nHidden = r.rows.filter((x) => x.status === 'не видно снаружи').length;
  const mechDonut = r.rows.length ? `<div class="chart-wrap">${svgDonut([
    { label: 'Є', value: nOk, color: '#16a34a' },
    { label: 'Перевірити', value: nCheck, color: '#d97706' },
    { label: 'Немає', value: nGap, color: '#dc2626' },
    { label: 'Не видно ззовні', value: nHidden, color: '#0F9488' },
  ].filter((x) => x.value > 0), { title: 'Механіки за статусом', centerLabel: `${r.score.have}/${r.score.measurable}` })}
    <p class="chart-cap">Зелений — механіка працює; червоний — вимірна ззовні, але не задіяна; бірюзовий — живе в email/CRM і ззовні не видна (це не «немає»). Центр — активних із вимірних ззовні.<sup class="fn">1</sup></p></div>` : '';

  const groupBar = `<section class="block"><h2>Насиченість контурів</h2>
    ${mechDonut}
    <div class="gb">${r.byGroup.map((g) => {
      const p = g.total ? Math.round((g.have / g.total) * 100) : 0;
      return `<div class="gb-i"><div class="gb-t">${esc(g.group)}</div><span class="bar"><i class="fill ${p >= 60 ? 'ok' : p >= 30 ? 'check' : 'gap'}" style="width:${p}%"></i></span><div class="gb-n">${g.have}/${g.total}</div></div>`;
    }).join('')}</div>
    <p class="fn-note"><sup>1</sup> Статус виставлено зовнішньою детекцією (блоки, посилання, тех-сигнали). Знаменник центру — механіки, вимірні ззовні (${r.score.measurable}); механіки email/CRM виключені з відсотка і показані окремим сегментом.</p></section>`;

  const groups = Array.from(new Set(r.rows.map((x) => x.group)));
  const tables = groups.map((g) => {
    const rows = r.rows.filter((x) => x.group === g).map((m: MechRow) => `<tr>
      <td class="m-name">${esc(m.name)}<span class="m-what">${esc(m.what)}</span></td>
      <td class="m-st ${CLS[m.status]}">${MARK[m.status]} ${esc(WORD[m.status])}</td>
      <td class="m-sig">${esc(m.signal)}</td>
      <td class="m-eff">${esc(m.effect)}</td>
      <td><span class="pr ${m.pr}">${m.pr}</span> ${dimBadges(m.dims)}</td>
    </tr>`).join('');
    return `<section class="block"><h2>${esc(g)}</h2>
      <table><thead><tr><th>Механіка</th><th>Статус</th><th>Зовнішній сигнал</th><th>Ефект</th><th>Пріор.</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join('');

  const concl = conclusionSection(r.conclusion, 'Наступний етап: підтвердити «невидимі» контури (email, CRM, кампанії) доступами; впровадження відсутніх механік — за хвилями P0 → P1 → P2 із замірянням внеску кожної.');
  const foot = pageFooter('Зовнішній аудит вітрини: зовнішні сигнали вітрини. Відсутність даних не видається за факт і не приховується.');

  const extra = `.m-name{font-weight:700;font-size:10px;} .m-name .m-what{display:block;font-weight:400;font-size:8.5px;color:var(--muted);}
    .m-st{font-weight:700;white-space:nowrap;font-size:9px;} .m-st.ok{color:var(--ok);} .m-st.gap{color:var(--gap);} .m-st.check{color:var(--check);} .m-st.na{color:var(--muted);}
    .m-sig{font-size:9px;color:#333;} .m-eff{font-size:9px;color:#333;}
    .gb{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;} .gb-t{font-size:9px;font-weight:700;margin-bottom:4px;} .gb-n{font-size:9px;color:var(--muted);margin-top:3px;font-weight:700;}`;
  return doc(`Маркетингові механіки · ${r.client}`, coverHtml + meth + groupBar + tables + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + concl + foot, extra);
}
