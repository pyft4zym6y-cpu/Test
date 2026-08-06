/**
 * Роутинг → scope по волнам. Инновация метода: разрывы превращаются в
 * активированные плейбуки и раскладываются по волнам (тактика 0–3 → ядро 3–6 →
 * стратегия 6–12). Активация требует основания (наблюдение с адресом/цифрой).
 * Детерминированно из обхода; обогащается решениями движка и scope анализа.
 */
import type { AuditDataset } from './report.js';
import type { SiteCrawl } from './crawl.js';
import type { EngineResult } from './portalEngine.js';
import type { Analysis } from './analyze.js';

const PB: Record<string, string> = {
  'PB-15': 'UX/CRO аудит и программа тестов',
  'PB-04': 'Технический SEO-аудит и восстановление трафика',
  'PB-05': 'Архитектура каталога, дерево категорий и фасеты',
  'PB-07': 'Конвейер товарного и SEO-контента',
  'PB-06': 'GEO/AEO: видимость в AI и ответных системах',
  'PB-10': 'Перестройка аналитики и событийной модели',
  'PB-02': 'Funnel Teardown (разбор воронки продаж)',
  'PB-12': 'Unit Economics & Contribution Margin',
  'PB-08': 'Retention-контур и жизненный цикл клиента',
  'PB-13': 'Ценовая архитектура и промо-дисциплина',
  'PB-14': 'Платформенный и технический аудит',
  'PB-21': 'Marketplace Launch Kit',
  'PB-37': 'Brand Positioning Sprint',
};

export type ScopeItem = { playbook: string; name: string; reasons: string[]; wave: number };
export type ScopeReport = { waves: { n: number; title: string; items: ScopeItem[] }[]; notIncluded: string[] };

const WAVE_TITLES: Record<number, string> = { 1: 'Волна 1 · тактика (0–3 мес)', 2: 'Волна 2 · ядро (3–6 мес)', 3: 'Волна 3 · стратегия (6–12 мес)' };

const anyBlock = (s: SiteCrawl, k: string) => s.pages.some((p) => p.ux?.blocks?.[k]);
const anyPass = (s: SiteCrawl, id: string) => s.pages.some((p) => p.checks.some((c) => c.id === id && c.pass));
const kindPage = (s: SiteCrawl, kind: string) => s.pages.find((p) => p.kind === kind);

export function buildScope(ds: AuditDataset, opts: { engine?: EngineResult | null; analysis?: Analysis | null; hasMoney?: boolean } = {}): ScopeReport {
  const s = ds.client;
  const activ = new Map<string, ScopeItem>();
  const add = (pb: string, reason: string, wave: number) => {
    const cur = activ.get(pb);
    if (cur) { cur.wave = Math.min(cur.wave, wave); if (!cur.reasons.includes(reason)) cur.reasons.push(reason); }
    else activ.set(pb, { playbook: pb, name: PB[pb] ?? pb, reasons: [reason], wave });
  };

  // ── Активации из обхода (основание = наблюдение) ──
  const pdp = kindPage(s, 'pdp');
  const plp = kindPage(s, 'plp');

  // UX/CRO — если карточка/каталог теряют ядровые блоки или доверие.
  if (pdp) {
    const bl = pdp.ux?.blocks ?? {};
    if (!bl.trust && !bl.payment) add('PB-15', 'на карточке не обнаружено блока доверия/оплаты', 1);
    if (!bl.reviews) add('PB-15', 'на карточке не обнаружено отзывов', 1);
    if ((pdp.ux?.galleryImages ?? 0) < 3) add('PB-15', 'бедная галерея товара', 1);
  }
  if (plp) {
    const bl = plp.ux?.blocks ?? {};
    if (!bl.filters) add('PB-05', 'на каталоге не обнаружено фильтров/фасетов', 2);
    if (!bl.breadcrumbs) add('PB-05', 'на каталоге нет хлебных крошек', 2);
  }

  // SEO/технический.
  if (pdp && !anyPass(s, 'schema-product')) add('PB-04', 'нет Schema.org Product (потеря rich snippets)', 1);
  if (!s.sitemapXml) add('PB-04', 'не обнаружен sitemap.xml', 1);
  if (!anyPass(s, 'hreflang') && anyBlock(s, 'search')) { /* мультиязычность — по ситуации */ }
  if (!anyPass(s, 'schema-crumbs')) add('PB-06', 'нет разметки хлебных крошек (GEO/AEO)', 3);

  // Контент.
  if (pdp && !(pdp.ux?.blocks?.description)) add('PB-07', 'на карточке слабое/непрозрачное описание', 2);

  // Аналитика.
  if (s.tech.analytics.length === 0) add('PB-10', 'на сайте не обнаружено аналитики (GA4/GTM)', 1);

  // Техплатформа.
  if (!anyPass(s, 'errors-soft') || !anyPass(s, 'preconnect')) add('PB-14', 'сигналы техдолга (ошибки/производительность)', 2);

  // Деньги/воронка.
  if (opts.hasMoney) { add('PB-02', 'посчитан недополученный оборот — нужен разбор воронки', 1); add('PB-12', 'подтвердить юнит-экономику под масштабирование', 2); }

  // Retention/pricing — из движка/ответов.
  if (opts.engine?.gaps?.some((g) => /retention|повтор|удерж/i.test(g.label))) add('PB-08', 'разрыв в удержании (движок)', 2);
  if (opts.engine?.gaps?.some((g) => /цена|price|промо|маржа/i.test(g.label))) add('PB-13', 'разрыв в ценовой дисциплине (движок)', 3);

  // Бренд/позиционирование при слабом соответствии.
  const scored = s.pages.filter((p) => p.score !== null);
  const avg = scored.length ? scored.reduce((a, p) => a + (p.score ?? 0), 0) / scored.length : 100;
  if (avg < 45) add('PB-37', 'низкое соответствие витрины стандарту — вопрос позиционирования', 3);

  // ── Слияние с решениями движка и scope анализа (у них своя трасса «почему») ──
  for (const d of opts.engine?.decisions ?? []) for (const pb of d.playbooks ?? []) if (PB[pb]) add(pb, `движок: ${d.title}`, d.impact >= 4 ? 1 : d.impact >= 3 ? 2 : 3);
  for (const it of opts.analysis?.scope ?? []) if (it.playbook) add(it.playbook, it.reason || 'из анализа', Math.min(3, Math.max(1, it.wave || 2)));

  const items = Array.from(activ.values());
  const waves = [1, 2, 3].map((n) => ({ n, title: WAVE_TITLES[n], items: items.filter((i) => i.wave === n).sort((a, b) => b.reasons.length - a.reasons.length) })).filter((w) => w.items.length);
  const notIncluded = Object.entries(PB).filter(([code]) => !activ.has(code)).map(([code, name]) => `${code} ${name}`);
  return { waves, notIncluded };
}

export function renderScopeMd(ds: AuditDataset, r: ScopeReport): string {
  const out: string[] = [];
  out.push(`# Scope программы по волнам — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · роутинг разрывов в плейбуки · слой L0 · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  out.push('Каждый плейбук активирован основанием (наблюдение с адресом/цифрой). Волны: тактика 0–3 → ядро 3–6 → стратегия 6–12 мес. На L0 уверенность активаций ниже — уточняется с доступами.');
  out.push('');
  if (!r.waves.length) { out.push('> Активаций не набрано — витрина близка к стандарту по наблюдаемым сигналам.'); return out.join('\n'); }
  for (const w of r.waves) {
    out.push(`## ${w.title}`);
    out.push('| Плейбук | Методика | Основание |');
    out.push('| --- | --- | --- |');
    for (const it of w.items) out.push(`| ${it.playbook} | ${it.name} | ${it.reasons.join('; ')} |`);
    out.push('');
  }
  if (r.notIncluded.length) {
    out.push('## Осознанно НЕ в scope (нет основания на L0)');
    for (const n of r.notIncluded) out.push(`- ${n}`);
    out.push('');
  }
  out.push('---');
  out.push('_Решение без трассы «основание → плейбук → волна» в scope не попадает. Приоритет уточняется деньгами и Health Score._');
  return out.join('\n');
}
