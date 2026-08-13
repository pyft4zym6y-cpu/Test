/**
 * Цена в канале и роль в цепочке. Инновация метода: до аудита цены определи роль
 * клиента (производитель / реселлер / гибрид) — от неё зависит вся логика блока
 * «цена и канал». Автоматически на L0 определяется роль-гипотеза и собирается
 * протокол проверки; сами цены у реселлеров и на маркетплейсах требуют входов
 * (прайс-агрегаторы, маркетплейсы) — помечены как таковые.
 */
import type { AuditDataset } from './report.js';

export type Role = 'producer' | 'reseller' | 'hybrid' | 'unknown';
// status — свободный текст статуса (рендерится как есть). Тип широкий, чтобы
// метод-рендер (methodPdf) сравнивал значение без ошибки при украинских строках.
export type PriceChannelReport = { role: Role; roleBasis: string; risk: string; checklist: { item: string; how: string; status: string }[] };

const ROLE_LABEL: Record<Role, string> = { producer: 'Виробник / власник бренду', reseller: 'Реселер чужих брендів', hybrid: 'Гібрид', unknown: 'Потребує уточнення' };
const ROLE_RISK: Record<Role, string> = {
  producer: 'Ризик: посередники й маркетплейси продають ваш товар дешевше за вас самих (втрата контролю ціни й клієнта).',
  reseller: 'Ризик: у бренду є офіційний дистриб’ютор/роздріб — конкурент, що стоїть вище в закупівлі й структурно непереможний за ціною.',
  hybrid: 'Перевіряється двічі, за кожним ринком окремо: де ви виробник, а де — реселер.',
  unknown: 'Визначте роль до аудиту ціни — від неї залежить уся логіка блоку «ціна і канал».',
};

export function buildPriceChannel(ds: AuditDataset): PriceChannelReport {
  const hay = `${ds.request} ${ds.brief ?? ''}`.toLowerCase();
  const isProducer = /виробник|производ|власн(ий)? бренд|собствен\w* бренд|own brand|manufactur/.test(hay);
  const isReseller = /реселлер|дистриб|перепрода|reseller|официальн\w* дилер|офіційн\w* дилер/.test(hay);
  let role: Role = 'unknown';
  let roleBasis = 'визначено за формулюванням запиту/брифу (гіпотеза, підтвердити)';
  if (isProducer && isReseller) role = 'hybrid';
  else if (isProducer) role = 'producer';
  else if (isReseller) role = 'reseller';
  // Fallback по витрине: при пустом брифе роль читается из структуры сайта —
  // B2B/опт/HoReCa-разделы у витрины с собственным брендом = производитель-гипотеза.
  if (role === 'unknown') {
    const hasB2B = (ds.client.links ?? []).some((h) => { try { return /b2b|opt|wholesale|dealer|horeca|corporate|korp-/.test(new URL(h).pathname.toLowerCase()); } catch { return false; } });
    if (hasB2B) { role = 'producer'; roleBasis = 'за вітриною: B2B/опт/корпоративні розділи — ознака виробника/власника бренду (гіпотеза, підтвердити)'; }
    else roleBasis = 'із запиту/брифу роль не ясна — уточнити у власника';
  }

  const checklist: PriceChannelReport['checklist'] = [
    { item: 'Ціна того самого товару в реселерів', how: 'прайс-агрегатори (Hotline/Price) + пошук за назвою/артикулом', status: 'потрібні входи' },
    { item: 'Ціна й контроль картки на маркетплейсах', how: 'Rozetka/Prom/Allegro/Amazon — лістинги бренду', status: 'потрібні входи' },
    { item: 'Частка лістингів бренду під власним контролем', how: 'скільки карток веде сам бренд проти посередників', status: 'потрібні входи' },
    { item: 'Наявність офіційного дистриб’ютора з роздрібом', how: 'перевірка сайту бренду й офіц. точок', status: 'потрібні входи' },
    { item: 'MAP-дисципліна (мінімальна ціна)', how: 'чи є правило й чи дотримується в каналі', status: 'потрібні входи' },
    { item: 'Ціна й оффер на власній вітрині', how: 'знято обходом (наявність цін на сторінках)', status: 'з обходу' },
  ];
  return { role, roleBasis, risk: ROLE_RISK[role], checklist };
}

export function renderPriceChannelMd(ds: AuditDataset, r: PriceChannelReport): string {
  const out: string[] = [];
  out.push(`# Ціна в каналі й роль у ланцюжку — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Зовнішній аудит вітрини_`);
  out.push('');
  out.push(`**Роль клієнта (гіпотеза): ${ROLE_LABEL[r.role]}.** ${r.roleBasis}.`);
  out.push('');
  out.push(`> ${r.risk}`);
  out.push('');
  out.push('## Протокол перевірки ціни в каналі');
  out.push('| Що перевірити | Як | Статус |');
  out.push('| --- | --- | --- |');
  for (const c of r.checklist) out.push(`| ${c.item} | ${c.how} | ${c.status} |`);
  out.push('');
  out.push('---');
  out.push('_Роль підтверджується у власника. Ціни в реселерів і на маркетплейсах добираються з прайс-агрегаторів і майданчиків (порядок величини, до підтвердження — низька впевненість)._');
  return out.join('\n');
}
