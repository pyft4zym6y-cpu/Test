import { getProjects, type AdminRow, type LeadRow } from '@/lib/supa';
import { ACCESS_CATALOG } from '@/data/accessCatalog';

/**
 * Історія взаємодії з клієнтом — одним списком.
 *
 * Досі «Історія активності» знала про чотири речі: експрес-аудит, зміни рівнів
 * доступу, заявку з кабінету й дату оновлення профілю. Усе інше — коли заявка
 * взагалі прийшла і звідки, коли її кваліфікували, коли клієнт відкрив аудит,
 * що завантажив, що ми йому передали, коли створили проєкт — доводилось
 * збирати очима по вкладках.
 *
 * Нічого не вигадуємо: кожна подія має бути записом у даних. Якщо події немає
 * в записі — її немає й у стрічці; це чесніше, ніж домальовувати «ймовірні»
 * кроки за датою оновлення.
 */
export type TimelineKind = 'lead' | 'audit' | 'access' | 'file' | 'project' | 'meet' | 'profile';
export type TimelineEvent = {
  at: string;
  kind: TimelineKind;
  text: string;
  /** Хто зробив крок: клієнт, команда чи рушій. */
  by?: 'клієнт' | 'команда' | 'рушій';
  note?: string;
};

const KIND_LABEL: Record<TimelineKind, string> = {
  lead: 'Заявка', audit: 'Аудит', access: 'Доступи', file: 'Файли',
  project: 'Проєкт', meet: 'Зустріч', profile: 'Профіль',
};
export const timelineKindLabel = (k: TimelineKind) => KIND_LABEL[k];

const accName = (id: string) => {
  const c = ACCESS_CATALOG.find((x) => x.id === id);
  return c ? `${c.category} · ${c.system}` : id;
};

export function clientTimeline(row: AdminRow, leads: LeadRow[] | null): TimelineEvent[] {
  const rec = row.record || {};
  const out: TimelineEvent[] = [];
  const push = (at: string | undefined, kind: TimelineKind, text: string, by?: TimelineEvent['by'], note?: string) => {
    if (at) out.push({ at, kind, text, by, note });
  };

  // ── Заявки з форм сайту й кабінету ──
  const mine = (leads || []).filter((l) => (l.email || '').toLowerCase() === (row.email || '').toLowerCase());
  for (const l of mine) {
    push(l.at, 'lead', `Заявка надійшла${l.source ? ` · ${l.source}` : ''}`, 'клієнт', l.task || l.comment);
    if (l.deal?.projectId) push(l.at, 'project', 'Заявку конвертовано в проєкт', 'команда');
  }

  // ── Аудити ──
  push(rec.express?.at, 'audit', 'Пройдено експрес-аудит', 'клієнт',
    rec.express ? `здоровʼя ${rec.express.overallHealth}/100` : undefined);
  push(row.funnel?.deepAt, 'audit', 'Запит на глибокий аудит', 'клієнт');
  push(row.funnel?.leadAt, 'lead', 'Заявка на співпрацю з кабінету', 'клієнт');
  push(row.funnel?.meetAt, 'meet', 'Запит на зустріч', 'клієнт',
    [row.funnel?.meetChannel, row.funnel?.meetWhen].filter(Boolean).join(' · ') || undefined);

  const mod = rec.deepModeration;
  if (mod) {
    const t = mod.status === 'submitted' ? 'Анкету надіслано на модерацію'
      : mod.status === 'clarify' ? 'Анкету повернуто на уточнення'
      : 'Анкету прийнято';
    push(mod.at, 'audit', t, mod.status === 'submitted' ? 'клієнт' : 'команда', mod.note);
  }
  for (const j of rec.auditJobs || []) {
    push(j.at, 'audit', `Прогін рушієм${j.site ? ` · ${j.site}` : ''}`, 'рушій',
      [j.status, j.health != null ? `health ${j.health}` : ''].filter(Boolean).join(' · ') || undefined);
  }

  // ── Доступи ──
  for (const [tid, list] of Object.entries(row.funnel?.tierHistory || {})) {
    for (const e of list || []) {
      const st = e.st === 'granted' ? 'відкрито доступ до аудиту'
        : e.st === 'requested' ? 'клієнт попросив доступ'
        : e.st === 'data' ? 'запитали додаткові дані'
        : e.st === 'rejected' ? 'у доступі відмовлено' : String(e.st);
      push(e.at, 'access', `${tid === 'DEEP' ? 'Глибокий аудит' : 'Запит'}: ${st}`,
        e.by === 'client' ? 'клієнт' : 'команда', e.byEmail);
    }
  }
  for (const [id, a] of Object.entries(rec.accessLog || {})) {
    if (a.status === 'granted' || a.status === 'verified') push(a.at, 'access', `Доступ надано: ${accName(id)}`, 'клієнт', a.note);
  }

  // ── Файли ──
  for (const f of rec.clientFiles || []) {
    if (f.path) push(f.at, 'file', `Клієнт завантажив: ${f.title || f.type || 'файл'}`, 'клієнт');
  }
  for (const d of rec.sharedDocs || []) push(d.at, 'file', `Передано клієнту: ${d.title}`, 'команда', d.by);

  // ── Проєкти ──
  for (const p of getProjects(rec)) {
    push(p.origin?.at, 'project', `Створено проєкт: ${p.title || 'без назви'}`, 'команда', p.origin?.by);
    push(p.closedAt, 'project', `Проєкт завершено: ${p.title || 'без назви'}`, 'команда', p.closedBy);
  }

  push(rec.auditClosedAt, 'audit', 'Аудит закрито', 'команда', rec.auditClosedBy);
  push(row.updatedAt, 'profile', 'Оновлення профілю клієнта', 'клієнт');

  // Дублікати за (час + текст) — той самий факт міг прийти двома шляхами.
  const seen = new Set<string>();
  return out
    .filter((e) => { const k = e.at + '|' + e.text; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => b.at.localeCompare(a.at));
}
