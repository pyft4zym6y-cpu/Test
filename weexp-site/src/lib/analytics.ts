/**
 * Провайдер-незалежна аналітика подій. Працює з GA4/GTM (window.dataLayer)
 * і з Plausible (window.plausible) — що з них під’єднано на хостингу.
 * Без жодного зі снипетів — тихий no-op, жодних зовнішніх запитів.
 *
 * Як увімкнути збір (обрати одне):
 *   • GA4: додати gtag/GTM снипет в index.html — події вже підуть у dataLayer;
 *   • Plausible: <script defer data-domain="weexp.agency" src=".../script.js">.
 */
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

export type TrackParams = Record<string, unknown>;

export function track(event: string, params: TrackParams = {}) {
  try {
    // GA4 через gtag, якщо є; інакше — у dataLayer (GTM або кастомний споживач).
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    else window.dataLayer?.push({ event, ...params });
    // Plausible — кастомна подія з властивостями.
    window.plausible?.(event, { props: params });
  } catch {
    /* аналітика ніколи не має ламати UI */
  }
}
