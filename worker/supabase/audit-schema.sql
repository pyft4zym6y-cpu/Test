-- Схема хаба данных аудитора (Supabase). Выполнить один раз в SQL Editor.
-- Аудитор читает audit_clients (вход) и пишет audit_runs (результат).
-- Сайт/портал заполняет audit_clients (заявка + ответы опросника + baseline).

create table if not exists audit_clients (
  id           uuid primary key default gen_random_uuid(),
  name         text,                       -- имя клиента (для оператора)
  site         text,                       -- URL сайта клиента
  competitors  jsonb default '[]'::jsonb,  -- массив URL конкурентов
  request      text,                       -- вольный запрос
  tier         int  default 1,             -- тир полноты данных
  answers      jsonb,                      -- ответы опросника {qid: answer}
  baseline     jsonb,                      -- финпоказатели {levers, extra}
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists audit_runs (
  id          bigint generated always as identity primary key,
  client_id   uuid references audit_clients(id) on delete cascade,
  run_id      text,                        -- id прогона аудитора
  summary     text,                        -- краткий итог
  metrics     jsonb,                       -- метрики дашборда
  files       jsonb,                       -- [{name,url}] документы прогона
  created_at  timestamptz default now()
);

create index if not exists audit_runs_client_idx on audit_runs(client_id, created_at desc);

-- RLS: доступ к таблицам — только service role (аудитор) и ваша админ-логика.
alter table audit_clients enable row level security;
alter table audit_runs    enable row level security;
-- service_role обходит RLS автоматически; клиентские политики добавляются под ваш портал.
