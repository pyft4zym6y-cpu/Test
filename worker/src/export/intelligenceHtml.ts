/**
 * Commerce Intelligence Audit A0 — флагманский клиентский PDF: реконструкция
 * бизнеса из сайта. Обложка с уровнем зрелости 1–5, карта бизнес-модели,
 * матрица слоёв по группам (наблюдаем → дедукция → проверить → решение),
 * цепочки дедукции, лестница зрелости, точки роста. Стандарт A0 (reportShell).
 */
import { esc, doc, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import { svgDonut } from './charts.js';
import type { CIReport, CILayer, CIStatus } from '../intelligence.js';

const ST_CLS: Record<CIStatus, string> = { observed: 'ok', deduced: 'check', 'needs-data': 'gap' };
const ST_WORD: Record<CIStatus, string> = { observed: 'наблюдение', deduced: 'дедукция', 'needs-data': 'нужны данные' };

export function renderIntelligenceHtml(r: CIReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const lvlCls = r.maturity.level >= 4 ? 'ok' : r.maturity.level >= 3 ? 'check' : 'gap';

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Commerce Intelligence Audit · внешний аудит витрины</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Платформа</span><span class="val">${esc(r.config.platform)}</span></div>
    </div>
    <div class="cov-score"><div class="big ${lvlCls}">${r.maturity.level}<span>/5</span></div><div class="big-cap">уровень зрелости · «${esc(r.maturity.name)}»</div></div>
    <div class="coverage"><b>Что это.</b> Сайт — источник данных для реконструкции бизнеса: модель → клиент → продукт → коммерция → маркетинг → технологии → операции → расширение → рост. Каждый слой — цепочка «наблюдаем → дедуцируем → проверить данными → решение». Дедукция ≠ факт: помечена и закрывается данными после передачи доступов и подключения аналитики. Отсутствие данных не выдаётся за факт.</div>
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

  const nObs = r.layers.filter((l) => l.status === 'observed').length;
  const nDed = r.layers.filter((l) => l.status === 'deduced').length;
  const nNeed = r.layers.filter((l) => l.status === 'needs-data').length;
  const stackDonut = r.layers.length ? `<section class="block"><h2>Слои бизнес-модели: что доказано, что дедукция</h2>
    <div class="chart-wrap">${svgDonut([
      { label: 'Наблюдение', value: nObs, color: '#16a34a' },
      { label: 'Дедукция', value: nDed, color: '#d97706' },
      { label: 'Нужны данные', value: nNeed, color: '#dc2626' },
    ].filter((x) => x.value > 0), { title: 'Слои интеллект-карты по статусу', centerLabel: `${nObs}/${r.layers.length}` })}
      <p class="chart-cap">Зелёный — слой подтверждён внешним наблюдением; оранжевый — обоснованная дедукция (гипотеза со способом проверки); красный — раскрывается только с доступами.<sup class="fn">1</sup></p></div>
    <p class="fn-note"><sup>1</sup> Дедукция — не факт: у каждого такого слоя в таблицах ниже указан способ проверки. После передачи доступов дедукции переходят в наблюдение, и уверенность карты растёт без перестройки её структуры.</p></section>` : '';

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
      <table><thead><tr><th>Слой</th><th>Наблюдаем</th><th>Дедукция</th><th>Проверить (следующий этап)</th><th>Решение</th></tr></thead><tbody>${rows}</tbody></table></section>`;
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
    <ol>${r.opportunities.map((o) => `<li>${esc(o)}</li>`).join('')}</ol></section>`;

  // ── Консалтинговый каркас ──
  const observed = r.layers.filter((l) => l.status === 'observed');
  const needsData = r.layers.filter((l) => l.status === 'needs-data');
  const meth = methodologySection({
    goal: 'Реконструировать, как устроен e-commerce клиента как бизнес — по одному только сайту: модель, клиент, продукт, коммерция, каналы, технологии, операции, расширение.',
    sources: [`Дерево сайта: ${r.config.treeSize} URL, ~${r.config.products} товаров, ${r.config.categories} категорий`, 'Состав блоков разобранных страниц (обход)', 'Технологические сигналы (платформа, трекинг)'],
    scope: `${r.layers.length} информационных слоёв в 9 группах; каждый слой — цепочка «наблюдаем → дедуцируем → проверить данными → решение».`,
    limits: `Дедукция ≠ факт: во внешнем аудите потолок доказательности — высокая уверенность. ${needsData.length} слоёв невозможно оценить снаружи — они помечены «нужны данные» и не участвуют в выводах. Важно: уровень зрелости здесь — ступень развития БИЗНЕС-МОДЕЛИ (лестница 1–5); в «Матрице зрелости» — управляемость отдельных доменов. Это разные шкалы, их числа и не должны совпадать.`,
  });
  const posLayers = observed.filter((l) => !/не |нет |не обнаружен/i.test(l.observed)).slice(0, 4);
  const strengths = [
    `Уровень зрелости ${r.maturity.level}/5 подтверждён наблюдением: ${r.maturity.basis}`,
    ...posLayers.map((l) => `${l.name}: ${l.observed}`),
  ];
  const weaknesses = [
    ...r.chains.slice(0, 5).map((c) => `${c.observed} → ${c.implies}`),
  ];
  const recs: SectionRec[] = r.chains.slice(0, 6).map((c, i): SectionRec => ({ pr: i < 2 ? 'P0' : i < 4 ? 'P1' : 'P2', action: c.action, effect: c.impact }));
  const nextLevel = Math.min(5, r.maturity.level + 1);
  const concl = conclusionSection([
    `По внешним признакам бизнес — ${r.config.businessType}. Текущая ступень зрелости — ${r.maturity.level}/5 «${r.maturity.name}»: ${r.maturity.level <= 2 ? 'работает механика первой покупки, но системные слои (данные, удержание, масштабирование) не построены — рост сейчас покупается, а не накапливается' : r.maturity.level === 3 ? 'системные механики частично собраны; бизнес готов расти за счёт данных и каналов, но машинный слой (разметка, автоматизация) ещё не опора' : 'платформа зрелая — фокус смещается на эффективность и расширение'}.`,
    `Из ${r.layers.length} слоёв ${observed.length} подтверждены наблюдением, ${r.layers.filter((l) => l.status === 'deduced').length} — обоснованные дедукции, ${needsData.length} требуют данных. Цепочек «наблюдение → проблема → действие» собрано ${r.chains.length}; каждая содержит способ проверки, то есть программа следующего шага уже размечена по данным, которые её подтвердят или снимут.`,
    `Переход на ступень ${nextLevel} («${r.maturity.ladder.find((l) => l.level === nextLevel)?.name ?? ''}») — это и есть стратегическая рамка программы: точки роста выше отобраны как кратчайший путь к ней, а не как список всего хорошего.`,
  ], 'Следующий этап: интервью с собственником + доступы (аналитика, заказы) — дедукции превращаются в подтверждённые факты, и карта бизнеса становится основой коммерческого предложения.');

  const foot = `<section class="block"><div class="footer">Commerce OS · Commerce Intelligence Audit · ${esc(r.client)} · ${esc(date)}. Внешний аудит витрины: внешний срез; дедукции — гипотезы с указанным способом проверки. Отсутствие данных не выдаётся за факт и не скрывается.</div></section>`;

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
  return doc(`Commerce Intelligence Audit · ${r.client}`, cover + meth + cfg + stackDonut + layerSections + chains + ladder + opps + swSection(strengths, weaknesses) + recsSection(recs) + concl + foot, extra);
}
