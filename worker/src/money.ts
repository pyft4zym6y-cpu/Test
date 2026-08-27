/**
 * Недополученный оборот — цепная атрибуция (порт gap_calculator.py, та же
 * формула выручки, что forecast() портала). Потенциал = разность двух состояний
 * воронки; вклад рычага = прирост выручки при его подмене факт→цель поверх уже
 * применённых. ИНВАРИАНТ: Σ вкладов = потенциал (складывать разрывы по рычагам
 * нельзя — это завышает итог). Новые потоки (МП, ЕС) прибавляются отдельно.
 *
 * Единицы — как в портале: cr/pay/redeem/repeat в % (÷100 внутри), aov ₴,
 * traffic сессии/мес, base чел., opr заказов на повторного клиента.
 */
export type LeverKey = 'traffic' | 'cr' | 'aov' | 'pay' | 'redeem' | 'base' | 'repeat' | 'opr';
export type LeverRow = { fact: number; target: number; source?: string };
export type Levers = Record<LeverKey, LeverRow>;

const LEVER_ORDER: { key: LeverKey; label: string }[] = [
  { key: 'traffic', label: 'Трафік / органіка' },
  { key: 'cr', label: 'Конверсія сайту' },
  { key: 'aov', label: 'Середній чек' },
  { key: 'pay', label: 'Оплата замовлень' },
  { key: 'redeem', label: 'Викуп (відмови+повернення)' },
  { key: 'base', label: 'Зростання бази' },
  { key: 'repeat', label: 'Частка повторних' },
  { key: 'opr', label: 'Частота повторних' },
];

type State = Record<LeverKey, number>;

function revenue(s: State): number {
  const cr = s.cr / 100, pay = s.pay / 100, redeem = s.redeem / 100, repeat = s.repeat / 100;
  const perOrder = s.aov * pay * redeem;
  const rNew = s.traffic * cr * perOrder;
  const rRepeat = s.base * repeat * s.opr * perOrder;
  return rNew + rRepeat;
}

export type Waterfall = { key: LeverKey; label: string; fact: number; target: number; contribMonth: number; contribYear: number };
export type ExtraStream = { name: string; monthly: number };

export type MoneyResult = {
  currentMonth: number;
  targetMonth: number;
  potentialMonth: number; // существующая воронка
  potentialYear: number;
  extraYear: number; // новые потоки
  waterfall: Waterfall[];
  consMinYear: number; // консервативная нижняя граница (нижняя половина)
  consMaxYear: number;
  /** upliftPct = null, коли поточної виручки немає: відсоток від нуля не існує. */
  forecast: { current: number; withProgram: number; upliftPct: number | null };
  invariantOk: boolean; // Σ вкладов = потенциал
};

/**
 * Що не так із вхідними показниками. Порожній масив = рахувати можна.
 *
 * Потрібне окремо від розрахунку, бо число звідси йде в дванадцять місць:
 * презентацію, docx, exec-діагностику, карту причин, промпт аналізу, метрики
 * прогону. Пропущений показник давав NaN, а `toLocaleString('ru-RU')` малює
 * його як «не число» — і в документ клієнта їхало «Недоотриманий оборот:
 * не число ₴/міс». Мовчазна відмова чесніша: кожен споживач уже вміє жити без
 * грошей (`money ? … : 'рахується після передачі доступів'`).
 */
const stateFrom = (l: Levers, side: 'fact' | 'target'): State =>
  Object.fromEntries(LEVER_ORDER.map(({ key }) => [key, l[key][side]])) as State;

export function checkLevers(l: Levers): string[] {
  const out: string[] = [];
  for (const { key, label } of LEVER_ORDER) {
    const row = l[key];
    if (!row) { out.push(`${label}: показник відсутній`); continue; }
    for (const side of ['fact', 'target'] as const) {
      const v = row[side];
      if (!Number.isFinite(v)) out.push(`${label}: ${side === 'fact' ? 'факт' : 'ціль'} — не число`);
      else if (v < 0) out.push(`${label}: ${side === 'fact' ? 'факт' : 'ціль'} відʼємний (${v})`);
    }
  }
  if (out.length) return out;   // сукупну перевірку на битих числах робити нема сенсу

  // Цільова воронка не може бути ГІРШОЮ за фактичну — це опечатка в цілях, а не
  // відʼємна можливість. Без цієї перевірки в документ їхало «недоотримано
  // −691 200 ₴/рік… це верхня рамка для бюджету програми змін».
  // Відʼємний внесок ОДНОГО важеля при загальному плюсі — нормальний розмін
  // усередині воронки, і він тут навмисно не ловиться.
  const gap = revenue(stateFrom(l, 'target')) - revenue(stateFrom(l, 'fact'));
  if (gap < 0) out.push('цільова воронка гірша за фактичну — перевірте цілі показників');
  return out;
}

export function computeMoney(levers: Levers, extra: ExtraStream[] = []): MoneyResult | null {
  // Порахувати «якось» тут гірше, ніж не рахувати: число піде в документ, який
  // клієнт читає як оцінку розміру своєї проблеми.
  if (checkLevers(levers).length) return null;
  const fact = stateFrom(levers, 'fact');
  const target = stateFrom(levers, 'target');
  const currentMonth = revenue(fact);

  const cur: State = { ...fact };
  const waterfall: Waterfall[] = [];
  for (const { key, label } of LEVER_ORDER) {
    if (fact[key] === target[key]) continue;
    const before = revenue(cur);
    cur[key] = target[key];
    const contribMonth = revenue(cur) - before;
    waterfall.push({ key, label, fact: fact[key], target: target[key], contribMonth, contribYear: contribMonth * 12 });
  }
  const targetMonth = revenue(cur);
  const potentialMonth = targetMonth - currentMonth;
  const potentialYear = potentialMonth * 12;
  const extraYear = extra.reduce((s, e) => s + e.monthly * 12, 0);

  // Сума внесків телескопується до targetMonth − currentMonth, тож за поточної
  // побудови інваріант виконується завжди. Перевірка лишається не як контроль
  // арифметики, а як сторож рефакторингу: варто комусь застосувати важіль повз
  // цей цикл або порахувати вклад від іншого стану — вона впаде.
  const sumContrib = waterfall.reduce((s, w) => s + w.contribMonth, 0);
  const invariantOk = Math.abs(sumContrib - potentialMonth) < Math.max(1, Math.abs(potentialMonth) * 1e-6);

  const grandYear = potentialYear + extraYear;
  const currentYear = currentMonth * 12;
  return {
    currentMonth, targetMonth, potentialMonth, potentialYear, extraYear, waterfall,
    consMinYear: Math.round(grandYear * 0.5), // нижняя половина расчётного диапазона (метод: консервативно)
    consMaxYear: Math.round(grandYear),
    forecast: {
      current: Math.round(currentYear),
      withProgram: Math.round(currentYear + grandYear),
      // null, а не 0: у клієнта до запуску виторгу ще немає, і «+0%» поруч із
      // півторамільйонною цифрою читається як помилка розрахунку.
      upliftPct: currentYear > 0 ? Math.round((grandYear / currentYear) * 100) : null,
    },
    invariantOk,
  };
}

const fmt = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

/** Сводка денег для промпта анализа и материалов. */
export function moneyFacts(m: MoneyResult): string {
  const L: string[] = [];
  L.push('# ГРОШІ (ланцюгова атрибуція — не перераховуй і не додавай внески важелів заново)');
  L.push(`Виручка зараз: ${fmt(m.currentMonth)}/міс. За цільової воронки: ${fmt(m.targetMonth)}/міс.`);
  L.push(`Недоотриманий оборот (наявна воронка): ${fmt(m.potentialMonth)}/міс ≈ ${fmt(m.potentialYear)}/рік.`);
  if (m.extraYear) L.push(`Нові потоки (МП/ЄС): +${fmt(m.extraYear)}/рік.`);
  const uplift = m.forecast.upliftPct === null
    ? ' Бази для порівняння немає — виторг рахується з нуля.'
    : ` (+${m.forecast.upliftPct}%).`;
  L.push(`Консервативно: ${fmt(m.consMinYear)}–${fmt(m.consMaxYear)}/рік. Прогноз 12 міс: ${fmt(m.forecast.current)} → ${fmt(m.forecast.withProgram)}${uplift}`);
  L.push('Внесок важелів (₴/рік): ' + m.waterfall.map((w) => `${w.label} ${fmt(w.contribYear)}`).join('; '));
  if (!m.invariantOk) L.push('⚠️ Інваріант Σ внесків = потенціал порушено — перевір базові показники.');
  return L.join('\n');
}
