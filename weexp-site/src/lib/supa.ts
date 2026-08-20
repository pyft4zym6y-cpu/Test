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
export type FunnelState = { leadAt?: string; leadContact?: string; deepRequested?: boolean; deepAt?: string; deepDepth?: string; deepTiers?: string[] };

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
