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
    { channel: 'Веб-аналитика (GA4/GTM)', signal: has(/GA4|GTM/) ? 'установлена' : 'не обнаружена', status: st(has(/GA4|GTM/)), next: has(/GA4|GTM/) ? 'A2: воронка, источники, e-commerce события' : 'Установить GA4/GTM — без неё каналы не измерить', dims: ['ANL'] },
    { channel: 'Ретаргетинг / Pixel', signal: has(/Pixel/) ? 'Meta Pixel есть' : 'не обнаружен', status: has(/Pixel/) ? 'ok' : 'check', next: 'A2: качество событий покупки, аудитории', dims: ['ANL', 'MKT'] },
    { channel: 'Поведенческая аналитика', signal: has(/Hotjar|Clarity/) ? [has(/Hotjar/) && 'Hotjar', has(/Clarity/) && 'MS Clarity'].filter(Boolean).join(' + ') : 'не обнаружена', status: has(/Hotjar|Clarity/) ? 'ok' : 'check', next: 'A2: карты кликов, записи, воронки' + (has(/Hotjar/) && has(/Clarity/) ? '; два инструмента одновременно — лишний вес, оставить один' : ''), dims: ['ANL', 'UX'] },
    { channel: 'Соцсети', signal: anyCheck('social') ? 'привязаны' : 'не обнаружены', status: st(anyCheck('social')), next: anyCheck('social') ? 'A1: активность и трафик из соцсетей' : 'Привязать соцсети, вести трафик на витрину', dims: ['MKT'] },
    { channel: 'Email / SMS удержание', signal: anyBlock('newsletter') ? 'форма подписки есть' : 'не обнаружена', status: anyBlock('newsletter') ? 'ok' : 'gap', next: anyBlock('newsletter') ? 'A2: доля выручки email/SMS, флоу, deliverability' : 'Добавить захват контакта и welcome-флоу', dims: ['MKT', 'CRO'] },
    { channel: 'Органический поиск', signal: `${ds.client.sitemapXml ? 'sitemap есть' : 'нет sitemap'}, robots ${ds.client.robotsTxt ? 'есть' : 'нет'}`, status: ds.client.sitemapXml ? 'ok' : 'check', next: 'Детали — в SEO Architecture A0; позиции — Search Console на A1', dims: ['SEO'] },
    { channel: 'Платная реклама (Google/Meta Ads)', signal: 'снаружи не измеряется', status: 'blocked', next: 'A2: доступ к кабинетам — структура, расходы, ROAS', dims: ['MKT', 'ANL'] },
    { channel: 'Маркетплейсы', signal: 'публичные карточки — вне обхода сайта', status: 'blocked', next: 'A1: проверить присутствие; A2 — performance по данным', dims: ['MKT', 'COMP'] },
  ];

  const wired = rows.filter((r) => r.status === 'ok').length;
  const blocked = rows.filter((r) => r.status === 'blocked').length;
  const verdict = !ds.client.pages.some((p) => !p.error) ? 'Каналы не оценены — сайт не разобран.'
    : !has(/GA4|GTM/) ? 'Каналы не измеримы: аналитика не установлена — это первый блокер для всей воронки.'
    : wired >= 4 ? 'Инфраструктура каналов в целом на месте; фактическая эффективность — на A2 по данным кабинетов.'
    : 'Базовый трекинг есть, но часть каналов привлечения и удержания не задействована.';

  return { client, takenAt: ds.takenAt, rows, wired, blocked, verdict };
}
