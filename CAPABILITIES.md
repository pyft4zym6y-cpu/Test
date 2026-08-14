# Capability Map — апгрейд экспертизы по 12 слоям (Aug 2026)

Каталог инструментов/техник/сервисов, поднимающих качество по двум проектам:
- **A — Commerce OS** (аудит-движок: обход → внешние сигналы → LLM-анализ → PDF-отчёты).
- **B — WeExp site** (Vite+React+TS, three.js/GSAP/Lenis/framer-motion, скролл-интерактив).

Тег `[A]`/`[B]` = где применяем. «Adopt» = как подключить. Ниже — топ-выбор по каждому слою + shortlist «внедрять первым».

---

## 1. Data — источники и API
| Инструмент | Тег | Что / зачем | Adopt |
|---|---|---|---|
| **Firecrawl** | A | URL → чистый markdown/JSON для LLM; `/extract` по схеме | `@mendable/firecrawl-js` + Firecrawl **MCP** |
| **Bright Data** | A | Анти-бот инфраструктура для защищённых площадок (Cloudflare) — топ по review-scraping | Web Unlocker / MCP |
| **Apify** | A | 5000+ готовых скрейперов (Google/Trustpilot/IG/TikTok reviews) | `apify-client` + Apify MCP |
| **DataForSEO** | A | SERP/keywords/backlinks/on-page + **Merchant (Shopping)** одним ключом | REST, $0.6–2/1K |
| **PageSpeed Insights + CrUX** | A B | Core Web Vitals (LCP/INP/CLS), лаб+поле — **бесплатно** | REST + free API key; `web-vitals` npm для B |
| **GA4 Data API** | A | Реальные конверсии/выручка → калибрует revenue-gap | `@google-analytics/data` |
| **Keepa / FlyByAPIs** | A | История цен маркетплейсов (UA Rozetka/Prom — через Bright Data/Apify) | REST |
| **Profound / Otterly** | A | GEO: цитируется ли бренд в ChatGPT/Perplexity/AI Overviews | REST API |

## 2. Knowledge — RAG, векторные БД, эмбеддинги, KG
| Инструмент | Тег | Что / зачем | Adopt |
|---|---|---|---|
| **pgvector (Postgres)** | A | Дефолт: findings + векторы + метаданные в одной БД, SQL-фильтры | Postgres ext + `pg` |
| **Qdrant / LanceDB / Turbopuffer** | A | Масштаб (Qdrant), embedded (LanceDB), дёшево-на-S3 (Turbopuffer) | клиенты + MCP |
| **voyage-context-3 / voyage-3.5** | A | Контекстные эмбеддинги длинных PDP/policy; **мультиязычно (укр.)** | Voyage REST |
| **Cohere/Voyage rerank** | A | Реранк после hybrid-retrieval (+20–30% точности цитирования) | Cohere/Voyage API |
| **LlamaIndex (TS)** | A | Retrieval-слой: иерархич. чанкинг, sub-question декомпозиция | `llamaindex` |
| **Neo4j GraphRAG** | A | Причинная карта/реестр — граф finding→причина→метрика→₴ | `neo4j` + graphrag |
| **Baymard Institute** | A | 769 UX-гайдлайнов — **высший рычаг качества**: заземляет UX-находки в исследованиях | лицензия → в RAG |

## 3. Models — LLM/vision/OCR/rerank
| Модель | Тег | Роль | ID |
|---|---|---|---|
| **Claude Opus 4.8 / Fable 5** | A | Синтез, причинная карта, редактура отчётов | `claude-opus-4-8` / `claude-fable-5` |
| **Claude Sonnet 5 / Haiku 4.5** | A | Массовая экстракция/классификация в fanout | `claude-sonnet-5` / `claude-haiku-4-5-20251001` |
| **Anthropic web_search tool** | A | Нативный поиск с цитатами (mentions/конкуренты) | `tools:[web_search]` |
| **Gemini 3.1 Pro** | A | 1M-контекст: весь стор в один проход; дёшево | `@google/genai` |
| **DeepSeek-OCR / Claude vision** | A | PDF/скрины → markdown; **скриншот-based UX-скоринг** | self-host / API |

## 4. Skills — Claude Code плагины/скиллы
| Пакет | Тег | Что | Adopt |
|---|---|---|---|
| **claude-plugins-official** | A B | Каталог Anthropic (code-review, frontend-design, security) — **уже подключён** | `/plugin` |
| **claudedesignskills + web-animation-skills** | B | GSAP/ScrollTrigger/framer/R3F/Lottie + перф-аудит анимаций 60fps | marketplace add |
| **claude-seo (AgricIDaniel)** | A | 25 sub-skills: техн.SEO, schema, GEO/AEO, ecommerce-SEO, PDF/Excel | GitHub skill |
| **marketingskills (coreyhaines)** | A | CRO/AB/retention/ads — **многие уже стоят** (`cro`, `ab-testing`, `ads-*`) | invoke напрямую |
| **dataviz / pdf / xlsx / diagram-maker** | A | Единая система графиков + рендер отчётов — **уже стоят** | invoke перед графиками |
| **Strix (pentest/CI-scan)** | A B | Автономный пентест untrusted-контента/форм — **уже стоят** | skill |

## 5. Tools — MCP-серверы
| MCP | Тег | Что | Adopt |
|---|---|---|---|
| **Playwright MCP** | A B | Управление браузером по a11y-дереву; E2E-тесты анимаций | `@playwright/mcp` |
| **Firecrawl MCP** | A | Search/Scrape/Crawl/Map/Extract одним стеком | key + server |
| **chrome-devtools-mcp** | A B | CWV/perf-трейсы, network — **уже включён** | package |
| **Shopify (Storefront) + Stripe MCP** | A | Структурные товары/цены (Shopify-сторы), pricing-математика | endpoints |
| **GSC/GA4/DataForSEO MCP** | A | Реальные search/traffic сигналы в аудит | OAuth/creds |
| **Figma Dev Mode MCP** | B | Дизайн-токены → точный код — **загружен в сессии** | Figma desktop |
| **AntV/QuickChart/mermaid-PDF MCP** | A | Детерминированный рендер графиков/Markdown→PDF | npm servers |

## 6. Memory — межсессионная память
| Система | Тег | Что | Adopt |
|---|---|---|---|
| **claude-mem** | A B | Авто-память сессий разработки — **уже включён** | `npx claude-mem install` |
| **Zep (Graphiti)** | A | **Темпоральный** граф: цены/отзывы/ранги меняются во времени — идеально для повторных аудитов | Zep + MCP |
| **Mem0** | A | Пер-клиентская память продукта (история стора между прогонами) | OSS/managed |
| **Graphiti + Neo4j/FalkorDB** | A | Граф стора (товары↔отзывы↔конкуренты↔цены) для multi-hop | MCP |
| **Basic-Memory / Obsidian MCP** | A B | «Мозг проекта» в markdown в репо (конвенции, шаблоны) | MCP |

## 7. Context — контекст-инжиниринг
| Техника | Тег | Что / зачем | Adopt |
|---|---|---|---|
| **Prompt caching (cache_control)** | A | Кэш стабильного префикса (рубрика+снапшот стора) → −75–90% стоимости fanout | Anthropic API breakpoints |
| **Headroom** | A | Сжатие crawl/JSON перед LLM (60–95% на структурных данных) — **уже проброшен** | `headroom-ai` |
| **LLMLingua (query-aware)** | A | Отбор только релевантных пассажей под вопрос отчёта | Python-сервис |
| **Hybrid RAG + long-context** | A | «retrieve 50–200K → reason», не dump-all и не top-5 | pgvector + rerank |
| **Structure-aware чанкинг** | A | Резать по DOM-секциям (nav/PDP/policy), overlap не нужен | recursive ~512 |
| **Context-rot дисциплина** | A B | Бюджет контекста; критичное — по краям (lost-in-the-middle) | edges + XML-теги |
| **Structured outputs + Zod/BAML** | A | Грамматика по JSON-схеме → валидные findings для реестра | Anthropic `output_format` |

## 8. Reasoning — качество анализа
| Техника | Тег | Что / зачем |
|---|---|---|
| **Extended thinking (по сложности)** | A | Больше compute только на тяжёлые отчёты (чекаут/доверие) |
| **Deterministic verifiers > LLM-judge** | A | Схема/арифметика/regex сначала; judge — только субъективная severity |
| **Self-consistency (surgical)** | A | 3–5 сэмплов + голос на high-stakes находках (GDPR/severity) |
| **Reflection (1 проход на синтезе)** | A B | Само-критика итогового PDF / сгенерированного копирайта |
| **Plan-and-solve декомпозиция** | A | Планировщик → типизированный список под-задач → воркеры |
| **DSPy + GEPA** | A | Компиляция промптов под метрику (Nubank: judge 68.9%→88.9%) |

## 9. Workflows — оркестрация мультиотчётного пайплайна
| Движок | Тег | Что / зачем |
|---|---|---|
| **Claude Agent SDK (subagents)** | A B | Супервайзер + суб-агент на отчёт (свой контекст/инструменты) — решает исчерпание контекста |
| **Inngest / Trigger.dev** | A | TS-native durable step-functions: crawl→fanout→synthesize→PDF, retry по шагу |
| **Temporal** | A | Тяжёлая durability при масштабе/SLA |
| **LangGraph** | A | Граф с условным роутингом (escalate-to-ToT), rollback |
| **Supervisor fan-out→verify→synthesize** | A | **Паттерн-дефолт 2026** — 1:1 на реестр находок |
| **n8n** | A B | Low-code glue для не-LLM рёбер (расписания, доставка PDF, form-handoff) |

## 10. Evaluation — оценка и наблюдаемость
| Инструмент | Тег | Что / зачем |
|---|---|---|
| **Promptfoo** | A | Регресс-харнесс промптов/отчётов в CI (golden fixtures) |
| **Braintrust / Langfuse** | A | Трейсинг пайплайна + кастомные скореры/дашборды |
| **Ragas (Faithfulness)** | A | Доля claim'ов отчёта, подтверждённых обходом — **бэкбон evidence-first** |
| **Lighthouse CI** | B | CWV-бюджеты, блок merge при регрессе от тяжёлой анимации |
| **Playwright visual + axe-core** | B | Скрин-диффы pinned/scrub секций + a11y-гейт |

## 11. Guardrails — валидация/грундинг/безопасность
| Инструмент | Тег | Что / зачем |
|---|---|---|
| **Zod + structured outputs** | A | Ничего невалидного не доходит до скоринга — **дешёвая первая линия** |
| **Instructor** | A | Авто-коэрция+ретрай LLM-вывода в типизированную схему |
| **Ragas / LLM-judge grounding gate** | A | Каждый факт → трасса к доказательству; иначе флаг/скрыть |
| **LLM Guard / Lakera** | A | Prompt-injection сканер untrusted-контента стора |
| **Guardrails AI / NeMo** | A | Content-валидаторы, PII-редакция, retrieval-rails |

## 12. Interface — UI/моушн/дата-виз/агент-UI
| Инструмент | Тег | Что / зачем | Статус |
|---|---|---|---|
| **GSAP+ScrollTrigger · Lenis · Motion · split-type · R3F** | B | Скролл-стек WeExp | **все установлены/используются** |
| **Base UI / Radix + shadcn** | B A | Доступные примитивы (a11y by default) | shadcn настроен |
| **visx / Recharts / nivo** | A B | Дата-виз: visx для брендовых отчётных графиков | по мере надобности |
| **assistant-ui / Vercel AI SDK UI / CopilotKit** | A | Если аудиту нужен conversational-review UI | опция |

---

## ⭐ Внедрять первым (highest leverage)

**Проект A (аудит-движок):**
1. **Prompt caching** стабильного префикса (рубрика+снапшот стора) → −75–90% стоимости мультиотчётного fanout. *(код, быстрый выигрыш)*
2. **Structured outputs + Zod** для findings → надёжный реестр и детерминированный скоринг.
3. **Firecrawl (+ Bright Data fallback)** как основной обход/сбор reviews-prices-mentions.
4. **Baymard-корпус в pgvector + voyage-context-3 + rerank** → UX-находки заземлены в исследованиях, а не в «мнении LLM».
5. **Claude Agent SDK subagents** (супервайзер + отчёт-на-субагента) — решает исчерпание контекста; **Sonnet/Haiku на fanout, Opus/Fable на синтез**.
6. **Ragas Faithfulness + deterministic verifiers** — evidence-first гейт качества.
7. **Zep** — темпоральная память для повторных аудитов (цены/отзывы меняются во времени).

**Проект B (сайт):**
1. **PageSpeed/CrUX + `web-vitals`** — держать LCP/INP/CLS честными на three.js/GSAP.
2. **Lighthouse CI + Playwright visual + axe-core** — always-on гейт качества/a11y.
3. **claudedesignskills + web-animation-skills** — реальное знание GSAP/framer у Claude.

---

## Что уже добавлено/используется в наших проектах
- Скиллы/плагины (`.claude/settings.json`): claude-plugins-official, agents-observe, claude-mem, chrome-devtools-mcp, firecrawl, ui-ux-pro-max, frontend-design, modern-web-guidance, **+ animation-skills marketplaces (этот проход)**.
- Скилл Agent-Reach (`.claude/skills/agent-reach`) + воркер-адаптер `worker/src/agentReach.ts`.
- Контекст: `worker/src/headroom.ts` (opt-in сжатие).
- Сайт: three · gsap+ScrollTrigger · lenis · framer-motion · split-type · @fontsource.
- Диаграммы отчётов: собственный SVG-модуль (`worker/src/export/charts.ts`).

> Многое из списка — платные API/сервисы или требуют ключей/инфры; внедряем по мере доступа. Каждый пункт помечен, куда бьёт. Источники исследования — в истории (4 research-агента по 3 слоя).
