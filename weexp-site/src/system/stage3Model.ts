/**
 * Калькулятор · Етап 3 (Tier-2) — кабінет кваліфікації ліда. Клієнт реєструється й
 * «занурює» нас у бізнес: спершу — його ціль (точка Б), далі конкуренти (динамічні
 * рядки), сайти-орієнтири (рядок + що подобається) і нативна діагностика за
 * показниками GA4 / Search Console / фінансів / команди. Питання не в лоб, а через
 * вибір. Мета — щоб клієнт САМ побачив вузол і дійшов, що йому потрібні (1) повний
 * розбір командою WEEXP і (2) нова платформа. На виході — Tier-2 звіт з епіфанією
 * (де насправді корінь) і персональними наступними кроками під Definition of Done.
 */
import { SYS, eur, type SysKey } from './lossModel';

export type BlockKind = 'single' | 'multi' | 'number' | 'url' | 'urllist' | 'refs';
export type Block = {
  id: string;
  section: string;
  label: string;
  kind: BlockKind;
  system?: SysKey;
  options?: { label: string; score?: number }[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  addLabel?: string;
};

export type RefItem = { url: string; what: number[] };

export const SECTIONS = [
  'Ваша ціль', 'Конкурентне поле', 'Орієнтири', 'Маркетинг та аналітика', 'Фінанси', 'Позиціонування і бренд', 'Сайт і технології', 'Команда і процеси',
] as const;

export const LIKE_WHAT = [
  { label: 'Візуал / дизайн' }, { label: 'Логіка / UX' }, { label: 'Швидкість і плавність' },
  { label: 'Контент / картка товару' }, { label: 'Асортимент / пропозиція' }, { label: 'Довіра / бренд' },
];

export const BLOCKS: Block[] = [
  // 0 — Ваша ціль (точка Б перша: емоційний якір, з якого починається весь шлях)
  { id: 'goal_b', section: 'Ваша ціль', label: 'Куди ви хочете прийти за 12 місяців?', kind: 'multi',
    hint: 'Оберіть усе, що відгукується. Далі весь розбір ведемо саме до цього.',
    options: [{ label: 'Кратний ріст виторгу' }, { label: 'Вища маржа і прибуток' }, { label: 'Незалежність від власника' }, { label: 'Новий сайт / платформа' }, { label: 'Нові канали й ринки' }, { label: 'Системна аналітика і контроль' }] },

  // 1 — Конкурентне поле (динамічні рядки)
  { id: 'comp_direct', section: 'Конкурентне поле', kind: 'urllist', placeholder: 'https://',
    label: 'Хто ваші прямі конкуренти?', hint: 'Ті, хто продає те саме. Один рядок — один сайт, додайте скільки треба.', addLabel: '+ Ще конкурент' },
  { id: 'comp_indirect', section: 'Конкурентне поле', kind: 'urllist', placeholder: 'https://',
    label: 'А хто забирає той самий бюджет і увагу клієнта?', hint: 'Непрямі — інша категорія, але конкурують за ваші гроші клієнта.', addLabel: '+ Ще один' },
  { id: 'cpos', section: 'Конкурентне поле', label: 'Як ви почуваєтесь поруч із ними?', kind: 'single', system: 'strategy',
    options: [{ label: 'Слабші майже в усьому', score: 0 }, { label: 'Схожі, без явної переваги', score: 1 }, { label: 'Є 1–2 сильні сторони', score: 2 }, { label: 'Маємо чітку різницю', score: 3 }] },

  // 2 — Орієнтири
  { id: 'refs', section: 'Орієнтири', kind: 'refs',
    label: 'На які сайти ви рівняєтесь?', hint: 'Додайте сайт і позначте, що саме вам у ньому подобається. Можна кілька.', addLabel: '+ Ще сайт-орієнтир' },

  // 3 — Маркетинг та аналітика (нативно: GA4 / Search Console / канали)
  { id: 'm_traffic', section: 'Маркетинг та аналітика', label: 'Звідки зараз приходить більшість покупців?', kind: 'multi',
    options: [{ label: 'Платна реклама' }, { label: 'SEO-органіка' }, { label: 'Соцмережі' }, { label: 'Email / CRM' }, { label: 'Маркетплейси' }, { label: 'Прямі й рекомендації' }] },
  { id: 'm_ga4', section: 'Маркетинг та аналітика', label: 'Що ви бачите у своїй аналітиці (GA4)?', kind: 'single', system: 'data',
    options: [{ label: 'Толком не налаштована', score: 0 }, { label: 'Дивимось трафік і перегляди', score: 1 }, { label: 'Рахуємо конверсії по цілях', score: 2 }, { label: 'Наскрізна — до доходу й ROI', score: 3 }] },
  { id: 'm_sc', section: 'Маркетинг та аналітика', label: 'Як вас видно в Google (Search Console)?', kind: 'single', system: 'data',
    options: [{ label: 'Не відстежуємо', score: 0 }, { label: 'Позиції переважно низькі', score: 1 }, { label: 'Ростемо, але нерівномірно', score: 2 }, { label: 'Топ по частині запитів', score: 3 }] },
  { id: 'm_cac', section: 'Маркетинг та аналітика', label: 'Скільки коштує залучити покупця — відносно чека?', kind: 'single', system: 'customer',
    options: [{ label: 'Дорожче за сам чек', score: 0 }, { label: 'Приблизно як чек', score: 1 }, { label: 'Дешевше, але без запасу', score: 2 }, { label: 'Значно дешевше за чек', score: 3 }] },
  { id: 'm_repeat', section: 'Маркетинг та аналітика', label: 'Скільки покупців повертаються за другою покупкою?', kind: 'single', system: 'customer',
    options: [{ label: 'Майже ніхто', score: 0 }, { label: 'До 15%', score: 1 }, { label: '15–30%', score: 2 }, { label: 'Понад 30%', score: 3 }] },

  // 4 — Фінанси
  { id: 'f_margin', section: 'Фінанси', label: 'Яка у вас валова маржа?', kind: 'single', system: 'commercial',
    options: [{ label: 'До 20%', score: 0 }, { label: '20–35%', score: 1 }, { label: '35–50%', score: 2 }, { label: 'Понад 50%', score: 3 }] },
  { id: 'f_returns', section: 'Фінанси', label: 'Скільки замовлень зривається (повернення + скасування)?', kind: 'single', system: 'operations',
    options: [{ label: 'Понад 15%', score: 0 }, { label: '8–15%', score: 1 }, { label: '4–8%', score: 2 }, { label: 'Менше 4%', score: 3 }] },
  { id: 'f_unit', section: 'Фінанси', label: 'Чи заробляєте ви з кожного продажу після реклами?', kind: 'single', system: 'commercial',
    options: [{ label: 'Ні / не рахуємо', score: 0 }, { label: 'На межі', score: 1 }, { label: 'Так, з невеликим запасом', score: 2 }, { label: 'Так, стабільно', score: 3 }] },
  { id: 'f_pnl', section: 'Фінанси', label: 'Наскільки прозорий ваш P&L по e-commerce?', kind: 'single', system: 'commercial',
    options: [{ label: 'Немає', score: 0 }, { label: 'Бачимо оборот', score: 1 }, { label: 'Є маржа по групах', score: 2 }, { label: 'Повний P&L + unit economics', score: 3 }] },
  { id: 'f_aov', section: 'Фінанси', label: 'Середній чек (AOV)', kind: 'number', unit: '€', hint: 'необовʼязково — якщо знаєте' },
  { id: 'f_ltv', section: 'Фінанси', label: 'Скільки приносить клієнт за рік (LTV)', kind: 'number', unit: '€', hint: 'необовʼязково' },

  // 5 — Позиціонування і бренд
  { id: 'b_pos', section: 'Позиціонування і бренд', label: 'Чи є у вас чітке позиціонування?', kind: 'single', system: 'strategy',
    options: [{ label: 'Немає, продаємо ціною', score: 0 }, { label: 'Розмите', score: 1 }, { label: 'Є, але не всюди', score: 2 }, { label: 'Чітке, послідовне', score: 3 }] },
  { id: 'b_audience', section: 'Позиціонування і бренд', label: 'Наскільки добре ви знаєте свою аудиторію?', kind: 'single', system: 'strategy',
    options: [{ label: 'Інтуїтивно', score: 0 }, { label: 'Демографія', score: 1 }, { label: 'Сегменти + болі', score: 2 }, { label: 'JTBD + дані', score: 3 }] },
  { id: 'b_content', section: 'Позиціонування і бренд', label: 'Чи працює на вас контент?', kind: 'single', system: 'experience',
    options: [{ label: 'Майже немає', score: 0 }, { label: 'Опис товарів', score: 1 }, { label: '+ гайди / відео', score: 2 }, { label: 'Контент-система', score: 3 }] },
  { id: 'b_social', section: 'Позиціонування і бренд', label: 'Що з довірою (відгуки, UGC, кейси)?', kind: 'single', system: 'experience',
    options: [{ label: 'Немає', score: 0 }, { label: 'Кілька відгуків', score: 1 }, { label: 'Регулярні відгуки', score: 2 }, { label: 'Система UGC + рейтинги', score: 3 }] },

  // 6 — Сайт і технології (нативно веде до нового сайту й розбору)
  { id: 'd_stack', section: 'Сайт і технології', label: 'На чому побудований ваш сайт?', kind: 'single', system: 'data',
    options: [{ label: 'Конструктор / шаблон', score: 0 }, { label: 'CMS на шаблоні', score: 1 }, { label: 'Кастомна на CMS', score: 2 }, { label: 'Headless / кастом', score: 3 }] },
  { id: 'site_age', section: 'Сайт і технології', label: 'Коли ви востаннє капітально робили або переробляли сайт?', kind: 'single', system: 'experience',
    hint: 'Не косметика, а платформа й логіка.',
    options: [{ label: '5+ років тому', score: 0 }, { label: '3–4 роки тому', score: 1 }, { label: '1–2 роки тому', score: 2 }, { label: 'Менше року тому', score: 3 }] },
  { id: 'site_audit_age', section: 'Сайт і технології', label: 'А коли востаннє робили незалежний аудит сайту й аналітики?', kind: 'single', system: 'data',
    options: [{ label: 'Ніколи', score: 0 }, { label: '2+ роки тому', score: 1 }, { label: 'Цього року', score: 2 }, { label: 'Робимо регулярно', score: 3 }] },
  { id: 'site_pain', section: 'Сайт і технології', label: 'Що на сайті найбільше стримує продажі? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Швидкість' }, { label: 'Мобільна версія' }, { label: 'Checkout / кошик' }, { label: 'Каталог і пошук' }, { label: 'Картка / контент' }, { label: 'Інтеграції й дані' }, { label: 'Застарілий дизайн' }] },

  // 7 — Команда і процеси (+ намір: з чим потрібна команда)
  { id: 'o_owner', section: 'Команда і процеси', label: 'Хто відповідає за прибуток e-commerce?', kind: 'single', system: 'org',
    options: [{ label: 'Ніхто конкретно', score: 0 }, { label: 'Власник', score: 1 }, { label: 'Керівник напряму', score: 2 }, { label: 'Роль + KPI по прибутку', score: 3 }] },
  { id: 'o_sop', section: 'Команда і процеси', label: 'Наскільки бізнес працює без вас (процеси, SOP)?', kind: 'single', system: 'org',
    options: [{ label: 'Усе в головах', score: 0 }, { label: 'Дещо задокументовано', score: 1 }, { label: 'Основні процеси', score: 2 }, { label: 'Повна база + онбординг', score: 3 }] },
  { id: 'help_want', section: 'Команда і процеси', label: 'З чим вам найбільше потрібна команда поруч? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Повний аудит e-commerce' }, { label: 'Новий сайт' }, { label: 'Трафік і маркетинг' }, { label: 'Аналітика й дані' }, { label: 'Операції й процеси' }, { label: 'Стратегія росту' }] },
];

export type Stage3Answers = Record<string, number | number[] | string | string[] | RefItem[]>;

export type Reco = { key: 'audit' | 'rebuild'; title: string; reason: string; bullets: string[]; riskReversal: string; cta: string; to: string; strong: boolean };

export type Stage3Result = {
  systems: { key: SysKey; label: string; score: number }[];
  overall: number;
  bottleneck: { key: SysKey; label: string; score: number };
  epiphany: string;
  completeness: number;
  competitors: { direct: string[]; indirect: string[] };
  likes: { url: string; what: string[] }[];
  marketing: { label: string; value: string }[];
  finance: { label: string; value: string }[];
  goals: string[];
  recos: Reco[];
  answered: number; total: number;
};

const W: Record<SysKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: 0.9, operations: 1.3, data: 1.2, org: 1.5 };
const byId = (id: string) => BLOCKS.find((b) => b.id === id);
const scoreOf = (b: Block, a: Stage3Answers[string]): number | null => {
  if (b.kind === 'single' && b.options) return typeof a === 'number' ? (b.options[a]?.score ?? 0) : null;
  if (b.kind === 'multi' && b.system && Array.isArray(a)) return Math.min(3, a.length * 0.75);
  return null;
};

// Епіфанія: поверхнева версія проблеми (у що клієнт зазвичай вірить) → справжній
// корінь (вузол) → наслідок, поки він не закритий. Ламає хибне переконання.
const EPIPHANY: Record<SysKey, { surface: string; consequence: string }> = {
  strategy: { surface: 'бракує ідей або бюджету на ріст', consequence: 'рішення ухвалюються наосліп, а гроші йдуть не туди' },
  commercial: { surface: 'треба просто більше продажів', consequence: 'оборот росте, а прибуток — ні' },
  customer: { surface: 'проблема у трафіку', consequence: 'кожен наступний клієнт коштує дедалі дорожче' },
  experience: { surface: 'потрібно більше реклами', consequence: 'ви платите за трафік, який не купує' },
  operations: { surface: 'це просто дрібні збої', consequence: 'повернення й ручна робота тихо з’їдають маржу' },
  data: { surface: 'потрібні нові інструменти', consequence: 'у кожного свої цифри, а рішення — інтуїтивні' },
  org: { surface: 'треба просто більше працювати', consequence: 'усе тримається на власнику й не масштабується' },
};

export function scoreStage3(ans: Stage3Answers, money?: [number, number]): Stage3Result {
  const systems = SYS.map(({ key, label }) => {
    const bs = BLOCKS.filter((b) => b.system === key);
    const vals = bs.map((b) => scoreOf(b, ans[b.id])).filter((v): v is number => v != null);
    const score = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length / 3 * 100) : 0;
    return { key, label, score };
  });
  const wsum = Object.values(W).reduce((a, b) => a + b, 0);
  const overall = Math.round(systems.reduce((a, s) => a + s.score * W[s.key], 0) / wsum);
  const bottleneck = [...systems].sort((a, b) => a.score - b.score)[0];
  const ep = EPIPHANY[bottleneck.key];
  const epiphany = `Виглядає, ніби ${ep.surface}. Але справжній вузол — «${bottleneck.label}»: поки він не закритий, ${ep.consequence}.`;

  const urlList = (id: string): string[] =>
    (Array.isArray(ans[id]) ? (ans[id] as unknown[]) : []).filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
  const competitors = { direct: urlList('comp_direct'), indirect: urlList('comp_indirect') };

  const refsVal: RefItem[] = Array.isArray(ans['refs']) ? (ans['refs'] as unknown[]).filter((r): r is RefItem => !!r && typeof (r as RefItem).url === 'string') as RefItem[] : [];
  const likes = refsVal.filter((r) => r.url.trim()).map((r) => {
    const whatArr: number[] = Array.isArray(r.what) ? (r.what as number[]) : [];
    return { url: r.url.trim(), what: whatArr.map((i) => LIKE_WHAT[i]?.label).filter(Boolean) as string[] };
  });

  const optLabel = (id: string): string => { const b = byId(id); const a = ans[id]; return b?.options && typeof a === 'number' ? (b.options[a]?.label ?? '—') : '—'; };
  const multiLabels = (id: string): string => { const b = byId(id); const a = ans[id]; return b?.options && Array.isArray(a) && a.length ? (a as number[]).map((i) => b.options![i]?.label).filter(Boolean).join(' · ') : '—'; };
  const num = (id: string) => (typeof ans[id] === 'string' && ans[id] !== '' ? String(ans[id]) : '');
  const withUnit = (id: string) => { const b = byId(id)!; const v = num(id); return v ? `${v}${b.unit ?? ''}` : '—'; };

  const marketing = [
    { label: 'Головні канали', value: multiLabels('m_traffic') },
    { label: 'Аналітика (GA4)', value: optLabel('m_ga4') },
    { label: 'Google / Search Console', value: optLabel('m_sc') },
    { label: 'CAC відносно чека', value: optLabel('m_cac') },
    { label: 'Повторні покупки', value: optLabel('m_repeat') },
  ];
  const finance = [
    { label: 'Валова маржа', value: optLabel('f_margin') },
    { label: 'Зриви (повернення)', value: optLabel('f_returns') },
    { label: 'Юніт-економіка', value: optLabel('f_unit') },
    { label: 'Прозорість P&L', value: optLabel('f_pnl') },
    { label: 'AOV', value: withUnit('f_aov') },
    { label: 'LTV', value: withUnit('f_ltv') },
  ];

  const idxOf = (id: string) => (typeof ans[id] === 'number' ? (ans[id] as number) : -1);
  const multiIdx = (id: string): number[] => (Array.isArray(ans[id]) ? (ans[id] as number[]).filter((x) => typeof x === 'number') : []);
  const labelsOf = (id: string, sel: number[]) => { const b = byId(id); return b?.options ? sel.map((i) => b.options![i]?.label).filter(Boolean) as string[] : []; };

  const goals = labelsOf('goal_b', multiIdx('goal_b'));
  const helpSel = labelsOf('help_want', multiIdx('help_want'));
  const painsSel = multiIdx('site_pain');
  const pains = labelsOf('site_pain', painsSel);
  const auditAge = idxOf('site_audit_age');
  const siteAge = idxOf('site_age');
  const moneyStr = money && money[0] > 0 ? `${eur(money[0])}–${eur(money[1])}` : '';

  // Нативні наступні кроки: клієнт має САМ побачити, що це його рішення.
  const wantsAudit = auditAge === 0 || auditAge === 1 || helpSel.includes('Повний аудит e-commerce');
  const audit: Reco = {
    key: 'audit',
    title: 'Розбір з командою WEEXP',
    reason: moneyStr
      ? `Покажемо, як повернути ${moneyStr} — на ваших цифрах, а не загальними порадами. ${auditAge === 0 ? 'Незалежного аудиту ще не було, тож цифру варто звірити з реальними даними.' : 'Звіримо оцінку з тим, що є в CRM / GA4.'}`
      : `Зберемо ваш зріз у план повернення виторгу — на ваших цифрах, а не загальними порадами.`,
    bullets: ['Звіримо оцінку з вашими CRM / GA4', 'Покажемо 3 точки, де витікає найбільше', 'Дамо перші кроки під Definition of Done'],
    riskReversal: '30 хвилин · безкоштовно · без зобовʼязань',
    cta: 'Забронювати безкоштовний розбір →',
    to: '/contact',
    strong: wantsAudit || overall < 60,
  };
  const oldSite = siteAge === 0 || siteAge === 1;
  const wantsSite = helpSel.includes('Новий сайт') || goals.includes('Новий сайт / платформа');
  const rebuild: Reco = {
    key: 'rebuild',
    title: 'Новий сайт / платформа',
    reason: oldSite
      ? `Сайт капітально не оновлювали ${siteAge === 0 ? '5+ років' : '3–4 роки'} — це вже стеля для конверсії, швидкості й аналітики. Нова платформа окупається різницею в конверсії.`
      : pains.length
        ? `Ви позначили вузькі місця на сайті (${pains.slice(0, 3).join(', ')}) — часто дешевше й швидше побудувати нову платформу, ніж латати стару.`
        : 'Коли системи готові, нова платформа знімає стелю росту — покажемо окупність на ваших цифрах.',
    bullets: ['Порахуємо окупність нової платформи на вашій конверсії', 'Покажемо, що втрачає поточний сайт', 'Проєктуємо під ваш P&L, а не наосліп'],
    riskReversal: 'Почнемо з безкоштовної оцінки — рішення за вами',
    cta: 'Обговорити нову платформу →',
    to: '/contact',
    strong: oldSite || painsSel.length >= 2 || wantsSite,
  };
  const recos = [audit, rebuild].sort((a, b) => Number(b.strong) - Number(a.strong));

  const answered = BLOCKS.filter((b) => {
    const a = ans[b.id];
    if (a == null) return false;
    if (b.kind === 'urllist') return Array.isArray(a) && (a as string[]).some((s) => typeof s === 'string' && s.trim());
    if (b.kind === 'refs') return Array.isArray(a) && (a as RefItem[]).some((r) => r && r.url && r.url.trim());
    return a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;
  const completeness = Math.round((answered / BLOCKS.length) * 100);

  return { systems, overall, bottleneck, epiphany, completeness, competitors, likes, marketing, finance, goals, recos, answered, total: BLOCKS.length };
}
