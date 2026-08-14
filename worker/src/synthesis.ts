/**
 * Слой синтеза. Инновация «шаг 3»: берёт выводы всех линз аудита (UX/AQC,
 * композиция, конкуренты, зрелость, scope, причины, деньги, движок, охват) и
 * ищет ВЗАИМОСВЯЗИ между ними — компаундные эффекты, единые корневые причины,
 * сквозные приоритеты. Даёт один всесторонний вывод вместо набора односторонних.
 * Требует ключ Claude; заземлён строго на переданных фактах.
 */
import type { AuditDataset } from './report.js';
import type { UxUiReport } from './uxui.js';
import type { PrototypeReport } from './prototype.js';
import type { BenchmarkReport } from './competitor.js';
import type { MaturityReport } from './maturity.js';
import type { ScopeReport } from './routing.js';
import type { CausalMap } from './causal.js';
import type { MoneyResult } from './money.js';
import type { EngineResult } from './portalEngine.js';
import type { CoverageReport } from './coverage.js';
import { ask, extractJson, hasKey } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

export type SynthParts = {
  uxui?: UxUiReport | null;
  proto?: PrototypeReport | null;
  bench?: BenchmarkReport | null;
  maturity?: MaturityReport | null;
  scope?: ScopeReport | null;
  causal?: CausalMap | null;
  money?: MoneyResult | null;
  engine?: EngineResult | null;
  coverage?: CoverageReport | null;
};

export type Synthesis = {
  headline: string;
  crossLinks: { a: string; b: string; effect: string }[];
  rootCauses: { cause: string; from: string[]; impact: string }[];
  priorities: { title: string; why: string }[];
  oneLine: string;
};

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

/** Компактная сводка всех линз для синтезатора (только факты). */
export function synthFacts(p: SynthParts): string {
  const L: string[] = [];
  if (p.uxui) {
    const top = p.uxui.fails.slice(0, 5).map((f) => `${f.aqc} ${f.title} (${f.severity})`).join('; ');
    L.push(`UX/AQC: провалов ${p.uxui.counts.fail} (Crit ${p.uxui.bySeverity.Critical}, High ${p.uxui.bySeverity.High}). Топ: ${top || '—'}.`);
  }
  if (p.proto) {
    const miss = p.proto.pages.flatMap((pg) => pg.missingCore.map((m) => `${pg.title}: ${m}`)).slice(0, 6).join('; ');
    L.push(`Композиция: покрытие эталона по типам ${p.proto.pages.map((pg) => `${pg.title} ${pg.coverage}%`).join(', ')}. Нет ядровых блоков: ${miss || '—'}.`);
  }
  if (p.bench) L.push(`Конкуренты: индекс клиента ${p.bench.clientIndex}/100, место ${p.bench.clientRank}/${p.bench.totalSites}. Отстаём: ${p.bench.clientBehind.join(', ') || '—'}. White space: ${p.bench.whiteSpace.join(', ') || '—'}.`);
  if (p.maturity) L.push(`Зрелость (набл.): ${p.maturity.observedAvg ?? '—'}/5. По доменам: ${p.maturity.rows.filter((r) => r.level != null).map((r) => `${r.domain} L${r.level}`).join(', ')}.`);
  if (p.engine?.score != null) L.push(`Health Score: ${p.engine.score}/100. Разрывы: ${(p.engine.gaps ?? []).map((g) => g.label).join('; ') || '—'}.`);
  if (p.money) {
    const topLever = [...p.money.waterfall].sort((a, b) => b.contribYear - a.contribYear)[0];
    L.push(`Деньги: недополучено ≈ ${rub(p.money.potentialYear)}/год. Крупнейший рычаг: ${topLever ? `${topLever.label} ${rub(topLever.contribYear)}` : '—'}.`);
  }
  if (p.causal?.nodes?.length) L.push(`Корневые причины (из болей): ${p.causal.nodes.map((n) => n.rootCause).join('; ')}.`);
  if (p.scope) L.push(`Scope: ${p.scope.waves.map((w) => `Волна ${w.n} [${w.items.map((i) => i.playbook).join(',')}]`).join(' · ')}.`);
  if (p.coverage) L.push(`Confidence Score отчёта: ${p.coverage.confidence.score}/${p.coverage.confidence.base}.`);
  return L.join('\n');
}

const SYSTEM = `Ты — главный аналитик, слой СИНТЕЗА. Тебе дан набор выводов из разных линз аудита одного магазина (UX, композиция, конкуренты, зрелость, деньги, причины, scope). Твоя задача — НЕ пересказать их, а СВЯЗАТЬ:
- найди взаимосвязи между линзами (где две проблемы усиливают друг друга — компаундный эффект: напр. слабый UX карточки × дорогой/слабый трафик = двойная потеря);
- сведи находки к единым КОРНЕВЫМ причинам (по причине, а не симптому), указывая, из каких линз собрана каждая;
- дай сквозные приоритеты, вытекающие из связей, а не из одной линзы.
Только по переданным фактам, ничего не выдумывай. Формулируй как обоснованные выводы/гипотезы.
ВАЖНО: ВСЕ текстовые значения в JSON (headline, effect, cause, impact, title, why, oneLine и т.д.) пиши природною УКРАЇНСЬКОЮ мовою, а не російською.
Верни СТРОГО JSON:
{
 "headline":"1–2 речення: головний системний висновок про цей бізнес (українською)",
 "crossLinks":[{"a":"лінза/знахідка","b":"лінза/знахідка","effect":"як підсилюють одна одну і до чого веде (українською)"}],
 "rootCauses":[{"cause":"корінна причина (українською)","from":["лінзи, звідки зібрана"],"impact":"ефект у грошах/довірі/зростанні (українською)"}],
 "priorities":[{"title":"наскрізний пріоритет (українською)","why":"чому саме він — зі зв'язків (українською)"}],
 "oneLine":"одна фраза для власника: де гроші і з чого почати (українською)"
}`;

export async function narrateSynthesis(ds: AuditDataset, p: SynthParts): Promise<Synthesis | null> {
  if (!hasKey()) return null;
  const facts = synthFacts(p);
  if (!facts.trim()) return null;
  const user = `Клиент: ${ds.client.finalUrl || ds.client.rootUrl}.\n\nВЫВОДЫ ЛИНЗ:\n${facts}\n\nСобери синтез по инструкции (JSON), все текстовые значения — украинским языком. crossLinks: 3–6, rootCauses: 3–5, priorities: 3–5.`;
  try {
    const text = await ask(SYSTEM + (await knowledgeFor('analyze')), user, 6000);
    const s = extractJson<Synthesis>(text);
    if (!s.headline) return null;
    s.crossLinks = s.crossLinks ?? [];
    s.rootCauses = s.rootCauses ?? [];
    s.priorities = s.priorities ?? [];
    return s;
  } catch { return null; }
}

export function renderSynthesisMd(ds: AuditDataset, s: Synthesis): string {
  const out: string[] = [];
  out.push(`# Синтез аудиту — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Взаємозв'язки всіх лінз аудиту_`);
  out.push('');
  out.push(`**${s.headline}**`);
  out.push('');
  if (s.crossLinks.length) {
    out.push('## Взаємозв\'язки (компаундні ефекти)');
    for (const c of s.crossLinks) out.push(`- **${c.a} × ${c.b}** → ${c.effect}`);
    out.push('');
  }
  if (s.rootCauses.length) {
    out.push('## Єдині корінні причини');
    for (const r of s.rootCauses) out.push(`- **${r.cause}** _(з: ${r.from.join(', ')})_ — ${r.impact}`);
    out.push('');
  }
  if (s.priorities.length) {
    out.push('## Наскрізні пріоритети');
    s.priorities.forEach((p, i) => out.push(`${i + 1}. **${p.title}** — ${p.why}`));
    out.push('');
  }
  out.push(`> ${s.oneLine}`);
  out.push('');
  out.push('---');
  out.push('_Синтез пов\'язує висновки всіх лінз в один всебічний, а не набір односторонніх. Уточнюється після передачі доступів._');
  return out.join('\n');
}
