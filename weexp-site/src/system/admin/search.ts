import type { AdminRow, DiagRecord } from '@/lib/supa';

/**
 * Пошук по клієнтах.
 *
 * Досі шукалося лише за email і назвою компанії. Питання, з яких і складається
 * робота — «у кого була проблема з доставкою», «кому ми не дали доступ до GA4»,
 * «де згадувалась Nova Poshta» — відповіді не мали взагалі: заметки, файли,
 * оцінки модулів і підсумки прогонів у пошук не потрапляли.
 *
 * Шукаємо по тому, що вже є в полегшеному записі списку (див. LIST_KEYS), тож
 * додаткових запитів це не коштує. Відповіді анкети сюди не входять — вони
 * живуть в іншій таблиці; для них є пошук усередині картки.
 */
export type Hit = { where: string; text: string };

const push = (out: Hit[], where: string, v: unknown) => {
  const t = typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v);
  if (t) out.push({ where, text: t });
};

/** Усе, по чому шукаємо в одному записі, з підписом «звідки». */
export function searchableOf(row: AdminRow): Hit[] {
  const rec: DiagRecord = row.record || {};
  const out: Hit[] = [];
  push(out, 'email', row.email);
  const c = rec.company || {};
  for (const [k, v] of Object.entries(c)) {
    if (k === 'team') continue;
    push(out, `компанія · ${k}`, v);
  }
  (c.team || []).forEach((m) => push(out, 'команда клієнта', [m.name, m.role, m.email, m.phone].filter(Boolean).join(' ')));
  (rec.notes || []).forEach((n) => push(out, `нотатка${n.module ? ' · ' + n.module : ''}`, n.text));
  (rec.clientFiles || []).forEach((f) => push(out, 'файл клієнта', [f.title, f.type, f.why].filter(Boolean).join(' ')));
  (rec.adminFiles || []).forEach((f) => push(out, 'наш файл', f.name));
  (rec.sharedDocs || []).forEach((d) => push(out, 'переданий документ', d.title));
  (rec.marketplaces || []).forEach((m) => push(out, 'маркетплейс', [m.name, m.status, m.scope].filter(Boolean).join(' ')));
  (rec.auditJobs || []).forEach((j) => push(out, 'прогін рушія', [j.site, j.summary].filter(Boolean).join(' — ')));
  Object.entries(rec.assessment || {}).forEach(([k, v]) => push(out, `оцінка · ${k}`, [v.state, v.gap, v.rec].filter(Boolean).join(' · ')));
  Object.entries(rec.accessLog || {}).forEach(([id, a]) => push(out, `доступ · ${id}`, [a.status, a.method, a.note].filter(Boolean).join(' · ')));
  return out;
}

/** Знайдені збіги в записі. Порожній масив = не підходить. */
export function matchRow(row: AdminRow, needle: string): Hit[] {
  const q = needle.trim().toLowerCase();
  if (!q) return [];
  return searchableOf(row)
    .filter((h) => h.text.toLowerCase().includes(q))
    .slice(0, 4);
}

/** Швидка перевірка без збору збігів — для фільтрації списків. */
export function rowMatches(row: AdminRow, needle: string): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  if (row.email.toLowerCase().includes(q) || (row.company || '').toLowerCase().includes(q)) return true;
  return searchableOf(row).some((h) => h.text.toLowerCase().includes(q));
}
