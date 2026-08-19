# 02 · Архитектура

> Заземлено на коде на момент коммита. Аудитору: проверять против `worker/src/`,
> `portal/src/`, `portal/api/`, `worker/Dockerfile`, `railway.json`, `render.yaml`,
> `vercel.json`.

## Важное уточнение о репозитории

Репозиторий — **мульти-апп**, а не два пакета. Он содержит несколько независимых
приложений (у каждого свой `package.json`/`node_modules`, workspaces не настроены):

| Путь | Что это | В периметре аудит-продукта |
|------|---------|-----------------------------|
| `worker/` | Движок аудита (Playwright + Claude), Node/TS | ✅ да |
| `portal/` | Клиентский портал (React/Vite + Supabase) | ✅ да |
| `portal/api/` | Vercel serverless-функции портала | ✅ да |
| `weexp-site/` | Отдельный сайт-визитка (React) | ⚠️ смежное |
| `school/` | Отдельное приложение «school» | ⚠️ смежное |
| `video/weexp-reel/` | Remotion-видео | ⚠️ смежное |
| корневой `src/` + `api/` | Лендинг `commerce-os-site` + 8 serverless-функций | ⚠️ смежное |

**Периметр этого data room — аудит-продукт: `worker/` + `portal/` + `portal/api/`.**
Смежные приложения отмечены, но не аудируются здесь (если аудитор захочет — расширяем
скоуп отдельно).

## Компоненты и границы доверия

```
┌─────────────────────────────────────────────────────────────────┐
│ БРАУЗЕР КЛИЕНТА/КОНСУЛЬТАНТА                                       │
│  portal/ (React SPA, Vite)                                        │
│   • anon-ключ Supabase в бандле — граница безопасности = RLS      │
│   • localStorage: демо-данные, выбор коннекторов, интейк,         │
│     И audit-server URL+token (внимание: cleartext)                │
└───────────┬───────────────────────────┬─────────────────────────┘
            │ Supabase JS (anon+RLS)      │ POST (x-audit-token)
            ▼                             ▼
┌────────────────────────┐   ┌──────────────────────────────────────┐
│ SUPABASE (EU)          │   │ WORKER (Railway/Render, node:http)     │
│  Postgres + RLS + Auth │   │  server.ts — bearer AUDIT_SERVER_TOKEN │
│  Storage bucket uploads│   │  очередь (1 аудит за раз, in-memory)   │
│  таблицы: clients,     │   │  pipeline.ts: обход→анализ→сборка→PDF   │
│  members, answers,     │   │  Playwright Chromium (crawl + PDF)      │
│  access_status, files, │   │  результаты в results/<id>/            │
│  report_meta           │   └───────────┬───────────────┬───────────┘
└────────────┬───────────┘               │               │
             │ REST (service-role key)    │ Claude API    │ crawl/fetch
             │  (worker/src/store.ts)      ▼               ▼
             │                    ┌─────────────┐   ┌──────────────────┐
             ▼                    │ ANTHROPIC   │   │ САЙТЫ КЛИЕНТА/    │
┌────────────────────────┐       │ Claude API  │   │ КОНКУРЕНТОВ       │
│ portal/api/ (Vercel)   │       │ + web_search│   │ (+ Figma, etc.)   │
│  assistant.js → Claude │       └─────────────┘   └──────────────────┘
│  aqc.js → fetch+Claude │
│  fetch.js → arb URL    │  ← SSRF-поверхность (URL от клиента, без allowlist)
│  ga4.js → GA4 SA key   │
│  notify.js → Resend    │
└────────────────────────┘
```

**Границы доверия (trust boundaries):**
1. Браузер ↔ Supabase — защищено **только RLS** (anon-ключ публичен по дизайну). RLS
   в `portal/supabase/schema.sql` — критический контроль для аудита.
2. Браузер ↔ Worker — общий bearer-токен `AUDIT_SERVER_TOKEN` (заголовок `x-audit-token`
   или `?t=`). Если токен пуст — сервер открыт.
3. Worker ↔ Supabase — **service-role ключ** (`SUPABASE_SERVICE_KEY`), обходит RLS.
4. Worker/Portal ↔ Anthropic — данные клиента уходят в Claude API (см. раздел 06).
5. `portal/api/fetch.js` и `aqc.js` — забирают произвольный URL от клиента серверно
   (SSRF-поверхность, без allowlist) — см. раздел 05.

## Технологический стек

| Слой | Технология | Версия |
|------|-----------|--------|
| Движок | Node.js (Playwright jammy образ, Node 20/22-class), TypeScript ESM | TS ^5.5 |
| Рантайм движка | `tsx` (TS исполняется напрямую, **без сборки**) | ^4.19 |
| Браузер движка | Playwright Chromium | ^1.62 |
| AI | `@anthropic-ai/sdk`, модель по умолч. `claude-opus-5` | sdk ^0.68 |
| Портал | React 18 + Vite 5 + TypeScript | react ^18.3, vite ^5.4 |
| Данные портала | Supabase (Postgres + Auth + Storage), `@supabase/supabase-js` | ^2.45 |
| Serverless | Vercel-функции (`portal/api/*.js`) | — |
| Генерация | PDF (Playwright), XLSX (свой zero-dep), DOCX (`docx`), PPTX (`pptxgenjs`), ZIP (свой) | — |

## Пайплайн аудита (end-to-end)

Единая функция `runAudit` в `worker/src/pipeline.ts` (~30 build-модулей, каждая
стадия в try/catch — одна ошибка не рушит весь прогон; пер-стадийные таймауты +
общий watchdog `AUDIT_MAX_MINUTES`, по умолч. 30):

1. **Запуск браузера** (`crawl.ts`).
2. **Обход клиента** (`crawlSite`) — рендер JS. **Гейт достижимости:** если сайт
   недоступен и нет резервных скриншотов — прогон честно останавливается ДО вызова
   Claude (никаких выдуманных находок).
3. **Обход конкурентов** (T2+), до 6 страниц каждый.
4. `dataset.json` (скриншоты вырезаны).
5. **Детерминированный слой:** ~30 «линз»-отчётов (build JSON → render HTML → PDF).
   Опциональное обогащение нарративом от Claude при наличии `ANTHROPIC_API_KEY`.
6. **Резервный контур по скриншотам:** если сайт-заглушка/недоступен и загружены
   резервные PDF — `auditFromScreenshots` (Claude vision) реконструирует UX/UI.
7. **Опросник** (если загружен) → Health Score (`portalEngine`).
8. **Деньги** (`computeMoney`) при наличии baseline-рычагов.
9. **Анализ Claude** (one-shot `analyze` или агентный `agentAnalyze`) → `analysis.json`.
10. **Документы метода** (PDF): зрелость, scope, цена-в-канале, причинная карта, покрытие.
11. **Единый реестр находок** (`registry.ts`, feed от всех линз). Премиум-эксперты — здесь.
12. Итоговое резюме, Executive Diagnostic, флагман «Презентація аудиту», синтез, КП.
13. Гейты активации/покрытия, сводный беклог, self-QA.
14. **Группировка документов** (`export/documents.ts`) — ~26 внутренних файлов → 5 тем клиенту.
15. Возврат `{id, dir, summary, files, metrics}`.

## Ключевые архитектурные свойства

- **Fail-safe by design:** отсутствие ключа/таймаут/блок egress → деградация к
  детерминированному выводу, но **не выдумка данных**.
- **Без сборки в проде:** движок исполняет TS через `tsx` в образе с
  `NODE_ENV=development` (`tsx` — dev-зависимость, нужна в рантайме). Это осознанный
  компромисс — отмечено в разделе рисков.
- **Один аудит за раз:** очередь in-memory, single-worker; история персистится в
  `results/_jobs/<id>.json` и восстанавливается после рестарта.
- **Портал заимствует** чистые модули из `portal/src/lib` в движок на этапе сборки образа.
