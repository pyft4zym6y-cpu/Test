# UX-стандарты · индекс

Два нормативных слоя к PB-15, дополняющие энциклопедию UX (`uxui_index.md`).
Энциклопедия объясняет **почему**; эти файлы задают **проверяемый критерий**.

## Atomic Quality Criteria · AQC

Реестр атомарных критериев качества: каждый — с severity, определением, чек-листом
проверки и условием Pass. Шкала обнаружимости V0 (невидим) → V5 (невозможно не заметить).
Формула: `Visibility = Presence × Visual Salience × Information Hierarchy × Context × Timing` —
если любой множитель стремится к нулю, объект для пользователя не существует.

Домены: Visibility · Recognition · Comprehension · Discoverability · Information Architecture ·
Decision Architecture · Navigation Quality · Forms & Data Entry и далее.

**Как применять в аудите.** Находка формулируется не как «CTA неудачный», а как
`AQC-VIS-0001 · Fail · Primary CTA обнаруживается дольше 2 секунд`. Это переводит UX-разбор
из вкусовщины в проверяемый стандарт — и снимает главное возражение клиента «это ваше мнение».

| Файл | Содержание | Символов |
| --- | --- | --- |
| [s-01.md](ux_standards/s-01.md) | DOMAIN 02 — VISIBILITY … DOMAIN 06 — INFORMATION ARCHITECTURE (IA) | 19,374 |
| [s-02.md](ux_standards/s-02.md) | DOMAIN 07 — DECISION ARCHITECTURE … AQC-CON-0407 | 18,914 |
| [s-03.md](ux_standards/s-03.md) | DOMAIN 12 — NAVIGATION QUALITY … DOMAIN 13 — FORMS & DATA ENTRY | 17,382 |

## Mobile Commerce Bible

Мобильная витрина как отдельный продукт, а не уменьшенная копия десктопа: на десктопе
пользователь исследует, на мобильном принимает быстрые решения.

Ключевые механики: **Thumb Zone Architecture** — все критические действия в зоне
естественного касания; мобильная галерея, sticky CTA, выбор варианта, мобильный чекаут.
Метрики: Mobile Add to Cart, Mobile CR, Revenue per Visitor, Thumb Reach, Sticky CTA CTR,
Gallery Swipe, Scroll Depth.

| Файл | Содержание | Символов |
| --- | --- | --- |
| [s-04.md](ux_standards/s-04.md) | PART IV … PART VII | 19,974 |
| [s-05.md](ux_standards/s-05.md) | Chapter 1 … Chapter 14 | 19,712 |
| [s-06.md](ux_standards/s-06.md) | Chapter 15 … Chapter 20 | 16,903 |
| [s-07.md](ux_standards/s-07.md) | Chapter 21 | 18,297 |
| [s-08.md](ux_standards/s-08.md) | PART XV … PART XVI | 10,961 |
| [s-09.md](ux_standards/s-09.md) | PART XVII · часть 1 | 25,665 |
| [s-10.md](ux_standards/s-10.md) | PART XVII · часть 2 | 23,997 |

**Объём слоя:** 191,179 символов, 10 файлов.

Commerce OS · UX Standards · пара к PB-15 и `uxui_index.md`
