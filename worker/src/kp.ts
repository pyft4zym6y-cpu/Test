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
import { doc, esc, cover, pageFooter, conclusionSection } from './export/reportShell.js';

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
const WAVE_WEEKS: Record<number, string> = { 1: '0–3 міс', 2: '3–6 міс', 3: '6–12 міс' };

const SYSTEM = `Ти збираєш комерційну пропозицію для власника e-commerce на основі проведеного аудиту. Продавальна логіка: біль → ціна болю → рішення → як → вибір. Правила:
- Лише за фактами аудиту. Нічого не вигадуй; межу факт/припущення став рано.
- Говори про оборот і вартість компанії, а не про «пункти конверсії». Болі — за причиною, а не симптомом.
- Нейтральний бренд, без сторонніх назв агенцій. Мова українська, тон впевнений, без води.
Поверни СТРОГО JSON (усі значення — українською):
{
 "forClient":"1–2 речення: для кого і контекст (із запиту/знахідок)",
 "method":"1–2 речення: на чому побудовані висновки і де межа факт/припущення",
 "pains":["біль за причиною з ефектом", "..."],
 "pointB":"2–3 речення: точка Б — яким стане бізнес після програми",
 "howMeasure":"як вимірюємо результат: KPI і звірка прогнозу з фактом на 3/6/12 міс",
 "scenarios":[{"name":"Нічого не робити","desc":"ціна бездіяльності"},{"name":"...","desc":"..."}],
 "nextSteps":["конкретний наступний крок", "..."]
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
    const text = await ask(SYSTEM + (await knowledgeFor('analyze', 'business')), facts.join('\n'), 6000);
    const kp = extractJson<Kp>(text);
    if (!kp.pointB) return null;
    kp.pains = kp.pains ?? []; kp.scenarios = kp.scenarios ?? []; kp.nextSteps = kp.nextSteps ?? [];
    return kp;
  } catch { return null; }
}

export function renderKpMd(ds: AuditDataset, kp: Kp, money: MoneyResult | null, scope: ScopeReport | null): string {
  const o: string[] = [];
  o.push(`# Комерційна пропозиція — ${ds.client.finalUrl || ds.client.rootUrl}`);
  o.push('');
  o.push(`## Для кого\n${kp.forClient}`);
  o.push(`\n## Методика\n${kp.method}`);
  if (kp.pains.length) { o.push('\n## Болі (за причиною)'); for (const x of kp.pains) o.push(`- ${x}`); }
  if (money) {
    o.push('\n## Ціна бездіяльності');
    o.push(`Недоотриманий оборот ≈ **${rub(money.potentialYear)}/рік** (консервативно ${rub(money.consMinYear)}–${rub(money.consMaxYear)}). Кожен місяць зволікання — втрачений оборот.`);
  } else {
    o.push('\n## Ціна бездіяльності');
    o.push('Рахується за даними (трафік, конверсія, чек). У зовнішньому аудиті — якісно: розриви проти еталона вже видно.');
  }
  o.push(`\n## Точка Б\n${kp.pointB}`);
  if (scope?.waves?.length) {
    o.push('\n## Програма за хвилями');
    o.push('| Хвиля | Строк | Що робимо |');
    o.push('| --- | --- | --- |');
    for (const w of scope.waves) o.push(`| ${w.n} | ${WAVE_WEEKS[w.n] ?? ''} | ${w.items.map((i) => `${i.playbook} ${i.name}`).join('; ')} |`);
  }
  o.push(`\n## Як вимірюємо результат\n${kp.howMeasure}`);
  o.push('\n## Бюджет\nЗбирається з cost_base (капітальні разові + операційні ретейнери). Розділяється на вартість запуску та місячне навантаження. _Заповнюється за підтвердженими ставками._');
  if (kp.scenarios.length) { o.push('\n## Сценарії'); for (const s of kp.scenarios) o.push(`- **${s.name}** — ${s.desc}`); }
  if (kp.nextSteps.length) { o.push('\n## Наступні кроки'); kp.nextSteps.forEach((s, i) => o.push(`${i + 1}. ${s}`)); }
  o.push('\n---\n_Підсумок кратно перевищує бюджет за повної реалізації; поруч — консервативний сценарій за нижньою межею важелів._');
  return o.join('\n');
}

/** КП в PDF (надёжная вёрстка — таблица «Программа по волнам» не «плывёт», как в Word). */
export function renderKpPdf(ds: AuditDataset, kp: Kp, money: MoneyResult | null, scope: ScopeReport | null): string {
  const client = (() => { try { return new URL(ds.client.finalUrl || ds.client.rootUrl).hostname.replace(/^www\./, ''); } catch { return ds.client.finalUrl || ds.client.rootUrl; } })();
  const p = (s: string) => `<p style="font-size:10.5px;line-height:1.55;margin:0 0 6px">${esc(s)}</p>`;

  const coverHtml = cover({
    kicker: 'Комерційна пропозиція',
    title: `Програма зростання для ${client}`,
    metrics: [
      { label: 'Клієнт', value: client },
      ...(money ? [{ label: 'Ціна бездіяльності', value: `${rub(money.potentialYear)}/рік` }] : []),
    ],
    note: esc(kp.forClient),
  });

  const method = `<section class="block"><h2>Методика</h2>${p(kp.method)}</section>`;
  const pains = kp.pains.length ? `<section class="block"><h2>Болі — за кореневою причиною</h2><ul>${kp.pains.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const cost = `<section class="block"><h2>Ціна бездіяльності</h2>${money
    ? p(`Недоотриманий оборот ≈ ${rub(money.potentialYear)}/рік (консервативно ${rub(money.consMinYear)}–${rub(money.consMaxYear)}). Кожен місяць зволікання — втрачений оборот.`)
    : p('Рахується за даними (трафік, конверсія, чек). У зовнішньому аудиті — якісно: розриви проти еталона вже видно.')}</section>`;
  const pointB = `<section class="block"><h2>Точка Б</h2>${p(kp.pointB)}</section>`;

  const waves = scope?.waves?.length ? `<section class="block"><h2>Програма за хвилями</h2>
    <table><thead><tr><th style="width:70px">Хвиля</th><th style="width:90px">Строк</th><th>Що робимо</th></tr></thead><tbody>
    ${scope.waves.map((w) => `<tr><td><b>Хвиля ${w.n}</b></td><td>${esc(WAVE_WEEKS[w.n] ?? '')}</td><td>${w.items.map((i) => `${esc(i.playbook)} ${esc(i.name)}`).join('; ')}</td></tr>`).join('')}
    </tbody></table></section>` : '';

  const measure = `<section class="block"><h2>Як вимірюємо результат</h2>${p(kp.howMeasure)}</section>`;
  const budget = `<section class="block"><h2>Бюджет</h2>${p('Збирається з cost_base (капітальні разові + операційні ретейнери): вартість запуску та місячне навантаження. Заповнюється за підтвердженими ставками при погодженні scope.')}</section>`;
  const scenarios = kp.scenarios.length ? `<section class="block"><h2>Сценарії співпраці</h2><table><tbody>${kp.scenarios.map((s) => `<tr><td style="width:180px"><b>${esc(s.name)}</b></td><td>${esc(s.desc)}</td></tr>`).join('')}</tbody></table></section>` : '';
  const steps = kp.nextSteps.length ? `<section class="block"><h2>Наступні кроки</h2><ol>${kp.nextSteps.map((s) => `<li style="margin:3px 0">${esc(s)}</li>`).join('')}</ol></section>` : '';

  const concl = conclusionSection([
    'Підсумок програми кратно перевищує бюджет за повної реалізації; поруч — консервативний сценарій за нижньою межею важелів. Ми платимо за результат етапами (Definition of Done за кожною хвилею), тому бюджет захищений.',
  ], 'Погодити склад хвилі 1 і формат співпраці — після цього бюджет і строки фіксуються кошторисом.');

  const extra = `ol{padding-left:18px} ul{padding-left:16px}`;
  return doc(`Комерційна пропозиція · ${client}`, coverHtml + method + pains + cost + pointB + waves + measure + scenarios + budget + steps + concl + pageFooter(), extra);
}
