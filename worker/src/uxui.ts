/**
 * UX/UI-разбор страниц против эталона (AQC — Atomic Quality Criteria скилла
 * Commerce OS). Переводит UX из «вкусовщины» в проверяемый стандарт: каждая
 * находка формулируется как `AQC-VIS-0001 · Fail · Primary CTA не виден в первом
 * экране` — с доменом, severity и условием Pass. Работает на T1 (слой L0, без
 * доступов): факт-слой считается детерминированно из дизайн-замеров обхода
 * (`PageAudit.ux`), а Claude добавляет постраничный разбор и приоритетные правки.
 *
 * Пара к PB-15 (UX/CRO-аудит) и PB-52 (Design System); опора — ux_standards
 * (AQC) и энциклопедия uxui из метода.
 */
import type { AuditDataset } from './report.js';
import type { PageAudit, PageKind, UxProbe } from './crawl.js';
import { ask, extractJson, hasKey } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Verdict = 'pass' | 'warn' | 'fail' | 'na';

type Criterion = {
  aqc: string;
  domain: string;
  severity: Severity;
  title: string;
  standard: string;               // эталон: условие Pass
  applies: PageKind[];
  evaluate: (ux: UxProbe, p: PageAudit) => { verdict: Verdict; observed: string };
};

const check = (p: PageAudit, id: string): boolean | null => {
  const c = p.checks.find((x) => x.id === id);
  return c ? c.pass : null;
};

const V = (cond: boolean, obs: string): { verdict: Verdict; observed: string } => ({ verdict: cond ? 'pass' : 'fail', observed: obs });

/** Эталон: атомарные критерии качества по доменам AQC, привязанные к типам страниц. */
const STANDARD: Criterion[] = [
  {
    aqc: 'AQC-VIS-0001', domain: 'Visibility', severity: 'Critical',
    title: 'Главное действие видно в первом экране',
    standard: 'Primary CTA обнаруживается менее чем за 2 с, без скролла, контрастнее окружения.',
    applies: ['home', 'plp', 'pdp', 'cart', 'checkout'],
    evaluate: (ux) => ux.primaryCtaAboveFold
      ? { verdict: 'pass', observed: 'крупная кнопка-действие в первом экране' }
      : { verdict: 'fail', observed: 'в первом экране не найдено выраженной кнопки-действия' },
  },
  {
    aqc: 'AQC-VIS-0044', domain: 'Visibility', severity: 'High',
    title: 'CTA не размывается конкурентами',
    standard: 'Один визуальный приоритет: не более 2–3 цветов кнопок и умеренное число действий в первом экране.',
    applies: ['home', 'pdp', 'plp'],
    evaluate: (ux) => {
      const bad = ux.distinctButtonColors > 3 || ux.foldButtons > 12;
      return { verdict: bad ? 'warn' : 'pass', observed: `${ux.foldButtons} действий в первом экране, ${ux.distinctButtonColors} цвет(а) кнопок` };
    },
  },
  {
    aqc: 'AQC-VIS-0112', domain: 'Visibility', severity: 'High',
    title: 'Цена видна сразу',
    standard: 'Цена читается без действий пользователя на листинге и карточке.',
    applies: ['plp', 'pdp'],
    evaluate: (ux) => V(ux.priceVisible, ux.priceVisible ? 'цена на странице' : 'цена не обнаружена в контенте'),
  },
  {
    aqc: 'AQC-REC-0001', domain: 'Recognition', severity: 'Critical',
    title: '«В корзину» распознаётся как главное действие',
    standard: 'Кнопка добавления в корзину распознаётся мгновенно и находится в первом экране карточки.',
    applies: ['pdp'],
    evaluate: (ux) => V(ux.addToCartProminent, ux.addToCartProminent ? 'кнопка добавления видна в первом экране' : 'выраженной кнопки «в корзину» в первом экране не найдено'),
  },
  {
    aqc: 'AQC-REC-0102', domain: 'Recognition', severity: 'High',
    title: 'Явный выбор варианта',
    standard: 'Размер/цвет/комплектация выбираются заметным контролом до добавления в корзину.',
    applies: ['pdp'],
    evaluate: (ux) => V(ux.variantSelector, ux.variantSelector ? 'обнаружен селектор варианта' : 'селектор варианта не обнаружен (возможно, товар без вариантов)'),
  },
  {
    aqc: 'AQC-CMP-0007', domain: 'Comprehension', severity: 'Medium',
    title: 'Визуальная иерархия заголовков',
    standard: 'Ровно один H1 и несколько уровней заголовков — сканируемая структура.',
    applies: ['home', 'pdp', 'plp', 'content'],
    evaluate: (ux, p) => {
      const oneH1 = check(p, 'h1');
      const ok = ux.headingLevels >= 2 && oneH1 !== false;
      return { verdict: ok ? 'pass' : 'warn', observed: `уровней заголовков: ${ux.headingLevels}${oneH1 === false ? ', H1 не единственный' : ''}` };
    },
  },
  {
    aqc: 'AQC-DIS-0001', domain: 'Discoverability', severity: 'High',
    title: 'Поиск по сайту',
    standard: 'Поле поиска доступно на витрине и листинге (information scent).',
    applies: ['home', 'plp'],
    evaluate: (_ux, p) => V(check(p, 'search') === true, check(p, 'search') === true ? 'поиск обнаружен' : 'поле поиска не обнаружено'),
  },
  {
    aqc: 'AQC-DIS-0100', domain: 'Discoverability', severity: 'High',
    title: 'Фильтры/фасеты на листинге',
    standard: 'Каталог сужается фильтрами (цена, свойства) — иначе выбор рушится на широком ассортименте.',
    applies: ['plp'],
    evaluate: (ux) => V(ux.filters, ux.filters ? 'фильтры обнаружены' : 'фильтров/фасетов не обнаружено'),
  },
  {
    aqc: 'AQC-NAV-0102', domain: 'Navigation Quality', severity: 'Medium',
    title: 'Сортировка листинга',
    standard: 'Пользователь управляет порядком выдачи (цена, популярность, новизна).',
    applies: ['plp'],
    evaluate: (ux) => V(ux.sortControl, ux.sortControl ? 'сортировка обнаружена' : 'контрол сортировки не обнаружен'),
  },
  {
    aqc: 'AQC-IA-0001', domain: 'Information Architecture', severity: 'High',
    title: 'Хлебные крошки',
    standard: 'Положение в каталоге показано крошками — возврат на уровень выше в один клик.',
    applies: ['plp', 'pdp', 'content'],
    evaluate: (ux) => V(ux.breadcrumbs, ux.breadcrumbs ? 'хлебные крошки есть' : 'хлебные крошки не обнаружены'),
  },
  {
    aqc: 'AQC-NAV-0001', domain: 'Navigation Quality', severity: 'Medium',
    title: 'Объём главного меню (закон Хика)',
    standard: 'Главное меню в пределах ~5–9 пунктов верхнего уровня; глубина уводится в подменю.',
    applies: ['home'],
    evaluate: (ux) => {
      const ok = ux.navItems >= 3 && ux.navItems <= 40;
      return { verdict: ok ? 'pass' : 'warn', observed: `ссылок в области меню: ${ux.navItems}` };
    },
  },
  {
    aqc: 'AQC-NAV-0044', domain: 'Navigation Quality', severity: 'Medium',
    title: 'Закреплённый хедер',
    standard: 'Доступ к навигации и поиску при скролле (sticky/fixed header).',
    applies: ['home', 'plp', 'pdp'],
    evaluate: (ux) => V(ux.stickyHeader, ux.stickyHeader ? 'хедер закреплён' : 'хедер не закреплён при скролле'),
  },
  {
    aqc: 'AQC-VIS-0150', domain: 'Visibility', severity: 'High',
    title: 'Галерея товара',
    standard: 'Несколько изображений товара (≥3): ракурсы, детали, применение.',
    applies: ['pdp'],
    evaluate: (ux) => {
      const ok = ux.galleryImages >= 3;
      return { verdict: ok ? 'pass' : ux.galleryImages > 0 ? 'warn' : 'fail', observed: `изображений в галерее: ${ux.galleryImages}` };
    },
  },
  {
    aqc: 'AQC-DEC-0001', domain: 'Decision Architecture', severity: 'High',
    title: 'Элементы доверия рядом с решением',
    standard: 'Гарантия/возврат/безопасность и платёжные сигналы — рядом с ценой и CTA.',
    applies: ['pdp', 'checkout'],
    evaluate: (ux) => {
      const ok = ux.trustBadges || ux.paymentIcons;
      return { verdict: ok ? 'pass' : 'fail', observed: [ux.trustBadges ? 'бейджи доверия' : '', ux.paymentIcons ? 'платёжные сигналы' : ''].filter(Boolean).join(', ') || 'сигналов доверия рядом с решением не обнаружено' };
    },
  },
  {
    aqc: 'AQC-DEC-0102', domain: 'Decision Architecture', severity: 'Medium',
    title: 'Социальное доказательство',
    standard: 'Отзывы/рейтинг доступны на карточке и листинге.',
    applies: ['pdp', 'plp', 'home'],
    evaluate: (ux) => V(ux.reviews, ux.reviews ? 'отзывы/рейтинг обнаружены' : 'отзывов/рейтинга не обнаружено'),
  },
  {
    aqc: 'AQC-CMP-0210', domain: 'Comprehension', severity: 'Medium',
    title: 'Доставка и оплата на карточке',
    standard: 'Условия доставки/оплаты видны на карточке — снимает ключевое возражение до корзины.',
    applies: ['pdp'],
    evaluate: (_ux, p) => V(check(p, 'delivery') === true, check(p, 'delivery') === true ? 'условия доставки/оплаты в контенте' : 'условий доставки/оплаты на карточке не обнаружено'),
  },
  {
    aqc: 'AQC-FRM-0001', domain: 'Forms & Data Entry', severity: 'High',
    title: 'Короткий чекаут',
    standard: 'Число полей в разумных пределах (средний чекаут — 23,5 поля, Baymard; цель — заметно короче).',
    applies: ['checkout', 'cart'],
    evaluate: (ux) => {
      if (ux.formFields === 0) return { verdict: 'na', observed: 'форма чекаута не обнаружена на этой странице' };
      const ok = ux.formFields <= 15;
      return { verdict: ok ? 'pass' : 'warn', observed: `видимых полей формы: ${ux.formFields}` };
    },
  },
  {
    aqc: 'AQC-FRM-0102', domain: 'Forms & Data Entry', severity: 'High',
    title: 'Гостевой чекаут',
    standard: 'Оформление без обязательной регистрации (обяз. регистрация — 19% брошенных корзин, Baymard).',
    applies: ['checkout', 'cart'],
    evaluate: (ux) => V(ux.guestCheckoutHint, ux.guestCheckoutHint ? 'намёк на гостевой чекаут есть' : 'признаков гостевого чекаута не обнаружено'),
  },
  {
    aqc: 'AQC-MOB-0001', domain: 'Mobile Visibility', severity: 'High',
    title: 'Размер тач-таргетов (Thumb Zone)',
    standard: 'Критичные кликабельные элементы ≥ 40–48px по высоте — попадание большим пальцем.',
    applies: ['home', 'plp', 'pdp', 'cart', 'checkout'],
    evaluate: (ux) => {
      const ok = ux.smallTapTargets <= 6;
      return { verdict: ok ? 'pass' : 'warn', observed: `кликабельных ниже 40px: ${ux.smallTapTargets}` };
    },
  },
  {
    aqc: 'AQC-MOB-0022', domain: 'Mobile Visibility', severity: 'Medium',
    title: 'Читаемый базовый кегль',
    standard: 'Базовый шрифт ≥ 14–16px и корректный viewport — без зума на мобильном.',
    applies: ['home', 'plp', 'pdp', 'content'],
    evaluate: (ux, p) => {
      const vp = check(p, 'viewport') === true;
      const ok = ux.baseFontPx >= 14 && vp;
      return { verdict: ok ? 'pass' : 'warn', observed: `базовый кегль ${Math.round(ux.baseFontPx)}px${vp ? '' : ', viewport не задан'}` };
    },
  },
  {
    aqc: 'AQC-VIS-0300', domain: 'Accessibility Visibility', severity: 'Medium',
    title: 'ALT у изображений',
    standard: 'У ≥70% изображений задан осмысленный ALT (доступность + SEO).',
    applies: ['home', 'plp', 'pdp', 'content'],
    evaluate: (_ux, p) => {
      const c = p.checks.find((x) => x.id === 'alt');
      return { verdict: c ? (c.pass ? 'pass' : 'fail') : 'na', observed: c?.detail ? `ALT: ${c.detail}` : 'изображений не обнаружено' };
    },
  },
  {
    aqc: 'AQC-TRU-0001', domain: 'Trust Visibility', severity: 'High',
    title: 'Базовые сигналы доверия витрины',
    standard: 'HTTPS + контактный телефон/адрес + платёжные сигналы — снимают тревогу на входе.',
    applies: ['home', 'checkout'],
    evaluate: (ux, p) => {
      const https = check(p, 'https') === true;
      const phone = check(p, 'phone') === true;
      const ok = https && (phone || ux.paymentIcons);
      return { verdict: ok ? 'pass' : 'warn', observed: [https ? 'HTTPS' : 'нет HTTPS', phone ? 'телефон' : '', ux.paymentIcons ? 'платёжные сигналы' : ''].filter(Boolean).join(', ') };
    },
  },
];

export type PageUx = {
  url: string;
  kind: PageKind;
  kindLabel: string;
  title: string;
  score: number | null;
  screenshot?: string;
  results: { aqc: string; domain: string; severity: Severity; title: string; standard: string; verdict: Verdict; observed: string }[];
};

export type UxUiReport = {
  reachable: boolean;
  pages: PageUx[];
  fails: { aqc: string; title: string; severity: Severity; domain: string; pages: number }[]; // сгруппировано по критерию
  counts: Record<Verdict, number>;
  bySeverity: Record<Severity, number>; // число fail по severity
  competitorEdge: { aqc: string; title: string; note: string }[]; // критерии, где конкурент лучше клиента
  narrative?: UxNarrative;
};

export type UxNarrative = {
  summary: string;
  perPage: { kind: string; text: string }[];
  topFixes: { aqc: string; severity: string; fix: string; effect: string; playbook: string }[];
};

const KIND_LABEL: Record<PageKind, string> = {
  home: 'Главная', plp: 'Каталог/PLP', pdp: 'Карточка/PDP', cart: 'Корзина', checkout: 'Чекаут', content: 'Контент', faq: 'FAQ', other: 'Прочее',
};

const DEFAULT_UX: UxProbe = {
  foldButtons: 0, primaryCtaAboveFold: false, navItems: 0, breadcrumbs: false, stickyHeader: false, headingLevels: 0,
  distinctButtonColors: 0, productCards: 0, filters: false, sortControl: false, galleryImages: 0, addToCartProminent: false,
  variantSelector: false, priceVisible: false, trustBadges: false, paymentIcons: false, reviews: false, formFields: 0,
  guestCheckoutHint: false, smallTapTargets: 0, baseFontPx: 16, bodyWords: 0, blocks: {}, annotations: [],
};

function evaluatePage(p: PageAudit): PageUx {
  const ux = p.ux ?? DEFAULT_UX;
  const results = STANDARD
    .filter((c) => c.applies.includes(p.kind))
    .map((c) => { const r = c.evaluate(ux, p); return { aqc: c.aqc, domain: c.domain, severity: c.severity, title: c.title, standard: c.standard, verdict: r.verdict, observed: r.observed }; });
  return { url: p.finalUrl || p.url, kind: p.kind, kindLabel: KIND_LABEL[p.kind], title: p.title, score: p.score, screenshot: p.screenshot, results };
}

/** Детерминированный факт-слой UX/UI: сверка каждой разобранной страницы с AQC-эталоном. */
export function buildUxUiReport(ds: AuditDataset): UxUiReport {
  const analysable = ds.client.pages.filter((p) => !p.error && p.checks.length);
  const pages = analysable.map(evaluatePage);

  const counts: Record<Verdict, number> = { pass: 0, warn: 0, fail: 0, na: 0 };
  const bySeverity: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const failMap = new Map<string, { aqc: string; title: string; severity: Severity; domain: string; pages: number }>();
  for (const pg of pages) for (const r of pg.results) {
    counts[r.verdict]++;
    if (r.verdict === 'fail') {
      bySeverity[r.severity]++;
      const cur = failMap.get(r.aqc) ?? { aqc: r.aqc, title: r.title, severity: r.severity, domain: r.domain, pages: 0 };
      cur.pages++; failMap.set(r.aqc, cur);
    }
  }
  const sevRank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const fails = Array.from(failMap.values()).sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || b.pages - a.pages);

  // Конкурентный край: критерий, который проваливает клиент, но проходит конкурент (эталон рынка).
  const competitorEdge: { aqc: string; title: string; note: string }[] = [];
  if (ds.competitors.length) {
    const compReports = ds.competitors.map((c) => ({ name: c.finalUrl || c.rootUrl, pages: c.pages.filter((p) => !p.error && p.checks.length).map(evaluatePage) }));
    const clientFailAqc = new Set(fails.map((f) => f.aqc));
    for (const f of fails) {
      const winner = compReports.find((cr) => cr.pages.some((pg) => pg.results.some((r) => r.aqc === f.aqc && r.verdict === 'pass')));
      if (winner && clientFailAqc.has(f.aqc)) competitorEdge.push({ aqc: f.aqc, title: f.title, note: `у конкурента (${winner.name}) критерий выполнен` });
    }
  }

  return { reachable: ds.client.reachable, pages, fails, counts, bySeverity, competitorEdge };
}

/** Компактная сводка фактов для промпта Claude (заземление, без выдумки). */
export function uxFacts(r: UxUiReport): string {
  const lines: string[] = [];
  lines.push(`UX/UI-разбор против AQC-эталона. Разобрано страниц: ${r.pages.length}. Pass ${r.counts.pass} · warn ${r.counts.warn} · fail ${r.counts.fail}. Провалов по severity: Critical ${r.bySeverity.Critical}, High ${r.bySeverity.High}, Medium ${r.bySeverity.Medium}.`);
  for (const pg of r.pages) {
    lines.push(`\n[${pg.kindLabel}] ${pg.url} — соответствие голд-стандарту ${pg.score ?? '—'}%`);
    for (const x of pg.results) lines.push(`  ${x.aqc} · ${x.severity} · ${x.verdict.toUpperCase()} — ${x.title}: ${x.observed} (эталон: ${x.standard})`);
  }
  if (r.competitorEdge.length) {
    lines.push(`\nГде конкурент сильнее (эталон рынка):`);
    for (const e of r.competitorEdge) lines.push(`  ${e.aqc} ${e.title} — ${e.note}`);
  }
  return lines.join('\n');
}

const SYSTEM = `Ты — ведущий UX/CRO-аудитор Commerce OS (плейбуки PB-15 и PB-52). Тебе дан детерминированный факт-слой L0: сверка страниц e-commerce с атомарными критериями качества (AQC) по доменам Visibility, Recognition, Comprehension, Discoverability, Information Architecture, Decision Architecture, Navigation Quality, Forms, Mobile, Trust.

Задача: постраничный UX/UI-разбор дизайна против эталона. Правила:
- Опирайся ТОЛЬКО на переданные факты. Ничего не выдумывай: чего нет в фактах — не утверждай.
- Это слой L0 (внешний обход без доступов): формулируй как наблюдение/гипотезу, не как факт по данным клиента. Помни: «не обнаружено» ≠ «отсутствует» — учитывай паттерны скрытия (свёрнутый блок, за иконкой, другой брейкпоинт).
- Каждую находку привязывай к коду AQC и severity, в формате метода: «AQC-VIS-0001 · Fail · <проблема>». Это снимает возражение «это ваше мнение».
- Группируй по причине, а не по симптому. Показывай бизнес-эффект (конверсия/доверие/добавления в корзину), но без выдуманных чисел.
- Язык — русский, тон профессиональный и конкретный.

Верни СТРОГО JSON:
{
  "summary": "3–5 предложений: общее состояние UX/UI витрины против эталона, где системная слабина",
  "perPage": [{"kind": "Главная|Каталог/PLP|Карточка/PDP|Корзина|Чекаут|Контент", "text": "разбор дизайна страницы: что сделано по эталону, что провалено (с кодами AQC и severity), эффект"}],
  "topFixes": [{"aqc": "AQC-...", "severity": "Critical|High|Medium|Low", "fix": "что именно поправить в дизайне", "effect": "на что повлияет", "playbook": "PB-15|PB-52"}]
}`;

/** Аналитический слой: Claude превращает сверку в постраничный разбор дизайна. */
export async function narrateUxUi(ds: AuditDataset, r: UxUiReport): Promise<UxNarrative | null> {
  if (!hasKey() || !r.pages.length) return null;
  const user = `Клиент: ${ds.client.finalUrl || ds.client.rootUrl}. Тир T${ds.tier}. Запрос: ${ds.request || '—'}.\n\nФАКТ-СЛОЙ (сверка с AQC-эталоном):\n${uxFacts(r)}\n\nСобери JSON по инструкции. perPage — по одному объекту на каждый разобранный тип страницы. topFixes — 5–8 правок, отсортированных по severity.`;
  try {
    const text = await ask(SYSTEM + (await knowledgeFor('uxui')), user, 9000);
    const n = extractJson<UxNarrative>(text);
    if (!n.summary || !Array.isArray(n.perPage)) return null;
    n.topFixes = Array.isArray(n.topFixes) ? n.topFixes : [];
    return n;
  } catch {
    return null;
  }
}

const MARK: Record<Verdict, string> = { pass: '✓', warn: '≈', fail: '✕', na: '—' };

/** Детерминированный Markdown-документ UX/UI-разбора (питает и .docx). */
export function renderUxUiMd(ds: AuditDataset, r: UxUiReport): string {
  const out: string[] = [];
  out.push(`# UX/UI-разбор страниц против эталона — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · слой L0 (внешний обход без доступов) · сверка с AQC (Atomic Quality Criteria), пара к PB-15/PB-52 · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  out.push('Каждый критерий — атомарный стандарт качества с severity и условием Pass. Обозначения: ✓ выполнено · ≈ частично · ✕ провал · — неприменимо. Все оценки — наблюдение L0, не факт по данным клиента; «не обнаружено» ≠ «отсутствует».');
  out.push('');

  if (!r.pages.length) {
    out.push('> Страницы не удалось разобрать (сайт недоступен или бот-защита). UX/UI-разбор появится после успешного обхода или с доступами.');
    return out.join('\n');
  }

  if (r.narrative?.summary) { out.push('## Резюме'); out.push(r.narrative.summary); out.push(''); }

  out.push('## Сводка соответствия эталону');
  out.push(`Разобрано страниц: **${r.pages.length}**. Провалов критериев: **${r.counts.fail}** (Critical ${r.bySeverity.Critical} · High ${r.bySeverity.High} · Medium ${r.bySeverity.Medium}), частично: ${r.counts.warn}, выполнено: ${r.counts.pass}.`);
  out.push('');
  if (r.fails.length) {
    out.push('Проваленные критерии (по важности):');
    out.push('');
    out.push('| AQC | Severity | Домен | Критерий | Страниц |');
    out.push('| --- | --- | --- | --- | --- |');
    for (const f of r.fails) out.push(`| ${f.aqc} | ${f.severity} | ${f.domain} | ${f.title} | ${f.pages} |`);
    out.push('');
  }

  out.push('## Постранично: факт против эталона');
  for (const pg of r.pages) {
    out.push('');
    out.push(`### ${pg.kindLabel} — ${pg.url}`);
    out.push(`Соответствие голд-стандарту витрины: **${pg.score ?? '—'}%**.`);
    const narr = r.narrative?.perPage.find((x) => x.kind === pg.kindLabel);
    if (narr) { out.push(''); out.push(narr.text); }
    out.push('');
    out.push('| AQC | Sev | ✓ | Критерий | Наблюдение | Эталон |');
    out.push('| --- | --- | --- | --- | --- | --- |');
    for (const x of pg.results) out.push(`| ${x.aqc} | ${x.severity} | ${MARK[x.verdict]} | ${x.title} | ${x.observed} | ${x.standard} |`);
  }
  out.push('');

  if (r.competitorEdge.length) {
    out.push('## Эталон рынка (где конкурент сильнее)');
    for (const e of r.competitorEdge) out.push(`- **${e.aqc} ${e.title}** — ${e.note}. У клиента критерий провален.`);
    out.push('');
  }

  if (r.narrative?.topFixes?.length) {
    out.push('## Приоритетные правки дизайна');
    out.push('');
    out.push('| # | AQC | Severity | Что поправить | Эффект | Плейбук |');
    out.push('| --- | --- | --- | --- | --- | --- |');
    r.narrative.topFixes.forEach((f, i) => out.push(`| ${i + 1} | ${f.aqc} | ${f.severity} | ${f.fix} | ${f.effect} | ${f.playbook} |`));
    out.push('');
  }

  out.push('---');
  out.push('_Метод: UX-разбор ведётся кодами AQC, а не оценочными суждениями. Раскрывается с доступами (session replay, heatmap, эксперименты PB-38) — коды и структура сохраняются, уточняется уверенность._');
  return out.join('\n');
}
