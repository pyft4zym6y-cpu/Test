/**
 * Технический внешний аудит A0 — клиентский PDF на общем визуальном стандарте.
 * Категории со статусом, таблица проверок, честная пометка BLOCKED (нужен
 * инструмент/доступ на A1).
 */
import { esc, dimBadges, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import { svgDonut } from './charts.js';
import type { TechReport, TStatus } from '../techaudit.js';

const MARK: Record<TStatus, string> = { ok: '✓', check: '◐', gap: '✕', blocked: '⛔' };
const CLS: Record<TStatus, string> = { ok: 'ok', check: 'check', gap: 'gap', blocked: 'check' };
const WORD: Record<TStatus, string> = { ok: 'ок', check: 'перевірити', gap: 'немає', blocked: 'потрібні доступи' };

export function renderTechAuditHtml(r: TechReport): string {
  const coverHtml = cover({
    kicker: 'Технічний фундамент',
    title: 'Технічний фундамент вітрини',
    verdict: r.verdict, // вывод — отдельной строкой, а не гигантским заголовком
    metrics: [{ label: 'Клієнт', value: r.client }],
    score: { pct: r.score.pct, cap: `технічних перевірок пройдено · ${r.score.passed}/${r.score.total}` },
    note: `<b>Що видно у зовнішньому аудиті:</b> перевірки виконуються за відрендереним DOM розібраних сторінок.${r.blocked.length ? ` Не вимірне зовнішніми засобами й винесене на наступний етап (після передачі доступів): ${esc(r.blocked.join(', '))}.` : ''} Відсутність даних не видається за факт.`,
  });

  const cats = r.categories.map((c) => {
    const rows = c.checks.map((ch) => `<tr>
      <td class="c-name">${esc(ch.label)}</td>
      <td class="c-st ${CLS[ch.status]}"><span class="st ${CLS[ch.status]}">${MARK[ch.status]}</span> ${WORD[ch.status]}</td>
      <td class="c-note">${esc(ch.note)}</td>
      <td class="c-rec">${esc(ch.rec)}</td>
    </tr>`).join('');
    return `<section class="block">
      <h2><span class="st ${CLS[c.status]}">${MARK[c.status]}</span> ${esc(c.title)} <span class="cat-dims">${dimBadges(c.dims)}</span></h2>
      <table><thead><tr><th>Перевірка</th><th>Статус</th><th>Дані</th><th>Рекомендація</th></tr></thead><tbody>${rows}</tbody></table>
    </section>`;
  }).join('');

  // ── Консалтинговый каркас: оценка из фактов, а не список задач ──
  const allChecks = r.categories.flatMap((c) => c.checks.map((ch) => ({ ...ch, cat: c.title })));
  const okChecks = allChecks.filter((c) => c.status === 'ok');
  const gapChecks = allChecks.filter((c) => c.status === 'gap');
  const checkChecks = allChecks.filter((c) => c.status === 'check');
  const okCats = r.categories.filter((c) => c.status === 'ok').map((c) => c.title);
  const gapCats = r.categories.filter((c) => c.status === 'gap').map((c) => c.title);

  // Пончик распределения статусов измеримых проверок (blocked — «нужны доступы» — не входит).
  const nOk = okChecks.length, nWarn = checkChecks.length, nGap = gapChecks.length;
  const statusTotal = nOk + nWarn + nGap;
  const statusDonut = statusTotal > 0 ? `<section class="block"><h2>Підсумок за перевірками</h2>
    <div class="chart-wrap">${svgDonut([
      { label: 'Пройдено', value: nOk, color: '#16a34a' },
      { label: 'Перевірити', value: nWarn, color: '#d97706' },
      { label: 'Провал', value: nGap, color: '#dc2626' },
    ].filter((x) => x.value > 0), { title: 'Статуси технічних перевірок', centerLabel: `${nOk}/${statusTotal}` })}
      <p class="chart-cap">Зелене — вимірні перевірки, пройдені на всіх розібраних сторінках; помаранчеве — нестабільно (пройдено на частині сторінок); червоне — системний розрив.${r.blocked.length ? ` ${r.blocked.length} перевірок зі статусом «потрібні доступи» до діаграми не входять.` : ''}<sup class="fn">1</sup></p></div>
    <p class="fn-note"><sup>1</sup> Статус рахується за зовнішнім обходом відрендереного DOM: «пройдено» — ознака присутня на всіх розібраних сторінках, «провал» — менш ніж 35% сторінок. Це спостереження за клієнтською частиною, а не гарантія серверної конфігурації; перевірки «потрібні доступи» вимірюються після передачі доступів.</p>
    </section>` : '';

  const meth = methodologySection({
    goal: 'Зафіксувати стан технічного фундаменту вітрини за зовнішніми ознаками: що працює, що зламано, що вимірне лише інструментами.',
    sources: ['Зовнішній обхід: відрендерений DOM усіх розібраних сторінок', 'robots.txt і sitemap.xml з кореня домену', 'Заміри мобільності (тап-цілі, кегль) з рендеру'],
    scope: `${r.score.total} вимірних перевірок у ${r.categories.length} категоріях; ${r.blocked.length} перевірок позначені «Потрібні доступи» (потрібен інструмент/доступ).`,
    limits: 'Зовнішній аудит бачить клієнтську частину. Core Web Vitals, заголовки сервера, лог індексації — після передачі доступів (наступний етап; PageSpeed/CrUX, доступ до сервера та Search Console).',
  });

  const strengths = [
    ...(okCats.length ? [`Категорії без жодного зауваження: ${okCats.join(', ')} — цей фундамент можна не чіпати й будувати на ньому`] : []),
    ...okChecks.slice(0, 5).map((c) => `${c.label} (${c.cat}): ${c.note} — працює на всіх перевірених сторінках`),
  ];
  const weaknesses = [
    ...(gapCats.length ? [`Провальні категорії: ${gapCats.join(', ')} — системний розрив, а не випадковість`] : []),
    ...gapChecks.slice(0, 6).map((c) => `${c.label}: ${c.note} — ${c.rec}`),
    ...(gapChecks.length ? [] : checkChecks.slice(0, 3).map((c) => `${c.label}: ${c.note} — нестабільно, перевірити шаблон`)),
  ];
  const recs: SectionRec[] = [
    ...gapChecks.map((c): SectionRec => ({ pr: /schema|sitemap|robots|canonical|noindex|https|аналіт/i.test(c.label) ? 'P0' : 'P1', action: c.rec, effect: `Закриває розрив «${c.label}» (${c.cat})` })),
    ...checkChecks.filter((c) => c.rec !== '—').slice(0, 4).map((c): SectionRec => ({ pr: 'P2', action: c.rec, effect: `Стабілізує «${c.label}» (${c.note})` })),
  ];

  const worstCat = [...r.categories].sort((a, b) => b.checks.filter((c) => c.status === 'gap').length - a.checks.filter((c) => c.status === 'gap').length)[0];
  const concl = conclusionSection([
    `З ${r.score.total} вимірних перевірок пройдено ${r.score.passed} (${r.score.pct}%). ${r.score.pct >= 70 ? 'Технічний фундамент робочий: він не блокує зростання, і вкладення дадуть віддачу поверх нього.' : r.score.pct >= 45 ? 'Фундамент нерівний: частина систем працює, але розриви в ключових категоріях гасять ефект решти вкладень.' : 'Фундамент проблемний: технічні розриви з’їдатимуть ефект будь-яких маркетингових і UX-вкладень, поки їх не закрито.'}`,
    gapChecks.length
      ? `Головна зона втрат — «${worstCat?.title}»: ${gapChecks.slice(0, 3).map((c) => c.label.toLowerCase()).join(', ')}. Це не косметика: кожна з цих позицій напряму впливає на те, як пошукові системи бачать і показують вітрину, тобто на безкоштовний трафік.`
      : 'Системних технічних провалів не зафіксовано — рідкісна ситуація, яку варто закріпити регламентом релізів (перед кожним релізом проганяти той самий чек-лист).',
    `${r.blocked.length} перевірок (${r.blocked.join(', ') || '—'}) неможливо провести без інструментів і доступів — вони не «хороші» й не «погані», а невідомі. За принципом чесних даних вони не зараховуються ні в плюс, ні в мінус до вимірювання після передачі доступів (наступний етап).`,
  ], 'Наступний етап: PageSpeed/CrUX (Core Web Vitals), перевірка заголовків сервера, повний crawl (Screaming Frog) і зв’язка із Search Console.');

  const footer = pageFooter('Зовнішній обхід відрендереного DOM. Відсутність даних не видається за факт і не приховується; перевірки зі статусом «потрібні доступи» закриваються після передачі доступів.');

  const extra = `.c-name{font-weight:600;white-space:nowrap;} .c-st{white-space:nowrap;font-size:9.5px;} .c-note{color:var(--muted);font-size:10px;white-space:nowrap;} .c-rec{color:#333;}
    .st{font-size:12px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);} .cat-dims{font-weight:400;}`;
  return doc(`Технічний аудит · ${r.client}`, coverHtml + meth + cats + statusDonut + swSection(strengths, weaknesses) + recsSection(recs) + concl + footer, extra);
}
