/**
 * Клиентский документ «Премиум-экспертиза»: что сделали внешние профильные агенты —
 * какие запущены, какие пропущены (и почему), сколько находок добавили и сколько
 * базовых находок перепроверили. Показывает ценность премиум-слоя прозрачно.
 */
import { doc, esc, cover, methodologySection, conclusionSection } from './reportShell.js';
import type { ExpertResult } from '../experts/types.js';

export function renderPremiumHtml(client: string, _takenAt: string, results: ExpertResult[]): string {
  const ran = results.filter((r) => r.ran);
  const skipped = results.filter((r) => !r.ran);
  const newFindings = results.reduce((s, r) => s + r.findings.length, 0);
  const verifs = results.reduce((s, r) => s + r.verifications.length, 0);

  const rows = results.map((r) => `<tr>
    <td class="e-name"><b>${esc(r.name)}</b><div class="e-dom">${esc(r.domain)}</div></td>
    <td>${r.ran ? '<span class="chip done">запущений</span>' : '<span class="chip blocked">пропущений</span>'}</td>
    <td class="e-sum">${esc(r.summary)}${r.skippedReason ? `<div class="e-skip">${esc(r.skippedReason)}</div>` : ''}</td>
    <td class="num">${r.findings.length || '—'}</td>
    <td class="num">${r.verifications.length || '—'}</td>
  </tr>`).join('');

  const coverHtml = cover({
    kicker: 'Преміум-експертиза',
    title: 'Поглиблена експертиза зовнішніми агентами',
    metrics: [
      { label: 'Клієнт', value: client },
      { label: 'Агентів запущено', value: `${ran.length}/${results.length}` },
      { label: 'Знахідок додано', value: `+${newFindings}` },
      { label: 'Перевірок', value: String(verifs) },
    ],
    note: 'Преміум-експертиза — окремий шар поверх базового аудиту: зовнішні профільні агенти перевіряють, доповнюють і поглиблюють знахідки. Усе вливається в єдиний реєстр зі спільним ID, впевненістю, грошима та пріоритетом — це не паралельний звіт, а посилення тієї самої машини.',
  });

  const method = methodologySection({
    goal: 'Посилити базовий аудит зовнішньою профільною експертизою: перевірити знахідки, додати глибину там, де зовнішнього обходу недостатньо, та підвищити деталізацію.',
    sources: ['Зовнішні спеціалізовані агенти (SEO-факти, GEO/AI-видимість, конкуренти, реклама, глибокий технічний краул, репутація)', 'Вбудована крос-верифікація знахідок'],
    scope: `${results.length} агентів у каталозі; запущені доступні в цьому прогоні.`,
    limits: 'Агент без підключеного доступу чесно пропускається з причиною (потрібен конектор/ключ) — прогін не падає, базовий аудит не зачеплений. Підключення доступів активує агента без зміни коду.',
    standards: ['Знахідки агентів вливаються в єдиний реєстр (спільний ID, дедуп, гроші, пріоритет)', 'Перевірки коригують впевненість наявних знахідок, а не створюють дублі', 'Прозорість: показано, хто запущений, хто пропущений і чому'],
  });

  const table = `<section class="block"><h2>Що зробили агенти</h2>
    <table><thead><tr><th>Агент · зона</th><th>Статус</th><th>Результат</th><th>Знахідок</th><th>Перевірок</th></tr></thead><tbody>${rows}</tbody></table></section>`;

  const nextAgents = skipped.filter((r) => /нужен доступ|потрібен доступ|коннектор|конектор/.test(r.skippedReason ?? ''));
  const concl = conclusionSection([
    `Запущено ${ran.length} із ${results.length} агентів: додано ${newFindings} знахідок і виконано ${verifs} перевірок базових знахідок. Усі результати вже враховані в реєстрі знахідок і зведеному беклозі — пріоритети та гроші перераховані з їх урахуванням.`,
    skipped.length
      ? `Пропущено ${skipped.length} агентів${nextAgents.length ? `, з них ${nextAgents.length} готові до роботи одразу після підключення доступу (${nextAgents.slice(0, 3).map((r) => r.name.toLowerCase()).join('; ')})` : ''}. Підключення розширює глибину без зміни коду.`
      : 'Усі агенти каталогу відпрацювали.',
  ], nextAgents.length ? `Підключити доступи до агентів (${nextAgents.map((r) => r.name.toLowerCase()).join('; ')}) — і повторити преміум-прогін для максимальної глибини.` : undefined);

  const extraCss = `.e-name .e-dom{color:var(--muted);font-size:8px;text-transform:uppercase;letter-spacing:.4px;margin-top:1px;}
    .e-sum{font-size:9.5px;} .e-sum .e-skip{color:var(--muted);font-size:8.5px;margin-top:2px;}
    .num{text-align:center;font-variant-numeric:tabular-nums;}`;

  return doc(`Преміум-експертиза · ${client}`, coverHtml + method + table + concl, extraCss);
}
