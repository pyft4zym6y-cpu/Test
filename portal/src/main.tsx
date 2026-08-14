import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { DEMO } from './lib/supabase';
import './styles.css';

declare const __ARTIFACT_BUILD__: boolean;
const Router = __ARTIFACT_BUILD__ ? HashRouter : BrowserRouter;

/*
 * Боевой бриф на сайте (weexp.agency/brief) помечен флагом __BRIEF_PROD__.
 * Если конфиг Supabase не пришёл из /api/portal-config — показываем заглушку,
 * а не демо-режим: на боевом адресе клиент не должен видеть демо-данные.
 */
const briefMisconfigured = Boolean((window as any).__BRIEF_PROD__) && DEMO;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {briefMisconfigured ? (
      <div style={{ maxWidth: 560, margin: '18vh auto', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Портал тимчасово недоступний</p>
        <p style={{ color: '#5A6472', fontSize: 14, lineHeight: 1.6 }}>
          Ми вже працюємо над цим. Напишіть нам — і ми надішлемо бриф іншим способом:{' '}
          <a href="mailto:pashasidorenko18@gmail.com">pashasidorenko18@gmail.com</a>
        </p>
      </div>
    ) : (
      <Router>
        <App />
      </Router>
    )}
  </React.StrictMode>,
);
