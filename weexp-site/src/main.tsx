import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { reportVitals } from '@/lib/vitals';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);

reportVitals();
