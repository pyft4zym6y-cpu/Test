---
name: marketplace-os
description: Маркетплейсы: выбор площадки, экономика канала, требования к карточкам, рейтинг, реклама на площадке, международная экспансия. Используй при выходе на Rozetka, Prom, Amazon, Allegro и другие площадки.
---

# marketplace-os · eCom OS / weexp

**Уровень:** УР5 · **Полнота (на момент сборки плагина):** 60/100 · внедрён внешний материал: _Amazon-Skills (nexscope-ai, 18 скиллов)_

## 01 · Purpose
Площадки, экономика канала, экспансия.

**Чего скил не делает:** решения вне своей зоны ответственности передаёт соседнему скилу или synthesis-os. Не ведёт собственных нумераций реестров — читает и пополняет реестры ядра commerce-os.

## 02 · Objects
Владеет: —
Владение объектом — ровно одно на объект. Второй владелец объекта = дефект архитектуры.

## 03 · Inputs
- Конфигурация от identity-os (тип × отрасль × масштаб)
- Данные от data-os (жёсткая связь, если применимо)
- pricing-os

## 04 · Methods
**Протокол выхода/работы на площадке (профиль Amazon — эталонный, переносится на структуру других площадок по аналогии):**
1. **Listing optimization** — заголовок/буллиты/бэкенд-ключевые слова по алгоритму площадки.
2. **Rank tracker + Keyword tracker** — регулярный снимок позиций по кластеру запросов, а не разовый.
3. **Price tracker + Repricing strategy** — автоматизация ценового мониторинга, правила репрайсинга с нижней границей маржи из finance-os.
4. **Advertising strategy** — структура кампаний площадки (Sponsored Products/Brands аналог).
5. **Competitor monitoring** — канальный метод из identity-os, но в разрезе площадки: кто торгуется за наши карточки.
6. **Tariff/fee calculator** — расчёт полной себестоимости канала (комиссия площадки + логистика + реклама) для finance-os.
7. **Review strategy** — работа с рейтингом и отзывами как фактором ранжирования.

Профиль каждой новой площадки (Prom, Rozetka, Allo, Kaufland, Otto и т.д.) собирается по этой же структуре — это и есть «профиль на площадку» из мини-ТЗ документа.

## 05 · Evidence
Вес доказательства — по общей иерархии (см. `knowledge/base/04-crosscheck/evidence-hierarchy.md`).

## 06 · Standards
Комиссии и требования площадок — внешние источники (см. `knowledge/registries/13-platforms-catalog.md`), обновляются не реже раза в квартал. Источник метода: Amazon-Skills, уровень доказательства 4 — требует адаптации под конкретную площадку и рынок (EU ≠ US ≠ UA).

## 07 · Findings
Пишутся по единому контракту находки (см. `knowledge/registries/findings-contract.md`). Единица обмена с synthesis-os.

## 08 · Outputs
`MKT-01 Platform Profile` (на каждую площадку), `MKT-02 Channel Economics` (уходит в finance-os), `MKT-03 Cannibalization Check` (собственный канал vs площадка).

## 09 · Quality Gates
Определяется по мере заполнения Methods/Standards. Пример условия: AQC выше порога, все блоки эталона разобраны.

## 10 · Metrics
Срок проявления эффекта — обязательное поле, заполняется по мере прогонов.

## 11 · Maturity
5 уровней: нет процесса · чек-лист · стандарт · измеряется · данные.

## 12 · Dependencies
- **Входящие:** pricing-os
- **Исходящие:** finance-os

## 13 · Аудит-модуль
Модуль аудита живёт здесь (не в commerce-os): чек-лист, слой доступа (L0–L3), метод, выход в отчёт.

## 14 · AI Layer
Профиль агента заполняется последним — от протоколов, а не наоборот.

---

## Внешние источники · 53 шт · уровень E2, карантин не пройден

Лежат в `external/marketplace-os/`. У каждого рядом `SOURCE.md` с репозиторием, лицензией и статусом. **Ни один не является эталоном** до прохождения карантина (`knowledge/base/02-quarantine/`). Используются как источник гипотез и как ориентир, а не как основание вывода.

| подпапка | КБ |
|---|---|
| `external/marketplace-os/amazon-display-ads` | 22 |
| `external/marketplace-os/amazon-listing-images` | 21 |
| `external/marketplace-os/ecommerce-growth-strategy` | 21 |
| `external/marketplace-os/amazon-a-plus-content` | 21 |
| `external/marketplace-os/amazon-price-tracker` | 21 |
| `external/marketplace-os/amazon-advertising-strategy` | 20 |
| `external/marketplace-os/amazon-rank-tracker` | 20 |
| `external/marketplace-os/amazon-keyword-tracker` | 19 |
| `external/marketplace-os/amazon-negative-keywords` | 18 |
| `external/marketplace-os/ecommerce-marketing-strategy-builder` | 18 |
| `external/marketplace-os/amazon-search-optimization` | 17 |
| `external/marketplace-os/amazon-listing-optimization` | 17 |
| `external/marketplace-os/amazon-shipping-calculator` | 16 |
| `external/marketplace-os/web-search` | 16 |
| `external/marketplace-os/amazon-buy-box` | 16 |
| `external/marketplace-os/amazon-repricing-strategy` | 15 |
| `external/marketplace-os/amazon-seller-analytics` | 13 |
| `external/marketplace-os/amazon-profit-analyzer` | 13 |
| `external/marketplace-os/product-description-generator` | 13 |
| `external/marketplace-os/amazon-niche-finder` | 12 |
| `external/marketplace-os/amazon-product-research` | 12 |
| `external/marketplace-os/amazon-product-photography` | 12 |
| `external/marketplace-os/amazon-fba-prep` | 11 |
| `external/marketplace-os/amazon-global-selling` | 11 |
| `external/marketplace-os/amazon-sales-estimator` | 10 |
| `external/marketplace-os/amazon-brand-analytics` | 9 |
| `external/marketplace-os/amazon-trending-products` | 8 |
| `external/marketplace-os/amazon-keyword-research` | 7 |
| `external/marketplace-os/amazon-competitor-monitoring` | 6 |
| `external/marketplace-os/amazon-review-analyzer` | 5 |
| `external/marketplace-os/amazon-competitor-analysis` | 4 |
| `external/marketplace-os/tariff-calculator-amazon` | 4 |
| `external/marketplace-os/marketplace-listing-optimizer` | 4 |
| `external/marketplace-os/supply-chain-optimization-walmart` | 3 |
| `external/marketplace-os/amazon-brand-tailored-promotions` | 1 |
| `external/marketplace-os/amazon-inventory-management` | 1 |
| `external/marketplace-os/amazon-international-listings` | 1 |
| `external/marketplace-os/amazon-product-bundling` | 1 |
| `external/marketplace-os/amazon-product-compliance` | 1 |
| `external/marketplace-os/amazon-storefront-design` | 1 |
| `external/marketplace-os/amazon-enhanced-brand-content` | 1 |
| `external/marketplace-os/amazon-brand-registry` | 1 |
| `external/marketplace-os/amazon-suspension-appeal` | 1 |
| `external/marketplace-os/amazon-review-strategy` | 1 |
| `external/marketplace-os/amazon-category-ungating` | 1 |
| `external/marketplace-os/amazon-dayparting-strategy` | 1 |
| `external/marketplace-os/amazon-seasonal-planning` | 1 |
| `external/marketplace-os/amazon-subscribe-save` | 1 |
| `external/marketplace-os/amazon-return-reduction` | 1 |
| `external/marketplace-os/amazon-coupon-strategy` | 1 |
| `external/marketplace-os/amazon-variation-strategy` | 1 |
| `external/marketplace-os/amazon-vine-program` | 1 |
| `external/marketplace-os/amazon-fba-calculator` | 1 |

## Что уже есть (по документу-источнику)
Выбор площадок, экономика канала, требования к карточкам, рейтинг и отзывы, экспорт

## Чего не хватает (по документу-источнику)
Специфика конкретных площадок, локализация, каннибализация собственного канала

## Обновление после внедрения внешнего материала
Что закрыто — см. блоки Methods/Standards/Outputs выше. **Всё ещё не хватает (внешний материал не закрыл):** Локализация и налоговые режимы по странам — профиль Amazon даёт структуру, но не данные по конкретным рынкам ЕС.

Статус по 5 условиям готовности не меняется от добавления внешнего материала: заполненность выросла, но исполнимость/связность/совместимость/проверенность требуют прогона на реальном проекте.

## Статус готовности
Скил считается черновиком, пока не пройдены все 5 условий: заполненность, исполнимость, связность, совместимость, проверенность (прогон на реальном проекте). Черновик не подключается к synthesis-os.
