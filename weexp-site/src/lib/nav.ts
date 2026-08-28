/**
 * Назви сторінок — ОДНЕ джерело для меню, підвалу і хлібних крихт.
 *
 * Було три списки: NAV у SystemShell, NAV у SiteFooter (з коментарем
 * «тримаємо в синхроні з головним меню» — тобто руками) і словник L2 у
 * Breadcrumbs. Меню й підвал збіглися випадково, а крихти встигли розійтися:
 * відвідувач тиснув «Наші перемоги», а потрапляв на сторінку, де крихта каже
 * «Докази». Одна сторінка — три назви. Так само /people («Про нас» і
 * «Команда») та /pricing («Початок співпраці» і «Формати та ціни»).
 *
 * Тепер назва живе тут. Хто показує її — не має значення.
 */
export type PageName = { to: string; uk: string; en: string };

/** Порядок = порядок у головному меню. */
export const PAGES: PageName[] = [
  { to: '/', uk: 'Система', en: 'System' },
  { to: '/proof', uk: 'Наші перемоги', en: 'Our wins' },
  { to: '/expansion', uk: 'Експансія', en: 'Expansion' },
  { to: '/people', uk: 'Про нас', en: 'About' },
  { to: '/diagnose', uk: 'Express audit', en: 'Express audit' },
  { to: '/pricing', uk: 'Початок співпраці', en: 'Get started' },
  { to: '/contact', uk: 'Контакт', en: 'Contact' },
];

/** Сторінки поза головним меню, яким теж потрібна назва (крихти, підвал). */
export const EXTRA_PAGES: PageName[] = [
  { to: '/cabinet', uk: 'Кабінет', en: 'Cabinet' },
  { to: '/systems', uk: 'Системи', en: 'Systems' },
  { to: '/audit-pack', uk: 'Склад пакета аудиту', en: 'Audit pack contents' },
];

const ALL = [...PAGES, ...EXTRA_PAGES];

/** Назва сторінки за адресою. Порожній рядок, якщо адреси немає в переліку. */
export const nameOf = (to: string, lang: 'uk' | 'en'): string => {
  const p = ALL.find((x) => x.to === to);
  return p ? p[lang] : '';
};
