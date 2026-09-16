# Дерево сайта — финал (утверждено)

Проблемно-ориентированная навигация: симптом → рішення → доказ (кейс) →
інструмент (калькулятор) → заявка (бриф). Блог («Ресурси») — в основной
навигации, не в подвале.

```
Головна (/)
│
├── Симптоми (/symptoms)                          [контейнер]
│   ├── Виручка стоїть              /symptoms/revenue-stagnation
│   ├── Реклама дорожчає            /symptoms/high-cac
│   ├── Клієнти не повертаються     /symptoms/low-repeat
│   ├── Процеси на одній людині     /symptoms/operational-chaos
│   └── Незрозуміло, що відбувається /symptoms/no-visibility
│
├── Як ми працюємо (/solutions)                    [контейнер]
│   ├── Аудит          /solutions/audit
│   ├── Консалтинг     /solutions/consulting
│   └── Управління     /solutions/management
│
├── Результати (/results)                         [контейнер]
│   └── [Кейс 1..N]    /results/{slug}
│
├── Калькулятор (/calculator)
│
├── Про нас (/about)
│
├── Ресурси (/resources)                           [контейнер]
│   └── [Стаття 1..N]  /resources/{slug}
│
├── Контакти (/contact)
│
└── CTA (не в общем меню, отдельная кнопка): Заповнити бриф (/brief)

Футер:
├── /privacy
└── /terms
```

## Карта URL и шаблонов

| Страница | URL | Template | Nav | Приоритет |
|---|---|---|---|---|
| Головна | `/` | `Home` | Header (лого) | High |
| Симптоми (хаб) | `/symptoms` | `SymptomsHub` | Header | High |
| Симптом | `/symptoms/{slug}` | `SymptomPage` | внутр. ссылки | High |
| Як ми працюємо (хаб) | `/solutions` | `SolutionsHub` | Header | High |
| Формат роботи | `/solutions/{slug}` | `SolutionPage` | Header dropdown | High |
| Результати (хаб) | `/results` | `ResultsHub` | Header | Medium |
| Кейс | `/results/{slug}` | `CaseDetail` | внутр. ссылки | Medium |
| Калькулятор | `/calculator` | `Calculator` | Header | High |
| Про нас | `/about` | `StaticPage` | Header | Medium |
| Ресурси (хаб) | `/resources` | `ResourcesHub` | Header | Medium |
| Стаття | `/resources/{slug}` | `BlogPost` | внутр. ссылки | Low |
| Контакти | `/contact` | `StaticPage` | Header | Medium |
| Заповнити бриф | `/brief` | Weblink → окреме додаток/поддомен | CTA-кнопка | High |
| Privacy / Terms | `/privacy`, `/terms` | `StaticPage` | Footer | Low |

## Навигация

**Header** (7 пунктов + отдельная CTA-кнопка, в пределах правила 4–7):
Симптоми → Як ми працюємо → Результати → Калькулятор → Про нас → Ресурси →
Контакти, затем визуально выделенная кнопка **«Заповнити бриф»**.

**Footer**: копирайт, контактный e-mail/телефон (плейсхолдер), `/privacy`,
`/terms`.

**Breadcrumbs**: на всех страницах глубины 2+, зеркалят URL
(`Головна > Симптоми > Виручка стоїть`).

## Внутренняя перелинковка (без сирот)

- Каждая страница-симптом → 1–2 карточки `SolutionCard` (какой формат решает
  эту боль) + 1–2 карточки `CaseCard` (кейс с тем же тегом).
- Каждый кейс → назад на 1+ симптом (по тегу `symptom_tags`) и на карточку
  своего формата работы.
- Хаб `/results` — фильтруется по симптому/нише через тот же `symptom_tags`
  TV, без хардкода ссылок (см. `modx/tvs.md` и `RelatedBySymptom.php`).
- Хаб `/resources` — статьи тоже размечены `symptom_tags`, попадают в тот же
  блок «Пов'язане» на страницах симптомов.
- CTA-цепочка: симптом/кейс → калькулятор → бриф (везде, где есть CTA, он
  ведёт на `/calculator`, кроме самой формы брифа).
