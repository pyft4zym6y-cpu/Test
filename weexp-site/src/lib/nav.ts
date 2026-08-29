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
/**
 * Правило про англійські слова в українському інтерфейсі.
 *
 * Англійською лишаються НАЗВИ й галузеві терміни, якими аудиторія користується
 * англійською в роботі: Express Audit, Commerce OS, Health Score, Data &
 * Growth, E-commerce Technology, CRO, GA4, CRM, ERP, NDA, DoD, RACI, KPI.
 * Усе інше — українською.
 *
 * Раніше правила не було видно: частина термінів була перекладена, частина ні,
 * а дві підписи кнопок узагалі стояли англійською без t() і показувались так
 * на українській версії. Тепер це рішення, а не випадковість.
 */
export type PageName = { to: string; uk: string; en: string };

/** Порядок = порядок у головному меню. */
export const PAGES: PageName[] = [
  // Була «Система» — і поруч зʼявилась «Системи» (перелік восьми). Два пункти,
  // які не розрізнити з першого погляду. Головна тепер називається так само,
  // як її вже називала хлібна крихта.
  { to: '/', uk: 'Головна', en: 'Home' },
  // Вісім сторінок систем були замкненим кільцем без входу ззовні. Тепер у них
  // є батьківська сторінка й пункт меню — шлях, а не тільки пошук.
  // Вісім сторінок систем були замкненим кільцем без входу ззовні. Тепер у них
  // є батьківська сторінка й пункт меню — шлях, а не тільки пошук.
  { to: '/systems', uk: 'Системи', en: 'Systems' },
  { to: '/proof', uk: 'Наші перемоги', en: 'Our wins' },
  // Пункт називався «Експансія» й обіцяв міжнародний вихід, а сторінка показує
  // шість напрямів експертизи, з яких експансія — лише один. Гірше: назва
  // збігалась із системою «Експансія та ринки», у якої є власна сторінка, —
  // людина тиснула й потрапляла не туди. Назва тепер за змістом.
  { to: '/expansion', uk: 'Експертизи', en: 'Expertise' },
  { to: '/people', uk: 'Про нас', en: 'About' },
  { to: '/diagnose', uk: 'Express audit', en: 'Express audit' },
  // Було «Початок співпраці» — 17 символів, найдовший пункт меню, через який
  // рядок і не вміщався. Сторінка про ціни й формати; «Ціни» — те слово, яке
  // людина шукає очима.
  { to: '/pricing', uk: 'Ціни', en: 'Pricing' },
  { to: '/contact', uk: 'Контакт', en: 'Contact' },
];

/** Сторінки поза головним меню, яким теж потрібна назва (крихти, підвал). */
export const EXTRA_PAGES: PageName[] = [
  { to: '/cabinet', uk: 'Кабінет', en: 'Cabinet' },
  { to: '/audit-pack', uk: 'Склад пакета аудиту', en: 'Audit pack contents' },
];

/**
 * Короткі назви підсторінок систем і експертиз.
 *
 * Потрібні там, де на сторінку треба ПОСЛАТИСЬ підписом кнопки — зокрема в
 * блозі. Повні заголовки («Комерційна ефективність», «Міжнародна експансія»)
 * у кнопку на телефоні не вміщаються, а слуг у підписі не каже читачеві
 * нічого: перша версія блоку виводила «Commercial performance» — англійською,
 * на українській сторінці, бо назва виводилась із адреси.
 *
 * Джерело назв — xray.ts (SHORT) і expertises.ts (title). Тут вони продубльовані
 * навмисно: обидва модулі важкі (17 і 34 КБ окремими чанками), і тягнути їх на
 * сторінку статті заради двох слів немає сенсу. Щоб дубль не розійшовся з
 * джерелом, його звіряє тест wording.test.ts — це і є ціна цього рішення.
 */
export const SUB_PAGES: PageName[] = [
  { to: '/systems/strategy-management', uk: 'Стратегія', en: 'Strategy' },
  { to: '/systems/commercial-performance', uk: 'Комерція', en: 'Commerce' },
  { to: '/systems/demand-customer', uk: 'Клієнт', en: 'Customer' },
  { to: '/systems/experience-conversion', uk: 'Досвід', en: 'Experience' },
  { to: '/systems/operations-fulfillment', uk: 'Операції', en: 'Operations' },
  { to: '/systems/data-technology', uk: 'Дані', en: 'Data' },
  { to: '/systems/organization-operating-model', uk: 'Організація', en: 'Organization' },
  { to: '/systems/expansion-markets', uk: 'Експансія', en: 'Expansion' },
  { to: '/expansion/international', uk: 'Міжнародна експансія', en: 'International expansion' },
  { to: '/expansion/automation', uk: 'Бізнес-процеси', en: 'Business processes' },
  { to: '/expansion/branding', uk: 'Брендинг', en: 'Branding' },
  { to: '/expansion/ux-ui', uk: 'UX/UI дизайн', en: 'UX/UI design' },
  { to: '/expansion/web-development', uk: 'Веб-розробка', en: 'Web development' },
  { to: '/expansion/technology', uk: 'E-commerce Technology', en: 'E-commerce Technology' },
  { to: '/expansion/marketing', uk: 'Маркетинг', en: 'Marketing' },
  { to: '/expansion/sales-channels', uk: 'Канали продажів', en: 'Sales channels' },
  { to: '/expansion/data-growth', uk: 'Data & Growth', en: 'Data & Growth' },
  { to: '/blog', uk: 'Блог', en: 'Blog' },
];

const ALL = [...PAGES, ...EXTRA_PAGES, ...SUB_PAGES];

/** Назва сторінки за адресою. Порожній рядок, якщо адреси немає в переліку. */
export const nameOf = (to: string, lang: 'uk' | 'en'): string => {
  const p = ALL.find((x) => x.to === to);
  return p ? p[lang] : '';
};
