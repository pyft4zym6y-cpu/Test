/**
 * Commerce Intelligence Audit A0 — флагманский клиентский PDF: реконструкция
 * бизнеса из сайта. Обложка с уровнем зрелости 1–5, карта бизнес-модели,
 * матрица слоёв по группам (наблюдаем → дедукция → проверить → решение),
 * цепочки дедукции, лестница зрелости, точки роста. Стандарт A0 (reportShell).
 */
import { esc, doc } from './reportShell.js';
import type { CIReport, CILayer, CIStatus } from '../intelligence.js';

const ST_CLS: Record<CIStatus, string> = { observed: 'ok', deduced: 'check', 'needs-data': 'gap' };
const ST_WORD: Record<CIStatus, string> = { observed: 'наблюдение', deduced: 'дедукция', 'needs-data': 'нужны данные' };

export function renderIntelligenceHtml(r: CIReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const lvlCls = r.maturity.level >= 4 ? 'ok' : r.maturity.level >= 3 ? 'check' : 'gap';

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Commerce Intelligence Audit · слой A0</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Платформа</span><span class="val">${esc(r.config.platform)}</span></div>
    </div>
    <div class="cov-score"><div class="big ${lvlCls}">${r.maturity.level}<span>/5</span></div><div class="big-cap">уровень зрелости · «${esc(r.maturity.name)}»</div></div>
    <div class="coverage"><b>Что это.</b> Сайт — источник данных для реконструкции бизнеса: модель → клиент → продукт → коммерция → маркетинг → технологии → операции → расширение → рост. Каждый слой — цепочка «наблюдаем → дедуцируем → проверить данными → решение». Дедукция ≠ факт: помечена и закрывается данными на A1–A2. Отсутствие данных не выдаётся за факт (A0 §15.7).</div>
  </div></section>`;

  const cfg = `<section class="block"><h2>Реконструкция бизнес-модели</h2>
    <table><tbody>
      <tr><th>Тип бизнеса (гипотеза)</th><td>${esc(r.config.businessType)}</td></tr>
      <tr><th>Платформа</th><td>${esc(r.config.platform)}</td></tr>
      <tr><th>Аналитика</th><td>${esc(r.config.analytics)}</td></tr>
      <tr><th>Дерево сайта</th><td>${r.config.treeSize} URL · ~${r.config.products} товаров · ${r.config.categories} категорий</td></tr>
      <tr><th>Языки/рынки</th><td>${esc(r.config.langs.join(', ') || 'один язык')}</td></tr>
      <tr><th>Основание зрелости</th><td>${esc(r.maturity.basis)}</td></tr>
    </tbody></table></section>`;

  const groups = Array.from(new Set(r.layers.map((l) => l.group)));
  const layerSections = groups.map((g) => {
    const rows = r.layers.filter((l) => l.group === g).map((l: CILayer) => `<tr>
      <td class="ci-name">${esc(l.name)}<span class="ci-st ${ST_CLS[l.status]}">${ST_WORD[l.status]} · ${l.evidence}</span></td>
      <td class="ci-obs">${esc(l.observed)}</td>
      <td class="ci-ded">${esc(l.deduced)}</td>
      <td class="ci-ver">${esc(l.verify)}</td>
      <td class="ci-dec">${esc(l.decision)}</td>
    </tr>`).join('');
    return `<section class="block"><h2>${esc(g)}</h2>
      <table><thead><tr><th>Слой</th><th>Наблюдаем</th><th>Дедукция</th><th>Проверить (A1–A2)</th><th>Решение</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join('');

  const chains = `<section class="block page"><h2>Цепочки дедукции: от наблюдения к действию</h2>
    <p class="lead">Обратная дедукция: что видим → какую бизнес-проблему это может означать → чем проверить → возможный эффект → что делать.</p>
    ${r.chains.map((c, i) => `<div class="chain">
      <div class="ch-n">${i + 1}</div>
      <div class="ch-steps">
        <div class="ch-step"><span class="ch-k">Наблюдаем</span>${esc(c.observed)}</div>
        <div class="ch-step warn"><span class="ch-k">Может означать</span>${esc(c.implies)}</div>
        <div class="ch-step"><span class="ch-k">Проверить</span>${esc(c.verify)}</div>
        <div class="ch-step"><span class="ch-k">Возможный эффект</span>${esc(c.impact)}</div>
        <div class="ch-step act"><span class="ch-k">Действие</span>${esc(c.action)}</div>
      </div>
    </div>`).join('')}</section>`;

  const ladder = `<section class="block"><h2>Лестница зрелости e-commerce</h2>
    <div class="ladder">${r.maturity.ladder.map((l) => `<div class="rung ${l.has ? 'has' : ''} ${l.level === r.maturity.level ? 'cur' : ''}">
      <b>${l.level}</b><span>${esc(l.name)}</span></div>`).join('')}</div>
    <p class="lead">Текущий уровень — ${r.maturity.level}: «${esc(r.maturity.name)}». Следующая ступень определяет фокус программы.</p></section>`;

  const opps = `<section class="block"><h2>Точки роста (кандидаты в scope)</h2>
    <ol>${r.opportunities.map((o) => `<li>${esc(o)}</li>`).join('')}</ol>
    <div class="footer">Commerce OS · Commerce Intelligence Audit A0 · ${esc(r.client)} · ${esc(date)}. Слой A0: внешний срез; дедукции — гипотезы с указанным способом проверки. Отсутствие данных не выдаётся за факт и не скрывается (A0 §15.7).</div></section>`;

  const extra = `
    .ci-name{font-weight:700;white-space:nowrap;font-size:10px;} .ci-name .ci-st{display:block;font-weight:600;font-size:7.5px;text-transform:uppercase;letter-spacing:.3px;}
    .ci-obs,.ci-ded,.ci-ver,.ci-dec{font-size:9.5px;color:#222;} .ci-ded{color:#7a4a00;} .ci-ver{color:var(--muted);} .ci-dec{font-weight:600;}
    .chain{display:flex;gap:10px;margin:10px 0;page-break-inside:avoid;}
    .ch-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
    .ch-steps{flex:1;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;}
    .ch-step{background:var(--soft);border:1px solid var(--line);border-radius:6px;padding:6px 8px;font-size:9px;color:#222;}
    .ch-step.warn{border-color:var(--check);} .ch-step.act{border-color:var(--ok);background:#f2fbf5;font-weight:600;}
    .ch-k{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin-bottom:2px;font-weight:700;}
    .ladder{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:8px 0;}
    .rung{border:1px solid var(--line);border-radius:6px;padding:8px;text-align:center;color:var(--muted);}
    .rung b{display:block;font-size:16px;} .rung span{font-size:8.5px;line-height:1.2;display:block;}
    .rung.has{border-color:var(--ok);color:var(--ink);} .rung.cur{background:var(--ink);color:#fff;border-color:var(--ink);}
    ol{margin:4px 0;padding-left:18px;} ol li{margin:3px 0;}`;
  return doc(`Commerce Intelligence Audit A0 · ${r.client}`, cover + cfg + layerSections + chains + ladder + opps, extra);
}
