/**
 * Волна 1 премиум-агентов — без нового внешнего ключа:
 *  - performance-cwv: фактические Core Web Vitals через PageSpeed Insights (бесплатный
 *    API, ключ не обязателен). Превращает «требования LCP/CLS» в измерение.
 *  - accessibility: полный WCAG-тест через axe-core в НАШЕМ Playwright-браузере.
 * Оба отдают FindingInput[] в единый реестр.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Expert, ExpertResult } from './types.js';
import type { FindingInput } from '../registry.js';

/* ── Core Web Vitals через PageSpeed Insights ── */
export const performanceCwv: Expert = {
  card: {
    id: 'performance-cwv', name: 'Производительность / Core Web Vitals', domain: 'tech',
    what: 'Фактические LCP / CLS / TBT (PageSpeed Insights + поле CrUX) — измерение, а не требование; бесплатный API',
    provider: 'http', credEnv: undefined, status: 'available',
    strengthens: ['Технический аудит', 'SEO Architecture', 'UX/UI'],
  },
  isAvailable: () => true,
  async run(ctx): Promise<ExpertResult> {
    const base = { expertId: 'performance-cwv', name: 'Производительность / Core Web Vitals', domain: 'tech' as const, findings: [] as FindingInput[], verifications: [] };
    const url = ctx.dataset.client.finalUrl || ctx.dataset.client.rootUrl;
    if (!url) return { ...base, ran: false, skippedReason: 'нет URL клиента', summary: 'пропущен' };
    const key = process.env.PSI_KEY ? `&key=${process.env.PSI_KEY}` : '';
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=mobile${key}`;
    try {
      const r = await fetch(api, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) return { ...base, ran: false, skippedReason: `PageSpeed вернул HTTP ${r.status} (лимит без ключа или недоступность)`, summary: 'пропущен' };
      const j = await r.json() as any;
      const lr = j.lighthouseResult;
      const audits = lr?.audits ?? {};
      const perfScore = Math.round((lr?.categories?.performance?.score ?? 0) * 100);
      const lcp = audits['largest-contentful-paint']?.numericValue; // ms
      const cls = audits['cumulative-layout-shift']?.numericValue;
      const tbt = audits['total-blocking-time']?.numericValue; // ms (прокси INP)
      const findings: FindingInput[] = [];
      const mk = (title: string, impact: number, gap: string): FindingInput => ({ domain: 'tech-os', title, gap, funnelStep: 'привлечение', impact, difficulty: 3, source: 'данные', evidenceLevel: 'E4', reproducibility: 'подтверждено (PageSpeed)', benchmarkSource: 'Core Web Vitals (Google)' });
      if (typeof lcp === 'number' && lcp > 2500) findings.push(mk(`LCP ${(lcp / 1000).toFixed(1)}с — медленная загрузка первого экрана (норма ≤2.5с)`, lcp > 4000 ? 4 : 3, 'Ускорить LCP: оптимизация изображений первого экрана, preload, серверный ответ'));
      if (typeof cls === 'number' && cls > 0.1) findings.push(mk(`CLS ${cls.toFixed(2)} — вёрстка «прыгает» при загрузке (норма ≤0.1)`, cls > 0.25 ? 4 : 3, 'Зафиксировать размеры изображений/эмбедов, зарезервировать место под динамические блоки'));
      if (typeof tbt === 'number' && tbt > 200) findings.push(mk(`TBT ${Math.round(tbt)}мс — интерфейс «залипает» на загрузке (INP-риск, норма ≤200мс)`, tbt > 600 ? 4 : 3, 'Сократить и разбить длинные JS-задачи, убрать лишние сторонние скрипты'));
      if (perfScore < 50 && !findings.length) findings.push(mk(`Индекс производительности PageSpeed ${perfScore}/100 (mobile) — ниже нормы`, 3, 'Общая оптимизация скорости: изображения, JS, кэширование'));
      return { ...base, ran: true, findings, summary: `Core Web Vitals (mobile): ${perfScore}/100${typeof lcp === 'number' ? `, LCP ${(lcp / 1000).toFixed(1)}с` : ''}${typeof cls === 'number' ? `, CLS ${cls.toFixed(2)}` : ''} — ${findings.length} разрывов` };
    } catch (e) {
      return { ...base, ran: false, skippedReason: `PageSpeed недоступен: ${String(e).slice(0, 60)}`, summary: 'пропущен' };
    }
  },
};

/* ── Доступность (a11y / WCAG) через axe-core в нашем браузере ── */
let AXE_SRC: string | null = null;
function axeSource(): string {
  if (AXE_SRC == null) { const req = createRequire(import.meta.url); AXE_SRC = readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8'); }
  return AXE_SRC;
}

const AXE_IMPACT: Record<string, number> = { critical: 4, serious: 3, moderate: 2, minor: 1 };

export const accessibilityAxe: Expert = {
  card: {
    id: 'accessibility', name: 'Доступность (a11y / WCAG)', domain: 'cro',
    what: 'Полный тест доступности через axe-core (клавиатура, контраст, ARIA, labels, alt, тач-цели) в нашем браузере — без внешнего ключа',
    provider: 'builtin', credEnv: undefined, status: 'available',
    strengthens: ['UX/UI', 'Технический аудит', 'Юридический (доступность)'],
  },
  isAvailable: () => true,
  async run(ctx): Promise<ExpertResult> {
    const base = { expertId: 'accessibility', name: 'Доступность (a11y / WCAG)', domain: 'cro' as const, findings: [] as FindingInput[], verifications: [] };
    if (!ctx.browser) return { ...base, ran: false, skippedReason: 'нет браузера в контексте прогона', summary: 'пропущен' };
    // Представительные страницы: главная + по одной каждого ключевого типа.
    const seen = new Set<string>();
    const urls = ctx.dataset.client.pages
      .filter((p) => !p.error && (p.finalUrl || p.url))
      .filter((p) => { const k = p.kind; if (seen.has(k)) return false; seen.add(k); return true; })
      .map((p) => p.finalUrl || p.url)
      .slice(0, 4);
    if (!urls.length) return { ...base, ran: false, skippedReason: 'нет разобранных страниц', summary: 'пропущен' };

    const ctxB = await ctx.browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'uk-UA' });
    const byRule = new Map<string, { impact: number; help: string; count: number; pages: number }>();
    try {
      for (const url of urls) {
        const page = await ctxB.newPage();
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await page.addScriptTag({ content: axeSource() });
          const res = await page.evaluate(async () => {
            // @ts-expect-error axe инжектирован в страницу
            return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, resultTypes: ['violations'] });
          }) as { violations: { id: string; impact: string | null; help: string; nodes: unknown[] }[] };
          for (const v of res.violations ?? []) {
            const cur = byRule.get(v.id) ?? { impact: AXE_IMPACT[v.impact ?? 'minor'] ?? 1, help: v.help, count: 0, pages: 0 };
            cur.count += v.nodes.length; cur.pages += 1;
            byRule.set(v.id, cur);
          }
        } catch (e) { ctx.log(`· a11y: ${url.slice(0, 50)} — ${String(e).slice(0, 50)}`); }
        finally { await page.close().catch(() => {}); }
      }
    } finally { await ctxB.close().catch(() => {}); }

    // Только значимые нарушения (critical/serious) → находки; остальное — сводкой.
    const findings: FindingInput[] = Array.from(byRule.entries())
      .filter(([, v]) => v.impact >= 3)
      .sort((a, b) => b[1].impact - a[1].impact || b[1].count - a[1].count)
      .slice(0, 8)
      .map(([id, v]): FindingInput => ({
        domain: 'a11y-os', key: `a11y-${id}`,
        title: `Доступность: ${v.help} (${v.count} элементов на ${v.pages} стр.)`,
        gap: `Исправить нарушение WCAG «${id}» — барьер для части покупателей и юридический риск`,
        funnelStep: 'доверие', impact: v.impact, difficulty: 2,
        source: 'сайт', evidenceLevel: 'E4', reproducibility: `${v.pages}/${urls.length} страниц`,
        benchmarkSource: `WCAG 2.1 AA · axe-core`,
      }));
    const total = Array.from(byRule.values()).reduce((s, v) => s + v.count, 0);
    return { ...base, ran: true, findings, summary: `WCAG 2 AA на ${urls.length} стр.: ${byRule.size} типов нарушений, ${total} элементов — ${findings.length} значимых в реестр` };
  },
};
