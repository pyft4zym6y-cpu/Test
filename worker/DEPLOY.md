# Разворачивание аудит-сервера (для разработчика)

Цель: поднять `worker/src/server.ts` один раз, чтобы владелец запускал аудит
**кнопкой из портала** (страница «Запустить аудит»), без терминала. ~20 минут.

## Что понадобится
- Аккаунт на **Render** или **Railway** (или любой VPS с Docker).
- **ANTHROPIC_API_KEY** (console.anthropic.com → API keys; на балансе должен быть кредит).
- Придуманный **AUDIT_SERVER_TOKEN** — любой длинный секрет (общий пароль портал↔сервер).

## Вариант A — Render (проще всего)
1. Render → **New → Web Service** → подключить этот GitHub-репозиторий, ветка `claude/ai-assistant-comerc-oc-qufqcc`.
2. **Runtime: Docker**. Dockerfile path: `worker/Dockerfile`. **Docker build context: корень репозитория** (`.`), не `worker/` — воркеру нужны и `worker/`, и `portal/`.
3. **Environment**:
   - `ANTHROPIC_API_KEY` = ваш ключ Claude
   - `AUDIT_SERVER_TOKEN` = ваш секрет
   - `AUDIT_MODEL` = `claude-opus-5` (необязательно; дорогая/лучшая модель по умолчанию)
   - `PORT` = `8787` (Render обычно подставляет свой — оставьте как есть, сервер читает `PORT`)
4. Create Web Service. После сборки получите адрес вида `https://weexp-audit.onrender.com`.
5. Проверка: откройте `https://…onrender.com/health` — должно вернуть `{"ok":true,"hasKey":true}`.

> Обход браузером требует памяти. На Render возьмите инстанс **≥1 GB RAM** (Playwright + Chromium). На free-плане может не хватать — используйте платный Starter.

## Вариант B — Railway
1. Railway → **New Project → Deploy from GitHub** → этот репозиторий/ветка.
2. Settings → **Build**: Dockerfile `worker/Dockerfile`, root/context — корень репозитория.
3. Variables: те же (`ANTHROPIC_API_KEY`, `AUDIT_SERVER_TOKEN`, `AUDIT_MODEL`).
4. Deploy → Railway даст публичный домен. Проверьте `/health`.

## Вариант C — свой VPS (Docker)
```bash
git clone -b claude/ai-assistant-comerc-oc-qufqcc <repo> && cd <repo>
docker build -f worker/Dockerfile -t weexp-audit .
docker run -d --name audit -p 8787:8787 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e AUDIT_SERVER_TOKEN=ваш_секрет \
  -e AUDIT_MODEL=claude-opus-5 \
  weexp-audit
curl http://localhost:8787/health
```
Поставьте перед ним обратный прокси с HTTPS (Caddy/Nginx) — портал ходит по https.

## Подключение к порталу (делает владелец)
1. В портале — ссылка **«Запустить аудит»** (видна админу).
2. Раскрыть **«Настройка сервера (один раз)»**:
   - Адрес аудит-сервера = URL из Render/Railway/VPS
   - Токен = `AUDIT_SERVER_TOKEN`
   - **Проверить связь** → должно быть «сервер на связи · ключ Claude: есть ✓».
3. Дальше: URL клиента → **Запустить аудит** → через несколько минут ссылки на `AD-15.pptx` и `audit-report.docx`.

## Эндпоинты сервера
- `GET /health` — статус + есть ли ключ.
- `POST /audit` — `{tier,site,competitors,request,agentic,prelaunch,brief,answers,baseline}`; заголовок `x-audit-token`.
- `GET /result/:id/:file?t=токен` — скачать готовый файл.

## Безопасность
- Токен — не публичный; храните в переменных окружения, не в коде.
- Сервер отдаёт файлы только по токену. CORS открыт (портал на другом домене) — доступ гейтит токен.
