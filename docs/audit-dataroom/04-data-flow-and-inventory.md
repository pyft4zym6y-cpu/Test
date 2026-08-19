# 04 · Данные, потоки и приватность

> Заземлено на `portal/supabase/schema.sql`, `portal/src/pages/AccessPage.tsx`,
> `portal/src/lib/orders.ts`, `worker/src/pipeline.ts`, `worker/src/store.ts`,
> `portal/public/templates/*.csv`.

## Инвентарь данных (что система обрабатывает)

| Категория | Чувствительность | Где хранится | Источник |
|-----------|------------------|--------------|----------|
| Данные обхода сайта клиента (DOM-сигналы, метаданные, скриншоты) | Низкая (публичный сайт) | `results/<id>/dataset.json` на хосте движка (gitignored) | `crawl.ts` |
| Ответы опросника (643 вопроса) + факты | Средняя (бизнес-данные) | Supabase `answers` | Портал (DomainPage и др.) |
| Паспорт компании, цели, боли, ссылки | Средняя | Supabase `answers` (JSON-блобы) | Company/Goals/Pains/Links |
| **ЛПР: имена, роли, KPI; бюджет; ростер команды** | **Высокая (PII)** | Supabase `answers` (DECISION_QID) | DecisionPage |
| Статусы доступов + комментарии | Низкая (не сам доступ) | Supabase `access_status` | AccessPage |
| **Загруженные файлы** (P&L, выгрузки заказов/товаров, бренд-бук) | **Высокая (может содержать PII)** | Supabase Storage bucket `uploads` (private) + метаданные в `files` | AccessPage upload |
| **E-mail участников** (клиент/консультант) | **PII** | Supabase `members.email` (plaintext, lowercased); + `updated_by`/`uploaded_by` | Supabase Auth |
| Отчётные агрегаты (Health Score, деньги, риски) | Средняя | Supabase `report_meta` (admin-only RLS) | Консультант/движок |
| Выбор коннекторов, интейк T1–T4 | Низкая | **localStorage браузера** | Connectors/Intake |

## Ключевые факты обработки

- **Пароли не запрашиваются и не хранятся** (заявлено и реализовано): доступ выдаётся
  инвайтом на e-mail с правами «просмотр» или одноразовой ссылкой. Портал хранит только
  *статус* доступа. См. `AccessPage.tsx:169`.
- **Токены коннекторов клиента не хранятся** нигде в системе. Каталог `connectors.ts` —
  только список выбора, без значений токенов. Внешние API-ключи движка (Serpstat/
  SimilarWeb/PSI) — **собственные ключи weexp**, не клиента.
- **Выгрузка заказов (AC-13) парсится в браузере и никуда не отправляется** —
  `orders.ts` (комментарий «файл никуда не отправляется»); в бэкенд уходят только
  агрегаты в `report_meta.money`. ⚠️ Другие файлы (через AccessPage upload) **загружаются**
  в bucket `uploads`.
- **Псевдонимизация e-mail — по соглашению, не принудительно.** Шаблон
  `orders-template.csv` использует `customer_email_hash`, `orders.ts` принимает и хеш, и
  сырые `email`/`phone`. То есть клиент *может* загрузить сырые PII — контроль только на
  уровне рекомендации UI. **Митигация для аудита:** валидация/маскирование на приёме — в беклоге.

## Схема данных (Supabase, `portal/supabase/schema.sql`)

| Таблица | Ключевые поля | RLS |
|---------|---------------|-----|
| `clients` | id, name, locked | по `my_client_id()` / admin |
| `members` | email (PK), client_id, name, role, is_admin | по клиенту / admin |
| `answers` | client_id+question_id (PK), answer, facts, updated_by | по клиенту; запись блокируется при `client_locked` |
| `access_status` | client_id+access_id (PK), status, comment, updated_by | по клиенту |
| `files` | id, client_id, access_id, name, path, size, uploaded_by | по клиенту |
| `report_meta` | client_id (PK), summary, money/l0/hidden/… (jsonb) | **только admin** на запись |
| `consultant_notes` | client_id, question_id, note | admin-only; *в текущем коде не используется* |

- **Storage bucket `uploads`** — private (`public=false`), путь
  `<client_id>/<access_id>/<ts>_<sanitized_name>`, RLS по префиксу client-id.
- **RLS — единственная граница безопасности** между клиентами (anon-ключ публичен).
  Корректность RLS — критический предмет проверки (см. раздел 05).

## Карта потоков данных (data flow)

1. **Клиент → Supabase:** ответы, статусы, файлы (anon-ключ + RLS).
2. **Клиент/консультант браузер → Anthropic (через `portal/api/assistant.js`):** «живой
   снимок аудита» (бизнес-данные клиента) уходит в Claude API для со-пилота.
3. **`portal/api/aqc.js` / `fetch.js` → произвольный URL:** серверный fetch (SSRF-поверхность),
   `aqc` пересылает HTML в Claude.
4. **`portal/api/ga4.js` → Google Analytics Data API:** через service-account (приватный ключ).
5. **Движок → сайты:** обход клиента/конкурентов.
6. **Движок → Anthropic:** данные обхода + ответы → анализ/нарратив/vision (скриншоты/PDF).
7. **Движок → Supabase (service-role):** читает `clients`+`answers`, пишет `report_meta`.
8. **Движок → Google PSI / Serpstat / SimilarWeb:** домен клиента (премиум-линзы).

## Приватность (для GDPR — детали в разделе 11)

- Заявленный ретеншн (PrivacyPage): срок сотрудничества + 12 мес; удаление в течение
  14 дней по письменному запросу; экспорт CSV по запросу.
- Регион хранения: Supabase EU для EU-клиентов; хостинг Vercel.
- Контакты: `hello@weexp.agency`, консультант `pashasidorenko18@gmail.com`.
- **Пробел:** формальные RoPA/DPA/процедура DSAR не оформлены как документы — см. раздел 11.
