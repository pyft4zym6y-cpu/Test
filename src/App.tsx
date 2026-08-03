import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import AssistantBot from './components/AssistantBot';
import Home from './pages/Home';
import ApproachPage from './pages/ApproachPage';
import AboutPage from './pages/AboutPage';
import SystemPage from './pages/SystemPage';
import ProductPage from './pages/ProductPage';
import ExpertisePage from './pages/ExpertisePage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ProcessPage from './pages/ProcessPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import { PrivacyPage, OfferPage } from './pages/LegalPages';
import BotVariantsPage from './pages/BotVariantsPage';
import NotFoundPage from './pages/NotFoundPage';
import { track } from './components/analytics';

const TITLES: Record<string, string> = {
  '/': 'weexp — Commerce OS · Growth & Engineering',
  '/approach': 'Підхід — weexp · Commerce OS',
  '/system': 'Система — weexp · Commerce OS',
  '/product': 'Продукт — weexp · Commerce OS',
  '/expertise': 'Експертиза — weexp · Commerce OS',
  '/cases': 'Кейси — weexp · Commerce OS',
  '/process': 'Процес — weexp · Commerce OS',
  '/services': 'Умови — weexp · Commerce OS',
  '/about': 'Про нас — weexp · Commerce OS',
  '/contact': 'Контакт — weexp · Commerce OS',
  '/privacy': 'Політика конфіденційності — weexp',
  '/offer': 'Публічна оферта — weexp',
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.title =
      TITLES[pathname] ??
      (pathname.startsWith('/cases/') ? 'Кейс — weexp · Commerce OS' : TITLES['/']);
    track('page_view', { page_path: pathname, page_title: document.title });
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
  }, [pathname]);
  return null;
}

function Shell() {
  return (
    <main style={{ background: '#fff', overflowX: 'clip' }}>
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/approach" element={<ApproachPage />} />
        <Route path="/system" element={<SystemPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/expertise" element={<ExpertisePage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:slug" element={<CaseDetailPage />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
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

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
