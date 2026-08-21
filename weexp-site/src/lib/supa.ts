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

export type DiagUser = { id: string; email: string };

/** true, якщо користувач збережений у хмарному кабінеті (Supabase), а не локально. */
export const isCloudUser = (u: DiagUser | null): boolean => !!u && !u.id.startsWith('local:') && !u.id.startsWith('demo:');

/** Профіль компанії в кабінеті (розділ «Дані компанії»). */
export type CompanyProfile = {
  name?: string; site?: string; niche?: string; revenue?: string;
  channels?: string[]; contactName?: string; contactPhone?: string; notes?: string;
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
};

/** Дані діагностики, що зберігаються між сесіями (усі етапи). */
export type DiagRecord = {
  site?: string;
  stage1?: unknown;
  stage1Money?: [number, number];   // діапазон можливості з Етапу 1 (€) — якір для Етапу 3
  stage2?: unknown;
  stage2Result?: unknown;
  stage3?: Record<string, unknown>;
  company?: CompanyProfile;         // розділ «Дані компанії»
  funnel?: FunnelState;             // наскрізна воронка кабінету
  updatedAt?: string;
};

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
  const s = data.session; return s?.user ? { id: s.user.id, email: s.user.email ?? '' } : null;
}

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
export async function registerWithEmail(email: string, password: string): Promise<AuthOutcome> {
  if (CONFIGURED) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: REDIRECT() } });
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
export async function signInWithEmail(email: string, password: string): Promise<AuthOutcome> {
  if (CONFIGURED) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
export const MANAGER_EMAILS = ['hello@weexp.agency'];
export function isManager(u: DiagUser | null): boolean {
  return !!u && MANAGER_EMAILS.map((e) => e.toLowerCase()).includes((u.email || '').toLowerCase());
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

/** Лід (заявка з форм). Пишеться в таблицю `leads` (див. INFRA/SQL); для адмінки. */
export type LeadRow = { id?: string; at?: string; source?: string; email?: string; name?: string; phone?: string; task?: string; comment?: string };
export async function listLeads(): Promise<LeadRow[]> {
  if (!CONFIGURED) return [];
  try {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(500);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id ?? ''), at: (r.created_at as string) || undefined, source: (r.source as string) || undefined,
      email: (r.email as string) || undefined, name: (r.name as string) || undefined, phone: (r.phone as string) || undefined,
      task: (r.task as string) || undefined, comment: (r.comment as string) || undefined,
    }));
  } catch { return []; }
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
    const history = { ...(funnel.tierHistory || {}) };
    history[tier] = [...(history[tier] || []), { st: status, at: new Date().toISOString(), by: 'manager' }];
    funnel.tierHistory = history;
    const merged: DiagRecord = { ...rec, funnel, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('diagnostics').update({ data: merged }).eq('user_id', userId);
    return error ? { ok: false, error: error.message } : { ok: true };
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
/** Тимчасове посилання на файл (для завантаження менеджером або клієнтом). */
export async function signTierFile(path: string): Promise<string | null> {
  if (!CONFIGURED) return null;
  try { const { data } = await supabase.storage.from(TIER_BUCKET).createSignedUrl(path, 3600); return data?.signedUrl ?? null; } catch { return null; }
}
