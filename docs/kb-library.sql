-- ═══════════════════════════════════════════════════════════════════════════
-- Бібліотека агенції: наші методики, шаблони, чек-листи, інструкції.
-- Виконати в Supabase SQL Editor один раз.
--
-- НЕ плутати з «Базою знань клієнта»: та лежить у diagnostics.data і описує
-- КОНКРЕТНОГО клієнта. Ця таблиця — навпаки, спільна для всіх: те, як працює
-- команда. Тому вона окрема, а не ще одне поле в записі клієнта.
--
-- Базовий шар бібліотеки живе в коді (src/data/kbLibrary.ts) і працює завжди,
-- навіть якщо цю таблицю не створили. Тут — те, що команда додає з адмінки.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.kb_library (
  id          text primary key,
  title       text not null,
  kind        text not null default 'method',   -- method | template | checklist | howto | case
  sys         text[] not null default '{}',     -- ключі систем: strategy, commercial, …
  summary     text not null default '',
  body        text,
  url         text,
  for_client  boolean not null default false,   -- чи можна віддавати клієнту
  by_email    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists kb_library_kind_idx on public.kb_library (kind);
create index if not exists kb_library_updated_idx on public.kb_library (updated_at desc);

alter table public.kb_library enable row level security;

-- Читати може будь-хто з роллю (див. weexp_role() у docs/admin-roles-and-events.sql):
-- бібліотека потрібна всій команді, включно з аудиторами.
drop policy if exists "team reads library" on public.kb_library;
create policy "team reads library" on public.kb_library
  for select using (public.weexp_role() is not null);

-- Писати — тим, хто веде методологію. Аудитор читає, але не редагує:
-- бібліотека, яку може переписати будь-хто, перестає бути джерелом правди.
drop policy if exists "editors write library" on public.kb_library;
create policy "editors write library" on public.kb_library
  for all using (public.weexp_role() in ('super', 'admin'))
  with check (public.weexp_role() in ('super', 'admin'));

-- Оновлюємо updated_at самі, а не покладаємось на клієнта: інакше сортування
-- «останні зміни» бреше рівно тоді, коли хтось забув передати поле.
create or replace function public.kb_library_touch() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists kb_library_touch on public.kb_library;
create trigger kb_library_touch before update on public.kb_library
  for each row execute function public.kb_library_touch();
