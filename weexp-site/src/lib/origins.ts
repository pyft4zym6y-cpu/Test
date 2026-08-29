/**
 * Два походження одного застосунку: сайт і ведення проєкту.
 *
 * Маркетинговий сайт і робочі екрани (кабінет клієнта + адмінка) жили за
 * одними адресами: weexp.agency/cabinet і weexp.agency/admin. Для відвідувача
 * це один продукт із дивними закутками, а для клієнта, якому дали посилання на
 * його проєкт, — сайт агенції, всередині якого десь є його дані.
 *
 * Тепер адреси розведені: сайт лишається на weexp.agency, ведення проєкту
 * живе на app.weexp.agency. Збірка одна — розводить маршрутизація за хостом
 * (root vercel.json) і цей модуль, який дає посиланням правильне походження.
 *
 * Чому одна збірка, а не два проєкти: API лежить на /api/* того самого
 * розгортання, тож на обох хостах воно лишається СВОЇМ — ні CORS, ні
 * розширення connect-src у CSP не потрібно. Повне розділення складань можна
 * зробити пізніше поверх цих адрес, не переробляючи їх.
 *
 * У розробці (localhost) хоста app.* немає: isAppHost() дає false, обидва
 * розділи доступні з одного походження, і жодних переходів між доменами не
 * відбувається — vercel.json у vite dev не працює.
 */

export const SITE_ORIGIN = 'https://weexp.agency';
export const APP_ORIGIN = 'https://app.weexp.agency';

/** Шляхи, які належать веденню проєкту (без урахування префікса мови). */
export const APP_PATHS = ['/cabinet', '/admin', '/manage'] as const;

/**
 * Розділи, які існують ЛИШЕ українською.
 *
 * Кабінет двомовний — /en/cabinet це справжній маршрут, і англомовний клієнт
 * має лишитись англійською. Адмінка одномовна за конвенцією: маршрута
 * /en/admin не існує, і мовний префікс на ній веде просто у 404 — саме так
 * менеджер з англійського кабінету туди й потрапляв.
 */
const UK_ONLY = ['/admin', '/manage'];

/** Прибрати мовний префікс, якщо в розділу немає англійської версії. */
export function normalizeAppPath(pathname: string): string {
  const bare = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return UK_ONLY.some((p) => bare === p || bare.startsWith(p + '/')) ? bare : pathname;
}

/** Чи є шлях частиною ведення проєкту (з /en-префіксом чи без). */
export function isAppPath(pathname: string): boolean {
  const p = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return APP_PATHS.some((a) => p === a || p.startsWith(a + '/'));
}

/**
 * Чи виконуємось ми на хості ведення проєкту.
 *
 * Перевіряємо ПІДДОМЕН, а не входження підрядка: 'app.weexp.agency.evil.com'
 * містить наш домен, але нашим хостом не є. У SSR/тестах window немає — там
 * false, і посилання будуються абсолютними, що коректно для обох випадків.
 */
export function isAppHost(host?: string): boolean {
  const h = host ?? (typeof window === 'undefined' ? '' : window.location.hostname);
  return h === 'app.weexp.agency';
}

/**
 * Посилання в межах ведення проєкту.
 *
 * На хості app.* лишається відносним (react-router переходить без
 * перезавантаження), з сайту — абсолютним на app.*. У розробці завжди
 * відносне: піддомену там немає, і абсолютне посилання вивело б з localhost на
 * прод — найнеприємніший вид «працює у мене».
 */
export function appHref(path: string): string {
  if (import.meta.env.DEV) return path;
  return isAppHost() ? path : APP_ORIGIN + path;
}

/** Посилання на сайт: з app.* — абсолютне, із самого сайту — відносне. */
export function siteHref(path: string): string {
  if (import.meta.env.DEV) return path;
  return isAppHost() ? SITE_ORIGIN + path : path;
}
