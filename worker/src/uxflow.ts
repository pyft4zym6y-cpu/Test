/**
 * UX/UI-аудит як ПОСЛІДОВНИЙ ПРОЦЕС (A0→A4), а не купа зауважень.
 *
 * Принцип: не змішувати UX, UI і CRO в один список. Поганий UI часто — лише
 * візуальний прояв глибшої UX-проблеми, а UX-проблема — наслідок кривої бізнес-
 * або інформаційної архітектури. Тож знахідки групуємо за шарами в порядку
 * A1 Структура → A2 UX → A3 UI → Адаптив → A4 CRO/Довіра, і кожну оформлюємо як
 * Проблема → Причина → Наслідок → Рекомендація → Очікуваний ефект.
 *
 * Модуль детермінований (жодних викликів моделі): бере готовий факт-слой
 * UxUiReport і, за наявності, збагачує рекомендації AI-наративом (topFixes).
 */
import type { UxUiReport, Severity } from './uxui.js';

export type FlowFinding = {
  aqc: string;
  problem: string;      // що не так (критерій)
  cause: string;        // чому так (гіпотеза причини)
  consequence: string;  // до чого веде
  recommendation: string; // що зробити
  effect: string;       // очікуваний ефект
  severity: Severity;
  pages: number;        // на скількох сторінках
};

export type FlowLayer = {
  id: string;
  title: string;
  principle: string;
  findings: FlowFinding[];
};

export type UxFlowReport = {
  layers: FlowLayer[];
  totalFindings: number;
};

// Порядок аудиту (спайн звіту) — 5 рівнів методології.
const LAYER_DEFS: { id: string; title: string; principle: string; domains: string[] }[] = [
  {
    id: 'A1', title: 'A1 · Структура (IA · навігація · пошук · фільтри)',
    principle: 'Спершу архітектура. Якщо структура крива — жодний UI її не врятує: людина не знаходить, що шукає.',
    domains: ['Information Architecture', 'Navigation Quality', 'Discoverability'],
  },
  {
    id: 'A2', title: 'A2 · UX (сценарії · розуміння · рішення · форми)',
    principle: 'UX — чи легко пройти шлях: зрозуміти, вирішити, заповнити. Це про логіку й кількість дій, не про красу.',
    domains: ['Comprehension', 'Decision Architecture', 'Forms'],
  },
  {
    id: 'A3', title: 'A3 · UI (візуальна ієрархія · компоненти · читабельність)',
    principle: 'UI — візуальне втілення. Часто поганий UI — лише симптом UX-проблеми з рівня вище; тому дивимось його ПІСЛЯ UX.',
    domains: ['Visibility', 'Recognition'],
  },
  {
    id: 'ADP', title: 'Адаптив (mobile · touch)',
    principle: 'Мобільний — не «стиснутий десктоп»: окремі цілі торкання, навігація й checkout під палець.',
    domains: ['Mobile'],
  },
  {
    id: 'A4', title: 'A4 · CRO і довіра',
    principle: 'Конверсія — останній шар, не перший: довіра, зняті заперечення, менше тертя. Її не полагодити, поки болять A1–A3.',
    domains: ['Trust'],
  },
];

// Причина / наслідок за доменом — детерміновані шаблони (гіпотези, не факт).
const DOMAIN_HINT: Record<string, { cause: string; consequence: string; effect: string }> = {
  'Information Architecture': { cause: 'Структуру збирали від внутрішньої логіки компанії, а не від задач клієнта.', consequence: 'Людина не знаходить розділ/товар і йде до конкурента.', effect: 'Глибше проникнення в каталог, менше виходів із входу.' },
  'Navigation Quality': { cause: 'Меню/хлібні крихти не відображають реальне дерево або перевантажені.', consequence: 'Втрата орієнтації, зайві кроки, відмови на переходах.', effect: 'Коротший шлях до товару, більше переглядів на сесію.' },
  'Discoverability': { cause: 'Пошук/фільтри слабкі або приховані — товар не знайти інакше, ніж «лапками».', consequence: 'Клієнт із наміром купити не доходить до потрібного SKU.', effect: 'Зростання конверсії пошуку та використання фільтрів.' },
  'Comprehension': { cause: 'Цінність, умови й наступний крок не прочитуються за 5 секунд.', consequence: 'Сумнів → відкладання рішення → вихід.', effect: 'Швидше розуміння пропозиції, менше «подумаю».' },
  'Decision Architecture': { cause: 'Немає опор для рішення: порівняння, варіації, наявність, доставка не на видноті.', consequence: 'Рішення відкладається, кошик не наповнюється.', effect: 'Більше add-to-cart, вищий showroom→cart.' },
  'Forms': { cause: 'Форма довша й складніша, ніж треба; помилки й обовʼязковість незрозумілі.', consequence: 'Кинуті форми на реєстрації/checkout — прямий витік замовлень.', effect: 'Нижчий form abandonment, більше завершених checkout.' },
  'Visibility': { cause: 'Головна дія/елемент губиться: слабкий контраст, нижче фолда, конкурує з іншими.', consequence: 'Ключовий CTA не помічають — дія не відбувається.', effect: 'Більше кліків по цільовій дії, вищий CTR блоку.' },
  'Recognition': { cause: 'Патерни нестандартні — елементи не читаються як те, чим є (кнопка/фільтр/таб).', consequence: 'Когнітивне навантаження, помилкові кліки, розчарування.', effect: 'Впізнаваність елементів, менше помилкових дій.' },
  'Mobile': { cause: 'Десктоп «стиснули» під мобільний без окремого сценарію.', consequence: 'На телефоні (левова частка трафіку) шлях ламається — там і губляться гроші.', effect: 'Зростання мобільної конверсії до рівня десктопа.' },
  'Trust': { cause: 'Сигнали довіри (гарантії, відгуки, оплата, контакти) слабкі або відсутні.', consequence: 'Заперечення не зняті — клієнт не наважується платити.', effect: 'Менше відмов на кроці оплати, вища конверсія в замовлення.' },
};

const DEFAULT_HINT = { cause: 'Рішення ухвалили без звірки з еталоном і поведінкою користувача.', consequence: 'Тертя на шляху клієнта → втрачені дії.', effect: 'Менше тертя, вищий прохід по воронці.' };

export function buildUxFlow(r: UxUiReport): UxFlowReport {
  // мапа aqc → стандарт (що мало б бути) з розібраних сторінок
  const standardOf = new Map<string, string>();
  for (const pg of r.pages) for (const res of pg.results) if (!standardOf.has(res.aqc)) standardOf.set(res.aqc, res.standard);
  // мапа aqc → AI-фікс (fix/effect/playbook), якщо є наратив
  const fixOf = new Map<string, { fix: string; effect: string }>();
  for (const f of r.narrative?.topFixes ?? []) fixOf.set(f.aqc, { fix: f.fix, effect: f.effect });

  const domainToLayer = new Map<string, string>();
  for (const L of LAYER_DEFS) for (const d of L.domains) domainToLayer.set(d, L.id);

  const buckets = new Map<string, FlowFinding[]>();
  for (const L of LAYER_DEFS) buckets.set(L.id, []);

  for (const f of r.fails) {
    const layerId = domainToLayer.get(f.domain) ?? 'A2'; // невідомий домен → UX
    const hint = DOMAIN_HINT[f.domain] ?? DEFAULT_HINT;
    const fix = fixOf.get(f.aqc);
    buckets.get(layerId)!.push({
      aqc: f.aqc,
      problem: f.title,
      cause: hint.cause,
      consequence: hint.consequence,
      recommendation: fix?.fix || standardOf.get(f.aqc) || 'Привести до еталонної композиції розділу.',
      effect: fix?.effect || hint.effect,
      severity: f.severity,
      pages: f.pages,
    });
  }

  const sevRank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const layers: FlowLayer[] = LAYER_DEFS.map((L) => ({
    id: L.id, title: L.title, principle: L.principle,
    findings: (buckets.get(L.id) ?? []).sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || b.pages - a.pages),
  })).filter((L) => L.findings.length > 0);

  return { layers, totalFindings: layers.reduce((n, L) => n + L.findings.length, 0) };
}
