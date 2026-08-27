/**
 * Аномалії в журналі дій.
 *
 * Журнал пишеться, але його ніхто не читає: сто рядків без фільтрів, у яких
 * масове видалення виглядає рівно так само, як звичайний робочий день. Тобто
 * запис є, а спостереження немає — а це різні речі.
 *
 * Тут чотири детектори. Кожен відповідає на питання «що я хочу помітити ДО
 * того, як мене спитають», і жоден не робить висновку про намір: сплеск
 * видалень однаково виглядає і при зачистці тестових записів, і при помилці
 * в циклі. Тому це СИГНАЛИ до перевірки, а не звинувачення — формулювання в
 * тексті теж такі.
 *
 * Пороги свідомо консервативні: детектор, який спрацьовує щодня, перестають
 * читати на третій день, і тоді він гірший за відсутній.
 */
import type { AdminEventRow } from '@/lib/supa';

export type Anomaly = {
  id: string;
  level: 'warn' | 'info';
  actor: string;
  title: string;
  why: string;
  at: string;
  count: number;
};

/** Дії, що знищують або відкликають. Саме їх сплеск і треба бачити. */
const DESTRUCTIVE = /delete|remove|clear|revoke|видал|скид/i;

const isDestructive = (e: AdminEventRow) => DESTRUCTIVE.test(`${e.kind} ${e.detail || ''}`);
const ms = (e: AdminEventRow) => new Date(e.at).getTime();

export type AnomalyOptions = {
  /** Скільки руйнівних дій за вікно вважати сплеском. */
  destructiveBurst?: number;
  /** Скільки різних клієнтів за вікно — ознака скрипта чи помилки в циклі. */
  breadth?: number;
  /** Вікно, у якому рахуємо, мс. */
  windowMs?: number;
  /** Година, з якої день вважається неробочим (локальна). */
  nightFrom?: number;
  nightTo?: number;
  /** Скільки днів історії робить актора «відомим». */
  knownAfterDays?: number;
};

/**
 * Ковзне вікно по одному актору. Повертає перше вікно, де лічильник перевищив
 * поріг: показувати всі перетини сенсу немає — це один і той самий епізод.
 */
function firstBurst(events: AdminEventRow[], windowMs: number, limit: number, pick: (e: AdminEventRow) => string | null): { at: string; count: number } | null {
  const sorted = [...events].sort((a, b) => ms(a) - ms(b));
  for (let i = 0; i < sorted.length; i += 1) {
    const seen = new Set<string>();
    let n = 0;
    for (let j = i; j < sorted.length && ms(sorted[j]) - ms(sorted[i]) <= windowMs; j += 1) {
      const key = pick(sorted[j]);
      if (key === null) continue;
      if (key === '') { n += 1; continue; }        // рахуємо кількість, не унікальність
      if (!seen.has(key)) { seen.add(key); n += 1; }
    }
    if (n >= limit) return { at: sorted[i].at, count: n };
  }
  return null;
}

export function findAnomalies(rows: AdminEventRow[], opts: AnomalyOptions = {}): Anomaly[] {
  const {
    destructiveBurst = 5, breadth = 10, windowMs = 10 * 60 * 1000,
    nightFrom = 23, nightTo = 6, knownAfterDays = 7,
  } = opts;
  if (!rows.length) return [];

  const byActor = new Map<string, AdminEventRow[]>();
  for (const e of rows) {
    const a = e.actor || '—';
    const list = byActor.get(a);
    if (list) list.push(e); else byActor.set(a, [e]);
  }

  const newest = Math.max(...rows.map(ms));
  const out: Anomaly[] = [];

  for (const [actor, list] of byActor) {
    // 1. Сплеск руйнівних дій.
    const destr = list.filter(isDestructive);
    const burst = firstBurst(destr, windowMs, destructiveBurst, () => '');
    if (burst) {
      out.push({
        id: `destr:${actor}:${burst.at}`, level: 'warn', actor, at: burst.at, count: burst.count,
        title: `${burst.count} руйнівних дій за ${Math.round(windowMs / 60000)} хв`,
        why: 'Так виглядає і зачистка тестових записів, і помилка в циклі. Варто подивитись, що саме зникло.',
      });
    }

    // 2. Широта: багато РІЗНИХ клієнтів за коротке вікно.
    const wide = firstBurst(list, windowMs, breadth, (e) => e.user_id || null);
    if (wide) {
      out.push({
        id: `wide:${actor}:${wide.at}`, level: 'warn', actor, at: wide.at, count: wide.count,
        title: `${wide.count} різних клієнтів за ${Math.round(windowMs / 60000)} хв`,
        why: 'Людина стільки карток за раз не відкриває. Схоже на скрипт або на масову операцію — переконайтесь, що вона була навмисною.',
      });
    }

    // 3. Нічна активність. Сама по собі нічого не означає — тому info, а не warn,
    //    і лише коли дій справді багато: одна нічна правка це просто пізній вечір.
    const night = list.filter((e) => {
      const h = new Date(e.at).getHours();
      return nightFrom > nightTo ? (h >= nightFrom || h < nightTo) : (h >= nightFrom && h < nightTo);
    });
    if (night.length >= destructiveBurst) {
      out.push({
        id: `night:${actor}`, level: 'info', actor, at: night[0].at, count: night.length,
        title: `${night.length} дій уночі`,
        why: 'Не проблема сама по собі. Має значення в парі з іншим сигналом або якщо ця людина зазвичай так не працює.',
      });
    }

    // 4. Новий актор: з'явився недавно, а вже щось робить.
    const oldest = Math.min(...list.map(ms));
    const ageDays = (newest - oldest) / 86400000;
    if (ageDays < knownAfterDays && list.length >= 3) {
      out.push({
        id: `new:${actor}`, level: 'info', actor, at: new Date(oldest).toISOString(), count: list.length,
        title: 'Новий у журналі',
        why: `Перша дія — менш ніж ${knownAfterDays} днів тому. Якщо це не новий співробітник, варто перевірити, чий це доступ.`,
      });
    }
  }

  // Спершу попередження, далі — свіжіше вгору.
  return out.sort((a, b) => (a.level === b.level ? ms(b as unknown as AdminEventRow) - ms(a as unknown as AdminEventRow) : a.level === 'warn' ? -1 : 1));
}

/** Хто діяв у вибірці — для фільтра. */
export function actorsOf(rows: AdminEventRow[]): string[] {
  return [...new Set(rows.map((e) => e.actor || '—'))].sort();
}

/** Які типи дій зустрічаються — для фільтра. */
export function kindsOf(rows: AdminEventRow[]): string[] {
  return [...new Set(rows.map((e) => e.kind))].sort();
}

export type EventFilter = { actor?: string; kind?: string; q?: string };

/** Фільтр журналу. Порожні поля не звужують — щоб «усе» було станом за умовчанням. */
export function filterEvents(rows: AdminEventRow[], f: EventFilter): AdminEventRow[] {
  const q = (f.q || '').trim().toLowerCase();
  return rows.filter((e) => {
    if (f.actor && (e.actor || '—') !== f.actor) return false;
    if (f.kind && e.kind !== f.kind) return false;
    if (q && !`${e.actor} ${e.kind} ${e.subject || ''} ${e.detail || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
