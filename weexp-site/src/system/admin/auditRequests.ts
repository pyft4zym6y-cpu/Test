import type { AdminRow, DiagRecord } from '@/lib/supa';

/**
 * Статус заявки на глибокий аудит ВИВОДИТЬСЯ з даних, а не зберігається окремо.
 * Це навмисно: статус не можна забути перевести — він змінюється сам, щойно
 * клієнт або менеджер щось зробили. Хто рухає кожен перехід — у полі `by`.
 */
export type AuditReqStatus =
  | 'new'        // клієнт надіслав запит, менеджер ще не відповів
  | 'need_data'  // менеджер попросив дані/доступи
  | 'denied'     // менеджер відхилив
  | 'granted'    // доступ надано, клієнт ще нічого не заповнив
  | 'filling'    // клієнт заповнює: анкета / доступи / файли
  | 'review'     // клієнт надіслав на модерацію
  | 'clarify'    // менеджер повернув на уточнення
  | 'in_work'    // менеджер прийняв анкету — аудит виконується
  | 'done';      // фінальні документи передані клієнту

export const AUDIT_STAGES: { k: AuditReqStatus; l: string; cls: string; by: 'клієнт' | 'менеджер'; note: string }[] = [
  { k: 'new',       l: 'Нова',              cls: 'wait', by: 'клієнт',   note: 'клієнт натиснув «Почати глибокий аудит»' },
  { k: 'need_data', l: 'Потрібні дані',     cls: 'wait', by: 'менеджер', note: 'менеджер запросив додаткові дані або доступи' },
  { k: 'granted',   l: 'Доступ надано',     cls: 'ok',   by: 'менеджер', note: 'код видано — чекаємо, поки клієнт почне' },
  { k: 'filling',   l: 'Клієнт заповнює',   cls: 'wait', by: 'клієнт',   note: 'зʼявилися відповіді, доступи або файли' },
  { k: 'review',    l: 'На модерації',      cls: 'wait', by: 'клієнт',   note: 'клієнт надіслав анкету — черга менеджера' },
  { k: 'clarify',   l: 'Уточнення',         cls: 'wait', by: 'менеджер', note: 'повернуто клієнту з питаннями' },
  { k: 'in_work',   l: 'В роботі',          cls: 'ok',   by: 'менеджер', note: 'анкету прийнято, аудит виконується' },
  { k: 'done',      l: 'Завершено',         cls: 'ok',   by: 'менеджер', note: 'документи передані клієнту' },
  { k: 'denied',    l: 'Не надано доступ',  cls: 'bad',  by: 'менеджер', note: 'менеджер відхилив запит' },
];
export const STAGE_OF = Object.fromEntries(AUDIT_STAGES.map((s) => [s.k, s])) as Record<AuditReqStatus, typeof AUDIT_STAGES[number]>;

/** Чи є в записі ознаки, що клієнт уже щось заповнив (анкета / доступи / файли). */
const clientStarted = (rec: DiagRecord): boolean =>
  Object.keys(rec.stage3 || {}).length > 0
  || Object.keys(rec.accessLog || {}).length > 0
  || (rec.clientFiles || []).length > 0
  || (rec.marketplaces || []).length > 0;

/**
 * Порядок важливий: перевіряємо від найпізнішої стадії до найранішої, щоб
 * пізніша дія перекривала ранішу. null = це взагалі не заявка на аудит.
 */
export function auditStatusOf(row: AdminRow): AuditReqStatus | null {
  const rec = row.record || {};
  const tiers = Object.values(rec.funnel?.tierStatus || {});
  const mod = rec.deepModeration?.status;

  if ((rec.sharedDocs || []).length > 0) return 'done';
  if (mod === 'accepted') return 'in_work';
  if (mod === 'clarify') return 'clarify';
  if (mod === 'submitted') return 'review';
  if (tiers.includes('rejected')) return 'denied';
  if (tiers.includes('granted')) return clientStarted(rec) ? 'filling' : 'granted';
  if (tiers.includes('data')) return 'need_data';
  if (tiers.includes('requested') || rec.funnel?.deepRequested) return 'new';
  return null;
}

/** Коли стадія востаннє рухалась — для колонки «оновлено» і сортування. */
export function lastMoveAt(row: AdminRow): string {
  const rec = row.record || {};
  const hist = Object.values(rec.funnel?.tierHistory || {}).flat();
  const dates = [rec.deepModeration?.at, rec.updatedAt, ...hist.map((h) => h.at)].filter(Boolean) as string[];
  return dates.sort().pop() || '';
}

/** Скільки днів заявка стоїть без руху — щоб зависле було видно, а не губилось. */
export function staleDays(row: AdminRow): number {
  const at = lastMoveAt(row);
  if (!at) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(at).getTime()) / 86_400_000));
}

/** Стадії, де мʼяч на боці менеджера — саме вони мають підсвічуватись першими. */
export const OURS: AuditReqStatus[] = ['new', 'review'];
