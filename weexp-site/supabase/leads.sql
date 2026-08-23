-- Таблиця лідів (заявки з сайту) — джерело розділу «Первинна комунікація» в /admin.
-- Запис веде серверна функція /api/lead через service-role ключ (обходить RLS).
-- Читає адмінка авторизованим клієнтом → потрібна select-політика для команди.
-- Скрипт ІДЕМПОТЕНТНИЙ: можна виконувати повторно.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text,
  email text,
  phone text,
  name text,
  role text,
  store text,
  turnover text,
  task text,
  timeline text,
  budget text,
  comment text,
  diag text,
  calc text,
  status text default 'new'
);

-- Догорнути колонки, якщо таблиця вже існувала у старішій формі
-- (саме брак цих колонок ламав INSERT → заявка не зберігалась).
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists name text;
alter table public.leads add column if not exists role text;
alter table public.leads add column if not exists store text;
alter table public.leads add column if not exists site text;
alter table public.leads add column if not exists turnover text;
alter table public.leads add column if not exists task text;
alter table public.leads add column if not exists timeline text;
alter table public.leads add column if not exists budget text;
alter table public.leads add column if not exists comment text;
alter table public.leads add column if not exists diag text;
alter table public.leads add column if not exists calc text;
alter table public.leads add column if not exists status text default 'new';
alter table public.leads add column if not exists created_at timestamptz not null default now();

-- RLS: команда (super/admin/manager/auditor) читає й оновлює статуси лідів.
-- Вставку робить лише сервер (service-role, RLS обходить) — anon-insert не потрібен.
alter table public.leads enable row level security;

drop policy if exists "team read leads" on public.leads;
create policy "team read leads" on public.leads
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('super','admin','manager','auditor'));

drop policy if exists "team update leads" on public.leads;
create policy "team update leads" on public.leads
  for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('super','admin','manager','auditor'));

drop policy if exists "team delete leads" on public.leads;
create policy "team delete leads" on public.leads
  for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('super','admin','manager','auditor'));
