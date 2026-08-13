import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/Layout';
import { Home } from '@/pages/Home';
import { WhatWeBuild } from '@/pages/WhatWeBuild';
import { HowItWorks } from '@/pages/HowItWorks';
import { BusinessHealthPage } from '@/pages/BusinessHealthPage';
import { IndependenceScorePage } from '@/pages/IndependenceScorePage';
import { CasesPage } from '@/pages/CasesPage';
import { CaseDetail } from '@/pages/CaseDetail';
import { Intelligence } from '@/pages/Intelligence';
import { About } from '@/pages/About';
import { FounderPage } from '@/pages/FounderPage';
import { Diagnose } from '@/pages/Diagnose';
import { ContactPage } from '@/pages/ContactPage';
import { NotFound } from '@/pages/NotFound';
import '@/lib/primitives.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/what-we-build" element={<WhatWeBuild />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/how-it-works/business-health" element={<BusinessHealthPage />} />
          <Route path="/how-it-works/independence-score" element={<IndependenceScorePage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:slug" element={<CaseDetail />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/about" element={<About />} />
          <Route path="/about/founder" element={<FounderPage />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
