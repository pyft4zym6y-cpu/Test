/**
 * Маркетинговые механики A0 — клиентский PDF: реестр 34 механик в 5 контурах
 * (средний чек / удержание / конверсия / доверие / охват) со статусом,
 * внешним сигналом и эффектом + консалтинговый каркас.
 */
import { esc, dimBadges, doc, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import type { MechanicsReport, MechRow, MechStatus } from '../mechanics.js';

const CLS: Record<MechStatus, string> = { 'есть': 'ok', 'нет': 'gap', 'проверить': 'check', 'не видно снаружи': 'na' };
const MARK: Record<MechStatus, string> = { 'есть': '✓', 'нет': '✕', 'проверить': '◐', 'не видно снаружи': '◌' };

export function renderMechanicsHtml(r: MechanicsReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Маркетинговые механики · внешний аудит витрины</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Активно механик</span><span class="val">${r.score.have}/${r.score.measurable}</span></div>
    </div>
    <div class="cov-score"><div class="big ${r.score.pct >= 60 ? 'ok' : r.score.pct >= 35 ? 'check' : 'gap'}">${r.score.pct}<span>%</span></div><div class="big-cap">измеримых снаружи механик активно</div></div>
    <div class="coverage"><b>Что это.</b> Реестр коммерческих механик магазина: средний чек (cross-sell, бандлы, пороги), удержание (баллы, триггеры, wishlist), конверсия (отзывы, рассрочка, чат), доверие и охват. «Не видно снаружи» — механика живёт в email/CRM и проверяется доступами, это не «нет».</div>
  </div></section>`;

  const meth = methodologySection({
    goal: 'Определить, какими коммерческими механиками магазин уже играет, какие простаивают — и какие внедрять первыми, чтобы зарабатывать больше с того же трафика.',
    sources: ['Внешний обход: блоки страниц, текстовые сигналы, виджеты', 'Дерево сайта и карта типов страниц (разделы лояльности, сертификатов и т.п.)', 'Технологические сигналы (чаты, трекинг)'],
    scope: `${r.rows.length} механик в ${r.byGroup.length} контурах; каждая — статус, внешний сигнал, эффект, приоритет внедрения.`,
    limits: 'Внешний срез видит витрину, но не email/CRM-контуры: такие механики помечены «не видно снаружи» и подтверждаются после передачи доступов (следующий этап). Эффекты указаны как отраслевые ориентиры — фактический вклад меряется после внедрения.',
  });

  const groupBar = `<section class="block"><h2>Насыщенность контуров</h2>
    <div class="gb">${r.byGroup.map((g) => {
      const p = g.total ? Math.round((g.have / g.total) * 100) : 0;
      return `<div class="gb-i"><div class="gb-t">${esc(g.group)}</div><span class="bar"><i class="fill ${p >= 60 ? 'ok' : p >= 30 ? 'check' : 'gap'}" style="width:${p}%"></i></span><div class="gb-n">${g.have}/${g.total}</div></div>`;
    }).join('')}</div></section>`;

  const groups = Array.from(new Set(r.rows.map((x) => x.group)));
  const tables = groups.map((g) => {
    const rows = r.rows.filter((x) => x.group === g).map((m: MechRow) => `<tr>
      <td class="m-name">${esc(m.name)}<span class="m-what">${esc(m.what)}</span></td>
      <td class="m-st ${CLS[m.status]}">${MARK[m.status]} ${esc(m.status)}</td>
      <td class="m-sig">${esc(m.signal)}</td>
      <td class="m-eff">${esc(m.effect)}</td>
      <td><span class="pr ${m.pr}">${m.pr}</span> ${dimBadges(m.dims)}</td>
    </tr>`).join('');
    return `<section class="block"><h2>${esc(g)}</h2>
      <table><thead><tr><th>Механика</th><th>Статус</th><th>Внешний сигнал</th><th>Эффект</th><th>Приор.</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join('');

  const concl = conclusionSection(r.conclusion, 'Следующий этап: подтвердить «невидимые» контуры (email, CRM, кампании) доступами; внедрение отсутствующих механик — по волнам P0 → P1 → P2 с замером вклада каждой.');
  const foot = `<section class="block"><div class="footer">Commerce OS · Маркетинговые механики · ${esc(r.client)} · ${esc(date)}. Внешний аудит витрины: внешние сигналы витрины. Отсутствие данных не выдаётся за факт и не скрывается.</div></section>`;

  const extra = `.m-name{font-weight:700;font-size:10px;} .m-name .m-what{display:block;font-weight:400;font-size:8.5px;color:var(--muted);}
    .m-st{font-weight:700;white-space:nowrap;font-size:9px;} .m-st.ok{color:var(--ok);} .m-st.gap{color:var(--gap);} .m-st.check{color:var(--check);} .m-st.na{color:var(--muted);}
    .m-sig{font-size:9px;color:#333;} .m-eff{font-size:9px;color:#333;}
    .gb{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;} .gb-t{font-size:9px;font-weight:700;margin-bottom:4px;} .gb-n{font-size:9px;color:var(--muted);margin-top:3px;font-weight:700;}`;
  return doc(`Маркетинговые механики · ${r.client}`, cover + meth + groupBar + tables + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + concl + foot, extra);
}
