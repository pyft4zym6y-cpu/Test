/**
 * Итоговое резюме внедрения: из единого реестра находок детерминированно выводит —
 *  - какие задачи ТАКТИЧЕСКИЕ (быстрые правки) vs СТРАТЕГИЧЕСКИЕ (структурные),
 *  - какую КОМАНДУ специалистов привлечь (роли из доменов находок),
 *  - ОРИЕНТИРЫ по срокам и бюджету (по объёму и сложности работ),
 *  - разбивку по волнам.
 * Отвечает на «что дальше и кем» — то, чего не хватало в сводных документах.
 */
import { esc, doc, cover, methodologySection, conclusionSection } from './export/reportShell.js';
import type { Finding } from './registry.js';

export type TeamRole = { role: string; why: string; load: string };
export type EngagementSummary = {
  client: string; takenAt: string;
  total: number; p0: number;
  tactical: { count: number; effortWeeks: string; examples: string[] };
  strategic: { count: number; effortWeeks: string; examples: string[] };
  team: TeamRole[];
  timeline: string; budget: string;
  waves: { title: string; focus: string; count: number }[];
};

// Домен находки → роль в команде внедрения.
const DOMAIN_ROLE: Record<string, { role: string; why: string }> = {
  'ux-os': { role: 'UX/CRO-дизайнер + frontend', why: 'композиція сторінок, CTA, чекаут, інтерактив' },
  'checkout-os': { role: 'CRO-спеціаліст + frontend', why: 'форма чекауту, гостьове замовлення, кроки оформлення' },
  'a11y-os': { role: 'Frontend з досвідом accessibility', why: 'виправлення WCAG-порушень' },
  'seo-os': { role: 'SEO-спеціаліст', why: 'структура, розмітка, індексація, посилальне' },
  'tech-os': { role: 'Frontend / DevOps', why: 'продуктивність, заголовки безпеки, техборг' },
  'content-os': { role: 'Контент-редактор / копірайтер', why: 'описи, категорійний контент, локалізація' },
  'retention-os': { role: 'CRM/retention-маркетолог', why: 'email/SMS, лояльність, повторні продажі' },
  'pricing-os': { role: 'Категорійний менеджер / pricing', why: 'ціна в каналі, маркетплейси, промо' },
  'channel-os': { role: 'Трафік-менеджер / аналітик', why: 'канали залучення, ROAS, мікс' },
  'reputation-os': { role: 'SMM / репутація', why: 'відгуки, інфофон, робота з негативом' },
  'journey-os': { role: 'CRO-аналітик', why: 'наскрізний шлях покупця, вузькі місця воронки' },
  'legal-os': { role: 'Юрист e-commerce', why: 'оферта, правові сторінки, повернення' },
  'causal-os': { role: 'Продуктовий аналітик', why: 'корінні причини, пріоритизація' },
};

const wk = (weeks: number) => { const w = Math.max(0, weeks); return w <= 0 ? '—' : w < 1.5 ? '~1 тиж.' : w <= 8 ? `~${Math.round(w)} тиж.` : `~${Math.round(w / 4)} міс.`; };

export function buildEngagement(client: string, takenAt: string, findings: Finding[]): EngagementSummary {
  const tacticalF = findings.filter((f) => f.difficulty <= 2);
  const strategicF = findings.filter((f) => f.difficulty >= 4);
  const p0 = findings.filter((f) => f.priority === 'P0').length;

  // Ориентир усилий: S(diff≤2)=0.4 нед, M(3)=1.5 нед, L(≥4)=4 нед на работу; команда параллелит ~×2.5.
  const effWeeks = (fs: Finding[]) => fs.reduce((s, f) => s + (f.difficulty <= 2 ? 0.4 : f.difficulty === 3 ? 1.5 : 4), 0);
  const totalWeeksSerial = effWeeks(findings);
  const totalWeeksTeam = Math.max(2, Math.round(totalWeeksSerial / 2.5));

  // Команда: уникальные роли из доменов присутствующих находок, с нагрузкой по числу задач.
  const byDomain = new Map<string, number>();
  for (const f of findings) byDomain.set(f.domain, (byDomain.get(f.domain) ?? 0) + 1);
  const roleAgg = new Map<string, { why: string; n: number }>();
  for (const [dom, n] of byDomain) {
    const r = DOMAIN_ROLE[dom]; if (!r) continue;
    const cur = roleAgg.get(r.role) ?? { why: r.why, n: 0 };
    cur.n += n; roleAgg.set(r.role, cur);
  }
  const team: TeamRole[] = Array.from(roleAgg.entries())
    .sort((a, b) => b[1].n - a[1].n)
    .map(([role, v]) => ({ role, why: v.why, load: v.n >= 8 ? 'висока' : v.n >= 3 ? 'середня' : 'точкова' }));
  // Обязательный «дирижёр».
  team.unshift({ role: 'Керівник проєкту (Head of Commerce / PM)', why: 'пріоритети, DoD за хвилями, зв\'язка команди та замір ефекту', load: 'наскрізна' });

  const waves = [
    { title: 'Хвиля 1 — швидкі перемоги (P0 + малі правки)', focus: 'розблокувати воронку та зняти дешеві втрати', count: findings.filter((f) => f.priority === 'P0' || f.difficulty <= 2).length },
    { title: 'Хвиля 2 — важливі покращення (P1, середні)', focus: 'посилити конверсію, довіру, retention', count: findings.filter((f) => f.priority === 'P1' && f.difficulty === 3).length },
    { title: 'Хвиля 3 — стратегія (структурні)', focus: 'система: аналітика, ціноутворення, посилальне, платформа', count: strategicF.length },
  ];

  const timeline = `Орієнтир: хвиля 1 — ${wk(effWeeks(findings.filter((f) => f.priority === 'P0' || f.difficulty <= 2)) / 2)}, весь план командою з ${team.length} ролей — ${wk(totalWeeksTeam)}. Точні строки — у кошторисі після погодження scope.`;
  const budget = `Орієнтир за обсягом: ${findings.length} робіт (${tacticalF.length} тактичних, ${strategicF.length} стратегічних). Бюджет залежить від формату (аудит-фікс / спринти / під ключ) і рахується кошторисом; на цьому шарі — лише склад і масштаб.`;

  return {
    client, takenAt, total: findings.length, p0,
    tactical: { count: tacticalF.length, effortWeeks: wk(effWeeks(tacticalF) / 2), examples: tacticalF.slice(0, 4).map((f) => f.title) },
    strategic: { count: strategicF.length, effortWeeks: wk(effWeeks(strategicF) / 2), examples: strategicF.slice(0, 4).map((f) => f.title) },
    team, timeline, budget, waves,
  };
}

export function renderEngagementHtml(e: EngagementSummary): string {
  const teamRows = e.team.map((t) => `<tr><td class="e-role"><b>${esc(t.role)}</b></td><td>${esc(t.why)}</td><td class="e-load">${esc(t.load)}</td></tr>`).join('');
  const li = (xs: string[]) => xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="lead">—</p>';
  const waveRows = e.waves.map((w) => `<tr><td><b>${esc(w.title)}</b><div class="w-focus">${esc(w.focus)}</div></td><td class="num">${w.count}</td></tr>`).join('');

  const coverHtml = cover({
    kicker: 'Підсумкове резюме',
    title: 'Дорожня карта впровадження',
    verdict: 'Що робити далі, ким і в якому порядку.',
    metrics: [
      { label: 'Клієнт', value: e.client },
      { label: 'Робіт усього', value: String(e.total) },
      { label: 'Тактика / стратегія', value: `${e.tactical.count} / ${e.strategic.count}` },
      { label: 'Ролей у команді', value: String(e.team.length) },
    ],
    note: 'Резюме зведене з єдиного реєстру знахідок: масштаб задач (тактика vs стратегія), склад команди під них, порядок за хвилями та орієнтири за строками/бюджетом. Відповідає на питання «що далі і ким».',
  });

  const scale = `<section class="block"><h2>Масштаб задач: тактика і стратегія</h2>
    <div class="sw">
      <div class="col plus"><h3>Тактичні — швидкі правки (${e.tactical.count})</h3><p class="lead">Малі зусилля, ефект одразу. Орієнтир: ${e.tactical.effortWeeks}.</p>${li(e.tactical.examples)}</div>
      <div class="col minus"><h3>Стратегічні — структурні (${e.strategic.count})</h3><p class="lead">Змінюють систему, довше й дорожче. Орієнтир: ${e.strategic.effortWeeks}.</p>${li(e.strategic.examples)}</div>
    </div></section>`;

  const team = `<section class="block"><h2>Команда спеціалістів під задачі</h2>
    <p class="lead">Ролі виведені з доменів знахідок; навантаження — за кількістю задач у домені.</p>
    <table><thead><tr><th>Роль</th><th>За що відповідає</th><th>Навантаження</th></tr></thead><tbody>${teamRows}</tbody></table></section>`;

  const roadmap = `<section class="block"><h2>Порядок впровадження — за хвилями</h2>
    <table><thead><tr><th>Хвиля</th><th>Робіт</th></tr></thead><tbody>${waveRows}</tbody></table>
    <div class="concl-grid" style="margin-top:10px"><span class="k">Строки</span><span class="v">${esc(e.timeline)}</span><span class="k">Бюджет</span><span class="v">${esc(e.budget)}</span></div></section>`;

  const concl = conclusionSection([
    `З ${e.total} робіт ${e.tactical.count} тактичних (швидкі перемоги, окупаються на вже оплаченому трафіку) та ${e.strategic.count} стратегічних (структурні, змінюють систему). Критичних P0 — ${e.p0}: з них починається хвиля 1.`,
    `Команда — ${e.team.length} ролей на чолі з керівником проєкту, який тримає пріоритети, DoD за хвилями та замір ефекту. Без заміру кожної роботи проти базових вимірів план перетворюється на список задач без зворотного зв'язку.`,
  ], 'Погодити склад хвилі 1 і формат співпраці (аудит-фікс / спринти / під ключ) — після цього строки та бюджет фіксуються кошторисом.');

  const extraCss = `.e-role{white-space:nowrap} .e-load{white-space:nowrap;color:var(--muted)} .num{text-align:center;font-weight:700} .w-focus{color:var(--muted);font-size:9px;margin-top:2px}`;
  return doc(`Підсумкове резюме · ${e.client}`, coverHtml + methodologySection({
    goal: 'Звести аудит до плану дій: масштаб задач, команда, порядок за хвилями, орієнтири за строками та бюджетом.',
    sources: ['Єдиний реєстр знахідок (пріоритет, складність, домен кожної роботи)'],
    scope: `${e.total} робіт із реєстру`,
    limits: 'Строки та бюджет — орієнтири за обсягом і складністю; точні значення фіксуються кошторисом після погодження scope і формату співпраці.',
  }) + scale + team + roadmap + concl, extraCss);
}
