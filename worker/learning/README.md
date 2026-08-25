# Learning Core — данные

Операционные данные конвейера обучения (не в гите):
- `ledger.jsonl` — append-only леджер провалидированных находок и исходов.
- `learning-core.json` — снимок обучения (калибровка/паттерны/бенчмарки/предложения).

Код: `worker/src/learning/`. CLI: `worker/scripts/learn.ts` (ingest/build/promote-golden/seed).
Схема кейса golden: `worker/golden/schema.ts`. См. data room раздел 37.

Данные содержат бизнес-наблюдения — обращаться по политике ретеншна/приватности (разделы 04, 11, 26).
