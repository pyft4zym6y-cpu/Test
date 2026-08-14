import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/Layout';
import { RouteSeo } from '@/lib/seo';
import '@/lib/primitives.css';

// Усі маршрути — ліниво, щоб кожна сторінка тягла лише свій код, а не весь
// сайт наперед (three.js та важкі блоки головної не потрапляють на інші сторінки).
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const SystemPage = lazy(() => import('@/pages/SystemPage').then((m) => ({ default: m.SystemPage })));
const WhatWeBuild = lazy(() => import('@/pages/WhatWeBuild').then((m) => ({ default: m.WhatWeBuild })));
const EuExpansion = lazy(() => import('@/pages/EuExpansion').then((m) => ({ default: m.EuExpansion })));
const CasesPage = lazy(() => import('@/pages/CasesPage').then((m) => ({ default: m.CasesPage })));
const CaseDetail = lazy(() => import('@/pages/CaseDetail').then((m) => ({ default: m.CaseDetail })));
const About = lazy(() => import('@/pages/About').then((m) => ({ default: m.About })));
const FounderPage = lazy(() => import('@/pages/FounderPage').then((m) => ({ default: m.FounderPage })));
const FullDiagnosis = lazy(() => import('@/pages/FullDiagnosis').then((m) => ({ default: m.FullDiagnosis })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));
// Прев'ю нового напряму «The System in Motion» — поза темним Layout, повноекранне.
const SystemInMotion = lazy(() => import('@/system/SystemInMotion').then((m) => ({ default: m.SystemInMotion })));
const SystemsFilm = lazy(() => import('@/system/SystemsFilm').then((m) => ({ default: m.SystemsFilm })));
const CasesFilm = lazy(() => import('@/system/CasesFilm').then((m) => ({ default: m.CasesFilm })));
const PeopleFilm = lazy(() => import('@/system/PeopleFilm').then((m) => ({ default: m.PeopleFilm })));
const DiagnoseFilm = lazy(() => import('@/system/DiagnoseFilm').then((m) => ({ default: m.DiagnoseFilm })));
const ContactFilm = lazy(() => import('@/system/ContactFilm').then((m) => ({ default: m.ContactFilm })));
const SystemShell = lazy(() => import('@/system/SystemShell').then((m) => ({ default: m.SystemShell })));
const LossCalculator = lazy(() => import('@/system/LossCalculator').then((m) => ({ default: m.LossCalculator })));

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <Suspense fallback={null}>
        <Routes>
          {/* Новий cinematic-напрям — тепер головний вхід сайту, під спільною оболонкою.
              Попередній (темний) сайт лишається доступним на /classic для порівняння/відкату. */}
          <Route element={<SystemShell />}>
            <Route path="/" element={<SystemInMotion />} />
            <Route path="/system" element={<Navigate to="/" replace />} />
            <Route path="/systems" element={<SystemsFilm />} />
            <Route path="/proof" element={<CasesFilm />} />
            <Route path="/people" element={<PeopleFilm />} />
            <Route path="/diagnose" element={<DiagnoseFilm />} />
            <Route path="/contact" element={<ContactFilm />} />
            <Route path="/loss" element={<LossCalculator />} />
          </Route>
          <Route element={<Layout />}>
            {/* Попередній (темний) головний — доступний для порівняння/відкату */}
            <Route path="/classic" element={<Home />} />
            {/* Індекс викликів → світлий фільм «7 систем»; глибокі сторінки систем лишаються */}
            <Route path="/challenges" element={<Navigate to="/systems" replace />} />
            <Route path="/challenges/:slug" element={<SystemPage />} />
            <Route path="/what-we-build" element={<WhatWeBuild />} />
            <Route path="/what-we-build/eu-expansion" element={<EuExpansion />} />
            {/* Метод — це той самий Diagnose→Build→Scale→Independence; згорнуто в «Що будуємо» */}
            <Route path="/how-it-works" element={<Navigate to="/what-we-build" replace />} />
            {/* Метрики живуть у самому інструменті X-Ray — сторінки-глоссарії згорнуто */}
            <Route path="/how-it-works/business-health" element={<Navigate to="/diagnose" replace />} />
            <Route path="/how-it-works/independence-score" element={<Navigate to="/diagnose" replace />} />
            <Route path="/how-it-works/benchmark" element={<Navigate to="/diagnose" replace />} />
            {/* Індекс кейсів → світлий фільм «Докази»; детальні кейси лишаються */}
            <Route path="/cases" element={<Navigate to="/proof" replace />} />
            <Route path="/cases/:slug" element={<CaseDetail />} />
            {/* Аналітику згорнуто в докази (Кейси) */}
            <Route path="/intelligence" element={<Navigate to="/cases" replace />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/founder" element={<FounderPage />} />
            {/* Команда вже на /about; окремий «Стандарт» згорнуто в /about */}
            <Route path="/about/team" element={<Navigate to="/about" replace />} />
            <Route path="/about/standard" element={<Navigate to="/about" replace />} />
            {/* /diagnose і /contact переїхали у світлий v2 (під SystemShell) */}
            <Route path="/diagnose/full" element={<FullDiagnosis />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
