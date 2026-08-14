/**
 * Калькулятор · Етап 3 (Tier-2) — глибша діагностика в кабінеті. ~35 блоків,
 * згрупованих у секції. Переважно вибір/чекбокси; руками — лише посилання й
 * конкретні числа з аналітики/звітів. Дані зберігаються (Supabase або локально),
 * заповнення можна призупинити й продовжити. На виході — інтерактивний Tier-2
 * звіт: уточнена зрілість + конкурентне поле + маркетинг/фінанси + позиціонування.
 */
import { SYS, type SysKey } from './lossModel';

export type BlockKind = 'single' | 'multi' | 'number' | 'url';
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
};

export const SECTIONS = [
  'Конкурентне поле', 'Орієнтири', 'Маркетинг', 'Фінанси', 'Позиціонування і бренд', 'Технології і дані', 'Команда і процеси',
] as const;

const LIKE_WHAT = [{ label: 'Візуал / дизайн' }, { label: 'Логіка / UX' }, { label: 'Цінності бренду' }, { label: 'Контент' }, { label: 'Асортимент / пропозиція' }];

export const BLOCKS: Block[] = [
  // 1 — Конкурентне поле
  { id: 'dc1', section: 'Конкурентне поле', label: 'Прямий конкурент №1 (посилання)', kind: 'url', placeholder: 'https://' },
  { id: 'dc2', section: 'Конкурентне поле', label: 'Прямий конкурент №2', kind: 'url', placeholder: 'https://' },
  { id: 'dc3', section: 'Конкурентне поле', label: 'Прямий конкурент №3', kind: 'url', placeholder: 'https://' },
  { id: 'ic1', section: 'Конкурентне поле', label: 'Непрямий конкурент №1', kind: 'url', placeholder: 'https://' },
  { id: 'ic2', section: 'Конкурентне поле', label: 'Непрямий конкурент №2', kind: 'url', placeholder: 'https://' },
  { id: 'ic3', section: 'Конкурентне поле', label: 'Непрямий конкурент №3', kind: 'url', placeholder: 'https://' },
  { id: 'cpos', section: 'Конкурентне поле', label: 'Як ви виглядаєте проти конкурентів?', kind: 'single',
    options: [{ label: 'Слабший на всіх фронтах', score: 0 }, { label: 'Схожий, без переваги', score: 1 }, { label: 'Є 1–2 переваги', score: 2 }, { label: 'Чітка диференціація', score: 3 }] },

  // 2 — Орієнтири (сайти, що подобаються)
  { id: 'lk1u', section: 'Орієнтири', label: 'Сайт-орієнтир №1 (посилання)', kind: 'url', placeholder: 'https://' },
  { id: 'lk1w', section: 'Орієнтири', label: 'Що саме подобається в №1?', kind: 'multi', options: LIKE_WHAT },
  { id: 'lk2u', section: 'Орієнтири', label: 'Сайт-орієнтир №2', kind: 'url', placeholder: 'https://' },
  { id: 'lk2w', section: 'Орієнтири', label: 'Що саме подобається в №2?', kind: 'multi', options: LIKE_WHAT },
  { id: 'lk3u', section: 'Орієнтири', label: 'Сайт-орієнтир №3', kind: 'url', placeholder: 'https://' },
  { id: 'lk3w', section: 'Орієнтири', label: 'Що саме подобається в №3?', kind: 'multi', options: LIKE_WHAT },

  // 3 — Маркетинг (числа з аналітики)
  { id: 'm_cac', section: 'Маркетинг', label: 'CAC — вартість залучення', kind: 'number', unit: '€' },
  { id: 'm_roas', section: 'Маркетинг', label: 'ROAS', kind: 'number', unit: '×' },
  { id: 'm_org', section: 'Маркетинг', label: 'Частка органічного трафіку', kind: 'number', unit: '%' },
  { id: 'm_email', section: 'Маркетинг', label: 'Частка виручки з email/CRM', kind: 'number', unit: '%' },
  { id: 'm_repeat', section: 'Маркетинг', label: 'Частка повторних покупок', kind: 'number', unit: '%' },
  { id: 'm_channels', section: 'Маркетинг', label: 'Основні канали (оберіть усе)', kind: 'multi', system: 'customer',
    options: [{ label: 'Google Ads' }, { label: 'Meta Ads' }, { label: 'SEO' }, { label: 'Email/CRM' }, { label: 'Маркетплейси' }, { label: 'Інфлюенсери' }] },
  { id: 'm_attr', section: 'Маркетинг', label: 'Attribution / наскрізна аналітика:', kind: 'single', system: 'data',
    options: [{ label: 'Немає', score: 0 }, { label: 'Last-click у GA4', score: 1 }, { label: 'Мульти-тач частково', score: 2 }, { label: 'Наскрізна з CRM', score: 3 }] },

  // 4 — Фінанси (зі звітів)
  { id: 'f_margin', section: 'Фінанси', label: 'Валова маржа', kind: 'number', unit: '%' },
  { id: 'f_contrib', section: 'Фінанси', label: 'Contribution margin', kind: 'number', unit: '%' },
  { id: 'f_returns', section: 'Фінанси', label: 'Повернення + скасування', kind: 'number', unit: '%' },
  { id: 'f_aov', section: 'Фінанси', label: 'Середній чек (AOV)', kind: 'number', unit: '€' },
  { id: 'f_ltv', section: 'Фінанси', label: 'LTV клієнта (за рік)', kind: 'number', unit: '€' },
  { id: 'f_pnl', section: 'Фінанси', label: 'P&L по e-commerce:', kind: 'single', system: 'commercial',
    options: [{ label: 'Немає', score: 0 }, { label: 'Рахуємо оборот', score: 1 }, { label: 'Є маржа по групах', score: 2 }, { label: 'Повний P&L + unit economics', score: 3 }] },

  // 5 — Позиціонування і бренд
  { id: 'b_pos', section: 'Позиціонування і бренд', label: 'Позиціонування:', kind: 'single', system: 'strategy',
    options: [{ label: 'Немає, продаємо ціною', score: 0 }, { label: 'Розмите', score: 1 }, { label: 'Є, але не всюди', score: 2 }, { label: 'Чітке, послідовне', score: 3 }] },
  { id: 'b_audience', section: 'Позиціонування і бренд', label: 'Розуміння ЦА:', kind: 'single', system: 'strategy',
    options: [{ label: 'Інтуїтивно', score: 0 }, { label: 'Демографія', score: 1 }, { label: 'Сегменти + болі', score: 2 }, { label: 'JTBD + дані', score: 3 }] },
  { id: 'b_content', section: 'Позиціонування і бренд', label: 'Контент, що продає:', kind: 'single', system: 'experience',
    options: [{ label: 'Мінімум', score: 0 }, { label: 'Опис товарів', score: 1 }, { label: '+ гайди/відео', score: 2 }, { label: 'Контент-система', score: 3 }] },
  { id: 'b_social', section: 'Позиціонування і бренд', label: 'Social proof (відгуки, UGC, кейси):', kind: 'single', system: 'experience',
    options: [{ label: 'Немає', score: 0 }, { label: 'Кілька відгуків', score: 1 }, { label: 'Регулярні відгуки', score: 2 }, { label: 'Система UGC + рейтинги', score: 3 }] },
  { id: 'b_diff', section: 'Позиціонування і бренд', label: 'Що ваша головна перевага? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Ціна' }, { label: 'Асортимент' }, { label: 'Якість/бренд' }, { label: 'Сервіс/доставка' }, { label: 'Експертиза' }] },

  // 6 — Технології і дані
  { id: 'd_stack', section: 'Технології і дані', label: 'Платформа вітрини:', kind: 'single', system: 'data',
    options: [{ label: 'Конструктор/шаблон', score: 0 }, { label: 'CMS на шаблоні', score: 1 }, { label: 'Кастомна на CMS', score: 2 }, { label: 'Headless/кастом', score: 3 }] },
  { id: 'd_integr', section: 'Технології і дані', label: 'Що інтегровано в контур? (оберіть усе)', kind: 'multi', system: 'data',
    options: [{ label: 'CRM' }, { label: 'ERP' }, { label: 'WMS' }, { label: 'BI/дашборди' }, { label: 'IP-телефонія' }, { label: 'Служби доставки' }] },
  { id: 'd_master', section: 'Технології і дані', label: 'Master data (ціни/залишки/статуси):', kind: 'single', system: 'data',
    options: [{ label: 'Розсипано', score: 0 }, { label: 'Частково', score: 1 }, { label: 'Здебільшого єдине', score: 2 }, { label: 'Єдине джерело правди', score: 3 }] },
  { id: 'd_speed', section: 'Технології і дані', label: 'Швидкість сайту (Core Web Vitals):', kind: 'single', system: 'experience',
    options: [{ label: 'Повільно / не міряли', score: 0 }, { label: 'Середньо', score: 1 }, { label: 'Ок на десктопі', score: 2 }, { label: 'Швидко на mobile', score: 3 }] },
  { id: 'd_debt', section: 'Технології і дані', label: 'Технічний борг блокує розвиток?', kind: 'single', system: 'data',
    options: [{ label: 'Постійно', score: 0 }, { label: 'Часто', score: 1 }, { label: 'Іноді', score: 2 }, { label: 'Майже ні', score: 3 }] },

  // 7 — Команда і процеси
  { id: 'o_owner', section: 'Команда і процеси', label: 'Хто відповідає за прибуток e-commerce?', kind: 'single', system: 'org',
    options: [{ label: 'Ніхто конкретно', score: 0 }, { label: 'Власник', score: 1 }, { label: 'Керівник напряму', score: 2 }, { label: 'Роль + KPI по прибутку', score: 3 }] },
  { id: 'o_raci', section: 'Команда і процеси', label: 'RACI і несуперечливі KPI:', kind: 'single', system: 'org',
    options: [{ label: 'Немає', score: 0 }, { label: 'Ролі розмиті', score: 1 }, { label: 'Є, місцями конфліктують', score: 2 }, { label: 'Чіткі, узгоджені', score: 3 }] },
  { id: 'o_sop', section: 'Команда і процеси', label: 'SOP і база знань:', kind: 'single', system: 'org',
    options: [{ label: 'У головах', score: 0 }, { label: 'Дещо задокументовано', score: 1 }, { label: 'Основні процеси', score: 2 }, { label: 'Повна база + онбординг', score: 3 }] },
  { id: 'o_roadmap', section: 'Команда і процеси', label: 'Пріоритизація розвитку:', kind: 'single', system: 'strategy',
    options: [{ label: 'Усе терміново', score: 0 }, { label: 'Списком задач', score: 1 }, { label: 'Impact/effort', score: 2 }, { label: 'Roadmap + гіпотези', score: 3 }] },
  { id: 'o_team', section: 'Команда і процеси', label: 'Хто веде напрям? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Власник' }, { label: 'Маркетолог' }, { label: 'Штатна команда' }, { label: 'Підрядники' }, { label: 'Ніхто системно' }] },
];

export type Stage3Answers = Record<string, number | number[] | string>;

export type Stage3Result = {
  systems: { key: SysKey; label: string; score: number }[];
  overall: number;
  bottleneck: { key: SysKey; label: string; score: number };
  completeness: number;                 // % наданих даних (руками введених чисел/посилань)
  competitors: { direct: string[]; indirect: string[] };
  likes: { url: string; what: string[] }[];
  marketing: { label: string; value: string }[];
  finance: { label: string; value: string }[];
  answered: number; total: number;
};

const W: Record<SysKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: 0.9, operations: 1.3, data: 1.2, org: 1.5 };
const scoreOf = (b: Block, a: Stage3Answers[string]): number | null => {
  if (b.kind === 'single' && b.options) return typeof a === 'number' ? (b.options[a]?.score ?? 0) : null;
  if (b.kind === 'multi' && b.system && Array.isArray(a)) return Math.min(3, a.length * 0.75); // інтеграції тощо
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

  const str = (id: string) => (typeof ans[id] === 'string' ? (ans[id] as string).trim() : '');
  const num = (id: string) => (typeof ans[id] === 'string' && ans[id] !== '' ? String(ans[id]) : '');
  const competitors = {
    direct: ['dc1', 'dc2', 'dc3'].map(str).filter(Boolean),
    indirect: ['ic1', 'ic2', 'ic3'].map(str).filter(Boolean),
  };
  const likes = [['lk1u', 'lk1w'], ['lk2u', 'lk2w'], ['lk3u', 'lk3w']]
    .map(([u, w]) => ({ url: str(u), what: (Array.isArray(ans[w]) ? (ans[w] as number[]) : []).map((i) => (BLOCKS.find((b) => b.id === w)!.options![i].label)) }))
    .filter((x) => x.url);
  const mkt = [['m_cac', 'CAC'], ['m_roas', 'ROAS'], ['m_org', 'Органіка'], ['m_email', 'Email-частка'], ['m_repeat', 'Повторні']];
  const fin = [['f_margin', 'Валова маржа'], ['f_contrib', 'Contribution'], ['f_returns', 'Повернення'], ['f_aov', 'AOV'], ['f_ltv', 'LTV']];
  const withUnit = (id: string) => { const b = BLOCKS.find((x) => x.id === id)!; const v = num(id); return v ? `${v}${b.unit ?? ''}` : '—'; };
  const marketing = mkt.map(([id, label]) => ({ label, value: withUnit(id) }));
  const finance = fin.map(([id, label]) => ({ label, value: withUnit(id) }));

  const manual = BLOCKS.filter((b) => b.kind === 'url' || b.kind === 'number');
  const providedManual = manual.filter((b) => str(b.id)).length;
  const completeness = Math.round((providedManual / manual.length) * 100);

  const answered = BLOCKS.filter((b) => {
    const a = ans[b.id];
    return a != null && a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;

  return { systems, overall, bottleneck, completeness, competitors, likes, marketing, finance, answered, total: BLOCKS.length };
}
