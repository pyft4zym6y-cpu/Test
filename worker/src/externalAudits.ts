/**
 * Внешний контур аудита (за пределами сайта): соцсети, инфофон бренда в
 * интернете, отзывы (на сайте + внешние площадки). Детерминированный слой —
 * из обхода (ссылки на профили, блоки отзывов); внешний слой собирает Claude
 * с инструментом web_search (тот же контур, что агентный режим, с echo
 * container id). Без ключа/поиска отчёты честно выходят в режиме «внешний
 * слой заблокирован», без имитации данных.
 */
import { createMessage, hasKey, extractJson, apiErrorHint } from './anthropic.js';
import { reachGrounding } from './agentReach.js';
import type { AuditDataset } from './report.js';

/* ── Общий web-research вызов: web_search + строгий JSON в финале ── */
export async function webResearch<T>(system: string, user: string, log?: (m: string) => void): Promise<T | null> {
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
export type SocialProfile = { platform: string; url: string; found: 'на сайті' | 'пошуком' | 'не знайдено'; activity: string; note: string };
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
    return { platform: pl.name, url: url ?? '—', found: url ? 'на сайті' : 'не знайдено', activity: 'зовнішня перевірка', note: url ? 'профіль прив’язаний до вітрини' : 'посилання на вітрині немає' };
  });

  // Внешний слой: активность профилей и потерянные (непривязанные) аккаунты.
  let searched = false;
  const grounding = external !== undefined ? '' : await reachGrounding(client, 'social', log);
  const ext = external !== undefined ? external : await webResearch<{ profiles?: { platform: string; url?: string; activity?: string; note?: string }[] }>(
    'Ты — аудитор соцсетей e-commerce бренда. Найди официальные соцпрофили бренда и оцени базово: живой ли профиль (частота постов за 90 дней), порядок подписчиков, ведёт ли на сайт. Только факты из поиска; чего не нашёл — не выдумывай. Все текстовые значения (activity, note) пиши на украинском языке. Верни СТРОГО JSON {"profiles":[{"platform":"Instagram","url":"","activity":"~N підписників, пости раз на N днів","note":"висновок однією фразою"}]}',
    `Бренд: ${client}. Известные профили с сайта: ${onSite.join(', ') || 'нет'}. Найди и оцени профили (Instagram, Facebook, TikTok, YouTube, Telegram).${grounding}`, log,
  ).then((r) => r?.profiles ?? null);
  if (ext) {
    searched = true;
    for (const e of ext) {
      const row = profiles.find((p) => p.platform.toLowerCase() === e.platform?.toLowerCase());
      if (row) { row.activity = e.activity || 'н/д'; row.note = e.note || row.note; if (row.found === 'не знайдено' && e.url) { row.url = e.url; row.found = 'пошуком'; } }
    }
  } else {
    for (const p of profiles) p.activity = 'зовнішній шар заблоковано (потрібен ключ/пошук)';
  }

  const linked = profiles.filter((p) => p.found === 'на сайті').length;
  const lost = profiles.filter((p) => p.found === 'пошуком');
  const strengths = profiles.filter((p) => p.found !== 'не знайдено').map((p) => `${p.platform}: ${p.url}${searched && p.activity && !/н\/д|заблоков/.test(p.activity) ? ` — ${p.activity}` : ''}`);
  const weaknesses = [
    ...lost.map((p) => `${p.platform}: профіль існує, але НЕ прив’язаний до сайту — трафік і довіра втрачаються (${p.url})`),
    ...profiles.filter((p) => p.found === 'не знайдено').map((p) => `${p.platform}: присутність не виявлено ні на сайті, ні пошуком`),
  ];
  const recommendations: Rec[] = [
    ...(lost.length ? [{ pr: 'P0' as const, action: `Прив’язати знайдені профілі до вітрини: ${lost.map((p) => p.platform).join(', ')}`, effect: 'Наявна аудиторія починає працювати на сайт' }] : []),
    ...(linked === 0 ? [{ pr: 'P1' as const, action: 'Завести й прив’язати 1–2 профільні майданчики (для товарного бренду — Instagram + TikTok)', effect: 'Прогрів, ретаргетинг-аудиторії, соц. доказ' }] : []),
    { pr: 'P1', action: 'Наповнення профілів: контент-план із pillars бренду (продуктовий контент, UGC, соц. доказ). Інструмент: скіли sm-content-matrix / sm-post-writer / sm-reels-scripting', effect: 'Живий профіль = живий магазин; регулярні дотики без зростання бюджету' },
    { pr: 'P2', action: 'Єдині посилання на соцмережі у футері/шапці всіх шаблонів + UTM-розмітка', effect: 'Вимірність соц-трафіку в аналітиці' },
  ];
  const verdict = linked >= 3 ? `Соцконтур прив’язаний (${linked} платформ) — базовий рівень є, питання в активності.`
    : linked >= 1 ? `Соцмережі прив’язані частково (${linked} з ${profiles.length} платформ)${lost.length ? `; знайдено неприв’язані профілі: ${lost.length}` : ''}.`
    : 'Соцмережі до вітрини не прив’язані — соц-шар довіри й трафіку не працює.';
  const conclusion = [
    `Базовий аудит соцмереж: ${profiles.length} платформ перевірено за двома шарами — прив’язка на вітрині (${linked}) і зовнішній пошук (${searched ? 'виконано' : 'заблоковано — потрібен ключ API'}). ${lost.length ? `Головна знахідка: ${lost.length} живих профілів не прив’язані до сайту — аудиторія є, але на вітрину не працює.` : ''}`,
    searched ? 'Оцінка активності — базова (наявність, порядок підписників, частота постів): глибина (залученість, контент-стратегія, реклама) — окремий SMM-аудит на наступному етапі.' : 'Зовнішній шар (активність, підписники) добирається за доступного ключа API — таблиця доповниться без зміни структури.',
    'Для e-commerce соцмережі — це не «ведення сторінок», а три функції: довіра нового покупця (живий профіль = живий магазин), ретаргетинг-аудиторії й канал повторних дотиків. Відсутність будь-якої з них — вимірна втрата.',
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
  const grounding = external !== undefined ? '' : await reachGrounding(client, 'mentions', log);
  const ext = external !== undefined ? external : await webResearch<{ mentions?: Mention[] }>(
    'Ты — аналитик репутации e-commerce бренда. Найди, что и где пишут о бренде в интернете: СМИ, каталоги, форумы, маркетплейсы, соцобсуждения, отраслевые площадки. По каждому источнику: тип площадки, тональность, суть 1 фразой. Только найденные факты, ничего не выдумывай; если упоминаний мало — так и скажи в what. Все текстовые значения (kind, what) пиши на украинском языке. Верни СТРОГО JSON {"mentions":[{"source":"назва майданчика","kind":"ЗМІ|каталог|форум|маркетплейс|соцмережі|відгуки","tone":"позитив|нейтрально|негатив","what":"суть однією фразою українською","url":"..."}]} (5-12 записей)',
    `Бренд/домен: ${client}. Найди упоминания бренда за пределами его сайта.${grounding}`, log,
  ).then((r) => r?.mentions ?? null);
  const searched = Boolean(ext);
  const mentions: Mention[] = ext ?? [];
  const neg = mentions.filter((m) => m.tone === 'негатив');
  const pos = mentions.filter((m) => m.tone === 'позитив');
  const kinds = Array.from(new Set(mentions.map((m) => m.kind)));

  const strengths = pos.slice(0, 5).map((m) => `${m.source} (${m.kind}): ${m.what}`);
  const weaknesses = [
    ...neg.slice(0, 5).map((m) => `${m.source} (${m.kind}): ${m.what} — негатив без видимої відповіді бренду`),
    ...(searched && mentions.length < 4 ? ['Інфофон тонкий: бренд майже не обговорюється за межами свого сайту — впізнаваність тримається на платному трафіку'] : []),
    ...(!searched ? ['Зовнішній пошук заблоковано (потрібен ключ API) — зведення збирається на наступному прогоні'] : []),
  ];
  const recommendations: Rec[] = [
    ...(neg.length ? [{ pr: 'P0' as const, action: 'Відповісти на негатив на зовнішніх майданчиках від імені бренду', effect: 'Негатив із відповіддю працює на довіру; без відповіді — проти бренду' }] : []),
    ...(searched && mentions.length < 4 ? [{ pr: 'P1' as const, action: 'Програма зовнішньої присутності: каталоги, галузеві добірки, PR-розміщення', effect: 'Інфофон + E-E-A-T сигнали для пошуку та AI-видачі' }] : []),
    { pr: 'P2', action: `Моніторинг згадок із частотою за ризиком (${neg.length >= 2 ? 'щотижня — активний негатив' : neg.length === 1 || mentions.length >= 8 ? 'раз на 2 тижні — помітний обсяг' : mentions.length >= 3 ? 'раз на місяць' : 'раз на квартал — низький обсяг'}): що більший обсяг і негатив, то частіше`, effect: 'Негатив перехоплюється до того, як його побачить покупець; частота зростає з ризиком' },
  ];
  const verdict = !searched ? 'Інфофон бренду: зовнішній шар заблоковано — детермінованих даних поза сайтом немає.'
    : !mentions.length ? 'Згадок бренду за межами сайту не знайдено — інфофон порожній.'
    : neg.length ? `Інфофон: ${mentions.length} згадок на ${kinds.length} типах майданчиків; є негатив (${neg.length}) — потребує відповіді бренду.`
    : `Інфофон ${mentions.length > 6 ? 'живий' : 'помірний'}: ${mentions.length} згадок (${kinds.join(', ')}), негативу не знайдено.`;
  const conclusion = [
    searched
      ? `Зведення зовнішньої інформації: ${mentions.length} згадок, тональність — ${pos.length} позитив / ${mentions.length - pos.length - neg.length} нейтрально / ${neg.length} негатив. ${neg.length ? 'Негатив важливіший за позитив: покупець шукає саме його перед першою покупкою, і відсутність відповіді бренду читається як підтвердження.' : 'Відсутність негативу — актив, який варто закріпити моніторингом.'}`
      : 'Зовнішній пошук у цьому прогоні недоступний (ключ API): розділ виходить із чесною позначкою, детермінована частина пакета не зачеплена.',
    'Інфофон — це і репутація, і SEO/AEO: сторонні згадки входять у E-E-A-T сигнали, за якими пошукові та AI-системи вирішують, чи цитувати бренд. Порожній інфофон занижує видимість навіть за хорошого сайту.',
    'Зведення — базове (пошуковий зріз на дату): повний моніторинг з історією та алертами — окремий контур на наступному етапі.',
  ];
  return { client, takenAt: ds.takenAt, searched, mentions, strengths, weaknesses, recommendations, verdict, conclusion };
}

/* ════════ 3 · Аудит отзывов (на сайте + внешние) ════════ */
export type ReviewSource = { place: string; kind: 'на сайті' | 'зовнішній'; status: string; rating: string; count: string; note: string };
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
  // Распознанное число отзывов по разобранным карточкам (schema reviewCount или текст).
  const pdpReviewCount = pdps.reduce((s, p) => s + (p.ux?.reviewCount ?? 0), 0);

  const sources: ReviewSource[] = [
    { place: 'Картки товарів (PDP)', kind: 'на сайті', status: pdps.length ? (onPdp ? `відгуки на ${onPdp}/${pdps.length} розібраних` : 'відгуків немає на жодній розібраній') : 'PDP не розібрано', rating: schemaRating ? 'у розмітці' : 'розмітки немає', count: pdpReviewCount > 0 ? `~${pdpReviewCount} (вибірка ${pdps.length} карт.)` : (onPdp ? 'є, число не розпізнано' : '—'), note: onPdp ? 'механіка працює — перевірити наповнення' : 'точка рішення без соціального доказу' },
    { place: 'Сторінка відгуків про магазин', kind: 'на сайті', status: reviewsPage && reviewsPage.status !== 'не найдена' ? 'знайдена' : 'не знайдена', rating: '—', count: '—', note: reviewsPage && reviewsPage.status !== 'не найдена' ? 'репутаційна сторінка є' : 'репутація магазину не зібрана в одному місці' },
  ];
  const grounding = external !== undefined ? '' : await reachGrounding(client, 'reviews', log);
  const ext = external !== undefined ? external : await webResearch<{ sources?: { place: string; status?: string; rating?: string; count?: string; note?: string }[] }>(
    'Ты — аудитор репутации e-commerce. Найди отзывы о магазине/бренде на внешних площадках: Google Maps, маркетплейсы (Rozetka/Prom и локальные), отзовики, Trustpilot. По каждой: рейтинг, порядок числа отзывов, суть претензий/похвал 1 фразой. Только факты поиска. Все текстовые значения (status, note) пиши на украинском языке. Верни СТРОГО JSON {"sources":[{"place":"майданчик","status":"знайдено|не знайдено","rating":"4.2/5","count":"~120","note":"суть однією фразою українською"}]} (3-8 записей)',
    `Магазин/бренд: ${client}. Найди отзывы о нём на внешних площадках.${grounding}`, log,
  ).then((r) => r?.sources ?? null);
  const searched = Boolean(ext);
  if (ext) for (const e of ext) sources.push({ place: e.place, kind: 'зовнішній', status: e.status ?? 'знайдено', rating: e.rating ?? 'н/д', count: e.count ?? 'н/д', note: e.note ?? '' });
  else sources.push({ place: 'Зовнішні майданчики (карти, маркетплейси, відгукові сайти)', kind: 'зовнішній', status: 'зовнішній шар заблоковано', rating: '—', count: '—', note: 'потрібен ключ API — добирається наступним прогоном' });

  const extFound = sources.filter((s) => s.kind === 'зовнішній' && s.status !== 'не знайдено' && !/заблоков/.test(s.status) && s.rating !== '—');
  const badExt = sources.filter((s) => s.kind === 'зовнішній' && /^[12]\.|^[123],/.test(s.rating));
  const strengths = [
    ...(onPdp ? [`Відгуки на картках присутні (${onPdp}/${pdps.length} розібраних PDP)`] : []),
    ...extFound.slice(0, 4).map((s) => `${s.place}: ${s.rating}${s.count !== 'н/д' ? ` · ${s.count} відгуків` : ''} — ${s.note}`),
  ];
  const weaknesses = [
    ...(pdps.length && !onPdp ? ['Точка рішення (PDP) без відгуків — покупець шукає чужий досвід на зовнішніх майданчиках і може не повернутися'] : []),
    ...(!reviewsPage || reviewsPage.status === 'не найдена' ? ['Немає сторінки відгуків про магазин — репутація не капіталізується на власному домені'] : []),
    ...badExt.map((s) => `${s.place}: низький рейтинг ${s.rating} — ${s.note}`),
    ...(!schemaRating ? ['Рейтинги не розмічені (AggregateRating) — зірки не потрапляють у видачу'] : []),
  ];
  const recommendations: Rec[] = [
    ...(pdps.length && !onPdp ? [{ pr: 'P0' as const, action: 'Запустити збір відгуків на картках: постпокупковий тригер + фото-бонус', effect: '+~60% до конверсії PDP (орієнтир); власний контур соц. доказу' }] : []),
    ...(badExt.length ? [{ pr: 'P0' as const, action: `Опрацювати низькі рейтинги: ${badExt.map((s) => s.place).join(', ')} — відповіді + системне усунення причин`, effect: 'Зовнішній рейтинг — перше, що бачить новий покупець' }] : []),
    { pr: 'P1', action: 'Сторінка «Відгуки про магазин» + AggregateRating-розмітка', effect: 'Репутація працює на домені й у видачі (зірки)' },
    { pr: 'P2', action: 'Синхронізація: найкращі зовнішні відгуки дублюються на сайт (за згодою)', effect: 'Довіра без залежності від чужих майданчиків' },
  ];
  const verdict = pdps.length && !onPdp && !extFound.length
    ? 'Відгуків немає ні на сайті, ні (за доступними даними) на зовнішніх майданчиках — шар довіри відсутній.'
    : onPdp && extFound.length ? 'Відгуки працюють на сайті й ззовні — питання в управлінні, а не в наявності.'
    : onPdp ? 'Відгуки на сайті є; зовнішній шар — за результатами пошуку/наступного прогону.'
    : `На сайті відгуків немає${extFound.length ? `, ззовні знайдені (${extFound.length} майданчиків) — репутація живе не на вашому домені` : ''}.`;
  const conclusion = [
    `Аудит відгуків у два шари: власний сайт (${onSitePresent ? 'механіка відгуків присутня' : 'механіку відгуків не виявлено'}) і зовнішні майданчики (${searched ? `пошук виконано, джерел: ${sources.filter((s) => s.kind === 'зовнішній').length}` : 'пошук заблоковано — потрібен ключ API'}). Правило: покупець ЗАВЖДИ знаходить відгуки — питання лише в тому, чи контролює бренд, які й де.`,
    pdps.length && !onPdp
      ? 'Ключовий розрив — точка рішення: картка без відгуків відправляє покупця шукати чужий досвід в інтернеті, де бренд не керує ні тональністю, ні поверненням покупця на сайт.'
      : 'Власний контур відгуків є — наступний рівень: повнота (фото, відповіді бренду), розмітка й синхронізація із зовнішніми майданчиками.',
    'Зведення зовнішніх рейтингів — базовий зріз на дату; управління репутацією (SLA відповідей, робота з причинами негативу) — процес, який ставиться на наступному етапі.',
  ];
  return { client, takenAt: ds.takenAt, searched, sources, onSitePresent, strengths, weaknesses, recommendations, verdict, conclusion };
}
