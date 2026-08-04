-- weexp Discovery Portal · схема Supabase
-- Выполнить один раз: Supabase Dashboard → SQL Editor → вставить целиком → Run

create extension if not exists pgcrypto;

-- Клиенты (проекты аудита)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Участники: кто с каким e-mail входит и к какому клиенту привязан.
-- Админ weexp: is_admin=true, client_id может быть null.
create table if not exists members (
  email text primary key,
  client_id uuid references clients(id) on delete cascade,
  name text,
  role text,
  is_admin boolean not null default false
);

-- Ответы на вопросы (вопросы зашиты в приложение, тут только ответы)
create table if not exists answers (
  client_id uuid not null references clients(id) on delete cascade,
  question_id text not null,
  answer text,
  facts text,
  updated_by text,
  updated_at timestamptz default now(),
  primary key (client_id, question_id)
);

-- Статусы передачи доступов AC-01..AC-20
create table if not exists access_status (
  client_id uuid not null references clients(id) on delete cascade,
  access_id text not null,
  status text not null default 'Не выдан',
  comment text,
  updated_by text,
  updated_at timestamptz default now(),
  primary key (client_id, access_id)
);

-- Автообновление updated_at
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists t_answers_touch on answers;
create trigger t_answers_touch before update on answers for each row execute function touch_updated_at();
drop trigger if exists t_access_touch on access_status;
create trigger t_access_touch before update on access_status for each row execute function touch_updated_at();

-- Помощники для политик
create or replace function auth_email() returns text language sql stable as
$$ select coalesce(lower(auth.jwt() ->> 'email'), '') $$;

create or replace function my_client_id() returns uuid language sql stable security definer set search_path = public as
$$ select client_id from members where email = auth_email() $$;

create or replace function is_portal_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from members where email = auth_email()), false) $$;

-- RLS
alter table clients enable row level security;
alter table members enable row level security;
alter table answers enable row level security;
alter table access_status enable row level security;

drop policy if exists members_self on members;
create policy members_self on members for select
  using (email = auth_email() or is_portal_admin());

drop policy if exists clients_own on clients;
create policy clients_own on clients for select
  using (id = my_client_id() or is_portal_admin());

drop policy if exists answers_select on answers;
create policy answers_select on answers for select
  using (client_id = my_client_id() or is_portal_admin());
drop policy if exists answers_insert on answers;
create policy answers_insert on answers for insert
  with check (client_id = my_client_id());
drop policy if exists answers_update on answers;
create policy answers_update on answers for update
  using (client_id = my_client_id());

drop policy if exists access_select on access_status;
create policy access_select on access_status for select
  using (client_id = my_client_id() or is_portal_admin());
drop policy if exists access_insert on access_status;
create policy access_insert on access_status for insert
  with check (client_id = my_client_id());
drop policy if exists access_update on access_status;
create policy access_update on access_status for update
  using (client_id = my_client_id());

-- Загруженные клиентом файлы (метаданные; сами файлы — в Storage bucket "uploads")
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  access_id text,
  name text not null,
  path text not null,
  size bigint,
  uploaded_by text,
  created_at timestamptz default now()
);
alter table files enable row level security;
drop policy if exists files_select on files;
create policy files_select on files for select
  using (client_id = my_client_id() or is_portal_admin());
drop policy if exists files_insert on files;
create policy files_insert on files for insert
  with check (client_id = my_client_id());
drop policy if exists files_delete on files;
create policy files_delete on files for delete
  using (client_id = my_client_id() or is_portal_admin());

-- Storage: приватный bucket для файлов клиентов; путь = <client_id>/<access_id>/<файл>
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false)
  on conflict (id) do nothing;
drop policy if exists uploads_select on storage.objects;
create policy uploads_select on storage.objects for select
  using (bucket_id = 'uploads' and (split_part(name, '/', 1) = my_client_id()::text or is_portal_admin()));
drop policy if exists uploads_insert on storage.objects;
create policy uploads_insert on storage.objects for insert
  with check (bucket_id = 'uploads' and split_part(name, '/', 1) = my_client_id()::text);
drop policy if exists uploads_delete on storage.objects;
create policy uploads_delete on storage.objects for delete
  using (bucket_id = 'uploads' and (split_part(name, '/', 1) = my_client_id()::text or is_portal_admin()));

-- Консультантский слой: заметки по вопросам (клиенту не видны)
create table if not exists consultant_notes (
  client_id uuid not null references clients(id) on delete cascade,
  question_id text not null,
  note text,
  updated_at timestamptz default now(),
  primary key (client_id, question_id)
);
alter table consultant_notes enable row level security;
drop policy if exists cnotes_admin on consultant_notes;
create policy cnotes_admin on consultant_notes for all
  using (is_portal_admin()) with check (is_portal_admin());

-- Мета отчёта: статус, резюме консультанта, деньги, L0-замеры, скрытые риски
create table if not exists report_meta (
  client_id uuid primary key references clients(id) on delete cascade,
  status text not null default 'draft',
  summary text,
  hidden jsonb default '[]',
  money jsonb,
  l0 jsonb,
  screen jsonb,
  budget jsonb,
  updated_at timestamptz default now()
);
alter table report_meta add column if not exists screen jsonb;
alter table report_meta add column if not exists budget jsonb;
alter table report_meta enable row level security;
drop policy if exists rmeta_select on report_meta;
create policy rmeta_select on report_meta for select
  using (client_id = my_client_id() or is_portal_admin());
drop policy if exists rmeta_admin_ins on report_meta;
create policy rmeta_admin_ins on report_meta for insert with check (is_portal_admin());
drop policy if exists rmeta_admin_upd on report_meta;
create policy rmeta_admin_upd on report_meta for update using (is_portal_admin());

-- Управление клиентами и участниками из интерфейса (только админ)
drop policy if exists clients_admin_ins on clients;
create policy clients_admin_ins on clients for insert with check (is_portal_admin());
drop policy if exists members_admin_ins on members;
create policy members_admin_ins on members for insert with check (is_portal_admin());
drop policy if exists members_admin_upd on members;
create policy members_admin_upd on members for update using (is_portal_admin());
drop policy if exists members_admin_del on members;
create policy members_admin_del on members for delete using (is_portal_admin());

-- ═══ Первичная настройка (замените значения) ═══
-- 1) Себя как админа:
-- insert into members (email, name, is_admin) values ('pashasidorenko18@gmail.com', 'Павло', true);
--
-- 2) Нового клиента и его команду:
-- insert into clients (name) values ('ACME Store') returning id;  -- скопируйте id
-- insert into members (email, client_id, name, role) values
--   ('ceo@acme.com',  '<id>', 'Имя CEO',  'CEO'),
--   ('ecom@acme.com', '<id>', 'Имя Head', 'Head E-com');
