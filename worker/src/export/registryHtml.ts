/**
 * Клиентский документ «Реестр находок» — единая приоритизированная база всех находок
 * пакета: общий ID, детерминированная уверенность, Impact×Confidence, revenue exposure,
 * приоритет и «где встречается». Делает единую машину видимой в рабочем документе.
 */
import { doc, esc, cover, methodologySection, conclusionSection } from './reportShell.js';
import { svgBars, svgDonut } from './charts.js';
import type { Finding } from '../registry.js';
import { registrySummary } from '../registry.js';

const fmt = (n: number) => (n ? `${Math.round(n).toLocaleString('ru-RU')} ₴` : '—');

export function renderRegistryHtml(client: string, _takenAt: string, findings: Finding[]): string {
  const s = registrySummary(findings);
  const rows = findings.map((f) => `<tr>
    <td class="fid">${esc(f.id)}</td>
    <td><span class="pr ${f.priority}">${f.priority}</span></td>
    <td class="ftitle"><b>${esc(f.title)}</b>${f.gap && f.gap !== f.title ? `<div class="fgap">${esc(f.gap)}</div>` : ''}${f.refs?.length ? `<div class="frefs">${f.refs.map((r) => `<span class="dim">${esc(r)}</span>`).join('')}</div>` : ''}</td>
    <td class="num">${Math.round(f.confidence * 100)}%</td>
    <td class="num">${f.impactConfidence.toFixed(2)}</td>
    <td class="num">${fmt(f.revenueExposure)}</td>
  </tr>`).join('');

  const coverHtml = cover({
    kicker: 'Єдиний реєстр',
    title: 'Реєстр знахідок',
    metrics: [
      { label: 'Клієнт', value: client },
      { label: 'Знахідок', value: String(s.total) },
      { label: 'P0 / P1 / P2', value: `${s.p0} / ${s.p1} / ${s.p2}` },
      { label: 'Revenue exposure', value: `${fmt(s.exposureYear)}/рік` },
    ],
    note: 'Єдина база діагностики: кожна знахідка з усіх звітів пакета зведена сюди зі спільним ID, детермінованою впевненістю, впливом, грошима та пріоритетом. Одна проблема, що трапляється в кількох звітах, — один рядок; колонка «де» показує, де вона фігурує.',
  });

  const method = methodologySection({
    goal: 'Звести знахідки всіх звітів пакета в одну пріоритизовану базу зі спільними ID, впевненістю, грошима та пріоритетом — щоб рішення ухвалювалися за однією таблицею, а не за десятком документів.',
    sources: ['UX/UI, Контент, Механіки, Шлях клієнта, Технічний, SEO, причинно-наслідковий аналіз', 'Грошова модель — revenue exposure за важелем воронки'],
    scope: `${s.total} знахідок з усіх звітів прогону`,
    limits: 'Впевненість і гроші рахуються детерміновано із зафіксованих фактів; знахідки з боку тесту/мережі позначені та знижені у впевненості, а не видані за дефект сайту.',
    standards: [
      'Впевненість = Evidence × Reproducibility × Source × Coverage (добуток вимірних факторів, не експертна оцінка)',
      'Пріоритет = Impact × Confidence × Revenue / Cost',
      'Дедуп: одна проблема = один ID незалежно від кількості звітів, де вона трапляється',
    ],
  });

  // Топ-10 находок по деньгам — горизонтальные столбцы (тон по приоритету).
  const prTone = (p: string) => (p === 'P0' ? 'gap' : p === 'P1' ? 'check' : undefined);
  const topByMoney = [...findings].filter((f) => f.revenueExposure > 0).sort((a, b) => b.revenueExposure - a.revenueExposure).slice(0, 10);
  const moneyBars = topByMoney.length
    ? `<div class="chart-wrap">${svgBars(topByMoney.map((f) => ({ label: `${f.id} · ${f.title}`, value: Math.round(f.revenueExposure / 1000), tone: prTone(f.priority) })), { title: 'Топ знахідок за revenue exposure (тис. ₴/рік)', unit: 'k' })}
        <p class="chart-cap">Стовпці — річний оборот, якого стосується знахідка; колір — пріоритет (червоний P0, помаранчевий P1). Гроші не подвоюються: сума за важелем ділиться між знахідками пропорційно їхньому внеску.<sup class="fn">1</sup></p></div>`
    : '';
  const prDonut = (s.p0 + s.p1 + s.p2) > 0
    ? `<div class="chart-wrap">${svgDonut([
        { label: 'P0 — критично', value: s.p0, color: '#dc2626' },
        { label: 'P1 — важливо', value: s.p1, color: '#d97706' },
        { label: 'P2 — стратегія', value: s.p2, color: '#64748b' },
      ].filter((x) => x.value > 0), { title: 'Знахідки за пріоритетом', centerLabel: String(s.total) })}</div>`
    : '';
  const table = `<section class="block"><h2>Знахідки — за пріоритетом</h2>
    <p class="lead">Сортування: смуга пріоритету → Impact × Confidence × Revenue / Cost. «Впевненість» — детермінована (Evidence × Reproducibility × Source × Coverage), не експертна.</p>
    ${prDonut}${moneyBars}
    <table><thead><tr><th>ID</th><th>Пріор.</th><th>Знахідка · де трапляється</th><th>Впевн.</th><th>Impact×Conf</th><th>Revenue/рік</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Знахідок не зафіксовано.</td></tr>'}</tbody></table>
    <p class="fn-note"><sup>1</sup> Revenue exposure — верхня межа річного обороту, на який впливає знахідка, атрибутована за важелем грошової моделі; це «скільки на кону», а не гарантований приріст від виправлення.</p></section>`;

  const concl = conclusionSection([
    `У реєстрі ${s.total} знахідок: ${s.p0} критичних (P0), ${s.p1} важливих (P1), ${s.p2} стратегічних (P2). Сумарний revenue exposure ≈ ${fmt(s.exposureYear)}/рік — гроші, яких стосуються знахідки (без подвоєння між кроками воронки одного важеля).`,
    'Реєстр — єдина точка правди пакета: зведений беклог, причинно-наслідкова карта та дорожня карта будуються з нього, тому пріоритети, гроші й формулювання в усіх документах узгоджені між собою.',
  ], 'Працювати за P0 згори донизу: кожен рядок несе вплив, впевненість і гроші — цього достатньо, щоб вирішити, що робити першим.');

  const extraCss = `.fid{font-weight:800;white-space:nowrap;font-size:10px;}
    .ftitle .fgap{color:var(--muted);font-size:9px;margin-top:2px;}
    .frefs{margin-top:3px;}
    .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;}`;

  return doc(`Реєстр знахідок · ${client}`, coverHtml + method + table + concl, extraCss);
}
