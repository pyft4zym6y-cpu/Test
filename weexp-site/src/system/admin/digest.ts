/**
 * Тижневий зріз по клієнтській базі: що зрушило, що стоїть, чого чекаємо.
 *
 * Двісті карток очима не обійти, а дашборд показує СТАН — скільки клієнтів на
 * якому етапі. Стан і РУХ це різні речі: база, де за тиждень не зрушив ніхто,
 * і база, де зрушили всі, на дашборді виглядають однаково.
 *
 * Тут рух: що змінилось за період, де ми чекаємо клієнта, а де клієнт чекає
 * нас. Останнє розділення — головне. «Клієнт не заповнив анкету» і «ми не
 * подивились надіслану анкету» вимагають різних дій, а в списку прострочених
 * вони стоять поруч і виглядають однаково.
 */
import type { AdminRow } from '@/lib/supa';
import { auditStatusOf, slaOf, STAGE_OF, type AuditReqStatus } from './auditRequests';

export type DigestItem = { userId: string; who: string; status: AuditReqStatus; days: number; limit: number };

export type Digest = {
  from: string;
  to: string;
  total: number;
  /** Картки, у яких за період щось змінилось. */
  moved: number;
  /** Не змінювалось нічого за період. */
  still: number;
  /** Хід за нами: клієнт зробив крок і чекає нашої відповіді. */
  ourMove: DigestItem[];
  /** Хід за клієнтом: ми зробили свій крок і чекаємо. */
  clientMove: DigestItem[];
  /** Прострочене — незалежно від того, чий хід. */
  breached: DigestItem[];
  /** Розподіл по етапах — щоб бачити, де база згущується. */
  byStage: { status: AuditReqStatus; label: string; n: number }[];
};

/**
 * Чий хід на цьому етапі. Не «хто винен», а «хто фізично може зрушити далі»:
 * поки клієнт заповнює анкету, ми зробити нічого не можемо, і тримати таку
 * картку у своєму списку справ — самообман.
 *
 * Поле `by` в AUDIT_STAGES для цього не годиться: воно каже, ХТО ПОСТАВИВ
 * картку на цей етап, а не хто ходить далі. `in_work` має by='менеджер', і хід
 * теж за нами; `granted` теж by='менеджер', але далі ходить клієнт. Тому список
 * явний — і звірений з нотатками самих етапів.
 */
const OURS: AuditReqStatus[] = ['new', 'review', 'in_work', 'done', 'project', 'delivery', 'care'];

const who = (r: AdminRow) => r.company || r.email || r.userId;

export function buildDigest(rows: AdminRow[], days = 7, now = Date.now()): Digest {
  const from = new Date(now - days * 86400000);
  const ourMove: DigestItem[] = [];
  const clientMove: DigestItem[] = [];
  const breached: DigestItem[] = [];
  const stages = new Map<AuditReqStatus, number>();
  let moved = 0;

  for (const r of rows) {
    const status = auditStatusOf(r);
    if (!status) continue;
    stages.set(status, (stages.get(status) ?? 0) + 1);

    const upd = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
    if (upd >= from.getTime()) moved += 1;

    // now, а не Date.now(): зріз має рахуватись на ту саму дату, від якої
    // побудовано вікно, інакше SLA в звіті за минулий тиждень міряється сьогодні.
    const sla = slaOf(r, now);
    const item: DigestItem = { userId: r.userId, who: who(r), status, days: sla.days, limit: sla.limit };
    if (sla.state === 'breach') breached.push(item);
    // У списки очікування беремо лише те, що вже вийшло за warn: свіжа картка
    // в роботі — не привід для рядка в дайджесті.
    else if (sla.state === 'warn') (OURS.includes(status) ? ourMove : clientMove).push(item);
  }

  const bySlow = (a: DigestItem, b: DigestItem) => b.days - a.days;
  return {
    from: from.toISOString().slice(0, 10),
    to: new Date(now).toISOString().slice(0, 10),
    total: rows.length,
    moved,
    still: rows.length - moved,
    ourMove: ourMove.sort(bySlow),
    clientMove: clientMove.sort(bySlow),
    breached: breached.sort(bySlow),
    byStage: [...stages.entries()]
      .map(([status, n]) => ({ status, label: STAGE_OF[status]?.l || status, n }))
      .sort((a, b) => b.n - a.n),
  };
}

/** Текст для листа або для копіювання в чат команди. */
export function digestText(d: Digest, origin = 'https://weexp.agency'): string {
  const line = (i: DigestItem) => `• ${i.who} — «${STAGE_OF[i.status]?.l || i.status}» ${i.days} дн. (норматив ${i.limit})`;
  const L: string[] = [
    `Тиждень ${d.from} → ${d.to}`,
    `Клієнтів у роботі: ${d.total} · зрушили: ${d.moved} · без руху: ${d.still}`,
    '',
  ];
  if (d.breached.length) L.push(`ПРОСТРОЧЕНО (${d.breached.length})`, ...d.breached.map(line), '');
  if (d.ourMove.length) L.push(`ХІД ЗА НАМИ (${d.ourMove.length})`, ...d.ourMove.map(line), '');
  if (d.clientMove.length) L.push(`ЧЕКАЄМО КЛІЄНТА (${d.clientMove.length})`, ...d.clientMove.map(line), '');
  if (!d.breached.length && !d.ourMove.length && !d.clientMove.length) L.push('Нічого не висить — рідкісний тиждень.', '');
  L.push('По етапах: ' + d.byStage.map((s) => `${s.label} ${s.n}`).join(' · '), '', `Адмінка: ${origin}/admin`);
  return L.join('\n');
}
