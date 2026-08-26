/**
 * Профильные скиллы под каждый из 13 аудитов.
 *
 * В `worker/reference/weexp-os/` лежат 22 OS-скилла методологии — полный
 * исходник. До сих пор они были ТОЛЬКО справочником: анализ подмешивал их сжатые
 * дистилляты (`knowledge/30-domain-lenses.md`), одинаковые для всех доменов. То
 * есть Business-аудит и SEO-аудит читали один и тот же общий текст.
 *
 * Здесь каждый аудит получает свой профиль плюс два постоянных слоя:
 *   • АНАЛИТИК   — data-os + reporting-os: как считать и как показывать числа;
 *   • КОНСУЛЬТАНТ — synthesis-os: остаточный вклад без двойного счёта, связывание
 *     выводов линз в один вывод, разговор с владельцем на языке решений.
 */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REF_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference', 'weexp-os');
const MAX_SKILL = 34000;    // усечение одного скилла (самый большой — synthesis-os, 31k)
// Профильный блок больше НЕ дублирует тексты: все 22 скилла и так едут в
// кешируемом префиксе (allSkillsContext). Здесь — только указатель, какие линзы
// ведут в этом аудите. Это несколько сотен байт вместо 40 КБ на вызов.

/** Тринадцать аудитов диагностического отчёта → профильные OS-скиллы. */
export const DOMAIN_SKILLS: Record<string, string[]> = {
  business:     ['commerce-os', 'finance-os'],
  market:       ['brand-os', 'identity-os'],
  product:      ['product-os', 'merchandising-os', 'pricing-os'],
  customer:     ['retention-os', 'b2b-os'],
  website:      ['ux-os', 'build-os'],
  seo:          ['seo-os', 'content-os'],
  acquisition:  ['paid-os', 'marketplace-os'],
  crm:          ['retention-os', 'content-os'],
  analytics:    ['data-os', 'reporting-os'],
  operations:   ['ops-os', 'legal-os'],
  technology:   ['build-os', 'ai-os'],
  organization: ['people-os'],
  // A13 «Експансія». Отдельный аудит, а не подраздел acquisition: тот считает
  // эффективность УЖЕ работающих каналов, этот — стоимость и риск входа в то,
  // чего у клиента ещё нет (рынок, площадка, сегмент, модель продаж).
  // legal-os здесь ведущая линза, а не фон: трансграничная продажа упирается в
  // НДС/OSS-IOSS, GPSR и EPR раньше, чем в рекламу.
  expansion:    ['marketplace-os', 'b2b-os', 'legal-os'],
};

/** Слой аналитика — как считать и как показывать. Идёт в каждый аудит. */
export const ANALYST_SKILLS = ['data-os', 'reporting-os'];
/** Слой консультанта и коуча — как связать выводы и говорить с владельцем. */
export const CONSULTING_SKILLS = ['synthesis-os'];

export const AUDIT_DOMAINS = Object.keys(DOMAIN_SKILLS);

const cache = new Map<string, string>();

/** Все 22 OS-скилла одним блоком. Порядок — по алфавиту и БЕЗ переменных частей:
 *  блок обязан быть байт-в-байт одинаковым во всех вызовах, иначе префиксный
 *  кеш промпта не совпадёт и мы заплатим полную цену за каждый вызов. */
const ALL_SKILLS = [
  'ai-os', 'b2b-os', 'brand-os', 'build-os', 'commerce-os', 'content-os', 'data-os',
  'finance-os', 'identity-os', 'legal-os', 'marketplace-os', 'merchandising-os',
  'ops-os', 'paid-os', 'people-os', 'pricing-os', 'product-os', 'reporting-os',
  'retention-os', 'seo-os', 'synthesis-os', 'ux-os',
];
let allCache: string | null = null;

/**
 * Метод целиком — подмешивается в КАЖДЫЙ вызов Claude как кешируемый префикс.
 * До этого 22 скилла лежали справочником «не автозагружается», и анализ читал
 * только сжатые дистилляты. Теперь наоборот: полный метод по умолчанию, а цена
 * держится префиксным кешем (запись ~1.25x, чтение ~0.1x) — см. ask() в anthropic.ts.
 * Выключается переменной окружения OS_SKILLS=off.
 */
export async function allSkillsContext(): Promise<string> {
  if (process.env.OS_SKILLS === 'off') return '';
  if (allCache !== null) return allCache;
  const parts: string[] = [];
  for (const n of ALL_SKILLS) {
    const body = await readSkill(n);
    if (body) parts.push(`### ${n}\n${body}`);
  }
  allCache = parts.length
    ? `# МЕТОД WEEXP eCom OS — 22 домена (полный справочник)\n${parts.join('\n\n')}\n`
    : '';
  return allCache;
}

async function readSkill(name: string): Promise<string> {
  if (cache.has(name)) return cache.get(name)!;
  try {
    const raw = await readFile(join(REF_DIR, `${name}.md`), 'utf8');
    const body = raw.length > MAX_SKILL ? raw.slice(0, MAX_SKILL) + '\n…(усечено)' : raw;
    cache.set(name, body);
    return body;
  } catch {
    cache.set(name, '');
    return '';
  }
}

/**
 * Контекст для одного аудита: профильные скиллы + аналитик + консультант.
 * Один и тот же скилл не дублируется (analytics-аудит уже несёт data/reporting).
 */
export async function domainContext(domain: string): Promise<string> {
  const profile = DOMAIN_SKILLS[domain];
  if (!profile) return '';
  const lead = profile.join(', ');
  const analyst = ANALYST_SKILLS.filter((n) => !profile.includes(n)).join(', ');
  const consult = CONSULTING_SKILLS.filter((n) => !profile.includes(n)).join(', ');
  const L = [
    `\n\n# ФОКУС ЭТОГО АУДИТА: ${domain}`,
    `Полный метод (22 домена) выше. Для ЭТОГО аудита ведущие линзы: ${lead}.`,
    'Смотри в первую очередь их разделы; остальные домены — только там, где они реально пересекаются.',
  ];
  if (analyst) L.push(`Слой аналитика (как считать и как показывать числа): ${analyst}.`);
  if (consult) L.push(`Слой консультанта (связать выводы линз в один вывод для владельца, без двойного счёта): ${consult}.`);
  return L.join('\n') + '\n';
}

/** Какие скиллы реально подключатся к домену — для /health и отчёта о покрытии. */
export function skillsOf(domain: string): string[] {
  const profile = DOMAIN_SKILLS[domain] || [];
  return [...new Set([...profile, ...ANALYST_SKILLS, ...CONSULTING_SKILLS])];
}
