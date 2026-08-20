import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
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

// Легасі темний сайт (Layout + Home/CaseDetail/SystemPage/NotFound) виведено з
// ужитку: усі старі маршрути 301-редиректяться у світлий v2 (див. нижче + root
// vercel.json), щоб на сайті була ОДНА айдентика. Світла 404 — SystemNotFound.
const SystemInMotion = lazy(() => import('@/system/SystemInMotion').then((m) => ({ default: m.SystemInMotion })));
const SystemNotFound = lazy(() => import('@/system/SystemNotFound').then((m) => ({ default: m.SystemNotFound })));
const CasesFilm = lazy(() => import('@/system/CasesFilm').then((m) => ({ default: m.CasesFilm })));
const PeopleFilm = lazy(() => import('@/system/PeopleFilm').then((m) => ({ default: m.PeopleFilm })));
const ExpansionFilm = lazy(() => import('@/system/ExpansionFilm').then((m) => ({ default: m.ExpansionFilm })));
const ContactFilm = lazy(() => import('@/system/ContactFilm').then((m) => ({ default: m.ContactFilm })));
const SystemShell = lazy(() => import('@/system/SystemShell').then((m) => ({ default: m.SystemShell })));
const LossCalculator = lazy(() => import('@/system/LossCalculator').then((m) => ({ default: m.LossCalculator })));
const Cabinet = lazy(() => import('@/system/Cabinet').then((m) => ({ default: m.Cabinet })));
const ServicePage = lazy(() => import('@/system/ServicePage').then((m) => ({ default: m.ServicePage })));

// /challenges/:slug (легасі) → відповідна світла сторінка системи /systems/:slug
// (слаги збігаються), щоб зберегти глибокі посилання, а не кидати все на індекс.
function ChallengeRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/systems/${slug}` : '/#systems'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <ScrollToHash />
      <Suspense fallback={null}>
        <Routes>
          {/* Реальні сторінки — усі під спільною світлою оболонкою (одна айдентика). */}
          <Route element={<SystemShell />}>
            <Route path="/" element={<SystemInMotion />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/proof" element={<CasesFilm />} />
            <Route path="/people" element={<PeopleFilm />} />
            <Route path="/expansion" element={<ExpansionFilm />} />
            {/* Єдиний інструмент діагностики: калькулятор → карта → кабінет → Крок 4/5. */}
            <Route path="/diagnose" element={<LossCalculator />} />
            <Route path="/systems/:slug" element={<ServicePage />} />
            <Route path="/contact" element={<ContactFilm />} />
            {/* Світла 404 у тій же оболонці (шапка/крихти/підвал). */}
            <Route path="*" element={<SystemNotFound />} />
          </Route>

          {/* Клієнтські редиректи (дублюють 301 у root vercel.json — для SPA-навігації).
              Легасі темні маршрути ведуть у світлі аналоги; окремої тёмної айдентики немає. */}
          <Route path="/system" element={<Navigate to="/" replace />} />
          <Route path="/systems" element={<Navigate to="/#systems" replace />} />
          <Route path="/loss" element={<Navigate to="/diagnose" replace />} />
          <Route path="/classic" element={<Navigate to="/" replace />} />
          <Route path="/cases" element={<Navigate to="/proof" replace />} />
          <Route path="/cases/:slug" element={<Navigate to="/proof" replace />} />
          <Route path="/challenges" element={<Navigate to="/#systems" replace />} />
          <Route path="/challenges/:slug" element={<ChallengeRedirect />} />
          <Route path="/what-we-build" element={<Navigate to="/#systems" replace />} />
          <Route path="/what-we-build/eu-expansion" element={<Navigate to="/expansion" replace />} />
          <Route path="/how-it-works" element={<Navigate to="/#systems" replace />} />
          <Route path="/how-it-works/business-health" element={<Navigate to="/diagnose" replace />} />
          <Route path="/how-it-works/independence-score" element={<Navigate to="/diagnose" replace />} />
          <Route path="/how-it-works/benchmark" element={<Navigate to="/diagnose" replace />} />
          <Route path="/intelligence" element={<Navigate to="/proof" replace />} />
          <Route path="/about" element={<Navigate to="/people" replace />} />
          <Route path="/about/founder" element={<Navigate to="/people" replace />} />
          <Route path="/about/team" element={<Navigate to="/people" replace />} />
          <Route path="/about/standard" element={<Navigate to="/people" replace />} />
          <Route path="/diagnose/full" element={<Navigate to="/diagnose" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
