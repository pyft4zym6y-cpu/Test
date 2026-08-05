# Commerce OS™ · Методика (полная выгрузка)

Это **главный актив продукта** — полная методология e-commerce-консалтинга
weexp, выгруженная в репозиторий как страховка и единый источник правды.
Портал использует её выжимки (вопросы, роутинг, разрывы, ставки), здесь —
первоисточник целиком.

## Карта файлов

| Путь | Что внутри |
| --- | --- |
| `METHOD.md` | Корневой протокол: 5 инструментов, маршруты A (аудит) / B (КП) / C (справка), сквозные законы метода |
| `references/working_core.md` | Рабочее ядро: ЕКП (56 листов) и Гант (735 задач) — как вести |
| `references/audit_deliverables.md` | 18 документов аудита AD-01…AD-18: состав, слой, критерии готовности |
| `references/audit_report_structure.md` | Чертёж отчёта: 20 секций, 4 слоя данных, метки уверенности |
| `references/audit_framework.md` | Протокол сбора: слой L0 (внешний обход), 47 доменных проверок, реестр вопросов |
| `references/gold_standards.md` | 54 эталона: зоны 🔴🟡🟢, категорийные поправки, модель выручки и цепная атрибуция |
| `references/maturity_health_score.md` | Матрица зрелости 18 доменов, 28 критических разрывов, формула Health Score |
| `references/routing.md` | 50 правил R01–R50, 168 триггеров, сборка scope |
| `references/playbooks_index.md` + `playbooks/PB-*.md` | 56 исполняемых плейбуков (9 разделов каждый) |
| `references/domains_index.md` + `domains/*.md` | 13 доменных методик (CRM, pricing, SEO, ops, AI…) |
| `references/uxui_index.md` + `uxui/ch-*.md` | UX/UI-энциклопедия, 59 глав (PLP/PDP/Cart/Checkout/законы UX) |
| `references/deliverables_registry.md` | 62 deliverables программы D-01…D-62 |
| `references/engagement_deliverables.md` | 21 документ сотрудничества: КП (KP), контур программы (PR), fractional (FL), сверка XX-01 |
| `references/kp_master_structure.md` | 20 секций коммерческого предложения (продающий паттерн) |
| `references/data_access_registry.md` | Реестр доступов AC/EX × 56 плейбуков |
| `references/cost_base.md` | Rate card: подтверждённые ставки из КП + рыночные вилки |
| `references/competitor_benchmark.md` | Конкурентный бенчмарк: 16 параметров, индекс, white space |
| `references/discovery_brief.md` | Бриф собственника |
| `scripts/gap_calculator.py` | Расчёт потенциала и вкладов рычагов с контролем сходимости |
| `references/decision_engine.md` | Decision Engine: правила решений, Confidence Score, Evidence Levels, причинные цепочки, зрелость, гипотезы, Learning Loop |
| `references/ontology.md` | Онтология Commerce OS: сущности, связи, сквозной пример по графу |

## Что из этого уже зашито в портал

| Методика | Реализация в портале |
| --- | --- |
| Вопросы фреймворка (вес ≥ 2) | `src/data/questions.json` (643) |
| Роутинг R01–R50 | `src/data/routing.json` + матчинг в `lib/report.ts` |
| Матрица зрелости + разрывы + полосы | `src/data/method.ts` |
| Модель выручки, 8 рычагов, цепная атрибуция | `lib/consultant.ts` (computeGap8) |
| Реестр доступов | `src/data/accesses.json` (26) |
| Rate card (выжимка) | `src/data/rates.ts` |
| Бриф собственника + ЛПР | шаг 07, `src/data/decision.ts` |
| КП (11 секций из 20) | `src/pages/KpPage.tsx` |
| Decision Engine + Confidence + Evidence + цепочки + зрелость + гипотезы | `src/lib/engine.ts`, `src/data/engine.ts` |
| Гант (черновик из фазы 0 + волн) | `lib/gantt.ts` |

При изменении методики сначала правится первоисточник здесь, затем
перегенерируются выжимки в `src/data/`.
