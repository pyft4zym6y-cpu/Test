/**
 * Реестр гипотез (AD-19). Инновация метода: всё, что объясняет находку, но не
 * подтверждено, выносится отдельным реестром — со способом проверки и критерием
 * опровержения. Документ, который сам помечает недоказанное, невозможно поймать
 * на манипуляции. Строится детерминированно из анализа (находки низкой
 * уверенности + недостающие факты).
 */
import type { AuditDataset } from './report.js';
import type { Analysis } from './analyze.js';

export type Hypothesis = { id: string; area: string; hypothesis: string; basis: string; verifyBy: string; falsifyIf: string; confidence: number };
export type HypothesisRegister = { items: Hypothesis[] };

function verifyBy(area: string): string {
  const a = area.toLowerCase();
  if (/seo|видим|поиск/.test(a)) return 'Search Console + Ahrefs/Serpstat (позиции, трафик, индексация)';
  if (/ux|cro|юзаб|конверс|карточк|чекаут/.test(a)) return 'Session replay + heatmap (Hotjar/Clarity), тест на 5 пользователях, A/B (PB-38)';
  if (/аналит|воронк|событ/.test(a)) return 'GA4: воронка, события, источники';
  if (/деньг|оборот|эконом|маржа|чек/.test(a)) return 'Выгрузка заказов 6–12 мес + P&L, baseline из систем';
  if (/контент|описан|текст/.test(a)) return 'Аудит контента на живом сайте + доступ к CMS';
  if (/конкурент|цена|канал|реселлер/.test(a)) return 'Повторный обход + прайс-агрегаторы/маркетплейсы';
  if (/техник|скорост|performance|производ/.test(a)) return 'PageSpeed/CrUX + серверные логи';
  if (/реклам|маркетинг|канал/.test(a)) return 'Рекламные кабинеты (Meta/Google) + Ad Library';
  return 'Запрос доступа/данных у клиента (см. реестр доступов AC)';
}

function falsifyIf(area: string): string {
  const a = area.toLowerCase();
  if (/seo|видим|поиск/.test(a)) return 'позиции и органический трафик в норме по Search Console';
  if (/ux|cro|юзаб|конверс|карточк|чекаут/.test(a)) return 'конверсия шага в целевой зоне и запись сессий не показывает трения';
  if (/аналит|воронк/.test(a)) return 'события и воронка настроены и сходятся с заказами';
  if (/деньг|оборот|эконом|маржа|чек/.test(a)) return 'фактические метрики воронки из данных клиента в целевой зоне';
  if (/контент/.test(a)) return 'контент полон и уникален при проверке на живом сайте';
  if (/конкурент|цена|канал/.test(a)) return 'цена и предложение конкурентоспособны по факту в канале';
  if (/техник|скорост|performance/.test(a)) return 'Core Web Vitals в зелёной зоне по полевым данным';
  return 'факт из данных клиента противоречит наблюдению L0';
}

/** Собирает реестр гипотез из анализа: находки низкой уверенности + недостающие факты. */
export function buildHypotheses(a: Analysis): HypothesisRegister {
  const items: Hypothesis[] = [];
  let n = 1;
  const add = (area: string, hypothesis: string, basis: string, confidence: number) => {
    if (!hypothesis) return;
    items.push({ id: `H-${String(n++).padStart(2, '0')}`, area, hypothesis, basis, verifyBy: verifyBy(area), falsifyIf: `Опровергается, если ${falsifyIf(area)}.`, confidence });
  };
  for (const f of a.findings) {
    if (f.confidence < 60) add(f.area, f.fact, f.why || 'наблюдение L0', f.confidence);
  }
  for (const m of a.missingFacts) add('данные', m, 'факт недоступен на слое L0', 25);
  return { items };
}

export function renderHypothesesMd(ds: AuditDataset, r: HypothesisRegister): string {
  const out: string[] = [];
  out.push(`# Реестр гипотез (AD-19) — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · слой L0 · недоказанное со способом проверки и критерием опровержения · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  if (!r.items.length) { out.push('> Гипотез не выделено: находки достаточно подтверждены на текущем тире.'); return out.join('\n'); }
  out.push('Всё, что объясняет находку, но не подтверждено данными клиента, живёт здесь до проверки. Это защита от «магического вывода».');
  out.push('');
  out.push('| ID | Вид | Гипотеза | Основание | Как проверить | Критерий опровержения | Увер. |');
  out.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const h of r.items) out.push(`| ${h.id} | ${h.area} | ${h.hypothesis} | ${h.basis} | ${h.verifyBy} | ${h.falsifyIf} | ${h.confidence} |`);
  out.push('');
  out.push('---');
  out.push('_По мере доступов гипотеза либо подтверждается (переходит в находку-факт), либо опровергается и снимается. Реестр — живой._');
  return out.join('\n');
}
