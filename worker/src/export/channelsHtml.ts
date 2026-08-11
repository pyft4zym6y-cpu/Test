/**
 * Аудит каналов A0 — клиентский PDF на общем визуальном стандарте. Внешние
 * сигналы по каналам + честная пометка BLOCKED (нужен доступ к кабинетам на A2).
 */
import { esc, dimBadges, doc, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import type { ChannelsReport, ChStatus } from '../channels.js';

const MARK: Record<ChStatus, string> = { ok: '✓', check: '◐', gap: '✕', blocked: '⛔' };
const CLS: Record<ChStatus, string> = { ok: 'ok', check: 'check', gap: 'gap', blocked: 'check' };
const WORD: Record<ChStatus, string> = { ok: 'есть', check: 'проверить', gap: 'нет', blocked: 'нужен доступ' };

export function renderChannelsHtml(r: ChannelsReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Аудит каналов · слой A0</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Каналов зашито</span><span class="val">${r.wired}/${r.rows.length}</span></div>
    </div>
    <div class="coverage"><b>Что видно на A0:</b> только то, что «зашито» в сайт — трекинг, соцсети, retention-блоки. Фактическая эффективность каналов (платка, email, маркетплейсы) требует доступа к кабинетам и данным — вынесено на A2 (${r.blocked} канала BLOCKED). Отсутствие данных не выдаётся за факт.</div>
  </div></section>`;

  const rows = r.rows.map((ch) => `<tr>
    <td class="ch-name">${esc(ch.channel)}</td>
    <td class="ch-sig">${esc(ch.signal)}</td>
    <td class="ch-st ${CLS[ch.status]}"><span class="st ${CLS[ch.status]}">${MARK[ch.status]}</span> ${WORD[ch.status]}</td>
    <td class="ch-next">${esc(ch.next)}</td>
    <td>${dimBadges(ch.dims)}</td>
  </tr>`).join('');
  const table = `<section class="block"><h2>Каналы: внешние сигналы</h2>
    <p class="lead">Что видно снаружи по каждому каналу и что уточнит следующий уровень доступа.</p>
    <table><thead><tr><th>Канал</th><th>Внешний сигнал</th><th>Статус</th><th>Что даст A1–A2</th><th>Изм.</th></tr></thead><tbody>${rows}</tbody></table></section>`;

  // ── Консалтинговый каркас ──
  const okRows = r.rows.filter((x) => x.status === 'ok');
  const gapRows = r.rows.filter((x) => x.status === 'gap');
  const checkRows = r.rows.filter((x) => x.status === 'check');
  const blockedRows = r.rows.filter((x) => x.status === 'blocked');

  const meth = methodologySection({
    goal: 'Определить, какая инфраструктура привлечения и удержания реально «зашита» в витрину, и какие каналы бизнес не использует вовсе.',
    sources: ['Технологические сигналы обхода (счётчики, пиксели, скрипты)', 'Блоки витрины (подписка, соцсети, retention-механики)', 'robots/sitemap как сигналы органического канала'],
    scope: `${r.rows.length} каналов: аналитика, ретаргетинг, поведенческая, соцсети, email/SMS, органика, платная реклама, маркетплейсы.`,
    limits: 'A0 видит только то, что встроено в сайт. Расходы, ROAS и доля выручки по каналам живут в кабинетах — слой A2. Канал без внешних сигналов ≠ канал не работает, но это повод проверить.',
  });

  const strengths = okRows.map((x) => `${x.channel}: ${x.signal} — инфраструктура канала на месте`);
  const weaknesses = [
    ...gapRows.map((x) => `${x.channel}: ${x.signal} — канал не задействован, это упущенный контур ${/email|удерж/i.test(x.channel) ? 'удержания (самый дешёвый оборот)' : 'привлечения'}`),
    ...checkRows.map((x) => `${x.channel}: ${x.signal} — сигнал неуверенный, требует проверки`),
  ];
  const recs: SectionRec[] = [
    ...gapRows.map((x): SectionRec => ({ pr: /аналитик/i.test(x.channel) ? 'P0' : 'P1', action: x.next.replace(/^A\d:\s*/, ''), effect: `Запускает контур «${x.channel}»` })),
    ...checkRows.slice(0, 3).map((x): SectionRec => ({ pr: 'P2', action: x.next.replace(/^A\d:\s*/, ''), effect: `Подтверждает состояние «${x.channel}»` })),
  ];

  const concl = conclusionSection([
    `Из ${r.rows.length} каналов инфраструктурно готовы ${r.wired}; ${blockedRows.length} измеримы только из кабинетов. ${r.wired >= 5 ? 'Каркас каналов собран: вопрос смещается с «подключить» на «насколько эффективно работает» — а это уже уровень данных A2.' : r.wired >= 3 ? 'Каркас собран частично: часть контуров привлечения и удержания простаивает, то есть бизнес систематически покупает трафик дороже, чем мог бы.' : 'Каналы практически не оснащены: витрина существует изолированно от систем привлечения и удержания.'}`,
    gapRows.length
      ? `Незадействованные контуры: ${gapRows.map((x) => x.channel.toLowerCase()).join(', ')}. ${gapRows.some((x) => /email/i.test(x.channel)) ? 'Отдельно про удержание: без захвата контакта каждая покупка остаётся первой и последней — бизнес платит за одного и того же клиента снова и снова.' : 'Каждый из них — это канал, в котором конкуренты присутствуют, а витрина нет.'}`
      : 'Все измеримые снаружи контуры присутствуют — зрелая конфигурация, дальше проверяется качество настройки по данным.',
    `Оценка эффективности (расходы, ROAS, доля выручки) на этом слое невозможна и не имитируется: ${blockedRows.map((x) => x.channel.toLowerCase()).join(', ')} — закрываются доступами на A2.`,
  ], 'A2: доступ к GA4 и рекламным кабинетам — фактическая экономика каналов, после чего этот отчёт превращается из карты инфраструктуры в карту эффективности.');

  const foot = `<section class="block"><div class="footer">Commerce OS · Аудит каналов A0 · ${esc(r.client)} · ${esc(date)}. Слой A0: внешние сигналы. Отсутствие данных не выдаётся за факт и не скрывается; эффективность каналов закрывается на A2.</div></section>`;

  const extra = `.ch-name{font-weight:700;white-space:nowrap;} .ch-sig{color:#333;} .ch-st{white-space:nowrap;font-size:9.5px;} .ch-next{color:#333;font-size:10px;}
    .st{font-size:12px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}`;
  return doc(`Аудит каналов A0 · ${r.client}`, cover + meth + table + swSection(strengths, weaknesses) + recsSection(recs) + concl + foot, extra);
}
