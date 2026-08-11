---
name: retention-os
description: Удержание и повторные покупки: сегментация RFM, триггерные коммуникации, программа лояльности, LTV. Используй при вопросах об удержании клиентов, email/messenger-маркетинге, оттоке.
---

# retention-os · eCom OS / weexp

**Уровень:** УР5 · **Полнота (на момент сборки плагина):** 28/100

## 01 · Purpose
Триггеры, лояльность, LTV.

**Чего скил не делает:** решения вне своей зоны ответственности передаёт соседнему скилу или synthesis-os. Не ведёт собственных нумераций реестров — читает и пополняет реестры ядра commerce-os.

## 02 · Objects
Владеет: —
Владение объектом — ровно одно на объект. Второй владелец объекта = дефект архитектуры.

## 03 · Inputs
- Конфигурация от identity-os (тип × отрасль × масштаб)
- Данные от data-os (жёсткая связь, если применимо)
- data-os, content-os

## 04 · Methods
_Протоколы порядка шагов заполняются по мере прогона на проектах (см. Journal / Реестр гипотез). Каждый метод должен содержать: с чем сверяем, где граница передачи человеку._
Пара As-Is/To-Be обязательна: способ снятия текущего состояния (As-Is) описывается здесь же.

**Второй источник (gtm-agents/e-commerce/retention-ltv-playbook):** playbook расчёта LTV по когортам покупки (не по регистрации), с разбивкой по первому купленному товару/категории — какая категория входа даёт наибольший LTV, используется для приоритизации в merchandising-os и paid-os (куда лить трафик).

## 05 · Evidence
Вес доказательства — по общей иерархии (см. `knowledge/base/04-crosscheck/evidence-hierarchy.md`).

## 06 · Standards
Эталоны в разрезе тип × отрасль — см. `knowledge/registries/standards-catalog.md`. Эталон без источника не эталон, а мнение.

## 07 · Findings
Пишутся по единому контракту находки (см. `knowledge/registries/findings-contract.md`). Единица обмена с synthesis-os.

## 08 · Outputs
Артефакты — коды из `knowledge/registries/artifacts-catalog.md`.

## 09 · Quality Gates
Определяется по мере заполнения Methods/Standards. Пример условия: AQC выше порога, все блоки эталона разобраны.

## 10 · Metrics
Срок проявления эффекта — обязательное поле, заполняется по мере прогонов.

## 11 · Maturity
5 уровней: нет процесса · чек-лист · стандарт · измеряется · данные.

## 12 · Dependencies
- **Входящие:** data-os, content-os
- **Исходящие:** finance-os

## 13 · Аудит-модуль
Модуль аудита живёт здесь (не в commerce-os): чек-лист, слой доступа (L0–L3), метод, выход в отчёт.

## 14 · AI Layer
Профиль агента заполняется последним — от протоколов, а не наоборот.

---

## Внешние источники · 15 шт · уровень E2, карантин не пройден

Лежат в `external/retention-os/`. У каждого рядом `SOURCE.md` с репозиторием, лицензией и статусом. **Ни один не является эталоном** до прохождения карантина (`knowledge/base/02-quarantine/`). Используются как источник гипотез и как ориентир, а не как основание вывода.

| подпапка | КБ |
|---|---|
| `external/retention-os/ecommerce-email-marketing-builder` | 24 |
| `external/retention-os/analytics-interpretation` | 19 |
| `external/retention-os/churn-prevention` | 18 |
| `external/retention-os/developer-churn` | 16 |
| `external/retention-os/sms` | 16 |
| `external/retention-os/reactivation-specialist` | 16 |
| `external/retention-os/email-sequence-designer` | 15 |
| `external/retention-os/subscription-lifecycle` | 14 |
| `external/retention-os/improve-retention` | 14 |
| `external/retention-os/cohort-analysis` | 14 |
| `external/retention-os/customer-success-and-retention` | 11 |
| `external/retention-os/surge-retention` | 9 |
| `external/retention-os/kpi-dashboard-design` | 5 |
| `external/retention-os/saas-metrics-coach` | 5 |
| `external/retention-os/shopify-email-flows` | 1 |

## Что уже есть (по документу-источнику)
Сегментация и RFM, часть триггеров, программа лояльности

## Чего не хватает (по документу-источнику)
Матрица триггеров целиком, мессенджеры, когортный анализ, реактивация, персонализация

## Статус готовности
Скил считается черновиком, пока не пройдены все 5 условий: заполненность, исполнимость, связность, совместимость, проверенность (прогон на реальном проекте). Черновик не подключается к synthesis-os.
