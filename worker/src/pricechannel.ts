/**
 * Цена в канале и роль в цепочке. Инновация метода: до аудита цены определи роль
 * клиента (производитель / реселлер / гибрид) — от неё зависит вся логика блока
 * «цена и канал». Автоматически на L0 определяется роль-гипотеза и собирается
 * протокол проверки; сами цены у реселлеров и на маркетплейсах требуют входов
 * (прайс-агрегаторы, маркетплейсы) — помечены как таковые.
 */
import type { AuditDataset } from './report.js';

export type Role = 'producer' | 'reseller' | 'hybrid' | 'unknown';
export type PriceChannelReport = { role: Role; roleBasis: string; risk: string; checklist: { item: string; how: string; status: 'нужны входы' | 'из обхода' }[] };

const ROLE_LABEL: Record<Role, string> = { producer: 'Производитель / владелец бренда', reseller: 'Реселлер чужих брендов', hybrid: 'Гибрид', unknown: 'Требует уточнения' };
const ROLE_RISK: Record<Role, string> = {
  producer: 'Риск: посредники и маркетплейсы продают ваш товар дешевле вас самих (потеря контроля цены и клиента).',
  reseller: 'Риск: у бренда есть официальный дистрибьютор/розница — конкурент, стоящий выше в закупке и структурно непобедимый по цене.',
  hybrid: 'Проверяется дважды, по каждому рынку отдельно: где вы производитель, а где — реселлер.',
  unknown: 'Определите роль до аудита цены — от неё зависит вся логика блока «цена и канал».',
};

export function buildPriceChannel(ds: AuditDataset): PriceChannelReport {
  const hay = `${ds.request} ${ds.brief ?? ''}`.toLowerCase();
  const isProducer = /виробник|производ|власн(ий)? бренд|собствен\w* бренд|own brand|manufactur/.test(hay);
  const isReseller = /реселлер|дистриб|перепрода|reseller|официальн\w* дилер|офіційн\w* дилер/.test(hay);
  let role: Role = 'unknown';
  let roleBasis = 'определено по формулировке запроса/брифа (гипотеза, подтвердить)';
  if (isProducer && isReseller) role = 'hybrid';
  else if (isProducer) role = 'producer';
  else if (isReseller) role = 'reseller';
  // Fallback по витрине: при пустом брифе роль читается из структуры сайта —
  // B2B/опт/HoReCa-разделы у витрины с собственным брендом = производитель-гипотеза.
  if (role === 'unknown') {
    const hasB2B = (ds.client.links ?? []).some((h) => { try { return /b2b|opt|wholesale|dealer|horeca|corporate|korp-/.test(new URL(h).pathname.toLowerCase()); } catch { return false; } });
    if (hasB2B) { role = 'producer'; roleBasis = 'по витрине: B2B/опт/корпоративные разделы — признак производителя/владельца бренда (гипотеза, подтвердить)'; }
    else roleBasis = 'из запроса/брифа роль не ясна — уточнить у собственника';
  }

  const checklist: PriceChannelReport['checklist'] = [
    { item: 'Цена того же товара у реселлеров', how: 'прайс-агрегаторы (Hotline/Price) + поиск по названию/артикулу', status: 'нужны входы' },
    { item: 'Цена и контроль карточки на маркетплейсах', how: 'Rozetka/Prom/Allegro/Amazon — листинги бренда', status: 'нужны входы' },
    { item: 'Доля листингов бренда под собственным контролем', how: 'сколько карточек ведёт сам бренд vs посредники', status: 'нужны входы' },
    { item: 'Наличие официального дистрибьютора с розницей', how: 'проверка сайта бренда и офиц. точек', status: 'нужны входы' },
    { item: 'MAP-дисциплина (минимальная цена)', how: 'есть ли правило и соблюдается ли в канале', status: 'нужны входы' },
    { item: 'Цена и оффер на собственной витрине', how: 'снято обходом (наличие цен на страницах)', status: 'из обхода' },
  ];
  return { role, roleBasis, risk: ROLE_RISK[role], checklist };
}

export function renderPriceChannelMd(ds: AuditDataset, r: PriceChannelReport): string {
  const out: string[] = [];
  out.push(`# Цена в канале и роль в цепочке — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · слой L0 · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  out.push(`**Роль клиента (гипотеза): ${ROLE_LABEL[r.role]}.** ${r.roleBasis}.`);
  out.push('');
  out.push(`> ${r.risk}`);
  out.push('');
  out.push('## Протокол проверки цены в канале');
  out.push('| Что проверить | Как | Статус |');
  out.push('| --- | --- | --- |');
  for (const c of r.checklist) out.push(`| ${c.item} | ${c.how} | ${c.status} |`);
  out.push('');
  out.push('---');
  out.push('_Роль подтверждается у собственника. Цены у реселлеров и на маркетплейсах добираются из прайс-агрегаторов и площадок (порядок величины, уверенность 25 до подтверждения)._');
  return out.join('\n');
}
