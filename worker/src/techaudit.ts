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
    return { label, passed, total, status: st, note: total ? `${passed}/${total} стор.` : 'немає даних', rec: st === 'ok' ? '—' : rec };
  };
  const site = (ok: boolean, label: string, rec: string): TechCheck => ({ label, passed: ok ? 1 : 0, total: 1, status: ok ? 'ok' : 'gap', note: ok ? 'є' : 'немає', rec: ok ? '—' : rec });
  const blockedCheck = (label: string, why: string): TechCheck => ({ label, passed: 0, total: 0, status: 'blocked', note: 'потрібен інструмент/доступ', rec: why });

  // Мобильность из ux-замеров.
  const avgSmall = pages.length ? Math.round(pages.reduce((s, p) => s + (p.ux?.smallTapTargets ?? 0), 0) / pages.length) : 0;
  const minFont = pages.reduce((m, p) => Math.min(m, p.ux?.baseFontPx ?? 16), 16);

  const cats: TechCategory[] = [
    { title: 'Індексованість', dims: ['SEO', 'TECH'], status: 'ok', checks: [
      site(ds.client.robotsTxt, 'robots.txt', 'Додати robots.txt з директивами для фасетів'),
      site(ds.client.sitemapXml, 'sitemap.xml', 'Згенерувати sitemap.xml і надіслати в Search Console'),
      check('canonical', 'Canonical', 'Задати canonical на кожному шаблоні; для варіантів — на базову версію'),
      check('noindex', 'Немає випадкового noindex', 'Прибрати noindex з комерційних сторінок'),
      check('hreflang', 'hreflang (багатомовність)', 'Налаштувати hreflang, якщо є мовні версії'),
    ] },
    { title: 'Розмітка Schema.org', dims: ['TECH', 'SEO', 'AEO'], status: 'ok', checks: [
      check('schema-org', 'Organization / WebSite', 'Додати Schema Organization + WebSite на головній'),
      check('schema-product', 'Product / Offer', 'Додати Product+Offer+AggregateRating на картках'),
      check('schema-crumbs', 'BreadcrumbList', 'Розмітити хлібні крихти BreadcrumbList'),
    ] },
    { title: 'Швидкість', dims: ['PERF'], status: 'ok', checks: [
      check('preconnect', 'Preconnect / preload', 'Додати preconnect до CDN/шрифтів, preload для LCP-ресурсу'),
      check('lazy', 'Lazy-load зображень', 'Увімкнути lazy-load для зображень нижче першого екрана'),
      blockedCheck('Core Web Vitals (LCP/CLS/INP)', 'Потрібен PageSpeed/CrUX — вимірюється після передачі доступів (зовнішній інструмент)'),
    ] },
    { title: 'Безпека', dims: ['SEC'], status: 'ok', checks: [
      check('https', 'HTTPS', 'Перевести весь сайт на HTTPS, налаштувати редиректи'),
      check('cookies', 'Cookie / consent (ЄС)', 'Додати cookie-consent для ринків ЄС'),
      ...(ds.client.secHeaders ? [
        site(ds.client.secHeaders.hsts, 'HSTS (strict-transport-security)', 'Увімкнути HSTS на сервері — захист від downgrade-атак'),
        site(ds.client.secHeaders.csp, 'Content-Security-Policy', 'Задати CSP — захист від XSS та ін’єкцій'),
        site(ds.client.secHeaders.xfo, 'Захист від clickjacking (XFO/CSP)', 'Додати X-Frame-Options або frame-ancestors'),
      ] : [blockedCheck('Заголовки безпеки (CSP/HSTS)', 'Відповідь сервера не отримано — перевіряється після передачі доступів')]),
    ] },
    // GEO/AEO: видимость в AI-выдаче (эталон 2025–2026: доступ AI-краулеров + llms.txt + разметка).
    { title: 'AI-видимість (GEO/AEO)', dims: ['GEO', 'AEO', 'SEO'], status: 'ok', checks: [
      ...(ds.client.ai ? [
        site(ds.client.ai.blockedBots.length === 0, 'AI-краулери не заблоковані', `Відкрити в robots.txt: ${ds.client.ai.blockedBots.join(', ') || '—'} — інакше бренд невидимий в AI-відповідях`),
        site(ds.client.ai.llmsTxt, 'llms.txt (навігація для LLM)', 'Додати llms.txt у корінь — структурований покажчик ключового контенту для AI-систем'),
      ] : [blockedCheck('Доступ AI-краулерів / llms.txt', 'robots.txt не прочитано — перевіряється після передачі доступів')]),
      check('schema-product', 'Розмітка для вилучення фактів', 'JSON-LD Product/Offer — точність вилучення фактів LLM зростає з ~16% до ~54% (орієнтир)'),
      check('schema-crumbs', 'Структура для цитування', 'BreadcrumbList + чітка ієрархія заголовків — вища цитованість пасажів'),
    ] },
    { title: 'Мобільність', dims: ['MOB', 'A11Y'], status: 'ok', checks: [
      check('viewport', 'Viewport', 'Додати meta viewport для коректного мобільного рендеру'),
      { label: 'Тап-цілі ≥ 40px', passed: avgSmall <= 3 ? 1 : 0, total: 1, status: avgSmall <= 3 ? 'ok' : 'check', note: `~${avgSmall} дрібних/стор.`, rec: avgSmall <= 3 ? '—' : 'Збільшити клікабельні елементи до 40px (Thumb Zone)' },
      { label: 'Базовий кегль ≥ 14px', passed: minFont >= 14 ? 1 : 0, total: 1, status: minFont >= 14 ? 'ok' : 'check', note: `мін ${minFont}px`, rec: minFont >= 14 ? '—' : 'Підняти базовий шрифт до ≥14px для читабельності на мобільному' },
    ] },
    { title: 'Доступність і гігієна', dims: ['A11Y', 'TECH'], status: 'ok', checks: [
      check('alt', 'ALT у зображень', 'Проставити ALT ≥70% зображень'),
      check('lang', 'Атрибут lang', 'Задати lang у <html>'),
      check('charset', 'Charset', 'Вказати meta charset'),
      check('errors-soft', 'Немає тексту помилок у верстці', 'Прибрати видимі PHP/JS-помилки зі сторінок'),
      check('analytics', 'Аналітика (GA4/GTM/Pixel)', 'Встановити GA4/GTM — без подій воронку не виміряти'),
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
  const verdict = !pages.length ? 'Технічні перевірки недоступні — сайт не розібрано.'
    : gaps.length >= 4 ? 'Технічний фундамент із серйозними прогалинами: індексованість і розмітка потребують роботи.'
    : gaps.length ? 'Основа робоча, але є технічні прогалини, що знижують видимість.'
    : 'Технічно вітрина загалом здорова за зовнішніми ознаками.';

  return { client, takenAt: ds.takenAt, categories: cats, score: { passed, total, pct }, blocked, verdict };
}
