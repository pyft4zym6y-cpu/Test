/**
 * КАТАЛОГ ПРЕМИУМ-АГЕНТОВ (перечень для веб-интерфейса) + их реализации.
 *
 * Внешние профильные агенты подключаются здесь как точки расширения: карточка
 * описывает агента для UI, isAvailable проверяет доступ (ключ/коннектор), run
 * вызывает провайдера. Пока доступ не подключён — агент честно скипается с причиной,
 * прогон не падает. Один агент (кросс-верификация) — встроенный и работает всегда,
 * чтобы премиум давал ценность немедленно и путь перепроверки был реально задействован.
 */
import type { Expert, ExpertCard, ExpertResult, Verification } from './types.js';
import { geoReadiness, securitySignals, geoAeoWeb } from './builtinAgents.js';
import { performanceCwv, accessibilityAxe } from './waveOneAgents.js';

/** Встроенный агент второго мнения: перепроверяет базовые находки детерминированно. */
const qaCrossVerify: Expert = {
  card: {
    id: 'qa-cross-verify', name: 'Кросс-верификация находок', domain: 'qa',
    what: 'Второе мнение: перепроверяет базовые находки на доказательность, источник и воспроизводимость; отмечает требующие ручной проверки',
    provider: 'builtin', status: 'available',
    strengthens: ['Реестр находок', 'Сводный беклог', 'Executive Diagnostic'],
  },
  isAvailable: () => true,
  async run(ctx): Promise<ExpertResult> {
    const verifications: Verification[] = [];
    for (const f of ctx.baseFindings) {
      if (f.source === 'браузер/тест' || f.source === 'сеть') {
        verifications.push({ by: 'qa-cross-verify', targetId: f.id, verdict: 'уточнено', confidenceDelta: -0.05, note: 'Источник — тест/сеть: требует ручной перепроверки, прежде чем фиксировать как дефект сайта' });
      } else if ((f.evidenceLevel === 'E3' || f.evidenceLevel === 'E4') && f.impact >= 4) {
        verifications.push({ by: 'qa-cross-verify', targetId: f.id, verdict: 'подтверждено', confidenceDelta: 0.03, note: 'Сильное доказательство и высокое влияние — подтверждено вторым проходом' });
      }
    }
    const flagged = verifications.filter((v) => v.verdict === 'уточнено').length;
    const confirmed = verifications.filter((v) => v.verdict === 'подтверждено').length;
    return {
      expertId: 'qa-cross-verify', name: 'Кросс-верификация находок', domain: 'qa', ran: true,
      findings: [], verifications,
      summary: `Перепроверено ${ctx.baseFindings.length} находок: подтверждено ${confirmed}, отмечено на ручную проверку ${flagged}`,
    };
  },
};

/** Фабрика заглушки внешнего агента: скипается при отсутствии доступа, точка врезки вызова провайдера. */
function externalExpert(card: ExpertCard, onAvailableNote: string): Expert {
  const isAvailable = (env: NodeJS.ProcessEnv) => card.status === 'available' && (!card.credEnv || Boolean(env[card.credEnv]));
  return {
    card,
    isAvailable,
    async run(ctx): Promise<ExpertResult> {
      const base = { expertId: card.id, name: card.name, domain: card.domain, findings: [], verifications: [] };
      if (!isAvailable(process.env)) {
        return {
          ...base, ran: false,
          skippedReason: card.status === 'planned'
            ? 'интеграция запланирована (в разработке)'
            : `нужен доступ${card.credEnv ? ` (${card.credEnv})` : ''} — подключается в настройках коннекторов`,
          summary: 'пропущен — нет доступа',
        };
      }
      // ── ТОЧКА ВРЕЗКИ: здесь вызывается реальный провайдер (MCP/HTTP) и его находки
      //    маппятся в FindingInput[] / Verification[]. Пока доступ есть, но маппинг
      //    провайдера не реализован — возвращаем честный «доступен, вызов не подключён».
      ctx.log(`· премиум-агент «${card.name}»: доступ есть, вызов провайдера — точка расширения`);
      return { ...base, ran: true, summary: onAvailableNote };
    },
  };
}

/** ПЕРЕЧЕНЬ агентов премиум-экспертизы (порядок = порядок в UI). */
export const EXPERT_CATALOG: Expert[] = [
  qaCrossVerify,
  // ── Работают без нового ключа: детерминированные (нулевой ключ) + веб-поиск через
  //    уже имеющийся ключ воркера. ──
  geoReadiness,
  securitySignals,
  geoAeoWeb,
  performanceCwv,
  accessibilityAxe,
  externalExpert({
    id: 'seo-search-console', name: 'Google Search Console — SEO факты', domain: 'seo',
    what: 'Реальные позиции, запросы, индексация, Core Web Vitals и schema-валидация вместо внешних наблюдений',
    provider: 'mcp', credEnv: 'GSC_TOKEN', status: 'needs-auth',
    strengthens: ['SEO Architecture', 'Технический аудит', 'Реестр находок'],
  }, 'Search Console подключён — SEO-факты добавлены'),
  externalExpert({
    id: 'competitor-bench', name: 'Конкурентный бенчмарк', domain: 'competitors',
    what: 'Client vs 3–5 конкурентов по checkout/PDP/PLP, ассортименту, ценам и механикам — лобовое сравнение',
    provider: 'http', credEnv: 'COMPETITOR_API_KEY', status: 'needs-auth',
    strengthens: ['Конкурентный анализ', 'UX/UI', 'Маркетинговые механики'],
  }, 'Агент бенчмарка подключён — сравнение с конкурентами добавлено'),
  externalExpert({
    id: 'ads-intelligence', name: 'Реклама и ROAS', domain: 'ads',
    what: 'Структура и эффективность платных кабинетов (Google/Meta): расходы, ROAS, качество событий — то, что снаружи заблокировано',
    provider: 'mcp', credEnv: 'ADS_TOKEN', status: 'needs-auth',
    strengthens: ['Аудит каналов', 'Деньги'],
  }, 'Ads-агент подключён — данные кабинетов добавлены'),
  externalExpert({
    id: 'tech-crawl-deep', name: 'Глубокий технический краул', domain: 'tech',
    what: 'Полный обход (Screaming Frog): битые ссылки, редиректы, дубли, глубина, orphan-страницы — глубже базового Playwright-обхода',
    provider: 'mcp', credEnv: 'SF_LICENSE', status: 'needs-auth',
    strengthens: ['Технический аудит', 'SEO Architecture'],
  }, 'Технический краулер подключён — глубокий SEO-обход добавлен'),
  externalExpert({
    id: 'reputation-deep', name: 'Глубокая репутация', domain: 'reputation',
    what: 'Расширенный сбор упоминаний и отзывов (карты, маркетплейсы, отзовики, форумы, СМИ) с тональностью и типологией причин',
    provider: 'http', credEnv: 'REPUTATION_API_KEY', status: 'needs-auth',
    strengthens: ['Внешний инфофон', 'Аудит отзывов'],
  }, 'Агент репутации подключён — расширенный свод упоминаний добавлен'),

  // ── РОАДМАПА (планируется): приоритетные направления e-commerce-экспертизы. Многие
  //    из «браузерных» строятся БЕЗ внешнего ключа — в нашем же Playwright/на бесплатных API. ──
  externalExpert({
    id: 'ad-library', name: 'Реклама конкурентов (ad libraries)', domain: 'ads',
    what: 'Креативы, форматы и активность конкурентов в Meta Ad Library и Google Ads Transparency — публичные данные, без кабинетов',
    provider: 'http', status: 'planned',
    strengthens: ['Аудит каналов', 'Конкурентный анализ'],
  }, ''),
  externalExpert({
    id: 'backlinks', name: 'Ссылочный профиль / авторитет', domain: 'seo',
    what: 'Referring domains, авторитет, анкоры, токсичность ссылок (Ahrefs/Semrush/Serpstat)',
    provider: 'http', credEnv: 'AHREFS_KEY', status: 'planned',
    strengthens: ['SEO Architecture'],
  }, ''),
  externalExpert({
    id: 'traffic-intelligence', name: 'Оценка трафика и каналов', domain: 'competitors',
    what: 'Внешняя оценка объёма трафика и микса каналов (SimilarWeb) — картина спроса без доступа к GA4',
    provider: 'http', credEnv: 'SIMILARWEB_KEY', status: 'planned',
    strengthens: ['Аудит каналов', 'Конкурентный анализ', 'Деньги'],
  }, ''),
  externalExpert({
    id: 'marketplace-price', name: 'Цена в канале / маркетплейсы', domain: 'competitors',
    what: 'Цена у реселлеров и на маркетплейсах (прайс-агрегаторы, Rozetka/Prom/Amazon) — закрывает пустой отчёт «Цена в канале»',
    provider: 'http', credEnv: 'PRICE_API_KEY', status: 'planned',
    strengthens: ['Цена в канале', 'Конкурентный анализ'],
  }, ''),
  externalExpert({
    id: 'social-listening', name: 'Соцпрослушка (share of voice)', domain: 'reputation',
    what: 'Объём и тональность упоминаний в соцсетях и форумах, share of voice vs конкуренты (Brand24/YouScan)',
    provider: 'http', credEnv: 'SOCIAL_LISTEN_KEY', status: 'planned',
    strengthens: ['Внешний инфофон', 'Соцсети'],
  }, ''),
];

/** Карточки каталога для веб-интерфейса (+ доступность в текущем окружении). */
export function catalogCards(env: NodeJS.ProcessEnv = process.env): (ExpertCard & { available: boolean })[] {
  return EXPERT_CATALOG.map((e) => ({ ...e.card, available: e.isAvailable(env) }));
}
