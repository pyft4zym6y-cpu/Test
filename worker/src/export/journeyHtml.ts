/**
 * Карта шляху клієнта — клієнтський PDF: протокол фактичного проходження
 * шляху покупця (вхід → пошук → каталог → картка → кошик → оформлення +
 * тупикові сценарії) з еталонним очікуванням на кожному кроці.
 */
import { esc, dimBadges, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import { svgDonut } from './charts.js';
import type { JourneyReport, JourneyStep, StepStatus } from '../journey.js';

const CLS: Record<StepStatus, string> = { 'пройден': 'ok', 'спотыкание': 'check', 'тупик': 'gap', 'не найден': 'check', 'не проверялся': 'na' };
const MARK: Record<StepStatus, string> = { 'пройден': '✓', 'спотыкание': '◐', 'тупик': '✕', 'не найден': '○', 'не проверялся': '—' };
/** Україномовне відображення статусу кроку (внутрішній ключ моделі — рос.). */
const WORD: Record<StepStatus, string> = { 'пройден': 'пройдено', 'спотыкание': 'спотикання', 'тупик': 'глухий кут', 'не найден': 'не знайдено', 'не проверялся': 'не перевірявся' };

export function renderJourneyHtml(r: JourneyReport): string {
  const coverHtml = cover({
    kicker: 'Карта шляху клієнта',
    title: 'Карта шляху клієнта',
    verdict: r.verdict, // вивід — окремим рядком, а не гігантським заголовком
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Кроків пройдено', value: `${r.passed}/${r.steps.length}` },
    ],
    note: `<b>Що це.</b> Система пройшла шлях покупця руками: відкрила сайт, шукала товар, відкрила каталог і картку, поклала товар у кошик та обране, дійшла до форми замовлення (не оформлюючи його) і перевірила тупикові сценарії. Кожен крок — дія, еталонне очікування, фактичний результат.`,
  });

  const meth = methodologySection({
    goal: 'Перевірити фактичну прохідність шляху покупця: де шлях чистий, де тертя, де обрив — до того, як це покажуть втрачені замовлення.',
    sources: ['Автоматизований walk-through реальним браузером (десктоп 1366×900)', 'Еталонні очікування за кроками шляху (Baymard: оформлення 12–14 елементів форми, гостьове замовлення; NN/g: запобігання помилкам)', 'Тупикові сценарії: порожня видача, неіснуюча сторінка'],
    scope: `${r.steps.length} кроків основного сценарію покупки + стрес-сценарії. Статуси: пройдено / спотикання / глухий кут / механіка не знайдена.`,
    limits: 'Один цільовий сценарій на десктопі, замовлення не оформлюється і не оплачується. Мобільний прохід, оплата, авторизовані сценарії та звірка з фактичною воронкою GA4 — після передачі доступів (наступний етап).',
  });

  const rows = r.steps.map((s: JourneyStep) => `<tr class="jr-${CLS[s.status]}">
    <td class="j-n">${s.n}</td>
    <td class="j-stage">${esc(s.stage)}</td>
    <td class="j-act">${esc(s.action)}</td>
    <td class="j-exp">${esc(s.expected)}</td>
    <td class="j-res">${esc(s.result)}</td>
    <td class="j-st ${CLS[s.status]}">${MARK[s.status]} ${esc(WORD[s.status])}</td>
    <td>${dimBadges(s.dims)}</td>
  </tr>`).join('');
  const table = `<section class="block"><h2>Протокол проходження шляху</h2>
    <p class="lead">Крок за кроком: що зробили → що має статися за еталоном → що сталося фактично.</p>
    <table><thead><tr><th>#</th><th>Етап</th><th>Дія</th><th>Еталонне очікування</th><th>Фактичний результат</th><th>Статус</th><th>Вим.</th></tr></thead><tbody>${rows}</tbody></table></section>`;

  const checked = r.steps.filter((s) => s.status !== 'не проверялся');
  const cnt = (st: StepStatus) => checked.filter((s) => s.status === st).length;
  const distSegs = [
    { label: 'Пройдено', value: cnt('пройден'), color: '#16a34a' },
    { label: 'Спотикання', value: cnt('спотыкание'), color: '#d97706' },
    { label: 'Не знайдено', value: cnt('не найден'), color: '#0F9488' },
    { label: 'Глухий кут', value: cnt('тупик'), color: '#dc2626' },
  ].filter((s) => s.value > 0);
  const dist = distSegs.length ? `<div class="chart-wrap">${svgDonut(distSegs, { title: 'Розподіл кроків шляху за статусом', centerLabel: `${r.passed}/${checked.length}` })}</div>` : '';
  const flow = `<section class="block"><h2>Воронка шляху: де рветься</h2>
    <div class="jflow">${checked.map((s) => `<div class="jf ${CLS[s.status]}"><b>${MARK[s.status]}</b><span>${esc(s.stage)}</span></div>`).join('<i class="jf-a">→</i>')}</div>
    <p class="lead">Кожен крок оплачено трафіком попередніх: обрив наприкінці шляху коштує дорожче за обрив на початку.<sup class="fn">1</sup></p>
    ${dist}
    <p class="fn-note"><sup>1</sup> Статус кроку — результат фактичного відтворення дії браузером на дату аудиту. Збої класифікуються за джерелом (дефект вітрини / обмеження тесту / мережа); у воронку як «глухий кут» потрапляють лише підтверджені дефекти вітрини, а не помилки середовища тесту.</p></section>`;

  const concl = conclusionSection(r.conclusion, 'Наступний етап: мобільний прохід + тест оплати + звірка кожного кроку з фактичною воронкою GA4 (де за даними втрачається найбільше).');
  const foot = pageFooter('Протокол автоматизованого проходження на дату аудиту; замовлення не оформлювалося. Відсутність даних не видається за факт і не приховується.');

  const extra = `.j-n{color:var(--muted);width:16px;} .j-stage{font-weight:800;white-space:nowrap;}
    .j-act,.j-exp,.j-res{font-size:9px;color:#333;} .j-exp{color:var(--muted);}
    .j-st{font-weight:800;white-space:nowrap;font-size:9px;} .j-st.ok{color:var(--ok);} .j-st.check{color:var(--check);} .j-st.gap{color:var(--gap);} .j-st.na{color:var(--muted);}
    tr.jr-gap .j-res{color:var(--gap);font-weight:600;}
    .jflow{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:8px 0;}
    .jf{display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:16px;padding:4px 10px;font-size:9px;font-weight:700;background:var(--soft);}
    .jf.ok{border-color:var(--ok);} .jf.ok b{color:var(--ok);} .jf.check{border-color:var(--check);background:#fffaf2;} .jf.check b{color:var(--check);}
    .jf.gap{border-color:var(--gap);background:#fff5f5;color:var(--gap);} .jf.gap b{color:var(--gap);}
    .jf-a{color:var(--muted);font-style:normal;font-weight:700;}`;
  return doc(`Карта шляху клієнта · ${r.client}`, coverHtml + meth + flow + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + concl + foot, extra);
}
