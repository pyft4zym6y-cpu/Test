import type { AdminRow, AuditAnswer, DiagRecord } from '@/lib/supa';
import { ACCESS_CATALOG } from '@/data/accessCatalog';

/**
 * Пакет знань про клієнта, який їде в рушій. Досі воркер отримував ЛИШЕ відповіді
 * анкети — тобто зріз на момент аудиту. Але база знань живе через усі етапи, і
 * прогін на етапі впровадження має бачити те саме, що бачить менеджер: профіль,
 * які системи нам відкрили, що клієнт завантажив, як ми оцінили модулі, що вже
 * прогонялось раніше і що вже віддано клієнту.
 *
 * Свідомо БЕЗ вмісту файлів і без персональних даних — тільки факт наявності:
 * рушію потрібен контекст, а не вивантаження бази клієнта.
 */
export type KnowledgePack = {
  phase?: string;
  company?: Record<string, string>;
  accesses?: { system: string; category: string; status: string; method?: string }[];
  marketplaces?: { name: string; status?: string; scope?: string }[];
  files?: { title: string; group: string; why?: string }[];
  scoring?: { module: string; state?: string; gap?: string; priority?: string }[];
  priorRuns?: { at: string; site?: string; tier?: number; health?: number | null; summary?: string }[];
  delivered?: string[];
  notes?: string[];
  answersCount?: { done: number; total: number };
  /** Розбір Search Console — L1-дані з системи клієнта, а не зі слів. */
  search?: {
    site: string; period: { start: string; end: string }; prevPeriod?: { start: string; end: string };
    totals: { clicks: number; impressions: number; ctr: number; position: number };
    counts: { rows: number; pages: number; queries: number; truncated?: boolean };
    striking: { query: string; page: string; impressions: number; position: number; upliftEst: number }[];
    cannibal: { query: string; impressions: number; pages: { page: string; position: number }[] }[];
    ctrGap: { query: string; page: string; impressions: number; position: number; ctr: number; expectedCtr: number }[];
    decay: { page: string; clicksNow: number; clicksPrev: number; dropPct: number }[];
    at: string;
  };
};

export function buildKnowledgePack(
  row: AdminRow,
  answers: Record<string, AuditAnswer> = {},
  totalQuestions = 0,
  phase?: string,
): KnowledgePack {
  const rec: DiagRecord = row.record || {};
  const c = rec.company || {};
  const company: Record<string, string> = {};
  for (const [k, v] of Object.entries({
    name: c.name, industry: c.industry, model: c.model, niche: c.niche, markets: c.markets,
    countries: c.countries, size: c.sizeRange || c.revenue, team: c.teamSize, outlets: c.outlets,
    site: c.site, domains: c.domains, platform: c.platform, crmErp: c.crmErp,
    channels: c.channels?.join(', '), acqChannels: c.acqChannels?.join(', '),
  })) if (v) company[k] = String(v);

  const accesses = Object.entries(rec.accessLog || {})
    .filter(([, a]) => a.status && a.status !== 'na')
    .map(([id, a]) => {
      const cat = ACCESS_CATALOG.find((x) => x.id === id);
      return { system: cat?.system || id, category: cat?.category || '—', status: String(a.status), method: a.method };
    });

  const done = Object.values(answers).filter((a) => a && a.value != null && a.value !== '').length;

  return {
    phase,
    company: Object.keys(company).length ? company : undefined,
    accesses: accesses.length ? accesses : undefined,
    marketplaces: (rec.marketplaces || []).map((m) => ({ name: m.name, status: m.status, scope: m.scope })),
    files: (rec.clientFiles || []).map((f) => ({ title: f.title || f.type || 'файл', group: f.group, why: f.why })),
    scoring: Object.entries(rec.assessment || {}).map(([module, v]) => ({ module, state: v.state, gap: v.gap, priority: v.priority })),
    priorRuns: (rec.auditJobs || []).slice(0, 5).map((j) => ({ at: j.at, site: j.site, tier: j.tier, health: j.health, summary: j.summary })),
    delivered: (rec.sharedDocs || []).map((d) => d.title),
    notes: (rec.notes || []).slice(0, 20).map((n) => `${n.module ? `[${n.module}] ` : ''}${n.text}`),
    answersCount: totalQuestions ? { done, total: totalQuestions } : undefined,
    // Обрізаємо списки: рушію потрібні найбільші розриви, а не весь хвіст.
    // Повний зріз лишається в записі клієнта — тут лише те, що читає модель.
    search: rec.searchData ? {
      site: rec.searchData.site,
      period: rec.searchData.period,
      prevPeriod: rec.searchData.prevPeriod,
      totals: rec.searchData.totals,
      counts: rec.searchData.counts,
      striking: rec.searchData.striking.slice(0, 25).map((x) => ({ query: x.query, page: x.page, impressions: x.impressions, position: x.position, upliftEst: x.upliftEst })),
      cannibal: rec.searchData.cannibal.slice(0, 12).map((c) => ({ query: c.query, impressions: c.impressions, pages: c.pages.map((p2) => ({ page: p2.page, position: p2.position })) })),
      ctrGap: rec.searchData.ctrGap.slice(0, 15),
      decay: rec.searchData.decay.slice(0, 15),
      at: rec.searchData.at,
    } : undefined,
  };
}
