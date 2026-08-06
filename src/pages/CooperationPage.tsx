import Process from '../components/Process';
import Economics from '../components/Economics';
import { useEffect } from 'react';
import Offers, { FAQ } from '../components/Offers';
import { Competitors } from '../components/Market';
import { Fork, PageCta } from '../components/NewSections';
import SubNav from '../components/SubNav';
import Breadcrumbs from '../components/Breadcrumbs';

export const COOP_SECTIONS = [
  { id: 'formats', label: 'Формати та ціни' },
  { id: 'process', label: 'Процес і гарантії' },
  { id: 'alternatives', label: 'Порівняння' },
  { id: 'fork', label: 'Розвилка' },
];

const anchor = { scrollMarginTop: 126 } as React.CSSProperties;

/*
 * «Співпраця»: три формати роботи з цінами → як влаштований процес і чим
 * захищений бюджет → порівняння з альтернативами → дві траєкторії.
 * Колишні /services та /process.
 */
export default function CooperationPage() {
  // AEO: FAQPage-розмітка з реальних питань сторінки
  useEffect(() => {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    const el = document.createElement('script');
    el.id = 'faq-ld';
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(ld);
    document.head.appendChild(el);
    return () => document.getElementById('faq-ld')?.remove();
  }, []);

  return (
    <div className="pt-16">
      <SubNav items={COOP_SECTIONS} />
      <Breadcrumbs items={[{ label: 'Співпраця' }]} />

      <div id="formats" style={anchor}>
        <Offers />
      </div>

      <div id="process" style={anchor}>
        <Process />
        <Economics />
      </div>

      <div id="alternatives" style={anchor}>
        <Competitors />
      </div>

      <div id="fork" style={anchor}>
        <Fork />
      </div>

      <PageCta />
    </div>
  );
}
