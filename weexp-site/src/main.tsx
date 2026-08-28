import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { reportVitals } from '@/lib/vitals';
import { reloadOnceForChunk } from '@/lib/chunkReload';

/*
 * Застарілий бандл після деплою ловить lib/chunkReload — одне місце на весь
 * застосунок (раніше та сама перевірка жила тут, в App.tsx і не жила в межі
 * помилки адмінки, через що там пропонувався неможливий повтор).
 */
window.addEventListener('error', (e) => reloadOnceForChunk((e as ErrorEvent).message, 'window'));
window.addEventListener('unhandledrejection', (e) => reloadOnceForChunk((e as PromiseRejectionEvent).reason?.message ?? (e as PromiseRejectionEvent).reason, 'window'));

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);

reportVitals();
