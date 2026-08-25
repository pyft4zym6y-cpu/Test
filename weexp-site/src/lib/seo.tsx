import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';
import SEO_DATA from '@/lib/seo-data.json';

/**
 * Per-route SEO без зовнішніх залежностей. Оновлює <title>, description,
 * canonical, og/twitter і robots під конкретний маршрут — щоб кожна сторінка
 * була самостійною для пошуку й LLM, а не дублем головної.
 */
export const ORIGIN = 'https://weexp.agency';
const SUFFIX = ' · WEEXP';

function upsertMeta(attr: 'name' | 'property', key: string, value: string) {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}
function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}
function setRobots(noindex: boolean) {
  const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (noindex) {
    if (existing) existing.setAttribute('content', 'noindex, follow');
    else upsertMeta('name', 'robots', 'noindex, follow');
  } else if (existing) {
    existing.setAttribute('content', 'index, follow');
  }
}

function langOf(p: string) { return p === '/en' || p.startsWith('/en/') ? 'en' : 'uk'; }
function baseOf(p: string) { return p === '/en' ? '/' : p.startsWith('/en/') ? p.slice(3) : p; }
const clean = (p: string) => ORIGIN + (p === '/' ? '/' : p.replace(/\/$/, ''));

/** hreflang-альтернативи: UK ↔ EN для того самого маршруту + x-default (UK). */
function upsertAlternates(base: string) {
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  const uk = clean(base);
  const en = clean(base === '/' ? '/en' : '/en' + base);
  for (const [hl, href] of [['uk', uk], ['en', en], ['x-default', uk]] as const) {
    const l = document.createElement('link');
    l.setAttribute('rel', 'alternate'); l.setAttribute('hreflang', hl); l.setAttribute('href', href);
    document.head.appendChild(l);
  }
}

export function applySeo(title: string, description: string, path: string, noindex = false) {
  const lang = langOf(path);
  const canonical = clean(path);
  document.documentElement.lang = lang;
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertLink('canonical', canonical);
  upsertMeta('property', 'og:locale', lang === 'en' ? 'en_US' : 'uk_UA');
  upsertAlternates(baseOf(path));
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  setRobots(noindex);
}

/** Впорснути/оновити JSON-LD скрипт за id (для FAQPage, BreadcrumbList тощо). Знімається при демонтажі. */
export function useJsonLd(id: string, data: unknown | null) {
  useEffect(() => {
    const sid = 'jsonld-' + id;
    let el = document.getElementById(sid) as HTMLScriptElement | null;
    if (!data) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('script'); el.id = sid; el.type = 'application/ld+json'; document.head.appendChild(el); }
    el.textContent = JSON.stringify(data);
    return () => { const e = document.getElementById(sid); if (e) e.remove(); };
  }, [id, data]);
}

/** Хелпер для сторінок з динамічним заголовком (SystemPage, CaseDetail, NotFound). */
export function usePageSeo(title: string, description: string, path: string, noindex = false) {
  useEffect(() => { applySeo(title, description, path, noindex); }, [title, description, path, noindex]);
}

/** Таблиця meta для маршрутів — двомовна (uk/en). Ключ — базовий маршрут (без /en). */
type Meta2 = { uk: [string, string]; en: [string, string] };
const ES = ' · WEEXP';
// Таблиця мета — у seo-data.json, бо її ЧИТАЄ І ПРЕРЕНДЕР (scripts/prerender.mjs).
// Доти вони жили окремо і встигли розійтися: у статиці пакет аудиту був
// «19 артефактів», а в застосунку — «5 звітів». Одне джерело — одна правда.
type MetaJson = { uk: string[]; en: string[] };   // з JSON приходять масиви, не кортежі
const META: Record<string, MetaJson> = SEO_DATA.routes;
/** Мета підсторінок експертиз (/expansion/:slug) — раніше їх не було зовсім. */
const EXPANSION: Record<string, MetaJson> = SEO_DATA.expansion;

const UK_ONLY: Record<string, [string, string]> = {
  '/diagnose/full': [`Повна діагностика бізнесу${SUFFIX}`, 'Повна діагностика системи онлайн-продажів — 28 питань, збережений результат і розрив у грошах.'],
  '/loss': [`Діагностика e-commerce — скільки ви втрачаєте${SUFFIX}`, 'Порахуйте за 5 хвилин, скільки грошей витікає з вітрини щороку.'],
  '/classic': [`Класична версія${SUFFIX}`, 'Класична версія сайту WEEXP.'],
};

const NOINDEX = new Set(['/classic']);

/** Central route SEO: двомовний. Для /en/* бере EN-версію + hreflang (в applySeo). */
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const lang = langOf(pathname);
    const base = baseOf(pathname);
    const m2 = META[base];
    const expSlug = base.startsWith('/expansion/') ? base.slice('/expansion/'.length) : '';
    const mExp = expSlug ? EXPANSION[expSlug] : undefined;
    if (m2) applySeo(m2[lang][0], m2[lang][1], pathname, NOINDEX.has(base));
    else if (mExp) applySeo(mExp[lang][0], mExp[lang][1], pathname, false);
    else if (UK_ONLY[base]) applySeo(UK_ONLY[base][0], UK_ONLY[base][1], pathname, NOINDEX.has(base));
    track('page_view', { path: pathname });
  }, [pathname]);
  return null;
}
