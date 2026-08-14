/**
 * FEED-адаптер реестра находок: превращает рекомендации/находки всех отчётов в
 * единый FindingInput[] для registry.ts. Здесь же — вывод шага воронки и
 * семантического ключа дедупа, чтобы одна проблема (напр. чекаут) из UX, Journey
 * и Механик слилась в ОДНУ находку с общим ID.
 *
 * Тонкие RawRec (беклог) дают приоритет/текст; из journey дополнительно берутся
 * источник сбоя и воспроизводимость (чтобы таймаут теста получил низкую уверенность
 * и не выдавался за дефект сайта). Ничего не зависит от Claude — детерминированно.
 */
import type { FindingInput, FunnelStep, FindingSource } from './registry.js';
import type { RawRec } from './backlog.js';
import type { JourneyReport } from './journey.js';

const PR_IMPACT: Record<'P0' | 'P1' | 'P2', number> = { P0: 5, P1: 3, P2: 2 };

const SOURCE_DOMAIN: Record<string, string> = {
  'UX/UI': 'ux-os', 'Контент': 'content-os', 'Механики': 'retention-os',
  'Путь клиента': 'journey-os', 'Технический': 'tech-os', 'SEO': 'seo-os', 'CI': 'causal-os',
};

/** Вывод шага воронки из текста рекомендации (для денег и причинной карты). */
export function inferFunnel(text: string): FunnelStep | undefined {
  const t = text.toLowerCase();
  if (/чекаут|checkout|оформлен|оплат/.test(t)) return /оплат|плат[её]ж|liqpay|наложен|післяпл/.test(t) ? 'оплата' : 'чекаут';
  if (/корзин|cart|кошик/.test(t)) return 'корзина';
  if (/карточк|pdp|товар|картку/.test(t)) return 'карточка';
  if (/каталог|plp|категори|листинг|фильтр|сортиров|поиск|search/.test(t)) return 'каталог';
  if (/отзыв|відгук|reviews|довери|trust|соц.?доказ/.test(t)) return 'доверие';
  if (/email|sms|retention|повторн|лояльн|подписк|cashback|кешбек|бонус|winback|реактивац/.test(t)) return 'retention';
  if (/seo|органик|позици|индекс|\bmeta\b|title|sitemap|robots|schema|канонич|hreflang/.test(t)) return 'привлечение';
  if (/доставк|возврат|выкуп|повернен/.test(t)) return 'доставка';
  if (/аналитик|ga4|gtm|pixel|событи|attribution|utm/.test(t)) return 'аналитика';
  if (/оферт|правов|договор|юридич|політик|політика|persona|персональн|cookie/.test(t)) return 'право';
  return undefined;
}

/** Семантический ключ дедупа для сквозных тем: одна проблема из разных отчётов → один ID. */
export function inferKey(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/чекаут|checkout|оформлен/.test(t) && /(пол[яе]|гост|регистрац|реєстрац|форм|шаг)/.test(t)) return 'checkout-flow';
  if (/гост(евой|евой)?\s*(чекаут|заказ)|guest\s*checkout|без\s*(реєстрац|регистрац)/.test(t)) return 'guest-checkout';
  if (/поиск|search|пошук/.test(t) && /(нет|отсут|не найд|добав|свёрнут|свернут)/.test(t)) return 'site-search';
  if (/отзыв|відгук|reviews/.test(t) && /(pdp|карточк|товар)/.test(t)) return 'pdp-reviews';
  if (/aggregaterating|разметк.*отзыв|отзыв.*разметк|звёзд|звезд/.test(t)) return 'reviews-schema';
  if (/безкоштовн.*доставк|бесплатн.*доставк|free\s*ship/.test(t)) return 'free-ship-claim';
  if (/оферт|публичн.*договор|дистанц.*продаж/.test(t)) return 'offer-missing';
  return undefined;
}

const DATA_SOURCES = new Set(['SEO', 'Технический', 'CI']);

// Сквозная тема (key) сводится в КАНОНИЧЕСКИЙ домен, чтобы одна проблема из разных
// отчётов (напр. чекаут из UX и из Journey) слилась в одну находку с общим ID.
const KEY_DOMAIN: Record<string, string> = {
  'checkout-flow': 'checkout-os', 'guest-checkout': 'checkout-os',
  'site-search': 'ux-os', 'pdp-reviews': 'reputation-os', 'reviews-schema': 'reputation-os',
  'free-ship-claim': 'ux-os', 'offer-missing': 'legal-os',
};
const domainFor = (key: string | undefined, fallback: string) => (key && KEY_DOMAIN[key]) ? KEY_DOMAIN[key] : fallback;

/** RawRec (из беклога) → FindingInput. */
function fromRaw(r: RawRec): FindingInput {
  const text = `${r.action} ${r.effect}`;
  const key = inferKey(text);
  return {
    domain: domainFor(key, SOURCE_DOMAIN[r.source] ?? 'other-os'),
    key,
    title: r.action,
    gap: r.effect,
    funnelStep: inferFunnel(text),
    impact: PR_IMPACT[r.pr],
    source: DATA_SOURCES.has(r.source) ? 'сайт' : 'сайт',
    refs: [r.source],
  };
}

/** Шаг journey (тупик/спотыкание) → FindingInput с источником и воспроизводимостью. */
function fromJourney(j: JourneyReport): FindingInput[] {
  return j.steps
    .filter((s) => s.status === 'тупик' || s.status === 'спотыкание' || s.status === 'не найден')
    .map((s): FindingInput => {
      const text = `${s.stage} ${s.result}`;
      const impact = s.status === 'тупик' ? 4 : s.status === 'не найден' ? 3 : 3;
      const key = inferKey(text);
      return {
        domain: domainFor(key, 'journey-os'),
        key,
        title: `${s.stage}: ${s.expected}`,
        as_is: s.result,
        gap: s.result,
        funnelStep: inferFunnel(text),
        impact,
        source: (s.source as FindingSource) ?? 'сайт',
        reproducibility: s.reproducibility,
        refs: ['Путь клиента'],
      };
    });
}

/**
 * Собирает FindingInput[] из доступных отчётов. `raw` — тот же массив, что кормит
 * беклог (pipeline.ts); journey добавляет источник/воспроизводимость. Рекомендации
 * journey из `raw` (source='Путь клиента') отбрасываются — берём богатую версию из шагов.
 */
export function feedFromReports(raw: RawRec[], journey?: JourneyReport | null): FindingInput[] {
  const fromRawRecs = raw.filter((r) => r.source !== 'Путь клиента').map(fromRaw);
  const fromSteps = journey ? fromJourney(journey) : [];
  return [...fromRawRecs, ...fromSteps];
}
