import { getProjects, type AdminRow, type DiagRecord, type Project, type TierStatus } from '@/lib/supa';
import { ACCESS_CATALOG } from '@/data/accessCatalog';

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
  | 'done'       // фінальні документи передані клієнту
  | 'project'    // з аудиту виріс проєкт — створений, але ще не в роботі
  | 'delivery';  // проєкт опублікований клієнту й виконується

export const AUDIT_STAGES: { k: AuditReqStatus; l: string; cls: string; by: 'клієнт' | 'менеджер'; note: string }[] = [
  { k: 'new',       l: 'Нова',              cls: 'wait', by: 'клієнт',   note: 'клієнт натиснув «Почати глибокий аудит»' },
  { k: 'need_data', l: 'Потрібні дані',     cls: 'wait', by: 'менеджер', note: 'менеджер запросив додаткові дані або доступи' },
  { k: 'granted',   l: 'Доступ надано',     cls: 'ok',   by: 'менеджер', note: 'код видано — чекаємо, поки клієнт почне' },
  { k: 'filling',   l: 'Клієнт заповнює',   cls: 'wait', by: 'клієнт',   note: 'зʼявилися відповіді, доступи або файли' },
  { k: 'review',    l: 'На модерації',      cls: 'wait', by: 'клієнт',   note: 'клієнт надіслав анкету — черга менеджера' },
  { k: 'clarify',   l: 'Уточнення',         cls: 'wait', by: 'менеджер', note: 'повернуто клієнту з питаннями' },
  { k: 'in_work',   l: 'В роботі',          cls: 'ok',   by: 'менеджер', note: 'анкету прийнято, аудит виконується' },
  { k: 'done',      l: 'Завершено',         cls: 'ok',   by: 'менеджер', note: 'документи передані клієнту' },
  { k: 'project',   l: 'Впровадження: план', cls: 'ok',   by: 'менеджер', note: 'аудит завершено, проєкт впровадження зібрано' },
  { k: 'delivery',  l: 'Впровадження: робота', cls: 'ok', by: 'менеджер', note: 'план опублікований клієнту й виконується' },
  { k: 'denied',    l: 'Не надано доступ',  cls: 'bad',  by: 'менеджер', note: 'менеджер відхилив запит' },
];
/**
 * Фази проєкту. Аудит — не окрема сутність поруч із проєктом, а його ПЕРШИЙ
 * етап: з нього починається збір єдиної бази знань про клієнта, яка далі живе
 * через усі етапи й нікуди не «закривається» разом з аудитом.
 */
export type Phase = 0 | 1 | 2;
export const PHASES: { n: Phase; l: string; note: string }[] = [
  { n: 0, l: 'Вхід',        note: 'заявка на проєкт: вирішуємо, чи беремось' },
  { n: 1, l: 'Етап 1 · Аудит', note: 'збираємо базу знань і ставимо діагноз' },
  { n: 2, l: 'Етап 2 · Впровадження', note: 'працюємо за роадмапою аудиту' },
];
const PHASE_BY_STATUS: Record<AuditReqStatus, Phase> = {
  new: 0, need_data: 0, denied: 0,
  granted: 1, filling: 1, review: 1, clarify: 1, in_work: 1, done: 1,
  project: 2, delivery: 2,
};
export const phaseOf = (st: AuditReqStatus): Phase => PHASE_BY_STATUS[st];

export const STAGE_OF = Object.fromEntries(AUDIT_STAGES.map((s) => [s.k, s])) as Record<AuditReqStatus, typeof AUDIT_STAGES[number]>;

/** Чи є в записі ознаки, що клієнт уже щось заповнив (анкета / доступи / файли). */
const clientStarted = (rec: DiagRecord): boolean =>
  Object.keys(rec.stage3 || {}).length > 0
  || Object.keys(rec.accessLog || {}).length > 0
  || (rec.clientFiles || []).length > 0
  || (rec.marketplaces || []).length > 0;

/**
 * Статус глибокого аудиту читаємо ТІЛЬКИ з ключа DEEP. Раніше бралися значення
 * усіх рівнів разом (`Object.values`), і один старий відхилений T2 робив клієнта
 * з виданим DEEP «не надано доступ». Для записів, де ключа DEEP ще немає (легасі
 * T1–T4), беремо найсильніший зі старих статусів, а не перший-ліпший.
 */
const PRECEDENCE: TierStatus[] = ['granted', 'data', 'requested', 'rejected'];
function deepStatus(rec: DiagRecord): TierStatus | undefined {
  const ts = rec.funnel?.tierStatus || {};
  if (ts.DEEP) return ts.DEEP;
  const legacy = Object.values(ts);
  return PRECEDENCE.find((p) => legacy.includes(p));
}

/**
 * Порядок важливий: перевіряємо від найпізнішої стадії до найранішої, щоб
 * пізніша дія перекривала ранішу. null = це взагалі не заявка на аудит.
 */
export function auditStatusOf(row: AdminRow): AuditReqStatus | null {
  const rec = row.record || {};
  const st = deepStatus(rec);
  const mod = rec.deepModeration?.status;

  // Проєкт — пізніша сутність за аудит, тож перекриває його стадії.
  const projects = getProjects(rec);
  if (projects.some((p) => p.published)) return 'delivery';
  if (projects.length > 0) return 'project';
  // «Завершено» — лише за явним закриттям етапу. Раніше сюди потрапляв будь-хто,
  // кому передали хоч один проміжний документ.
  if (rec.auditClosedAt) return 'done';
  if (mod === 'accepted') return 'in_work';
  if (mod === 'clarify') return 'clarify';
  if (mod === 'submitted') return 'review';
  if (st === 'rejected') return 'denied';
  if (st === 'granted') return clientStarted(rec) ? 'filling' : 'granted';
  if (st === 'data') return 'need_data';
  if (st === 'requested' || rec.funnel?.deepRequested) return 'new';
  return null;
}

/** Коли стадія востаннє рухалась — для колонки «оновлено» і сортування. */
export function lastMoveAt(row: AdminRow): string {
  const rec = row.record || {};
  const hist = Object.values(rec.funnel?.tierHistory || {}).flat();
  const dates = [rec.deepModeration?.at, rec.auditClosedAt, rec.updatedAt, ...hist.map((h) => h.at)].filter(Boolean) as string[];
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

/* ─── Похідні для картки клієнта ─────────────────────────────────────────── */

/** Що робити ПРЯМО ЗАРАЗ. Виводиться зі стадії, щоб менеджер не гадав. */
export function nextStep(row: AdminRow): { text: string; who: 'ми' | 'клієнт' } {
  const st = auditStatusOf(row);
  switch (st) {
    case 'new':       return { who: 'ми',     text: 'Розглянути запит: надати доступ, запросити дані або відхилити' };
    case 'need_data': return { who: 'клієнт', text: 'Чекаємо дані, які ви запросили' };
    case 'granted':   return { who: 'клієнт', text: 'Доступ видано — клієнт ще не почав заповнювати' };
    case 'filling':   return { who: 'клієнт', text: 'Клієнт заповнює анкету, доступи й файли' };
    case 'review':    return { who: 'ми',     text: 'Перевірити повноту даних і прийняти анкету або повернути на уточнення' };
    case 'clarify':   return { who: 'клієнт', text: 'Чекаємо відповіді на уточнення' };
    case 'in_work':   return { who: 'ми',     text: 'Зібрати пакет документів: прогін рушія, оцінка модулів, документ аудиту → закрити етап' };
    case 'done':      return { who: 'ми',     text: 'Етап 1 закрито. Наступне — зібрати проект впровадження' };
    case 'project':   return { who: 'ми',     text: 'Проєкт створено, але не опублікований клієнту' };
    case 'delivery':  return { who: 'ми',     text: 'Проєкт у роботі — вести задачі й платежі' };
    case 'denied':    return { who: 'ми',     text: 'Запит відхилено' };
    default:          return { who: 'ми',     text: 'Заявки на глибокий аудит немає' };
  }
}

/** Готовність вхідних даних: доступи, файли, прогони рушія. Анкета — окремо (async). */
export function readiness(row: AdminRow) {
  const rec = row.record || {};
  const log = rec.accessLog || {};
  const given = Object.values(log).filter((a) => a.status === 'granted' || a.status === 'verified').length;
  const na = Object.values(log).filter((a) => a.status === 'na').length;
  return {
    accessGiven: given,
    accessNa: na,
    accessTotal: ACCESS_CATALOG.length,
    marketplaces: (rec.marketplaces || []).length,
    files: (rec.clientFiles || []).length,
    jobs: (rec.auditJobs || []).length,
    shared: (rec.sharedDocs || []).length,
    scored: Object.keys(rec.assessment || {}).length,
  };
}

/** Що заважає рухатись далі — конкретним списком, а не відчуттям. */
export function blockers(row: AdminRow): string[] {
  const rec = row.record || {};
  const st = auditStatusOf(row);
  const r = readiness(row);
  const out: string[] = [];
  // Вимоги прив'язані до фази: на етапі впровадження безглуздо вимагати файли
  // для аудиту, який давно закрито — раніше цей список шумів на кожній картці.
  const phase = st ? phaseOf(st) : 0;
  if (!rec.company?.name) out.push('не заповнений профіль компанії');
  if (!rec.company?.site) out.push('не вказаний сайт — рушій нема куди запускати');
  if (phase === 1) {
    if (r.accessGiven + r.accessNa === 0) out.push('не надано жодного доступу');
    if (r.files === 0) out.push('не завантажено жодного файлу');
    if (st === 'in_work' && r.jobs === 0) out.push('рушій ще жодного разу не прогонявся');
    if (st === 'in_work' && r.scored === 0) out.push('модулі ще не оцінені');
  }
  if (phase === 2) {
    const pr = getProjects(rec);
    if (pr.length && !pr.some((p) => p.published)) out.push('проект не опублікований клієнту');
  }
  const d = staleDays(row);
  if (d >= 7) out.push(`стадія не рухалась ${d} дн.`);
  return out;
}

/** Гроші по клієнту в одному місці: оцінка втрат, бюджет проєктів, платежі. */
export function money(row: AdminRow) {
  const rec = row.record || {};
  const projects: Project[] = getProjects(rec);
  const budget = projects.reduce((sum, p) => sum + Object.values(p.budget || {}).reduce((a, b) => a + (Number(b) || 0), 0), 0);
  const pays = projects.flatMap((p) => p.payments || []);
  return {
    expressTotal: rec.express?.total ?? null,
    expressRange: rec.express?.range ?? null,
    health: rec.express?.overallHealth ?? null,
    budget,
    paid: pays.filter((x) => x.status === 'paid').reduce((a, b) => a + (Number(b.amount) || 0), 0),
    pending: pays.filter((x) => x.status === 'pending').reduce((a, b) => a + (Number(b.amount) || 0), 0),
  };
}

/** Єдина стрічка подій: доступи, модерація, прогони, документи, проєкти. */
export function timeline(row: AdminRow): { at: string; text: string; who: 'клієнт' | 'менеджер' | 'система' }[] {
  const rec = row.record || {};
  const ev: { at: string; text: string; who: 'клієнт' | 'менеджер' | 'система' }[] = [];
  Object.entries(rec.funnel?.tierHistory || {}).forEach(([tier, hist]) =>
    (hist || []).forEach((h) => ev.push({ at: h.at, who: h.by === 'client' ? 'клієнт' : 'менеджер', text: `${tier}: ${h.st}` })));
  if (rec.deepModeration?.at) ev.push({ at: rec.deepModeration.at, who: rec.deepModeration.status === 'submitted' ? 'клієнт' : 'менеджер', text: `анкета: ${rec.deepModeration.status}` });
  (rec.auditJobs || []).forEach((j) => ev.push({ at: j.at, who: 'система', text: `прогін рушія ${j.site || ''} — ${j.status || ''}` }));
  (rec.sharedDocs || []).forEach((d) => ev.push({ at: d.at, who: 'менеджер', text: `документ передано: ${d.title}` }));
  getProjects(rec).forEach((p) => { if (p.updatedAt) ev.push({ at: p.updatedAt, who: 'менеджер', text: `проєкт «${p.title || 'без назви'}»${p.published ? ' (опубліковано)' : ''}` }); });
  return ev.filter((e) => e.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
}
