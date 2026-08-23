-- Конектор Google Analytics (OAuth, read-only): сховище токенів клієнтів.
-- Виконати в Supabase → SQL Editor. Доступ лише service-role (RLS: deny all).
create table if not exists public.ga_connections (
  user_id text primary key,
  email text,
  refresh_token text,
  properties jsonb default '[]'::jsonb,
  at timestamptz default now()
);
alter table public.ga_connections enable row level security;
-- Жодних політик: читає/пише лише service-role ключ із серверних функцій.
