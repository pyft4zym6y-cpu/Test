/**
 * Калькулятор · Етап 3 (Tier-2) — кабінет кваліфікації ліда. Клієнт реєструється й
 * «занурює» нас у бізнес: конкуренти (динамічні рядки + додати), сайти-орієнтири
 * (рядок + що саме подобається), і нативна діагностика за показниками GA4 / Search
 * Console / фінансів / команди + точка Б. Питання не в лоб («введи X»), а через
 * вибір/чекбокси. Мета — нативно підвести до (1) повного аудиту командою WEEXP і
 * (2) розробки нового сайту, через питання-вигоди. На виході — Tier-2 звіт із
 * рекомендаціями під Definition of Done.
 */
import { SYS, type SysKey } from './lossModel';

export type BlockKind = 'single' | 'multi' | 'number' | 'url' | 'urllist' | 'refs';
export type Block = {
  id: string;
  section: string;
  label: string;
  kind: BlockKind;
  system?: SysKey;           // до якої з 7 систем відносити для зрілості
  options?: { label: string; score?: number }[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  addLabel?: string;         // текст кнопки «+ додати» для urllist/refs
};

export type RefItem = { url: string; what: number[] };

export const SECTIONS = [
  'Конкурентне поле', 'Орієнтири', 'Маркетинг та аналітика', 'Фінанси', 'Позиціонування і бренд', 'Сайт і технології', 'Команда і точка Б',
] as const;

// Що саме подобається в сайті-орієнтирі (для блоку refs).
export const LIKE_WHAT = [
  { label: 'Візуал / дизайн' }, { label: 'Логіка / UX' }, { label: 'Швидкість і плавність' },
  { label: 'Контент / картка товару' }, { label: 'Асортимент / пропозиція' }, { label: 'Довіра / бренд' },
];

export const BLOCKS: Block[] = [
  // 1 — Конкурентне поле (динамічні рядки, «+ додати ще»)
  { id: 'comp_direct', section: 'Конкурентне поле', kind: 'urllist', placeholder: 'https://',
    label: 'Хто ваші прямі конкуренти?', hint: 'Ті, хто продає те саме. Один рядок — один сайт, додайте скільки треба.', addLabel: '+ Ще конкурент' },
  { id: 'comp_indirect', section: 'Конкурентне поле', kind: 'urllist', placeholder: 'https://',
    label: 'А хто забирає той самий бюджет і увагу клієнта?', hint: 'Непрямі — інша категорія, але конкурують за ваші гроші клієнта.', addLabel: '+ Ще один' },
  { id: 'cpos', section: 'Конкурентне поле', label: 'Як ви почуваєтесь поруч із ними?', kind: 'single', system: 'strategy',
    options: [{ label: 'Слабші майже в усьому', score: 0 }, { label: 'Схожі, без явної переваги', score: 1 }, { label: 'Є 1–2 сильні сторони', score: 2 }, { label: 'Маємо чітку різницю', score: 3 }] },

  // 2 — Орієнтири (сайт + що саме подобається, «+ додати сайт»)
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
  { id: 'm_attr', section: 'Маркетинг та аналітика', label: 'Чи знаєте ви, який канал реально приносить гроші?', kind: 'single', system: 'data',
    options: [{ label: 'Ні, здогадуємось', score: 0 }, { label: 'Last-click у GA4', score: 1 }, { label: 'Частково мульти-тач', score: 2 }, { label: 'Наскрізна з CRM', score: 3 }] },

  // 4 — Фінанси (нативні діапазони; точні числа — необов'язково)
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
  { id: 'b_diff', section: 'Позиціонування і бренд', label: 'У чому ваша головна перевага? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Ціна' }, { label: 'Асортимент' }, { label: 'Якість / бренд' }, { label: 'Сервіс / доставка' }, { label: 'Експертиза' }] },

  // 6 — Сайт і технології (нативно веде до нового сайту та аудиту)
  { id: 'd_stack', section: 'Сайт і технології', label: 'На чому побудований ваш сайт?', kind: 'single', system: 'data',
    options: [{ label: 'Конструктор / шаблон', score: 0 }, { label: 'CMS на шаблоні', score: 1 }, { label: 'Кастомна на CMS', score: 2 }, { label: 'Headless / кастом', score: 3 }] },
  { id: 'site_age', section: 'Сайт і технології', label: 'Коли ви востаннє капітально робили або переробляли сайт?', kind: 'single', system: 'experience',
    hint: 'Не косметика, а платформа й логіка.',
    options: [{ label: '5+ років тому', score: 0 }, { label: '3–4 роки тому', score: 1 }, { label: '1–2 роки тому', score: 2 }, { label: 'Менше року тому', score: 3 }] },
  { id: 'site_audit_age', section: 'Сайт і технології', label: 'А коли востаннє робили незалежний аудит сайту й аналітики?', kind: 'single', system: 'data',
    options: [{ label: 'Ніколи', score: 0 }, { label: '2+ роки тому', score: 1 }, { label: 'Цього року', score: 2 }, { label: 'Робимо регулярно', score: 3 }] },
  { id: 'site_pain', section: 'Сайт і технології', label: 'Що на сайті найбільше стримує продажі? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Швидкість' }, { label: 'Мобільна версія' }, { label: 'Checkout / кошик' }, { label: 'Каталог і пошук' }, { label: 'Картка / контент' }, { label: 'Інтеграції й дані' }, { label: 'Застарілий дизайн' }] },
  { id: 'd_master', section: 'Сайт і технології', label: 'Наскільки узгоджені ваші дані (ціни / залишки / статуси)?', kind: 'single', system: 'data',
    options: [{ label: 'Розсипані', score: 0 }, { label: 'Частково', score: 1 }, { label: 'Здебільшого єдині', score: 2 }, { label: 'Єдине джерело правди', score: 3 }] },

  // 7 — Команда і точка Б (намір → нативний продаж аудиту й сайту)
  { id: 'o_owner', section: 'Команда і точка Б', label: 'Хто відповідає за прибуток e-commerce?', kind: 'single', system: 'org',
    options: [{ label: 'Ніхто конкретно', score: 0 }, { label: 'Власник', score: 1 }, { label: 'Керівник напряму', score: 2 }, { label: 'Роль + KPI по прибутку', score: 3 }] },
  { id: 'o_sop', section: 'Команда і точка Б', label: 'Наскільки бізнес працює без вас (процеси, SOP)?', kind: 'single', system: 'org',
    options: [{ label: 'Усе в головах', score: 0 }, { label: 'Дещо задокументовано', score: 1 }, { label: 'Основні процеси', score: 2 }, { label: 'Повна база + онбординг', score: 3 }] },
  { id: 'goal_b', section: 'Команда і точка Б', label: 'Ваша точка Б за 12 місяців — чого ви хочете? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Кратний ріст виторгу' }, { label: 'Вища маржа і прибуток' }, { label: 'Незалежність від власника' }, { label: 'Новий сайт / платформа' }, { label: 'Нові канали й ринки' }, { label: 'Системна аналітика і контроль' }] },
  { id: 'help_want', section: 'Команда і точка Б', label: 'З чим вам найбільше потрібна команда поруч? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Повний аудит e-commerce' }, { label: 'Новий сайт' }, { label: 'Трафік і маркетинг' }, { label: 'Аналітика й дані' }, { label: 'Операції й процеси' }, { label: 'Стратегія росту' }] },
];

export type Stage3Answers = Record<string, number | number[] | string | string[] | RefItem[]>;

export type Reco = { key: 'audit' | 'rebuild'; title: string; reason: string; cta: string; to: string; strong: boolean };

export type Stage3Result = {
  systems: { key: SysKey; label: string; score: number }[];
  overall: number;
  bottleneck: { key: SysKey; label: string; score: number };
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

export function scoreStage3(ans: Stage3Answers): Stage3Result {
  // Зрілість по системах — з блоків, що мають system і score.
  const systems = SYS.map(({ key, label }) => {
    const bs = BLOCKS.filter((b) => b.system === key);
    const vals = bs.map((b) => scoreOf(b, ans[b.id])).filter((v): v is number => v != null);
    const score = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length / 3 * 100) : 0;
    return { key, label, score };
  });
  const wsum = Object.values(W).reduce((a, b) => a + b, 0);
  const overall = Math.round(systems.reduce((a, s) => a + s.score * W[s.key], 0) / wsum);
  const bottleneck = [...systems].sort((a, b) => a.score - b.score)[0];

  // Конкуренти — з динамічних списків (urllist).
  const urlList = (id: string): string[] =>
    (Array.isArray(ans[id]) ? (ans[id] as unknown[]) : []).filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
  const competitors = { direct: urlList('comp_direct'), indirect: urlList('comp_indirect') };

  // Орієнтири — з refs (url + що саме подобається).
  const refsVal: RefItem[] = Array.isArray(ans['refs']) ? (ans['refs'] as unknown[]).filter((r): r is RefItem => !!r && typeof (r as RefItem).url === 'string') as RefItem[] : [];
  const likes = refsVal.filter((r) => r.url.trim()).map((r) => {
    const whatArr: number[] = Array.isArray(r.what) ? (r.what as number[]) : [];
    return { url: r.url.trim(), what: whatArr.map((i) => LIKE_WHAT[i]?.label).filter(Boolean) as string[] };
  });

  // Нативні метрики зі зроблених виборів (показуємо мовою клієнта, без сирих чисел).
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

  const goalsSel = multiIdx('goal_b');
  const goals = labelsOf('goal_b', goalsSel);
  const helpSel = labelsOf('help_want', multiIdx('help_want'));
  const painsSel = multiIdx('site_pain');
  const pains = labelsOf('site_pain', painsSel);
  const auditAge = idxOf('site_audit_age');
  const siteAge = idxOf('site_age');

  // Нативні рекомендації: 1) повний аудит командою, 2) новий сайт/платформа.
  const wantsAudit = auditAge === 0 || auditAge === 1 || helpSel.includes('Повний аудит e-commerce');
  const auditReason = auditAge === 0
    ? 'Незалежний аудит ви не робили жодного разу — цифру можливості ще не звіряли з вашими CRM / GA4. Повний аудит команди підтвердить її й дасть план під Definition of Done.'
    : auditAge === 1
      ? 'Аудит не робили понад 2 роки — за цей час змінились і ринок, і ваші дані. Повний аудит звірить оцінку й покаже, де саме витікає виторг.'
      : 'Повний аудит зведе маркетинг, фінанси й операції в одну картину і перетворить оцінку на план повернення виторгу.';

  const oldSite = siteAge === 0 || siteAge === 1;
  const wantsSite = helpSel.includes('Новий сайт') || goals.includes('Новий сайт / платформа');
  const rebuildReason = oldSite
    ? `Сайт капітально не оновлювали ${siteAge === 0 ? '5+ років' : '3–4 роки'} — це вже стеля для конверсії, швидкості й аналітики. Нова платформа окупається різницею в конверсії.`
    : pains.length
      ? `Ви позначили вузькі місця на сайті (${pains.slice(0, 3).join(', ')}) — часто дешевше й швидше побудувати нову платформу, ніж латати стару.`
      : 'Коли системи готові, нова платформа знімає стелю росту — покажемо окупність на ваших цифрах.';

  const recoItems: Reco[] = [
    { key: 'audit', title: 'Повний аудит від команди WEEXP', reason: auditReason, cta: 'Записатися на повний аудит →', to: '/contact', strong: wantsAudit || overall < 60 },
    { key: 'rebuild', title: 'Новий сайт / платформа', reason: rebuildReason, cta: 'Обговорити нову платформу →', to: '/contact', strong: oldSite || painsSel.length >= 2 || wantsSite },
  ];
  const recos = recoItems.sort((a, b) => Number(b.strong) - Number(a.strong));

  const answered = BLOCKS.filter((b) => {
    const a = ans[b.id];
    if (a == null) return false;
    if (b.kind === 'urllist') return Array.isArray(a) && (a as string[]).some((s) => typeof s === 'string' && s.trim());
    if (b.kind === 'refs') return Array.isArray(a) && (a as RefItem[]).some((r) => r && r.url && r.url.trim());
    return a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;
  const completeness = Math.round((answered / BLOCKS.length) * 100);

  return { systems, overall, bottleneck, completeness, competitors, likes, marketing, finance, goals, recos, answered, total: BLOCKS.length };
}
