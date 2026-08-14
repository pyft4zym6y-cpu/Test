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
    { channel: 'Веб-аналітика (GA4/GTM)', signal: has(/GA4|GTM/) ? 'встановлена' : 'не виявлено', status: st(has(/GA4|GTM/)), next: has(/GA4|GTM/) ? 'Після доступів: воронка, джерела, e-commerce події' : 'Встановити GA4/GTM — без неї канали не виміряти', dims: ['ANL'] },
    { channel: 'Ретаргетинг / Pixel', signal: has(/Pixel/) ? 'Meta Pixel встановлено (наявність ≠ робочий канал)' : 'не виявлено', status: has(/Pixel/) ? 'check' : 'check', next: 'Перевірити за даними: якість подій покупки, зібрані аудиторії, чи реально йде ретаргетинг', dims: ['ANL', 'MKT'] },
    { channel: 'Поведінкова аналітика', signal: has(/Hotjar|Clarity/) ? [has(/Hotjar/) && 'Hotjar', has(/Clarity/) && 'MS Clarity'].filter(Boolean).join(' + ') : 'не виявлено', status: has(/Hotjar|Clarity/) ? 'ok' : 'check', next: 'Карти кліків, записи, воронки (після доступів)' + (has(/Hotjar/) && has(/Clarity/) ? '; два інструменти одразу — перевірити, чи не дублюють задачі (хто користується, які дані); за дублювання лишити один' : ''), dims: ['ANL', 'UX'] },
    { channel: 'Соцмережі', signal: anyCheck('social') ? 'прив’язані на сайті' : 'посилань на сайті не знайдено', status: st(anyCheck('social')), next: 'Які профілі прив’язані, а які знайдені пошуком, активні посилання й метрики — у звіті «Соцмережі»', dims: ['MKT'] },
    // Email/SMS — самый дешёвый повторный контакт; снаружи виден только сбор
    // (форма подписки). Реальные рассылки и их выручка — по данным (следующий этап).
    { channel: 'Email / SMS (retention)', signal: anyBlock('newsletter') ? 'форма підписки на сайті є' : 'форма підписки не виявлена', status: anyBlock('newsletter') ? 'check' : 'gap', next: anyBlock('newsletter') ? 'Перевірити за даними: чи йдуть розсилки, open/CTR, сегментація, частка виручки від email' : 'Додати збір email/підписку — дешевий повторний контакт із покупцем', dims: ['MKT', 'ANL'] },
    { channel: 'Органічний пошук', signal: `${ds.client.sitemapXml ? 'sitemap є' : 'немає sitemap'}, robots ${ds.client.robotsTxt ? 'є' : 'немає'}`, status: ds.client.sitemapXml ? 'ok' : 'check', next: 'Деталі — у звіті «SEO-архітектура»; позиції — за даними Search Console', dims: ['SEO'] },
    { channel: 'Платна реклама (Google/Meta Ads)', signal: 'ззовні не вимірюється', status: 'blocked', next: 'Після доступу до кабінетів: структура, витрати, ROAS', dims: ['MKT', 'ANL'] },
    { channel: 'Маркетплейси', signal: 'публічні картки — поза обходом сайту', status: 'blocked', next: 'Перевірити присутність; ефективність — за даними маркетплейсів', dims: ['MKT', 'COMP'] },
  ];

  const wired = rows.filter((r) => r.status === 'ok').length;
  const blocked = rows.filter((r) => r.status === 'blocked').length;
  const verdict = !ds.client.pages.some((p) => !p.error) ? 'Канали не оцінені — сайт не розібрано.'
    : !has(/GA4|GTM/) ? 'Канали не вимірні: аналітика не встановлена — це перший блокер для всієї воронки.'
    : wired >= 4 ? 'Інфраструктура каналів присутня (трекінг, соцмережі, retention-сигнали) — але присутність ще не означає зрілість. Фактична ефективність кожного каналу (CAC, ROAS, частка виручки, якість подій) перевіряється лише за даними кабінетів і аналітики.'
    : 'Базовий трекінг є, але частина каналів залучення й утримання не задіяна.';

  return { client, takenAt: ds.takenAt, rows, wired, blocked, verdict };
}
