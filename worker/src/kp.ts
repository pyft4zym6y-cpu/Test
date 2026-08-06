/**
 * Коммерческое предложение (КП) из аудита — переход «аудит → продажа программы».
 * Продающая логика: боль → цена боли → решение → как → сколько → выбор. Числа
 * (цена бездействия, программа по волнам) — из аудита; продающий нарратив — Claude,
 * заземлён на фактах. Нейтральный бренд (без сторонних названий).
 */
import type { AuditDataset } from './report.js';
import type { Analysis } from './analyze.js';
import type { MoneyResult } from './money.js';
import type { EngineResult } from './portalEngine.js';
import type { ScopeReport } from './routing.js';
import { ask, extractJson, hasKey } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

export type Kp = {
  forClient: string;
  method: string;
  pains: string[];
  pointB: string;
  howMeasure: string;
  scenarios: { name: string; desc: string }[];
  nextSteps: string[];
};

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;
const WAVE_WEEKS: Record<number, string> = { 1: '0–3 мес', 2: '3–6 мес', 3: '6–12 мес' };

const SYSTEM = `Ты собираешь коммерческое предложение (КП) для собственника e-commerce на основе проведённого аудита. Продающая логика: боль → цена боли → решение → как → выбор. Правила:
- Только по фактам аудита. Ничего не выдумывай; методику факт/допущение ставь рано.
- Говори про оборот и стоимость компании, а не про «пункты конверсии». Боли — по причине, а не симптому.
- Нейтральный бренд, без сторонних названий агентств. Язык русский, тон уверенный, без воды.
Верни СТРОГО JSON:
{
 "forClient":"1–2 предложения: для кого и контекст (из запроса/находок)",
 "method":"1–2 предложения: на чём построены выводы и где граница факт/допущение (слой L0)",
 "pains":["боль по причине с эффектом", "..."],
 "pointB":"2–3 предложения: точка Б — каким станет бизнес после программы",
 "howMeasure":"как измеряем результат: KPI и сверка прогноза с фактом на 3/6/12 мес",
 "scenarios":[{"name":"Ничего не делать","desc":"цена бездействия"},{"name":"...","desc":"..."}],
 "nextSteps":["конкретный следующий шаг", "..."]
}`;

export async function buildKp(ds: AuditDataset, p: { analysis: Analysis; money?: MoneyResult | null; engine?: EngineResult | null; scope?: ScopeReport | null }): Promise<Kp | null> {
  if (!hasKey()) return null;
  const facts: string[] = [];
  facts.push(`Клиент: ${ds.client.finalUrl || ds.client.rootUrl}. Тир T${ds.tier}. Запрос: ${ds.request || '—'}.`);
  if (p.analysis.summary) facts.push(`Резюме аудита: ${p.analysis.summary}`);
  if (p.analysis.pains?.length) facts.push(`Боли (по причине): ${p.analysis.pains.map((x) => x.cause).join('; ')}.`);
  if (p.engine?.score != null) facts.push(`Health Score: ${p.engine.score}/100.`);
  if (p.money) facts.push(`Недополученный оборот ≈ ${rub(p.money.potentialYear)}/год (консервативно ${rub(p.money.consMinYear)}–${rub(p.money.consMaxYear)}).`);
  if (p.scope?.waves?.length) facts.push(`Программа по волнам: ${p.scope.waves.map((w) => `Волна ${w.n} [${w.items.map((i) => i.name).join(', ')}]`).join(' · ')}.`);
  try {
    const text = await ask(SYSTEM + (await knowledgeFor('analyze')), facts.join('\n'), 6000);
    const kp = extractJson<Kp>(text);
    if (!kp.pointB) return null;
    kp.pains = kp.pains ?? []; kp.scenarios = kp.scenarios ?? []; kp.nextSteps = kp.nextSteps ?? [];
    return kp;
  } catch { return null; }
}

export function renderKpMd(ds: AuditDataset, kp: Kp, money: MoneyResult | null, scope: ScopeReport | null): string {
  const o: string[] = [];
  o.push(`# Коммерческое предложение — ${ds.client.finalUrl || ds.client.rootUrl}`);
  o.push(`_Commerce OS · на основе аудита (слой L0) · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  o.push('');
  o.push(`## Для кого\n${kp.forClient}`);
  o.push(`\n## Методика\n${kp.method}`);
  if (kp.pains.length) { o.push('\n## Боли (по причине)'); for (const x of kp.pains) o.push(`- ${x}`); }
  if (money) {
    o.push('\n## Цена бездействия');
    o.push(`Недополученный оборот ≈ **${rub(money.potentialYear)}/год** (консервативно ${rub(money.consMinYear)}–${rub(money.consMaxYear)}). Каждый месяц промедления — упущенный оборот.`);
  } else {
    o.push('\n## Цена бездействия');
    o.push('Считается на слое L1 (нужны трафик, конверсия, чек). На L0 — качественно: разрывы против эталона уже видны.');
  }
  o.push(`\n## Точка Б\n${kp.pointB}`);
  if (scope?.waves?.length) {
    o.push('\n## Программа по волнам');
    o.push('| Волна | Срок | Что делаем |');
    o.push('| --- | --- | --- |');
    for (const w of scope.waves) o.push(`| ${w.n} | ${WAVE_WEEKS[w.n] ?? ''} | ${w.items.map((i) => `${i.playbook} ${i.name}`).join('; ')} |`);
  }
  o.push(`\n## Как измеряем результат\n${kp.howMeasure}`);
  o.push('\n## Бюджет\nСобирается из cost_base (капитальные разовые + операционные ретейнеры). Разделяется на стоимость запуска и месячную нагрузку. _Заполняется по подтверждённым ставкам._');
  if (kp.scenarios.length) { o.push('\n## Сценарии'); for (const s of kp.scenarios) o.push(`- **${s.name}** — ${s.desc}`); }
  if (kp.nextSteps.length) { o.push('\n## Следующие шаги'); kp.nextSteps.forEach((s, i) => o.push(`${i + 1}. ${s}`)); }
  o.push('\n---\n_Итог кратно превышает бюджет при полной реализации; рядом — консервативный сценарий по нижней границе рычагов._');
  return o.join('\n');
}
