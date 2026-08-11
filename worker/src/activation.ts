/**
 * Activation / Coverage Engine (порт идеи round12 coverage.py): отвечает на
 * вопрос «а всё ли проверено?», а не «кажется, всё». По типу бизнеса определяется
 * набор ОБЯЗАТЕЛЬНЫХ доменов; сверяется с тем, какие аудиты реально отработали
 * в прогоне. Домен обязательный и молчащий = непроверенное место, о котором
 * говорим явно (вплоть до вердикта «аудит не завершён»).
 */
import type { AuditDataset } from './report.js';

/** Конфигурация активации доменов по типу бизнеса (из round12 coverage.py). */
const ACTIVATION: Record<string, string[]> = {
  'производитель D2C + опт': ['identity', 'commerce', 'data', 'brand', 'product', 'pricing', 'ux', 'merchandising', 'seo', 'content', 'b2b', 'ops', 'synthesis', 'finance', 'legal', 'marketplace', 'retention', 'paid'],
  'реселлер / ритейлер': ['identity', 'commerce', 'data', 'ux', 'merchandising', 'seo', 'pricing', 'product', 'ops', 'synthesis', 'finance', 'legal'],
  'D2C-магазин': ['identity', 'commerce', 'data', 'brand', 'product', 'pricing', 'ux', 'merchandising', 'seo', 'content', 'ops', 'synthesis', 'retention', 'legal'],
};

/** Какие домены закрывает каждый A0-документ прогона (по имени файла). */
const DOC_DOMAINS: Record<string, string[]> = {
  'Commerce-Intelligence-Audit-A0.pdf': ['identity', 'commerce', 'brand', 'retention', 'b2b', 'marketplace', 'finance'],
  'Executive-Diagnostic-A0.pdf': ['commerce', 'identity'],
  'UX-UI-аудит-A0.pdf': ['ux', 'merchandising'],
  'SEO-Architecture-A0.pdf': ['seo'],
  'Технический-аудит-A0.pdf': ['data'],
  'Content-Audit-A0.pdf': ['content'],
  'Конкурентный-анализ-A0.pdf': ['commerce'],
  'Аудит-каналов-A0.pdf': ['paid', 'data', 'retention'],
  'Матрица-зрелости-A0.pdf': ['commerce'],
  'Цена-в-канале-A0.pdf': ['pricing'],
  'Синтез-аудита-A0.pdf': ['synthesis'],
  'Причинно-следственная-карта-A0.pdf': ['synthesis'],
  'Реестр-гипотез-A0.pdf': ['synthesis'],
  'Scope-по-волнам-A0.pdf': ['synthesis'],
  'Охват-и-уверенность-A0.pdf': ['commerce'],
  'Маркетинговые-механики-A0.pdf': ['commerce', 'retention', 'merchandising'],
  'Карта-пути-клиента-A0.pdf': ['ux', 'commerce'],
  'Сводный-бэклог-A0.pdf': ['synthesis'],
  'Протокол-синергии-QA-A0.pdf': ['synthesis'],
  'Аудит-соцсетей-A0.pdf': ['paid', 'brand'],
  'Внешний-инфофон-A0.pdf': ['brand'],
  'Аудит-отзывов-A0.pdf': ['commerce', 'brand'],
  'pagereport.json': ['product'],
};

/** Домены, которые на L0 внешне закрыть нельзя (нужны данные) — не «пропуск», а BLOCKED. */
const L0_BLOCKED: Record<string, string> = {
  finance: 'юнит-экономика — нужны данные клиента (A1)',
  ops: 'операции/фулфилмент — снаружи только заявленные условия (A1)',
  legal: 'правовой аудит — читается вручную по правовым страницам (частично L0)',
  people: 'команда/процессы — интервью (A1)',
  marketplace: 'присутствие на площадках — внешняя проверка вне сайта (A1)',
};

export type ActivationRow = { domain: string; status: 'проверено' | 'частично' | 'нужны данные' | 'НЕ ПРОВЕРЕНО'; coveredBy: string };
export type ActivationReport = {
  businessType: string;
  mandatory: number;
  rows: ActivationRow[];
  missing: string[];
  complete: boolean;
  verdict: string;
};

export function detectBusinessType(ds: AuditDataset): string {
  const links = ds.client.links ?? [];
  const hasB2B = links.some((h) => { try { return /b2b|opt|wholesale|dealer|horeca|corporate/.test(new URL(h).pathname.toLowerCase()); } catch { return false; } });
  if (hasB2B) return 'производитель D2C + опт';
  const products = links.filter((h) => { try { return /product|tovar|\/p\/|goods|item|route=product/.test(new URL(h).pathname.toLowerCase()); } catch { return false; } }).length;
  return products > 800 ? 'реселлер / ритейлер' : 'D2C-магазин';
}

/** Сверка: обязательные домены типа бизнеса × реально собранные документы прогона. */
export function buildActivation(ds: AuditDataset, producedFiles: string[]): ActivationReport {
  const businessType = detectBusinessType(ds);
  const mandatory = ACTIVATION[businessType] ?? ACTIVATION['D2C-магазин'];
  const coveredBy = new Map<string, string[]>();
  for (const f of producedFiles) {
    for (const d of DOC_DOMAINS[f] ?? []) {
      coveredBy.set(d, [...(coveredBy.get(d) ?? []), f.replace(/\.(pdf|json)$/i, '')]);
    }
  }
  const rows: ActivationRow[] = mandatory.map((d) => {
    const docs = coveredBy.get(d);
    if (docs?.length) return { domain: d, status: 'проверено', coveredBy: docs.slice(0, 2).join(', ') };
    if (L0_BLOCKED[d]) return { domain: d, status: 'нужны данные', coveredBy: L0_BLOCKED[d] };
    return { domain: d, status: 'НЕ ПРОВЕРЕНО', coveredBy: '—' };
  });
  const missing = rows.filter((r) => r.status === 'НЕ ПРОВЕРЕНО').map((r) => r.domain);
  const checked = rows.filter((r) => r.status === 'проверено').length;
  const complete = missing.length === 0;
  const verdict = complete
    ? `Обязательный контур L0 закрыт: ${checked}/${mandatory.length} доменов проверено, остальные честно ждут данных (A1).`
    : `АУДИТ НЕ ЗАВЕРШЁН: не проверены обязательные домены — ${missing.join(', ')}. Отчёт выпускать с оговоркой.`;
  return { businessType, mandatory: mandatory.length, rows, missing, complete, verdict };
}
