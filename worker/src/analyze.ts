/**
 * Аналитический слой T1: Claude по методологии Commerce OS превращает L0-обход
 * в структурированный аудит (находки, боли по причинам, конкурентные разрывы,
 * недостающие факты, черновой scope, открытые вопросы). Деньги на L0 не считает.
 */
import { ask, extractJson } from './anthropic.js';
import { analysisSystemPrompt } from './method.js';
import type { AuditDataset } from './report.js';
import type { SiteCrawl } from './crawl.js';

export type Finding = { area: string; status: string; fact: string; why: string; confidence: number };
export type Pain = { cause: string; symptoms: string[]; evidence: string[] };
export type ScopeItem = { playbook: string; reason: string; wave: number };

export type Analysis = {
  summary: string;
  healthNote: string;
  findings: Finding[];
  pains: Pain[];
  competitors: string;
  missingFacts: string[];
  scope: ScopeItem[];
  openQuestions: string[];
};

/** Сжатая сводка обхода одного сайта для промпта (без гигабайтов сырых чеков). */
function siteBrief(site: SiteCrawl, label: string): string {
  const scored = site.pages.filter((p) => p.score !== null);
  const avg = scored.length ? Math.round(scored.reduce((s, p) => s + (p.score ?? 0), 0) / scored.length) : null;
  const failCount = new Map<string, number>();
  for (const p of site.pages) for (const c of p.checks) if (!c.pass) failCount.set(`${c.group}: ${c.label}`, (failCount.get(`${c.group}: ${c.label}`) ?? 0) + 1);
  const topFails = Array.from(failCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 18);
  const L: string[] = [];
  L.push(`[${label}] ${site.finalUrl} — соответствие голд-стандарту ${avg ?? '—'}%`);
  L.push(`платформа: ${site.tech.platform ?? 'не определена'}; аналитика: ${site.tech.analytics.join(', ') || 'не обнаружена'}; robots: ${site.robotsTxt ? 'есть' : 'нет'}; sitemap: ${site.sitemapXml ? 'есть' : 'нет'}`);
  L.push('страницы: ' + site.pages.map((p) => `${p.kind}(${p.score ?? '—'}%)`).join(', '));
  if (!site.reachable) L.push(`⚠️ обходчику недоступен${site.error ? `: ${site.error}` : ''}`);
  if (topFails.length) L.push('провалы: ' + topFails.map(([k, n]) => `${k}×${n}`).join('; '));
  return L.join('\n');
}

export function datasetToPrompt(ds: AuditDataset, engineFactsStr?: string): string {
  const L: string[] = [];
  L.push(`Тир T${ds.tier}. Запрос клиента: ${ds.request || '(не задан — негласный/инициативный аудит)'}`);
  L.push('\n' + siteBrief(ds.client, 'КЛИЕНТ'));
  if (ds.competitors.length) {
    L.push('\nКОНКУРЕНТЫ:');
    ds.competitors.forEach((c, i) => L.push(siteBrief(c, `конкурент ${i + 1}`)));
  }
  if (engineFactsStr) L.push('\n' + engineFactsStr);
  L.push('\nСделай аудит уровня L0 по схеме из системного промпта. Опирайся на расчёт движка, если он есть (Health Score, разрывы, решения — их не пересчитывай). Верни только JSON.');
  return L.join('\n');
}

export async function analyze(ds: AuditDataset, engineFactsStr?: string): Promise<Analysis> {
  const text = await ask(analysisSystemPrompt(), datasetToPrompt(ds, engineFactsStr), 8000);
  const a = extractJson<Partial<Analysis>>(text);
  return {
    summary: a.summary ?? '',
    healthNote: a.healthNote ?? '',
    findings: a.findings ?? [],
    pains: a.pains ?? [],
    competitors: a.competitors ?? '',
    missingFacts: a.missingFacts ?? [],
    scope: a.scope ?? [],
    openQuestions: a.openQuestions ?? [],
  };
}
