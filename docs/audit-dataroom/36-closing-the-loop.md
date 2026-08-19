# 36 · Closing the Loop — самопроверяемый и самообучающийся аудит

> **Версия:** 0.1 · **Владелец:** PO / ENG · **Проверяющий:** [Заполнить] · **Дата:** 2026-08-19 ·
> **Следующий пересмотр:** ежеквартально · **Статус:** 🟡 ядро реализовано в коде, петля обучения — roadmap

Ответ на второй раунд внешнего аудита: главный резерв до 10/10 — не новые темы, а
**замыкание цикла доказательство → решение → действие → результат → обучение**, и
способность системы САМА доказать качество своего аудита. Ниже — что уже реализовано в
коде, а что остаётся действием владельца.

## Целевая архитектура цикла

```
INPUT → RECONSTRUCTION → 19 LENSES → EVIDENCE ENGINE → CONTRADICTION → ROOT-CAUSE →
FINDING → IMPACT → RECOMMENDATION → ROADMAP → META-AUDITOR → AI-QUALITY (ARS) →
HUMAN REVIEW → QUALITY GATE (PASS/FAIL) → DELIVERY → OUTCOME TRACKING → LEARNING CORE →
REGRESSION → NEXT AUDIT (точнее)
```

## Реализовано в этом заходе (код — доказательство, не описание)

| Механизм | Модуль | Что делает |
|----------|--------|-----------|
| **Meta-Auditor** (P0 #2) | `worker/src/metaaudit.ts` | После линз проверяет САМ результат: 8 гейтов, дедуп-кандидаты, циклы зависимостей, severity↔evidence, «галлюцинация денег» |
| **Quality Gate** (P0 #3) | `metaaudit.ts` → `meta-audit.json` | decision `DELIVER` / `DELIVER_WITH_WARNINGS` / **`BLOCK`**; критический провал физически блокирует выдачу |
| **ARS (provisional)** (P0-2) | `worker/src/quality.ts` | Реальный Audit Reliability Score по измеримому весу; FP/FN/repeatability/human честно помечены pending |
| **Evidence Debt** (#20) | `quality.ts` | full / partial / hypothesis + debtRatio — сколько выводов недостаточно доказаны |
| **Coverage Map** (#19) | `quality.ts` | по доменам: evidence-покрытие, доля сильных доказательств, ср. уверенность |
| **Finding Lifecycle** (#4) | `registry.ts` | поля recommendation/owner/status/verification/targetDate/effort/businessImpact |
| **PII hard-mask** (P0-7) | `worker/src/pii.ts` | e-mail→токен, телефон→[phone] на входе; цены/даты/счётчики не трогает; применено до Claude |
| **Cost telemetry** (P0-8) | `anthropic.ts`+`runrecord.ts` | токены и оценка $ на прогон в Audit Run Record |

Гейты пишутся в `meta-audit.json`, качество — в `quality.json`, всё сводится в
`audit-run-record.json` (`metrics.qaGate`, `metrics.ars`, `metrics.evidenceDebt`, `cost`).

## Восемь гейтов Quality Gate

DATA (достижимость, страницы) → EVIDENCE (покрытие, P0 c доказательством) → COVERAGE
(модули, находки) → CONSISTENCY (уникальные ID, циклы, severity↔evidence) → ECONOMIC
(exposure ≤ потенциал, нет NaN) → METHODOLOGY (версия) → AI-QUALITY (ARS ≥ порог,
нет измеренных денег без данных) → PRESENTATION (обязательные отчёты, битые ссылки).
Далее — ручные HUMAN REVIEW → APPROVAL (Run Record `review`, раздел 31).

## Статус 12 P0 из разбора

| P0 | Пункт | Статус |
|----|-------|--------|
| 1 | Golden baseline FP/FN/precision/recall/F1 | 🟡 харнес есть (21); нужна human-разметка кейсов — OQ-11 |
| 2 | ARS реальные значения + target + release gate | 🟡 ARS считается; target/порог — задать (OQ) |
| 3 | Human QA loop | 🟡 поля review + гейт; production-процесс — владелец (31) |
| 4 | Pentest + SAST + DAST | ⛔ действие SEC — OQ-02 (можно strix-скиллом) |
| 5 | Backup real restore-test | ⛔ действие OPS — OQ-08 |
| 6 | GDPR DPA/RoPA/DSAR/retention/SCC | ⛔ действие LEG/DPO — OQ-06/07 |
| 7 | Raw PII блокировка | ✅ реализовано (`pii.ts`) |
| 8 | Run Record token/cost telemetry | ✅ реализовано |
| 9 | Cost per audit T1–T4 | 🟡 телеметрия есть; числа/разрез — на прогонах (32) |
| 10 | Product KPI baseline+targets | 🟡 источник (Run Record) есть; targets — владелец (33) |
| 11 | Audit Trail полноценный | 🟡 частично (30); triggeredBy/доступ — OQ-23 |
| 12 | Reviewer/Approver workflow | 🟡 поля есть; внедрить процесс (31) |

## Статус 20 доработок до 10/10

| # | Доработка | Статус |
|---|-----------|--------|
| 1 | Self-Healing Engine | 🟡 fail-safe деградация есть; Detect→Repair→Rerun→Compare — roadmap |
| 2 | Meta-Audit | ✅ реализовано (`metaaudit.ts`) |
| 3 | Quality Gate | ✅ реализовано (barrier BLOCK) |
| 4 | Finding Lifecycle | ✅ поля добавлены; enrichment-шаг — roadmap |
| 5 | Historical Audit Comparison | ⛔ roadmap (нужна история прогонов) |
| 6 | Benchmark Intelligence (distribution) | 🟡 Benchmark Register (28); распределения/перцентили — roadmap |
| 7 | Confidence Calibration curve | 🟡 confidence детерминирован; калибровка predicted↔actual — нужна human-разметка |
| 8 | Contradiction Engine | 🟡 есть `causal.ts`/portal `contradictions.ts`; кросс-источник reconciliation — roadmap |
| 9 | Causal Root-Cause Engine | 🟡 причинная карта есть (`causal.ts`); углубить цепочки — roadmap |
| 10 | Impact Attribution | 🟡 деньги атрибутируются по рычагу (`registry.ts`/`money.ts`); разрез по факторам — roadmap |
| 11 | Recommendation Evidence Chain | 🟡 Finding→Evidence есть; полная цепочка до KPI — Lifecycle enrichment |
| 12 | Actionability Score | ⛔ roadmap (по полям Lifecycle) |
| 13 | Recommendation Deduplication | 🟡 registry дедупит по key; кросс-модульные кандидаты — в Meta-Audit |
| 14 | Dependency Graph | 🟡 `dependsOn` + проверка циклов; визуализация/оптимизация — roadmap |
| 15 | Roadmap Optimizer | 🟡 беклог Impact×Effort; +Confidence×Dependency×Risk — roadmap |
| 16 | Scenario Simulator | 🟡 `money.ts`/`pricechannel.ts`; интерактивные сценарии — roadmap |
| 17 | Sensitivity Analysis | ⛔ roadmap (на money-модели) |
| 18 | Uncertainty Budget | 🟡 confidence/exposure есть; доверительный интервал результата — roadmap |
| 19 | Audit Coverage Map | ✅ реализовано (`quality.ts`) |
| 20 | Learning Core | ⛔ roadmap — см. ниже |

## Learning Core (главный недостающий уровень)

Каждый завершённый + провалидированный аудит должен порождать:
`Observation → Hypothesis → Finding → Human validation → Outcome → Pattern/Anti-pattern →
Calibration → Updated benchmark → Updated methodology → New regression case`.

Фундамент уже есть (Golden Dataset 21, Benchmark Register 28, AI-Eval 22, Run Record 18,
Change Control 29). Недостающее: конвейер, который из провалидированных находок и исходов
клиента автоматически пополняет golden-кейсы, калибрует confidence и обновляет бенчмарки.
Это и есть moat: не «умеем делать аудит», а **накопленная база проверенных наблюдений +
доказанное качество собственного аудита**. Владелец: PO+ENG. Roadmap: раздел 16.

## Открытые пункты

- [ ] Задать target ARS + порог блокировки релиза (release gate). Владелец: PO.
- [ ] Human-разметка golden → FP/FN/precision/recall + калибровка confidence. Владелец: PO.
- [ ] Lifecycle enrichment (owner/recommendation/KPI/verification в находки). Владелец: ENG.
- [ ] Learning Core конвейер (outcome → golden/benchmark/methodology). Владелец: PO+ENG.
- [ ] Self-Healing (Detect→Repair→Rerun→Compare) поверх fail-safe. Владелец: ENG.
