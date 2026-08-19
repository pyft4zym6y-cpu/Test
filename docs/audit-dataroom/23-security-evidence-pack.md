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

## E-06c · Penetration test / SAST / DAST (⛔ не проведён)

Формального пентеста и SAST/DAST **нет** (E-06 = gap). Приоритетные цели (из раздела 05):
- **SSRF** в `portal/api/fetch.js` и `aqc.js` (произвольный URL от клиента, без allowlist) — S-5.
- **Открытый движок** при пустом `AUDIT_SERVER_TOKEN` — S-1.
- **RLS-обход** — проверить корректность политик (граница между клиентами) — S-10/EV-10.

**План:** прогнать пентест доступным инструментом (в окружении есть скилл strix —
penetration-testing-with-strix / ci-security-scanning), плюс SAST на `portal/api/*`. Приложить
отчёт + remediation-evidence сюда. Владелец: SEC. Это стандартное SOC 2 доказательство.

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
