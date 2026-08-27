/**
 * ЄДИНА СИСТЕМА АУДИТУ — 5 послідовних рівнів, де кожен використовує результат
 * попереднього: Business → Structure → UX/UI → Content → CRO.
 *
 * Ідея (за проханням власника): це не 5 окремих звітів поруч, а один потік.
 * Бізнес задає цілі/ЦА/УТП → Структура має їх відобразити в IA → UX/UI прибирає
 * тертя на цих шляхах → Контент кладе інформацію для рішення → CRO монетизує
 * доказами й терміновістю. Кожен рівень має вхід (що бере зверху) і вихід (що
 * передає далі), а наприкінці — ЄДИНИЙ наскрізний беклог Impact×Effort із усіх
 * рівнів, а не п'ять окремих списків.
 *
 * Модуль детермінований: збирає готові факт-слої (maturity, site-audit, uxflow,
 * contentflow, mechanics) — усі будуються з AuditDataset без викликів моделі.
 */
import type { AuditDataset } from './report.js';
import { buildMaturity } from './maturity.js';
import { buildSiteAudit } from './pagereport.js';
import { buildUxUiReport } from './uxui.js';
import { buildUxFlow } from './uxflow.js';
import { buildContentAudit } from './contentaudit.js';
import { buildContentFlow } from './contentflow.js';
import { buildSeoFlow } from './seoflow.js';
import { buildMechanics } from './mechanics.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type ChainLevel = {
  id: string;           // B / S / X / C / R
  name: string;
  question: string;     // на яке питання відповідає рівень
  readiness: number;    // готовність рівня, 0..100 (спільна шкала)
  metric: string;       // «рідна» метрика рівня словами
  verdict: string;      // однорядковий вивід
  input: string;        // що бере з попереднього рівня
  output: string;       // що передає наступному рівню
  findings: string[];   // 2–3 ключові сигнали
  p0: number;           // критичних питань на рівні
};

export type ChainHandoff = { from: string; to: string; passes: string };

export type ChainBacklogItem = {
  level: string;        // рівень-джерело
  levelId: string;
  title: string;
  impact: number;       // 1..5
  effort: number;       // 1..5
  priority: Priority;
  score: number;        // Impact/Effort — для сортування
};

export type AuditChainReport = {
  client: string; takenAt: string;
  levels: ChainLevel[];
  handoffs: ChainHandoff[];
  backlog: ChainBacklogItem[];
  throughline: string;  // наскрізна фраза, що зв'язує всі 5
  overall: { value: number; label: string };
};

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const readyLabel = (v: number) => (v >= 70 ? 'зрілий рівень' : v >= 45 ? 'працює частково' : 'слабка ланка');

export function buildAuditChain(ds: AuditDataset): AuditChainReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }

  // ── Факт-слої (усі детерміновані, з ds) ──
  const maturity = buildMaturity(ds);
  const site = buildSiteAudit(ds);
  const uxui = buildUxUiReport(ds);
  const uxflow = buildUxFlow(uxui);
  const content = buildContentAudit(ds);
  const cflow = buildContentFlow(ds, content);
  const seo = buildSeoFlow(ds);
  const mech = buildMechanics(ds);

  /* ── B · Business ── */
  const bReady = clamp100((maturity.observedAvg ?? 2.5) / 5 * 100);
  const hasBrief = !!(ds.brief && ds.brief.trim().length > 20);
  const bizGaps = maturity.rows.filter((r) => r.level != null && r.level <= 2).map((r) => r.domain);
  const bLevel: ChainLevel = {
    id: 'B', name: 'Business', question: 'Навіщо існує сайт: цілі, ЦА, УТП, позиціонування, конкуренти?',
    readiness: bReady, metric: `Зрілість (набл.) ${maturity.observedAvg ?? '—'}/5`,
    verdict: hasBrief ? 'Бізнес-контекст заданий — цілі й ЦА є опорою для решти рівнів.' : 'Бізнес-цілі й ЦА не формалізовані — рівні нижче ризикують оптимізувати «в порожнечу».',
    input: 'Верхній рівень — вхід від ринку: попит, конкуренти, економіка юніта.',
    output: 'Цілі, ЦА, УТП, позиціонування → задають, які розділи, екрани й контент мають існувати.',
    findings: [
      hasBrief ? 'Бриф/контекст проєкту наданий' : 'Немає формалізованого позиціонування (одна дорога проблема vs «умієм багато»)',
      bizGaps.length ? `Слабкі домени зрілості: ${bizGaps.slice(0, 3).join(', ')}` : 'Базова зрілість доменів прийнятна',
    ].filter(Boolean),
    p0: hasBrief ? 0 : 1,
  };

  /* ── S · Structure ── */
  const sReady = clamp100(site.totalPct);
  const missingTypes = (site.pageTypes ?? []).filter((t) => t.status !== 'найдена').map((t) => t.label);
  const sLevel: ChainLevel = {
    id: 'S', name: 'Structure', question: 'Чи веде архітектура сайту до потрібних сторінок без втрат?',
    readiness: sReady, metric: `Відповідність еталону ${site.totalPct}% · ${site.tree.length} типів сторінок`,
    verdict: sReady >= 70 ? 'Структура близька до еталона — каркас витримує навантаження UX і контенту.' : 'Структура має прогалини — частина шляхів клієнта обривається ще до UX і контенту.',
    input: 'Від Business: ЦА і УТП → яких розділів, хабів і посадкових вимагає аудиторія.',
    output: 'Карта сторінок і типів → на які екрани UX/UI і контент наводять фокус.',
    findings: [
      `Розібрано типів сторінок: ${site.tree.length}`,
      missingTypes.length ? `Немає/не підтверджено типів: ${missingTypes.slice(0, 4).join(', ')}` : 'Ключові типи сторінок присутні',
      cflow.linking.orphanPages.length ? `Потенційно orphan-сторінок: ${cflow.linking.orphanPages.length}` : 'Orphan-сторінок не виявлено',
    ],
    p0: sReady < 45 ? 1 : 0,
  };

  /* ── X · UX/UI ── */
  const uxTotal = Object.values(uxui.counts).reduce((a, b) => a + b, 0) || 1;
  const uxFail = uxui.counts.fail ?? 0;
  const xReady = clamp100((1 - uxFail / uxTotal) * 100);
  const xP0 = (uxui.bySeverity.Critical ?? 0) + (uxui.bySeverity.High ?? 0);
  const topUx = uxflow.layers.flatMap((L) => L.findings).slice(0, 3).map((f) => f.problem);
  const xLevel: ChainLevel = {
    id: 'X', name: 'UX/UI', question: 'Чи легко пройти шлях: знайти, зрозуміти, вирішити, діяти?',
    readiness: xReady, metric: `Провалів AQC ${uxFail} (Crit ${uxui.bySeverity.Critical ?? 0}, High ${uxui.bySeverity.High ?? 0})`,
    verdict: xReady >= 70 ? 'Шлях загалом чистий — тертя точкове.' : 'На шляху клієнта системне тертя — його треба зняти до роботи над контентом і CRO.',
    input: 'Від Structure: дерево сторінок → на яких екранах прибирати тертя (A1 структура → A2 UX → A3 UI).',
    output: 'Екрани без тертя → куди контент кладе інформацію для рішення без боротьби з інтерфейсом.',
    findings: topUx.length ? topUx : ['Критичного UX-тертя не виявлено на розібраних сторінках'],
    p0: xP0,
  };

  /* ── C · Content ── */
  const cReady = (cflow.score.overall === null ? 0 : clamp100(cflow.score.overall * 10));
  const cP0 = cflow.cards.filter((c) => c.priority === 'P0').length + cflow.gaps.filter((g) => g.priority === 'P0').length;
  const cLevel: ChainLevel = {
    id: 'C', name: 'Content', question: 'Чи веде контент до рішення: закриває питання, знімає заперечення, годує AI-видачу?',
    readiness: cReady, metric: `Content Score ${cflow.score.overall}/10 · розривів ${cflow.gaps.length}`,
    verdict: cReady >= 70 ? 'Контент здебільшого веде до рішення — доробки точкові.' : 'Контент не доведений до стану «продає сам»: є розриви й тонкі місця в точках рішення.',
    input: 'Від UX/UI: чисті екрани → куди покласти вирішальну інформацію (опис, докази, відповіді).',
    output: 'Контент, що веде до рішення → база сторінок і сутностей, які SEO виводить в органічну видачу.',
    findings: [
      `Блоків потребують контентних правок: ${cflow.cards.length}`,
      cflow.gaps.length ? `Content Gap Map: ${cflow.gaps.slice(0, 3).map((g) => g.title.replace(/^Немає /, '')).join(', ')}` : 'Критичних контентних розривів немає',
      `Перелінковка: проєкція головної ${cflow.linking.keyPageLinksNow} → ${cflow.linking.keyPageLinksTarget}`,
    ],
    p0: cP0,
  };

  /* ── E · SEO ── */
  // null — SEO Score не вимірювався (обходу не було). Нуль тут збрехав би
  // інакше: він читається як «перевірили і все погано», а не «не перевіряли».
  const eReady = seo.score.overall === null ? 0 : clamp100(seo.score.overall * 10);
  const eP0 = seo.problems.filter((p) => p.priority === 'P0').length + seo.blockCards.filter((c) => c.priority === 'P0').length;
  const eLevel: ChainLevel = {
    id: 'E', name: 'SEO', question: 'Чи здатний сайт системно отримувати органічний трафік і масштабувати видимість?',
    readiness: eReady, metric: `SEO Score ${seo.score.overall}/10 · проблем ${seo.problems.length}`,
    verdict: eReady >= 70 ? 'Органічний канал технічно готовий — фокус на масштабуванні семантики.' : 'Органічний канал недобудований: структура/індексація/семантика гальмують трафік ще до конверсії.',
    input: 'Від Content: сторінки й сутності під рішення → що виводити в органіку (Structure → Content → SEO).',
    output: 'Органічний трафік на потрібні сторінки → що CRO конвертує в замовлення.',
    findings: [
      seo.problems.length ? `Топ-проблеми: ${seo.problems.slice(0, 2).map((p) => p.problem.slice(0, 48)).join('; ')}` : 'Критичних SEO-проблем не виявлено',
      `Semantic Map: ${seo.semantic.filter((s) => s.status === 'missing').length}/${seo.semantic.length} кластерів без URL`,
      `Можливостей росту: ${seo.opportunities.length}`,
    ],
    p0: eP0,
  };

  /* ── R · CRO ── */
  const rReady = clamp100(mech.score.pct);
  const rP0 = mech.rows.filter((r) => r.pr === 'P0' && r.status === 'нет').length;
  const croWeak = mech.weaknesses.slice(0, 2);
  const rLevel: ChainLevel = {
    id: 'R', name: 'CRO', question: 'Чи перетворює сайт готове рішення на замовлення: докази, терміновість, менше тертя на оплаті?',
    readiness: rReady, metric: `Механік конверсії ${mech.score.have}/${mech.score.measurable} (${mech.score.pct}%)`,
    verdict: rReady >= 70 ? 'Конверсійні механіки переважно на місці — тонке налаштування.' : 'Конверсійні механіки недобрані — попередні рівні працюють, але гроші не доводяться до каси.',
    input: 'Від SEO: органічний трафік на потрібні сторінки → що лишилось підсилити доказом, дефіцитом, зняттям тертя на оплаті.',
    output: 'Замовлення (фінальний рівень воронки) → дані конверсії живлять наступний цикл Business.',
    findings: croWeak.length ? croWeak : ['Базові конверсійні механіки присутні'],
    p0: rP0,
  };

  const levels = [bLevel, sLevel, xLevel, cLevel, eLevel, rLevel];

  /* ── Хендофи (сполучна тканина) ── */
  const handoffs: ChainHandoff[] = [
    { from: 'Business', to: 'Structure', passes: 'Цілі · ЦА · УТП · позиціонування → вимоги до розділів, хабів і посадкових.' },
    { from: 'Structure', to: 'UX/UI', passes: 'Карта сторінок і типів → пріоритетні екрани, де знімати тертя.' },
    { from: 'UX/UI', to: 'Content', passes: 'Екрани без тертя → місця, куди лягає вирішальна інформація.' },
    { from: 'Content', to: 'SEO', passes: 'Сторінки й сутності під рішення → що виводити в органічну видачу.' },
    { from: 'SEO', to: 'CRO', passes: 'Органічний трафік на потрібні сторінки → що конвертувати в замовлення.' },
    { from: 'CRO', to: 'Business', passes: 'Конверсія в замовлення → дані для наступного циклу цілей і юніт-економіки.' },
  ];

  /* ── Наскрізний беклог Impact×Effort (з усіх рівнів) ── */
  const backlog: ChainBacklogItem[] = [];
  const push = (level: string, levelId: string, title: string, impact: number, effort: number) => {
    const pr: Priority = impact >= 4.5 ? 'P0' : impact >= 3.5 ? 'P1' : impact >= 2.5 ? 'P2' : 'P3';
    backlog.push({ level, levelId, title, impact, effort, priority: pr, score: Math.round((impact / effort) * 100) / 100 });
  };
  // Business
  if (bLevel.p0) push('Business', 'B', 'Формалізувати позиціонування: одна дорога проблема, ЦА, УТП', 5, 2);
  // Structure
  if (missingTypes.length) push('Structure', 'S', `Закрити відсутні типи сторінок (${missingTypes.slice(0, 2).join(', ')}${missingTypes.length > 2 ? '…' : ''})`, 4, 3);
  if (cflow.linking.orphanPages.length >= 3) push('Structure', 'S', `Прибрати orphan-сторінки (${cflow.linking.orphanPages.length}) — увести в перелінковку`, 3, 2);
  // UX/UI — топ по важкості з uxflow
  for (const f of uxflow.layers.flatMap((L) => L.findings).filter((f) => f.severity === 'Critical' || f.severity === 'High').slice(0, 4)) {
    push('UX/UI', 'X', f.problem, f.severity === 'Critical' ? 5 : 4, 3);
  }
  // Content — P0/P1 картки + P0 gaps
  for (const c of cflow.cards.filter((c) => c.priority === 'P0' || c.priority === 'P1').slice(0, 4)) {
    const verb = c.now.includes('не виявлено') || c.problem.includes('відсутн') ? 'Додати' : 'Довести до еталона';
    push('Content', 'C', `${c.page}: ${verb} блок «${c.name}» — ${c.task.toLowerCase()}`, c.priority === 'P0' ? 5 : 4, 3);
  }
  for (const g of cflow.gaps.filter((g) => g.priority === 'P0')) push('Content', 'C', g.title, 5, 4);
  // SEO — P0 проблеми + P0 блоки
  for (const p of seo.problems.filter((p) => p.priority === 'P0').slice(0, 3)) push('SEO', 'E', p.problem, 5, p.effort);
  for (const c of seo.blockCards.filter((c) => c.priority === 'P0').slice(0, 2)) push('SEO', 'E', `${c.page}: ${c.name} — ${c.recommendation.slice(0, 60)}`, 4, 3);
  // CRO — P0 механіки
  for (const r of mech.rows.filter((r) => r.pr === 'P0' && r.status === 'нет').slice(0, 3)) {
    push('CRO', 'R', `${r.name} — ${r.what}`, 5, 2);
  }
  // сортуємо за Impact×Effort (score = impact/effort), потім за impact
  backlog.sort((a, b) => b.score - a.score || b.impact - a.impact);

  /* ── Наскрізна фраза й загальна готовність ── */
  const weakest = [...levels].sort((a, b) => a.readiness - b.readiness)[0];
  const overallVal = clamp100(levels.reduce((s, l) => s + l.readiness, 0) / levels.length);
  const throughline = `Найслабша ланка ланцюга — ${weakest.name} (${weakest.readiness}/100): доки вона не закрита, вкладення в наступні рівні дають менший ефект. Порядок робіт іде за ланцюгом: ${levels.map((l) => l.name).join(' → ')}.`;

  return {
    client, takenAt: ds.takenAt, levels, handoffs, backlog, throughline,
    overall: { value: overallVal, label: readyLabel(overallVal) },
  };
}
