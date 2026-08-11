---
name: legal-os
description: Юридические требования: оферта, персональные данные, маркировка, НДС/OSS для ЕС, GDPR, доступность (WCAG/EAA). Используй при вопросах о правовой готовности сайта, особенно перед выходом на рынок ЕС.
---

# legal-os · eCom OS / weexp

**Уровень:** сквозной · **Полнота (на момент сборки плагина):** 25/100 · внедрён внешний материал (раунд 4): _finance-tax-nexus-vat-diagnostic + claude-for-legal/privacy-legal + GRC-skills/gdpr-compliance_

## 01 · Purpose
Оферта, данные, маркировка, НДС.

**Чего скил не делает:** решения вне своей зоны ответственности передаёт соседнему скилу или synthesis-os. Не ведёт собственных нумераций реестров — читает и пополняет реестры ядра commerce-os.

## 02 · Objects
Владеет: —
Владение объектом — ровно одно на объект. Второй владелец объекта = дефект архитектуры.

## 03 · Inputs
- Конфигурация от identity-os (тип × отрасль × масштаб)
- Данные от data-os (жёсткая связь, если применимо)
- identity-os (юрисдикция)

## 04 · Methods
**Протокол VAT/налогового нексуса (finance-tax-nexus-vat-diagnostic, noique/cross-border-ecommerce-skills) — первый содержательный метод для скила, критичен для EU-экспансии RAY.UA:**
Пересечение (каналы продаж) × (физическое расположение склада/инвентаря) × (выручка за 12 мес. по стране назначения) × (категория товара/HS-код) даёт карту обязательств по регистрации на каждую юрисдикцию: уже обязан регистрироваться / приближается к порогу / ещё нет. Ключевые пороги для EU: **OSS** (One-Stop-Shop) — €10 000 общий порог дистанционных продаж по ЕС, **IOSS** — для товаров ≤€150 из третьих стран (актуально, пока Украина вне ЕС), UK LVCR £135. Плюс отдельно — EPR-потоки (упаковка/маркировка по стране: Германия LUCID/VerpackG, Франция UIN/ADEME, готовящийся PPWR).

**Протокол приватности (privacy-legal, anthropics/claude-for-legal):** DPA (Data Processing Agreement) с поставщиками данных, DSAR (запрос субъекта данных) обработка, PIA/DPIA для новых процессов сбора данных, мониторинг изменений политики. Для RAY.UA — обязательно при работе с EU-покупателями независимо от места регистрации бизнеса (экстерриториальность GDPR).

**Протокол генерации политик (Sushegaad GRC / zubair-trabzada ai-legal-claude):** Privacy Policy генерируется сканированием реальных практик сбора данных сайта (не шаблон "на всякий случай"), Terms of Service, Cookie Policy — все три с привязкой к юрисдикции покупателя, не только продавца.

**Доступность как юридическое требование, не только UX (WCAG-skill, Sushegaad GRC, раунд 4) — новое, не было в документе вообще:** European Accessibility Act (EAA) с июня 2025 обязателен для e-commerce, продающего в EU — сайт должен соответствовать WCAG 2.1 AA. Это не «хорошо бы», а юридический риск для RAY.UA при выходе в EU: проверка контраста/клавиатурной навигации/ARIA становится частью гейта готовности к запуску, не опциональным CRO-улучшением. Протокол выполнения — тот же аудит, что и в ux-os, но статус находки меняется с «рекомендация» на «юридическое требование».

## 05 · Evidence
Вес доказательства — по общей иерархии (см. `knowledge/base/04-crosscheck/evidence-hierarchy.md`).

## 06 · Standards
Эталоны в разрезе тип × отрасль — см. `knowledge/registries/standards-catalog.md`. Эталон без источника не эталон, а мнение.

**Источники (раунд 4):** finance-tax-nexus-vat-diagnostic (noique/cross-border-ecommerce-skills) — уровень доказательства 3 (внешняя методика с раскрытыми порогами/законодательными ссылками); anthropics/claude-for-legal privacy-legal — официальный плагин Anthropic, уровень доказательства 3; Sushegaad GRC gdpr-compliance — покрывает статьи GDPR с цитированием, уровень 3. Все требуют юридической валидации перед использованием как финального документа — это ускоряет первый черновик, не заменяет юриста (см. правило исходного документа: «не рационализировать соответствие публичной доступностью»).

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
- **Входящие:** identity-os (юрисдикция)
- **Исходящие:** build-os, marketplace-os

## 13 · Аудит-модуль
Модуль аудита живёт здесь (не в commerce-os): чек-лист, слой доступа (L0–L3), метод, выход в отчёт.

## 14 · AI Layer
Профиль агента заполняется последним — от протоколов, а не наоборот.

---

## Внешние источники · 18 шт · уровень E2, карантин не пройден

Лежат в `external/legal-os/`. У каждого рядом `SOURCE.md` с репозиторием, лицензией и статусом. **Ни один не является эталоном** до прохождения карантина (`knowledge/base/02-quarantine/`). Используются как источник гипотез и как ориентир, а не как основание вывода.

| подпапка | КБ |
|---|---|
| `external/legal-os/cross-border-ecommerce` | 35 |
| `external/legal-os/site-launch-checklist` | 30 |
| `external/legal-os/ccpa-cpra-privacy-expert` | 22 |
| `external/legal-os/hubspot-agency-multi-portal` | 19 |
| `external/legal-os/legal-page-generator` | 16 |
| `external/legal-os/privacy-compliance` | 15 |
| `external/legal-os/find-law-firm` | 14 |
| `external/legal-os/data-breach-blast-radius` | 13 |
| `external/legal-os/deep-research` | 12 |
| `external/legal-os/compliance-audit` | 12 |
| `external/legal-os/privacy-policy` | 10 |
| `external/legal-os/privacy-page-generator` | 10 |
| `external/legal-os/privacy-generator` | 9 |
| `external/legal-os/general-counsel-advisor` | 8 |
| `external/legal-os/terms-generator` | 8 |
| `external/legal-os/clay-data-handling` | 8 |
| `external/legal-os/compliance-checklist` | 5 |
| `external/legal-os/privacy-policy-drafter` | 3 |

## Что уже есть (по документу-источнику)
Ничего

## Чего не хватает (по документу-источнику)
Всё: оферта и политики, персональные данные, маркировка, требования площадок, НДС

## Статус готовности
Скил считается черновиком, пока не пройдены все 5 условий: заполненность, исполнимость, связность, совместимость, проверенность (прогон на реальном проекте). Черновик не подключается к synthesis-os.
