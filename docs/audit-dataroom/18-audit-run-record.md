# 18 · Audit Run Record (воспроизводимость прогона)

> **Версия:** 1.0 · **Владелец:** ENG · **Проверяющий:** [Заполнить] · **Дата:** 2026-08-19 ·
> **Следующий пересмотр:** при изменении схемы записи · **Статус:** ✅ реализовано в коде

Отвечает на замечание аудита №2 и №4 (воспроизводимость). Реализовано, не декларировано:
`worker/src/runrecord.ts` (+ `version.ts`), пишется в `results/<id>/audit-run-record.json`
в конце каждого прогона (`pipeline.ts`). Схема валидируется zod.

## Что фиксирует каждый прогон

| Поле | Назначение |
|------|-----------|
| `auditId`, `client`, `tier`, `takenAt`, `generatedAt`, `durationMs` | Идентификация и время |
| `methodologyVersion`, `engineVersion`, `model`, `schemaVersion` | **Версии** — к какому состоянию системы привязан результат |
| `config` | agentic / prelaunch / premium / webSearch / hasApiKey |
| `input` | site, competitors, pagesCrawled, competitorPagesCrawled, backupScreenshots, answersProvided, **dataSnapshotSha256** |
| `modules` | **executed / skipped / failed** (executed = произведён артефакт) |
| `findings` | total, p0, p1, p2, **evidenceCoverage**, avgConfidence |
| `metrics` | compliance, health, benchmarkIndex, potentialYear… |
| `outputs` | fileCount, reportFiles |
| `review` | reviewer, approver, статус (produced/reviewed/approved/rejected) — separation of duties |

## Важный дисклеймер о воспроизводимости (честно)

Полная **бит-идентичность выводов LLM не гарантируется даже при temperature 0** — это
подтверждают документация провайдеров (OpenAI: «mostly deterministic»; Anthropic: «will
not be fully deterministic») и исследования (floating-point non-associativity, MoE-routing,
batch-эффекты). Источники: dylancastillo.co/posts/seed-temperature-llms (2024),
arXiv:2506.09501 (2025).

**Поэтому воспроизводимость определяется как: «восстановить Run Record + достичь
статистической эквивалентности выводов», а не «получить тот же байт».** Детерминированный
слой (обход, скоринг, реестр) воспроизводим точно; AI-нарратив — статистически.

## Как использовать (аудитору)

1. Взять `audit-run-record.json` любого прогона.
2. По `methodologyVersion` + `engineVersion` + `model` + `dataSnapshotSha256` восстановить
   условия. Тот же вход + версии → сверяемый результат детерминированного слоя.
3. `modules.failed` показывает, что не отработало (честно, не скрыто).
4. `findings.evidenceCoverage` — доля находок с доказательством (см. Evidence Matrix, раздел 19).

## Связь с другими разделами

- Golden regression (21) сверяет выход прогона с эталоном по метрикам из Run Record.
- Change Control (29) требует прогон golden при смене `methodologyVersion`.
- Separation of Duties (31) заполняет `review`.

## Открытые пункты

- [ ] Подключить фиксацию `promptVersion`/config-hash по каждому AI-вызову (сейчас — версия
      методологии на прогон). Владелец: ENG.
- [ ] Хранилище Run Records с ретеншном (сейчас — на диске хоста рядом с результатами).
