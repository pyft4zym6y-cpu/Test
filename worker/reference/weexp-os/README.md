# weexp eCom OS — справочник методологии (22 OS-скилла)

Полный исходник методологии плагина **weexp v0.8.0-round8** (из аплоада
`weexp_round8.zip`), сохранён в репозитории как **справочник**, чтобы база не
зависела от загрузки.

**Это НЕ автозагружается.** Анализ Claude подмешивает не эти файлы, а их
дистилляты в `worker/knowledge/*.md`:
- `10-synthesis-consolidation.md` — из `synthesis-os` (остаточный вклад).
- `20-method-frame.md` — слои A0–A2, уровни E0–E5, симптом≠причина.
- `30-domain-lenses.md` — сжатая суть 18 доменов ниже.

Файлы здесь — источник для дальнейшей дистилляции и сверки. 22 домена:
identity · commerce · data · brand · product · pricing · ux · content ·
merchandising · seo · build · paid · retention · marketplace · b2b · ops ·
**synthesis** · finance · people · legal · ai · reporting.

Ключевое (round8): `synthesis-os` получил алгоритм на 8 шагов со снятием
пересечений по ключу «шаг воронки × объект × точка проявления» и расчётом
остаточного вклада вместо суммы потенциалов. Подробности — `_CHANGELOG_ROUND8.md`.

Чтобы сделать их вызываемыми скиллами Claude Code — скопировать нужные в
`.claude/skills/<name>/SKILL.md` (учесть возможный конфликт имени `commerce-os`
с уже включённым скиллом окружения).
