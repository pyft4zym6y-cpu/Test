# 06 · Субпроцессоры, внешние сервисы и лицензии

> Заземлено на `worker/src/anthropic.ts`, `agent.ts`, `store.ts`,
> `experts/wave*.ts`, `agentReach.ts`, `portal/api/*.js`, `worker/package.json`,
> `portal/package.json`.

## Субпроцессоры (кому уходят данные и какие)

| Сервис | Хост | Что уходит | Триггер / гейт |
|--------|------|------------|-----------------|
| **Anthropic (Claude API)** | `api.anthropic.com` | Данные обхода сайта, ответы опросника, **скриншоты/PDF** (vision); в портале — «живой снимок аудита» (бизнес-данные) | `ANTHROPIC_API_KEY` |
| **Anthropic web_search** | контейнер Anthropic | Бренд/домен + узкие запросы (отзывы, соцсети, цены, AI-видимость) | `ANTHROPIC_API_KEY` |
| **Supabase** | `*.supabase.co` | Все данные портала (PII, файлы); движок читает `clients`+`answers`, пишет `report_meta` | всегда (портал), service-role (движок) |
| **Vercel** | — | Хостинг портала + serverless-функции | всегда (портал) |
| **Railway / Render** | — | Хостинг движка (results на диске) | всегда (движок) |
| **Google PageSpeed** | `www.googleapis.com/pagespeedonline` | URL клиента | премиум; `PSI_KEY` |
| **Google Analytics Data API** | `analyticsdata.googleapis.com` | GA4-запросы (сессии/транзакции/доход) через service-account | `portal/api/ga4.js` |
| **Resend (email)** | `api.resend.com` | Тема/текст уведомлений консультанту | `RESEND_API_KEY` |
| **Serpstat** | `api.serpstat.com` | Домен клиента + токен weexp | премиум; `SERPSTAT_KEY` |
| **SimilarWeb** | `api.similarweb.com` | Домен клиента + ключ weexp | премиум; `SIMILARWEB_KEY` |
| **Jina Reader** | `r.jina.ai` | Целевой URL (чистый текст) | `AGENT_REACH=1` |
| **Exa (через mcporter)** | — | Поисковые запросы | `AGENT_REACH=1` |
| Произвольные сайты | — | GET-запросы обхода (клиент/конкуренты/Figma) | ядро |

**Для DPA (раздел 12):** обязательные субпроцессоры с доступом к данным клиента —
**Anthropic, Supabase, Vercel, Railway/Render**. Опциональные (премиум/по домену) —
Google, Serpstat, SimilarWeb, Jina/Exa. Каждый требует оформленного DPA и записи в реестре.

## Зависимости и лицензии

**Движок (`worker/package.json`, runtime):**
| Пакет | Версия | Лицензия | Обрабатывает данные? |
|-------|--------|----------|----------------------|
| `@anthropic-ai/sdk` | ^0.68 | MIT | Да (сайт/ответы → Claude) |
| `playwright` | ^1.62 | Apache-2.0 | Да (обход сайтов) |
| `axe-core` | ^4.13 | MPL-2.0 | Локально (a11y) |
| `docx` | ^9.0 | MIT | Генерация |
| `pptxgenjs` | ^3.12 | MIT | Генерация |
| `xlsx` (SheetJS) | ^0.18 | Apache-2.0 | Читает загруженные Excel |
| `mammoth` | ^1.12 | BSD-2-Clause | Читает загруженные .docx |
| dev: `tsx`, `typescript`, `@types/node` | — | MIT/Apache | — |

**Портал (`portal/package.json`, runtime):**
| Пакет | Версия | Лицензия |
|-------|--------|----------|
| `@supabase/supabase-js` | ^2.45 | MIT |
| `react`, `react-dom` | ^18.3 | MIT |
| `react-router-dom` | ^6.26 | MIT |
| dev: `vite`, `@vitejs/plugin-react`, `vite-plugin-singlefile`, `typescript`, `@types/*` | — | MIT |

**Вывод по лицензиям:** копилефт сильнее MPL-2.0 (axe-core) отсутствует; GPL не обнаружено.
Лицензии определены по upstream-пакетам (не по вложенным LICENSE в репозитории). Собственный
код репозитория **не имеет LICENSE-файла** — рекомендуется определить лицензию/режим (раздел 12).

## Собственные zero-dependency реализации

Движок содержит свои реализации без внешних зависимостей: ZIP (`zip.ts`), XLSX-писатель
(`xlsx.ts`), HTTP-сервер (`node:http`). Это снижает supply-chain поверхность для этих частей.
