/**
 * Реестр ВСЕХ скиллов плагинов (`.claude/skills/<имя>/SKILL.md`) для движка аудита.
 *
 * До этого они существовали только для сессии разработки: `TOOLING.md` описывал
 * их как «наш стек», но аудит не загружал ни одного — мы даже советовали клиенту
 * скиллы, которых сами не запускали.
 *
 * Здесь подключены все. Но НЕ все в каждый промпт: скилл про YouTube-обложки в
 * Business-аудите — это шум, за который платят токенами и качеством вывода.
 * Поэтому каждый скилл прописан в маршрут одного или нескольких из 12 аудитов,
 * а те, что не ложатся ни на один, попадают в UNROUTED — видимым списком, а не
 * молча выброшенными.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILLS_DIR = process.env.SKILLS_DIR
  || join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.claude', 'skills');
const MAX_SKILL = 24000;   // усечение одного SKILL.md
const MAX_TOTAL = 90000;   // потолок на один аудит

/** Маршрут: аудит → скиллы, которые реально усиливают именно его. */
export const SKILL_ROUTING: Record<string, string[]> = {
  business:     ['ads-math', 'marketing-council', 'competitor-price-analysis'],
  market:       ['competitor-profiling', 'ads-competitor', 'seo-competitor-pages', 'marketing-council', 'sm-niche-research'],
  product:      ['product-page-seo', 'competitor-price-analysis', 'google-shopping-optimization', 'ecommerce-keyword-research'],
  customer:     ['churn-prevention', 'cro', 'ab-testing', 'sm-post-scorer'],
  website:      ['cro', 'ab-testing', 'impeccable', 'web-design-guidelines', 'plan-design-review', 'apple-design-hig',
                 'emil-design-eng', 'emil-apple-design', 'emil-review-animations', 'emil-improve-animations',
                 'emil-find-animation-opportunities', 'emil-animate', 'emil-animation-vocabulary', 'emil-prototype',
                 'emil-pick-ui-library', 'taste-taste-skill', 'taste-minimalist-skill', 'taste-brutalist-skill',
                 'taste-soft-skill', 'taste-redesign-skill', 'creative-director', 'playwright-cli'],
  seo:          ['seo-audit', 'seo-technical', 'seo-page', 'seo-schema', 'seo-geo', 'seo-sxo', 'seo-local',
                 'seo-ecommerce', 'seo-competitor-pages', 'site-architecture', 'ecommerce-keyword-research', 'product-page-seo'],
  acquisition:  ['ads-audit', 'ads-google', 'ads-meta', 'ads-attribution', 'ads-budget', 'ads-math', 'ads-competitor',
                 'ads-report', 'google-shopping-optimization', 'marketing-council', 'agent-reach'],
  crm:          ['churn-prevention', 'ab-testing', 'sm-newsletter-voice', 'sm-content-matrix', 'sm-post-writer',
                 'sm-post-formatter', 'sm-hook-generator', 'sm-quote-post', 'sm-reels-scripting', 'sm-profile-optimizer',
                 'sm-pinned-comment', 'sm-voice-builder', 'sm-graphic-designer', 'sm-youtube-thumbnail',
                 'sm-gemini-carousel', 'sm-gemini-infographic', 'sm-analytics-dashboard'],
  analytics:    ['ads-attribution', 'ab-testing', 'sm-analytics-dashboard', 'ads-report'],
  operations:   ['diagram-maker'],
  technology:   ['seo-technical', 'ci-security-scanning-with-strix', 'penetration-testing-with-strix',
                 'managed-pentesting-with-strix', 'fix-security-vulnerabilities-with-strix', 'playwright-cli'],
  organization: ['marketing-council', 'diagram-maker'],
};

/** Скиллы, не привязанные ни к одному аудиту: инструменты разработки и
 *  генерации артефактов. Загружаются по имени, но в промпты аудита не идут. */
export const UNROUTED_NOTE = 'инструменты разработки/оформления — доступны по имени, но в промпт аудита не подмешиваются';

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

/** Скиллы плагинов для конкретного аудита, свёрнутые в блок для промпта. */
export async function pluginSkillsFor(domain: string): Promise<string> {
  if (process.env.PLUGIN_SKILLS === 'off') return '';
  const names = SKILL_ROUTING[domain];
  if (!names?.length) return '';
  const have = new Set(await listSkills());
  const parts: string[] = [];
  let used = 0;
  for (const n of names) {
    if (!have.has(n)) continue;
    const body = await readSkill(n);
    if (!body || used + body.length > MAX_TOTAL) continue;
    used += body.length;
    parts.push(`### ${n}\n${body}`);
  }
  if (!parts.length) return '';
  return `\n\n# ОТРАСЛЕВЫЕ СКИЛЛЫ ДЛЯ АУДИТА «${domain}» (${parts.length})\n${parts.join('\n\n')}\n`;
}

/** Что установлено, что разведено по аудитам, что осталось без маршрута. */
export async function skillCoverage(): Promise<{ installed: number; routed: string[]; unrouted: string[]; missing: string[] }> {
  const have = await listSkills();
  const routed = [...new Set(Object.values(SKILL_ROUTING).flat())].sort();
  return {
    installed: have.length,
    routed: routed.filter((n) => have.includes(n)),
    unrouted: have.filter((n) => !routed.includes(n)),
    missing: routed.filter((n) => !have.includes(n)),
  };
}
