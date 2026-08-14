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

/** Дані діагностики, що зберігаються між сесіями (усі етапи). */
export type DiagRecord = {
  site?: string;
  stage1?: unknown;
  stage2?: unknown;
  stage2Result?: unknown;
  stage3?: Record<string, unknown>;
  updatedAt?: string;
};

const LS_SESSION = 'weexp:diag-user';
const LS_DATA = (id: string) => `weexp:diag-data:${id}`;

/* ─── Auth ─── */
export async function currentUser(): Promise<DiagUser | null> {
  if (!CONFIGURED) {
    try { const raw = localStorage.getItem(LS_SESSION); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  const { data } = await supabase.auth.getSession();
  const s = data.session; return s?.user ? { id: s.user.id, email: s.user.email ?? '' } : null;
}

/** Реєстрація/вхід. У DEMO — просто зберігаємо особу локально. */
export async function authenticate(email: string, password: string): Promise<{ user?: DiagUser; error?: string }> {
  if (!CONFIGURED) {
    const user = { id: 'demo:' + email.toLowerCase(), email };
    try { localStorage.setItem(LS_SESSION, JSON.stringify(user)); } catch { /* ignore */ }
    return { user };
  }
  // Пробуємо увійти; якщо акаунта немає — реєструємо.
  let res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) {
    const up = await supabase.auth.signUp({ email, password });
    if (up.error) return { error: up.error.message };
    res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) return { error: 'Підтвердіть email і увійдіть знову.' };
  }
  const u = res.data.user; return u ? { user: { id: u.id, email: u.email ?? email } } : { error: 'Не вдалося увійти' };
}

export async function signOut(): Promise<void> {
  if (!CONFIGURED) { try { localStorage.removeItem(LS_SESSION); } catch { /* ignore */ } return; }
  await supabase.auth.signOut();
}

export function onAuth(cb: (u: DiagUser | null) => void): () => void {
  if (!CONFIGURED) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e: string, s: Session | null) =>
    cb(s?.user ? { id: s.user.id, email: s.user.email ?? '' } : null));
  return () => data.subscription.unsubscribe();
}

/* ─── Persistence (таблиця diagnostics, jsonb) ─── */
export async function loadDiag(user: DiagUser): Promise<DiagRecord> {
  if (!CONFIGURED) {
    try { const raw = localStorage.getItem(LS_DATA(user.id)); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }
  const { data } = await supabase.from('diagnostics').select('data').eq('user_id', user.id).maybeSingle();
  return (data?.data as DiagRecord) ?? {};
}

export async function saveDiag(user: DiagUser, patch: DiagRecord): Promise<void> {
  const prev = await loadDiag(user);
  const merged: DiagRecord = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  if (!CONFIGURED) {
    try { localStorage.setItem(LS_DATA(user.id), JSON.stringify(merged)); } catch { /* ignore */ }
    return;
  }
  await supabase.from('diagnostics').upsert({ user_id: user.id, email: user.email, data: merged }, { onConflict: 'user_id' });
}
