import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/Layout';
import { Home } from '@/pages/Home';
import { Os } from '@/pages/Os';
import { Services } from '@/pages/Services';
import { CasesPage } from '@/pages/CasesPage';
import { CaseDetail } from '@/pages/CaseDetail';
import { About } from '@/pages/About';
import { Diagnostics } from '@/pages/Diagnostics';
import { ContactPage } from '@/pages/ContactPage';
import { NotFound } from '@/pages/NotFound';
import '@/lib/primitives.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/os" element={<Os />} />
          <Route path="/services" element={<Services />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:slug" element={<CaseDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
