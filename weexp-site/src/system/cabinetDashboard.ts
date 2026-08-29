/**
 * Модель головного екрана кабінету.
 *
 * Кабінет мав дев'ять розділів, з яких головний показував дві кнопки й був
 * порожній на 44%. При цьому запис клієнта вже містив усе потрібне: проєкти зі
 * статусами, воронку, каталог із 26 доступів зі станами, обов'язкові файли,
 * документи, якими поділився менеджер, готовність глав пакета й результат
 * експрес-аудиту. Дані були — вони просто ніде не сходились. Адмінка знала стан
 * проєкту, а клієнт у своєму кабінеті його не бачив.
 *
 * Тут — чиста функція: запис → те, що людина має побачити, відкривши портал.
 * Чиста свідомо: розкладка може мінятись скільки завгодно, а правила «чого ми
 * чекаємо» і «що вже віддано» мають бути перевірювані без браузера.
 *
 * Головне правило (те саме, що в timeline.ts): подія існує лише тоді, коли в
 * даних є її позначка часу. Нічого не добудовуємо «за замовчуванням» — портал,
 * який показує клієнту вигадану дату, гірший за порожній.
 */
import { ACCESS_CATALOG, REQUIRED_FILES } from '@/data/accessCatalog';
import { PROJECT_STATUSES, projectStatus } from '@/lib/supa';
import type { DiagRecord, Project } from '@/lib/supa';

/**
 * Мінімум, який нам потрібен від експрес-аудиту.
 *
 * Він приходить із двох місць — знімок в акаунті (ExpressSnapshot) і локальний
 * запис калькулятора (ExpressAudit). Поля збігаються, а типи ні: беремо
 * структурний мінімум, щоб не тягнути сюди обидва і не змушувати виклик
 * приводити одне до іншого.
 */
export type ExpressLike = {
  at: string; total: number; range: [number, number]; overallHealth: number;
  input?: { currency?: string };
};

/** Куди веде картка: id розділу кабінету. */
export type Target = 'company' | 'docs' | 'audits' | 'deep' | 'project' | 'meet';

/** Чого ми чекаємо від клієнта — з причиною і адресою, де це зробити. */
export type Pending = {
  id: string;
  kind: 'access' | 'file' | 'profile';
  label: string;
  why?: string;
  to: Target;
};

/** Що вже передано клієнту. */
export type Delivered = { id: string; title: string; at: string };

export type Stage = { key: string; label: [string, string]; note: [string, string] };

export type NextStep = {
  /** На кому крок: 'you' — на клієнті, 'we' — на нас. */
  owner: 'you' | 'we';
  text: [string, string];
  to: Target;
};

export type Dash = {
  stage: Stage;
  next: NextStep;
  pending: Pending[];
  /** Скільки пунктів готовності закрито з усіх (доступи + обов'язкові файли). */
  readiness: { done: number; total: number };
  delivered: Delivered[];
  numbers: { leak: number; range: [number, number]; health: number; at: string; currency?: string } | null;
  /** Активний проєкт, якщо він є — для рядка стану. */
  project: Project | null;
};

/* ── Стадії: від знайомства до впровадження ──────────────────────────────── */
const STAGES: Record<string, Stage> = {
  intro: { key: 'intro', label: ['Знайомство', 'Getting started'],
    note: ['Ще не рахували, скільки виторгу витікає.', 'We have not yet counted how much revenue leaks.'] },
  express: { key: 'express', label: ['Експрес-аудит пройдено', 'Express audit done'],
    note: ['Є оцінка витоку. Далі — глибокий розбір систем.', 'The leak is estimated. Next — the deep systems analysis.'] },
  deep: { key: 'deep', label: ['Глибокий аудит', 'Deep audit'],
    note: ['Збираємо дані й доступи, готуємо розбір.', 'We are collecting data and access, preparing the analysis.'] },
  audit_done: { key: 'audit_done', label: ['Аудит завершено', 'Audit complete'],
    note: ['Документи передані. Далі — впровадження.', 'The documents are handed over. Next — implementation.'] },
};

const projectStage = (p: Project): Stage => {
  const st = projectStatus(p);
  const meta = PROJECT_STATUSES.find((s) => s.k === st);
  return {
    key: 'project:' + st,
    label: [meta?.l ?? 'Проєкт', 'Project'],
    note: [meta?.note ?? '', ''],
  };
};

/** Проєкт, який зараз веде роботу: активний, інакше найсвіжіший незакритий. */
export function activeProject(rec: DiagRecord | null): Project | null {
  const all = (rec?.projects?.length ? rec.projects : rec?.project ? [rec.project] : []) as Project[];
  if (!all.length) return null;
  return all.find((p) => projectStatus(p) === 'active')
      ?? all.find((p) => !['done', 'archived'].includes(projectStatus(p)))
      ?? all[all.length - 1];
}

/* ── Чого ми чекаємо ─────────────────────────────────────────────────────── */

/** Доступ вважається закритим, коли він виданий, звірений або не застосовний. */
const accessClosed = (s?: { status?: string }) =>
  s?.status === 'granted' || s?.status === 'verified' || s?.status === 'na';

function pendingAccess(rec: DiagRecord | null): Pending[] {
  const log = rec?.accessLog || {};
  return ACCESS_CATALOG
    .filter((a) => !accessClosed(log[a.id]))
    .map((a) => ({ id: a.id, kind: 'access' as const, label: a.system, why: a.why, to: 'docs' as const }));
}

function pendingFiles(rec: DiagRecord | null): Pending[] {
  const have = new Set((rec?.clientFiles || []).filter((f) => f.status === 'uploaded').map((f) => f.reqId));
  return REQUIRED_FILES
    .filter((f) => !have.has(f.reqId))
    /*
     * Назва документа — це `type` («Звіти перевізників»), а `title` описує, що
     * саме в ньому має бути («Строки, статуси, пошкодження»). Спершу я взяв
     * title, і список читався як набір уривків без назв: людина не розуміла,
     * який файл у неї просять.
     */
    .map((f) => ({ id: f.reqId, kind: 'file' as const, label: f.type || f.title, why: f.title, to: 'docs' as const }));
}

/**
 * Профіль компанії: чекаємо лише на поля, без яких розбір справді не почнеться.
 * Решта анкети — корисна, але її відсутність не блокує роботу, і виносити її
 * в «чого ми чекаємо» означало б кричати про несуттєве.
 */
const PROFILE_MUST: { k: 'name' | 'site' | 'niche'; uk: string; en: string }[] = [
  { k: 'name', uk: 'Назва компанії', en: 'Company name' },
  { k: 'site', uk: 'Адреса магазину', en: 'Store address' },
  { k: 'niche', uk: 'Ніша', en: 'Niche' },
];

function pendingProfile(rec: DiagRecord | null, lang: 'uk' | 'en'): Pending[] {
  const c = rec?.company || {};
  return PROFILE_MUST
    .filter((f) => !String(c[f.k] ?? '').trim())
    .map((f) => ({ id: 'profile:' + f.k, kind: 'profile' as const, label: lang === 'en' ? f.en : f.uk, to: 'company' as const }));
}

/* ── Що вже передано ─────────────────────────────────────────────────────── */
function deliveredOf(rec: DiagRecord | null): Delivered[] {
  const docs: Delivered[] = (rec?.sharedDocs || [])
    .filter((d) => d.at)
    .map((d) => ({ id: d.id, title: d.title, at: d.at }));
  // Глави пакета, позначені як передані, — теж результат у руках клієнта.
  const chapters: Delivered[] = Object.entries(rec?.packChecklist || {})
    .filter(([, v]) => v?.st === 'delivered' && v.at)
    .map(([k, v]) => ({ id: 'pack:' + k, title: k, at: v.at as string }));
  return [...docs, ...chapters].sort((a, b) => (a.at < b.at ? 1 : -1));
}

/* ── Головне ─────────────────────────────────────────────────────────────── */

export function buildDash(
  rec: DiagRecord | null,
  express: ExpressLike | null,
  lang: 'uk' | 'en' = 'uk',
): Dash {
  /*
   * Експрес-аудит приходить із localStorage цього пристрою. Якщо його там
   * немає — беремо знімок з акаунта: клієнт міг рахувати з телефона, а зайти з
   * ноутбука. Без цього портал просив би «пройти експрес-аудит» людину, яка
   * його вже пройшла, і показував би стадію «Знайомство» посеред роботи.
   */
  const ex: ExpressLike | null = express ?? (rec?.express ?? null);
  const project = activeProject(rec);
  const pending = [...pendingProfile(rec, lang), ...pendingAccess(rec), ...pendingFiles(rec)];
  const delivered = deliveredOf(rec);
  /*
   * Готовність рахує РІВНО те, що лежить у списку «чекаємо від вас».
   * Спершу знаменник враховував доступи й файли, а профіль компанії — ні, і
   * новий клієнт бачив «40 із 37»: лічильник, який суперечить сам собі, знімає
   * довіру до всіх інших чисел на екрані.
   */
  const total = ACCESS_CATALOG.length + REQUIRED_FILES.length + PROFILE_MUST.length;

  const stage: Stage = project ? projectStage(project)
    : delivered.length ? STAGES.audit_done
    : rec?.funnel?.deepRequested ? STAGES.deep
    : ex ? STAGES.express
    : STAGES.intro;

  /*
   * Наступний крок — рівно один, і в нього завжди є власник.
   *
   * «Що робити далі» без відповіді «кому» — головна вада клієнтських порталів:
   * людина бачить список і не розуміє, чи вона когось тримає. Порядок нижче
   * читається як черга: спершу те, що блокує нас, потім те, що робимо ми.
   */
  const next: NextStep = !ex
    ? { owner: 'you', to: 'audits', text: ['Пройти експрес-аудит — ~2 хвилини', 'Take the express audit — ~2 minutes'] }
    : pending.length
      ? { owner: 'you', to: pending[0].to,
          text: [`Закрити ${pending.length} пункт${plural(pending.length, '', 'и', 'ів')} готовності — без них розбір стоїть`,
                 `Close ${pending.length} readiness item${pending.length === 1 ? '' : 's'} — the analysis waits on them`] }
      : !rec?.funnel?.deepRequested
        ? { owner: 'you', to: 'deep', text: ['Замовити глибокий аудит', 'Order the deep audit'] }
        : { owner: 'we', to: 'project', text: ['Дані зібрано — розбір за нами', 'Data collected — the analysis is on us'] };

  return {
    stage,
    next,
    pending,
    readiness: { done: total - pending.length, total },
    delivered,
    numbers: ex
      ? { leak: ex.total, range: ex.range, health: ex.overallHealth, at: ex.at, currency: ex.input?.currency }
      : null,
    project,
  };
}

/** Українські форми числа: 1 пункт / 2 пункти / 5 пунктів. */
function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
