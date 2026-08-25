/**
 * Профильные скиллы под каждый из 12 аудитов.
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
const MAX_SKILL = 14000;    // усечение одного скилла
const MAX_TOTAL = 46000;    // потолок профильного контекста на вызов

/** Двенадцать аудитов диагностического отчёта → профильные OS-скиллы. */
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
};

/** Слой аналитика — как считать и как показывать. Идёт в каждый аудит. */
export const ANALYST_SKILLS = ['data-os', 'reporting-os'];
/** Слой консультанта и коуча — как связать выводы и говорить с владельцем. */
export const CONSULTING_SKILLS = ['synthesis-os'];

export const AUDIT_DOMAINS = Object.keys(DOMAIN_SKILLS);

const cache = new Map<string, string>();

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
  const seen = new Set<string>();
  const groups: { label: string; names: string[] }[] = [
    { label: 'ПРОФИЛЬНЫЙ МЕТОД АУДИТА', names: profile },
    { label: 'СЛОЙ АНАЛИТИКА (как считать и как показывать)', names: ANALYST_SKILLS },
    { label: 'СЛОЙ КОНСУЛЬТАНТА (как связать выводы и говорить с владельцем)', names: CONSULTING_SKILLS },
  ];
  const out: string[] = [];
  let used = 0;
  for (const g of groups) {
    const parts: string[] = [];
    for (const n of g.names) {
      if (seen.has(n)) continue;
      seen.add(n);
      const body = await readSkill(n);
      if (!body) continue;
      if (used + body.length > MAX_TOTAL) continue;
      used += body.length;
      parts.push(`### ${n}\n${body}`);
    }
    if (parts.length) out.push(`## ${g.label}\n${parts.join('\n\n')}`);
  }
  if (!out.length) return '';
  return `\n\n# МЕТОД ДЛЯ ЭТОГО АУДИТА (${domain})\n${out.join('\n\n')}\n`;
}

/** Какие скиллы реально подключатся к домену — для /health и отчёта о покрытии. */
export function skillsOf(domain: string): string[] {
  const profile = DOMAIN_SKILLS[domain] || [];
  return [...new Set([...profile, ...ANALYST_SKILLS, ...CONSULTING_SKILLS])];
}
