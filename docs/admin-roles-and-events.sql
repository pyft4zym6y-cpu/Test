-- ═══════════════════════════════════════════════════════════════════════════
-- Адмінка weexp: журнал дій + рольовий доступ на рівні бази.
-- Виконати в Supabase SQL Editor один раз. Порядок блоків має значення.
--
-- НАВІЩО. Досі доступ адмінки трималася на списку email у політиках і на
-- перевірках у React. Ключ Supabase публічний — тобто будь-хто, хто відкрив
-- devtools, обмежений лише RLS. Ролі, які показує UI (manager / auditor),
-- бази не стосувалися взагалі: аудитор міг записати те саме, що й super.
-- Тут ролі стають справжніми.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Роль поточного користувача ──────────────────────────────────────────
-- Роль лежить в app_metadata (її ставить /api/team сервісним ключем — з UI
-- підмінити не можна, на відміну від user_metadata).
create or replace function public.weexp_role()
returns text language sql stable as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    -- бутстрап: перші супери задані списком, щоб не втратити доступ
    case when lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'pashasidorenko18@gmail.com', 'hello@weexp.agency'
    ) then 'super' else null end
  );
$$;

create or replace function public.weexp_is_staff()
returns boolean language sql stable as $$
  select public.weexp_role() in ('super', 'admin', 'manager', 'auditor');
$$;

-- Хто має право ЗМІНЮВАТИ клієнтські дані. Аудитор — ні: він читає й аналізує.
create or replace function public.weexp_can_write()
returns boolean language sql stable as $$
  select public.weexp_role() in ('super', 'admin', 'manager');
$$;

-- Хто має право ВИДАЛЯТИ. Лише super і admin (capability delete_data).
create or replace function public.weexp_can_delete()
returns boolean language sql stable as $$
  select public.weexp_role() in ('super', 'admin');
$$;

-- ── 2. Журнал дій адміністратора ───────────────────────────────────────────
-- Окрема таблиця, а не історія всередині jsonb: всередині запису клієнта така
-- історія не вибирається запитом («хто видав доступи в березні», «що робив
-- цей менеджер»), не сортується і губиться разом із записом.
create table if not exists public.admin_events (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  actor      text        not null,          -- email того, хто зробив дію
  kind       text        not null,          -- tier_status | tier_clear | patch | projects | assessment | …
  user_id    uuid,                          -- якого клієнта стосується
  subject    text,                          -- предмет: рівень, назва документа
  detail     text                           -- деталі: новий статус, перелік полів
);
create index if not exists admin_events_at_idx    on public.admin_events (at desc);
create index if not exists admin_events_user_idx  on public.admin_events (user_id, at desc);
create index if not exists admin_events_actor_idx on public.admin_events (actor, at desc);

alter table public.admin_events enable row level security;

-- Пише будь-хто з команди, але ЛИШЕ від свого імені: підставити чужий email у
-- actor не можна, інакше журнал нічого не доводить.
drop policy if exists "staff insert own events" on public.admin_events;
create policy "staff insert own events" on public.admin_events
  for insert to authenticated
  with check (public.weexp_is_staff() and lower(actor) = lower(auth.jwt() ->> 'email'));

drop policy if exists "staff read events" on public.admin_events;
create policy "staff read events" on public.admin_events
  for select to authenticated using (public.weexp_is_staff());

-- Журнал не редагується і не видаляється: політик update/delete немає навмисно.

-- ── 3. diagnostics: читання командою, запис — за роллю ──────────────────────
-- Замініть наявні «admins …» політики цими. Клієнтські політики (свій рядок)
-- лишаються як були — тут лише адмінський шар.
drop policy if exists "staff read diagnostics" on public.diagnostics;
create policy "staff read diagnostics" on public.diagnostics
  for select to authenticated using (public.weexp_is_staff() or auth.uid() = user_id);

drop policy if exists "staff write diagnostics" on public.diagnostics;
create policy "staff write diagnostics" on public.diagnostics
  for update to authenticated
  using (public.weexp_can_write() or auth.uid() = user_id)
  with check (public.weexp_can_write() or auth.uid() = user_id);

drop policy if exists "staff delete diagnostics" on public.diagnostics;
create policy "staff delete diagnostics" on public.diagnostics
  for delete to authenticated using (public.weexp_can_delete());

-- ── 4. leads: те саме ──────────────────────────────────────────────────────
drop policy if exists "staff read leads" on public.leads;
create policy "staff read leads" on public.leads
  for select to authenticated using (public.weexp_is_staff());

drop policy if exists "staff write leads" on public.leads;
create policy "staff write leads" on public.leads
  for update to authenticated using (public.weexp_can_write()) with check (true);

drop policy if exists "staff delete leads" on public.leads;
create policy "staff delete leads" on public.leads
  for delete to authenticated using (public.weexp_can_delete());

-- ── Перевірка ──────────────────────────────────────────────────────────────
-- select public.weexp_role(), public.weexp_is_staff(), public.weexp_can_write();
-- Під акаунтом аудитора має бути: auditor | true | false.
