import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/Layout';
import { RouteSeo } from '@/lib/seo';
import '@/lib/primitives.css';

// Усі маршрути — ліниво, щоб кожна сторінка тягла лише свій код, а не весь
// сайт наперед (three.js та важкі блоки головної не потрапляють на інші сторінки).
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const Challenges = lazy(() => import('@/pages/Challenges').then((m) => ({ default: m.Challenges })));
const SystemPage = lazy(() => import('@/pages/SystemPage').then((m) => ({ default: m.SystemPage })));
const WhatWeBuild = lazy(() => import('@/pages/WhatWeBuild').then((m) => ({ default: m.WhatWeBuild })));
const EuExpansion = lazy(() => import('@/pages/EuExpansion').then((m) => ({ default: m.EuExpansion })));
const HowItWorks = lazy(() => import('@/pages/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const BusinessHealthPage = lazy(() => import('@/pages/BusinessHealthPage').then((m) => ({ default: m.BusinessHealthPage })));
const IndependenceScorePage = lazy(() => import('@/pages/IndependenceScorePage').then((m) => ({ default: m.IndependenceScorePage })));
const Benchmark = lazy(() => import('@/pages/Benchmark').then((m) => ({ default: m.Benchmark })));
const StandardPage = lazy(() => import('@/pages/StandardPage').then((m) => ({ default: m.StandardPage })));
const CasesPage = lazy(() => import('@/pages/CasesPage').then((m) => ({ default: m.CasesPage })));
const CaseDetail = lazy(() => import('@/pages/CaseDetail').then((m) => ({ default: m.CaseDetail })));
const Intelligence = lazy(() => import('@/pages/Intelligence').then((m) => ({ default: m.Intelligence })));
const About = lazy(() => import('@/pages/About').then((m) => ({ default: m.About })));
const FounderPage = lazy(() => import('@/pages/FounderPage').then((m) => ({ default: m.FounderPage })));
const TeamPage = lazy(() => import('@/pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const Diagnose = lazy(() => import('@/pages/Diagnose').then((m) => ({ default: m.Diagnose })));
const FullDiagnosis = lazy(() => import('@/pages/FullDiagnosis').then((m) => ({ default: m.FullDiagnosis })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/:slug" element={<SystemPage />} />
            <Route path="/what-we-build" element={<WhatWeBuild />} />
            <Route path="/what-we-build/eu-expansion" element={<EuExpansion />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/how-it-works/business-health" element={<BusinessHealthPage />} />
            <Route path="/how-it-works/independence-score" element={<IndependenceScorePage />} />
            <Route path="/how-it-works/benchmark" element={<Benchmark />} />
            <Route path="/about/standard" element={<StandardPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:slug" element={<CaseDetail />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/founder" element={<FounderPage />} />
            <Route path="/about/team" element={<TeamPage />} />
            <Route path="/diagnose" element={<Diagnose />} />
            <Route path="/diagnose/full" element={<FullDiagnosis />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
