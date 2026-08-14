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

## 2. Скиллы

### 2.1 Вендорнуты в репо (`.claude/skills/`) — персистентны, грузятся на репо аудитора

Курированный под линзы аудитора набор (**31 скилл**), отобран из запиненных
коммитов (см. §2.3). Копии полные (SKILL.md + references/scripts), без бинарников.

| Группа | Скиллы |
| --- | --- |
| SEO (claude-seo) | `seo-audit` `seo-technical` `seo-ecommerce` `seo-schema` `seo-geo` `seo-competitor-pages` `seo-page` `seo-local` `seo-sxo` |
| Ads (claude-ads) | `ads-audit` `ads-google` `ads-meta` `ads-attribution` `ads-report` `ads-competitor` `ads-math` `ads-budget` |
| Marketing/CRO (marketingskills) | `cro` `ab-testing` `competitor-profiling` `site-architecture` `marketing-council` `churn-prevention` |
| E-commerce (eCommerce-Skills) | `product-page-seo` `competitor-price-analysis` `google-shopping-optimization` `ecommerce-keyword-research` |
| Design/UX (open-design) | `web-design-guidelines` `creative-director` `plan-design-review` |
| Диаграммы (openclaw) | `diagram-maker` |

**Сознательно НЕ вендорил:**
- `anthropics/skills` — дефолтные скиллы, уже есть в окружении; docx/xlsx/pptx
  дублируют собственные экспортеры аудитора (`worker/src/export/*`).
- `affaan-m/ecc` — на актуальном коммите там dev/infra-скиллы (kotlin, django,
  homelab), а не `seo/market-research/council/...` из списка (skillfish резолвит
  эти имена из своего индекса, не из `skills/` репо). Функции закрыты профильными
  репозиториями выше.
- `vercel-labs/skills` — только `find-skills` (мета-поиск), для аудита не нужен.
- 2 скилла eCommerce-Skills (`minimum-advertised-price`,
  `shopify-conversion-optimization`) — нестандартный frontmatter, плохо триггерятся;
  их роль закрывают `competitor-price-analysis` / `cro` / `product-page-seo`.

Добавить/убрать скилл — просто скопировать папку в `.claude/skills/` или удалить её.

### 2.2 Агенты и плагины (ставятся в `~/.claude`, НЕ в репо)

⚠️ В облачном контейнере эфемерны (см. §0.3). Ставить на **локальной машине**,
где гоняешь Claude Code.

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

### 2.3 Источники скиллов (пины коммитов — из них взят набор §2.1)
Клонировать: `git init && git fetch --depth 1 origin <commit> && git checkout FETCH_HEAD`.
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

## playwright-cli (Microsoft, вендорен 2026-08)
Скилл: `.claude/skills/playwright-cli/`. Официальный CLI-интерфейс Playwright для кодинг-агентов
(`npm i -g @playwright/cli`). Токен-эффективная браузерная автоматизация короткими командами
(open/goto/click/fill/snapshot/screenshot) вместо тяжёлых MCP-схем — агент управляет браузером,
не загружая в контекст accessibility-деревья. Применение у нас: ручная доразведка сайтов после
автоматического прогона (проверить «спотыкания» journey руками), отладка селекторов детекции,
воспроизведение багов обхода. Дополняет, не заменяет наш crawl/journey-контур.
