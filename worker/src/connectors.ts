/**
 * Внешние источники данных аудита — единый реестр со статусом.
 *
 * РЕШЕНИЕ ПО РАЗВИЛКЕ (26.08): движок ходит в API НАПРЯМУЮ, а не тянет MCP в
 * образ. Причины:
 *   • MCP-серверы из `.mcp.json` — stdio-процессы под npx/uvx: в контейнере это
 *     лишние рантаймы, а три из девяти требуют интерактивного OAuth, который в
 *     headless-контейнере пройти нельзя в принципе;
 *   • Screaming Frog — десктопное приложение с лицензией, в контейнере не живёт;
 *   • у всего ценного (GSC, GA4, Google Ads, CrUX, PageSpeed, PostHog) есть
 *     обычный REST с сервис-аккаунтом или токеном — в сервере это надёжнее.
 *
 * Реестр честный: статус считается по фактическому наличию ключей, а не по
 * записи в документации. Аудит печатает этот список в «Ограничениях», чтобы
 * отсутствие источника было видно клиенту, а не превращалось в тихий пробел.
 */
export type ConnectorState =
  | 'ready'
  | 'needs_key'
  | 'needs_client_oauth'
  | 'site_side'      // живёт в Vercel (api/*), воркеру его env не видны в принципе
  | 'not_in_worker';

export type Connector = {
  id: string;
  title: string;
  domains: string[];          // какие из 13 аудитов усиливает
  state: ConnectorState;
  need?: string;              // что именно нужно, чтобы включить
  note?: string;
  /** Внутренний источник (наши собственные метрики). В клиентский документ не
   *  попадает: строка «у нас не было GA4 нашего сайта» в отчёте КЛИЕНТУ — мусор. */
  internal?: boolean;
};

const has = (...keys: string[]) => keys.every((k) => Boolean(process.env[k]));

export function connectors(): Connector[] {
  return [
    {
      id: 'crux', title: 'CrUX — полевые Core Web Vitals', domains: ['website', 'technology'],
      state: has('CRUX_API_KEY') ? 'ready' : 'needs_key',
      need: 'CRUX_API_KEY (ключ Google Cloud, Chrome UX Report API)',
      note: 'работает по любому origin — конкуренты меряются без доступов',
    },
    {
      id: 'pagespeed', title: 'PageSpeed Insights — лабораторный замер', domains: ['website'],
      state: has('PAGESPEED_API_KEY') ? 'ready' : 'needs_key',
      need: 'PAGESPEED_API_KEY', note: 'лаборатория; при расхождении верить CrUX',
    },
    {
      id: 'exa', title: 'Веб-поиск Exa (через mcporter)', domains: ['market', 'customer', 'expansion'],
      state: 'ready', need: 'бинарь mcporter в образе',
      note: 'внешний инфофон, соцсети, отзывы; статус проверяется на прогоне',
    },
    {
      id: 'gsc', title: 'Google Search Console + Bing WMT', domains: ['seo'],
      state: 'site_side',
      need: 'сервис-аккаунт с доступом к ресурсу клиента (AC-03)',
    },
    {
      id: 'ga4', title: 'Google Analytics 4 (клиент)', domains: ['analytics', 'acquisition', 'customer'],
      // Два независимых пути, и путать их нельзя: клиентский коннектор в
      // api/ga4.js работает через OAuth (клиент сам даёт согласие в браузере),
      // а сервис-аккаунт GA4_SA_* обслуживает ТОЛЬКО наш собственный сайт.
      state: 'site_side',
      need: 'OAuth-клиент Web в Google Cloud + согласие клиента в кабинете',
      note: 'redirect URI: https://weexp.agency/api/ga4 (без query-параметров)',
    },
    {
      id: 'ga4_own', title: 'Google Analytics 4 (наш сайт)', domains: ['analytics'],
      state: has('GA4_SA_EMAIL', 'GA4_SA_KEY') ? 'ready' : 'needs_key',
      need: 'сервис-аккаунт Viewer в НАШЕМ ресурсе GA4 (GA4_SA_EMAIL + GA4_SA_KEY)',
      note: 'питает дашборд /admin, к аудиту клиента отношения не имеет',
      internal: true,
    },
    {
      id: 'googleads', title: 'Google Ads', domains: ['acquisition'],
      state: 'site_side',
      need: 'developer token + OAuth клиента (AC-07)',
    },
    {
      id: 'posthog', title: 'PostHog — продуктовая аналитика', domains: ['analytics', 'customer'],
      state: has('POSTHOG_API_KEY') ? 'ready' : 'needs_key',
      need: 'POSTHOG_API_KEY (личный токен проекта)',
    },
    {
      id: 'geo', title: 'Видимость в AI-поиске (GEO/AEO)', domains: ['seo'],
      state: 'needs_key', need: 'JINA_API_KEY либо внешний трекер (LLM Pulse / Peec AI)',
      note: 'robots.txt приглашает GPTBot и PerplexityBot, но цитируемость не измеряется',
    },
    {
      id: 'screamingfrog', title: 'Screaming Frog SEO Spider', domains: ['seo', 'technology'],
      state: 'not_in_worker',
      need: 'десктопное приложение + лицензия',
      note: 'в контейнере не запускается; краул закрывает собственный обходчик',
    },
    {
      id: 'citedy', title: 'Citedy / Labelhead (внешние агенты)', domains: ['seo', 'market'],
      state: 'not_in_worker', need: 'вход в аккаунт на их хостинге',
      note: 'HTTP-сервисы с авторизацией в браузере — из воркера недостижимы',
    },
  ];
}

/** Свод для /health и для раздела «Ограничения» в отчёте. */
export function connectorSummary(): { ready: string[]; siteSide: string[]; blocked: { id: string; need: string }[] } {
  const all = connectors();
  return {
    ready: all.filter((c) => c.state === 'ready').map((c) => c.id),
    siteSide: all.filter((c) => c.state === 'site_side').map((c) => c.id),
    blocked: all.filter((c) => c.state !== 'ready' && c.state !== 'site_side').map((c) => ({ id: c.id, need: c.need || c.state })),
  };
}

/** Текст для отчёта: чего у аудита НЕ было и почему. Пробел должен быть виден. */
export function limitationsText(domains?: string[]): string {
  const rel = connectors().filter((c) => !domains || c.domains.some((d) => domains.includes(d)));
  // site_side НЕ считаем пробелом: эти источники подключаются в /admin, и их
  // статус воркеру не виден. Печатать клиенту «GA4 не было», когда он был, —
  // это враньё в документе, за который заплатили.
  const blocked = rel.filter((c) => c.state !== 'ready' && c.state !== 'site_side' && !c.internal);
  if (!blocked.length) return 'Все профильные источники данных были доступны.';
  const L = ['Источники, которых у этого аудита НЕ было:'];
  for (const c of blocked) L.push(`• ${c.title} — ${c.need || c.state}${c.note ? ` (${c.note})` : ''}`);
  L.push('Выводы, зависящие от этих источников, помечены как гипотезы.');
  return L.join('\n');
}

/**
 * Внешние источники (L3), которые реально готовы по ключам. Именно они дают
 * данные БЕЗ доступов клиента — и потому доступны всегда, даже когда клиент
 * не открыл ничего.
 */
export function readyExternal(): { id: string; title: string }[] {
  return connectors()
    .filter((c) => c.state === 'ready' && !c.internal)
    .map((c) => ({ id: c.id, title: c.title }));
}
