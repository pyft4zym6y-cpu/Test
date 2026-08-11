/**
 * Внешний контур аудита (за пределами сайта): соцсети, инфофон бренда в
 * интернете, отзывы (на сайте + внешние площадки). Детерминированный слой —
 * из обхода (ссылки на профили, блоки отзывов); внешний слой собирает Claude
 * с инструментом web_search (тот же контур, что агентный режим, с echo
 * container id). Без ключа/поиска отчёты честно выходят в режиме «внешний
 * слой заблокирован», без имитации данных.
 */
import { createMessage, hasKey, extractJson, apiErrorHint } from './anthropic.js';
import type { AuditDataset } from './report.js';

/* ── Общий web-research вызов: web_search + строгий JSON в финале ── */
async function webResearch<T>(system: string, user: string, log?: (m: string) => void): Promise<T | null> {
  if (!hasKey()) return null;
  try {
    let containerId: string | undefined;
    const messages: any[] = [{ role: 'user', content: user }];
    for (let turn = 0; turn < 6; turn++) {
      const resp: any = await createMessage({
        max_tokens: 4000, system,
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }],
        messages, ...(containerId ? { container: containerId } : {}),
      });
      containerId = resp?.container?.id ?? containerId;
      messages.push({ role: 'assistant', content: resp.content });
      if (resp.stop_reason !== 'pause_turn') {
        const text = (resp.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
        return extractJson<T>(text);
      }
    }
    return null;
  } catch (e) { log?.(`⚠️ web-research не отработал (${String(e).slice(0, 90)})${apiErrorHint(e)}`); return null; }
}

const hostOf = (ds: AuditDataset) => { try { return new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { return ds.client.finalUrl; } };
type Rec = { pr: 'P0' | 'P1' | 'P2'; action: string; effect: string };

/* ════════ 1 · Аудит соцсетей (базово) ════════ */
export type SocialProfile = { platform: string; url: string; found: 'на сайте' | 'поиском' | 'не найдено'; activity: string; note: string };
export type SocialReport = {
  client: string; takenAt: string; searched: boolean;
  profiles: SocialProfile[]; linked: number;
  strengths: string[]; weaknesses: string[]; recommendations: Rec[];
  verdict: string; conclusion: string[];
};

const PLATFORMS: { name: string; re: RegExp }[] = [
  { name: 'Instagram', re: /instagram\.com/i }, { name: 'Facebook', re: /facebook\.com/i },
  { name: 'TikTok', re: /tiktok\.com/i }, { name: 'YouTube', re: /youtube\.com/i },
  { name: 'Telegram', re: /t\.me\//i }, { name: 'Pinterest', re: /pinterest\./i },
];

export async function buildSocialAudit(ds: AuditDataset, log?: (m: string) => void, external?: SocialReport['profiles'] | null): Promise<SocialReport> {
  const client = hostOf(ds);
  const onSite = Array.from(new Set(ds.client.pages.flatMap((p) => p.ux?.socialLinks ?? [])));
  const profiles: SocialProfile[] = PLATFORMS.map((pl) => {
    const url = onSite.find((h) => pl.re.test(h));
    return { platform: pl.name, url: url ?? '—', found: url ? 'на сайте' : 'не найдено', activity: 'внешняя проверка', note: url ? 'профиль привязан к витрине' : 'ссылки на витрине нет' };
  });

  // Внешний слой: активность профилей и потерянные (непривязанные) аккаунты.
  let searched = false;
  const ext = external !== undefined ? external : await webResearch<{ profiles?: { platform: string; url?: string; activity?: string; note?: string }[] }>(
    'Ты — аудитор соцсетей e-commerce бренда. Найди официальные соцпрофили бренда и оцени базово: живой ли профиль (частота постов за 90 дней), порядок подписчиков, ведёт ли на сайт. Только факты из поиска; чего не нашёл — не выдумывай. Верни СТРОГО JSON {"profiles":[{"platform":"Instagram","url":"","activity":"~N подписчиков, посты раз в N дней","note":"вывод одной фразой"}]}',
    `Бренд: ${client}. Известные профили с сайта: ${onSite.join(', ') || 'нет'}. Найди и оцени профили (Instagram, Facebook, TikTok, YouTube, Telegram).`, log,
  ).then((r) => r?.profiles ?? null);
  if (ext) {
    searched = true;
    for (const e of ext) {
      const row = profiles.find((p) => p.platform.toLowerCase() === e.platform?.toLowerCase());
      if (row) { row.activity = e.activity || 'н/д'; row.note = e.note || row.note; if (row.found === 'не найдено' && e.url) { row.url = e.url; row.found = 'поиском'; } }
    }
  } else {
    for (const p of profiles) p.activity = 'внешний слой заблокирован (нужен ключ/поиск)';
  }

  const linked = profiles.filter((p) => p.found === 'на сайте').length;
  const lost = profiles.filter((p) => p.found === 'поиском');
  const strengths = profiles.filter((p) => p.found !== 'не найдено').map((p) => `${p.platform}: ${p.url}${searched && p.activity && !/н\/д|заблокир/.test(p.activity) ? ` — ${p.activity}` : ''}`);
  const weaknesses = [
    ...lost.map((p) => `${p.platform}: профиль существует, но НЕ привязан к сайту — трафик и доверие теряются (${p.url})`),
    ...profiles.filter((p) => p.found === 'не найдено').map((p) => `${p.platform}: присутствие не обнаружено ни на сайте, ни поиском`),
  ];
  const recommendations: Rec[] = [
    ...(lost.length ? [{ pr: 'P0' as const, action: `Привязать найденные профили к витрине: ${lost.map((p) => p.platform).join(', ')}`, effect: 'Существующая аудитория начинает работать на сайт' }] : []),
    ...(linked === 0 ? [{ pr: 'P1' as const, action: 'Завести и привязать 1–2 профильные площадки (для товарного бренда — Instagram + TikTok)', effect: 'Прогрев, ретаргетинг-аудитории, соц. доказательство' }] : []),
    { pr: 'P2', action: 'Единые ссылки на соцсети в футере/шапке всех шаблонов + UTM-разметка', effect: 'Измеримость соц-трафика в аналитике' },
  ];
  const verdict = linked >= 3 ? `Соцконтур привязан (${linked} платформ) — базовый уровень есть, вопрос в активности.`
    : linked >= 1 ? `Соцсети привязаны частично (${linked} из ${profiles.length} платформ)${lost.length ? `; найдены непривязанные профили: ${lost.length}` : ''}.`
    : 'Соцсети к витрине не привязаны — соц-слой доверия и трафика не работает.';
  const conclusion = [
    `Базовый аудит соцсетей: ${profiles.length} платформ проверены по двум слоям — привязка на витрине (${linked}) и внешний поиск (${searched ? 'выполнен' : 'заблокирован — нужен ключ API'}). ${lost.length ? `Главная находка: ${lost.length} живых профилей не привязаны к сайту — аудитория есть, но на витрину не работает.` : ''}`,
    searched ? 'Оценка активности — базовая (наличие, порядок подписчиков, частота постов): глубина (вовлечённость, контент-стратегия, реклама) — отдельный SMM-аудит на A1.' : 'Внешний слой (активность, подписчики) добирается при доступном ключе API — таблица дополнится без изменения структуры.',
    'Для e-commerce соцсети — это не «ведение страничек», а три функции: доверие нового покупателя (живой профиль = живой магазин), ретаргетинг-аудитории и канал повторных касаний. Отсутствие любой из них — измеримая потеря.',
  ];
  return { client, takenAt: ds.takenAt, searched, profiles, linked, strengths, weaknesses, recommendations, verdict, conclusion };
}

/* ════════ 2 · Внешний инфофон бренда ════════ */
export type Mention = { source: string; kind: string; tone: 'позитив' | 'нейтрально' | 'негатив' | 'н/д'; what: string; url?: string };
export type MentionsReport = {
  client: string; takenAt: string; searched: boolean;
  mentions: Mention[];
  strengths: string[]; weaknesses: string[]; recommendations: Rec[];
  verdict: string; conclusion: string[];
};

export async function buildMentionsAudit(ds: AuditDataset, log?: (m: string) => void, external?: Mention[] | null): Promise<MentionsReport> {
  const client = hostOf(ds);
  const ext = external !== undefined ? external : await webResearch<{ mentions?: Mention[] }>(
    'Ты — аналитик репутации e-commerce бренда. Найди, что и где пишут о бренде в интернете: СМИ, каталоги, форумы, маркетплейсы, соцобсуждения, отраслевые площадки. По каждому источнику: тип площадки, тональность, суть 1 фразой. Только найденные факты, ничего не выдумывай; если упоминаний мало — так и скажи в what. Верни СТРОГО JSON {"mentions":[{"source":"название площадки","kind":"СМИ|каталог|форум|маркетплейс|соцсети|отзовик","tone":"позитив|нейтрально|негатив","what":"суть 1 фразой","url":"..."}]} (5-12 записей)',
    `Бренд/домен: ${client}. Найди упоминания бренда за пределами его сайта.`, log,
  ).then((r) => r?.mentions ?? null);
  const searched = Boolean(ext);
  const mentions: Mention[] = ext ?? [];
  const neg = mentions.filter((m) => m.tone === 'негатив');
  const pos = mentions.filter((m) => m.tone === 'позитив');
  const kinds = Array.from(new Set(mentions.map((m) => m.kind)));

  const strengths = pos.slice(0, 5).map((m) => `${m.source} (${m.kind}): ${m.what}`);
  const weaknesses = [
    ...neg.slice(0, 5).map((m) => `${m.source} (${m.kind}): ${m.what} — негатив без видимого ответа бренда`),
    ...(searched && mentions.length < 4 ? ['Инфофон тонкий: бренд почти не обсуждается за пределами своего сайта — узнаваемость держится на платном трафике'] : []),
    ...(!searched ? ['Внешний поиск заблокирован (нужен ключ API) — свод собирается на следующем прогоне'] : []),
  ];
  const recommendations: Rec[] = [
    ...(neg.length ? [{ pr: 'P0' as const, action: 'Ответить на негатив на внешних площадках от имени бренда', effect: 'Негатив с ответом работает на доверие; без ответа — против бренда' }] : []),
    ...(searched && mentions.length < 4 ? [{ pr: 'P1' as const, action: 'Программа внешнего присутствия: каталоги, отраслевые подборки, PR-размещения', effect: 'Инфофон + E-E-A-T сигналы для поиска и AI-выдачи' }] : []),
    { pr: 'P2', action: 'Регулярный мониторинг упоминаний (повтор этого свода раз в квартал)', effect: 'Негатив перехватывается до того, как его увидит покупатель' },
  ];
  const verdict = !searched ? 'Инфофон бренда: внешний слой заблокирован — детерминированных данных вне сайта нет.'
    : !mentions.length ? 'Упоминаний бренда за пределами сайта не найдено — инфофон пуст.'
    : neg.length ? `Инфофон: ${mentions.length} упоминаний на ${kinds.length} типах площадок; есть негатив (${neg.length}) — требует ответа бренда.`
    : `Инфофон ${mentions.length > 6 ? 'живой' : 'умеренный'}: ${mentions.length} упоминаний (${kinds.join(', ')}), негатива не найдено.`;
  const conclusion = [
    searched
      ? `Свод внешней информации: ${mentions.length} упоминаний, тональность — ${pos.length} позитив / ${mentions.length - pos.length - neg.length} нейтрально / ${neg.length} негатив. ${neg.length ? 'Негатив важнее позитива: покупатель ищет именно его перед первой покупкой, и отсутствие ответа бренда читается как подтверждение.' : 'Отсутствие негатива — актив, который стоит закрепить мониторингом.'}`
      : 'Внешний поиск в этом прогоне недоступен (ключ API): раздел выходит с честной пометкой, детерминированная часть пакета не затронута.',
    'Инфофон — это и репутация, и SEO/AEO: сторонние упоминания входят в E-E-A-T сигналы, по которым поисковые и AI-системы решают, цитировать ли бренд. Пустой инфофон занижает видимость даже при хорошем сайте.',
    'Свод — базовый (поисковый срез на дату): полный мониторинг с историей и алертами — отдельный контур на A1.',
  ];
  return { client, takenAt: ds.takenAt, searched, mentions, strengths, weaknesses, recommendations, verdict, conclusion };
}

/* ════════ 3 · Аудит отзывов (на сайте + внешние) ════════ */
export type ReviewSource = { place: string; kind: 'на сайте' | 'внешний'; status: string; rating: string; count: string; note: string };
export type ReviewsReport = {
  client: string; takenAt: string; searched: boolean;
  sources: ReviewSource[]; onSitePresent: boolean;
  strengths: string[]; weaknesses: string[]; recommendations: Rec[];
  verdict: string; conclusion: string[];
};

export async function buildReviewsAudit(ds: AuditDataset, log?: (m: string) => void, external?: ReviewSource[] | null): Promise<ReviewsReport> {
  const client = hostOf(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const pdps = pages.filter((p) => p.kind === 'pdp');
  const onPdp = pdps.filter((p) => p.ux?.reviews).length;
  const onSitePresent = pages.some((p) => p.ux?.reviews);
  const schemaRating = pages.some((p) => p.checks.some((c) => c.id === 'schema-product' && c.pass));
  const reviewsPage = ds.client.pageTypes?.find((t) => t.id === 'reviews-page');

  const sources: ReviewSource[] = [
    { place: 'Карточки товаров (PDP)', kind: 'на сайте', status: pdps.length ? (onPdp ? `отзывы на ${onPdp}/${pdps.length} разобранных` : 'отзывов нет ни на одной разобранной') : 'PDP не разобраны', rating: schemaRating ? 'в разметке' : 'разметки нет', count: '—', note: onPdp ? 'механика работает — проверить наполнение' : 'точка решения без социального доказательства' },
    { place: 'Страница отзывов о магазине', kind: 'на сайте', status: reviewsPage && reviewsPage.status !== 'не найдена' ? reviewsPage.status : 'не найдена', rating: '—', count: '—', note: reviewsPage && reviewsPage.status !== 'не найдена' ? 'репутационная страница есть' : 'репутация магазина не собрана в одном месте' },
  ];
  const ext = external !== undefined ? external : await webResearch<{ sources?: { place: string; status?: string; rating?: string; count?: string; note?: string }[] }>(
    'Ты — аудитор репутации e-commerce. Найди отзывы о магазине/бренде на внешних площадках: Google Maps, маркетплейсы (Rozetka/Prom и локальные), отзовики, Trustpilot. По каждой: рейтинг, порядок числа отзывов, суть претензий/похвал 1 фразой. Только факты поиска. Верни СТРОГО JSON {"sources":[{"place":"площадка","status":"найдено|не найдено","rating":"4.2/5","count":"~120","note":"суть 1 фразой"}]} (3-8 записей)',
    `Магазин/бренд: ${client}. Найди отзывы о нём на внешних площадках.`, log,
  ).then((r) => r?.sources ?? null);
  const searched = Boolean(ext);
  if (ext) for (const e of ext) sources.push({ place: e.place, kind: 'внешний', status: e.status ?? 'найдено', rating: e.rating ?? 'н/д', count: e.count ?? 'н/д', note: e.note ?? '' });
  else sources.push({ place: 'Внешние площадки (карты, маркетплейсы, отзовики)', kind: 'внешний', status: 'внешний слой заблокирован', rating: '—', count: '—', note: 'нужен ключ API — добирается следующим прогоном' });

  const extFound = sources.filter((s) => s.kind === 'внешний' && s.status !== 'не найдено' && !/заблокир/.test(s.status) && s.rating !== '—');
  const badExt = sources.filter((s) => s.kind === 'внешний' && /^[12]\.|^[123],/.test(s.rating));
  const strengths = [
    ...(onPdp ? [`Отзывы на карточках присутствуют (${onPdp}/${pdps.length} разобранных PDP)`] : []),
    ...extFound.slice(0, 4).map((s) => `${s.place}: ${s.rating}${s.count !== 'н/д' ? ` · ${s.count} отзывов` : ''} — ${s.note}`),
  ];
  const weaknesses = [
    ...(pdps.length && !onPdp ? ['Точка решения (PDP) без отзывов — покупатель ищет чужой опыт на внешних площадках и может не вернуться'] : []),
    ...(!reviewsPage || reviewsPage.status === 'не найдена' ? ['Нет страницы отзывов о магазине — репутация не капитализируется на собственном домене'] : []),
    ...badExt.map((s) => `${s.place}: низкий рейтинг ${s.rating} — ${s.note}`),
    ...(!schemaRating ? ['Рейтинги не размечены (AggregateRating) — звёзды не попадают в выдачу'] : []),
  ];
  const recommendations: Rec[] = [
    ...(pdps.length && !onPdp ? [{ pr: 'P0' as const, action: 'Запустить сбор отзывов на карточках: пост-покупочный триггер + фото-бонус', effect: '+~60% к конверсии PDP (ориентир); собственный контур соц. доказательства' }] : []),
    ...(badExt.length ? [{ pr: 'P0' as const, action: `Отработать низкие рейтинги: ${badExt.map((s) => s.place).join(', ')} — ответы + системное устранение причин`, effect: 'Внешний рейтинг — первое, что видит новый покупатель' }] : []),
    { pr: 'P1', action: 'Страница «Отзывы о магазине» + AggregateRating-разметка', effect: 'Репутация работает на домене и в выдаче (звёзды)' },
    { pr: 'P2', action: 'Синхронизация: лучшие внешние отзывы дублируются на сайт (с согласия)', effect: 'Доверие без зависимости от чужих площадок' },
  ];
  const verdict = pdps.length && !onPdp && !extFound.length
    ? 'Отзывов нет ни на сайте, ни (по доступным данным) на внешних площадках — слой доверия отсутствует.'
    : onPdp && extFound.length ? 'Отзывы работают на сайте и снаружи — вопрос в управлении, а не в наличии.'
    : onPdp ? 'Отзывы на сайте есть; внешний слой — по результатам поиска/следующего прогона.'
    : `На сайте отзывов нет${extFound.length ? `, снаружи найдены (${extFound.length} площадок) — репутация живёт не на вашем домене` : ''}.`;
  const conclusion = [
    `Аудит отзывов в два слоя: собственный сайт (${onSitePresent ? 'механика отзывов присутствует' : 'механика отзывов не обнаружена'}) и внешние площадки (${searched ? `поиск выполнен, источников: ${sources.filter((s) => s.kind === 'внешний').length}` : 'поиск заблокирован — нужен ключ API'}). Правило: покупатель ВСЕГДА находит отзывы — вопрос лишь в том, контролирует ли бренд, какие и где.`,
    pdps.length && !onPdp
      ? 'Ключевой разрыв — точка решения: карточка без отзывов отправляет покупателя искать чужой опыт в интернете, где бренд не управляет ни тональностью, ни возвратом покупателя на сайт.'
      : 'Собственный контур отзывов есть — следующий уровень: полнота (фото, ответы бренда), разметка и синхронизация с внешними площадками.',
    'Свод внешних рейтингов — базовый срез на дату; управление репутацией (SLA ответов, работа с причинами негатива) — процесс, который ставится на A1.',
  ];
  return { client, takenAt: ds.takenAt, searched, sources, onSitePresent, strengths, weaknesses, recommendations, verdict, conclusion };
}
