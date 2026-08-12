/**
 * Клиентский документ «Премиум-экспертиза»: что сделали внешние профильные агенты —
 * какие запущены, какие пропущены (и почему), сколько находок добавили и сколько
 * базовых находок перепроверили. Показывает ценность премиум-слоя прозрачно.
 */
import { doc, esc, methodologySection, conclusionSection } from './reportShell.js';
import type { ExpertResult } from '../experts/types.js';

export function renderPremiumHtml(client: string, takenAt: string, results: ExpertResult[]): string {
  const ran = results.filter((r) => r.ran);
  const skipped = results.filter((r) => !r.ran);
  const newFindings = results.reduce((s, r) => s + r.findings.length, 0);
  const verifs = results.reduce((s, r) => s + r.verifications.length, 0);

  const rows = results.map((r) => `<tr>
    <td class="e-name"><b>${esc(r.name)}</b><div class="e-dom">${esc(r.domain)}</div></td>
    <td>${r.ran ? '<span class="chip done">запущен</span>' : '<span class="chip blocked">пропущен</span>'}</td>
    <td class="e-sum">${esc(r.summary)}${r.skippedReason ? `<div class="e-skip">${esc(r.skippedReason)}</div>` : ''}</td>
    <td class="num">${r.findings.length || '—'}</td>
    <td class="num">${r.verifications.length || '—'}</td>
  </tr>`).join('');

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Премиум-экспертиза</div>
    <h1>Углублённая экспертиза внешними агентами</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(new Date(takenAt).toLocaleDateString('ru-RU'))}</span></div>
      <div><span class="lbl">Агентов запущено</span><span class="val">${ran.length}/${results.length}</span></div>
      <div><span class="lbl">Находок добавлено</span><span class="val">+${newFindings}</span></div>
      <div><span class="lbl">Перепроверок</span><span class="val">${verifs}</span></div>
    </div>
    <div class="coverage">Премиум-экспертиза — отдельный слой поверх базового аудита: внешние профильные агенты перепроверяют, дополняют и углубляют находки. Всё вливается в единый реестр с общим ID, уверенностью, деньгами и приоритетом — это не параллельный отчёт, а усиление той же машины.</div>
  </div></section>`;

  const method = methodologySection({
    goal: 'Усилить базовый аудит внешней профильной экспертизой: перепроверить находки, добавить глубину там, где внешнего обхода недостаточно, и повысить детализацию.',
    sources: ['Внешние специализированные агенты (SEO-факты, GEO/AI-видимость, конкуренты, реклама, глубокий технический краул, репутация)', 'Встроенная кросс-верификация находок'],
    scope: `${results.length} агентов в каталоге; запущены доступные в этом прогоне.`,
    limits: 'Агент без подключённого доступа честно пропускается с причиной (нужен коннектор/ключ) — прогон не падает, базовый аудит не затронут. Подключение доступов активирует агента без изменения кода.',
    standards: ['Находки агентов вливаются в единый реестр (общий ID, дедуп, деньги, приоритет)', 'Перепроверки корректируют уверенность существующих находок, а не создают дубли', 'Прозрачность: показано, кто запущен, кто пропущен и почему'],
  });

  const table = `<section class="block"><h2>Что сделали агенты</h2>
    <table><thead><tr><th>Агент · зона</th><th>Статус</th><th>Результат</th><th>Находок</th><th>Перепроверок</th></tr></thead><tbody>${rows}</tbody></table></section>`;

  const nextAgents = skipped.filter((r) => /нужен доступ|коннектор/.test(r.skippedReason ?? ''));
  const concl = conclusionSection([
    `Запущено ${ran.length} из ${results.length} агентов: добавлено ${newFindings} находок и выполнено ${verifs} перепроверок базовых находок. Все результаты уже учтены в реестре находок и сводном беклоге — приоритеты и деньги пересчитаны с их учётом.`,
    skipped.length
      ? `Пропущено ${skipped.length} агентов${nextAgents.length ? `, из них ${nextAgents.length} готовы к работе сразу после подключения доступа (${nextAgents.slice(0, 3).map((r) => r.name.toLowerCase()).join('; ')})` : ''}. Подключение расширяет глубину без изменения кода.`
      : 'Все агенты каталога отработали.',
  ], nextAgents.length ? `Подключить доступы к агентам (${nextAgents.map((r) => r.name.toLowerCase()).join('; ')}) — и повторить премиум-прогон для максимальной глубины.` : undefined);

  const extraCss = `.e-name .e-dom{color:var(--muted);font-size:8px;text-transform:uppercase;letter-spacing:.4px;margin-top:1px;}
    .e-sum{font-size:9.5px;} .e-sum .e-skip{color:var(--muted);font-size:8.5px;margin-top:2px;}
    .num{text-align:center;font-variant-numeric:tabular-nums;}`;

  return doc(`Премиум-экспертиза · ${client}`, cover + method + table + concl, extraCss);
}
