-- ═══════════════════════════════════════════════════════════════════════════
-- Витягуємо сутності з jsonb — проекцією, а не переїздом.
-- Виконати в Supabase SQL Editor ПІСЛЯ docs/admin-roles-and-events.sql.
--
-- ПРОБЛЕМА. Усе про клієнта живе в одному полі diagnostics.data (jsonb):
-- проєкти, задачі, доступи, файли, прогони, оцінки. Наслідки:
--   • неможливі поперечні питання — «усі прострочені задачі», «усі платежі за
--     квартал», «яких доступів нам не дають найчастіше». Щоб відповісти, треба
--     завантажити ВСІ записи в браузер і порахувати вручну;
--   • будь-яка правка — читання-зміна-запис усього документа;
--   • запис росте без стелі (документ аудиту з версіями, зрізи бази знань).
--
-- ЩО РОБИМО ТУТ. Не ламаємо застосунок: jsonb лишається джерелом правди, а ці
-- таблиці — його ПРОЕКЦІЯ, яку база оновлює сама тригером. Уже цього досить,
-- щоб питання вище стали одним SQL-запитом і щоб звітність перестала залежати
-- від того, скільки записів встиг завантажити браузер.
--
-- НАСТУПНИЙ КРОК (окремо, свідомо). Перевести ЗАПИС у ці таблиці, а в jsonb
-- лишити тільки анкету. Робити його варто тоді, коли проекція попрацює і стане
-- видно, що дані в ній сходяться з карткою.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.p_projects (
  user_id    uuid not null,
  project_id text not null,
  title      text,
  start_month text,
  published  boolean,
  closed_at  timestamptz,
  tasks      int,
  budget     numeric,
  paid       numeric,
  pending    numeric,
  updated_at timestamptz,
  primary key (user_id, project_id)
);
create index if not exists p_projects_open_idx on public.p_projects (published, closed_at);

create table if not exists public.p_access (
  user_id   uuid not null,
  access_id text not null,
  status    text,
  method    text,
  at        timestamptz,
  primary key (user_id, access_id)
);
create index if not exists p_access_status_idx on public.p_access (access_id, status);

create table if not exists public.p_files (
  user_id uuid not null,
  title   text not null,
  grp     text,
  at      timestamptz,
  primary key (user_id, title)
);

create table if not exists public.p_runs (
  user_id uuid not null,
  run_id  text not null,
  site    text,
  tier    int,
  status  text,
  health  numeric,
  at      timestamptz,
  primary key (user_id, run_id)
);
create index if not exists p_runs_at_idx on public.p_runs (at desc);

-- ── Тригер: перебудовуємо проекцію одного клієнта ──────────────────────────
create or replace function public.weexp_project_record()
returns trigger language plpgsql security definer as $$
declare
  d jsonb := coalesce(new.data, '{}'::jsonb);
  projects jsonb := coalesce(d -> 'projects', case when d ? 'project' then jsonb_build_array(d -> 'project') else '[]'::jsonb end);
begin
  delete from public.p_projects where user_id = new.user_id;
  insert into public.p_projects (user_id, project_id, title, start_month, published, closed_at, tasks, budget, paid, pending, updated_at)
  select new.user_id,
         coalesce(p ->> 'id', 'pr_' || ord::text),
         p ->> 'title',
         p ->> 'startMonth',
         coalesce((p ->> 'published')::boolean, false),
         nullif(p ->> 'closedAt', '')::timestamptz,
         coalesce(jsonb_array_length(p -> 'tasks'), 0),
         coalesce((select sum((v)::numeric) from jsonb_each_text(coalesce(p -> 'budget', '{}'::jsonb)) as e(k, v)), 0),
         coalesce((select sum((pay ->> 'amount')::numeric) from jsonb_array_elements(coalesce(p -> 'payments', '[]'::jsonb)) pay where pay ->> 'status' = 'paid'), 0),
         coalesce((select sum((pay ->> 'amount')::numeric) from jsonb_array_elements(coalesce(p -> 'payments', '[]'::jsonb)) pay where pay ->> 'status' = 'pending'), 0),
         nullif(p ->> 'updatedAt', '')::timestamptz
  from jsonb_array_elements(projects) with ordinality as t(p, ord);

  delete from public.p_access where user_id = new.user_id;
  insert into public.p_access (user_id, access_id, status, method, at)
  select new.user_id, k, v ->> 'status', v ->> 'method', nullif(v ->> 'at', '')::timestamptz
  from jsonb_each(coalesce(d -> 'accessLog', '{}'::jsonb)) as e(k, v);

  delete from public.p_files where user_id = new.user_id;
  insert into public.p_files (user_id, title, grp, at)
  select new.user_id, coalesce(f ->> 'title', f ->> 'type', 'файл'), f ->> 'group', nullif(f ->> 'at', '')::timestamptz
  from jsonb_array_elements(coalesce(d -> 'clientFiles', '[]'::jsonb)) f
  on conflict (user_id, title) do nothing;

  delete from public.p_runs where user_id = new.user_id;
  insert into public.p_runs (user_id, run_id, site, tier, status, health, at)
  select new.user_id, j ->> 'id', j ->> 'site', (j ->> 'tier')::int, j ->> 'status',
         nullif(j ->> 'health', '')::numeric, nullif(j ->> 'at', '')::timestamptz
  from jsonb_array_elements(coalesce(d -> 'auditJobs', '[]'::jsonb)) j
  where j ->> 'id' is not null
  on conflict (user_id, run_id) do nothing;

  return new;
exception when others then
  -- Проекція НІКОЛИ не має ламати запис картки клієнта: краще застаріла
  -- аналітика, ніж незбережена робота менеджера. Наслідок свідомий — якщо в
  -- jsonb трапиться несподівана форма, рядки проекції по цьому клієнту
  -- лишаться від попереднього запису, поки наступний коректний запис їх не
  -- перебудує. Тому проекція придатна для аналітики, але не для звірки грошей.
  return new;
end;
$$;

drop trigger if exists weexp_project_record_t on public.diagnostics;
create trigger weexp_project_record_t
  after insert or update of data on public.diagnostics
  for each row execute function public.weexp_project_record();

-- Видалення клієнта теж має прибирати проекцію. Без цього рядки лишались
-- назавжди, і будь-який звіт («незакриті проєкти», «прогонів за місяць»)
-- рахував давно видалених клієнтів.
create or replace function public.weexp_forget_record()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.p_projects where user_id = old.user_id;
  delete from public.p_access   where user_id = old.user_id;
  delete from public.p_files    where user_id = old.user_id;
  delete from public.p_runs     where user_id = old.user_id;
  return old;
exception when others then
  return old;
end;
$$;

drop trigger if exists weexp_forget_record_t on public.diagnostics;
create trigger weexp_forget_record_t
  after delete on public.diagnostics
  for each row execute function public.weexp_forget_record();

-- ── Разовий backfill наявних записів ───────────────────────────────────────
update public.diagnostics set data = data where true;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.p_projects enable row level security;
alter table public.p_access   enable row level security;
alter table public.p_files    enable row level security;
alter table public.p_runs     enable row level security;
do $$ declare t text;
begin
  foreach t in array array['p_projects','p_access','p_files','p_runs'] loop
    execute format('drop policy if exists "staff read %1$s" on public.%1$I', t);
    execute format('create policy "staff read %1$s" on public.%1$I for select to authenticated using (public.weexp_is_staff())', t);
  end loop;
end $$;

-- ── Питання, на які тепер можна відповісти одним запитом ───────────────────
-- Незакриті проєкти з бюджетом:
--   select * from p_projects where closed_at is null order by budget desc;
-- Які доступи нам дають найгірше:
--   select access_id, count(*) filter (where status in ('granted','verified')) as given,
--          count(*) as asked from p_access group by 1 order by given::float/asked;
-- Прогони за місяць і середній health:
--   select date_trunc('week', at) w, count(*), round(avg(health),1) from p_runs
--   where at > now() - interval '30 days' group by 1 order by 1;
