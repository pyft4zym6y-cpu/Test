# TOOLING — MCP-серверы, скиллы, агенты и плагины аудитора

Набор внешних инструментов, подключаемых к **аудитору** (SEO / analytics / ads /
design / memory). Это слой поверх реестра интеграций `worker/CONNECTORS.md`:
CONNECTORS.md описывает, *что* тянем по методу (коды AC), а этот файл — *чем*
(конкретные MCP-серверы и скиллы) и *как их установить*.

Ветка: `claude/ai-assistant-comerc-oc-qufqcc`. Секретов здесь нет — только имена
env-переменных. Значения живут в Railway → Variables (для сервера) или в env
локальной машины (когда гоняешь Claude Code на репо аудитора).

---

## 0. Ограничения окружения (важно понимать до установки)

Проверено в облачной сессии Claude Code (2026-08-10):

1. **Прокси облака режет произвольные хосты.** Доступны только `npm`, `pypi`,
   `github`. Поэтому **HTTP-MCP серверы** (`labelhead`, `notfair-googleads`,
   `posthog`, `citedy`) из облачной сессии **не подключатся** (403 CONNECT).
   Они работают только с **твоей локальной машины** или там, где нет этого прокси.
2. **Новые MCP не подхватываются в уже запущенную сессию** — цепляются на старте.
   После правки `.mcp.json` нужно **перезапустить** Claude Code.
3. **Облачный контейнер эфемерный.** Всё, что `skillfish` / `claude-code-templates`
   / `claude plugin add` кладут в `~/.claude`, при пересоздании контейнера
   **исчезает** и в git не попадает. Поэтому для аудитора персистентны только:
   `.mcp.json` (в репо) и любые скиллы, **закоммиченные** в `.claude/skills/`.

---

## 1. MCP-серверы (файл `.mcp.json` в корне ветки)

Конфиг уже закоммичен. Claude Code на репо аудитора поднимет их на старте.
Секреты — через `${ENV}`; без переменной сервер стартует, но отдаёт ошибку авторизации.

| Сервер | Транспорт | Облако? | Нужны креды (env) | Назначение / AC |
| --- | --- | --- | --- | --- |
| `openbrand` | stdio `npx openbrand-mcp` | ✅ | — | бренд-данные / айдентика |
| `geo-analyzer` | stdio `npx @houtini/geo-analyzer` | ✅ | `ANTHROPIC_API_KEY` (есть), опц. `JINA_API_KEY` | GEO/AEO: видимость в AI-поиске (ChatGPT/Claude/Perplexity/AI Overviews) |
| `search-console-mcp` | stdio `npx search-console-mcp` | ✅* | GSC OAuth (`npx search-console-mcp setup`) **или** `GOOGLE_APPLICATION_CREDENTIALS`; опц. `BING_API_KEY` | GSC + Bing WMT + GA4 → AC-03 |
| `screaming-frog-seo-spider-mcp-server` | stdio `uvx screaming-frog-mcp` | ⚠️ | десктоп-приложение SF + лицензия, `SCREAMING_FROG_PATH` | тех-SEO краул сайта → AC-03/AC-04 |
| `codebase-memory` | stdio `npx codebase-memory-mcp` | ✅ | — | структурная память по коду (дёшево по токенам) |
| `labelhead-artist-momentum` | http | ❌ (прокси) | — (публичный) | внешний сервис |
| `notfair-googleads` | http | ❌ (прокси) | Google Ads OAuth + developer token | рекламные кабинеты → AC-07 |
| `posthog` | http | ❌ (прокси) | `POSTHOG_API_KEY` (Bearer) | продуктовая аналитика/воронки |
| `citedy-seo-agent` | http | ❌ (прокси) | — / вход на mcp.citedy.com | SEO-агент |

`*` search-console работает в облаке только с service-account кредами
(OAuth-флоу `setup` требует браузера — делается локально).

**Где ставить env:**
- Сервер на Railway (worker) — Railway → Variables.
- Локальный запуск Claude Code — в env оболочки / `.env` рядом (не коммить).

### `mcp-gsc` (клон, не npm) — по желанию
Альтернатива `search-console-mcp` (AminForou/mcp-gsc, Python). В `.mcp.json` не
внесён, чтобы не хардкодить путь. Установка локально:
```bash
git clone https://github.com/AminForou/mcp-gsc.git
cd mcp-gsc && uv sync
# затем: claude mcp add mcp-gsc -- uv run --directory /abs/path/mcp-gsc python server.py
```
Нужны Google-креды (service account / OAuth). Дублирует функциональность
`search-console-mcp` — ставь что-то одно.

---

## 2. Скиллы, агенты, плагины (устанавливаются в `~/.claude`, НЕ в репо)

⚠️ В облачном контейнере эфемерны (см. §0.3). Ставить на **локальной машине**,
где гоняешь Claude Code, или коммитить нужные скиллы в `.claude/skills/` вручную.

### Плагины (marketplace)
```bash
claude plugin marketplace add jeremylongshore/claude-code-plugins-plus-skills
```

### Агенты (claude-code-templates → ~/.claude/agents)
```bash
npx claude-code-templates@latest --agent development-team/ui-ux-designer
npx claude-code-templates@latest --agent development-team/frontend-developer
npx claude-code-templates@latest --agent development-team/backend-architect
```

### Скиллы (skillfish → ~/.claude/skills)
```bash
npx skillfish add openclaw/openclaw diagram-maker
npx skillfish add openclaw/openclaw ordercli
npx skillfish add affaan-m/ecc seo
npx skillfish add affaan-m/ecc market-research
npx skillfish add affaan-m/ecc skill-stocktake
npx skillfish add affaan-m/ecc council
npx skillfish add affaan-m/ecc database-migrations
npx skillfish add affaan-m/ecc lead-intelligence
```
(В исходном списке `diagram-maker`, `seo`, `market-research` шли дважды — дубли убраны.)

### Скилл-репозитории (пины коммитов из исходного списка)
Клонируются на локальной машине; нужные скиллы копируются в `~/.claude/skills/`
или (для персистентности аудитора) в `.claude/skills/` этой ветки и коммитятся.
```
vercel-labs/skills            @ 773fb2c7bbf16781670a3520affc4abd0c6151ae
anthropics/skills             @ 2235be7c60b551f5de82ade908fd3816455afcda
coreyhaines31/marketingskills @ 804c512d762c41c8e3631fe341aef2e365fd8c04
AgriciDaniel/claude-seo       @ 6b63c8bb7b2e8e4480060604555e3af629b54c2c
AgriciDaniel/claude-ads       @ d7c57b00dfe127c904e518c3f06fd20783e6f560
nexscope-ai/eCommerce-Skills  @ 0419aee14305551df5c9fb9b9590ff785e85f43b
nexu-io/open-design           @ a51522c9c1c65f492a623339dab5ef6a0a053315
```

---

## 3. Безопасность

Список — сторонний код разной степени доверия (MCP-серверы отдают инструменты,
скиллы автозагружаются). Перед боевым использованием на данных клиентов имеет
смысл просмотреть README/исходники и держать креды в env, а не в репо.
Каждый MCP-сервер можно отключить, удалив его блок из `.mcp.json`.
