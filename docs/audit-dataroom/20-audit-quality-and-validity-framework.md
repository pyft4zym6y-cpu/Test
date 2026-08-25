# 20 · Audit Quality & Validity Framework (Audit Reliability Score)

> **Версия:** 0.1 · **Владелец:** PO · **Проверяющий:** [Заполнить] · **Дата:** 2026-08-19 ·
> **Следующий пересмотр:** ежеквартально · **Статус:** 📝 framework определён, метрики инструментируются

Отвечает на замечание №20 (почему выводам можно доверять). Определяет, как измеряется
надёжность аудита, и сводит это в единый **Audit Reliability Score /100**.

## Восемь измерений качества

| Измерение | Определение | Как считаем сейчас | Источник метода |
|-----------|-------------|--------------------|-----------------|
| **Factual accuracy** | Доля утверждений, соответствующих действительности | Детерминированный слой = факты обхода; AI-нарратив сверяется с фактами | — |
| **Groundedness / Faithfulness** | Доля утверждений, подтверждённых собранным доказательством | `faithfulness = поддержанные_claim / все_claim` | Ragas/DeepEval/TruLens |
| **Evidence coverage** | Доля находок с evidence-ref | `findings.evidenceCoverage` в Run Record | внутр. |
| **Numerical accuracy** | Корректность чисел; отсутствие выдуманных цифр | гейт достижимости + пометка «оценка/факт» | внутр. |
| **Repeatability / Consistency** | Согласованность выводов при повторе/похожем входе | golden regression (раздел 21) | Statsig/Langfuse |
| **False positive rate** | Доля поднятых находок, не являющихся реальными | против golden `mustNotContain` + human review | классич. P/R/F1 |
| **False negative rate** | Доля реальных проблем, пропущенных | против golden `expectedFindings` | классич. P/R/F1 |
| **Human validation** | Доля находок, подтверждённых человеком-рецензентом | Run Record `review` (раздел 31) | four-eyes |

Определения метрик — из открытых eval-фреймворков (Ragas docs, DeepEval faithfulness/
hallucination, TruLens RAG Triad; confident-ai.com, 2026). Faithfulness: доля атомарных
утверждений ответа, подтверждаемых контекстом.

## Audit Reliability Score /100

Взвешенная свёртка нормированных измерений (веса — стартовые, калибруются на golden):

```
ARS = 100 × (
  0.22·groundedness + 0.18·evidenceCoverage + 0.15·(1−falsePositiveRate) +
  0.15·(1−falseNegativeRate) + 0.12·repeatability + 0.10·humanValidation +
  0.08·numericalAccuracy
)
```

- Все компоненты 0..1. `groundedness`/`FP`/`FN` измеряются на golden-кейсах и на
  выборке реальных прогонов с human review.
- Порог приёмки релиза: **ARS ≥ [Заполнить, целевой]**; падение ARS между версиями >
  [Заполнить] — блок релиза (Change Control, раздел 29).
- **Сейчас:** формула зафиксирована, компоненты `evidenceCoverage` и `repeatability`
  уже инструментированы (Run Record + golden); `groundedness`/`FP`/`FN`/`humanValidation`
  требуют разметки golden-кейсов и цикла ревью — открытый пункт.

## Инструментарий (что подключаем)

Для groundedness/FP/FN/consistency — один из открытых фреймворков в CI-гейте
(**DeepEval** / **Ragas** / **promptfoo**) + платформа наблюдения (**Langsmith**/
**Braintrust**). Паттерн зрелых команд: «два инструмента» — лёгкий фреймворк для CI-гейта
+ платформа для мониторинга и ручной разметки. Источники: docs.ragas.io, deepeval.com,
trulens.org, промфу — promptfoo.dev (2026).

## Связь со стандартами

- NIST AI RMF: измерения → функция **MEASURE**; характеристика «valid & reliable».
- ISO/IEC 42001: Clause 9 (performance evaluation).
- EU AI Act (если high-risk): accuracy/robustness evidence (Art. 15).
Источники: nist.gov/itl/ai-risk-management-framework, isms.online/iso-42001.

## Открытые пункты

- [ ] Разметить golden-кейсы для FP/FN и groundedness. Владелец: PO.
- [ ] Подключить eval-фреймворк в CI-гейт. Владелец: ENG.
- [ ] Задать целевой ARS и порог блокировки релиза. Владелец: PO.
