import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';

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

/** Хелпер для сторінок з динамічним заголовком (SystemPage, CaseDetail, NotFound). */
export function usePageSeo(title: string, description: string, path: string, noindex = false) {
  useEffect(() => { applySeo(title, description, path, noindex); }, [title, description, path, noindex]);
}

/** Таблиця meta для маршрутів — двомовна (uk/en). Ключ — базовий маршрут (без /en). */
type Meta2 = { uk: [string, string]; en: [string, string] };
const ES = ' · WEEXP';
const META: Record<string, Meta2> = {
  '/': {
    uk: ['WEEXP — Commerce OS: система замість героїзму',
      'Commerce OS для D2C та e-commerce брендів $0.5–10M: діагноз у грошах, побудова системи й вихід на ЄС/США — щоб виторг ріс без вас.'],
    en: ['WEEXP — Commerce OS: a system instead of heroics',
      'Commerce OS for D2C & e-commerce brands $0.5–10M: a diagnosis in money, building the system and expansion to the EU/US — so revenue grows without you.'],
  },
  '/systems': {
    uk: [`8 систем, у яких бізнес втрачає гроші${SUFFIX}`, 'Вісім систем онлайн-продажів — від стратегії до експансії, під одним дахом. Знайдіть, де саме витікає виторг.'],
    en: [`8 systems where your business leaks money${ES}`, 'Eight online-sales systems — from strategy to expansion, under one roof. Find exactly where revenue leaks.'],
  },
  '/proof': {
    uk: [`Докази — трансформації в цифрах${SUFFIX}`, 'Флагманські кейси e-commerce: дельти до→після з CRM/ERP/GA4 — ×18 обороту, +65% продажів, ≥19 млн ₴ розриву. Не обіцянки, а числа.'],
    en: [`Proof — transformations in numbers${ES}`, 'Flagship e-commerce cases: before→after deltas verified with CRM/ERP/GA4 — ×18 revenue, +65% sales. Not promises — numbers.'],
  },
  '/people': {
    uk: [`Люди — власник у кожної системи${SUFFIX}`, 'Команда WEEXP структурована за системами: у кожної системи — свій власник. Систему будують власники, а не герої.'],
    en: [`Team — an owner for every system${ES}`, 'WEEXP is structured by systems: every system has its owner. Systems are built by owners, not heroes.'],
  },
  '/expansion': {
    uk: [`Міжнародна експансія — ЄС і США${SUFFIX}`, 'Системний вивід брендів на ЄС і США: власний сайт, Amazon, Allegro та локальні маркетплейси — з локалізацією, логістикою й юніт-економікою ринку.'],
    en: [`International expansion — EU & US${ES}`, 'Systematic brand launch into the EU & US: own site, Amazon, Allegro and local marketplaces — with localization, logistics and market unit economics.'],
  },
  '/diagnose': {
    uk: [`Діагностика e-commerce — від числа до плану${SUFFIX}`, 'Єдина діагностика онлайн-продажів: за 5 хвилин порахуйте втрати, отримайте карту 8 систем, головний bottleneck і кабінет із планом повернення виторгу.'],
    en: [`E-commerce diagnostics — from a number to a plan${ES}`, 'One diagnostic for online sales: in 5 minutes estimate your losses, get the 8-system map, your main bottleneck and a cabinet with a plan to recover revenue.'],
  },
  '/contact': {
    uk: [`Контакт — запит на діагноз${SUFFIX}`, 'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.'],
    en: [`Contact — request a diagnosis${ES}`, 'Leave your contact — we come back with a diagnosis plan in money. For e-commerce makers and D2C brands $0.5–10M.'],
  },
  '/pricing': {
    uk: [`Формати та ціни${SUFFIX}`, 'Три формати співпраці WEEXP — аудит, консалтинг і супровід, управління під ключ. Відкриті ціни; різниця — у тому, хто відповідає за результат.'],
    en: [`Pricing & formats${ES}`, 'Three ways to work with WEEXP — audit, consulting & advisory, managed delivery. Open prices; the difference is who owns the result.'],
  },
};
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
    if (m2) applySeo(m2[lang][0], m2[lang][1], pathname, NOINDEX.has(base));
    else if (UK_ONLY[base]) applySeo(UK_ONLY[base][0], UK_ONLY[base][1], pathname, NOINDEX.has(base));
    track('page_view', { path: pathname });
  }, [pathname]);
  return null;
}
