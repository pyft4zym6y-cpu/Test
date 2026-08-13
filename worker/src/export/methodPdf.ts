/**
 * A0-PDF для метод-документов (единый стандарт reportShell): матрица зрелости
 * (дашборд), охват и уверенность, реестр гипотез, scope по волнам, цена в канале,
 * синтез аудита. Оборачивают уже считаемые воркером модели.
 */
import { esc, doc, cover, pageFooter, methodologySection, conclusionSection } from './reportShell.js';
import { svgRadar, svgDonut, svgBars } from './charts.js';
import type { MaturityReport } from '../maturity.js';
import type { CoverageReport, LensStatus } from '../coverage.js';
import type { HypothesisRegister } from '../hypotheses.js';
import { PB_META, type ScopeReport } from '../routing.js';
import type { PriceChannelReport } from '../pricechannel.js';
import type { Synthesis } from '../synthesis.js';
import type { CausalMap } from '../causal.js';

// Спільна шапка метод-документів на shared-shell: title = коротка назва, verdict —
// окремим рядком; без бренду/дати/«тира». score — лише коли велике число є відсотком.
const head = (o: { kicker: string; title: string; verdict?: string; client: string; meta?: [string, string][]; score?: { pct: number; cap: string }; note?: string }) =>
  cover({
    kicker: o.kicker,
    title: o.title,
    verdict: o.verdict,
    metrics: [{ label: 'Клієнт', value: o.client }, ...(o.meta ?? []).map(([label, value]) => ({ label, value }))],
    score: o.score,
    note: o.note,
  });

const foot = (extra = '') => pageFooter(`Зовнішній зріз вітрини. Відсутність даних не видається за факт і не приховується.${extra ? ' ' + extra : ''}`);

/* ── Матрица зрелости (дашборд) ── */
export function renderMaturityPdf(m: MaturityReport, client: string, date: string): string {
  const lvlCls = (l: number | null) => (l == null ? 'na' : l >= 4 ? 'ok' : l >= 3 ? 'check' : 'gap');
  const seg = (l: number | null) => Array.from({ length: 5 }, (_, i) => `<i class="sg ${l != null && i < l ? lvlCls(l) : ''}"></i>`).join('');
  const rows = m.rows.map((r) => `<tr>
    <td class="m-dom">${esc(r.domain)}</td>
    <td class="m-ass">${esc(r.assesses)}</td>
    <td class="m-bar"><span class="segs">${seg(r.level)}</span></td>
    <td class="m-lvl ${lvlCls(r.level)}">${r.level == null ? '—' : `${r.level}/5`}</td>
    <td class="m-src ${r.source === 'L0' ? '' : 'gap'}">${esc(r.source === 'L0' ? 'зовнішній обхід' : r.source)}</td>
  </tr>`).join('');
  const avg = m.observedAvg;
  const observedRows = m.rows.filter((r) => r.level != null);
  const radar = observedRows.length >= 3
    ? `<div class="chart-wrap">${svgRadar(observedRows.map((r) => ({ axis: r.domain, value: r.level as number })), { max: 5, title: 'Профіль зрілості за доменами (0–5)' })}
        <p class="chart-cap">Що ближче вершина до краю — то системніше керується домен. Провали до центру — зони, де зростання впирається в ручне керування.<sup class="fn">1</sup></p></div>`
    : '';
  const body = `<section class="block"><h2>Зрілість за доменами (спостереження зовнішнього обходу)</h2>
    <p class="lead">Шкала 0–5: 0 — відсутня, 5 — системно керується. «Потрібні дані» — рівень зовні не підтвердити (наступний етап).</p>
    ${radar}
    <table><thead><tr><th>Домен</th><th>Що оцінює</th><th>Рівень</th><th></th><th>Джерело</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="fn-note"><sup>1</sup> Радар будується лише за спостережуваними доменами (${observedRows.length} з ${m.rows.length}); домени «потрібні дані» на діаграму не виносяться, щоб відсутність даних не читалася як нуль.</p></section>`;
  const best = [...observedRows].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))[0];
  const worstD = [...observedRows].sort((a, b) => (a.level ?? 0) - (b.level ?? 0))[0];
  const meth = methodologySection({
    goal: 'Показати, наскільки системно керується кожен домен бізнесу — від хаосу (рівень 1) до оптимізації (рівень 5) — і де зрілість обмежує зростання.',
    sources: ['Зовнішній обхід: перевірки та блоки сторінок за доменами', 'Порогова модель (частка пройдених перевірок → рівень)'],
    scope: `${m.rows.length} доменів; зовні спостережувані ${observedRows.length}, решта чекають даних.`,
    limits: 'Рівень домена «потрібні дані» не оцінюється і не усереднюється — зовні його зрілість не видно. Важливо: тут вимірюється керованість окремих ДОМЕНІВ (рівні 1–5); ступінь розвитку бізнес-моделі — інша шкала, їхні числа не повинні збігатися.',
  });
  const conclM = conclusionSection([
    avg != null
      ? `Середня зрілість за спостережуваними доменами — ${avg}/5. ${avg >= 3.5 ? 'Керування системне: процеси визначені, далі — керованість за даними.' : avg >= 2.5 ? 'Бізнес між «повторювано» та «визначено»: практики є, але вони тримаються на людях, а не на системі — зростання впиратиметься в ручне керування.' : 'Зрілість низька: більшість доменів працює в режимі реакцій. Будь-яка програма зростання має починатися із систематизації, інакше ефект не втримається.'}`
      : 'Спостережуваних доменів недостатньо для середньої оцінки — матриця заповнюється даними після передачі доступів (наступний етап).',
    best && worstD && best !== worstD
      ? `Найзріліший домен — ${best.domain} (${best.level}/5): на нього можна спиратися. Найслабший — ${worstD.domain} (${worstD.level}/5): він тягне систему вниз, бо шлях покупця проходить через усі домени, і клієнт упирається в найслабшу ланку раніше, ніж оцінить сильні.`
      : 'Розкид рівнів між доменами мінімальний — система розвивається рівномірно.',
    `${m.rows.length - observedRows.length} доменів позначені «потрібні дані»: їхня зрілість визначається опитувальником і доступами після передачі доступів (наступний етап). Матриця при цьому не перебудовується — уточнюється лише впевненість (закон методу).`,
  ], 'Наступний етап: опитувальник власника + доступи → повна матриця всіх доменів і цільові рівні на 12 місяців.');
  const extra = `.m-dom{font-weight:700;white-space:nowrap;} .m-ass{color:#333;font-size:10px;} .m-lvl{font-weight:800;white-space:nowrap;} .m-src{font-size:9px;color:var(--muted);}
    .segs{display:inline-flex;gap:2px;} .sg{width:16px;height:9px;border-radius:2px;background:var(--line);display:block;} .sg.ok{background:var(--ok);} .sg.check{background:var(--check);} .sg.gap{background:var(--gap);} .sg.na{background:var(--line);}`;
  return doc(`Матриця зрілості · ${client}`, head({
    kicker: 'Зрілість',
    title: 'Матриця зрілості',
    verdict: avg != null ? `Середня зрілість вітрини — ${avg}/5 за зовнішніми ознаками.` : 'Зрілість: базовий рівень, деталі — після даних (наступний етап).',
    client,
    meta: [['Середня', avg != null ? `${avg}/5` : '—']],
    note: 'Оцінка зрілості за зовнішнім обходом. Домени «потрібні дані» підтверджуються після передачі доступів доступом до систем/процесів.',
  }) + meth + body + conclM + foot(), extra);
}

/* ── Охват и уверенность ── */
export function renderCoveragePdf(c: CoverageReport, client: string, date: string): string {
  const cls: Record<LensStatus, string> = { covered: 'ok', partial: 'check', external: 'check', 'needs-access': 'gap' };
  const word: Record<LensStatus, string> = { covered: 'покрито', partial: 'частково', external: 'зовні', 'needs-access': 'потрібен доступ' };
  const rows = c.lenses.map((l) => `<tr><td class="cv-name">${esc(l.name)}</td><td class="cv-st ${cls[l.status]}">${word[l.status]}</td><td class="cv-note">${esc(l.note)}</td></tr>`).join('');
  const conf = c.confidence;
  const pct = conf.base ? Math.round((conf.score / conf.base) * 100) : 0;
  const nCov = c.lenses.filter((l) => l.status === 'covered').length;
  const nPart = c.lenses.filter((l) => l.status === 'partial').length;
  const nExt = c.lenses.filter((l) => l.status === 'external').length;
  const nGate = c.lenses.filter((l) => l.status === 'needs-access').length;
  const donutSegs = [
    { label: 'Покрито', value: nCov, color: '#16a34a' },
    { label: 'Частково', value: nPart, color: '#d97706' },
    { label: 'Зовні', value: nExt, color: '#0F9488' },
    { label: 'Потрібен доступ', value: nGate, color: '#dc2626' },
  ].filter((s) => s.value > 0);
  const donut = `<div class="chart-wrap">${svgDonut(donutSegs, { title: 'Охоплення аналізу за статусом лінз', centerLabel: `${nCov}/${c.lenses.length}` })}</div>`;
  const body = `<section class="block"><h2>Що доведено, що потребує даних</h2>
    <p class="lead">Охоплення за видами аналізу та впевненість висновку. Впевненість залежить від повноти даних і якості доказів (формула нижче) й обмежена стелею рівня.</p>
    ${donut}
    <table><thead><tr><th>Вид аналізу</th><th>Статус</th><th>Коментар</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="fn-note"><sup>1</sup> «Покрито» — висновок підтверджений зовнішнім обходом; «частково» — є сигнал, але потрібен факт із даних; «зовні» — закривається стороннім сервісом; «потрібен доступ» — розкривається після передачі доступів. Непокрита лінза не пропущена — у неї вказано спосіб закриття.</p></section>
    <section class="block"><h2>Як рахується впевненість</h2>
      <p class="lead">Confidence Score = стеля рівня × повнота даних × якість доказів. Це не «експертне число»: якість доказів — середня впевненість знахідок реєстру, де на рівні кожної знахідки вже враховані сила доказу, відтворюваність і джерело (сайт / дані / тест).</p>
      ${conf.evidenceQuality != null ? `<div class="concl-grid"><span class="k">Повнота даних</span><span class="v">${Math.round((conf.dataCompleteness ?? 0) * 100)}%</span><span class="k">Якість доказів</span><span class="v">${Math.round((conf.evidenceQuality ?? 0) * 100)}% (за реєстром знахідок)</span><span class="k">Стеля рівня</span><span class="v">${conf.base}</span></div>` : ''}</section>
    ${conf.raisedBy.length ? `<section class="block"><h2>Що підніме впевненість</h2><ul>${conf.raisedBy.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}`;
  const covered = c.lenses.filter((l) => l.status === 'covered').length;
  const partial = c.lenses.filter((l) => l.status === 'partial').length;
  const gated = c.lenses.filter((l) => l.status === 'needs-access' || l.status === 'external').length;
  const conclC = conclusionSection([
    `Із ${c.lenses.length} видів аналізу повністю покрито ${covered}, частково — ${partial}, ${gated} потребують зовнішніх сервісів або доступів. Confidence Score звіту — ${conf.score}/${conf.base} («${conf.band}»): це достовірність НАШИХ висновків на поточних даних, не оцінка бізнесу.`,
    conf.raisedBy.length
      ? `Впевненість підіймається конкретними кроками (${conf.raisedBy.length} шт., перелічені вище) — кожен із них додає дані, а не думки. Поки вони не зроблені, висновки аудиту слід читати з цим коефіцієнтом довіри, і саме тому він опублікований, а не схований.`
      : 'Усі фактори повноти даних на цьому рівні зібрані — впевненість на стелі рівня.',
    'Непокритий вид аналізу — не пробіл і не «забули»: це рядок із вказівкою, чим він закривається. Структура звіту не змінюється від рівня до рівня — зростає лише впевненість (закон методу).',
  ], 'Погодити з власником 2–3 найближчих джерела даних (доступи, опитувальник, конкуренти) — найдешевший спосіб підняти достовірність усіх документів одразу.');
  const extra = `.cv-name{font-weight:700;} .cv-st{font-weight:700;white-space:nowrap;} .cv-note{color:#333;font-size:10px;}`;
  return doc(`Охоплення та впевненість · ${client}`, head({
    kicker: 'Охоплення',
    title: 'Охоплення та впевненість',
    verdict: `Confidence Score ${conf.score}/${conf.base} — «${conf.band}».`,
    client,
    meta: [['Confidence', `${conf.score}/${conf.base}`]],
    score: { pct, cap: `впевненість висновку · «${conf.band}»` },
    note: 'Зовнішній зріз вітрини; стеля впевненості низька. Доступи й дані після передачі доступів і підключення аналітики підіймають Confidence.',
  }) + body + conclC + foot(), extra);
}

/* ── Реестр гипотез ── */
export function renderHypothesesPdf(h: HypothesisRegister, client: string, date: string): string {
  const cCls = (c: number) => (c >= 0.7 ? 'ok' : c >= 0.5 ? 'check' : 'gap');
  const rows = h.items.map((i) => `<tr>
    <td class="h-id">${esc(i.id)}</td>
    <td class="h-hyp"><b>${esc(i.hypothesis)}</b><span class="h-area">${esc(i.area)}</span></td>
    <td class="h-basis">${esc(i.basis)}</td>
    <td class="h-verify">✓ ${esc(i.verifyBy)}<br>✕ ${esc(i.falsifyIf)}</td>
    <td class="h-own">${esc(i.owner)}<span class="h-cost">${esc(i.cost)}</span></td>
    <td class="h-conf ${cCls(i.confidence)}">${Math.round(i.confidence * 100)}%</td>
  </tr>`).join('');
  const nHi = h.items.filter((i) => i.confidence >= 0.7).length;
  const nMid = h.items.filter((i) => i.confidence >= 0.5 && i.confidence < 0.7).length;
  const nLo = h.items.filter((i) => i.confidence < 0.5).length;
  const confDonut = h.items.length ? `<div class="chart-wrap">${svgDonut([
    { label: 'Висока (≥70%)', value: nHi, color: '#16a34a' },
    { label: 'Середня (50–70%)', value: nMid, color: '#d97706' },
    { label: 'Низька (<50%)', value: nLo, color: '#dc2626' },
  ].filter((x) => x.value > 0), { title: 'Гіпотези за впевненістю', centerLabel: String(h.items.length) })}
    <p class="chart-cap">Червоний сектор — гіпотези, які не можна класти в основу рішень до перевірки. Спорожнення цього сектора з надходженням даних — метрика прогресу.<sup class="fn">1</sup></p></div>` : '';
  const body = `<section class="block"><h2>Гіпотези: що перевірити і чим спростувати</h2>
    <p class="lead">Більшість висновків — гіпотези: у кожної спосіб підтвердження та умова спростування (після передачі доступів і підключення аналітики).</p>
    ${confDonut}
    ${h.items.length ? `<table><thead><tr><th>ID</th><th>Гіпотеза</th><th>Підстава</th><th>Перевірка / спростування</th><th>Власник · вартість</th><th>Впевн.</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="fn-note"><sup>1</sup> Впевненість гіпотези — детермінована оцінка на поточних даних; перевірка за стовпцем «спосіб підтвердження» переводить гіпотезу або у факт-знахідку, або знімає її.</p>` : '<p class="lead">Гіпотези з\'являться після аналітичного шару (потрібен ключ Claude).</p>'}</section>`;
  const areas = Array.from(new Set(h.items.map((i) => i.area)));
  const lowConf = h.items.filter((i) => i.confidence < 0.5).length;
  const conclH = conclusionSection([
    h.items.length
      ? `У реєстрі ${h.items.length} гіпотез у ${areas.length} областях (${areas.slice(0, 6).join(', ')}${areas.length > 6 ? '…' : ''}); ${lowConf} з них із впевненістю нижче 50% — їх не можна класти в основу рішень до перевірки. Реєстр — це карта незнання аудиту, опублікована свідомо: документ, який сам позначає недоведене, неможливо спіймати на маніпуляції.`
      : 'Гіпотез не виділено: знахідки поточного рівня достатньо підтверджені спостереженням.',
    'У кожної гіпотези вказано, які дані її підтверджують і який факт спростовує. Це перетворює наступний крок робіт із «довіртеся нам» на кінцевий список вимірів із заздалегідь відомим критерієм результату.',
    'З надходженням даних гіпотеза або стає знахідкою-фактом (і потрапляє в основний звіт), або спростовується і знімається. Реєстр живий: його спорожнення — метрика прогресу програми.',
  ], 'Наступний етап: виконати перевірки за стовпцем «Як перевірити», починаючи з гіпотез, що стоять за P0-рекомендаціями інших звітів.');
  const extra = `.h-id{color:var(--muted);white-space:nowrap;} .h-hyp{font-weight:400;} .h-hyp b{display:block;} .h-area{font-size:8px;color:var(--muted);text-transform:uppercase;} .h-basis{color:#333;font-size:10px;} .h-verify{font-size:9px;color:#333;} .h-conf{font-weight:800;white-space:nowrap;} .h-own{font-size:8.5px;color:#333;} .h-cost{display:block;color:var(--muted);font-size:8px;}`;
  return doc(`Реєстр гіпотез · ${client}`, head({
    kicker: 'Гіпотези',
    title: 'Реєстр гіпотез',
    verdict: `${h.items.length} гіпотез зі способом перевірки та спростування.`,
    client,
    meta: [['Гіпотез', String(h.items.length)]],
    note: 'Реєстр незнання: те, що не можна стверджувати у зовнішньому аудиті. Кожна гіпотеза закривається конкретними даними на наступному рівні.',
  }) + body + conclH + foot(), extra);
}

/* ── Scope по волнам ── */
export function renderScopePdf(s: ScopeReport, client: string, date: string): string {
  const total = s.waves.reduce((n, w) => n + w.items.length, 0);
  const wtitle = (w: ScopeReport['waves'][number]) => (/^(волна|хвил)/i.test(w.title) ? w.title : `Хвиля ${w.n}. ${w.title}`);
  const waves = s.waves.map((w) => `<section class="block"><h2>${esc(wtitle(w))}</h2>
    <p class="lead">Що дає хвиля: ${w.items.length} активацій плейбуків; кожна хвиля — самостійний результат.</p>
    <table><thead><tr><th>Плейбук</th><th>Що входить</th><th>Чому включений</th><th>Зусилля · строк</th></tr></thead><tbody>${
      w.items.map((it) => { const m = PB_META[it.playbook]; return `<tr><td class="sc-pb">${esc(it.name || it.playbook)}<span class="sc-code">${esc(it.playbook)}</span></td><td class="sc-what">${esc(m?.what ?? '—')}</td><td class="sc-why">${esc(it.reasons.join('; '))}</td><td class="sc-eff">${esc(m ? `${m.effort} · ${m.duration}` : '—')}</td></tr>`; }).join('')
    }</tbody></table></section>`).join('');
  const waveBars = s.waves.length >= 2 ? `<section class="block"><h2>Розподіл робіт за хвилями</h2>
    <div class="chart-wrap">${svgBars(s.waves.map((w) => ({ label: wtitle(w), value: w.items.length, tone: w.n === 1 ? 'ok' : w.n === 2 ? 'check' : undefined })), { title: 'Активацій плейбуків за хвилями', unit: '' })}
      <p class="chart-cap">Хвиля 1 (зелена) — швидкі окупні роботи, розблоковують вимірність наступних. Хвилі ріжуться за залежностями, а не за обсягом.<sup class="fn">1</sup></p></div>
    <p class="fn-note"><sup>1</sup> Кожна активація має трасу «підстава → плейбук → хвиля»; у scope не потрапляє нічого, під чим немає спостереження з адресою або цифрою.</p></section>` : '';
  const ni = s.notIncluded.length ? `<section class="block"><h2>Поза scope на цьому етапі</h2><ul>${s.notIncluded.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const w1 = s.waves.find((w) => w.n === 1);
  const conclS = conclusionSection([
    total
      ? `Програма зібрана з ${total} активацій у ${s.waves.length} хвилях. Кожна активація має трасу «підстава → плейбук → хвиля»: у scope не потрапило нічого, під чим немає спостереження з адресою або цифрою. ${s.notIncluded.length} плейбуків свідомо поза scope — не тому що «не потрібні», а тому що на поточних даних для них немає підстави.`
      : 'Активацій не набрано: за спостережуваними сигналами вітрина близька до стандарту. Scope у цьому разі формується від цілей зростання, а не від дефектів.',
    w1 && w1.items.length
      ? `Хвиля 1 (${w1.items.map((i) => i.playbook).join(', ')}) — це роботи, що окупаються самі й розблоковують вимірність наступних: правильна послідовність тут важливіша за обсяг. Запускати хвилю 2 до завершення хвилі 1 — означає будувати на неперевіреному фундаменті.`
      : 'Тактичних робіт (хвиля 1) не потрібно — програма починається з ядрових змін.',
    'Хвилі ріжуться за часом і залежностями, а не за якістю: кожна хвиля — самостійний результат з вимірним ефектом, а не «етап великого проєкту», який не можна здати частинами.',
  ], 'Погодити хвилю 1 і метрики її успіху; гроші на кожну активацію рахуються після базових даних (наступний етап).');
  const extra = `.sc-pb{font-weight:700;white-space:nowrap;} .sc-pb .sc-code{display:block;font-weight:400;font-size:7.5px;color:var(--muted);} .sc-what{font-size:9px;color:#333;} .sc-why{color:#333;font-size:9px;} .sc-eff{font-size:9px;white-space:nowrap;color:#333;}`;
  return doc(`Scope за хвилями · ${client}`, head({
    kicker: 'Scope програми',
    title: 'Scope за хвилями',
    verdict: `Програма з ${s.waves.length} хвиль (${total} активацій), ріжемо за хвилями, а не за якістю.`,
    client,
    meta: [['Хвиль', String(s.waves.length)], ['Активацій', String(total)]],
    note: 'Розбивка робіт на хвилі: кожна хвиля дає вимірний результат сама по собі й не чекає наступних. Пріоритет — за залишковим внеском і залежностями.',
  }) + waves + ni + conclS + foot(), extra);
}

/* ── Цена в канале ── */
export function renderPriceChannelPdf(p: PriceChannelReport, client: string, date: string): string {
  const roleRu: Record<PriceChannelReport['role'], string> = { producer: 'виробник', reseller: 'реселлер', hybrid: 'гібрид', unknown: 'не визначена' };
  const stWord = (st: string) => (st === 'з обходу' ? 'з обходу' : st);
  const rows = p.checklist.map((c) => `<tr><td class="pcx-item">${esc(c.item)}</td><td class="pcx-how">${esc(c.how)}</td><td class="pcx-st ${c.status === 'з обходу' ? 'ok' : 'check'}">${esc(stWord(c.status))}</td></tr>`).join('');
  const body = `<section class="block"><h2>Роль у ланцюгу та цінова дисципліна</h2>
    <p class="lead">Роль: <b>${esc(roleRu[p.role])}</b> — ${esc(p.roleBasis)}.</p>
    <div class="concl warn"><b>Ціновий ризик.</b> ${esc(p.risk)}</div></section>
    <section class="block"><h2>Чек-лист ціни в каналі</h2>
    <table><thead><tr><th>Перевірка</th><th>Як перевіряємо</th><th>Статус</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const fromCrawl = p.checklist.filter((c) => c.status === 'з обходу').length;
  const needIn = p.checklist.length - fromCrawl;
  const conclP = conclusionSection([
    `Роль клієнта в товарному ланцюгу (гіпотеза): ${roleRu[p.role]} — ${p.roleBasis}. Роль визначає всю логіку цінового блоку: ${p.role === 'producer' ? 'виробник конкурує зі своїми ж посередниками, і його головний ризик — втратити контроль ціни в чужих каналах' : p.role === 'reseller' ? 'реселлер структурно програє в закупівлі тим, хто стоїть вище в ланцюгу, і його поле — сервіс, швидкість та асортимент, а не ціна' : 'до підтвердження ролі цінові висновки робити не можна — вони виявляться висновками про чужу бізнес-модель'}.`,
    `Із ${p.checklist.length} перевірок протоколу ${fromCrawl} закриті обходом, ${needIn} потребують входів (прайс-агрегатори, маркетплейси, дані про дистрибуцію). Ключовий ризик сформульований вище — він лишається гіпотезою рівно до першої перевірки цін у каналі.`,
    'Документ фіксує протокол, за яким цінову позицію буде виміряно, — щоб перевірка після передачі доступів (наступний етап) зайняла години, а не тижні, і щоб її результат не можна було оскаржити («ми заздалегідь домовилися, що і як міряємо»).',
  ], 'Наступний етап: пройти протокол за чек-листом — ціни реселлерів, лістинги на маркетплейсах, MAP-дисципліна; після цього блок отримує цифри замість статусів.');
  const extra = `.pcx-item{font-weight:700;} .pcx-how{color:#333;font-size:10px;} .pcx-st{font-weight:700;white-space:nowrap;}`;
  return doc(`Ціна в каналі · ${client}`, head({
    kicker: 'Ціна в каналі',
    title: 'Ціна в каналі',
    verdict: `Цінова позиція та роль у ланцюгу: ${roleRu[p.role]}.`,
    client,
    meta: [['Роль', roleRu[p.role]]],
    note: 'Ціна у власному каналі не має бути вищою, ніж на маркетплейсах і в реселлерів. Реальні рівні цін і MAP уточнюються після передачі доступів (наступний етап).',
  }) + body + conclP + foot(), extra);
}

/* ── Причинно-следственная карта ── */
export function renderCausalPdf(c: CausalMap, client: string, date: string): string {
  const nodes = c.nodes.map((n, i) => `<div class="cz">
    <div class="cz-n">${i + 1}</div>
    <div class="cz-flow">
      <div class="cz-col symptoms"><span class="cz-k">Симптоми (що видно)</span>${n.symptoms.length ? `<ul>${n.symptoms.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '<p>—</p>'}</div>
      <div class="cz-arrow">→</div>
      <div class="cz-col cause"><span class="cz-k">Корінна причина</span><b>${esc(n.rootCause)}</b>${n.evidence.length ? `<span class="cz-ev">Доказ: ${esc(n.evidence.join('; '))}</span>` : ''}${n.findingIds?.length ? `<span class="cz-ev">Знахідки реєстру: ${esc(n.findingIds.join(', '))}</span>` : ''}</div>
      <div class="cz-arrow">→</div>
      <div class="cz-col money"><span class="cz-k">Гроші</span>${esc(n.moneyLink)}</div>
    </div>
  </div>`).join('');
  // Столбцы: сколько наблюдаемых симптомов сводит каждая корневая причина (визуализация консолидации).
  const consolidation = c.nodes.filter((n) => n.symptoms.length > 0);
  const causeBars = consolidation.length >= 2
    ? `<div class="chart-wrap">${svgBars(consolidation.map((n) => ({ label: n.rootCause, value: n.symptoms.length, tone: n.symptoms.length >= 3 ? 'gap' : 'check' })), { title: 'Симптомів зводиться до однієї причини', unit: '' })}
        <p class="chart-cap">Кожен стовпець — скільки розрізнених симптомів пояснює одна корінна причина. Лагодиться причина один раз — ефект знімається з усіх її симптомів.<sup class="fn">1</sup></p></div>`
    : '';
  const body = `<section class="block"><h2>Симптом → корінна причина → гроші</h2>
    <p class="lead">Працюємо з причиною, а не з симптомом: один дефект дає знахідки в багатьох місцях, а лагодиться один раз. Гроші — один раз на вузол, без подвійного рахунку.</p>
    ${causeBars}
    ${c.nodes.length ? nodes : '<p class="lead">Причинних вузлів не виділено на поточних даних.</p>'}
    <div class="concl warn" style="margin-top:10px"><b>Економіка.</b> ${esc(c.moneyNote)}</div>
    ${consolidation.length >= 2 ? '<p class="fn-note"><sup>1</sup> Стовпець рахує підтверджені симптоми, прив\'язані до вузла на дату аудиту; гроші атрибутуються вузлу один раз (без подвійного рахунку між симптомами однієї причини).</p>' : ''}</section>`;
  const extra = `.cz{display:flex;gap:8px;margin:10px 0;page-break-inside:avoid;}
    .cz-n{flex:0 0 22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;}
    .cz-flow{flex:1;display:grid;grid-template-columns:1fr auto 1.2fr auto 1fr;gap:6px;align-items:stretch;}
    .cz-col{border:1px solid var(--line);border-radius:6px;padding:7px 9px;font-size:9.5px;background:var(--soft);}
    .cz-col.cause{border-color:var(--gap);background:#fff5f5;} .cz-col.cause b{display:block;font-size:10.5px;}
    .cz-col.money{border-color:var(--check);}
    .cz-k{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);font-weight:700;margin-bottom:3px;}
    .cz-ev{display:block;margin-top:4px;font-size:8px;color:var(--muted);}
    .cz-arrow{align-self:center;color:var(--muted);font-size:13px;font-weight:700;}
    .cz-col ul{margin:0;padding-left:14px;} .cz-col li{margin:1px 0;}`;
  const totalSymptoms = c.nodes.reduce((n, x) => n + x.symptoms.length, 0);
  const conclCz = conclusionSection([
    c.nodes.length
      ? `${totalSymptoms} спостережуваних симптомів зводяться до ${c.nodes.length} корінних причин. Це головний економічний аргумент карти: лагодити потрібно ${c.nodes.length} причин, а не ${totalSymptoms} симптомів — інакше бюджет іде на косметику, а дефекти повертаються.`
      : 'Причинних вузлів на поточних даних не виділено — або симптомів недостатньо, або вони не групуються в системні причини.',
    `Гроші прив'язуються до вузла один раз — без подвійного рахунку, коли той самий недоотриманий оборот «продається» в трьох різних розділах звіту. ${c.moneyNote}`,
    'Карта — міст між аудитом і програмою: кожен плейбук у scope адресує конкретний вузол цієї карти, і навпаки — вузол без плейбука означає свідомо прийнятий ризик.',
  ], 'Звірити вузли карти зі scope за хвилями: кожна корінна причина має мати активацію, що її адресує, або явну позначку «прийнятий ризик».');
  return doc(`Причинно-наслідкова карта · ${client}`, head({
    kicker: 'Причини',
    title: 'Причинно-наслідкова карта',
    verdict: `${c.nodes.length} корінних причин пояснюють спостережувані симптоми.`,
    client,
    meta: [['Вузлів', String(c.nodes.length)]],
    note: 'Карта пов\'язує розрізнені симптоми з корінними причинами: плейбук адресує причину; симптом без причини в дорожню карту не потрапляє.',
  }) + body + conclCz + foot(), extra);
}

/* ── Синтез аудита ── */
export function renderSynthesisPdf(s: Synthesis, client: string, date: string): string {
  const cross = s.crossLinks.length ? `<section class="block"><h2>Взаємозв'язки знахідок</h2>
    <p class="lead">Де дефекти підсилюють одне одного — лагодити потрібно причину, а не кожну точку.</p>
    <table><thead><tr><th>A</th><th>B</th><th>Спільний ефект</th></tr></thead><tbody>${
      s.crossLinks.map((c) => `<tr><td>${esc(c.a)}</td><td>${esc(c.b)}</td><td class="sy-eff">${esc(c.effect)}</td></tr>`).join('')
    }</tbody></table></section>` : '';
  const roots = s.rootCauses.length ? `<section class="block"><h2>Корінні причини</h2>${
    s.rootCauses.map((r) => `<div class="concl crit"><h3>${esc(r.cause)}</h3><div class="concl-grid"><span class="k">Проявляється в</span><span class="v">${esc(r.from.join('; '))}</span><span class="k">Вплив</span><span class="v">${esc(r.impact)}</span></div></div>`).join('')
  }</section>` : '';
  const prio = s.priorities.length ? `<section class="block"><h2>Наскрізний пріоритет</h2><table><tbody>${
    s.priorities.map((p, i) => `<tr><td class="sy-n">${i + 1}</td><td class="sy-t"><b>${esc(p.title)}</b></td><td class="sy-w">${esc(p.why)}</td></tr>`).join('')
  }</tbody></table></section>` : '';
  const conclSy = conclusionSection([
    `Синтез пов'язав лінзи аудиту в єдину картину: ${s.crossLinks.length} компаундних зв'язок (де два дефекти підсилюють одне одного), ${s.rootCauses.length} корінних причин, ${s.priorities.length} наскрізних пріоритетів. Цінність цього шару — не нові знахідки, а порядок: він відповідає на питання «з чого почати», яке окремі аудити за визначенням вирішити не можуть.`,
    s.crossLinks.length
      ? 'Компаундні зв\'язки — найдорожче у списку: там втрати перемножуються, а не додаються, тому лагодження однієї сторони зв\'язки без іншої повертає лише частину ефекту.'
      : 'Компаундних зв\'язок не виявлено — дефекти незалежні, їх можна закривати паралельно.',
    `Підсумок одним реченням: ${s.oneLine}`,
  ], 'Використати наскрізні пріоритети як порядок хвилі 1; після кожного впровадження синтез перезбирається за новими даними.');
  const body = cross + roots + prio;
  const extra = `.sy-eff{color:#333;} .sy-n{color:var(--muted);width:16px;} .sy-t{white-space:nowrap;} .sy-w{color:#333;}`;
  return doc(`Синтез аудиту · ${client}`, head({
    kicker: 'Синтез',
    title: 'Синтез аудиту',
    verdict: s.headline,
    client,
    meta: [['Пріоритетів', String(s.priorities.length)]],
    note: 'Синтез зводить знахідки всіх лінз без подвійного рахунку: знімає перетини, підіймає корінні причини, ранжує за залишковим внеском.',
  }) + body + conclSy + foot(), extra);
}
