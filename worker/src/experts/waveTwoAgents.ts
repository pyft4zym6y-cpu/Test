/**
 * Волна 2 премиум-агентов:
 *  - marketplace-price: цена бренда у реселлеров и на маркетплейсах через веб-поиск
 *    (уже имеющийся ключ Claude, без нового) — закрывает пустой отчёт «Цена в канале».
 *  - backlinks: ссылочный профиль/авторитет через Serpstat API (ключ клиента).
 *  - traffic-intelligence: оценка трафика и микса каналов через SimilarWeb API (ключ).
 * Key-gated агенты делают РЕАЛЬНЫЙ вызов провайдера и при ошибке/отсутствии ключа
 * честно скипаются; парсинг ответа защитный. Все находки — в единый реестр.
 */
import { hasKey } from '../anthropic.js';
import { webResearch } from '../externalAudits.js';
import type { Expert, ExpertResult } from './types.js';
import type { FindingInput } from '../registry.js';

const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const clampImpact = (n: unknown) => Math.min(5, Math.max(1, Number(n) || 3));

/* ── Цена в канале / маркетплейсы (веб-поиск, существующий ключ) ── */
export const marketplacePrice: Expert = {
  card: {
    id: 'marketplace-price', name: 'Цена в канале / маркетплейсы', domain: 'competitors',
    what: 'Цена бренда у реселлеров и на маркетплейсах (Rozetka/Prom/Hotline/Amazon), канальный конфликт и упущенные каналы — через веб-поиск, без нового ключа',
    provider: 'http', status: 'available',
    strengthens: ['Цена в канале', 'Конкурентный анализ', 'Аудит каналов'],
  },
  isAvailable: (env) => Boolean(env.ANTHROPIC_API_KEY),
  async run(ctx): Promise<ExpertResult> {
    const base = { expertId: 'marketplace-price', name: 'Цена в канале / маркетплейсы', domain: 'competitors' as const, findings: [] as FindingInput[], verifications: [] };
    if (!hasKey()) return { ...base, ran: false, skippedReason: 'нужен ключ Claude (ANTHROPIC_API_KEY) для веб-поиска', summary: 'пропущен' };
    const host = hostOf(ctx.dataset.client.finalUrl || ctx.dataset.client.rootUrl);
    const res = await webResearch<{ marketplaces?: string[]; cheaperElsewhere?: boolean; findings?: { title: string; gap?: string; impact?: number }[] }>(
      'Ты — аналитик ценообразования в канале e-commerce. Найди, где ещё продаётся бренд/его товары: собственные и чужие витрины на маркетплейсах (Rozetka, Prom, Hotline, Amazon, eBay, локальные), реселлеры, агрегаторы цен. Оцени: есть ли присутствие на маркетплейсах, дешевле ли товар в других каналах, есть ли канальный конфликт/демпинг реселлеров, нарушается ли рекомендованная цена. Верни СТРОГО JSON {"marketplaces":["где найдено"],"cheaperElsewhere":true|false,"findings":[{"title":"вывод про цену в канале 1 фразой","gap":"что сделать","impact":1-5}]} (2-5 записей). Только факты поиска, ничего не выдумывай.',
      `Бренд/домен: ${host}. Проверь цену бренда в каналах и на маркетплейсах.`, ctx.log,
    );
    if (!res) return { ...base, ran: true, summary: 'веб-поиск не дал результата (нет ключа/данных)' };
    const findings: FindingInput[] = (res.findings ?? []).slice(0, 5).map((f) => ({
      domain: 'pricing-os', title: f.title, gap: f.gap, touchpoint: 'канал продаж',
      impact: clampImpact(f.impact), difficulty: 3,
      source: 'внешний-поиск', evidenceLevel: 'E2', reproducibility: 'наблюдение (веб-поиск)',
      benchmarkSource: 'цена в канале',
    }));
    return { ...base, ran: true, findings, summary: `Цена в канале: маркетплейсы [${(res.marketplaces ?? []).slice(0, 4).join(', ') || 'не найдено'}]${res.cheaperElsewhere ? ', дешевле в другом канале — риск конфликта' : ''} — ${findings.length} находок` };
  },
};

/* ── Ссылочный профиль / авторитет (Serpstat API, ключ клиента) ── */
export const backlinks: Expert = {
  card: {
    id: 'backlinks', name: 'Ссылочный профиль / авторитет', domain: 'seo',
    what: 'Referring domains, авторитет домена, анкоры и токсичность ссылок через Serpstat API',
    provider: 'http', credEnv: 'SERPSTAT_KEY', status: 'needs-auth',
    strengthens: ['SEO Architecture'],
  },
  isAvailable: (env) => Boolean(env.SERPSTAT_KEY),
  async run(ctx): Promise<ExpertResult> {
    const base = { expertId: 'backlinks', name: 'Ссылочный профиль / авторитет', domain: 'seo' as const, findings: [] as FindingInput[], verifications: [] };
    const token = process.env.SERPSTAT_KEY;
    if (!token) return { ...base, ran: false, skippedReason: 'нужен ключ SERPSTAT_KEY', summary: 'пропущен' };
    const domain = hostOf(ctx.dataset.client.finalUrl || ctx.dataset.client.rootUrl);
    try {
      const r = await fetch(`https://api.serpstat.com/v4/?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '1', method: 'SerpstatBacklinksProcedure.getSummaryV2', params: { query: domain, searchType: 'domain' } }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) return { ...base, ran: false, skippedReason: `Serpstat HTTP ${r.status}`, summary: 'пропущен' };
      const j = await r.json() as any;
      const d = j?.result?.data ?? {};
      const refDomains = Number(d.referring_domains ?? d.referringDomains ?? 0);
      const sdr = Number(d.sdr ?? d.domain_rank ?? 0); // авторитет домена
      const findings: FindingInput[] = [];
      if (refDomains > 0 && refDomains < 50) findings.push({ domain: 'seo-os', key: 'weak-backlinks', title: `Слабый ссылочный профиль: всего ${refDomains} ссылающихся доменов`, gap: 'Программа наращивания качественных ссылок (PR, каталоги, отраслевые площадки)', funnelStep: 'привлечение', impact: 3, difficulty: 4, source: 'данные', evidenceLevel: 'E4', reproducibility: 'подтверждено (Serpstat)', benchmarkSource: 'Serpstat backlinks' });
      if (sdr && sdr < 20) findings.push({ domain: 'seo-os', key: 'low-authority', title: `Низкий авторитет домена (SDR ${sdr}) — сложнее ранжироваться по конкурентным запросам`, gap: 'Наращивать авторитет: ссылки + E-E-A-T сигналы', funnelStep: 'привлечение', impact: 3, difficulty: 4, source: 'данные', evidenceLevel: 'E4', reproducibility: 'подтверждено (Serpstat)' });
      return { ...base, ran: true, findings, summary: `Ссылочный профиль: ${refDomains} ref.domains, авторитет ${sdr || 'н/д'} — ${findings.length} находок` };
    } catch (e) {
      return { ...base, ran: false, skippedReason: `Serpstat недоступен: ${String(e).slice(0, 60)}`, summary: 'пропущен' };
    }
  },
};

/* ── Оценка трафика и каналов (SimilarWeb API, ключ клиента) ── */
export const trafficIntel: Expert = {
  card: {
    id: 'traffic-intelligence', name: 'Оценка трафика и каналов', domain: 'competitors',
    what: 'Внешняя оценка объёма трафика и микса каналов (SimilarWeb) — картина спроса без доступа к GA4',
    provider: 'http', credEnv: 'SIMILARWEB_KEY', status: 'needs-auth',
    strengthens: ['Аудит каналов', 'Конкурентный анализ', 'Деньги'],
  },
  isAvailable: (env) => Boolean(env.SIMILARWEB_KEY),
  async run(ctx): Promise<ExpertResult> {
    const base = { expertId: 'traffic-intelligence', name: 'Оценка трафика и каналов', domain: 'competitors' as const, findings: [] as FindingInput[], verifications: [] };
    const key = process.env.SIMILARWEB_KEY;
    if (!key) return { ...base, ran: false, skippedReason: 'нужен ключ SIMILARWEB_KEY', summary: 'пропущен' };
    const domain = hostOf(ctx.dataset.client.finalUrl || ctx.dataset.client.rootUrl);
    try {
      const r = await fetch(`https://api.similarweb.com/v1/website/${encodeURIComponent(domain)}/traffic-sources/overview-share?api_key=${encodeURIComponent(key)}&format=json`, { signal: AbortSignal.timeout(25000) });
      if (!r.ok) return { ...base, ran: false, skippedReason: `SimilarWeb HTTP ${r.status}`, summary: 'пропущен' };
      const j = await r.json() as any;
      // защитный парсинг: доли каналов (0..1)
      const shares = (j?.visits ?? j?.overview ?? []) as { source_type?: string; share?: number }[];
      const byType = new Map<string, number>();
      for (const s of Array.isArray(shares) ? shares : []) if (s.source_type) byType.set(s.source_type.toLowerCase(), (s.share ?? 0));
      const paid = byType.get('paid search') ?? byType.get('paid') ?? 0;
      const direct = byType.get('direct') ?? 0;
      const findings: FindingInput[] = [];
      if (paid > 0.4) findings.push({ domain: 'channel-os', key: 'paid-dependency', title: `Высокая зависимость от платного трафика (${Math.round(paid * 100)}% визитов) — рост оплачивается рекламой`, gap: 'Развивать органику/retention, чтобы снизить долю платного', funnelStep: 'привлечение', impact: 3, difficulty: 4, source: 'данные', evidenceLevel: 'E3', reproducibility: 'оценка (SimilarWeb)', benchmarkSource: 'SimilarWeb traffic mix' });
      if (direct > 0 && direct < 0.15) findings.push({ domain: 'channel-os', key: 'weak-brand', title: `Низкая доля прямого трафика (${Math.round(direct * 100)}%) — слабая узнаваемость бренда`, gap: 'Инвестировать в бренд: PR, соцсети, повторные касания', funnelStep: 'привлечение', impact: 2, difficulty: 4, source: 'данные', evidenceLevel: 'E3', reproducibility: 'оценка (SimilarWeb)' });
      return { ...base, ran: true, findings, summary: `Микс каналов (SimilarWeb): платный ${Math.round(paid * 100)}%, прямой ${Math.round(direct * 100)}% — ${findings.length} находок` };
    } catch (e) {
      return { ...base, ran: false, skippedReason: `SimilarWeb недоступен: ${String(e).slice(0, 60)}`, summary: 'пропущен' };
    }
  },
};
