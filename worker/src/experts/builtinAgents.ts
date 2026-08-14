/**
 * Агенты премиум-экспертизы, работающие БЕЗ нового внешнего ключа:
 *  - geo-readiness, security-signals — детерминированные, из уже собранных сигналов
 *    обхода (ai/llms.txt, blockedBots, заголовки безопасности, schema). Нулевой ключ.
 *  - geo-aeo — веб-поиск через уже имеющийся ключ воркера (Claude web search):
 *    цитируется ли бренд в AI-ответах и где пробелы AI-видимости.
 * Каждый отдаёт FindingInput[] в единый реестр.
 */
import { hasKey } from '../anthropic.js';
import { webResearch } from '../externalAudits.js';
import type { Expert, ExpertResult } from './types.js';
import type { FindingInput } from '../registry.js';

const hasCheck = (ds: any, id: string) => ds.client.pages.some((p: any) => p.checks.some((c: any) => c.id === id && c.pass));

/** GEO/AEO-готовность из технических сигналов обхода — детерминированно, без ключа. */
export const geoReadiness: Expert = {
  card: {
    id: 'geo-readiness', name: 'GEO/AEO-готовность (техническая)', domain: 'geo',
    what: 'AI-видимость из технических сигналов: llms.txt, доступ AI-краулеров, Product/Organization-разметка — без ключа',
    provider: 'builtin', status: 'available',
    strengthens: ['SEO Architecture', 'Внешний инфофон', 'Контент-аудит'],
  },
  isAvailable: () => true,
  async run(ctx): Promise<ExpertResult> {
    const ds = ctx.dataset as any;
    const ai = ds.client.ai as { llmsTxt: boolean; blockedBots: string[] } | undefined;
    const findings: FindingInput[] = [];
    if (ai && !ai.llmsTxt) findings.push({ domain: 'seo-os', key: 'llms-txt', title: 'Нет llms.txt — бренд не управляет тем, что о нём «знают» AI-системы', funnelStep: 'привлечение', impact: 2, difficulty: 1, source: 'сайт', evidenceLevel: 'E4', reproducibility: 'подтверждено', gap: 'Добавить llms.txt с ключевыми фактами о бренде, категориях и УТП', benchmarkSource: 'GEO/AEO' });
    if (ai && ai.blockedBots?.length) findings.push({ domain: 'seo-os', key: 'ai-bots-blocked', title: `AI-краулеры заблокированы в robots (${ai.blockedBots.join(', ')}) — сайт исключён из AI-выдачи`, funnelStep: 'привлечение', impact: 3, difficulty: 1, source: 'сайт', evidenceLevel: 'E4', reproducibility: 'подтверждено', gap: 'Разрешить доступ AI-краулерам, если нужна видимость в ChatGPT/Perplexity/Gemini' });
    if (!hasCheck(ds, 'schema-product')) findings.push({ domain: 'seo-os', key: 'schema-product-missing', title: 'Нет Product/Offer-разметки — LLM и поиск хуже извлекают факты о товарах', funnelStep: 'привлечение', impact: 3, difficulty: 2, source: 'сайт', evidenceLevel: 'E3', reproducibility: 'подтверждено', gap: 'Добавить schema.org Product/Offer на карточки и листинги', benchmarkSource: 'точность извлечения фактов LLM ~16%→54% с разметкой' });
    if (!hasCheck(ds, 'schema-org')) findings.push({ domain: 'seo-os', key: 'schema-org-missing', title: 'Нет Organization/WebSite-разметки — бренд хуже идентифицируется поисковыми и AI-системами', funnelStep: 'привлечение', impact: 2, difficulty: 1, source: 'сайт', evidenceLevel: 'E3', reproducibility: 'подтверждено', gap: 'Добавить Organization + WebSite JSON-LD' });
    return { expertId: 'geo-readiness', name: 'GEO/AEO-готовность (техническая)', domain: 'geo', ran: true, findings, verifications: [], summary: `GEO-сигналы проверены: ${findings.length} разрывов AI-видимости` };
  },
};

/** Сигналы безопасности из заголовков ответа — детерминированно, без ключа. */
export const securitySignals: Expert = {
  card: {
    id: 'security-signals', name: 'Сигналы безопасности (заголовки)', domain: 'tech',
    what: 'CSP / HSTS / X-Frame-Options из ответа сервера — базовая защита от XSS/clickjacking/даунгрейда, без ключа',
    provider: 'builtin', status: 'available',
    strengthens: ['Технический аудит'],
  },
  isAvailable: () => true,
  async run(ctx): Promise<ExpertResult> {
    const sh = (ctx.dataset as any).client.secHeaders as { csp: boolean; hsts: boolean; xfo: boolean } | undefined;
    const findings: FindingInput[] = [];
    if (sh) {
      if (!sh.hsts) findings.push({ domain: 'tech-os', key: 'hsts-missing', title: 'Нет HSTS — соединение уязвимо к даунгрейду на HTTP', funnelStep: 'право', impact: 2, difficulty: 1, source: 'сайт', evidenceLevel: 'E4', reproducibility: 'подтверждено', gap: 'Включить Strict-Transport-Security' });
      if (!sh.xfo) findings.push({ domain: 'tech-os', key: 'xfo-missing', title: 'Нет защиты от clickjacking (X-Frame-Options / CSP frame-ancestors)', funnelStep: 'право', impact: 2, difficulty: 1, source: 'сайт', evidenceLevel: 'E4', reproducibility: 'подтверждено', gap: 'Добавить X-Frame-Options: SAMEORIGIN или CSP frame-ancestors' });
      if (!sh.csp) findings.push({ domain: 'tech-os', key: 'csp-missing', title: 'Нет Content-Security-Policy — выше риск XSS и инъекций сторонних скриптов', funnelStep: 'право', impact: 2, difficulty: 3, source: 'сайт', evidenceLevel: 'E4', reproducibility: 'подтверждено', gap: 'Внедрить CSP (начать с Content-Security-Policy-Report-Only)' });
    }
    return { expertId: 'security-signals', name: 'Сигналы безопасности (заголовки)', domain: 'tech', ran: true, findings, verifications: [], summary: `Заголовки безопасности: ${findings.length} разрывов` };
  },
};

/** Реальная AI-видимость бренда через веб-поиск (использует уже имеющийся ключ воркера). */
export const geoAeoWeb: Expert = {
  card: {
    id: 'geo-aeo', name: 'GEO / AI-видимость (веб-поиск)', domain: 'geo',
    what: 'Цитируется ли бренд в AI-ответах (ChatGPT/Perplexity/Gemini) и где пробелы — через веб-поиск, без нового ключа',
    provider: 'http', status: 'available',
    strengthens: ['Внешний инфофон', 'SEO Architecture'],
  },
  isAvailable: (env) => Boolean(env.ANTHROPIC_API_KEY),
  async run(ctx): Promise<ExpertResult> {
    const base = { expertId: 'geo-aeo', name: 'GEO / AI-видимость (веб-поиск)', domain: 'geo' as const, findings: [] as FindingInput[], verifications: [] };
    if (!hasKey()) return { ...base, ran: false, skippedReason: 'нужен ключ Claude (ANTHROPIC_API_KEY) для веб-поиска', summary: 'пропущен' };
    let host = ctx.dataset.client.finalUrl;
    try { host = new URL(ctx.dataset.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
    const res = await webResearch<{ visible?: boolean; findings?: { title: string; gap?: string; impact?: number }[] }>(
      'Ты — аналитик AI-видимости (GEO/AEO) e-commerce бренда. Оцени, насколько бренд представлен в ответах AI-поисковиков и генеративных систем (наличие фактов, цитируемость, структурированность данных о бренде и товарах). Верни СТРОГО JSON {"visible":true|false,"findings":[{"title":"пробел AI-видимости 1 фразой","gap":"что сделать","impact":1-5}]} (2-5 записей). Только выводы из поиска, ничего не выдумывай.',
      `Бренд/домен: ${host}. Оцени AI-видимость и пробелы.`, ctx.log,
    );
    if (!res) return { ...base, ran: true, summary: 'веб-поиск не дал результата (нет ключа/данных)' };
    const findings: FindingInput[] = (res.findings ?? []).slice(0, 5).map((f) => ({
      domain: 'seo-os', title: f.title, gap: f.gap, funnelStep: 'привлечение',
      impact: Math.min(5, Math.max(1, f.impact ?? 3)), difficulty: 2,
      source: 'внешний-поиск', evidenceLevel: 'E2', reproducibility: 'наблюдение', benchmarkSource: 'GEO/AEO web',
    }));
    return { ...base, ran: true, findings, summary: `AI-видимость проверена: бренд ${res.visible ? 'представлен' : 'слабо представлен'}, ${findings.length} пробелов` };
  },
};
