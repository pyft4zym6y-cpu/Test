/**
 * Итоговое резюме внедрения: из единого реестра находок детерминированно выводит —
 *  - какие задачи ТАКТИЧЕСКИЕ (быстрые правки) vs СТРАТЕГИЧЕСКИЕ (структурные),
 *  - какую КОМАНДУ специалистов привлечь (роли из доменов находок),
 *  - ОРИЕНТИРЫ по срокам и бюджету (по объёму и сложности работ),
 *  - разбивку по волнам.
 * Отвечает на «что дальше и кем» — то, чего не хватало в сводных документах.
 */
import { esc, doc, methodologySection, conclusionSection } from './export/reportShell.js';
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
  'ux-os': { role: 'UX/CRO-дизайнер + frontend', why: 'композиция страниц, CTA, чекаут, интерактив' },
  'checkout-os': { role: 'CRO-специалист + frontend', why: 'форма чекаута, гостевой заказ, шаги оформления' },
  'a11y-os': { role: 'Frontend с опытом accessibility', why: 'исправление WCAG-нарушений' },
  'seo-os': { role: 'SEO-специалист', why: 'структура, разметка, индексация, ссылочное' },
  'tech-os': { role: 'Frontend / DevOps', why: 'производительность, заголовки безопасности, техдолг' },
  'content-os': { role: 'Контент-редактор / копирайтер', why: 'описания, категорийный контент, локализация' },
  'retention-os': { role: 'CRM/retention-маркетолог', why: 'email/SMS, лояльность, повторные продажи' },
  'pricing-os': { role: 'Категорийный менеджер / pricing', why: 'цена в канале, маркетплейсы, промо' },
  'channel-os': { role: 'Трафик-менеджер / аналитик', why: 'каналы привлечения, ROAS, микс' },
  'reputation-os': { role: 'SMM / репутация', why: 'отзывы, инфофон, работа с негативом' },
  'journey-os': { role: 'CRO-аналитик', why: 'сквозной путь покупателя, узкие места воронки' },
  'legal-os': { role: 'Юрист e-commerce', why: 'оферта, правовые страницы, возврат' },
  'causal-os': { role: 'Продуктовый аналитик', why: 'корневые причины, приоритизация' },
};

const wk = (weeks: number) => { const w = Math.max(0, weeks); return w <= 0 ? '—' : w < 1.5 ? '~1 нед.' : w <= 8 ? `~${Math.round(w)} нед.` : `~${Math.round(w / 4)} мес.`; };

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
    .map(([role, v]) => ({ role, why: v.why, load: v.n >= 8 ? 'высокая' : v.n >= 3 ? 'средняя' : 'точечная' }));
  // Обязательный «дирижёр».
  team.unshift({ role: 'Руководитель проекта (Head of Commerce / PM)', why: 'приоритеты, DoD по волнам, связка команды и замер эффекта', load: 'сквозная' });

  const waves = [
    { title: 'Волна 1 — быстрые победы (P0 + малые правки)', focus: 'разблокировать воронку и снять дешёвые потери', count: findings.filter((f) => f.priority === 'P0' || f.difficulty <= 2).length },
    { title: 'Волна 2 — важные улучшения (P1, средние)', focus: 'усилить конверсию, доверие, retention', count: findings.filter((f) => f.priority === 'P1' && f.difficulty === 3).length },
    { title: 'Волна 3 — стратегия (структурные)', focus: 'система: аналитика, ценообразование, ссылочное, платформа', count: strategicF.length },
  ];

  const timeline = `Ориентир: волна 1 — ${wk(effWeeks(findings.filter((f) => f.priority === 'P0' || f.difficulty <= 2)) / 2)}, весь план командой из ${team.length} ролей — ${wk(totalWeeksTeam)}. Точные сроки — в смете после согласования scope.`;
  const budget = `Ориентир по объёму: ${findings.length} работ (${tacticalF.length} тактических, ${strategicF.length} стратегических). Бюджет зависит от формата (аудит-фикс / спринты / под ключ) и считается сметой; на этом слое — только состав и масштаб.`;

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

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Итоговое резюме и дорожная карта</div>
    <h1>Что делать дальше, кем и в каком порядке</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(e.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(new Date(e.takenAt).toLocaleDateString('ru-RU'))}</span></div>
      <div><span class="lbl">Работ всего</span><span class="val">${e.total}</span></div>
      <div><span class="lbl">Тактика / стратегия</span><span class="val">${e.tactical.count} / ${e.strategic.count}</span></div>
      <div><span class="lbl">Ролей в команде</span><span class="val">${e.team.length}</span></div>
    </div>
    <div class="coverage">Резюме сведено из единого реестра находок: масштаб задач (тактика vs стратегия), состав команды под них, порядок по волнам и ориентиры по срокам/бюджету. Отвечает на вопрос «что дальше и кем».</div>
  </div></section>`;

  const scale = `<section class="block"><h2>Масштаб задач: тактика и стратегия</h2>
    <div class="sw">
      <div class="col plus"><h3>Тактические — быстрые правки (${e.tactical.count})</h3><p class="lead">Малые усилия, эффект сразу. Ориентир: ${e.tactical.effortWeeks}.</p>${li(e.tactical.examples)}</div>
      <div class="col minus"><h3>Стратегические — структурные (${e.strategic.count})</h3><p class="lead">Меняют систему, дольше и дороже. Ориентир: ${e.strategic.effortWeeks}.</p>${li(e.strategic.examples)}</div>
    </div></section>`;

  const team = `<section class="block"><h2>Команда специалистов под задачи</h2>
    <p class="lead">Роли выведены из доменов находок; нагрузка — по числу задач в домене.</p>
    <table><thead><tr><th>Роль</th><th>За что отвечает</th><th>Нагрузка</th></tr></thead><tbody>${teamRows}</tbody></table></section>`;

  const roadmap = `<section class="block"><h2>Порядок внедрения — по волнам</h2>
    <table><thead><tr><th>Волна</th><th>Работ</th></tr></thead><tbody>${waveRows}</tbody></table>
    <div class="concl-grid" style="margin-top:10px"><span class="k">Сроки</span><span class="v">${esc(e.timeline)}</span><span class="k">Бюджет</span><span class="v">${esc(e.budget)}</span></div></section>`;

  const concl = conclusionSection([
    `Из ${e.total} работ ${e.tactical.count} тактических (быстрые победы, окупаются на уже оплаченном трафике) и ${e.strategic.count} стратегических (структурные, меняют систему). Критичных P0 — ${e.p0}: с них начинается волна 1.`,
    `Команда — ${e.team.length} ролей во главе с руководителем проекта, который держит приоритеты, DoD по волнам и замер эффекта. Без замера каждой работы против baseline план превращается в список задач без обратной связи.`,
  ], 'Согласовать состав волны 1 и формат сотрудничества (аудит-фикс / спринты / под ключ) — после этого сроки и бюджет фиксируются сметой.');

  const extraCss = `.e-role{white-space:nowrap} .e-load{white-space:nowrap;color:var(--muted)} .num{text-align:center;font-weight:700} .w-focus{color:var(--muted);font-size:9px;margin-top:2px}`;
  return doc(`Итоговое резюме · ${e.client}`, cover + methodologySection({
    goal: 'Свести аудит к плану действий: масштаб задач, команда, порядок по волнам, ориентиры по срокам и бюджету.',
    sources: ['Единый реестр находок (приоритет, сложность, домен каждой работы)'],
    scope: `${e.total} работ из реестра`,
    limits: 'Сроки и бюджет — ориентиры по объёму и сложности; точные значения фиксируются сметой после согласования scope и формата сотрудничества.',
  }) + scale + team + roadmap + concl, extraCss);
}
