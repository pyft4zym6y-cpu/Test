import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const CONFIGURED = Boolean(url && anon);
/** Без настроенного Supabase портал работает в демо-режиме: localStorage, без логина. */
export const DEMO = !CONFIGURED;

export const DEMO_MEMBER = {
  email: 'demo@weexp.agency',
  client_id: 'demo',
  name: 'Демо',
  role: 'CEO',
  is_admin: true, // в демо показываем и консультантскую ветку
};

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anon ?? 'anon');

export type Member = {
  email: string;
  client_id: string | null;
  name: string | null;
  role: string | null;
  is_admin: boolean;
};

export type AnswerRow = {
  client_id: string;
  question_id: string;
  answer: string | null;
  facts: string | null;
  updated_by: string | null;
  updated_at?: string;
};

export type AccessRow = {
  client_id: string;
  access_id: string;
  status: string;
  comment: string | null;
  updated_by: string | null;
};
