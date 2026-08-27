/**
 * Командна палітра адмінки: перехід і пошук з клавіатури.
 *
 * Двісті клієнтів і одинадцять розділів — навігація тільки мишею. Щоб відкрити
 * картку, треба потрапити в розділ, знайти рядок очима, клікнути. Менеджер
 * робить це десятки разів на день.
 *
 * Пошук навмисно НЕ нечіткий. Fuzzy-збіг у списку з двохсот схожих назв
 * («Кава», «Кавоварки», «Кава і чай») дає майже випадковий порядок, і людина
 * перестає довіряти першому результату. Тут просте правило, яке легко тримати
 * в голові: збіг з початку слова важить більше, ніж збіг усередині, а точний
 * збіг важить більше за обидва.
 */
import type { AdminRow } from '@/lib/supa';

export type Command = {
  id: string;
  /** Що показати в списку. */
  label: string;
  /** Другий рядок: пошта клієнта, підказка розділу. */
  hint?: string;
  kind: 'nav' | 'client' | 'action';
  /** Слова, за якими шукаємо (крім label). */
  terms?: string[];
  run: () => void;
};

/** Розділи адмінки — джерело для навігаційних команд. */
export type NavTab = { id: string; label: string; hint?: string };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Оцінка збігу. 0 — не збіглось. Більше — вище в списку.
 * Свідомо груба шкала: чотири рівні, які пояснюються одним реченням кожен.
 */
export function score(haystack: string, needle: string): number {
  const h = norm(haystack);
  const n = norm(needle);
  if (!n) return 1;                       // порожній запит — усе підходить
  if (h === n) return 100;                // точний збіг
  if (h.startsWith(n)) return 60;         // початок назви
  // Початок будь-якого слова: «кав» знаходить «Магазин Кави».
  if (new RegExp(`(^|[\\s"«(/.-])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(h)) return 40;
  if (h.includes(n)) return 15;           // десь усередині
  return 0;
}

export function rank(cmds: Command[], q: string, limit = 12): Command[] {
  const n = norm(q);
  if (!n) {
    // Порожній запит: спершу розділи — з них починають, коли відкрили палітру
    // без наміру шукати конкретного клієнта.
    return [...cmds].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'nav' ? -1 : 1)).slice(0, limit);
  }
  return cmds
    .map((c) => {
      const fields = [c.label, ...(c.terms || []), c.hint || ''];
      return { c, s: Math.max(...fields.map((f) => score(f, n))) };
    })
    .filter((x) => x.s > 0)
    // При рівному збігу клієнт важливіший за розділ: розділів одинадцять, і
    // до них є меню, а клієнта інакше шукати довго.
    .sort((a, b) => b.s - a.s || (a.c.kind === b.c.kind ? 0 : a.c.kind === 'client' ? -1 : 1))
    .slice(0, limit)
    .map((x) => x.c);
}

/** Побудувати команди з розділів і клієнтів. */
export function buildCommands(
  tabs: NavTab[],
  rows: AdminRow[] | null,
  go: { tab: (id: string) => void; client: (userId: string) => void },
): Command[] {
  const out: Command[] = tabs.map((t) => ({
    id: `nav:${t.id}`,
    label: t.label,
    hint: t.hint || 'розділ',
    kind: 'nav',
    run: () => go.tab(t.id),
  }));
  for (const r of rows || []) {
    const name = r.company || r.email || r.userId;
    out.push({
      id: `cli:${r.userId}`,
      label: name,
      hint: r.email,
      kind: 'client',
      // Пошта — окреме поле пошуку: менеджер часто памʼятає її, а не назву.
      terms: [r.email || ''],
      run: () => go.client(r.userId),
    });
  }
  return out;
}
