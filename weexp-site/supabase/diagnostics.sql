-- WEEXP · Кабінет діагностики (Етап 3). Виконайте в Supabase → SQL Editor.
-- Один рядок на користувача; усі етапи (1–3) зберігаються в jsonb `data`.
-- RLS: користувач бачить і змінює лише свій рядок.

create table if not exists public.diagnostics (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.diagnostics enable row level security;

drop policy if exists "own diag select" on public.diagnostics;
create policy "own diag select" on public.diagnostics
  for select using (auth.uid() = user_id);

drop policy if exists "own diag upsert" on public.diagnostics;
create policy "own diag insert" on public.diagnostics
  for insert with check (auth.uid() = user_id);

drop policy if exists "own diag update" on public.diagnostics;
create policy "own diag update" on public.diagnostics
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Оновлюємо updated_at автоматично
create or replace function public.diag_touch() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists diag_touch on public.diagnostics;
create trigger diag_touch before update on public.diagnostics
  for each row execute function public.diag_touch();

-- ─── Доступ команди ────────────────────────────────────────────────────────
-- Вище — політики «свої рядки» для клієнта. Але /admin читає ЧУЖІ рядки
-- (listAllDiagnostics), і без політики нижче список клієнтів у адмінці просто
-- порожній — RLS мовчки віддає нуль рядків, а не помилку. Роль береться з JWT
-- (app_metadata.role), її проставляє /api/team; ті самі ролі, що й у leads.sql.
drop policy if exists "team read diagnostics" on public.diagnostics;
create policy "team read diagnostics" on public.diagnostics
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('super','admin','manager','auditor'));

drop policy if exists "team update diagnostics" on public.diagnostics;
create policy "team update diagnostics" on public.diagnostics
  for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('super','admin','manager','auditor'));

-- Перевірка: під звичайним клієнтським акаунтом має бути 0 рядків —
--   select count(*) from public.diagnostics where user_id <> auth.uid();
-- Якщо клієнт бачить чужі рядки, у проєкті лишилася стара дозвільна політика.
