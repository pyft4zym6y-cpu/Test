-- CRM: чек-лист угоди в картці заявки (адмінка → Заявки).
-- Виконати в Supabase SQL Editor один раз.
-- Зберігає: тип/форму співпраці, домовленості, договір, первинну оплату
-- і звʼязку заявка ↔ проект (projectId + projectUserId).
alter table leads add column if not exists deal jsonb;

-- UPDATE-політика для адмінів на leads уже має існувати (та сама, що для status).
-- Якщо кнопка «Зберегти чек-лист» повертає помилку RLS — перевірте політику:
--   create policy "admins update leads" on leads for update
--     using (auth.jwt() ->> 'email' in ('pashasidorenko18@gmail.com', 'hello@weexp.agency'))
--     with check (true);
