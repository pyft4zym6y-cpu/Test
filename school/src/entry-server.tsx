// Серверний вхід для пререндера (prerender.mjs): рендерить кожен маршрут
// у статичний HTML, щоб пошуковики отримували готовий контент, а не
// порожній <div id="root">.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { AppShell } from './App';
import { getSeo, llmsFullTxt, llmsTxt, prerenderRoutes, rssXml, SITE } from './seo';
import { COURSES, courseStats, fmtPrice } from './data/courses';
import { POSTS } from './data/blog';
import { TOTALS } from './data/program';

export { getSeo, llmsFullTxt, llmsTxt, prerenderRoutes, rssXml, SITE };
// дані для локальної генерації og-картинок (scripts/og-images.mjs)
export { COURSES, courseStats, fmtPrice, POSTS, TOTALS };

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppShell />
    </StaticRouter>,
  );
}
