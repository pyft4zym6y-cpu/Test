import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Самохостинг комикс-шрифтов (woff2 в бандле, без render-blocking Google Fonts —
// закрывает пункт 10 SEO-аудита). Latin + Cyrillic.
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/oswald/latin-700.css';
import '@fontsource/oswald/cyrillic-500.css';
import '@fontsource/oswald/cyrillic-600.css';
import '@fontsource/oswald/cyrillic-700.css';
import '@fontsource/caveat/latin-600.css';
import '@fontsource/caveat/latin-700.css';
import '@fontsource/caveat/cyrillic-600.css';
import '@fontsource/caveat/cyrillic-700.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
