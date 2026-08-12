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
import { doc, esc, conclusionSection } from './export/reportShell.js';

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

/** КП в PDF (надёжная вёрстка — таблица «Программа по волнам» не «плывёт», как в Word). */
export function renderKpPdf(ds: AuditDataset, kp: Kp, money: MoneyResult | null, scope: ScopeReport | null): string {
  const client = (() => { try { return new URL(ds.client.finalUrl || ds.client.rootUrl).hostname.replace(/^www\./, ''); } catch { return ds.client.finalUrl || ds.client.rootUrl; } })();
  const date = new Date(ds.takenAt).toLocaleDateString('ru-RU');
  const p = (s: string) => `<p style="font-size:10.5px;line-height:1.55;margin:0 0 6px">${esc(s)}</p>`;

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Коммерческое предложение</div>
    <h1>Программа роста для ${esc(client)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      ${money ? `<div><span class="lbl">Цена бездействия</span><span class="val">${rub(money.potentialYear)}/год</span></div>` : ''}
    </div>
    <div class="coverage">${esc(kp.forClient)}</div>
  </div></section>`;

  const method = `<section class="block"><h2>Методика</h2>${p(kp.method)}</section>`;
  const pains = kp.pains.length ? `<section class="block"><h2>Боли — по корневой причине</h2><ul>${kp.pains.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const cost = `<section class="block"><h2>Цена бездействия</h2>${money
    ? p(`Недополученный оборот ≈ ${rub(money.potentialYear)}/год (консервативно ${rub(money.consMinYear)}–${rub(money.consMaxYear)}). Каждый месяц промедления — упущенный оборот.`)
    : p('Считается по данным (трафик, конверсия, чек). Во внешнем аудите — качественно: разрывы против эталона уже видны.')}</section>`;
  const pointB = `<section class="block"><h2>Точка Б</h2>${p(kp.pointB)}</section>`;

  const waves = scope?.waves?.length ? `<section class="block"><h2>Программа по волнам</h2>
    <table><thead><tr><th style="width:70px">Волна</th><th style="width:90px">Срок</th><th>Что делаем</th></tr></thead><tbody>
    ${scope.waves.map((w) => `<tr><td><b>Волна ${w.n}</b></td><td>${esc(WAVE_WEEKS[w.n] ?? '')}</td><td>${w.items.map((i) => `${esc(i.playbook)} ${esc(i.name)}`).join('; ')}</td></tr>`).join('')}
    </tbody></table></section>` : '';

  const measure = `<section class="block"><h2>Как измеряем результат</h2>${p(kp.howMeasure)}</section>`;
  const budget = `<section class="block"><h2>Бюджет</h2>${p('Собирается из cost_base (капитальные разовые + операционные ретейнеры): стоимость запуска и месячная нагрузка. Заполняется по подтверждённым ставкам при согласовании scope.')}</section>`;
  const scenarios = kp.scenarios.length ? `<section class="block"><h2>Сценарии сотрудничества</h2><table><tbody>${kp.scenarios.map((s) => `<tr><td style="width:180px"><b>${esc(s.name)}</b></td><td>${esc(s.desc)}</td></tr>`).join('')}</tbody></table></section>` : '';
  const steps = kp.nextSteps.length ? `<section class="block"><h2>Следующие шаги</h2><ol>${kp.nextSteps.map((s) => `<li style="margin:3px 0">${esc(s)}</li>`).join('')}</ol></section>` : '';

  const concl = conclusionSection([
    'Итог программы кратно превышает бюджет при полной реализации; рядом — консервативный сценарий по нижней границе рычагов. Мы платим за результат этапами (Definition of Done по каждой волне), поэтому бюджет защищён.',
  ], 'Согласовать состав волны 1 и формат сотрудничества — после этого бюджет и сроки фиксируются сметой.');

  const extra = `ol{padding-left:18px} ul{padding-left:16px}`;
  return doc(`Коммерческое предложение · ${client}`, cover + method + pains + cost + pointB + waves + measure + scenarios + budget + steps + concl, extra);
}
