import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { reportVitals } from '@/lib/vitals';

/**
 * Після деплою хеші lazy-чанків змінюються. Якщо у клієнта відкрита стара index.html,
 * перший перехід на lazy-маршрут намагається дотягнути чанк зі старим хешем → 404 →
 * порожня сторінка (доводилось перезавантажувати вручну). Ловимо саме цю помилку
 * динамічного імпорту й ОДИН раз тихо перезавантажуємось на свіжий бандл (guard, щоб
 * не було циклу). Інші помилки не чіпаємо.
 */
function isChunkLoadError(msg: string) {
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk .* failed|error loading dynamically imported module/i.test(msg);
}
function reloadOnceForChunk(msg: string) {
  if (!isChunkLoadError(msg)) return;
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem('weexp-chunk-reload') || 0);
    if (now - last < 20000) return;       // нещодавно перезавантажувались — не циклимо
    sessionStorage.setItem('weexp-chunk-reload', String(now));
    location.reload();
  } catch { /* ignore */ }
}
window.addEventListener('error', (e) => reloadOnceForChunk(String((e as ErrorEvent).message || '')));
window.addEventListener('unhandledrejection', (e) => reloadOnceForChunk(String((e as PromiseRejectionEvent).reason?.message || (e as PromiseRejectionEvent).reason || '')));

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);

reportVitals();
