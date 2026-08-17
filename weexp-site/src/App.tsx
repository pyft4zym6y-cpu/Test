import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RouteSeo } from '@/lib/seo';
import '@/lib/primitives.css';

// Плавний скрол до якоря (#systems тощо) при зміні хеша — для об'єднаних сторінок.
function ScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let tries = 0;
    const go = () => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (tries++ < 20) setTimeout(go, 120);   // чекаємо, поки lazy-секція змонтується
    };
    setTimeout(go, 80);
  }, [hash]);
  return null;
}

// Класичний (темний) Layout тягне framer-motion/lenis/gsap — вантажимо ліниво,
// щоб цей ваговий чанк не потрапляв у entry світлого v2 (де він не потрібен).
const Layout = lazy(() => import('@/Layout').then((m) => ({ default: m.Layout })));

// Усі маршрути — ліниво, щоб кожна сторінка тягла лише свій код, а не весь
// сайт наперед (three.js та важкі блоки головної не потрапляють на інші сторінки).
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const SystemPage = lazy(() => import('@/pages/SystemPage').then((m) => ({ default: m.SystemPage })));
const CaseDetail = lazy(() => import('@/pages/CaseDetail').then((m) => ({ default: m.CaseDetail })));
const FullDiagnosis = lazy(() => import('@/pages/FullDiagnosis').then((m) => ({ default: m.FullDiagnosis })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));
// Прев'ю нового напряму «The System in Motion» — поза темним Layout, повноекранне.
const SystemInMotion = lazy(() => import('@/system/SystemInMotion').then((m) => ({ default: m.SystemInMotion })));
const CasesFilm = lazy(() => import('@/system/CasesFilm').then((m) => ({ default: m.CasesFilm })));
const PeopleFilm = lazy(() => import('@/system/PeopleFilm').then((m) => ({ default: m.PeopleFilm })));
const ExpansionFilm = lazy(() => import('@/system/ExpansionFilm').then((m) => ({ default: m.ExpansionFilm })));
const ContactFilm = lazy(() => import('@/system/ContactFilm').then((m) => ({ default: m.ContactFilm })));
const SystemShell = lazy(() => import('@/system/SystemShell').then((m) => ({ default: m.SystemShell })));
const LossCalculator = lazy(() => import('@/system/LossCalculator').then((m) => ({ default: m.LossCalculator })));
const Cabinet = lazy(() => import('@/system/Cabinet').then((m) => ({ default: m.Cabinet })));

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <ScrollToHash />
      <Suspense fallback={null}>
        <Routes>
          {/* Новий cinematic-напрям — тепер головний вхід сайту, під спільною оболонкою.
              Попередній (темний) сайт лишається доступним на /classic для порівняння/відкату. */}
          <Route element={<SystemShell />}>
            <Route path="/" element={<SystemInMotion />} />
            <Route path="/system" element={<Navigate to="/" replace />} />
            {/* /systems об'єднано з головною — окремої сторінки більше немає (лише
                скрол-етап на «/»); старі посилання ведемо на якір головної. */}
            <Route path="/systems" element={<Navigate to="/#systems" replace />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/proof" element={<CasesFilm />} />
            <Route path="/people" element={<PeopleFilm />} />
            <Route path="/expansion" element={<ExpansionFilm />} />
            {/* Єдиний інструмент діагностики: калькулятор → карта → кабінет → Крок 4/5.
                /loss (стара окрема назва) веде сюди ж, щоб не було двох паралельних. */}
            <Route path="/diagnose" element={<LossCalculator />} />
            <Route path="/loss" element={<Navigate to="/diagnose" replace />} />
            <Route path="/contact" element={<ContactFilm />} />
          </Route>
          <Route element={<Layout />}>
            {/* Попередній (темний) головний — доступний для порівняння/відкату */}
            <Route path="/classic" element={<Home />} />
            {/* Усі темні входи зведені у світлий v2. Індекси → відповідні фільми,
                тематичні сторінки → найближчий v2-екран. Глибокі сторінки-деталі
                (система/кейс) та повна діагностика лишаються за прямим URL. */}
            <Route path="/challenges" element={<Navigate to="/systems" replace />} />
            <Route path="/challenges/:slug" element={<SystemPage />} />
            <Route path="/what-we-build" element={<Navigate to="/systems" replace />} />
            <Route path="/what-we-build/eu-expansion" element={<Navigate to="/systems" replace />} />
            <Route path="/how-it-works" element={<Navigate to="/systems" replace />} />
            <Route path="/how-it-works/business-health" element={<Navigate to="/diagnose" replace />} />
            <Route path="/how-it-works/independence-score" element={<Navigate to="/diagnose" replace />} />
            <Route path="/how-it-works/benchmark" element={<Navigate to="/diagnose" replace />} />
            <Route path="/cases" element={<Navigate to="/proof" replace />} />
            <Route path="/cases/:slug" element={<CaseDetail />} />
            <Route path="/intelligence" element={<Navigate to="/proof" replace />} />
            <Route path="/about" element={<Navigate to="/people" replace />} />
            <Route path="/about/founder" element={<Navigate to="/people" replace />} />
            <Route path="/about/team" element={<Navigate to="/people" replace />} />
            <Route path="/about/standard" element={<Navigate to="/people" replace />} />
            {/* /diagnose і /contact переїхали у світлий v2 (під SystemShell) */}
            <Route path="/diagnose/full" element={<FullDiagnosis />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
