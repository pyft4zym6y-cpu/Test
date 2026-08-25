# 07 · Инфраструктура и операции

> Заземлено на `worker/Dockerfile`, `railway.json`, `render.yaml`, `vercel.json`,
> `worker/package.json`, `portal/package.json`, `worker/DEPLOY.md`.

## Топология деплоя

| Компонент | Платформа | Как деплоится |
|-----------|-----------|----------------|
| Движок `worker/` | **Railway** (`railway.json`) и/или **Render** (`render.yaml`) | Docker (`worker/Dockerfile`), healthcheck `GET /health` |
| Портал `portal/` | **Vercel** | `tsc && vite build`, SPA-rewrite; serverless `portal/api/*` |
| Данные | **Supabase** (Postgres + Auth + Storage, EU) | — |

**Railway (`railway.json`):** builder `DOCKERFILE`, `dockerfilePath: worker/Dockerfile`,
watch `worker/**`, healthcheck `/health` (таймаут 300 с), restart `ON_FAILURE` (max 3).

**Render (`render.yaml`):** тот же движок, `autoDeploy: false` (ручной), Frankfurt,
`AUDIT_MODEL: claude-opus-5`.

**Dockerfile движка:** база `mcr.microsoft.com/playwright:v1.62.1-jammy` (браузер
предустановлен). Собирается **из корня репо** (движок импортирует чистые модули из
`../portal/src/lib`). `NODE_ENV=development` + `npm ci --include=dev` (т.к. `tsx` — dev-
зависимость, нужна в рантайме), `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, `PORT=8787`,
`AUDIT_OUT=/app/worker/results`, `CMD npm run serve`.

**Без сборки/транспиляции:** движок исполняет TS напрямую через `tsx`. `tsconfig` — `noEmit`
(только typecheck). Node не запинен через `engines` — наследуется из образа Playwright jammy.

## Переменные окружения (полный список)

**Секреты** — см. [раздел 05](./05-security-surface.md#реестр-секретов).

**Конфиг движка (не секреты):** `AUDIT_MODEL` (по умолч. `claude-opus-5`), `AUDIT_OUT`
(`results`), `AUDIT_MAX_MINUTES` (30), `AUDIT_WEB_SEARCH`, `PORT` (8787),
`CLAUDE_TIMEOUT_MS` (180000), `CLAUDE_MAX_RETRIES` (1), `EXPERT_TIMEOUT_MS` (240000),
`PDF_TIMEOUT_MS` (60000), `AGENT_REACH` + `*_BIN`, `HEADROOM_COMPRESS`, `KNOWLEDGE_DIR`,
`CHROME_PATH`, `HEADFUL`, `NO_SCREENSHOTS`, `HTTPS_PROXY`.

**Конфиг портала (публичный):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PSI_KEY`.

## Локальный запуск (для аудитора)

```bash
# Движок
cd worker && npm ci
npm run typecheck            # tsc --noEmit
npm run serve                # HTTP на :8787 (нужен ANTHROPIC_API_KEY для AI-слоёв)
npm run audit -- --tier 1 --site https://example.com   # CLI-прогон

# Портал
cd portal && npm ci
npm run build                # tsc && vite build
npm run preview              # локальный предпросмотр (демо-режим без Supabase)
```

Без `ANTHROPIC_API_KEY` движок всё равно выпускает детерминированные отчёты (AI-слои
пропускаются). Портал без Supabase-env поднимается в **демо-режиме** (данные — в localStorage).

## Персистентность и восстановление

- Результаты прогонов — `results/<id>/` на диске хоста движка (gitignored). История задач
  персистится в `results/_jobs/<id>.json`; после рестарта прерванные задачи помечаются `error`.
- Данные портала — в Supabase (управляемые бэкапы Postgres на стороне Supabase).

## Пробелы (честно)

| ID | Пробел | Владелец |
|----|--------|----------|
| F-03 | Формальная политика бэкапов/восстановления (RPO/RTO) не документирована | OPS |
| F-04 | Централизованный мониторинг/алертинг/агрегация логов — не настроены (есть healthcheck + операторская консоль `/jobs`) | OPS |
| F-05 | Формальный процесс релизов/отката — не документирован (деплой ручной, `autoDeploy:false`) | OPS |
| — | Секреты управляются переменными окружения платформ; ротация/хранилище секретов не описаны | SEC |
