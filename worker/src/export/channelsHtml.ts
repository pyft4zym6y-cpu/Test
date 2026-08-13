/**
 * Аудит каналов A0 — клиентский PDF на общем визуальном стандарте. Внешние
 * сигналы по каналам + честная пометка BLOCKED (нужен доступ к кабинетам на A2).
 */
import { esc, dimBadges, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import { svgDonut } from './charts.js';
import type { ChannelsReport, ChStatus } from '../channels.js';

const MARK: Record<ChStatus, string> = { ok: '✓', check: '◐', gap: '✕', blocked: '⛔' };
const CLS: Record<ChStatus, string> = { ok: 'ok', check: 'check', gap: 'gap', blocked: 'check' };
const WORD: Record<ChStatus, string> = { ok: 'є', check: 'перевірити', gap: 'немає', blocked: 'потрібні доступи' };

export function renderChannelsHtml(r: ChannelsReport): string {
  const coverHtml = cover({
    kicker: 'Канали залучення й утримання',
    title: 'Аудит каналів',
    verdict: r.verdict,
    metrics: [{ label: 'Клієнт', value: r.client }, { label: 'Каналів зашито', value: `${r.wired}/${r.rows.length}` }],
    note: `<b>Що видно в зовнішньому аудиті:</b> лише те, що «зашито» у сайт — трекінг, соцмережі, retention-блоки. Фактична ефективність каналів (платна реклама, email, маркетплейси) потребує доступу до кабінетів і даних — після підключення аналітики та рекламних кабінетів (${r.blocked} канали зі статусом «Потрібні доступи»). Відсутність даних не видається за факт.`,
  });

  const rows = r.rows.map((ch) => `<tr>
    <td class="ch-name">${esc(ch.channel)}</td>
    <td class="ch-sig">${esc(ch.signal)}</td>
    <td class="ch-st ${CLS[ch.status]}"><span class="st ${CLS[ch.status]}">${MARK[ch.status]}</span> ${WORD[ch.status]}</td>
    <td class="ch-next">${esc(ch.next)}</td>
    <td>${dimBadges(ch.dims)}</td>
  </tr>`).join('');
  // ── Консалтинговый каркас ──
  const okRows = r.rows.filter((x) => x.status === 'ok');
  const gapRows = r.rows.filter((x) => x.status === 'gap');
  const checkRows = r.rows.filter((x) => x.status === 'check');
  const blockedRows = r.rows.filter((x) => x.status === 'blocked');

  const chDonut = r.rows.length ? `<div class="chart-wrap">${svgDonut([
    { label: 'Зашито', value: okRows.length, color: '#16a34a' },
    { label: 'Перевірити', value: checkRows.length, color: '#d97706' },
    { label: 'Не задіяно', value: gapRows.length, color: '#dc2626' },
    { label: 'Потрібні доступи', value: blockedRows.length, color: '#0F9488' },
  ].filter((x) => x.value > 0), { title: 'Канали за готовністю інфраструктури', centerLabel: `${r.wired}/${r.rows.length}` })}
    <p class="chart-cap">Зелений — контур залучення/утримання вбудований у вітрину; червоний — канал не задіяно (втрачений контур); бірюзовий — ефективність вимірна лише з кабінетів.</p></div>` : '';
  const table = `<section class="block"><h2>Канали: зовнішні сигнали</h2>
    <p class="lead">Що видно ззовні за кожним каналом і що уточнить наступний рівень доступу.</p>
    ${chDonut}
    <table><thead><tr><th>Канал</th><th>Зовнішній сигнал</th><th>Статус</th><th>Що дасть наступний етап</th><th>Вим.</th></tr></thead><tbody>${rows}</tbody></table></section>`;

  const meth = methodologySection({
    goal: 'Визначити, яка інфраструктура залучення й утримання реально «зашита» у вітрину, і які канали бізнес не використовує взагалі.',
    sources: ['Технологічні сигнали обходу (лічильники, пікселі, скрипти)', 'Блоки вітрини (підписка, соцмережі, retention-механіки)', 'robots/sitemap як сигнали органічного каналу'],
    scope: `${r.rows.length} каналів: аналітика, ретаргетинг, поведінкова, соцмережі, email/SMS, органіка, платна реклама, маркетплейси.`,
    limits: 'Зовнішній аудит бачить лише те, що вбудовано в сайт. Витрати, ROAS і частка виручки за каналами живуть у кабінетах — після підключення аналітики та рекламних кабінетів. Канал без зовнішніх сигналів ≠ канал не працює, але це привід перевірити.',
  });

  const strengths = okRows.map((x) => `${x.channel}: ${x.signal} — інфраструктура каналу на місці`);
  const weaknesses = [
    ...gapRows.map((x) => `${x.channel}: ${x.signal} — канал не задіяно, це втрачений контур ${/email|утрим/i.test(x.channel) ? 'утримання (найдешевший оборот)' : 'залучення'}`),
    ...checkRows.map((x) => `${x.channel}: ${x.signal} — сигнал непевний, потребує перевірки`),
  ];
  const recs: SectionRec[] = [
    ...gapRows.map((x): SectionRec => ({ pr: /аналіт/i.test(x.channel) ? 'P0' : 'P1', action: x.next.replace(/^A\d:\s*/, ''), effect: `Запускає контур «${x.channel}»` })),
    ...checkRows.slice(0, 3).map((x): SectionRec => ({ pr: 'P2', action: x.next.replace(/^A\d:\s*/, ''), effect: `Підтверджує стан «${x.channel}»` })),
  ];

  const concl = conclusionSection([
    `З ${r.rows.length} каналів інфраструктурно готові ${r.wired}; ${blockedRows.length} вимірні лише з кабінетів. ${r.wired >= 5 ? 'Каркас каналів зібраний: питання зміщується з «підключити» на «наскільки ефективно працює» — а це вже рівень даних.' : r.wired >= 3 ? 'Каркас зібраний частково: частина контурів залучення й утримання простоює, тобто бізнес систематично купує трафік дорожче, ніж міг би.' : 'Канали практично не оснащені: вітрина існує ізольовано від систем залучення й утримання.'}`,
    gapRows.length
      ? `Незадіяні контури: ${gapRows.map((x) => x.channel.toLowerCase()).join(', ')}. ${gapRows.some((x) => /email/i.test(x.channel)) ? 'Окремо про утримання: без захоплення контакту кожна покупка лишається першою й останньою — бізнес платить за одного й того самого клієнта знову і знову.' : 'Кожен із них — це канал, у якому конкуренти присутні, а вітрина ні.'}`
      : 'Усі вимірні ззовні контури присутні — зріла конфігурація, далі перевіряється якість налаштування за даними.',
    `Оцінка ефективності (витрати, ROAS, частка виручки) на цьому шарі неможлива й не імітується: ${blockedRows.map((x) => x.channel.toLowerCase()).join(', ')} — закриваються доступами після підключення аналітики та рекламних кабінетів.`,
  ], 'Наступний етап: доступ до GA4 і рекламних кабінетів — фактична економіка каналів, після чого цей звіт перетворюється з карти інфраструктури на карту ефективності.');

  const foot = pageFooter('Зовнішні сигнали з обходу вітрини. Відсутність даних не видається за факт і не приховується; ефективність каналів закривається після підключення аналітики та рекламних кабінетів.');

  const extra = `.ch-name{font-weight:700;white-space:nowrap;} .ch-sig{color:#333;} .ch-st{white-space:nowrap;font-size:9.5px;} .ch-next{color:#333;font-size:10px;}
    .st{font-size:12px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}`;
  return doc(`Аудит каналів · ${r.client}`, coverHtml + meth + table + swSection(strengths, weaknesses) + recsSection(recs) + concl + foot, extra);
}
