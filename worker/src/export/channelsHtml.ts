/**
 * Аудит каналов A0 — клиентский PDF на общем визуальном стандарте. Внешние
 * сигналы по каналам + честная пометка BLOCKED (нужен доступ к кабинетам на A2).
 */
import { esc, dimBadges, doc } from './reportShell.js';
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
    <div class="coverage"><b>Что видно на A0:</b> только то, что «зашито» в сайт — трекинг, соцсети, retention-блоки. Фактическая эффективность каналов (платка, email, маркетплейсы) требует доступа к кабинетам и данным — вынесено на A2 (${r.blocked} канала BLOCKED). Отсутствие данных не выдаётся за факт (A0 §15.7).</div>
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

  const foot = `<section class="block"><h2>Что дальше</h2>
    <p class="lead">На A2 подключаются кабинеты (Google/Meta Ads, ESP, маркетплейсы) и аналитика — только там появляется фактическая эффективность каналов: расходы, ROAS, доля выручки по источникам.</p>
    <div class="footer">Commerce OS · Аудит каналов A0 · ${esc(r.client)} · ${esc(date)}. Слой A0: внешние сигналы. Отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7); эффективность каналов закрывается на A2.</div></section>`;

  const extra = `.ch-name{font-weight:700;white-space:nowrap;} .ch-sig{color:#333;} .ch-st{white-space:nowrap;font-size:9.5px;} .ch-next{color:#333;font-size:10px;}
    .st{font-size:12px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);}`;
  return doc(`Аудит каналов A0 · ${r.client}`, cover + table + foot, extra);
}
