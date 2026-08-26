/**
 * Реестр скиллов плагинов (`.claude/skills/<имя>/SKILL.md`) для движка аудита.
 *
 * ДВА КОНТУРА. На диске 71 скилл, но аудиту клиента нужны не все. Скиллы
 * дизайна интерфейсов и личного бренда — это наш инструмент производства
 * (сайт weexp, презентации, LinkedIn), а не линза, через которую смотрят на
 * чужой бизнес. Раньше они были в маршрутах, и цена оказалась измеримой:
 *
 *   website  — 22 скилла, 223 000 символов, 87 % из них дизайнерские;
 *   crm      — 17 скиллов, 107 000 символов, 74 % из них про LinkedIn;
 *   seo      — 12 скиллов, 107 000 символов.
 *
 * При потолке 90 000 это означало, что часть скиллов ОТБРАСЫВАЛАСЬ молча, и
 * какие именно — решал порядок в массиве. В SEO-аудите вылетали настоящие
 * SEO-скиллы. Теперь в маршрутах только то, что относится к предмету аудита,
 * а остальное перечислено явно в ASSISTANT_ONLY — как решение, а не как потеря.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILLS_DIR = process.env.SKILLS_DIR
  || join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.claude', 'skills');
const MAX_SKILL = 24000;   // усечение одного SKILL.md
const MAX_TOTAL = 90000;   // потолок на один аудит

/**
 * Скиллы, которые идут в КАЖДЫЙ аудит: внешние сигналы нужны любому домену.
 */
export const ALWAYS: string[] = ['agent-reach'];

/**
 * Маршрут: аудит → скиллы, которые усиливают именно его предмет.
 * Держим узко. Лишний скилл — это не «на всякий случай», а вытесненный из
 * промпта нужный (потолок общий) и оплаченные токены за шум.
 */
export const SKILL_ROUTING: Record<string, string[]> = {
  business:     ['ads-math', 'competitor-price-analysis', 'marketing-council'],
  market:       ['ads-competitor', 'competitor-profiling', 'marketing-council'],
  product:      ['product-page-seo', 'competitor-price-analysis', 'ecommerce-keyword-research',
                 'google-shopping-optimization', 'cro'],
  customer:     ['churn-prevention', 'cro', 'ab-testing'],
  // Ревью ≠ производство. `impeccable`, `apple-design-hig`, `web-design-guidelines`
  // и `plan-design-review` РАЗБИРАЮТ чужой интерфейс — это ровно то, чем занят
  // Website-аудит. В прошлой правке они уехали в наш контур вместе с
  // `taste-*` и `emil-animate`, которые действительно только производят.
  website:      ['cro', 'ab-testing', 'site-architecture', 'impeccable', 'plan-design-review',
                 'apple-design-hig', 'web-design-guidelines', 'playwright-cli'],
  // seo-local здесь НЕТ намеренно — он в CONDITIONAL, см. ниже.
  seo:          ['seo-audit', 'seo-technical', 'seo-page', 'seo-schema', 'seo-geo', 'seo-sxo',
                 'seo-ecommerce', 'ecommerce-keyword-research'],
  acquisition:  ['ads-audit', 'ads-google', 'ads-meta', 'ads-budget', 'ads-attribution',
                 'google-shopping-optimization'],
  crm:          ['churn-prevention', 'ab-testing', 'cro'],
  analytics:    ['ads-attribution', 'ab-testing', 'ads-report'],
  // Схема процесса — это анализ операций, а не оформление отчёта: разложить
  // фактический путь заказа от корзины до возврата и есть предмет аудита.
  operations:   ['diagram-maker'],
  technology:   ['seo-technical', 'playwright-cli'],
  organization: ['marketing-council', 'diagram-maker'],
};

/**
 * Скиллы, которые нужны не всякому клиенту.
 *
 * `seo-local` — 16 600 символов про Google Business Profile, NAP-консистентность,
 * цитаты и мультилокационность. Для e-commerce и D2C, которые продают онлайн,
 * это мёртвый вес: он один делал SEO-аудит тяжелее лимита и вытеснял оттуда
 * настоящие SEO-линзы. Подключается, когда у клиента реально есть физические
 * точки или локальный трафик — иначе не грузится.
 */
export const CONDITIONAL: Record<string, { skill: string; needs: (f: ClientFacts) => boolean; why: string }[]> = {
  seo: [{
    skill: 'seo-local',
    needs: (f) => f.hasOutlets === true,
    why: 'локальный SEO нужен там, где есть точки продаж или сервисная зона',
  }],
};

/** Факты о клиенте, от которых зависит подбор линз. Приходят из базы знаний. */
export type ClientFacts = { hasOutlets?: boolean };

/**
 * Опасные/чувствительные скиллы: только по явному согласию клиента.
 * Пентест чужого сайта без разрешения — не аудит, а атака, поэтому включается
 * переменной окружения на конкретный прогон, а не лежит в маршруте.
 */
export const CONSENT_ONLY: Record<string, string[]> = {
  technology: ['penetration-testing-with-strix'],
};

/**
 * Наш собственный контур: производство, а не аудит клиента. Перечислены
 * поимённо, чтобы было видно — их не забыли, их сознательно не подмешивают.
 */
export const ASSISTANT_ONLY: { group: string; why: string; skills: string[] }[] = [
  { group: 'дизайн — производство', why: 'создают интерфейс, а не разбирают чужой; ревью-скиллы отсюда ушли в Website-аудит',
    skills: ['creative-director',
             'emil-animate', 'emil-review-animations', 'emil-improve-animations', 'emil-find-animation-opportunities',
             'emil-design-eng', 'emil-apple-design', 'emil-prototype', 'emil-pick-ui-library', 'emil-animation-vocabulary',
             'taste-taste-skill', 'taste-redesign-skill', 'taste-soft-skill', 'taste-minimalist-skill', 'taste-brutalist-skill'] },
  { group: 'личный бренд и соцсети', why: 'конвейер LinkedIn для Школы и личного бренда — к аудиту клиента не относится',
    skills: ['sm-voice-builder', 'sm-newsletter-voice', 'sm-post-writer', 'sm-post-formatter', 'sm-post-scorer',
             'sm-hook-generator', 'sm-content-matrix', 'sm-analytics-dashboard', 'sm-profile-optimizer',
             'sm-niche-research', 'sm-graphic-designer', 'sm-gemini-carousel', 'sm-gemini-infographic',
             'sm-quote-post', 'sm-pinned-comment', 'sm-reels-scripting', 'sm-youtube-thumbnail'] },
  { group: 'производство артефактов', why: 'делают документы и страницы, а не ставят диагноз',
    skills: ['remotion-motion-graphics', 'seo-competitor-pages'] },
  { group: 'безопасность — ассистенту', why: 'работа по нашему коду и CI, не по сайту клиента',
    skills: ['managed-pentesting-with-strix', 'fix-security-vulnerabilities-with-strix', 'ci-security-scanning-with-strix'] },
];

const cache = new Map<string, string>();
let index: string[] | null = null;

/** Все скиллы, которые физически лежат рядом (по именам папок). */
export async function listSkills(): Promise<string[]> {
  if (index) return index;
  try {
    const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
    index = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    index = [];
  }
  return index;
}

async function readSkill(name: string): Promise<string> {
  if (cache.has(name)) return cache.get(name)!;
  let body = '';
  try {
    const raw = await readFile(join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    // Frontmatter выбрасываем: в промпте нужен метод, а не метаданные плагина.
    const stripped = raw.replace(/^---[\s\S]*?\n---\n/, '').trim();
    body = stripped.length > MAX_SKILL ? stripped.slice(0, MAX_SKILL) + '\n…(усечено)' : stripped;
  } catch { /* скилла нет в образе — это не ошибка прогона */ }
  cache.set(name, body);
  return body;
}

/**
 * Скиллы плагинов для конкретного аудита, свёрнутые в блок для промпта.
 *
 * Если потолок всё же достигнут — отброшенные НАЗЫВАЮТСЯ, а не исчезают.
 * Раньше `continue` молча выбрасывал скилл, и понять, что аудит шёл без
 * половины линз, было неоткуда: в отчёте это выглядело просто как более
 * бедный анализ.
 */
export async function pluginSkillsFor(
  domain: string,
  opts: { consent?: boolean; facts?: ClientFacts; log?: (m: string) => void } = {},
): Promise<string> {
  if (process.env.PLUGIN_SKILLS === 'off') return '';
  const facts = opts.facts ?? {};
  const conditional = (CONDITIONAL[domain] ?? []).filter((c) => {
    const on = c.needs(facts);
    if (!on) opts.log?.(`· ${c.skill} не подключён: ${c.why}`);
    return on;
  }).map((c) => c.skill);
  // Порядок = приоритет: при упоре в лимит выживают первые. Скилл, включённый
  // ФАКТОМ о клиенте (есть точки продаж → нужен локальный SEO), по определению
  // релевантнее умолчания, поэтому идёт раньше — иначе он же и вылетал.
  const names = [
    ...ALWAYS,
    ...conditional,
    ...(opts.consent || process.env.CLIENT_CONSENT === 'on' ? (CONSENT_ONLY[domain] ?? []) : []),
    ...(SKILL_ROUTING[domain] ?? []),
  ];
  if (!names.length) return '';
  const have = new Set(await listSkills());
  const parts: string[] = [];
  const dropped: string[] = [];
  const absent: string[] = [];
  let used = 0;
  for (const n of names) {
    if (!have.has(n)) { absent.push(n); continue; }
    const body = await readSkill(n);
    if (!body) { absent.push(n); continue; }
    if (used + body.length > MAX_TOTAL) { dropped.push(n); continue; }
    used += body.length;
    parts.push(`### ${n}\n${body}`);
  }
  if (absent.length) opts.log?.(`⚠️ скиллов нет в образе (${domain}): ${absent.join(', ')}`);
  if (dropped.length) opts.log?.(`⚠️ не влезли в лимит ${MAX_TOTAL} симв. (${domain}): ${dropped.join(', ')}`);
  if (!parts.length) return '';
  // Отброшенное называем и в самом промпте: модель должна знать, что смотрит
  // не полным набором линз, а не додумывать за отсутствующие.
  const note = dropped.length
    ? `\n\n> Не вошли в этот прогон из-за лимита: ${dropped.join(', ')}. Выводы по их предмету делать нельзя.`
    : '';
  return `\n\n# ОТРАСЛЕВЫЕ СКИЛЛЫ ДЛЯ АУДИТА «${domain}» (${parts.length})\n${parts.join('\n\n')}${note}\n`;
}

/** Сколько символов займёт блок аудита — чтобы лимит проверялся до прогона. */
export async function domainWeight(domain: string): Promise<{ skills: number; chars: number; over: boolean }> {
  const names = [...ALWAYS, ...(SKILL_ROUTING[domain] ?? [])];
  const have = new Set(await listSkills());
  let chars = 0, skills = 0;
  for (const n of names) {
    if (!have.has(n)) continue;
    const b = await readSkill(n);
    if (!b) continue;
    chars += b.length; skills += 1;
  }
  return { skills, chars, over: chars > MAX_TOTAL };
}

/** Что установлено, что разведено по аудитам, что сознательно вне аудита. */
export async function skillCoverage(): Promise<{
  installed: number; routed: string[]; missing: string[];
  assistantOnly: { group: string; why: string; skills: string[] }[];
  unclassified: string[];
  perDomain: Record<string, { skills: number; chars: number; over: boolean }>;
}> {
  const have = await listSkills();
  const routed = [...new Set([
    ...ALWAYS,
    ...Object.values(SKILL_ROUTING).flat(),
    ...Object.values(CONSENT_ONLY).flat(),
    ...Object.values(CONDITIONAL).flat().map((c) => c.skill),
  ])].sort();
  const assistant = new Set(ASSISTANT_ONLY.flatMap((g) => g.skills));
  const perDomain: Record<string, { skills: number; chars: number; over: boolean }> = {};
  for (const d of Object.keys(SKILL_ROUTING)) perDomain[d] = await domainWeight(d);
  return {
    installed: have.length,
    routed: routed.filter((n) => have.includes(n)),
    missing: routed.filter((n) => !have.includes(n)),
    assistantOnly: ASSISTANT_ONLY.map((g) => ({ ...g, skills: g.skills.filter((n) => have.includes(n)) })),
    // Ни в аудите, ни в названном контуре — значит про него просто забыли.
    unclassified: have.filter((n) => !routed.includes(n) && !assistant.has(n)),
    perDomain,
  };
}
