/**
 * Технический внешний аудит A0 — клиентский PDF на общем визуальном стандарте.
 * Категории со статусом, таблица проверок, честная пометка BLOCKED (нужен
 * инструмент/доступ на A1).
 */
import { esc, dimBadges, scoreColor, doc } from './reportShell.js';
import type { TechReport, TStatus } from '../techaudit.js';

const MARK: Record<TStatus, string> = { ok: '✓', check: '◐', gap: '✕', blocked: '⛔' };
const CLS: Record<TStatus, string> = { ok: 'ok', check: 'check', gap: 'gap', blocked: 'check' };
const WORD: Record<TStatus, string> = { ok: 'ок', check: 'проверить', gap: 'нет', blocked: 'нужен доступ' };

export function renderTechAuditHtml(r: TechReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Технический внешний аудит · слой A0</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Тир</span><span class="val">A0</span></div>
    </div>
    <div class="cov-score"><div class="big ${scoreColor(r.score.pct)}">${r.score.pct}<span>%</span></div><div class="big-cap">технических проверок пройдено · ${r.score.passed}/${r.score.total}</div></div>
    <div class="coverage"><b>Что видно на A0:</b> проверки выполняются по отрендеренному DOM разобранных страниц (внешний обход).
    ${r.blocked.length ? `Не измеримо внешними средствами и вынесено на A1: ${esc(r.blocked.join(', '))}.` : ''} Отсутствие данных не выдаётся за факт (A0 §15.7).</div>
  </div></section>`;

  const cats = r.categories.map((c) => {
    const rows = c.checks.map((ch) => `<tr>
      <td class="c-name">${esc(ch.label)}</td>
      <td class="c-st ${CLS[ch.status]}"><span class="st ${CLS[ch.status]}">${MARK[ch.status]}</span> ${WORD[ch.status]}</td>
      <td class="c-note">${esc(ch.note)}</td>
      <td class="c-rec">${esc(ch.rec)}</td>
    </tr>`).join('');
    return `<section class="block">
      <h2><span class="st ${CLS[c.status]}">${MARK[c.status]}</span> ${esc(c.title)} <span class="cat-dims">${dimBadges(c.dims)}</span></h2>
      <table><thead><tr><th>Проверка</th><th>Статус</th><th>Данные</th><th>Рекомендация</th></tr></thead><tbody>${rows}</tbody></table>
    </section>`;
  }).join('');

  const footer = `<section class="block"><h2>Что дальше</h2>
    <p class="lead">На A1 добавляются измерения, недоступные внешне: Core Web Vitals (PageSpeed/CrUX), заголовки безопасности сервера, полный технический crawl и лог-анализ индексации.</p>
    <div class="footer">Commerce OS · Технический внешний аудит A0 · ${esc(r.client)} · ${esc(date)}. Слой A0: внешний обход. Отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7); BLOCKED-проверки закрываются на A1 инструментом/доступом.</div></section>`;

  const extra = `.c-name{font-weight:600;white-space:nowrap;} .c-st{white-space:nowrap;font-size:9.5px;} .c-note{color:var(--muted);font-size:10px;white-space:nowrap;} .c-rec{color:#333;}
    .st{font-size:12px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);} .cat-dims{font-weight:400;}`;
  return doc(`Технический аудит A0 · ${r.client}`, cover + cats + footer, extra);
}
