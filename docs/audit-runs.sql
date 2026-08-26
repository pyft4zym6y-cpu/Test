-- Прогони рушія, які переживають перезапуск і не залежать від таблиці clients.
-- Виконати в Supabase SQL Editor один раз.
--
-- НАВІЩО. Прогін зберігався тільки в report_meta, а там client_id має зовнішній
-- ключ на clients(id) — таблицю ПОРТАЛУ. Адмінка сайту працює від auth uid у
-- diagnostics, тож жоден її прогін у базу не потрапляв: вставка падала на FK, а
-- в UI це виглядало як «нічого не сталося». Тут прогін живе окремо і ключем має
-- довільний рядок власника: uid клієнта, id клієнта порталу або особистий
-- прогін адміністратора.
create table if not exists public.audit_runs (
  id         text primary key,              -- id прогону на рушії
  at         timestamptz not null default now(),
  owner_key  text,                          -- diagnostics.user_id | clients.id | personal:<email>
  site       text,
  tier       int,
  status     text,
  summary    text,
  health     numeric,
  metrics    jsonb,
  files      jsonb                           -- [{name, url}]
);
create index if not exists audit_runs_owner_idx on public.audit_runs (owner_key, at desc);
create index if not exists audit_runs_at_idx    on public.audit_runs (at desc);

alter table public.audit_runs enable row level security;
-- Пише лише рушій (service role в обхід RLS). Читає команда.
drop policy if exists "staff read runs" on public.audit_runs;
create policy "staff read runs" on public.audit_runs
  for select to authenticated using (public.weexp_is_staff());
-- Функція weexp_is_staff() створюється в docs/admin-roles-and-events.sql —
-- застосуйте той файл першим.
