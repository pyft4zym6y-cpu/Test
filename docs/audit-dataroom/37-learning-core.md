# 37 · Learning Core — самообучающийся конвейер (moat)

> **Версия:** 1.0 · **Владелец:** PO / ENG · **Проверяющий:** [Заполнить] · **Дата:** 2026-08-19 ·
> **Следующий пересмотр:** ежеквартально · **Статус:** ✅ конвейер реализован в коде; наполнение данными — операционный процесс

Главный недостающий уровень из внешнего аудита (пункт «Learning Core»): система должна
учиться не через ручную правку промптов, а через **накопление проверенного опыта**. Это и
есть настоящий moat: не «умеем делать аудит», а *база тысяч провалидированных наблюдений +
доказанное качество собственного аудита*.

## Конвейер (реализован)

```
Провалидированный аудит (human review)
  → LEDGER (append-only: находка → вердикт → исход)        worker/src/learning/ledger.ts
  → LEARNING SNAPSHOT                                        worker/src/learning/core.ts
      ├── Confidence Calibration (predicted ↔ actual, ECE)
      ├── Patterns / Anti-patterns (частые верные / ложные)
      ├── Empirical Benchmark Distributions (percentiles)
      └── Methodology Suggestions (Change Requests)
  → GOLDEN CANDIDATE (авто-кейс) → regression                scripts/learn.ts promote-golden
  → CHANGE CONTROL (раздел 29) → следующий аудит точнее
```

Код: `worker/src/learning/{schema,ledger,core}.ts`. CLI: `worker/scripts/learn.ts`.
Всё zod-валидировано; каждый вывод сопровождается числом наблюдений (n); порог
достаточности калибровки — 30 записей (ниже — справочно, не применяется).

## Что делает каждый слой

**1 · Confidence Calibration** (закрывает замечание #7). Строит кривую «предсказанная
уверенность ↔ фактическая подтверждаемость» по 10 корзинам + **ECE** (Expected Calibration
Error). `calibratedConfidence(raw)` маппит модельную уверенность в эмпирическую точность.
Пример (демо-леджер, 72 записи): корзина 50–60% предсказано → 80% реально
(недоуверенность), 90–100% → 86% (лёгкая переуверенность), ECE=0.136. Теперь «confidence
87%» можно доказать, а не декларировать.

**2 · Patterns / Anti-patterns** (#13, #12). Частые подтверждаемые находки (acceptRate ≥
0.6) → паттерны (кандидаты в first-class проверки/бенчмарки). Частые ложные (acceptRate ≤
0.4) → антипаттерны (кандидаты на подавление/ужесточение). Пример: `perf-os` с acceptRate
0.33 при support 12 → антипаттерн → предложение ужесточить проверку.

**3 · Empirical Benchmark Distributions** (#6 Benchmark Intelligence). Из наблюдений обхода
по всем аудитам считает распределения (min/p25/median/p75/max для чисел; shareTrue для
булевых). `clientPercentile(value, dist)` даёт перцентиль клиента в распределении — не
«CVR 2.5% = хорошо», а «клиент в 18-м перцентиле нашего корпуса». Это эмпирический
бенчмарк из собственных данных (moat), дополняющий внешний Benchmark Register (28).

**4 · Methodology Suggestions**. Из антипаттернов/калибровки/паттернов формирует
Change Requests (suppress-antipattern / recalibrate / tighten-check / promote-pattern) —
**не авто-применяются**, идут через Methodology Governance & Change Control (29) с
golden/eval-гейтом. Так обучение управляемо и версионируемо.

**5 · Golden Candidate → Regression** (#20, #5). Из провалидированного прогона авто-строит
golden-кейс (accepted-темы → expectedFindings; rejected → mustNotContain; наблюдения →
expectedObservations; reviewer в baseline), валидирует против `golden/schema.ts` и кладёт
в набор. Знание превращается в регрессионный тест — цикл замыкается.

## Как запускать

```bash
# 1) внести провалидированный прогон в леджер (verdicts.json — вердикты ревьюера)
npx tsx scripts/learn.ts ingest --run results/<id> --verdicts verdicts.json --reviewer Имя
# 2) построить снимок обучения
npx tsx scripts/learn.ts build            # → learning/learning-core.json
# 3) промоутнуть golden-кейс из провалидированного прогона
npx tsx scripts/learn.ts promote-golden --audit <auditId> --reviewer Имя
```

`verdicts.json`: `{ reviewer, reviewedAt?, observations?:{...}, findings:[{id,domain,key?,
theme,confidence,priority,verdict:accepted|rejected|corrected,correctedPriority?,note?}] }`.

## Архитектурное решение: обучение МЕЖДУ прогонами, не во время

Learning Core — офлайн-конвейер: во время аудита поведение детерминировано и
воспроизводимо (Run Record, раздел 18). Обучение происходит между прогонами: снимок →
Change Control → новая версия методологии. Это осознанно: сохраняет воспроизводимость и
делает каждое улучшение управляемым, а не «плывущим» от прогона к прогону.

## Данные и приватность

Леджер содержит бизнес-наблюдения (не PII — e-mail/телефоны маскируются на входе, раздел
36/`pii.ts`). Файлы `learning/*.jsonl`, `learning-core.json` — операционные, вне гита;
обращение по политике ретеншна (04, 11, 26). Наблюдения для бенчмарков — обезличенные
агрегаты.

## Открытые пункты

- [ ] Внедрить human-review-петлю, наполняющую леджер (пересекается с 31, OQ-24). Владелец: PO/OPS.
- [ ] Набрать ≥30 провалидированных находок → надёжная калибровка на реальных данных. Владелец: PO.
- [ ] Подключить `clientPercentile` в отчёты (Benchmark Intelligence в deliverable). Владелец: ENG.
- [ ] Регулярный прогон `learn build` + разбор suggestions через Change Control. Владелец: PO/ENG.
- [ ] Outcome-трекинг (fixed/realizedImpact) — вносить исходы клиента в леджер. Владелец: OPS.
