import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

/** RUM Core Web Vitals. Шлёт на VITE_VITALS_URL (если задан), иначе — no-op (в dev — в консоль). */
export function reportVitals() {
  const url = import.meta.env.VITE_VITALS_URL as string | undefined;
  const send = (m: Metric) => {
    const body = JSON.stringify({ name: m.name, value: Math.round(m.value * 1000) / 1000, rating: m.rating, id: m.id });
    if (url && 'sendBeacon' in navigator) navigator.sendBeacon(url, body);
    else if (import.meta.env.DEV) console.info('[web-vitals]', m.name, m.value, m.rating);
  };
  onCLS(send); onINP(send); onLCP(send); onFCP(send); onTTFB(send);
}
