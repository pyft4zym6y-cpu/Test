/**
 * Технический внешний аудит A0: агрегирует технические проверки обхода по
 * категориям (индексируемость, разметка, скорость, безопасность, мобильность,
 * доступность, гигиена). Слой L0 — что не измерить внешне (LCP/CWV, заголовки
 * безопасности), честно помечается «нужен инструмент/доступ» (BLOCKED, A0 §15).
 */
import type { AuditDataset } from './report.js';
import type { Dim } from './pagereport.js';

export type TStatus = 'ok' | 'check' | 'gap' | 'blocked';
export type TechCheck = { label: string; passed: number; total: number; status: TStatus; note: string; rec: string };
export type TechCategory = { title: string; dims: Dim[]; status: TStatus; checks: TechCheck[] };
export type TechReport = {
  client: string; takenAt: string;
  categories: TechCategory[];
  score: { passed: number; total: number; pct: number };
  blocked: string[];
  verdict: string;
};

const worst = (a: TStatus, b: TStatus): TStatus => {
  const rank: Record<TStatus, number> = { ok: 0, check: 1, blocked: 2, gap: 3 };
  return rank[a] >= rank[b] ? a : b;
};

/** Агрегирует проверку с данным id по всем разобранным страницам. */
function agg(ds: AuditDataset, id: string): { passed: number; total: number } {
  let passed = 0, total = 0;
  for (const p of ds.client.pages) { if (p.error || !p.checks.length) continue; const c = p.checks.find((x) => x.id === id); if (c) { total++; if (c.pass) passed++; } }
  return { passed, total };
}
function statusOf(passed: number, total: number): TStatus {
  if (!total) return 'check';
  if (passed === total) return 'ok';
  if (passed / total < 0.35) return 'gap'; // 2/16 — это провал, а не «проверить»
  return 'check';
}

export function buildTechAudit(ds: AuditDataset): TechReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const pages = ds.client.pages.filter((p) => !p.error && p.checks.length);

  const check = (id: string, label: string, rec: string): TechCheck => {
    const { passed, total } = agg(ds, id);
    const st = statusOf(passed, total);
    return { label, passed, total, status: st, note: total ? `${passed}/${total} стр.` : 'нет данных', rec: st === 'ok' ? '—' : rec };
  };
  const site = (ok: boolean, label: string, rec: string): TechCheck => ({ label, passed: ok ? 1 : 0, total: 1, status: ok ? 'ok' : 'gap', note: ok ? 'есть' : 'нет', rec: ok ? '—' : rec });
  const blockedCheck = (label: string, why: string): TechCheck => ({ label, passed: 0, total: 0, status: 'blocked', note: 'нужен инструмент/доступ', rec: why });

  // Мобильность из ux-замеров.
  const avgSmall = pages.length ? Math.round(pages.reduce((s, p) => s + (p.ux?.smallTapTargets ?? 0), 0) / pages.length) : 0;
  const minFont = pages.reduce((m, p) => Math.min(m, p.ux?.baseFontPx ?? 16), 16);

  const cats: TechCategory[] = [
    { title: 'Индексируемость', dims: ['SEO', 'TECH'], status: 'ok', checks: [
      site(ds.client.robotsTxt, 'robots.txt', 'Добавить robots.txt с директивами для фасетов'),
      site(ds.client.sitemapXml, 'sitemap.xml', 'Сгенерировать sitemap.xml и отправить в Search Console'),
      check('canonical', 'Canonical', 'Задать canonical на каждом шаблоне; для вариантов — на базовую версию'),
      check('noindex', 'Нет случайного noindex', 'Убрать noindex с коммерческих страниц'),
      check('hreflang', 'hreflang (мультиязычность)', 'Настроить hreflang, если есть языковые версии'),
    ] },
    { title: 'Разметка Schema.org', dims: ['TECH', 'SEO', 'AEO'], status: 'ok', checks: [
      check('schema-org', 'Organization / WebSite', 'Добавить Schema Organization + WebSite на главной'),
      check('schema-product', 'Product / Offer', 'Добавить Product+Offer+AggregateRating на карточках'),
      check('schema-crumbs', 'BreadcrumbList', 'Разметить хлебные крошки BreadcrumbList'),
    ] },
    { title: 'Скорость', dims: ['PERF'], status: 'ok', checks: [
      check('preconnect', 'Preconnect / preload', 'Добавить preconnect к CDN/шрифтам, preload для LCP-ресурса'),
      check('lazy', 'Lazy-load изображений', 'Включить lazy-load для изображений ниже первого экрана'),
      blockedCheck('Core Web Vitals (LCP/CLS/INP)', 'Нужен PageSpeed/CrUX — измеряется на A1 (внешний инструмент)'),
    ] },
    { title: 'Безопасность', dims: ['SEC'], status: 'ok', checks: [
      check('https', 'HTTPS', 'Перевести весь сайт на HTTPS, настроить редиректы'),
      check('cookies', 'Cookie / consent (ЕС)', 'Добавить cookie-consent для рынков ЕС'),
      blockedCheck('Заголовки безопасности (CSP/HSTS)', 'Требует ответных заголовков сервера — проверяется на A1'),
    ] },
    { title: 'Мобильность', dims: ['MOB', 'A11Y'], status: 'ok', checks: [
      check('viewport', 'Viewport', 'Добавить meta viewport для корректного мобильного рендера'),
      { label: 'Тап-цели ≥ 40px', passed: avgSmall <= 3 ? 1 : 0, total: 1, status: avgSmall <= 3 ? 'ok' : 'check', note: `~${avgSmall} мелких/стр.`, rec: avgSmall <= 3 ? '—' : 'Увеличить кликабельные элементы до 40px (Thumb Zone)' },
      { label: 'Базовый кегль ≥ 14px', passed: minFont >= 14 ? 1 : 0, total: 1, status: minFont >= 14 ? 'ok' : 'check', note: `мин ${minFont}px`, rec: minFont >= 14 ? '—' : 'Поднять базовый шрифт до ≥14px для читаемости на мобильном' },
    ] },
    { title: 'Доступность и гигиена', dims: ['A11Y', 'TECH'], status: 'ok', checks: [
      check('alt', 'ALT у изображений', 'Проставить ALT ≥70% изображений'),
      check('lang', 'Атрибут lang', 'Задать lang у <html>'),
      check('charset', 'Charset', 'Указать meta charset'),
      check('errors-soft', 'Нет текста ошибок в вёрстке', 'Убрать видимые PHP/JS-ошибки со страниц'),
      check('analytics', 'Аналитика (GA4/GTM/Pixel)', 'Установить GA4/GTM — без событий воронку не измерить'),
    ] },
  ];

  // Статус категории = худший из ИЗМЕРЕННЫХ проверок; blocked (нужен инструмент) не
  // делает всю категорию «недоступной» — это инфо-строка, а не результат.
  for (const c of cats) c.status = c.checks.filter((ch) => ch.status !== 'blocked').reduce<TStatus>((s, ch) => worst(s, ch.status), 'ok');

  const passed = cats.reduce((s, c) => s + c.checks.filter((ch) => ch.status === 'ok').length, 0);
  const total = cats.reduce((s, c) => s + c.checks.filter((ch) => ch.status !== 'blocked').length, 0);
  const pct = total ? Math.round((passed / total) * 100) : 0;
  const blocked = cats.flatMap((c) => c.checks.filter((ch) => ch.status === 'blocked').map((ch) => ch.label));
  const gaps = cats.flatMap((c) => c.checks.filter((ch) => ch.status === 'gap').map((ch) => ch.label));
  const verdict = !pages.length ? 'Технические проверки недоступны — сайт не разобран.'
    : gaps.length >= 4 ? 'Технический фундамент с серьёзными пробелами: индексируемость и разметка требуют работы.'
    : gaps.length ? 'Основа рабочая, но есть технические пробелы, снижающие видимость.'
    : 'Технически витрина в целом здоровая по внешним признакам.';

  return { client, takenAt: ds.takenAt, categories: cats, score: { passed, total, pct }, blocked, verdict };
}
