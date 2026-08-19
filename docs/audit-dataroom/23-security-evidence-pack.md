# 23 · Security Evidence Pack

> **Версия:** 0.1 · **Владелец:** SEC / ENG · **Проверяющий:** [Заполнить] · **Дата:** 2026-08-19 ·
> **Следующий пересмотр:** ежемесячно (или после каждого релиза) · **Статус:** 🟡 частично (реальные сканы есть, пентест — нет)

Отвечает на замечания №12, №9 (E-06). Реальные доказательства, не декларации. Секреты/PII
в документ не включаются — только идентификаторы и результаты.

## E-06a · Dependency vulnerability scan (проведён ✅)

`npm audit` от 2026-08-19 (метод: Test). **Реальные результаты:**

**worker/ (prod, 58 зависимостей):** 3 high.
| Пакет | Уязвимость | Severity | Fix | Примечание для нас |
|-------|-----------|----------|-----|--------------------|
| `xlsx` (SheetJS) | Prototype Pollution (GHSA-4r6h-8v6p-xvw6), ReDoS (GHSA-5pgg-2g8v-p4x9) | high | нет | **Важно:** используется для парсинга ЗАГРУЖЕННЫХ клиентских Excel (`questionnaire.ts`) — прямой вектор. Митигация: мигрировать на поддерживаемую версию/форк или парсить в изоляции |
| `image-size` (через `pptxgenjs`) | DoS в ICNS/JXL/HEIF парсерах (infinite loop) | high | breaking (pptxgenjs 1.1.5) | Задействован при генерации PPTX; вход контролируемый |

**portal/ (5 vulns: 2 high, 3 moderate):**
| Пакет | Уязвимость | Severity | Fix |
|-------|-----------|----------|-----|
| `nanoid` | loop при size=0 (GHSA-2v37-7h3g-55p8) | high | `npm audit fix` |
| `esbuild` (через `vite`) | dev-сервер принимает любые запросы (GHSA-67mh-4wv8-2f99) | moderate | breaking (vite 8) — **dev-only**, прод не затронут |
| `react-router` | open-redirect через backslash; constructor injection в SSR | moderate | `npm audit fix` |

**Действия (в беклоге, R-16):** `nanoid`/`react-router` — обычный `npm audit fix`; `xlsx` —
замена/изоляция (приоритет, т.к. парсит недоверенный вход); `pptxgenjs`/`vite` — оценить
breaking-обновления. Полный вывод: `worker: npm audit`, `portal: npm audit`.

## E-06b · Secrets scan (проведён ✅)

grep по репозиторию (`sk-ant-`, `AIza…`, `-----BEGIN`, JWT, длинные литералы): **захардкоженных
ключей/токенов/приватных ключей не найдено**; `.env` не в гите. Единственное — личный e-mail
`pashasidorenko18@gmail.com` как дефолтный контакт (PII, не секрет). Метод: Test (раздел 05).

## E-06c · Security assessment (white-box, целевой) — проведён 🟡

Проведён ручной **source-grounded white-box** разбор трёх приоритетных поверхностей (SSRF,
auth-токен, RLS). Инструментальный прогон **Strix** в текущем окружении не выполнялся
(нет Docker для OSS CLI и нет `STRIX_API_TOKEN` для Cloud) — команды для авторитетного
прогона ниже. Полный структурированный список — `security-assessment-findings.json`.

Итог: **0 critical, 3 high, 1 medium, 1 low, 1 info**. Два high-риска **исправлены в коде**.

| ID | Находка | Severity | Статус | Где / фикс |
|----|---------|----------|--------|------------|
| WEEXP-2026-001 | **SSRF**: серверный fetch произвольного URL без allowlist | high (7.7) | ✅ fixed | `portal/api/_ssrfGuard.js` (блок приватных/metadata/внутренних + DNS-резолв + валидация редиректов), применён в `fetch.js`/`aqc.js` |
| WEEXP-2026-002 | **Fail-open auth**: пустой `AUDIT_SERVER_TOKEN` открывает защищённые маршруты | high (8.2) | ✅ fixed | `server.ts`: fail-closed (503), токен только из заголовка |
| WEEXP-2026-003 | Токен в query `?t=` → в логи прокси | medium | 🟡 mitigated | `server.ts`: query разрешён только для ссылок-скачиваний (/result,/job) |
| WEEXP-2026-004 | Wildcard CORS `*` | low | принят | bearer-заголовок, cookies не используются |
| WEEXP-2026-005 | `xlsx` (SheetJS) proto-pollution/ReDoS на загруженных Excel | high | ⛔ open | `questionnaire.ts` — заменить/изолировать (R-16, OQ-01) |
| WEEXP-2026-RLS | Проверка RLS (граница между клиентами) | info | ✅ no-finding | `schema.sql`: RLS корректен, `client_locked` не обходится (есть drop policy перед lock-версиями) |

**PoC (пример SSRF, до фикса):** `GET /api/fetch?url=http://169.254.169.254/latest/meta-data/`
возвращал тело внутреннего адреса. После фикса — `400 URL отклонён SSRF-защитой
(ssrf:private-ip)`. Проверено юнит-тестом guard: metadata/localhost/loopback/10.x/192.168/
IPv6-loopback/file: — блокируются; публичный хост — проходит.

**Остаётся (⛔):** авторитетный инструментальный прогон + SAST/DAST + замена `xlsx`.
Запуск Strix (OSS CLI, нужен Docker + LLM-ключ):
```bash
export STRIX_LLM="anthropic/claude-..."; export LLM_API_KEY="<key>"
strix -n -t ./ -t https://staging.weexp.agency --scan-mode standard --max-budget 15 \
  --instruction "Focus: SSRF in portal/api/fetch.js & aqc.js, auth on worker server, Supabase RLS."
```
или Cloud (`STRIX_API_TOKEN` с app.strix.ai). Отчёт + SARIF приложить сюда. Владелец: SEC.

## E-06d · Access review / rotation (⛔)

Обзор доступов сотрудников/подрядчиков и ротация секретов — см. раздел 27 (Access Matrix).

## Definition of Done

Раздел → ✅, когда: приложены отчёты dependency-scan + pentest + SAST со свежими датами;
каждая находка имеет статус remediation (open/fixed/accepted) с доказательством (commit SHA/
ticket); access review проведён; ротация секретов задокументирована.

## Открытые пункты

- [ ] Заменить/изолировать `xlsx` (парсит недоверенный вход) — P0. Владелец: ENG.
- [ ] `npm audit fix` для nanoid/react-router. Владелец: ENG.
- [ ] Провести пентест (SSRF, токен, RLS) + приложить отчёт. Владелец: SEC.
- [ ] Настроить SAST/зависимости в CI (когда появится CI). Владелец: ENG.
