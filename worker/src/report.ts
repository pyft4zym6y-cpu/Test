/**
 * Детерминированный L0-разбор из обхода: наблюдения по голд-стандарту, дерево
 * страниц, техника, сравнение клиент↔конкуренты. Пишется без LLM — это факт-слой
 * (метка «наблюдение L0», уверенность низкая), который затем обогащает Claude.
 */
import type { SiteCrawl, PageAudit } from './crawl.js';
import { TIERS, type Tier } from './tiers.js';

export type AuditDataset = {
  tier: Tier;
  request: string;
  client: SiteCrawl;
  competitors: SiteCrawl[];
  takenAt: string;
  mode?: 'audit' | 'prelaunch'; // prelaunch — сайта ещё нет / в разработке
  brief?: string; // бриф проекта для режима prelaunch
  knowledge?: string; // база знаний клиента (свёрнутая в текст) — контекст для анализа
  /** Разбор источников по уровням достоверности и правила их сопоставления
   *  (см. evidence.ts). Отдельно от knowledge: то — ЧТО мы знаем, это — НАСКОЛЬКО
   *  этому можно верить и что делать с расхождениями между уровнями. */
  evidence?: string;
  crux?: string;      // полевые Core Web Vitals клиента и конкурентов (CrUX)
};

const KIND_LABEL: Record<PageAudit['kind'], string> = {
  home: 'Главная', plp: 'Каталог/PLP', pdp: 'Карточка/PDP', cart: 'Корзина', checkout: 'Чекаут', content: 'Контент', faq: 'FAQ', other: 'Прочее',
};

function siteScore(site: SiteCrawl): number | null {
  const scored = site.pages.filter((p) => p.score !== null);
  if (!scored.length) return null;
  return Math.round(scored.reduce((s, p) => s + (p.score ?? 0), 0) / scored.length);
}

/** Топ проваленных проверок по всему сайту (уникально, с частотой). */
function failedChecks(site: SiteCrawl): { label: string; group: string; count: number }[] {
  const m = new Map<string, { label: string; group: string; count: number }>();
  for (const p of site.pages) for (const c of p.checks) {
    if (c.pass) continue;
    const cur = m.get(c.id) ?? { label: c.label, group: c.group, count: 0 };
    cur.count += 1;
    m.set(c.id, cur);
  }
  return Array.from(m.values()).sort((a, b) => b.count - a.count);
}

export function renderL0Report(ds: AuditDataset): string {
  const spec = TIERS[ds.tier];
  const L: string[] = [];
  const cs = siteScore(ds.client);

  L.push(`# Аудит L0 — наблюдения без доступов`);
  L.push(`_Commerce OS · тир T${ds.tier}: ${spec.title} · слой ${spec.methodLayer} · потолок уверенности ${spec.baseConfidence}/100_`);
  L.push(`_Снято: ${ds.takenAt}. Все значения — «наблюдение L0», порядок величины, не факт по данным клиента._`);
  if (ds.request) L.push(`\n**Запрос клиента:** ${ds.request}`);

  L.push(`\n## Клиент · ${ds.client.finalUrl}`);
  if (!ds.client.reachable) L.push(`> ⚠️ Сайт недоступен обходчику${ds.client.error ? `: ${ds.client.error}` : ''}. Проверить бот-защиту/гео.`);
  L.push(`- Соответствие голд-стандарту (ср. по ${ds.client.pages.filter((p) => p.score !== null).length} стр.): **${cs ?? '—'}%**`);
  L.push(`- Платформа: ${ds.client.tech.platform ?? 'не определена'} · Аналитика: ${ds.client.tech.analytics.join(', ') || 'не обнаружена'}`);
  L.push(`- robots.txt: ${ds.client.robotsTxt ? 'есть' : 'нет'} · sitemap.xml: ${ds.client.sitemapXml ? 'есть' : 'нет'} · ссылок на главной: ${ds.client.discoveredLinks}`);

  L.push(`\n### Дерево разобранных страниц`);
  for (const p of ds.client.pages)
    L.push(`- **${KIND_LABEL[p.kind]}** · ${p.score ?? '—'}% · ${p.finalUrl}${p.error ? ` — ⚠️ ${p.error}` : ''}`);

  L.push(`\n### Узкие места (проваленные проверки голд-стандарта)`);
  const fails = failedChecks(ds.client);
  if (!fails.length) L.push('- Критичных провалов не зафиксировано на разобранных страницах.');
  for (const f of fails.slice(0, 15)) L.push(`- [${f.group}] ${f.label} — провалено на ${f.count} стр.`);

  if (ds.competitors.length) {
    L.push(`\n## Конкурентное поле (в лоб по голд-стандарту)`);
    L.push(`| Сайт | Соответствие | Платформа | Аналитика |`);
    L.push(`| --- | --- | --- | --- |`);
    L.push(`| **клиент** ${ds.client.finalUrl} | ${cs ?? '—'}% | ${ds.client.tech.platform ?? '—'} | ${ds.client.tech.analytics.join(', ') || '—'} |`);
    for (const comp of ds.competitors) {
      const s = siteScore(comp);
      L.push(`| ${comp.finalUrl} | ${s ?? '—'}% | ${comp.tech.platform ?? '—'} | ${comp.tech.analytics.join(', ') || '—'} |`);
    }
    const compScores = ds.competitors.map(siteScore).filter((s): s is number => s !== null);
    if (cs !== null && compScores.length) {
      const avg = Math.round(compScores.reduce((a, b) => a + b, 0) / compScores.length);
      const gap = avg - cs;
      L.push(`\n**Разрыв к среднему конкуренту:** ${gap > 0 ? `отставание ${gap} п.п.` : gap < 0 ? `опережение ${-gap} п.п.` : 'на уровне'}.`);
    }
  }

  L.push(`\n---`);
  L.push(`_Что дальше: этот L0-датасет уходит в аналитический слой (Claude по методологии) → Health Score, деньги, scope → сборка AD-15, мини-отчётов и дорожной карты с Гантом. С ростом тира ячейки уточняются, структура сохраняется._`);
  return L.join('\n');
}
