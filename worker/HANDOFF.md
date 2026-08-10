# HANDOFF · Передача проекта (AI-аудитор Commerce OS)

Этот файл — точка входа для НОВОГО чата Claude Code. Прочитай его целиком, затем
`worker/README.md`. Цель: полностью подхватить работу над **аудитором**, не сломав
**сайт**.

---

## 1. Что это за проект (одним абзацем)

weexp — консалтинг e-commerce по методологии **Commerce OS** (скил `commerce-os`).
Строим внутренний **AI-аудитор**: он обходит сайт клиента (Playwright), анализирует
по методу (Claude API) и автоматически собирает пакет документов аудита
(презентация AD-15, отчёт, UX-разбор, эталон↔композиция, бенчмарк, зрелость, scope,
причинно-следственная карта, деньги, реестр гипотез, синтез, ЕКП-таблицы XLSX, КП).
Он **внутренний** — клиент его не видит.

## 2. Три части системы и где что живёт

| Часть | Что это | Репо / ветка | Хостинг |
| --- | --- | --- | --- |
| **Сайт** weexp.agency | публичная витрина (корень репо: `index.html`, `src/`) | repo `Test`, ветка `claude/website-creation-publishing-o8ujcs` (**Default**) | **Vercel** (проект weexp) |
| **Портал/опросник** | ЛК клиента: форма, 643 вопроса, доступы (`portal/`) | repo `Test` | Vercel (root=`portal`) + **Supabase** |
| **Аудитор** (ЭТА работа) | worker + консоль оператора (`worker/`, движок в `portal/src`) | repo `Test`, ветка **`claude/ai-assistant-comerc-oc-qufqcc`** | **Railway** |

**Важно:** сайт и аудитор — **два независимых пайплайна**, намеренно. Не сливать в
один деплой. Эта ветка (`claude/ai-assistant-...`) трогает ТОЛЬКО `worker/` и
`portal/` (движок). Никогда не пушить в ветку сайта и не мержить туда.

## 3. Что уже построено в аудиторе (`worker/`)

Конвейер: `worker/src/pipeline.ts` (`runAudit`), сервер+консоль: `worker/src/server.ts`
(+ `console.ts`). Модули:
- **crawl.ts** — обход браузером, 30 проверок голд-стандарта, дизайн-замеры (`ux`),
  детекция блоков композиции, скриншоты первого экрана.
- **analyze.ts / agent.ts** — L0-анализ Claude (находки, боли по причинам, scope).
- **portalEngine.ts** — импортирует движок портала (`../../portal/src/lib`, `data`):
  Health Score, разрывы, решения. **Единый источник расчёта.**
- **money.ts** — недополученный оборот цепной атрибуцией.
- **deliverables.ts** + `export/pptx.ts`,`docx.ts` — AD-15 (.pptx), отчёт (.docx), Гант.
- **uxui.ts** — UX/CRO против AQC (коды, severity). **prototype.ts** — эталон↔композиция.
- **competitor.ts** — бенчмарк AD-11. **maturity.ts** — зрелость AD-16.
- **routing.ts** — scope по волнам. **causal.ts** — причинно-следственная карта.
- **pricechannel.ts** — роль в цепочке. **hypotheses.ts** — реестр AD-19.
- **coverage.ts** — 13 видов + Confidence Score.
- **synthesis.ts** — СЛОЙ СИНТЕЗА (связывает выводы всех линз в один).
- **xlsx.ts** (свой OOXML-писатель) + **workbook.ts** — книга **ЕКП-аудит.xlsx**.
- **kp.ts** — коммерческое предложение.
- **knowledge.ts** + `worker/knowledge/*.md` — «пакеты знаний»: методичка = md-файл,
  подмешивается в анализ (scope: analyze|uxui|prototype|all). Проверка: `/health`→`knowledge`.
- **store.ts** — коннектор Supabase (см. правку №1 ниже).
- **zip.ts** — единый .zip-пакет прогона.

Проверка сборки: `cd worker && npm run typecheck`. Тесты детерминированных кусков
гонялись на синтетике (docx/xlsx валидны). Живой обход в песочнице невозможен
(нет egress) — только на Railway.

## 4. Инфраструктура и доступы (ГДЕ лежит; секреты НЕ здесь)

- **Railway** (аудитор): проект `production`, сервис из repo `Test`, ветка
  `claude/ai-assistant-comerc-oc-qufqcc`, `worker/Dockerfile`, контекст = корень.
  Домен: **`https://test-production-5713.up.railway.app`**. Порт 8787 (Railway
  подставляет свой `PORT`). Переменные (значения — в Railway → Variables):
  `ANTHROPIC_API_KEY`, `AUDIT_SERVER_TOKEN`, `AUDIT_MODEL=claude-opus-5`,
  опц. `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NO_SCREENSHOTS`, `HEADFUL`, `CHROME_PATH`.
- **Vercel** (сайт): проект weexp, собирает Default-ветку. Моя ветка отключена от
  сборки через `vercel.json` (`git.deploymentEnabled` = false для моей ветки).
- **Supabase** (портал): схема — `portal/supabase/schema.sql`. Таблицы: `clients`,
  `members`, `answers`(client_id,question_id,answer,facts), `access_status`,
  `files`, `report_meta`(client_id,status,summary,money,l0,screen,budget,hypotheses),
  `consultant_notes`.
- **platform.claude.com**: ключ Claude (оплата). Ранее в чат был вставлен ключ —
  он СКОМПРОМЕТИРОВАН и должен быть отозван; в Railway стоит новый. **Никогда не
  вставляй секреты в чат.**
- **GitHub**: `pyft4zym6y-cpu/Test` (2 ветки). Создан пустой repo
  `pyft4zym6y-cpu/audit-worker` — но туда НЕ запушено (нужно подтверждение
  `add_repo`/Allow в сессии; см. задачу).

Новый чат: доступ к секретам получить нельзя и не нужно для кода — они уже в
Railway/Supabase. При необходимости владелец вставляет ключи сам в env.

## 5. Открытые задачи (по приоритету)

1. **Правка №1 — коннектор к РЕАЛЬНОЙ схеме.** `store.ts` сейчас читает выдуманную
   `audit_clients` — это ДУБЛЬ. Правильно: читать `clients` + агрегировать `answers`
   (по client_id: `{question_id: answer}` → это и есть `answers` для движка) +
   `access_status`; писать итог в `report_meta` (money/l0/summary) или в новую
   `audit_runs(client_id references clients)`. Удалить `worker/supabase/audit-schema.sql`
   (дубль) — вместо неё использовать существующую схему портала.
2. **Сайт пишет данные** — чтобы поток был автоматическим, портал уже пишет `answers`;
   аудитору остаётся их читать (см. п.1). Доступы (`access_status`) — тоже вход.
3. **Отдельный репозиторий `audit-worker`** — вынести аудитор из repo сайта. Комплект
   собран локально; запушить не удалось (нужно `add_repo` push + Allow). Альтернатива
   уже применена: Vercel отключён для моей ветки.
4. **Постоянное хранилище истории** — сейчас прогоны на диске Railway (эфемерно).
   Перенести в Supabase (п.1 это и делает для результатов).
5. **Мульти-скилл параллельно** — синтез готов; дальше: профиль на каждый скил и
   параллельный запуск линз.

## 6. Правила работы

- Ветка аудитора: **`claude/ai-assistant-comerc-oc-qufqcc`**. Разрабатывать и пушить
  сюда. **Не пушить в ветку сайта, не мержить в Default.**
- Менять только `worker/**` и (для движка) читать `portal/src/**`. Файлы сайта
  (корневые `src/`, `index.html`, `vercel.json` кроме нашего disable-ключа) не трогать.
- `git push -u origin claude/ai-assistant-comerc-oc-qufqcc`.
- Карта системы (визуально): артефакт
  `https://claude.ai/code/artifact/dd994b3e-c7b4-4b5b-89a4-2cc3571b90d3`.

## 7. Как проверить, что живо
`https://test-production-5713.up.railway.app/health` → `{ok,hasKey,knowledge,store}`.
Консоль оператора — корень того же адреса (токен = `AUDIT_SERVER_TOKEN`).
