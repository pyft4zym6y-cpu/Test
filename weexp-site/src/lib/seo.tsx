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

export function applySeo(title: string, description: string, path: string, noindex = false) {
  const canonical = ORIGIN + (path === '/' ? '/' : path.replace(/\/$/, ''));
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertLink('canonical', canonical);
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

/** Таблиця meta для реальних маршрутів v2. Заголовки — самопояснювальні. */
const META: Record<string, [string, string]> = {
  '/': ['WEEXP — Commerce OS: система замість героїзму',
    'Commerce OS для D2C та e-commerce брендів $0.5–10M: діагноз у грошах, побудова системи й вихід на ЄС/США — щоб виторг ріс без вас.'],
  '/systems': [`8 систем, у яких бізнес втрачає гроші${SUFFIX}`,
    'Вісім систем онлайн-продажів — від стратегії до експансії, під одним дахом. Знайдіть, де саме витікає виторг.'],
  '/proof': [`Докази — трансформації в цифрах${SUFFIX}`,
    'Флагманські кейси e-commerce: дельти до→після з CRM/ERP/GA4 — ×18 обороту, +65% продажів, ≥19 млн ₴ розриву. Не обіцянки, а числа.'],
  '/people': [`Люди — власник у кожної системи${SUFFIX}`,
    'Команда WEEXP структурована за системами: у кожної системи — свій власник. Систему будують власники, а не герої.'],
  '/expansion': [`Міжнародна експансія — ЄС і США${SUFFIX}`,
    'Системний вивід брендів на ЄС і США: власний сайт, Amazon, Allegro та локальні маркетплейси — з локалізацією, логістикою й юніт-економікою ринку.'],
  '/diagnose': [`Діагностика e-commerce — від числа до плану${SUFFIX}`,
    'Єдина діагностика онлайн-продажів: за 5 хвилин порахуйте втрати, отримайте карту 8 систем, головний bottleneck і кабінет із планом повернення виторгу.'],
  '/diagnose/full': [`Повна діагностика бізнесу${SUFFIX}`,
    'Повна діагностика системи онлайн-продажів — 28 питань, збережений результат і розрив у грошах.'],
  '/loss': [`Діагностика e-commerce — скільки ви втрачаєте${SUFFIX}`,
    'Порахуйте за 5 хвилин, скільки грошей витікає з вітрини щороку — перший крок єдиної діагностики: далі карта систем, кабінет і план.'],
  '/contact': [`Контакт — запит на діагноз${SUFFIX}`,
    'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.'],
  '/pricing': [`Формати та ціни${SUFFIX}`,
    'Три формати співпраці WEEXP — аудит, консалтинг і супровід, управління під ключ. Відкриті ціни; різниця — у тому, хто відповідає за результат.'],
  '/classic': [`Класична версія${SUFFIX}`, 'Класична версія сайту WEEXP.'],
};

/** Маршрути, що не мають індексуватися (дублі/архів). */
const NOINDEX = new Set(['/classic']);

/** Central route SEO: покриває всі статичні маршрути; динамічні керують собою. */
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = META[pathname];
    if (m) applySeo(m[0], m[1], pathname, NOINDEX.has(pathname));
    track('page_view', { path: pathname }); // SPA-навігація не шле page_view сама
  }, [pathname]);
  return null;
}
