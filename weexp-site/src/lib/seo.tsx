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

/** Таблиця meta для статичних маршрутів. Заголовки — самопояснювальні. */
const META: Record<string, [string, string]> = {
  '/': ['WEEXP — Система замість героїзму',
    'Операційний партнер з e-commerce для українських виробників і D2C-брендів $0.5–10M: діагноз у грошах, побудова системи, вихід у ЄС.'],
  '/challenges': [`Виклики бізнесу — 7 систем${SUFFIX}`,
    'Сім систем онлайн-продажів і 15 доменів, у яких бізнес втрачає гроші. Знайдіть свій головний bottleneck.'],
  '/what-we-build': [`Що ми будуємо — від діагнозу до незалежності${SUFFIX}`,
    'Діагностика, побудова, масштабування і незалежність системи онлайн-продажів. Що саме отримує власник на кожному етапі.'],
  '/what-we-build/eu-expansion': [`Вихід у ЄС${SUFFIX}`,
    'Масштабування українського e-commerce на ринки Європи: підготовка системи, логістики, аналітики й команди.'],
  '/how-it-works': [`Метод WEEXP — як ми працюємо${SUFFIX}`,
    'Як влаштована робота WEEXP: діагноз у грошах, Business Health, Independence Score і побудова системи замість героїзму.'],
  '/about/standard': [`Стандарт WEEXP${SUFFIX}`,
    'Принципи й стандарт роботи WEEXP: як ми діагностуємо систему, а не симптом, і доводимо результат у грошах.'],
  '/cases': [`Кейси — трансформації бізнесу${SUFFIX}`,
    'Історії трансформації e-commerce за 7 системами бізнесу: діагноз, побудова, результат у цифрах.'],
  '/about': [`Агенція WEEXP${SUFFIX}`,
    'WEEXP — операційний партнер з e-commerce. Хто ми, у що віримо і чому діагностуємо систему, а не симптом.'],
  '/about/founder': [`Засновник WEEXP${SUFFIX}`,
    'Засновник WEEXP: досвід побудови систем онлайн-продажів для виробників і D2C-брендів.'],
  '/about/team': [`Команда WEEXP${SUFFIX}`,
    'Команда WEEXP — ролі й компетенції, що будують систему онлайн-продажів вашого бізнесу.'],
  '/diagnose': [`Business X-Ray — безкоштовний діагноз${SUFFIX}`,
    'Пройдіть Business X-Ray за 2 хвилини: Independence Score, здоровʼя по 7 системах і головний bottleneck — без реєстрації.'],
  '/diagnose/full': [`Повна діагностика бізнесу${SUFFIX}`,
    'Повна діагностика системи онлайн-продажів — 28 питань, збережений результат і розрив у грошах.'],
  '/contact': [`Контакт — запит на діагноз${SUFFIX}`,
    'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.'],
};

/** Central route SEO: покриває всі статичні маршрути; динамічні керують собою. */
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = META[pathname];
    if (m) applySeo(m[0], m[1], pathname);
    track('page_view', { path: pathname }); // SPA-навігація не шле page_view сама
  }, [pathname]);
  return null;
}
