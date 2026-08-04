# Commerce OS · Онтология (Knowledge Graph)

Единый словарь сущностей и связей. Всё, что метод делает, выражается в этих
терминах; любой будущий AI-слой обязан отвечать в них же — с трассой по графу.

## Сущности

| Сущность | Что это | Где живёт |
| --- | --- | --- |
| Company | Клиент: паспорт, каналы, география | `PASSPORT` (портал), лист 03 ЕКП |
| Person / ЛПР | Участник решения: роль, влияние, личный KPI | шаг 07, `DECISION` |
| Domain | 18 доменов зрелости с весами (Σ = 100) | `maturity_health_score.md` |
| Process | Процесс внутри домена с уровнем L1–L5 | лестницы `data/engine.ts` |
| Question | Вопрос фреймворка: вес, тип, роль, риск | `questions.json` (643) |
| Answer | Ответ с автором и уровнем достоверности E0–E4 | `answers` |
| Metric | Измеримая величина с зонами 🔴🟡🟢 | `gold_standards.md` (54) |
| Lever | 8 рычагов модели выручки | baseline (AD-13) |
| Gap | Разрыв: критический (CG, штраф) или зонный (метрика в 🔴) | `method.ts`, AD-02 |
| CausalChain | Симптом → корни → влияние → рычаг | `data/engine.ts` |
| Decision | Решение движка: Impact/Difficulty/срок/WHY | `lib/engine.ts` |
| Playbook | Исполняемая методика PB-01…56 с пререквизитами | `playbooks/` |
| Deliverable | Результат: AD (аудит), D (программа), KP/PR/FL/XX | реестры |
| Hypothesis | Проверяемое утверждение с уверенностью и дедлайном | `report_meta.hypotheses` |
| Money | Потенциал, цена бездействия, прогноз | computeGap8 |

## Связи (рёбра графа)

```
Company     —has→        Domain (×18, с весом)
Domain      —contains→   Process        Process —assessed_by→ Question
Question    —answered_as→ Answer        Answer  —has_evidence→ E0…E4
Answer      —feeds→      Metric         Metric  —compared_to→  Gold Standard (зона)
Metric      —moves→      Lever          Lever   —multiplies→   Revenue
Зона 🔴     —creates→    Gap            Gap     —costs→        Money (₴/год)
Gap         —explained_by→ CausalChain  CausalChain —points_to→ Root Cause
Root Cause  —addressed_by→ Playbook     Playbook —requires→    Playbook (пререквизит)
Playbook    —needs→      Access (AC/EX) Playbook —produces→    Deliverable
Decision    —bundles→    Playbooks + WHY-трасса (Questions, Metrics, Rules)
Decision    —spawns→     Hypothesis     Hypothesis —validated_by→ XX-01 (сверка)
XX-01       —updates→    Rules / Gold Standards / Cost Base   (Learning Loop)
Person(ЛПР) —cares_about→ KPI → Metric  (персонализация КП)
```

## Сквозной пример по графу

```
Question CR-001 «Какая доля выручки из email?»
  → Answer «4%» (E3: данные CRM)
  → Metric «Email share» в 🔴 (норма ≥ 15%)
  → Gap CG-03 «Нет retention-контура» → costs ≈ 1.9 млн ₴/год
  → CausalChain CC-1 «Мало повторных» → Root Cause «Нет CRM-контура»
  → Decision DE-01 «Построить CRM-контур» (Impact 9 / Diff 3 / 30 дней)
  → Playbook PB-08 (пререквизит для PB-09 «Лояльность»)
  → Deliverable D-25 «Архитектура retention-флоу»
  → Hypothesis H-1 «Контур поднимет повторные с 4% до 8% за 60 дней»
  → XX-01: сверка на 3-м месяце → подтверждена → Impact правила остаётся 9
```

Любой вывод системы обязан разворачиваться в такой путь. Если путь
оборван (нет ответа, нет метрики, нет правила) — это не вывод, а гипотеза
с уверенностью ≤ 50, и подаётся соответственно.

## Статус реализации

Работают в портале: Company, ЛПР, Question/Answer + Evidence, Domain +
уровни, Lever/Money, Gap + цена, CausalChain, Decision + WHY, пререквизиты
плейбуков, Hypothesis. Формальное графовое хранилище (Neo4j и т.п.) не
используется — связи зашиты в типизированные структуры кода; вынос в
явный граф оправдан на этапе AI-консультанта.
