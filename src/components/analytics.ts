/**
 * Заготовка веб-аналітики: події падають у window.dataLayer, якщо він є
 * (тобто після встановлення GTM/GA4 на реальному хостингу). Без GTM —
 * тихий no-op, жодних зовнішніх запитів. Див. DEPLOY.md → «Аналітика».
 */
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: string, params: Record<string, unknown> = {}) {
  try {
    window.dataLayer?.push({ event, ...params });
  } catch {
    /* noop */
  }
}
