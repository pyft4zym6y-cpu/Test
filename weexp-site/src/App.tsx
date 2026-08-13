import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/Layout';
import { Home } from '@/pages/Home';
import { Challenges } from '@/pages/Challenges';
import { SystemPage } from '@/pages/SystemPage';
import { WhatWeBuild } from '@/pages/WhatWeBuild';
import { EuExpansion } from '@/pages/EuExpansion';
import { HowItWorks } from '@/pages/HowItWorks';
import { BusinessHealthPage } from '@/pages/BusinessHealthPage';
import { IndependenceScorePage } from '@/pages/IndependenceScorePage';
import { Benchmark } from '@/pages/Benchmark';
import { StandardPage } from '@/pages/StandardPage';
import { CasesPage } from '@/pages/CasesPage';
import { CaseDetail } from '@/pages/CaseDetail';
import { Intelligence } from '@/pages/Intelligence';
import { About } from '@/pages/About';
import { FounderPage } from '@/pages/FounderPage';
import { TeamPage } from '@/pages/TeamPage';
import { Diagnose } from '@/pages/Diagnose';
import { FullDiagnosis } from '@/pages/FullDiagnosis';
import { ContactPage } from '@/pages/ContactPage';
import { NotFound } from '@/pages/NotFound';
import { RouteSeo } from '@/lib/seo';
import '@/lib/primitives.css';

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
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
    </BrowserRouter>
  );
}
