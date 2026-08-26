/**
 * Аналитический слой T1: Claude по методологии Commerce OS превращает L0-обход
 * в структурированный аудит (находки, боли по причинам, конкурентные разрывы,
 * недостающие факты, черновой scope, открытые вопросы). Деньги на L0 не считает.
 */
import { ask, extractJson } from './anthropic.js';
import { analysisSystemPrompt, prelaunchSystemPrompt } from './method.js';
import { knowledgeFor } from './knowledge.js';
import type { AuditDataset } from './report.js';
import type { SiteCrawl } from './crawl.js';

export const systemFor = (ds: AuditDataset) => (ds.mode === 'prelaunch' ? prelaunchSystemPrompt() : analysisSystemPrompt());

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
  if (ds.mode === 'prelaunch') {
    L.push(`Тир T0 · ПРЕДЗАПУСК (сайта ещё нет / в разработке).`);
    L.push(`Бриф проекта: ${ds.brief || ds.request || '(бриф не задан)'}`);
    if (ds.competitors.length) {
      L.push('\nКОНКУРЕНТЫ (реальный обход — учись у них):');
      ds.competitors.forEach((c, i) => L.push(siteBrief(c, `конкурент ${i + 1}`)));
    } else {
      L.push('\nКонкуренты не заданы — оцени по нише из брифа и внешним данным.');
    }
    if (engineFactsStr) L.push('\n' + engineFactsStr);
    L.push('\nСделай предзапусковую диагностику по схеме из системного промпта. Верни только JSON.');
    return L.join('\n');
  }
  L.push(`Тир T${ds.tier}. Запрос клиента: ${ds.request || '(не задан — негласный/инициативный аудит)'}`);
  // База знаний идёт ПЕРЕД данными обхода: она задаёт рамку — что мы уже знаем,
  // чего нам не дали и какие выводы уже сделаны на прошлых этапах.
  if (ds.knowledge) L.push('\n' + ds.knowledge);
  // Уровни данных идут СРАЗУ после базы знаний: аудитор должен читать факты
  // уже зная, какой у каждого источник и чему из этого можно верить.
  if (ds.evidence) L.push('\n' + ds.evidence);
  if (ds.crux) L.push('\n' + ds.crux);
  L.push('\n' + siteBrief(ds.client, 'КЛИЕНТ'));
  if (ds.competitors.length) {
    L.push('\nКОНКУРЕНТЫ:');
    ds.competitors.forEach((c, i) => L.push(siteBrief(c, `конкурент ${i + 1}`)));
  }
  if (engineFactsStr) L.push('\n' + engineFactsStr);
  L.push('\nСделай аудит уровня L0 по схеме из системного промпта. Опирайся на расчёт движка, если он есть (Health Score, разрывы, решения — их не пересчитывай). Верни только JSON.');
  return L.join('\n');
}

/** Уверенность к доле 0..1: модель может вернуть 25 (проценты) — иначе в отчёте «2500%». */
export function normConfidence(c: unknown): number {
  let n = typeof c === 'number' && Number.isFinite(c) ? c : 0.5;
  if (n > 1) n = n / 100;
  return Math.max(0, Math.min(1, n));
}

/** Явна вимога до LLM: усі текстові поля відповіді — природною українською. */
const UK_INSTRUCTION = '\n\nВАЖЛИВО: усі текстові поля у відповіді (summary, healthNote, findings, pains, competitors, missingFacts, scope, openQuestions тощо) пиши природною УКРАЇНСЬКОЮ мовою, а не російською.';

export async function analyze(ds: AuditDataset, engineFactsStr?: string): Promise<Analysis> {
  const text = await ask(systemFor(ds) + (await knowledgeFor('analyze')) + UK_INSTRUCTION, datasetToPrompt(ds, engineFactsStr), 8000);
  const a = extractJson<Partial<Analysis>>(text);
  return {
    summary: a.summary ?? '',
    healthNote: a.healthNote ?? '',
    findings: (a.findings ?? []).map((f) => ({ ...f, confidence: normConfidence(f?.confidence) })),
    pains: a.pains ?? [],
    competitors: a.competitors ?? '',
    missingFacts: a.missingFacts ?? [],
    scope: a.scope ?? [],
    openQuestions: a.openQuestions ?? [],
  };
}
