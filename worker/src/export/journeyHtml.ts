/**
 * Карта пути клиента A0 — клиентский PDF: протокол фактического прохождения
 * пути покупателя (вход → поиск → каталог → карточка → корзина → чекаут +
 * тупиковые сценарии) с эталонным ожиданием на каждом шаге.
 */
import { esc, dimBadges, doc, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import type { JourneyReport, JourneyStep, StepStatus } from '../journey.js';

const CLS: Record<StepStatus, string> = { 'пройден': 'ok', 'спотыкание': 'check', 'тупик': 'gap', 'не найден': 'check', 'не проверялся': 'na' };
const MARK: Record<StepStatus, string> = { 'пройден': '✓', 'спотыкание': '◐', 'тупик': '✕', 'не найден': '○', 'не проверялся': '—' };

export function renderJourneyHtml(r: JourneyReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Карта пути клиента · внешний аудит витрины</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Шагов пройдено</span><span class="val">${r.passed}/${r.steps.length}</span></div>
    </div>
    <div class="coverage"><b>Что это.</b> Система прошла путь покупателя руками: открыла сайт, искала товар, открыла каталог и карточку, положила товар в корзину и избранное, дошла до формы заказа (не оформляя его) и проверила тупиковые сценарии. Каждый шаг — действие, эталонное ожидание, фактический результат.</div>
  </div></section>`;

  const meth = methodologySection({
    goal: 'Проверить фактическую проходимость пути покупателя: где путь чистый, где трение, где обрыв — до того, как это покажут потерянные заказы.',
    sources: ['Автоматизированный walk-through реальным браузером (десктоп 1366×900)', 'Эталонные ожидания по шагам пути (Baymard: чекаут 12–14 элементов формы, гостевой заказ; NN/g: предотвращение ошибок)', 'Тупиковые сценарии: пустая выдача, несуществующая страница'],
    scope: `${r.steps.length} шагов основного сценария покупки + стресс-сценарии. Статусы: пройден / спотыкание / тупик / механика не найдена.`,
    limits: 'Один целевой сценарий на десктопе, заказ не оформляется и не оплачивается. Мобильный проход, оплата, авторизованные сценарии и сверка с фактической воронкой GA4 — после передачи доступов (следующий этап).',
  });

  const rows = r.steps.map((s: JourneyStep) => `<tr class="jr-${CLS[s.status]}">
    <td class="j-n">${s.n}</td>
    <td class="j-stage">${esc(s.stage)}</td>
    <td class="j-act">${esc(s.action)}</td>
    <td class="j-exp">${esc(s.expected)}</td>
    <td class="j-res">${esc(s.result)}</td>
    <td class="j-st ${CLS[s.status]}">${MARK[s.status]} ${esc(s.status)}</td>
    <td>${dimBadges(s.dims)}</td>
  </tr>`).join('');
  const table = `<section class="block"><h2>Протокол прохождения пути</h2>
    <p class="lead">Шаг за шагом: что сделали → что должно произойти по эталону → что произошло фактически.</p>
    <table><thead><tr><th>#</th><th>Этап</th><th>Действие</th><th>Эталонное ожидание</th><th>Фактический результат</th><th>Статус</th><th>Изм.</th></tr></thead><tbody>${rows}</tbody></table></section>`;

  const flow = `<section class="block"><h2>Воронка пути: где рвётся</h2>
    <div class="jflow">${r.steps.filter((s) => s.status !== 'не проверялся').map((s) => `<div class="jf ${CLS[s.status]}"><b>${MARK[s.status]}</b><span>${esc(s.stage)}</span></div>`).join('<i class="jf-a">→</i>')}</div>
    <p class="lead">Каждый шаг оплачен трафиком предыдущих: обрыв в конце пути стоит дороже обрыва в начале.</p></section>`;

  const concl = conclusionSection(r.conclusion, 'Следующий этап: мобильный проход + тест оплаты + сверка каждого шага с фактической воронкой GA4 (где по данным теряется больше всего).');
  const foot = `<section class="block"><div class="footer">Commerce OS · Карта пути клиента · ${esc(r.client)} · ${esc(date)}. Протокол автоматизированного прохождения на дату аудита; заказ не оформлялся. Отсутствие данных не выдаётся за факт и не скрывается.</div></section>`;

  const extra = `.j-n{color:var(--muted);width:16px;} .j-stage{font-weight:800;white-space:nowrap;}
    .j-act,.j-exp,.j-res{font-size:9px;color:#333;} .j-exp{color:var(--muted);}
    .j-st{font-weight:800;white-space:nowrap;font-size:9px;} .j-st.ok{color:var(--ok);} .j-st.check{color:var(--check);} .j-st.gap{color:var(--gap);} .j-st.na{color:var(--muted);}
    tr.jr-gap .j-res{color:var(--gap);font-weight:600;}
    .jflow{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:8px 0;}
    .jf{display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:16px;padding:4px 10px;font-size:9px;font-weight:700;background:var(--soft);}
    .jf.ok{border-color:var(--ok);} .jf.ok b{color:var(--ok);} .jf.check{border-color:var(--check);background:#fffaf2;} .jf.check b{color:var(--check);}
    .jf.gap{border-color:var(--gap);background:#fff5f5;color:var(--gap);} .jf.gap b{color:var(--gap);}
    .jf-a{color:var(--muted);font-style:normal;font-weight:700;}`;
  return doc(`Карта пути клиента · ${r.client}`, cover + meth + flow + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + concl + foot, extra);
}
