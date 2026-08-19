# 03 · Инвентарь модулей и deliverables

> Заземлено на `worker/src/*.ts`, `worker/src/export/*`, `portal/src/pages/*`.

## Движок аудита — модули (`worker/src/`)

**Ядро / данные обхода**
| Модуль | Что делает |
|--------|-----------|
| `crawl.ts` (~84 KB) | Playwright-обход, ~30 gold-standard проверок/страница, fingerprint стека/бренда/перфа |
| `report.ts` | Тип `AuditDataset` + рендер L0 |
| `registry.ts` / `registryFeed.ts` | Единый реестр находок (Impact×Effort, уверенность, деньги) |
| `money.ts` | Модель потерянной выручки по рычагам воронки |
| `portalEngine.ts` | Опросник → Health Score, разрывы, решения |
| `tiers.ts` | Спецификации тиров (T0 prelaunch … T4) |

**UX / дизайн**
| Модуль | Что делает |
|--------|-----------|
| `uxui.ts`, `pagereport.ts`, `prototype.ts` | Разбор страниц/блоков против эталона AQC, вайрфреймы |
| `designReview.ts`, `visionAudit.ts` | Claude-vision: вердикт по дизайну, реконструкция UX по скриншотам |
| `journey.ts`, `uxflow.ts` | Живой проход пути (поиск→корзина→чекаут + мобайл) через Playwright |

**SEO / контент / GEO**
| Модуль | Что делает |
|--------|-----------|
| `seoarch.ts`, `seoflow.ts` | SEO-архитектура и SEO как система (8 артефактов) |
| `contentaudit.ts`, `contentflow.ts` | Контент и его способность конвертировать |
| `geoflow.ts`, `geoexpand.ts` | GEO/AEO/LLM-видимость; готовность к новым рынкам (i18n) |
| `techaudit.ts`, `structureflow.ts` | Технический аудит; архитектура сайта как система |

**Коммерция / конверсия / стратегия**
| Модуль | Что делает |
|--------|-----------|
| `intelligence.ts` | Commerce Intelligence (35+ слоёв, цепочки, зрелость 1–5) — флагман, Claude |
| `mechanics.ts` | Реестр 34 маркетинг-механик |
| `merchflow.ts`, `croflow.ts` | Мерчендайзинг; CRO-система (воронка, трение/доверие/CTA, ICE) |
| `strategyflow.ts`, `pageflow.ts`, `blockflow.ts` | Стратегический / страничный / поблочный аудиты |
| `analyticsflow.ts`, `cjmflow.ts` | Система измерений; путь клиента (Awareness→Advocacy) |
| `unitecon.ts`, `auditchain.ts`, `auditsystem.ts` | Юнит-экономика; ланцюг из 6 уровней; Master Audit System |
| `channels.ts`, `pricechannel.ts`, `competitor.ts`, `externalAudits.ts` | Каналы; цена-в-канале; бенчмарк; соцсети/упоминания/отзывы (web_search) |

**Метод / синтез / инфра**
| Модуль | Что делает |
|--------|-----------|
| `analyze.ts`, `agent.ts` | One-shot и агентный (tool-use) анализ Claude |
| `maturity/routing/causal/coverage/hypotheses/synthesis/kp/backlog/engagement/qa/activation/targetState/method` | Документы метода |
| `anthropic.ts`, `store.ts` | Клиент Claude; коннектор Supabase (service-role) |
| `pdf.ts`, `xlsx.ts`, `zip.ts`, `console.ts`, `questionnaire.ts`, `knowledge.ts` | Генерация/инфра |
| `export/*` (~40 рендереров) | По одному `*Html/*Pdf/*Docx` на линзу + `pptx.ts`, `charts.ts`, `documents.ts` |
| `experts/*` | Премиум-агенты (некоторые — заглушки `needs-auth`) |

## Портал — страницы (`portal/src/pages/`)

| Страница | Маршрут | Собирает / показывает |
|----------|---------|------------------------|
| Login | — | Auth (magic-link / пароль) |
| Dashboard | `/` | Прогресс, боли, ссылки на отчёт |
| CompanyPage | `/company` | Паспорт: имя, сайты, оффер, ниша, каналы, гео, выручка, команда |
| GoalsPage | `/goals` | Тактические/стратегические цели, бриф собственника |
| PainsPage | `/pains` | Тактические/стратегические боли |
| LinksPage | `/links` | Ссылки на конкурентов/референсы |
| DomainPage | `/d/:sheet` | Опросник (643 вопроса) по доменам |
| **AccessPage** | `/access` | Статусы доступов AC-01…20 + **загрузка файлов в Supabase** |
| ConnectorsPage | `/connectors` | Выбор коннекторов (localStorage) |
| **AuditIntakePage** | `/intake` | Глубина T1–T4 + блоки + предоставление (localStorage) — *новое* |
| DecisionPage | `/decision` | ЛПР (имена/роли/KPI), бюджет, команда — высокий PII |
| ReportPage | `/report` | Health Score, карта здоровья, риски, деньги |
| DeliverablesPage | `/deliverables` | Список 19 deliverables (статичный) |
| PrivacyPage | `/privacy` | Политика приватности |
| AdminPage | `/admin` | CRUD клиентов/участников, выдача логинов, lock |
| AdminClientPage | `/admin/c/:id` | Рабочее место консультанта (1105 строк): отчёт, деньги, парс CSV заказов, GA4, экспорт |
| KpPage | `/kp/:id` | Коммерческое предложение |
| AuditRunnerPage | `/audit` | Запуск аудита на движке (URL+токен в localStorage) |

## Deliverables (что выпускает система)

За полный прогон движок выпускает ~35+ PDF-отчётов (`*-A0.pdf`), которые группируются
в 5 тем клиенту + флагман «0-Презентація-аудиту.pdf» + КП (PDF/DOCX). Плюс:
- **XLSX**: таблицы метода + «Уровни-аудита-T1-T4.xlsx» (интейк).
- **DOCX**: отчёт, КП, метод-документы.
- **PPTX**: AD-15 дека.
- **ZIP**: `pack.zip` (чистый клиентский) и `pack-internal.zip` (всё + JSON).
- **JSON**: каждая линза + `dataset.json` (сырой обход).

Полный каталог 19 продуктовых deliverables (AD-01…19) — в `portal/src/pages/DeliverablesPage.tsx`.
