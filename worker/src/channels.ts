/**
 * Аудит каналов A0: внешняя видимость каналов привлечения и удержания. На L0
 * видно только то, что «зашито» в сайт (трекинг, соцсети, retention-блоки);
 * фактическая эффективность платных каналов и маркетплейсов требует доступа к
 * кабинетам — честно помечается BLOCKED и выносится на A2 (A0 §15).
 */
import type { AuditDataset } from './report.js';
import type { Dim } from './pagereport.js';

export type ChStatus = 'ok' | 'check' | 'gap' | 'blocked';
export type ChannelRow = { channel: string; signal: string; status: ChStatus; next: string; dims: Dim[] };
export type ChannelsReport = {
  client: string; takenAt: string;
  rows: ChannelRow[];
  wired: number; blocked: number;
  verdict: string;
};

export function buildChannels(ds: AuditDataset): ChannelsReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const sig = ds.client.tech.signals;
  const has = (re: RegExp) => sig.some((s) => re.test(s));
  const anyBlock = (k: string) => ds.client.pages.some((p) => p.ux?.blocks?.[k]);
  const anyCheck = (id: string) => ds.client.pages.some((p) => p.checks.some((c) => c.id === id && c.pass));

  const st = (ok: boolean): ChStatus => (ok ? 'ok' : 'gap');
  const rows: ChannelRow[] = [
    { channel: 'Веб-аналитика (GA4/GTM)', signal: has(/GA4|GTM/) ? 'установлена' : 'не обнаружена', status: st(has(/GA4|GTM/)), next: has(/GA4|GTM/) ? 'После доступов: воронка, источники, e-commerce события' : 'Установить GA4/GTM — без неё каналы не измерить', dims: ['ANL'] },
    { channel: 'Ретаргетинг / Pixel', signal: has(/Pixel/) ? 'Meta Pixel установлен (наличие ≠ работающий канал)' : 'не обнаружен', status: has(/Pixel/) ? 'check' : 'check', next: 'Проверить по данным: качество событий покупки, собранные аудитории, реально ли идёт ретаргетинг', dims: ['ANL', 'MKT'] },
    { channel: 'Поведенческая аналитика', signal: has(/Hotjar|Clarity/) ? [has(/Hotjar/) && 'Hotjar', has(/Clarity/) && 'MS Clarity'].filter(Boolean).join(' + ') : 'не обнаружена', status: has(/Hotjar|Clarity/) ? 'ok' : 'check', next: 'Карты кликов, записи, воронки (после доступов)' + (has(/Hotjar/) && has(/Clarity/) ? '; два инструмента сразу — проверить, не дублируют ли задачи (кто пользуется, какие данные); при дублировании оставить один' : ''), dims: ['ANL', 'UX'] },
    { channel: 'Соцсети', signal: anyCheck('social') ? 'привязаны на сайте' : 'ссылок на сайте не найдено', status: st(anyCheck('social')), next: 'Какие профили привязаны, а какие найдены поиском, активные ссылки и метрики — в отчёте «Соцсети»', dims: ['MKT'] },
    // Email/SMS — самый дешёвый повторный контакт; снаружи виден только сбор
    // (форма подписки). Реальные рассылки и их выручка — по данным (следующий этап).
    { channel: 'Email / SMS (retention)', signal: anyBlock('newsletter') ? 'форма подписки на сайте есть' : 'форма подписки не обнаружена', status: anyBlock('newsletter') ? 'check' : 'gap', next: anyBlock('newsletter') ? 'Проверить по данным: идут ли рассылки, open/CTR, сегментация, доля выручки от email' : 'Добавить сбор email/подписку — дешёвый повторный контакт с покупателем', dims: ['MKT', 'ANL'] },
    { channel: 'Органический поиск', signal: `${ds.client.sitemapXml ? 'sitemap есть' : 'нет sitemap'}, robots ${ds.client.robotsTxt ? 'есть' : 'нет'}`, status: ds.client.sitemapXml ? 'ok' : 'check', next: 'Детали — в отчёте «SEO Architecture»; позиции — по данным Search Console', dims: ['SEO'] },
    { channel: 'Платная реклама (Google/Meta Ads)', signal: 'снаружи не измеряется', status: 'blocked', next: 'После доступа к кабинетам: структура, расходы, ROAS', dims: ['MKT', 'ANL'] },
    { channel: 'Маркетплейсы', signal: 'публичные карточки — вне обхода сайта', status: 'blocked', next: 'Проверить присутствие; эффективность — по данным маркетплейсов', dims: ['MKT', 'COMP'] },
  ];

  const wired = rows.filter((r) => r.status === 'ok').length;
  const blocked = rows.filter((r) => r.status === 'blocked').length;
  const verdict = !ds.client.pages.some((p) => !p.error) ? 'Каналы не оценены — сайт не разобран.'
    : !has(/GA4|GTM/) ? 'Каналы не измеримы: аналитика не установлена — это первый блокер для всей воронки.'
    : wired >= 4 ? 'Инфраструктура каналов присутствует (трекинг, соцсети, retention-сигналы) — но присутствие ещё не значит зрелость. Фактическая эффективность каждого канала (CAC, ROAS, доля выручки, качество событий) проверяется только по данным кабинетов и аналитики.'
    : 'Базовый трекинг есть, но часть каналов привлечения и удержания не задействована.';

  return { client, takenAt: ds.takenAt, rows, wired, blocked, verdict };
}
