# Template Variables (TV)

| TV | Тип | Шаблоны | Назначение |
|---|---|---|---|
| `short_answer` | Textarea | SymptomPage | AEO-блок: короткий прямой ответ «це про вас, якщо...» в начале страницы |
| `related_solutions` | Resource list (ID через запятую) | SymptomPage | Явная привязка к 1–2 форматам роботи, если авто-подбора по тегу недостаточно |
| `related_cases` | Resource list (ID через запятую) | SymptomPage | Явная привязка к кейсам-доказательствам |
| `symptom_tags` | Checkbox (список слагов симптомов) | SymptomPage (свой), CaseDetail, BlogPost | Общий тег для кросс-линковки: по нему `RelatedBySymptom.php` вытягивает связанные кейси/статьи на странице симптома |
| `price_note` | Text | SolutionPage | Короткая формулировка формата оплаты («фікс», «$/год», «від $/міс») — без конкретных сумм в общих блоках сайта (сумма только на самой странице формата) |
| `duration` | Text | SolutionPage | Срок формата («4–6 тижнів», «щомісяця») |
| `format_code` | Text | SolutionPage | Технический код формата (`audit` / `consulting` / `management`) — для сортировки карточек |
| `industry` | Text (или Listbox с преднаборными вариантами) | CaseDetail | Ниша кейса (архетип, не бренд) |
| `growth_metric` | Text | CaseDetail | Ключевая цифра результата (например «×2.4 виручка») — выводится в карточке |
| `was_tv` | Richtext | CaseDetail | Блок «Було» |
| `problem_tv` | Richtext | CaseDetail | Блок «Проблема» |
| `solution_tv` | Richtext | CaseDetail | Блок «Рішення» |
| `result_tv` | Richtext | CaseDetail | Блок «Результат» |
| `lessons_tv` | Richtext | CaseDetail | Блок «Уроки» |
| `excerpt` | Textarea | BlogPost | Короткий анонс для карточки/хаба |
| `cover_image` | Image | BlogPost, CaseDetail | Обложка карточки |
| `show_contact_form` | Yes/No (Checkbox) | StaticPage | Показывать форму (используется на `/contact`, выключено на `/about`, `/privacy`, `/terms`) |

## Принцип

Явные `related_*` TV — это override для конкретных страниц, где авторская
привязка важнее автоматики. По умолчанию перелинковка идёт по общему
`symptom_tags` (см. `RelatedBySymptom.php`) — так добавление нового кейса
или статьи с правильным тегом сразу подхватывается всеми связанными
страницами без ручной правки ссылок.
