-- Ліміт частоти для відкритих ендпоінтів (/api/lead, /api/notify).
-- Виконати в Supabase SQL Editor. Потребує функцій із admin-roles-and-events.sql.
--
-- НАВІЩО. Дві форми сайту відкриті за задумом: заявку лишає незареєстрований
-- відвідувач. Але жодного обмеження частоти не було — хто завгодно міг залити
-- пошту власника через /api/notify і забити таблицю leads. Ціна: репутація
-- домену в Resend, вичерпана квота і засмічена воронка.
--
-- Лічильник у базі, а не в памʼяті функції: serverless підіймає багато
-- інстансів, і памʼятний лічильник у кожного свій — тобто ліміту фактично немає.
create table if not exists public.rate_hits (
  bucket   text        not null,          -- 'lead' | 'notify'
  key      text        not null,          -- IP або інший ключ
  at       timestamptz not null default now()
);
create index if not exists rate_hits_lookup on public.rate_hits (bucket, key, at desc);

alter table public.rate_hits enable row level security;
-- Пише і читає лише сервер (service role в обхід RLS). Політик для клієнтів немає навмисно.

/**
 * Зафіксувати спробу і сказати, чи вона в межах ліміту.
 * true  — можна пропускати;
 * false — ліміт вичерпано.
 */
create or replace function public.weexp_rate_ok(
  p_bucket text, p_key text, p_limit int, p_window_seconds int
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  delete from public.rate_hits
   where bucket = p_bucket and at < now() - make_interval(secs => p_window_seconds * 4);
  select count(*) into n from public.rate_hits
   where bucket = p_bucket and key = p_key and at > now() - make_interval(secs => p_window_seconds);
  if n >= p_limit then return false; end if;
  insert into public.rate_hits (bucket, key) values (p_bucket, p_key);
  return true;
exception when others then
  -- Ліміт не має ламати форму: якщо щось пішло не так — пропускаємо.
  return true;
end;
$$;

-- Прибирання (на випадок, якщо функція вище не встигає): раз на добу.
-- select cron.schedule('weexp-prune-rate', '30 3 * * *', $$delete from rate_hits where at < now() - interval '1 day'$$);
