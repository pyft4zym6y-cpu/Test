/**
 * Клиентский документ «Реестр находок» — единая приоритизированная база всех находок
 * пакета: общий ID, детерминированная уверенность, Impact×Confidence, revenue exposure,
 * приоритет и «где встречается». Делает единую машину видимой в рабочем документе.
 */
import { doc, esc, methodologySection, conclusionSection } from './reportShell.js';
import type { Finding } from '../registry.js';
import { registrySummary } from '../registry.js';

const fmt = (n: number) => (n ? `${Math.round(n).toLocaleString('ru-RU')} ₴` : '—');

export function renderRegistryHtml(client: string, takenAt: string, findings: Finding[]): string {
  const s = registrySummary(findings);
  const rows = findings.map((f) => `<tr>
    <td class="fid">${esc(f.id)}</td>
    <td><span class="pr ${f.priority}">${f.priority}</span></td>
    <td class="ftitle"><b>${esc(f.title)}</b>${f.gap && f.gap !== f.title ? `<div class="fgap">${esc(f.gap)}</div>` : ''}${f.refs?.length ? `<div class="frefs">${f.refs.map((r) => `<span class="dim">${esc(r)}</span>`).join('')}</div>` : ''}</td>
    <td class="num">${Math.round(f.confidence * 100)}%</td>
    <td class="num">${f.impactConfidence.toFixed(2)}</td>
    <td class="num">${fmt(f.revenueExposure)}</td>
  </tr>`).join('');

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Реестр находок</div>
    <h1>Единый реестр находок</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(new Date(takenAt).toLocaleDateString('ru-RU'))}</span></div>
      <div><span class="lbl">Находок</span><span class="val">${s.total}</span></div>
      <div><span class="lbl">P0 / P1 / P2</span><span class="val">${s.p0} / ${s.p1} / ${s.p2}</span></div>
      <div><span class="lbl">Revenue exposure</span><span class="val">${fmt(s.exposureYear)}/год</span></div>
    </div>
    <div class="coverage">Единая база диагностики: каждая находка из всех отчётов пакета сведена сюда с общим ID, детерминированной уверенностью, влиянием, деньгами и приоритетом. Одна проблема, встречающаяся в нескольких отчётах, — одна строка; колонка «где» показывает, где она фигурирует.</div>
  </div></section>`;

  const method = methodologySection({
    goal: 'Свести находки всех отчётов пакета в одну приоритизированную базу с общими ID, уверенностью, деньгами и приоритетом — чтобы решения принимались по одной таблице, а не по десятку документов.',
    sources: ['UX/UI, Контент, Механики, Путь клиента, Технический, SEO, причинно-следственный анализ', 'Денежная модель — revenue exposure по рычагу воронки'],
    scope: `${s.total} находок из всех отчётов прогона`,
    limits: 'Уверенность и деньги считаются детерминированно из зафиксированных фактов; находки со стороны теста/сети помечены и понижены в уверенности, а не выданы за дефект сайта.',
    standards: [
      'Уверенность = Evidence × Reproducibility × Source × Coverage (произведение измеримых факторов, не экспертная оценка)',
      'Приоритет = Impact × Confidence × Revenue / Cost',
      'Дедуп: одна проблема = один ID независимо от числа отчётов, где она встречается',
    ],
  });

  const table = `<section class="block"><h2>Находки — по приоритету</h2>
    <p class="lead">Сортировка: полоса приоритета → Impact × Confidence × Revenue / Cost. «Уверенность» — детерминированная (Evidence × Reproducibility × Source × Coverage), не экспертная.</p>
    <table><thead><tr><th>ID</th><th>Приор.</th><th>Находка · где встречается</th><th>Уверен.</th><th>Impact×Conf</th><th>Revenue/год</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Находок не зафиксировано.</td></tr>'}</tbody></table></section>`;

  const concl = conclusionSection([
    `В реестре ${s.total} находок: ${s.p0} критичных (P0), ${s.p1} важных (P1), ${s.p2} стратегических (P2). Суммарный revenue exposure ≈ ${fmt(s.exposureYear)}/год — деньги, которых касаются находки (без задваивания между шагами воронки одного рычага).`,
    'Реестр — единая точка правды пакета: сводный беклог, причинно-следственная карта и дорожная карта строятся из него, поэтому приоритеты, деньги и формулировки во всех документах согласованы между собой.',
  ], 'Работать по P0 сверху вниз: каждая строка несёт влияние, уверенность и деньги — этого достаточно, чтобы решить, что делать первым.');

  const extraCss = `.fid{font-weight:800;white-space:nowrap;font-size:10px;}
    .ftitle .fgap{color:var(--muted);font-size:9px;margin-top:2px;}
    .frefs{margin-top:3px;}
    .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;}`;

  return doc(`Реестр находок · ${client}`, cover + method + table + concl, extraCss);
}
