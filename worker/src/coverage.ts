/**
 * Охват видов аудита + Confidence Score. Две инновации метода Commerce OS:
 *  1) «Аудит сайта — это ВСЕ виды аудита, а не выбранные» (13 видов, audit_framework):
 *     карта показывает, какой вид покрыт на текущем тире и чем, а какой требует
 *     доступов/внешних сервисов — чтобы пропущенный вид не всплыл как претензия.
 *  2) «Три числа, которые нельзя путать»: Confidence Score — достоверность НАШЕГО
 *     отчёта (не Health Score бизнеса) — считается от тира и полноты данных;
 *     baseConfidence тира — потолок.
 * Детерминированно, без модели. Работает на T1/L0.
 */
import type { AuditDataset } from './report.js';
import { TIERS } from './tiers.js';

export type LensStatus = 'covered' | 'partial' | 'external' | 'needs-access';
export type Lens = { name: string; status: LensStatus; note: string };

export type Confidence = { score: number; base: number; band: string; raisedBy: string[] };
export type CoverageReport = { lenses: Lens[]; confidence: Confidence };

const analysablePages = (ds: AuditDataset) => ds.client.pages.filter((p) => !p.error && p.checks.length).length;

/** Карта 13 видов аудита + Confidence Score от полноты данных. */
export function buildCoverage(ds: AuditDataset, opts: { hasEngine?: boolean; hasMoney?: boolean } = {}): CoverageReport {
  const comps = ds.competitors.length;
  const pages = analysablePages(ds);
  const analytics = ds.client.tech.analytics.length > 0;

  const lenses: Lens[] = [
    { name: 'Технический', status: 'covered', note: `Платформа ${ds.client.tech.platform ?? 'н/д'}, HTTPS, robots/sitemap, ошибки вёрстки — с обхода.` },
    { name: 'SEO', status: 'covered', note: 'Title/description/canonical/H1, Schema.org, hreflang, OG — по отрендеренному DOM.' },
    { name: 'UX / CRO', status: 'covered', note: 'AQC-критерии + сверка композиции с эталонным прототипом (первый блок аудита).' },
    { name: 'Контентный', status: 'partial', note: 'Наличие контента и описаний видно; полнота/тональность/уникальность — на живом сайте глубже, часть — с доступом к CMS.' },
    { name: 'Коммерческий', status: 'partial', note: 'Оффер, видимость цены, ассортимент — с витрины; маржа и юнит-экономика — с доступов (L1+).' },
    { name: 'Конкурентный', status: comps ? 'covered' : 'needs-access', note: comps ? `Обойдено конкурентов: ${comps}, сверка витрин.` : 'Дайте 2–4 сайта конкурентов — включится бенчмарк витрин.' },
    { name: 'Маркетинговый', status: 'external', note: 'Каналы и реклама клиента/конкурентов — Meta Ad Library, Google Ads Transparency (пока вручную); кабинеты — на T4.' },
    { name: 'Аналитический', status: analytics ? 'partial' : 'needs-access', note: analytics ? `Обнаружена установка: ${ds.client.tech.analytics.join(', ')}; сами данные — с доступом к GA4.` : 'Счётчиков не видно; нужен доступ к аналитике (GA4/GTM).' },
    { name: 'Ссылочный (backlinks)', status: 'external', note: 'Профиль ссылок — внешние сервисы (Ahrefs/Semrush/Serpstat), порядок величины.' },
    { name: 'Безопасности', status: 'partial', note: 'HTTPS и consent-механика — с обхода; полный скан заголовков/сертификата — SSL Labs и сканеры.' },
    { name: 'Юридический', status: 'partial', note: 'Cookie/consent, контакты, наличие правовых страниц — по обходу; договорная часть — вне автомата.' },
    { name: 'Производительности', status: 'external', note: 'Core Web Vitals — PageSpeed Insights и поле CrUX; подключается отдельно.' },
    { name: 'Цена в канале / реселлеры', status: 'needs-access', note: 'Цена у реселлеров и на маркетплейсах — прайс-агрегаторы + роль клиента в цепочке (производитель/реселлер).' },
  ];

  // Confidence Score: доля собранных факторов полноты, потолок — baseConfidence тира.
  const base = TIERS[ds.tier].baseConfidence;
  const factors: { ok: boolean; raise: string }[] = [
    { ok: ds.client.reachable && pages >= 1, raise: 'сайт должен успешно обойтись (сейчас недоступен/бот-защита)' },
    { ok: pages >= 3, raise: 'разобрать больше типов страниц (главная, каталог, карточка, чекаут)' },
    { ok: comps > 0, raise: 'добавить сайты конкурентов (конкурентный слой)' },
    { ok: Boolean(opts.hasEngine), raise: 'заполнить опросник (Health Score, разрывы, решения)' },
    { ok: Boolean(opts.hasMoney), raise: 'подать baseline/выгрузки (деньги цепной атрибуцией)' },
  ];
  const ratio = factors.filter((f) => f.ok).length / factors.length;
  const score = Math.min(base, Math.round(base * (0.6 + 0.4 * ratio)));
  const band = score >= 80 ? 'высокая' : score >= 60 ? 'хорошая' : score >= 40 ? 'средняя' : 'предварительная';
  const raisedBy = factors.filter((f) => !f.ok).map((f) => f.raise);

  return { lenses, confidence: { score, base, band, raisedBy } };
}

const STATUS_LABEL: Record<LensStatus, string> = {
  covered: '✓ покрыт (L0)',
  partial: '≈ частично (L0)',
  external: '⭙ внешний сервис',
  'needs-access': '🔒 нужны доступы/входы',
};

export function renderCoverageMd(ds: AuditDataset, c: CoverageReport): string {
  const out: string[] = [];
  out.push(`# Охват аудита и уверенность отчёта — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · тир T${ds.tier} · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  out.push(`**Confidence Score отчёта: ${c.confidence.score}/${c.confidence.base} — уверенность ${c.confidence.band}.** Это достоверность НАШЕГО разбора на текущих данных (не состояние бизнеса — то Health Score). Потолок ${c.confidence.base} задан тиром T${ds.tier}.`);
  if (c.confidence.raisedBy.length) {
    out.push('');
    out.push('Что поднимет уверенность:');
    for (const r of c.confidence.raisedBy) out.push(`- ${r}`);
  }
  out.push('');
  out.push('## 13 видов аудита — что покрыто');
  out.push('«Аудит сайта — это все виды аудита, а не выбранные» (метод). Ниже — что закрыто внешним обходом (L0), что требует внешних сервисов или доступов.');
  out.push('');
  out.push('| Вид аудита | Статус | Чем/что нужно |');
  out.push('| --- | --- | --- |');
  for (const l of c.lenses) out.push(`| ${l.name} | ${STATUS_LABEL[l.status]} | ${l.note} |`);
  out.push('');
  out.push('---');
  out.push('_Пропущенный вид аудита — не пробел, а отдельная строка: он покрывается по мере доступов и внешних сервисов, структура отчёта при этом не меняется._');
  return out.join('\n');
}
