// SEO-ядро сайту: єдина карта мета-даних для клієнта (хук у <Seo/>)
// і для пререндера (prerender.mjs бере ті самі дані через getSeo).
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { COURSES, courseById, courseStats, fmtPrice } from './data/courses';
import { TOTALS } from './data/program';
import { SCHOOL, FAQ } from './data/school';

export const SITE = 'https://school.weexp.agency';
const SUFFIX = ' | Commerce Architecture';

export interface PageSeo {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
}

const STATIC_PAGES: Record<string, Omit<PageSeo, 'canonical'>> = {
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

export function getSeo(pathname: string): PageSeo {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const canonical = SITE + (clean === '/' ? '/' : clean);

  const staticPage = STATIC_PAGES[clean];
  if (staticPage) return { ...staticPage, canonical };

  const courseMatch = clean.match(/^\/courses\/([\w-]+)$/);
  if (courseMatch) {
    const course = courseById(courseMatch[1]);
    if (course) {
      const stats = courseStats(course);
      return {
        title: `${course.name} — курс за ${fmtPrice(course.price)}` + SUFFIX,
        description: `${course.hook} Курс «${course.name}»: ${stats.modules} модулів, ${course.duration}, ${fmtPrice(course.price)}. ${course.audience}. ${course.result}.`,
        canonical,
      };
    }
  }

  return {
    title: 'Сторінку не знайдено' + SUFFIX,
    description: 'Такої сторінки немає. Поверніться на головну школи Commerce Architecture.',
    canonical: SITE + '/',
    noindex: true,
  };
}

/* Список маршрутів для пререндера */
export function prerenderRoutes(): string[] {
  return [...Object.keys(STATIC_PAGES), ...COURSES.map((c) => `/courses/${c.id}`)];
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
    name: SCHOOL.name,
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
    sameAs: [SCHOOL.contacts.linkedin],
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
    provider: {
      '@type': 'EducationalOrganization',
      name: SCHOOL.name,
      url: SITE,
    },
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
    },
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
