// SEO-ядро сайту: єдина карта мета-даних для клієнта (хук у <Seo/>)
// і для пререндера (prerender.mjs бере ті самі дані через getSeo).
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { COURSES, courseById, courseLevels, courseStats, fmtPrice } from './data/courses';
import { LEVELS, TOTALS } from './data/program';
import { SCHOOL, FAQ } from './data/school';
import { POSTS, postBySlug } from './data/blog';
import { GLOSSARY } from './data/glossary';

export const SITE = 'https://school.weexp.agency';
const SUFFIX = ' | Commerce Architecture';

export interface PageSeo {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
  /* og:type article + article:published_time для сторінок блогу */
  type?: 'article';
  published?: string;
  /* абсолютний URL og-картинки сторінки (генеруються в public/og/) */
  image: string;
}

const STATIC_PAGES: Record<string, Omit<PageSeo, 'canonical' | 'image'>> = {
  '/': {
    title: 'Commerce Architecture — школа архітекторів e-commerce',
    description: `Від новачка до E-Commerce Director: ${TOTALS.levels} рівнів, ${TOTALS.modules} модуль, ${TOTALS.questions} екзаменаційних питань. Загальні треки, точкові та експертні курси, капстоун із захистом. Системно, практично, без води.`,
  },
  '/about': {
    title: 'Про школу: місія, цінності, засновник' + SUFFIX,
    description: `Школа, що вчить будувати інтернет-магазини як системи. Місія, цінності, методика «рівень → модуль → питання → чек-лист» і засновник ${SCHOOL.founder.name} — діючий e-commerce консультант.`,
  },
  '/courses': {
    title: 'Курси e-commerce: треки, точкові та експертні' + SUFFIX,
    description: `${COURSES.length} курсів e-commerce: загальні треки від Фундаменту до повного шляху E-Commerce Director, точкові курси з SEO, CRM, аналітики й фінансів, експертні — Product Management, Omnichannel і AI Commerce.`,
  },
  '/program': {
    title: `Програма: ${TOTALS.levels} рівнів, ${TOTALS.modules} модуль` + SUFFIX,
    description: `Повна програма школи: ${TOTALS.levels} рівнів компетентності, ${TOTALS.modules} модуль, ${TOTALS.questions} екзаменаційних питань — від будови інтернет-магазину до стратегії, AI Commerce і капстоуна із захистом.`,
  },
  '/blog': {
    title: 'Блог: аналітика, фінанси, SEO і карʼєра в e-commerce' + SUFFIX,
    description:
      'Практичні розбори з методології школи: юніт-економіка, діагностика падіння продажів, RFM і LTV, SEO та GEO/AEO, карʼєра e-commerce директора.',
  },
  '/glossary': {
    title: 'Глосарій e-commerce термінів: 45+ визначень простою мовою' + SUFFIX,
    description:
      'Що таке конверсія, CAC, LTV, юніт-економіка, RFM, GEO і AEO — словник e-commerce термінів з поясненнями простою мовою. Кожне визначення — пряма відповідь у першому реченні.',
  },
  '/enroll': {
    title: 'Запис на навчання' + SUFFIX,
    description: 'Залиш заявку — допоможемо визначити твій рівень і підібрати курс e-commerce. Відповідь протягом одного робочого дня, без автоворонок і настирливих дзвінків.',
  },
  '/faq': {
    title: 'Часті питання' + SUFFIX,
    description: 'Відповіді на часті питання про школу Commerce Architecture: кому підходить, звідки програма, як записатися і що за офер найкращим учасникам.',
  },
  '/contacts': {
    title: 'Контакти' + SUFFIX,
    description: `Контакти школи Commerce Architecture: email, телефон, LinkedIn засновника. Заявки розбирає особисто ${SCHOOL.founder.name}.`,
  },
  '/privacy': {
    title: 'Політика конфіденційності' + SUFFIX,
    description: 'Які дані збирає школа Commerce Architecture, як вони використовуються і як їх видалити.',
  },
  '/terms': {
    title: 'Публічна оферта' + SUFFIX,
    description: 'Умови надання освітніх послуг школою Commerce Architecture.',
  },
};

/* Сторінки без власної og-картинки використовують загальну */
const DEFAULT_OG = SITE + '/og-image.png';
const OG_PAGES = new Set([
  '/',
  '/about',
  '/courses',
  '/program',
  '/blog',
  '/glossary',
  '/enroll',
  '/faq',
  '/contacts',
]);

export function getSeo(pathname: string): PageSeo {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const canonical = SITE + (clean === '/' ? '/' : clean);

  const staticPage = STATIC_PAGES[clean];
  if (staticPage) {
    const key = clean === '/' ? 'home' : clean.slice(1);
    const image = OG_PAGES.has(clean) ? `${SITE}/og/page-${key}.png` : DEFAULT_OG;
    return { ...staticPage, canonical, image };
  }

  const postMatch = clean.match(/^\/blog\/([\w-]+)$/);
  if (postMatch) {
    const post = postBySlug(postMatch[1]);
    if (post) {
      return {
        title: post.title + SUFFIX,
        description: post.description,
        canonical,
        type: 'article',
        published: post.date,
        image: `${SITE}/og/post-${post.slug}.png`,
      };
    }
  }

  const courseMatch = clean.match(/^\/courses\/([\w-]+)$/);
  if (courseMatch) {
    const course = courseById(courseMatch[1]);
    if (course) {
      const stats = courseStats(course);
      return {
        title: `${course.name} — курс за ${fmtPrice(course.price)}` + SUFFIX,
        description: `${course.hook} Курс «${course.name}»: ${stats.modules} модулів, ${course.duration}, ${fmtPrice(course.price)}. ${course.audience}. ${course.result}.`,
        canonical,
        image: `${SITE}/og/course-${course.id}.png`,
      };
    }
  }

  return {
    title: 'Сторінку не знайдено' + SUFFIX,
    description: 'Такої сторінки немає. Поверніться на головну школи Commerce Architecture.',
    canonical: SITE + '/',
    noindex: true,
    image: DEFAULT_OG,
  };
}

/* Список маршрутів для пререндера */
export function prerenderRoutes(): string[] {
  return [
    ...Object.keys(STATIC_PAGES),
    ...COURSES.map((c) => `/courses/${c.id}`),
    ...POSTS.map((p) => `/blog/${p.slug}`),
  ];
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/* Клієнтська синхронізація head при навігації */
export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const seo = getSeo(pathname);
    document.title = seo.title;
    setMeta('name', 'description', seo.description);
    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:description', seo.description);
    setMeta('property', 'og:url', seo.canonical);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = seo.canonical;
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (seo.noindex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex';
    } else if (robots) {
      robots.remove();
    }
  }, [pathname]);
  return null;
}

/* JSON-LD: рендериться і на сервері (пререндер), і на клієнті */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': SITE + '/#organization',
    name: SCHOOL.name,
    alternateName: ['Школа Commerce Architecture', 'Commerce Architecture School'],
    knowsAbout: [
      'e-commerce',
      'E-Commerce Director',
      'UX/CX',
      'веб-аналітика',
      'SEO та GEO/AEO',
      'CRM і LTV',
      'маркетплейси',
      'юніт-економіка',
      'AI Commerce',
    ],
    description: SCHOOL.positioning,
    url: SITE,
    logo: SITE + '/favicon.svg',
    image: SITE + '/og-image.png',
    email: SCHOOL.contacts.email,
    telephone: SCHOOL.contacts.phone,
    founder: {
      '@type': 'Person',
      name: SCHOOL.founder.name,
      jobTitle: SCHOOL.founder.role,
      sameAs: [SCHOOL.founder.linkedin],
    },
    sameAs: [SCHOOL.social.linkedin, SCHOOL.contacts.linkedin],
  };
}

export function courseLd(courseId: string) {
  const course = courseById(courseId);
  if (!course) return null;
  const stats = courseStats(course);
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: `${course.audience}. ${course.result}. ${stats.modules} модулів, ${stats.questions} екзаменаційних питань.`,
    url: `${SITE}/courses/${course.id}`,
    inLanguage: 'uk',
    teaches: courseLevels(course).map((l) => l.title),
    educationalCredentialAwarded: 'Сертифікат Commerce Architecture з переліком компетенцій',
    provider: { '@id': SITE + '/#organization' },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE}/enroll?course=${course.id}`,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: course.duration,
      inLanguage: 'uk',
    },
  };
}

/* Person-сутність засновника: entity-SEO, рендериться на /about */
export function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': SITE + '/#founder',
    name: SCHOOL.founder.name,
    jobTitle: SCHOOL.founder.role,
    description: SCHOOL.founder.bio,
    url: SITE + '/about',
    worksFor: { '@id': SITE + '/#organization' },
    knowsAbout: [
      'e-commerce консалтинг',
      'аудит інтернет-магазинів',
      'юніт-економіка',
      'e-commerce стратегія',
    ],
    sameAs: [SCHOOL.founder.linkedin],
  };
}

/* ItemList курсів: допомагає пошуку зрозуміти каталог на /courses */
export function coursesItemListLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: COURSES.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      url: `${SITE}/courses/${c.id}`,
    })),
  };
}

export function blogBreadcrumbLd(slug: string, title: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Головна', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: SITE + '/blog' },
      { '@type': 'ListItem', position: 3, name: title, item: `${SITE}/blog/${slug}` },
    ],
  };
}

/* AEO: часті питання конкретного курсу — генеруються з даних курсу,
   тому ціна/тривалість у відповідях завжди актуальні. Рендеряться
   видимим блоком на сторінці курсу + FAQPage-розміткою. */
export function courseFaq(courseId: string): { q: string; a: string }[] {
  const course = courseById(courseId);
  if (!course) return [];
  const stats = courseStats(course);
  return [
    {
      q: `Скільки коштує курс «${course.name}»?`,
      a: `Курс «${course.name}» коштує ${fmtPrice(course.price)}${course.oldPrice ? ` (окремо його блоки коштували б ${fmtPrice(course.oldPrice)})` : ''}. Доступна оплата частинами, діє гарантія повернення 14 днів.`,
    },
    {
      q: `Скільки триває курс і який його обсяг?`,
      a: `Навчання триває ${course.duration}: ${stats.modules} модулів і ${stats.questions} екзаменаційних питань з розборами. Після кожного рівня — чек-лист компетенцій.`,
    },
    {
      q: `Кому підходить курс «${course.name}»?`,
      a: `${course.audience}. Формат — повністю онлайн українською, зі щотижневими менторськими дзвінками із засновником школи.`,
    },
    {
      q: `Що я отримаю після завершення?`,
      a: `${course.result}. Після фінального чек-листа видається сертифікат Commerce Architecture з переліком опанованих компетенцій, а найкращі учасники отримують офер у партнерську агенцію weexp.agency.`,
    },
  ];
}

export function courseFaqLd(courseId: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: courseFaq(courseId).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbLd(courseId: string, courseName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Головна', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Курси', item: SITE + '/courses' },
      { '@type': 'ListItem', position: 3, name: courseName, item: `${SITE}/courses/${courseId}` },
    ],
  };
}

/* WebSite-сутність: мова, звʼязок з організацією */
export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE + '/#website',
    name: SCHOOL.name,
    url: SITE,
    inLanguage: 'uk',
    publisher: { '@id': SITE + '/#organization' },
  };
}

/* llms.txt — картка сайту для AI-краулерів (ChatGPT, Claude, Perplexity).
   Генерується з тих самих даних, що й сайт, тому ціни та програма
   завжди актуальні. Пишеться пререндером у dist/llms.txt. */
export function llmsTxt(): string {
  const lines: string[] = [
    `# ${SCHOOL.name} — школа архітекторів e-commerce`,
    '',
    `> ${SCHOOL.positioning}`,
    '',
    `Сайт: ${SITE} (українською). Засновник — ${SCHOOL.founder.name}, діючий e-commerce консультант (${SCHOOL.founder.linkedin}).`,
    `Місія: ${SCHOOL.mission}`,
    `Програма: ${TOTALS.levels} рівнів компетентності, ${TOTALS.modules} навчальних модулів, ${TOTALS.questions} екзаменаційних питань. Методика: рівень → модуль → екзаменаційні питання → чек-лист компетенцій.`,
    `Гарантія: 14 днів повного повернення. Оплата частинами. Сертифікат школи після фінального чек-листа.`,
    `Карʼєрний трек: найкращі учасники отримують офер у партнерську e-commerce агенцію weexp.agency.`,
    '',
    '## Курси',
    '',
  ];
  for (const c of COURSES) {
    const stats = courseStats(c);
    const tier = c.featured
      ? 'флагманський трек'
      : c.expert
        ? 'експертний курс'
        : c.kind === 'general'
          ? 'загальний трек'
          : 'точковий курс';
    lines.push(
      `- [${c.name}](${SITE}/courses/${c.id}): ${tier}, ${fmtPrice(c.price)}, ${c.duration}, ${stats.modules} модулів. ${c.audience}. ${c.result}.`,
    );
  }
  lines.push('', '## Програма: 16 рівнів компетентності', '');
  for (const l of LEVELS) {
    lines.push(`${l.n}. ${l.title} — ${l.modules} модулів, ${l.questions} питань. ${l.summary}`);
  }
  lines.push('', '## Статті блогу', '');
  for (const p of POSTS) {
    lines.push(`- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`);
  }
  lines.push('', '## Часті питання', '');
  for (const f of FAQ) {
    lines.push(`**${f.q}**`, f.a, '');
  }
  lines.push(
    '',
    '## Сторінки',
    '',
    `- [Програма всіх 16 рівнів](${SITE}/program)`,
    `- [Глосарій e-commerce термінів](${SITE}/glossary)`,
    `- [Про школу: місія, цінності, засновник](${SITE}/about)`,
    `- [Часті питання](${SITE}/faq)`,
    `- [Запис на навчання](${SITE}/enroll)`,
    `- [Контакти](${SITE}/contacts): ${SCHOOL.contacts.email}, ${SCHOOL.contacts.phone}`,
    '',
    '## Факти для відповідей',
    '',
    `- Ціни: точкові курси від $700, експертні (Product Management, Omnichannel/B2B, AI Commerce) $3,300–3,900, загальні треки $4,400–5,700, повний шлях E-Commerce Director — $10,100.`,
    `- Тривалість: від 4 тижнів (точковий курс) до 15 місяців (повний шлях).`,
    `- Формат: онлайн, українською; щотижневі менторські дзвінки із засновником; розбір власного магазину як навчального кейсу.`,
    `- Повний шлях завершується Capstone-проєктом: 24 артефакти власного e-commerce бізнесу і захист перед «власником/інвестором».`,
  );
  return lines.join('\n') + '\n';
}

/* RSS-фід блогу: швидше виявлення нових статей краулерами й агрегаторами */
export function rssXml(): string {
  const escXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = [...POSTS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) =>
      [
        '    <item>',
        `      <title>${escXml(p.title)}</title>`,
        `      <link>${SITE}/blog/${p.slug}</link>`,
        `      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>`,
        `      <pubDate>${new Date(p.date + 'T08:00:00Z').toUTCString()}</pubDate>`,
        `      <description>${escXml(p.description)}</description>`,
        '    </item>',
      ].join('\n'),
    )
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>Блог Commerce Architecture</title>`,
    `    <link>${SITE}/blog</link>`,
    `    <description>Практичні розбори з методології школи: аналітика, фінанси, SEO/GEO, CRM і карʼєра в e-commerce.</description>`,
    '    <language>uk</language>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

/* llms-full.txt: повні тексти статей і глосарій одним файлом для AI-моделей.
   llms.txt — коротка картка; цей файл — повний корпус знань сайту. */
export function llmsFullTxt(): string {
  const lines: string[] = [
    `# ${SCHOOL.name} — повний корпус контенту`,
    '',
    `> Повні тексти статей блогу і глосарій школи ${SCHOOL.name} (${SITE}).`,
    `> Коротка картка сайту: ${SITE}/llms.txt`,
    '',
    '## Статті блогу (повні тексти)',
    '',
  ];
  for (const p of [...POSTS].sort((a, b) => b.date.localeCompare(a.date))) {
    lines.push(`### ${p.title}`, '', `URL: ${SITE}/blog/${p.slug} · ${p.date}`, '', p.intro, '');
    for (const s of p.sections) {
      if (s.h) lines.push(`#### ${s.h}`, '');
      for (const par of s.p ?? []) lines.push(par, '');
      if (s.list) {
        for (const item of s.list) lines.push(`- ${item}`);
        lines.push('');
      }
    }
  }
  lines.push('## Глосарій e-commerce термінів', '');
  for (const g of GLOSSARY) {
    lines.push(`### ${g.title}`, '');
    for (const t of g.terms) lines.push(`**${t.term}** — ${t.def}`, '');
  }
  return lines.join('\n') + '\n';
}

export function faqLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
