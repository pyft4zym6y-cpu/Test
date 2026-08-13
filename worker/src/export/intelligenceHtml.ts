/**
 * Commerce Intelligence Audit — флагманский клиентский PDF: реконструкция
 * бизнеса из сайта. Обложка с уровнем зрелости 1–5, карта бизнес-модели,
 * матрица слоёв по группам (наблюдаем → дедукция → проверить → решение),
 * цепочки дедукции, лестница зрелости, точки роста. Единый стандарт reportShell.
 */
import { esc, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import { svgDonut } from './charts.js';
import type { CIReport, CILayer, CIStatus } from '../intelligence.js';

const ST_CLS: Record<CIStatus, string> = { observed: 'ok', deduced: 'check', 'needs-data': 'gap' };
const ST_WORD: Record<CIStatus, string> = { observed: 'спостереження', deduced: 'дедукція', 'needs-data': 'потрібні дані' };

export function renderIntelligenceHtml(r: CIReport): string {
  const coverHtml = cover({
    kicker: 'Commerce Intelligence',
    title: 'Commerce Intelligence',
    verdict: r.verdict,
    metrics: [
      { label: 'Клієнт', value: r.client },
      { label: 'Платформа', value: r.config.platform },
      { label: 'Рівень зрілості', value: `${r.maturity.level}/5 · «${r.maturity.name}»` },
    ],
    note: `<b>Що це.</b> Сайт — джерело даних для реконструкції бізнесу: модель → клієнт → продукт → комерція → маркетинг → технології → операції → розширення → зростання. Кожен шар — ланцюжок «спостерігаємо → дедукуємо → перевірити даними → рішення». Дедукція ≠ факт: помічена й закривається даними після передачі доступів і підключення аналітики. Відсутність даних не видається за факт.`,
  });

  const cfg = `<section class="block"><h2>Реконструкція бізнес-моделі</h2>
    <table><tbody>
      <tr><th>Тип бізнесу (гіпотеза)</th><td>${esc(r.config.businessType)}</td></tr>
      <tr><th>Платформа</th><td>${esc(r.config.platform)}</td></tr>
      <tr><th>Аналітика</th><td>${esc(r.config.analytics)}</td></tr>
      <tr><th>Дерево сайту</th><td>${r.config.treeSize} URL · ~${r.config.products} товарів · ${r.config.categories} категорій</td></tr>
      <tr><th>Мови/ринки</th><td>${esc(r.config.langs.join(', ') || 'одна мова')}</td></tr>
      <tr><th>Підстава зрілості</th><td>${esc(r.maturity.basis)}</td></tr>
    </tbody></table></section>`;

  const nObs = r.layers.filter((l) => l.status === 'observed').length;
  const nDed = r.layers.filter((l) => l.status === 'deduced').length;
  const nNeed = r.layers.filter((l) => l.status === 'needs-data').length;
  const stackDonut = r.layers.length ? `<section class="block"><h2>Шари бізнес-моделі: що доведено, що дедукція</h2>
    <div class="chart-wrap">${svgDonut([
      { label: 'Спостереження', value: nObs, color: '#16a34a' },
      { label: 'Дедукція', value: nDed, color: '#d97706' },
      { label: 'Потрібні дані', value: nNeed, color: '#dc2626' },
    ].filter((x) => x.value > 0), { title: 'Шари інтелект-карти за статусом', centerLabel: `${nObs}/${r.layers.length}` })}
      <p class="chart-cap">Зелений — шар підтверджений зовнішнім спостереженням; помаранчевий — обґрунтована дедукція (гіпотеза зі способом перевірки); червоний — розкривається лише з доступами.<sup class="fn">1</sup></p></div>
    <p class="fn-note"><sup>1</sup> Дедукція — не факт: у кожного такого шару в таблицях нижче вказано спосіб перевірки. Після передачі доступів дедукції переходять у спостереження, і впевненість карти зростає без перебудови її структури.</p></section>` : '';

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
      <table><thead><tr><th>Шар</th><th>Спостерігаємо</th><th>Дедукція</th><th>Перевірити (наступний етап)</th><th>Рішення</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join('');

  const chains = `<section class="block page"><h2>Ланцюжки дедукції: від спостереження до дії</h2>
    <p class="lead">Зворотна дедукція: що бачимо → яку бізнес-проблему це може означати → чим перевірити → можливий ефект → що робити.</p>
    ${r.chains.map((c, i) => `<div class="chain">
      <div class="ch-n">${i + 1}</div>
      <div class="ch-steps">
        <div class="ch-step"><span class="ch-k">Спостерігаємо</span>${esc(c.observed)}</div>
        <div class="ch-step warn"><span class="ch-k">Може означати</span>${esc(c.implies)}</div>
        <div class="ch-step"><span class="ch-k">Перевірити</span>${esc(c.verify)}</div>
        <div class="ch-step"><span class="ch-k">Можливий ефект</span>${esc(c.impact)}</div>
        <div class="ch-step act"><span class="ch-k">Дія</span>${esc(c.action)}</div>
      </div>
    </div>`).join('')}</section>`;

  const ladder = `<section class="block"><h2>Драбина зрілості e-commerce</h2>
    <div class="ladder">${r.maturity.ladder.map((l) => `<div class="rung ${l.has ? 'has' : ''} ${l.level === r.maturity.level ? 'cur' : ''}">
      <b>${l.level}</b><span>${esc(l.name)}</span></div>`).join('')}</div>
    <p class="lead">Поточний рівень — ${r.maturity.level}: «${esc(r.maturity.name)}». Наступний щабель визначає фокус програми.</p></section>`;

  const opps = `<section class="block"><h2>Точки зростання (кандидати у scope)</h2>
    <ol>${r.opportunities.map((o) => `<li>${esc(o)}</li>`).join('')}</ol></section>`;

  // ── Консалтинговый каркас ──
  const observed = r.layers.filter((l) => l.status === 'observed');
  const needsData = r.layers.filter((l) => l.status === 'needs-data');
  const meth = methodologySection({
    goal: 'Реконструювати, як влаштований e-commerce клієнта як бізнес — за одним лише сайтом: модель, клієнт, продукт, комерція, канали, технології, операції, розширення.',
    sources: [`Дерево сайту: ${r.config.treeSize} URL, ~${r.config.products} товарів, ${r.config.categories} категорій`, 'Склад блоків розібраних сторінок (обхід)', 'Технологічні сигнали (платформа, трекінг)'],
    scope: `${r.layers.length} інформаційних шарів у 9 групах; кожен шар — ланцюжок «спостерігаємо → дедукуємо → перевірити даними → рішення».`,
    limits: `Дедукція ≠ факт: у зовнішньому аудиті стеля доказовості — висока впевненість. ${needsData.length} шарів неможливо оцінити ззовні — вони помічені «потрібні дані» й не беруть участі у висновках. Важливо: рівень зрілості тут — щабель розвитку БІЗНЕС-МОДЕЛІ (драбина 1–5); у «Матриці зрілості» — керованість окремих доменів. Це різні шкали, їхні числа й не повинні збігатися.`,
  });
  const posLayers = observed.filter((l) => !/не |немає|не видно|не виявлен/i.test(l.observed)).slice(0, 4);
  const strengths = [
    `Рівень зрілості ${r.maturity.level}/5 підтверджений спостереженням: ${r.maturity.basis}`,
    ...posLayers.map((l) => `${l.name}: ${l.observed}`),
  ];
  const weaknesses = [
    ...r.chains.slice(0, 5).map((c) => `${c.observed} → ${c.implies}`),
  ];
  const recs: SectionRec[] = r.chains.slice(0, 6).map((c, i): SectionRec => ({ pr: i < 2 ? 'P0' : i < 4 ? 'P1' : 'P2', action: c.action, effect: c.impact }));
  const nextLevel = Math.min(5, r.maturity.level + 1);
  const concl = conclusionSection([
    `За зовнішніми ознаками бізнес — ${r.config.businessType}. Поточний щабель зрілості — ${r.maturity.level}/5 «${r.maturity.name}»: ${r.maturity.level <= 2 ? 'працює механіка першої покупки, але системні шари (дані, утримання, масштабування) не побудовані — зростання зараз купується, а не накопичується' : r.maturity.level === 3 ? 'системні механіки частково зібрані; бізнес готовий рости за рахунок даних і каналів, але машинний шар (розмітка, автоматизація) ще не опора' : 'платформа зріла — фокус зміщується на ефективність і розширення'}.`,
    `Із ${r.layers.length} шарів ${observed.length} підтверджені спостереженням, ${r.layers.filter((l) => l.status === 'deduced').length} — обґрунтовані дедукції, ${needsData.length} потребують даних. Ланцюжків «спостереження → проблема → дія» зібрано ${r.chains.length}; кожен містить спосіб перевірки, тобто програма наступного кроку вже розмічена за даними, які її підтвердять або знімуть.`,
    `Перехід на щабель ${nextLevel} («${r.maturity.ladder.find((l) => l.level === nextLevel)?.name ?? ''}») — це і є стратегічна рамка програми: точки зростання вище відібрані як найкоротший шлях до нього, а не як список усього доброго.`,
  ], 'Наступний етап: інтерв’ю з власником + доступи (аналітика, замовлення) — дедукції перетворюються на підтверджені факти, і карта бізнесу стає основою комерційної пропозиції.');

  const foot = pageFooter('Зовнішній аудит вітрини: зовнішній зріз; дедукції — гіпотези з указаним способом перевірки. Відсутність даних не видається за факт і не приховується.');

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
  return doc(`Commerce Intelligence · ${r.client}`, coverHtml + meth + cfg + stackDonut + layerSections + chains + ladder + opps + swSection(strengths, weaknesses) + recsSection(recs) + concl + foot, extra);
}
