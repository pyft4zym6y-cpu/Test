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
  '/': ['WEEXP — Система замість героїзму',
    'Операційний партнер з e-commerce для українських виробників і D2C-брендів $0.5–10M: діагноз у грошах, побудова системи, вихід на ринки ЄС і США — і залишаємо все працювати без вас.'],
  '/systems': [`7 систем, у яких бізнес втрачає гроші${SUFFIX}`,
    'Сім систем онлайн-продажів — від стратегії до організації. Веб-розробка, ERP-автоматизація, UX/UI та CRO, SEO й аналітика під одним дахом. Знайдіть, де витікає виторг.'],
  '/proof': [`Докази — трансформації в цифрах${SUFFIX}`,
    'Флагманські кейси e-commerce: дельти до→після з CRM/ERP/GA4 — ×18 обороту, +65% продажів, ≥19 млн ₴ розриву. Не обіцянки, а числа.'],
  '/people': [`Люди — власник у кожної системи${SUFFIX}`,
    'Команда WEEXP структурована за системами: у кожної із семи систем — свій власник. Систему будують власники, а не герої.'],
  '/expansion': [`Міжнародна експансія — ЄС і США${SUFFIX}`,
    'Системний вивід брендів на ринки ЄС і США: власний сайт, Amazon, Allegro, eBay та локальні маркетплейси — з локалізацією, логістикою, юридичним контуром і юніт-економікою ринку.'],
  '/diagnose': [`Business X-Ray — безкоштовний діагноз${SUFFIX}`,
    'Пройдіть Business X-Ray за 2 хвилини: Independence Score, здоровʼя по 7 системах і головний bottleneck — без реєстрації.'],
  '/diagnose/full': [`Повна діагностика бізнесу${SUFFIX}`,
    'Повна діагностика системи онлайн-продажів — 28 питань, збережений результат і розрив у грошах.'],
  '/loss': [`Калькулятор витрат — скільки ви втрачаєте${SUFFIX}`,
    'Порахуйте за 5 хвилин, скільки грошей витікає з вітрини щороку — оцінка за вашими даними й бенчмарками. Крок 1 до повної діагностики.'],
  '/contact': [`Контакт — запит на діагноз${SUFFIX}`,
    'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.'],
  '/classic': [`WEEXP${SUFFIX}`, 'Класична версія сайту WEEXP.'],
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
