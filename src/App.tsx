import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import AssistantBot from './components/AssistantBot';
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import CommerceOsPage from './pages/CommerceOsPage';
import CooperationPage from './pages/CooperationPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ContactPage from './pages/ContactPage';
import { PrivacyPage, OfferPage } from './pages/LegalPages';
import CalculatorPage from './pages/CalculatorPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import EstimatePage from './pages/EstimatePage';
import BotVariantsPage from './pages/BotVariantsPage';
import NotFoundPage from './pages/NotFoundPage';
import { track } from './components/analytics';

const TITLES: Record<string, string> = {
  '/': 'weexp — Commerce OS · Growth & Engineering',
  '/os': 'Commerce OS — weexp · підхід, система, продукт',
  '/cases': 'Кейси — weexp · Commerce OS',
  '/services': 'Співпраця — weexp · аудит, консалтинг, управління',
  '/about': 'Про нас — weexp · Commerce OS',
  '/blog': 'Блог — weexp · практика e-commerce в цифрах',
  '/contact': 'Контакт — weexp · Commerce OS',
  '/calculator': 'Калькулятор недоотриманого обороту — weexp',
  '/estimate': 'Оцінка проєкту — weexp',
  '/privacy': 'Політика конфіденційності — weexp',
  '/offer': 'Публічна оферта — weexp',
};

const DESCRIPTIONS: Record<string, string> = {
  '/': 'weexp — команда, що будує e-commerce як актив. Commerce OS: аудит у грошах, система росту і кейси ×18 обороту.',
  '/os': 'Commerce OS: чому реклама більше не рятує, як влаштована система з 12 модулів і 56 плейбуків, і що саме ви купуєте.',
  '/cases': 'Пʼять кейсів e-commerce із цифрами: ×18 обороту, +96% виручки, LTV ×4.2, знайдені ≥19 млн ₴ розриву.',
  '/services': 'Три формати співпраці: аудит із фіксованою ціною, консалтинг і управління проєктом під ключ. Ціни відкриті.',
  '/calculator': 'Безкоштовний калькулятор недоотриманого обороту: 8 питань — і розрив вашого магазину в гривнях.',
  '/estimate': 'Оцінка вартості преміум-сайту: інтерактивний калькулятор бюджету проєкту.',
  '/about': 'Хто будує Commerce OS: команда, досвід у брендах від Henkel до Rozetka, підхід «актив, а не витрати».',
  '/blog': 'Блог weexp: конверсія, retention, юніт-економіка, SEO і AI для e-commerce — з нормами, формулами і кейсами.',
  '/contact': 'Звʼязатися з weexp: 30-хвилинна стратегічна сесія про ріст вашого e-commerce.',
};

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // редіректи зі старих URL приходять із якорем — доскролюємо до блоку
      requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    document.title =
      TITLES[pathname] ??
      (pathname.startsWith('/cases/')
        ? 'Кейс — weexp · Commerce OS'
        : pathname.startsWith('/blog/')
          ? document.title // статтю підписує BlogPostPage
          : TITLES['/']);
    track('page_view', { page_path: pathname, page_title: document.title });
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) canonical.href = `https://weexp.agency${pathname === '/' ? '/' : pathname}`;
    // SEO: опис і og-теги під кожен маршрут
    const desc = DESCRIPTIONS[pathname] ?? DESCRIPTIONS['/'];
    const setMeta = (sel: string, val: string) => {
      const el = document.querySelector(sel) as HTMLMetaElement | null;
      if (el) el.content = val;
    };
    if (!pathname.startsWith('/blog/')) setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', document.title);
    if (!pathname.startsWith('/blog/')) setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:url"]', `https://weexp.agency${pathname === '/' ? '/' : pathname}`);
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (pathname === '/bot-variants') {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex';
    } else if (robots) {
      robots.remove();
    }
  }, [pathname, hash]);
  return null;
}

function Shell() {
  return (
    <main style={{ background: '#fff', overflowX: 'clip' }}>
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/os" element={<CommerceOsPage />} />
        {/* Старі URL живуть як редіректи на блоки обʼєднаних сторінок */}
        <Route path="/approach" element={<Navigate to={{ pathname: '/os', hash: '#why' }} replace />} />
        <Route path="/system" element={<Navigate to={{ pathname: '/os', hash: '#system' }} replace />} />
        <Route path="/product" element={<Navigate to={{ pathname: '/os', hash: '#product' }} replace />} />
        <Route path="/expertise" element={<Navigate to={{ pathname: '/os', hash: '#expertise' }} replace />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:slug" element={<CaseDetailPage />} />
        <Route path="/process" element={<Navigate to={{ pathname: '/services', hash: '#process' }} replace />} />
        <Route path="/services" element={<CooperationPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/estimate" element={<EstimatePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/offer" element={<OfferPage />} />
        <Route path="/bot-variants" element={<BotVariantsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <AssistantBot />
    </main>
  );
}

/*
 * Хостинг (Vercel/Netlify/Apache) — BrowserRouter, чисті URL без «#»;
 * артефакт-збірка (vite.artifact.config.ts) — HashRouter, бо сторінка
 * живе за одним URL без серверних rewrite.
 */
declare const __ARTIFACT_BUILD__: boolean;
const Router = __ARTIFACT_BUILD__ ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}
