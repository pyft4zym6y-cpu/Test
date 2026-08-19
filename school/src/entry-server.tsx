// Серверний вхід для пререндера (prerender.mjs): рендерить кожен маршрут
// у статичний HTML, щоб пошуковики отримували готовий контент, а не
// порожній <div id="root">.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { AppShell } from './App';
import { getSeo, prerenderRoutes, SITE } from './seo';

export { getSeo, prerenderRoutes, SITE };

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppShell />
    </StaticRouter>,
  );
}
