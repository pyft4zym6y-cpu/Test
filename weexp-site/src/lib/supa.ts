import { createClient, type Session } from '@supabase/supabase-js';

/**
 * Supabase для кабінету діагностики (Етап 3). Конфіг — з env білду
 * (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), як у портала. Якщо не
 * налаштовано — DEMO-режим: «реєстрація» і збереження прогресу локально
 * (localStorage), щоб фіча працювала одразу; після додавання ключів вмикається
 * справжній Supabase з синхронізацією між пристроями.
 */
// Фолбэк-значення проєкту (publishable key — публічний за дизайном, доступ гейтить
// RLS). Env-змінні мають пріоритет, якщо задані у Vercel.
const FALLBACK_URL = 'https://lpbyigsezimqofygpfof.supabase.co';
const FALLBACK_ANON = 'sb_publishable_zlBld1bJe-Tf4-UHW6EdNA_I2jr9XcT';
const url = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL).replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_ANON;

export const CONFIGURED = Boolean(url && anon);
export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anon ?? 'anon', {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type DiagUser = { id: string; email: string; role?: Role };

/** true, якщо користувач збережений у хмарному кабінеті (Supabase), а не локально. */
export const isCloudUser = (u: DiagUser | null): boolean => !!u && !u.id.startsWith('local:') && !u.id.startsWith('demo:');

/** Профіль компанії в кабінеті (розділ «Дані компанії»). */
export type CompanyProfile = {
  name?: string; site?: string; niche?: string; revenue?: string;
  channels?: string[]; contactName?: string; contactPhone?: string; notes?: string;
  // Розширений бізнес-профіль (контекст для глибокого аналізу):
  industry?: string;        // сфера бізнесу (пріоритетне поле)
  bizType?: string;         // B2B / B2C / D2C / Marketplace / Hybrid
  model?: string;           // напрям / тип бізнесу (вільний опис)
  markets?: string;         // основні ринки / географії
  countries?: string;       // країна / країни роботи
  acqChannels?: string[];   // канали залучення клієнтів
  domains?: string;         // додаткові домени
  categories?: string;      // ключові категорії товарів / послуг
  sizeRange?: string;       // розмір бізнесу / діапазон обороту
  teamSize?: string;        // розмір команди
  outlets?: string;         // кількість точок продажу / магазинів
  platform?: string;        // e-commerce платформа
  crmErp?: string;          // CRM / ERP
};
/** Стан воронки клієнта (наскрізна логіка кабінету). */
/** Статус доступу до кожного рівня аудиту (керована воронка): відсутній ключ = «не запрошено». */
export type TierStatus = 'requested' | 'data' | 'granted' | 'rejected';
/** Подія зміни статусу рівня — для таймлайну прогресу (хто/коли перевів). */
export type TierEvent = { st: TierStatus | 'none'; at: string; by?: 'client' | 'manager' };
/** Файл, доданий клієнтом під рівень (Supabase Storage або локально). */
export type TierFile = { name: string; path: string; at: string; size?: number };
export type FunnelState = {
  leadAt?: string; leadContact?: string;
  deepRequested?: boolean; deepAt?: string; deepDepth?: string; deepTiers?: string[];
  tierStatus?: Record<string, TierStatus>;
  tierReason?: Record<string, string>;
  tierChecklist?: Record<string, string[]>;   // ключі виконаних пунктів чек-листа доступів, по рівнях
  tierHistory?: Record<string, TierEvent[]>;   // таймлайн змін статусу, по рівнях
  tierFiles?: Record<string, TierFile[]>;      // завантажені файли, по рівнях
  accessCode?: string;                         // унікальний код відкриття глибокого аудиту (видає менеджер при «Надати»)
  auditRole?: string;                          // роль спеціаліста у спільному аудиті (обмежує блоки)
  auditId?: string;                            // id спільного аудиту компанії, до якого приєднаний акаунт
};

/** Унікальний код доступу до глибокого аудиту (видається клієнту при наданні рівня). */
export function genAccessCode(): string {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => s[Math.floor(Math.random() * s.length)]).join('');
  return `WEEXP-${part()}-${part()}`;
}

/** Знімок експрес-аудиту, закріплений за акаунтом (щоб бачив і клієнт, і адмін). */
export type ExpressSnapshot = {
  at: string; total: number; range: [number, number]; primary: string; secondary?: string; overallHealth: number;
  symptoms?: string[]; source?: string;
  input?: { monthlyRevenue?: number; aov?: number; conversion?: number; repeatRate?: number; returnsRate?: number; grossMargin?: number; cac?: number };
  health?: { key: string; score: number }[];
  leaks?: { key: string; amount: number }[];
  actions?: string[];
};

/** Дані діагностики, що зберігаються між сесіями (усі етапи). */
export type DiagRecord = {
  site?: string;
  stage1?: unknown;
  express?: ExpressSnapshot;         // експрес-аудит, прив'язаний до акаунту (з калькулятора)
  stage1Money?: [number, number];   // діапазон можливості з Етапу 1 (€) — якір для Етапу 3
  stage2?: unknown;
  stage2Result?: unknown;
  stage3?: Record<string, unknown>;
  company?: CompanyProfile;         // розділ «Дані компанії»
  funnel?: FunnelState;             // наскрізна воронка кабінету
  project?: Project;                // (legacy) один проект — мігрує в projects[]
  projects?: Project[];             // розділ «Мій проект»: кілька проектів на клієнта (веде менеджер)
  pmDir?: PmDirectory;              // проект-офіс: довідник команди та ставок (лише в записі менеджера)
  assessment?: Record<string, ModuleScore>; // C-level оцінка модулів аудиту (адмін-шар, ключ = block.key)
  accessLog?: Record<string, AccessState>;   // каталог доступів клієнта (ключ = AC-id)
  notes?: ProjectNote[];                      // внутрішні нотатки/коментарі аудитора
  auditJobs?: AuditJobRef[];                  // прогони рушія Commerce OS (worker)
  adminFiles?: AdminFile[];                   // власні файли аудитора (дані/дельіверабли), внутрішнє
  findingReviews?: Record<string, FindingReview>; // рецензії findings рушія (ключ = findingId) — цикл навчання
  updatedAt?: string;
};

/** Рецензія однієї знахідки рушія (human-in-the-loop, замикає цикл навчання). */
export type FindingReview = {
  verdict: 'accepted' | 'rejected' | 'corrected';
  correctedPriority?: 'P0' | 'P1' | 'P2';
  note?: string;
  at: string;
  sent?: boolean;   // відправлено у леджер навчання воркера
};

/** Власний файл аудитора, прикріплений до картки клієнта. */
export type AdminFile = { path: string; name: string; kind?: 'data' | 'deliverable' | 'other'; at: string; by?: string };

/** Посилання на прогін аудиту рушієм (worker). */
export type AuditJobRef = { id: string; at: string; site?: string; tier?: number; status?: string; summary?: string; health?: number | null };

/** Матриця зрілості з рушія Commerce OS (worker maturity.json). */
export type MaturityRow = { domain: string; assesses: string; level: number | null; basis: string; source: string };
export type WorkerMaturity = { rows: MaturityRow[]; observedAvg: number | null };

/**
 * Домени рушія → наші модулі A–P. На L0-прогоні (без доступів) рівні мають лише
 * SEO/Platform/Product/Analytics/Marketing; решта — null і пропускаються. Дублі
 * (кілька доменів на один модуль) заповнюють модуль лише якщо він ще порожній.
 */
export const MATURITY_DOMAIN_MODULE: Record<string, string> = {
  SEO: 'seo', Platform: 'tech', Product: 'ux', Analytics: 'analytics', Marketing: 'marketing',
  Strategy: 'strategy', Customer: 'customer', Brand: 'brand', Sales: 'commercial', CRM: 'crm',
  Pricing: 'commercial', Operations: 'ops', Marketplace: 'ops', International: 'strategy',
  Finance: 'finance', People: 'people', AI: 'tech', Governance: 'processes',
};

/**
 * Зіллє матрицю зрілості рушія у C-level оцінку модулів (level 1–5 → score 20–100).
 * Не перетирає ручні поля (gap/rec/owner/priority/expected) — оновлює лише score/state/
 * evidence і лише для модулів, які ще не мають ручної оцінки (evidence без мітки рушія).
 * Повертає { assessment, imported, skipped }.
 */
export function maturityToAssessment(
  maturity: WorkerMaturity,
  existing: Record<string, ModuleScore> = {},
): { assessment: Record<string, ModuleScore>; imported: number; skipped: number } {
  const TAG = 'Commerce OS';
  const next: Record<string, ModuleScore> = { ...existing };
  let imported = 0, skipped = 0;
  for (const r of maturity.rows || []) {
    if (r.level == null) continue;
    const key = MATURITY_DOMAIN_MODULE[r.domain];
    if (!key) continue;
    const prev = next[key];
    // не чіпати модуль з ручною оцінкою (є score/gap/rec, але не з рушія)
    if (prev && (prev.gap || prev.rec) && !(prev.evidence || '').includes(TAG)) { skipped++; continue; }
    // дубль-домен: не перетирати вже імпортований вищим рівнем
    if (prev && (prev.evidence || '').includes(TAG) && typeof prev.score === 'number' && prev.score >= r.level * 20) { skipped++; continue; }
    next[key] = {
      ...prev,
      score: r.level * 20,
      state: `Рівень зрілості L${r.level} — ${r.assesses}`,
      evidence: `${TAG} · ${r.domain} · ${r.basis}`,
    };
    imported++;
  }
  return { assessment: next, imported, skipped };
}

/** Стан одного доступу (каталог доступів у картці клієнта). */
export type AccessState = {
  status?: 'requested' | 'granted' | 'verified' | 'na';
  method?: 'view' | 'oauth' | 'upload';
  note?: string;
  at?: string;
};
/** Внутрішня нотатка/коментар аудитора до проєкту (або до модуля). */
export type ProjectNote = { id: string; at: string; author?: string; module?: string; text: string };

/** C-level оцінка одного модуля аудиту (адмінський шар: Current State → … → Owner). */
export type ModuleScore = {
  state?: string;        // current state
  evidence?: string;     // джерело/докази
  score?: number;        // 0–100 (maturity)
  gap?: string;          // розрив
  impact?: 'low' | 'med' | 'high';
  rec?: string;          // рекомендація
  priority?: 'P1' | 'P2' | 'P3';
  owner?: string;        // відповідальний
  expected?: string;     // очікуваний ефект
};

/* ─── «Мій проект»: план ведення (Гант, команда, фінкалендар, тарифікація) ─── */
export type ProjTask = { id: string; name: string; track?: string; startM: number; lenM: number; progress?: number; owner?: string };
export type ProjMember = { id: string; role: string; name: string };
export type ProjPayment = { id: string; label: string; month: string; amount: number; status: 'paid' | 'pending' };
export type ProjTariffItem = { id: string; label: string; hours: number; rate: number };
export type ProjMonth = { id: string; month: string; items: ProjTariffItem[] };
export type Project = {
  id?: string;
  title?: string;
  startMonth?: string;   // 'YYYY-MM' — місяць 0 діаграми Ганта
  span?: number;         // кількість місяців у діаграмі
  tasks?: ProjTask[];
  team?: ProjMember[];
  payments?: ProjPayment[];
  tariff?: ProjMonth[];
  budget?: Record<string, number>;  // бюджет-матриця: ключ `${taskId}:${monthIndex}` → € (внутрішнє, проект-офіс)
  published?: boolean;   // видимий клієнту (менеджер публікує, коли готово)
  updatedAt?: string;
};
export function emptyProject(): Project {
  return { id: 'pr_' + Math.random().toString(36).slice(2, 9), title: '', startMonth: '', span: 6, tasks: [], team: [], payments: [], tariff: [], budget: {}, published: false };
}
/** Список проектів клієнта з міграцією зі старого одиночного `project`. */
export function getProjects(rec?: DiagRecord | null): Project[] {
  if (!rec) return [];
  if (rec.projects && rec.projects.length) return rec.projects.map((p) => ({ ...p, id: p.id || 'pr_' + Math.random().toString(36).slice(2, 9) }));
  if (rec.project) return [{ ...rec.project, id: rec.project.id || 'pr_legacy' }];
  return [];
}

/* ─── Проект-офіс (PM): довідник команди та ставок ─── */
export type PmSpecialist = { id: string; name: string; role: string; rate: number };  // ставка €/год
export type PmRoleRate = { id: string; role: string; rate: number };
export type PmDirectory = { specialists?: PmSpecialist[]; roleRates?: PmRoleRate[]; knowledge?: string; presets?: Project[] };

/** AI-чернетка проекту з відповідей аудиту (через /api/ai-draft → Anthropic). */
export type AiDraft = { title?: string; tasks?: ProjTask[]; team?: ProjMember[]; tariff?: ProjMonth[]; rationale?: string };
export async function aiDraftProject(payload: {
  answers: Record<string, unknown>; company?: string; knowledge?: string;
  roleRates?: PmRoleRate[]; specialists?: PmSpecialist[]; startMonth?: string; span?: number;
}): Promise<{ ok: boolean; draft?: AiDraft; error?: string }> {
  try {
    const r = await fetch('/api/ai-draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (j.error) return { ok: false, error: j.error };
    return { ok: true, draft: j.draft as AiDraft };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/** AI-чернетка C-level оцінки модулів аудиту з даних клієнта (аудитор доопрацьовує). */
export async function aiScoreAudit(payload: {
  modules: { key: string; title: string }[];
  answers?: Record<string, unknown>; company?: unknown; express?: unknown;
}): Promise<{ ok: boolean; scores?: Record<string, ModuleScore>; error?: string }> {
  try {
    const r = await fetch('/api/ai-score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (j.error) return { ok: false, error: j.error };
    return { ok: true, scores: (j.scores || {}) as Record<string, ModuleScore> };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/** Виклик аудит-рушія (worker) через серверний проксі /api/audit-run. */
export async function runWorkerAudit(action: 'start' | 'status' | 'health' | 'learn' | 'learnSnapshot', payload: Record<string, unknown> = {}): Promise<{ ok?: boolean; error?: string; id?: string; job?: Record<string, unknown>; hasKey?: boolean; written?: number; snapshot?: LearningSnapshot }> {
  try {
    const r = await fetch('/api/audit-run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    return await r.json();
  } catch (e) { return { error: String(e) }; }
}

/** Знахідка рушія для рецензування (форма з worker registry / status.job.findings). */
export type ReviewableFinding = { id: string; domain: string; key?: string | null; title: string; confidence: number; priority: 'P0' | 'P1' | 'P2' };
/** Знімок навчання (компактний зріз leaning snapshot воркера для UI). */
export type LearningSnapshot = {
  generatedAt: string; ledgerEntries: number; distinctAudits: number;
  calibration: { n: number; ece: number | null; reliable: boolean; note: string };
  patterns: { signature: string; domain: string; theme: string; support: number; acceptRate: number }[];
  antiPatterns: { signature: string; domain: string; theme: string; support: number; acceptRate: number }[];
  suggestions: { kind: string; target: string; rationale: string; evidenceN: number }[];
  goldenCandidateCount: number; note: string;
};

/**
 * Надіслати рецензії знахідок у леджер навчання воркера (замикає цикл: аудитор
 * підтверджує/відхиляє/коригує знахідки — рушій калібрується на реальних даних).
 */
export async function sendFindingReviews(auditId: string, findings: ReviewableFinding[], verdicts: { findingId: string; verdict: 'accepted' | 'rejected' | 'corrected'; correctedPriority?: 'P0' | 'P1' | 'P2'; note?: string }[], reviewer: string): Promise<{ ok?: boolean; written?: number; error?: string }> {
  return runWorkerAudit('learn', { auditId, findings, verdicts, reviewer });
}

/** Прочитати знімок навчання з воркера. */
export async function loadLearningSnapshot(): Promise<{ ok?: boolean; snapshot?: LearningSnapshot; error?: string }> {
  return runWorkerAudit('learnSnapshot');
}

/** Довідник проект-офісу зберігається у записі менеджера (diagnostics.data.pmDir). */
export async function loadPmDirectory(): Promise<PmDirectory> {
  const u = await currentUser();
  if (!u) return { specialists: [], roleRates: [] };
  const rec = await loadDiag(u);
  return rec.pmDir || { specialists: [], roleRates: [] };
}
export async function savePmDirectory(dir: PmDirectory): Promise<{ ok: boolean; error?: string }> {
  const u = await currentUser();
  if (!u) return { ok: false, error: 'no_user' };
  try { await saveDiag(u, { pmDir: dir }); return { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
}

const LS_SESSION = 'weexp:diag-user';
const LS_DATA = (id: string) => `weexp:diag-data:${id}`;

const isLocal = (u: DiagUser) => u.id.startsWith('local:') || u.id.startsWith('demo:');
const lsUser = (): DiagUser | null => { try { const r = localStorage.getItem(LS_SESSION); return r ? JSON.parse(r) : null; } catch { return null; } };

/* ─── Auth ─── */
export async function currentUser(): Promise<DiagUser | null> {
  // Локальний fallback-користувач (демо або коли не було сесії) має пріоритет.
  const local = lsUser(); if (local) return local;
  if (!CONFIGURED) return null;
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s?.user) return null;
  // Роль — з app_metadata (керується сервером /api/team). У бутстрап-super — з коду.
  const meta = (s.user.app_metadata || {}) as { role?: Role };
  return { id: s.user.id, email: s.user.email ?? '', role: meta.role };
}

/** Виклик серверного керування командою (/api/team) з токеном поточного super-адміна. */
export async function teamApi(action: string, payload: Record<string, unknown> = {}): Promise<{ ok?: boolean; error?: string; users?: TeamMember[]; user?: unknown }> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { error: 'Немає сесії. Увійдіть через Google.' };
    const r = await fetch('/api/team', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, ...payload }) });
    return await r.json();
  } catch (e) { return { error: String(e) }; }
}
export type TeamMember = { id: string; email: string; role: Role | null; banned: boolean; lastSignIn: string | null; createdAt: string | null; confirmed: boolean };

/**
 * Реєстрація/вхід. Ніколи не блокує потік: якщо Supabase не дав сесію (напр.
 * увімкнено Confirm email) — падаємо на локальне збереження, щоб клієнт міг
 * продовжити. Коли сесія є — працює справжній Supabase із синхронізацією.
 */
export async function authenticate(email: string, password: string): Promise<{ user?: DiagUser; error?: string; local?: boolean; notice?: string }> {
  let notice = '';
  if (CONFIGURED) {
    try {
      // 1) Пробуємо вхід (акаунт уже існує).
      let res = await supabase.auth.signInWithPassword({ email, password });
      // 2) Немає акаунта → реєструємо. При вимкненому Confirm email одразу є сесія.
      if (res.error) {
        const up = await supabase.auth.signUp({ email, password });
        if (up.error) {
          notice = up.error.message;
        } else if (up.data.session) {
          res = up as unknown as typeof res;            // зареєстрували + увійшли
        } else {
          // Сесії немає — найімовірніше увімкнено Confirm email. Пробуємо ще раз увійти.
          res = await supabase.auth.signInWithPassword({ email, password });
          if (res.error) notice = 'Підтвердіть email за посиланням у листі, потім увійдіть — або вимкніть Confirm email у Supabase.';
        }
      }
      const u = res.data?.user, sess = res.data?.session;
      if (u && sess) {
        try { localStorage.removeItem(LS_SESSION); } catch { /* ignore */ }
        return { user: { id: u.id, email: u.email ?? email } };   // справжній хмарний користувач
      }
    } catch { /* мережа/налаштування — падаємо на локальний режим */ }
  }
  // Фолбэк: не заблокувати клієнта. Дані зберігаються локально в браузері.
  const user = { id: 'local:' + email.toLowerCase(), email };
  try { localStorage.setItem(LS_SESSION, JSON.stringify(user)); } catch { /* ignore */ }
  return { user, local: true, notice: notice || undefined };
}

export async function signOut(): Promise<void> {
  try { localStorage.removeItem(LS_SESSION); } catch { /* ignore */ }
  if (CONFIGURED) await supabase.auth.signOut();
}

/* ─── Повноцінна реєстрація/вхід (email-підтвердження + Google OAuth) ───
   Потребує налаштувань у Supabase: увімкнений Confirm email, провайдер Google
   (client id/secret з Google Cloud), Site URL + Redirect URLs = адреса сайту. */
const REDIRECT = () => (typeof window !== 'undefined' ? `${window.location.origin}/cabinet` : undefined);
export type AuthOutcome = { user?: DiagUser; error?: string; confirm?: string; local?: boolean };

/** Реєстрація через email+пароль. Увімкнено Confirm email → повертає confirm (лист надіслано);
 *  інакше — одразу user із сесією. Без Supabase — локальний демо-режим. */
export async function registerWithEmail(email: string, password: string, captchaToken?: string): Promise<AuthOutcome> {
  if (CONFIGURED) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: REDIRECT(), captchaToken } });
      if (error) return { error: error.message };
      if (data.session && data.user) { try { localStorage.removeItem(LS_SESSION); } catch { /* ignore */ } return { user: { id: data.user.id, email: data.user.email ?? email } }; }
      return { confirm: email };   // сесії нема → лист підтвердження надіслано
    } catch { /* мережа — падаємо на локальний режим */ }
  }
  const user = { id: 'local:' + email.toLowerCase(), email };
  try { localStorage.setItem(LS_SESSION, JSON.stringify(user)); } catch { /* ignore */ }
  return { user, local: true };
}

/** Вхід через email+пароль. Розрізняє «email ще не підтверджено» (confirm). */
export async function signInWithEmail(email: string, password: string, captchaToken?: string): Promise<AuthOutcome> {
  if (CONFIGURED) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
      if (error) {
        if (/confirm|not confirmed|verify/i.test(error.message)) return { confirm: email, error: error.message };
        return { error: error.message };
      }
      if (data.user && data.session) { try { localStorage.removeItem(LS_SESSION); } catch { /* ignore */ } return { user: { id: data.user.id, email: data.user.email ?? email } }; }
    } catch { /* fallback */ }
  }
  const user = { id: 'local:' + email.toLowerCase(), email };
  try { localStorage.setItem(LS_SESSION, JSON.stringify(user)); } catch { /* ignore */ }
  return { user, local: true };
}

/** Повторно надіслати лист підтвердження реєстрації. */
export async function resendConfirmation(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: true };
  try { const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: REDIRECT() } }); return error ? { ok: false, error: error.message } : { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
}

/** Вхід/реєстрація через Google (OAuth). Після редіректу сесію підхоплює
 *  detectSessionInUrl; акаунти з тим самим підтвердженим email лінкуються Supabase. */
export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (!CONFIGURED) return { error: 'not_configured' };
  try { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: REDIRECT() } }); return error ? { error: error.message } : {}; }
  catch (e) { return { error: String(e) }; }
}

export function onAuth(cb: (u: DiagUser | null) => void): () => void {
  if (!CONFIGURED) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e: string, s: Session | null) =>
    cb(s?.user ? { id: s.user.id, email: s.user.email ?? '' } : null));
  return () => data.subscription.unsubscribe();
}

/* ─── Persistence (таблиця diagnostics, jsonb) ─── */
export async function loadDiag(user: DiagUser): Promise<DiagRecord> {
  if (!CONFIGURED || isLocal(user)) {
    try { const raw = localStorage.getItem(LS_DATA(user.id)); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }
  try {
    const { data } = await supabase.from('diagnostics').select('data').eq('user_id', user.id).maybeSingle();
    return (data?.data as DiagRecord) ?? {};
  } catch { return {}; }
}

export async function saveDiag(user: DiagUser, patch: DiagRecord): Promise<void> {
  const prev = await loadDiag(user);
  const merged: DiagRecord = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  if (!CONFIGURED || isLocal(user)) {
    try { localStorage.setItem(LS_DATA(user.id), JSON.stringify(merged)); } catch { /* ignore */ }
    return;
  }
  try { await supabase.from('diagnostics').upsert({ user_id: user.id, email: user.email, data: merged }, { onConflict: 'user_id' }); } catch { /* ignore */ }
}

/* ─── Керування доступами менеджером (Етап D) ───
   Consoleа /manage бачить лише емейли зі списку MANAGER_EMAILS (звіряється з
   акаунтом, а не «просто кнопка»). Читання/запис чужих рядків дозволяє RLS-політика
   у Supabase (SQL — в інструкції), тож ключ лишається публічним. */
/* ─── Ролі команди ───
   Рольова модель доступу. Бутстрап-конфіг у коді (TEAM_ROLES) — надійне джерело,
   яке не можна зламати з UI. Динамічне керування (створення адміна, інвайти,
   паролі) додається окремим кроком через серверний Auth Admin API. */
export type Role = 'super' | 'admin' | 'manager' | 'auditor';
export const TEAM_ROLES: Record<string, Role> = {
  'pashasidorenko18@gmail.com': 'super',
  'hello@weexp.agency': 'super',
};
/** Капабіліті (що дозволено). Розділ = вкладка адмінки; дії — окремо. */
export type Capability =
  | 'view_dashboard' | 'view_users' | 'view_audits' | 'view_leads'
  | 'edit_template' | 'manage_pm' | 'manage_access' | 'delete_data'
  | 'manage_settings' | 'manage_team';
const ROLE_CAPS: Record<Role, Capability[]> = {
  super: ['view_dashboard', 'view_users', 'view_audits', 'view_leads', 'edit_template', 'manage_pm', 'manage_access', 'delete_data', 'manage_settings', 'manage_team'],
  admin: ['view_dashboard', 'view_users', 'view_audits', 'view_leads', 'edit_template', 'manage_pm', 'manage_access', 'delete_data'],
  manager: ['view_dashboard', 'view_users', 'view_audits', 'view_leads', 'manage_access'],
  auditor: ['view_audits'],
};
export const ROLE_LABEL: Record<Role, string> = {
  super: 'Super Admin', admin: 'Admin', manager: 'Manager', auditor: 'Auditor / Specialist',
};
export function roleOf(u: DiagUser | null): Role | null {
  if (!u) return null;
  // Бутстрап-super з коду завжди super (щоб не залочити себе), далі — роль із сесії.
  return TEAM_ROLES[(u.email || '').toLowerCase()] ?? u.role ?? null;
}
/** Чи має користувач право на дію. */
export function can(u: DiagUser | null, cap: Capability): boolean {
  const r = roleOf(u);
  return !!r && ROLE_CAPS[r].includes(cap);
}
// Бек-сумісність: будь-яка роль = доступ у адмінку.
export const MANAGER_EMAILS = Object.keys(TEAM_ROLES);
export function isManager(u: DiagUser | null): boolean {
  return roleOf(u) !== null;
}
export type AdminRow = {
  userId: string; email: string; company?: string; funnel?: FunnelState; updatedAt?: string;
  hasExpress?: boolean; hasDeep?: boolean; record?: DiagRecord;
};
/** Усі клієнтські записи для адмінки/консолі (потрібна RLS-політика для адмінів). */
export async function listAllDiagnostics(): Promise<AdminRow[]> {
  if (!CONFIGURED) return [];
  try {
    const { data, error } = await supabase.from('diagnostics').select('user_id,email,data');
    if (error || !data) return [];
    const rows: AdminRow[] = data.map((r: { user_id: string; email: string; data: DiagRecord }) => ({
      userId: r.user_id, email: r.email, company: r.data?.company?.name, funnel: r.data?.funnel, updatedAt: r.data?.updatedAt,
      hasExpress: Boolean(r.data?.stage1Money || r.data?.stage1),
      hasDeep: Boolean(r.data?.stage3 && Object.keys(r.data.stage3).length > 0),
      record: r.data,
    }));
    return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  } catch { return []; }
}

/* ─── Спільний аудит компанії (Фаза B) ─── */
export type AuditAnswer = { value: unknown; by?: string; at?: string };

/** Забезпечити рядок аудиту компанії за кодом (один спільний для всіх спеціалістів). */
export async function ensureAudit(company: string, code: string, version: number): Promise<string | null> {
  const fallback = 'local:' + (code || 'audit');
  if (!CONFIGURED) return fallback;
  try {
    const { data: found } = await supabase.from('audits').select('id').eq('access_code', code).maybeSingle();
    if (found?.id) return found.id as string;
    const { data, error } = await supabase.from('audits').insert({ company, access_code: code, template_version: version }).select('id').maybeSingle();
    return error ? fallback : ((data?.id as string) ?? fallback);   // мережа/налаштування впали — не блокуємо власника
  } catch { return fallback; }
}
/** Знайти id аудиту за кодом (для приєднання зі стороннього акаунта). */
export async function findAuditIdByCode(code: string): Promise<string | null> {
  if (!CONFIGURED) return 'local:' + code.trim().toUpperCase();
  const c = code.trim().toUpperCase();
  try { const { data, error } = await supabase.from('audits').select('id').eq('access_code', c).maybeSingle(); if (error) return 'local:' + c; return (data?.id as string) ?? null; } catch { return 'local:' + c; }
}
export async function loadAuditAnswers(auditId: string): Promise<Record<string, AuditAnswer>> {
  if (!CONFIGURED || auditId.startsWith('local:')) { try { return JSON.parse(localStorage.getItem('weexp:aud:' + auditId) || '{}'); } catch { return {}; } }
  try {
    const { data } = await supabase.from('audit_answers').select('qkey,value,updated_by,updated_at').eq('audit_id', auditId);
    const m: Record<string, AuditAnswer> = {};
    (data as Array<Record<string, unknown>> || []).forEach((r) => { m[String(r.qkey)] = { value: r.value, by: r.updated_by as string, at: r.updated_at as string }; });
    return m;
  } catch { return {}; }
}
export async function saveAuditAnswer(auditId: string, qkey: string, value: unknown, by: string): Promise<{ ok: boolean; error?: string; at?: string }> {
  const at = new Date().toISOString();
  if (!CONFIGURED || auditId.startsWith('local:')) {
    try { const k = 'weexp:aud:' + auditId; const m = JSON.parse(localStorage.getItem(k) || '{}'); m[qkey] = { value, by, at }; localStorage.setItem(k, JSON.stringify(m)); } catch { /* ignore */ }
    return { ok: true, at };
  }
  try {
    const { error } = await supabase.from('audit_answers').upsert({ audit_id: auditId, qkey, value, updated_by: by, updated_at: at }, { onConflict: 'audit_id,qkey' });
    if (error) return { ok: false, error: error.message };
    supabase.from('audit_answer_log').insert({ audit_id: auditId, qkey, value, updated_by: by }).then(() => {}, () => {});   // історія, best-effort
    return { ok: true, at };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/** Уточнююче питання Кроку 2 (ad-hoc від менеджера конкретному клієнту). */
export type ExtraQ = { key: string; label: string; type: string; hint?: string; options?: string[] };
/** Завантажити уточнення (Крок 2) аудиту за кодом. */
export async function loadAuditExtra(code: string): Promise<ExtraQ[]> {
  const id = await findAuditIdByCode(code);
  if (!id) return [];
  if (id.startsWith('local:')) { try { return JSON.parse(localStorage.getItem('weexp:aud-extra:' + id) || '[]'); } catch { return []; } }
  try { const { data } = await supabase.from('audits').select('extra').eq('id', id).maybeSingle(); return (data?.extra as ExtraQ[]) || []; } catch { return []; }
}
/** Менеджер зберігає уточнення (Крок 2) для аудиту клієнта. */
export async function saveAuditExtra(code: string, extra: ExtraQ[]): Promise<{ ok: boolean; error?: string }> {
  const id = await findAuditIdByCode(code);
  if (!id) return { ok: false, error: 'Аудит не знайдено (клієнт ще не відкрив розділ).' };
  if (id.startsWith('local:')) { try { localStorage.setItem('weexp:aud-extra:' + id, JSON.stringify(extra)); } catch { /* ignore */ } return { ok: true }; }
  try { const { error } = await supabase.from('audits').update({ extra }).eq('id', id); return error ? { ok: false, error: error.message } : { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
}

/** Стадія ліда в міні-CRM (воронка продажів). */
export type LeadStatus = 'new' | 'progress' | 'qualified' | 'proposal' | 'won' | 'lost';
/** Лід (заявка з форм). Пишеться в таблицю `leads` (див. INFRA/SQL); для адмінки. */
export type LeadRow = {
  id?: string; at?: string; source?: string; email?: string; name?: string; phone?: string;
  role?: string; store?: string; turnover?: string; task?: string; timeline?: string; budget?: string;
  comment?: string; diag?: string; calc?: string; status?: LeadStatus;
};
export async function listLeads(): Promise<LeadRow[]> {
  if (!CONFIGURED) return [];
  try {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(500);
    if (error || !data) return [];
    const s = (v: unknown) => (v ? String(v) : undefined);
    return (data as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id ?? ''), at: s(r.created_at), source: s(r.source), email: s(r.email), name: s(r.name), phone: s(r.phone),
      role: s(r.role), store: s(r.store), turnover: s(r.turnover), task: s(r.task), timeline: s(r.timeline), budget: s(r.budget),
      comment: s(r.comment), diag: s(r.diag), calc: s(r.calc), status: (s(r.status) as LeadStatus) || 'new',
    }));
  } catch { return []; }
}

/** Змінити стадію ліда в CRM. */
export async function setLeadStatus(id: string, status: LeadStatus): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  try {
    // .select() повертає оновлені рядки: якщо порожньо — RLS відхилив запис (немає UPDATE-політики).
    const { data, error } = await supabase.from('leads').update({ status }).eq('id', id).select('id');
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) return { ok: false, error: 'Оновлення не застосовано — додайте UPDATE-політику для адмінів на таблицю leads (RLS). Див. чат/INFRA.' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
/** Видалити заявку (лід) назавжди — прибирання тестових/неактуальних даних. */
export async function deleteLead(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  try {
    const { data, error } = await supabase.from('leads').delete().eq('id', id).select('id');
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) return { ok: false, error: 'Не видалено — додайте DELETE-політику для адмінів на таблицю leads (RLS).' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
/** Видалити запис клієнта (профіль, експрес/глибокий аудит, воронку, проекти) — тестові дані. */
export async function deleteDiagnostics(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  try {
    const { data, error } = await supabase.from('diagnostics').delete().eq('user_id', userId).select('user_id');
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) return { ok: false, error: 'Не видалено — додайте DELETE-політику для адмінів на diagnostics (RLS).' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/** Менеджер проставляє статус рівня клієнту (+ причину); подія лягає в таймлайн. */
export async function setTierStatusFor(userId: string, tier: string, status: TierStatus, reason?: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  try {
    const { data } = await supabase.from('diagnostics').select('data').eq('user_id', userId).maybeSingle();
    const rec = (data?.data as DiagRecord) || {};
    const funnel: FunnelState = { ...(rec.funnel || {}) };
    funnel.tierStatus = { ...(funnel.tierStatus || {}), [tier]: status };
    if (reason !== undefined) funnel.tierReason = { ...(funnel.tierReason || {}), [tier]: reason };
    // При наданні доступу — видаємо унікальний код входу в глибокий аудит (один на клієнта).
    if (status === 'granted' && !funnel.accessCode) funnel.accessCode = genAccessCode();
    const history = { ...(funnel.tierHistory || {}) };
    history[tier] = [...(history[tier] || []), { st: status, at: new Date().toISOString(), by: 'manager' }];
    funnel.tierHistory = history;
    const merged: DiagRecord = { ...rec, funnel, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('diagnostics').update({ data: merged }).eq('user_id', userId);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/** Скинути рівень до «не запрошено» (прибрати запис) — прибирання тестових/помилкових статусів. */
export async function clearTierStatusFor(userId: string, tier: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  try {
    const { data } = await supabase.from('diagnostics').select('data').eq('user_id', userId).maybeSingle();
    const rec = (data?.data as DiagRecord) || {};
    const funnel: FunnelState = { ...(rec.funnel || {}) };
    const ts = { ...(funnel.tierStatus || {}) }; delete ts[tier]; funnel.tierStatus = ts;
    const tr = { ...(funnel.tierReason || {}) }; delete tr[tier]; funnel.tierReason = tr;
    const th = { ...(funnel.tierHistory || {}) }; delete th[tier]; funnel.tierHistory = th;
    const merged: DiagRecord = { ...rec, funnel, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('diagnostics').update({ data: merged }).eq('user_id', userId);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/** Менеджер зберігає/оновлює проекти клієнта (в diagnostics.data.projects). Клієнт лише переглядає. */
/** Зберегти C-level оцінку модулів для клієнта (адмінський шар). */
export async function saveAssessmentFor(userId: string, assessment: Record<string, ModuleScore>): Promise<{ ok: boolean; error?: string }> {
  const stamp = new Date().toISOString();
  if (!CONFIGURED || userId.startsWith('local:') || userId.startsWith('demo:')) {
    try { const k = LS_DATA(userId); const prev = JSON.parse(localStorage.getItem(k) || '{}'); localStorage.setItem(k, JSON.stringify({ ...prev, assessment })); } catch { /* ignore */ }
    return { ok: true };
  }
  try {
    const { data } = await supabase.from('diagnostics').select('data').eq('user_id', userId).maybeSingle();
    const rec = (data?.data as DiagRecord) || {};
    const merged: DiagRecord = { ...rec, assessment, updatedAt: stamp };
    const { data: upd, error } = await supabase.from('diagnostics').update({ data: merged }).eq('user_id', userId).select('user_id');
    if (error) return { ok: false, error: error.message };
    if (!upd || upd.length === 0) return { ok: false, error: 'Оновлення не застосовано — перевірте UPDATE-політику адміна на diagnostics (RLS).' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/** Оновити один розділ record клієнта (адмінський шар: accessLog / notes / …). */
export async function savePatchFor(userId: string, patch: Partial<DiagRecord>): Promise<{ ok: boolean; error?: string }> {
  const stamp = new Date().toISOString();
  if (!CONFIGURED || userId.startsWith('local:') || userId.startsWith('demo:')) {
    try { const k = LS_DATA(userId); const prev = JSON.parse(localStorage.getItem(k) || '{}'); localStorage.setItem(k, JSON.stringify({ ...prev, ...patch })); } catch { /* ignore */ }
    return { ok: true };
  }
  try {
    const { data } = await supabase.from('diagnostics').select('data').eq('user_id', userId).maybeSingle();
    const rec = (data?.data as DiagRecord) || {};
    const merged: DiagRecord = { ...rec, ...patch, updatedAt: stamp };
    const { data: upd, error } = await supabase.from('diagnostics').update({ data: merged }).eq('user_id', userId).select('user_id');
    if (error) return { ok: false, error: error.message };
    if (!upd || upd.length === 0) return { ok: false, error: 'Оновлення не застосовано — перевірте UPDATE-політику адміна на diagnostics (RLS).' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function saveProjectsFor(userId: string, projects: Project[]): Promise<{ ok: boolean; error?: string }> {
  const stamp = new Date().toISOString();
  const list: Project[] = projects.map((p) => ({ ...p, id: p.id || 'pr_' + Math.random().toString(36).slice(2, 9), updatedAt: stamp }));
  if (!CONFIGURED || userId.startsWith('local:') || userId.startsWith('demo:')) {
    try { const k = LS_DATA(userId); const prev = JSON.parse(localStorage.getItem(k) || '{}'); delete prev.project; localStorage.setItem(k, JSON.stringify({ ...prev, projects: list })); } catch { /* ignore */ }
    return { ok: true };
  }
  try {
    const { data } = await supabase.from('diagnostics').select('data').eq('user_id', userId).maybeSingle();
    const rec = (data?.data as DiagRecord) || {};
    const merged: DiagRecord = { ...rec, projects: list, updatedAt: stamp };
    delete merged.project;  // прибираємо legacy-поле після міграції
    const { data: upd, error } = await supabase.from('diagnostics').update({ data: merged }).eq('user_id', userId).select('user_id');
    if (error) return { ok: false, error: error.message };
    if (!upd || upd.length === 0) return { ok: false, error: 'Оновлення не застосовано — перевірте UPDATE-політику адміна на diagnostics (RLS).' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/* ─── Файли рівня (Етап B) — приватний бакет Supabase Storage «tier-files» ─── */
const TIER_BUCKET = 'tier-files';
export async function uploadTierFile(user: DiagUser, tier: string, file: File): Promise<{ ok: boolean; path?: string; error?: string }> {
  if (!CONFIGURED || isLocal(user)) return { ok: false, error: 'not_configured' };
  try {
    const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const path = `${user.id}/${tier}/${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from(TIER_BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
    return error ? { ok: false, error: error.message } : { ok: true, path };
  } catch (e) { return { ok: false, error: String(e) }; }
}
/** Завантажити ВЛАСНИЙ файл аудитора у картку клієнта (адмінський шар). */
export async function uploadAdminFile(clientUserId: string, file: File): Promise<{ ok: boolean; path?: string; error?: string }> {
  if (!CONFIGURED || clientUserId.startsWith('local:') || clientUserId.startsWith('demo:')) return { ok: false, error: 'not_configured' };
  try {
    const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const path = `${clientUserId}/admin/${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from(TIER_BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
    return error ? { ok: false, error: error.message } : { ok: true, path };
  } catch (e) { return { ok: false, error: String(e) }; }
}
/** Видалити власний файл аудитора зі сховища. */
export async function deleteAdminFile(path: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  try { const { error } = await supabase.storage.from(TIER_BUCKET).remove([path]); return error ? { ok: false, error: error.message } : { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
}

/** Тимчасове посилання на файл (для завантаження менеджером або клієнтом). */
export async function signTierFile(path: string): Promise<string | null> {
  if (!CONFIGURED) return null;
  try { const { data } = await supabase.storage.from(TIER_BUCKET).createSignedUrl(path, 3600); return data?.signedUrl ?? null; } catch { return null; }
}
