import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import ProgramPage from './pages/ProgramPage';
import Enroll from './pages/Enroll';
import Faq from './pages/Faq';
import Contacts from './pages/Contacts';
import { Privacy, Terms } from './pages/Legal';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Прод — BrowserRouter (чисті URL для SEO, rewrites у vercel.json).
// Демо-збірка одним файлом — HashRouter: VITE_HASH_ROUTER=1 npm run build
const Router = import.meta.env.VITE_HASH_ROUTER === '1' ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="font-manrope min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/program" element={<ProgramPage />} />
            <Route path="/enroll" element={<Enroll />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
