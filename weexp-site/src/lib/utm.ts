/*
 * First-touch UTM-атрибуція: при першому заході з utm_*-параметрами зберігаємо їх
 * локально (перше торкання) і додаємо до заявки. Так у CRM видно джерело кампанії.
 */
const KEY = 'weexp:utm-v1';
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

export function captureUtm(): void {
  try {
    if (localStorage.getItem(KEY)) return;                 // first-touch — не перезаписуємо
    const q = new URLSearchParams(window.location.search);
    const got: Record<string, string> = {};
    for (const f of FIELDS) { const v = q.get(f); if (v) got[f] = v.slice(0, 120); }
    if (!Object.keys(got).length) return;
    got.ref = (document.referrer || '').slice(0, 160);
    got.at = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(got));
  } catch { /* ignore */ }
}

/** Компактний рядок для додавання в заявку (порожній, якщо немає даних). */
export function getUtmString(): string {
  try {
    const raw = localStorage.getItem(KEY); if (!raw) return '';
    const o = JSON.parse(raw) as Record<string, string>;
    const parts = FIELDS.filter((f) => o[f]).map((f) => `${f.replace('utm_', '')}=${o[f]}`);
    if (o.ref) parts.push(`ref=${o.ref}`);
    return parts.length ? 'UTM: ' + parts.join('; ') : '';
  } catch { return ''; }
}
