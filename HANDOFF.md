# HANDOFF — передача проекта новому чату Claude Code

> Прочитай этот файл целиком ПЕРЕД любыми изменениями. Здесь всё, что уже сделано,
> все договорённости с владельцем и все грабли, на которые уже наступали.
> Ничего из перечисленного в разделе «Что уже готово» переделывать не нужно.

Дата среза: 2026-08-10. Ветка разработки: `claude/website-creation-publishing-o8ujcs`.

---

## 1. О проекте и владельце

**Владелец:** Павел Сидоренко, e-commerce-консультант, Украина.
Контакты в проекте: `pashasidorenko18@gmail.com`, +38 099 918 82 60,
linkedin.com/in/pvsidorenko.

**Продукт:** консалтинг по e-commerce под брендом **weexp · Commerce OS™**.

**Языки — важно не путать:**
- Контент публичного сайта — **украинский**.
- Интерфейс портала/брифа — **русский**.
- Общение с владельцем — **русский**.
- Код, комментарии, коммиты — как в существующих файлах (комментарии русские,
  коммиты английские).

**Стиль общения владельца:** прямой, часто голосом (расшифровка бывает с
опечатками — читай по смыслу). Ценит конкретику и результат; не любит, когда
предлагают лишнее или переспрашивают очевидное. Если он подтвердил решение —
делай полностью, без повторных уточнений.

---

## 2. Что в репозитории

Один репозиторий `pyft4zym6y-cpu/Test`, два независимых приложения:

```
/                      ← ПУБЛИЧНЫЙ САЙТ weexp.agency (React 18 + TS + Vite + Tailwind)
  src/pages/           14 страниц (Home, CommerceOsPage, CasesPage, CaseDetailPage,
                       CooperationPage, CalculatorPage, AboutPage, BlogPage,
                       BlogPostPage, ContactPage, EstimatePage, LegalPages,
                       BotVariantsPage, NotFoundPage)
  src/components/      ~30 компонентов + analytics.ts, leads.ts, speech.ts, botConfig.ts
  src/data/blog.ts     10 статей блога (UA)
  api/                 serverless-функции Vercel ДЛЯ САЙТА (см. §5)
  public/
    brief/index.html   ← БОЕВОЙ бриф для клиентов (сборка портала одним файлом)
    demo/index.html    ← публичное демо портала для продаж (localStorage, без БД)
    llms.txt, sitemap.xml, robots.txt, og-image.png, _redirects

/portal/               ← DISCOVERY PORTAL (React + TS + Vite + Supabase)
  src/pages/           16 страниц (Dashboard, CompanyPage, GoalsPage, PainsPage,
                       LinksPage, DomainPage, AccessPage, DecisionPage, ReportPage,
                       DeliverablesPage, AdminPage, AdminClientPage, KpPage,
                       Login, PrivacyPage)
  src/data/            questions.json (643 вопроса, из них 553 уровня L1),
                       routing.json (52 правила), pains.ts, engine.ts, method.ts,
                       decision.ts, rates.ts, aqc.ts, accesses.json,
                       critical-gaps.json, question-meta.json, sheet-meta.json,
                       capability.json, pb-deps.json
  src/lib/             report.ts (Health Score), engine.ts (Decision Engine,
                       Confidence), consultant.ts (8 рычагов, PSI), contradictions.ts,
                       gantt.ts, orders.ts, screen.ts, experiments.ts, model.ts,
                       useAnswers.ts, notify.ts, supabase.ts, demoSeed.ts
  supabase/schema.sql  ВСЯ схема БД + RLS-политики (идемпотентный скрипт)
  api/                 те же функции, что и в корневом api/ (портал как отдельный проект)
  method/SKILL.md      методология аудита (436 строк) + CHANGELOG
  PORTAL_SETUP.md      инструкция по установке (актуальна, раздел v12 — про /brief)
  SERVICE_GUIDE.md     649 строк — руководство по услуге
  OPERATIONS.md        регламенты
  CASES_BRIEF.md       160 вопросов брифа по кейсам
```

**Документация в корне:** `DEPLOY.md` (хостинг и правка сайта), `README.md`.

---

## 3. Деплой: ГЛАВНЫЕ ГРАБЛИ

На Vercel **два проекта из одного репозитория**:

| Проект Vercel | Домен | Production Branch | Что деплоит |
|---|---|---|---|
| `weexp` | weexp.agency | `claude/website-creation-publishing-o8ujcs` | корень репозитория |
| портал | discovery.weexp.agency | (проверить) | папка `portal/` |

⚠️ **Production-ветка сайта — это НЕ `main`, а рабочая ветка
`claude/website-creation-publishing-o8ujcs`.** Пуш в `main` прод не обновляет.
Всегда пушь в обе:

```bash
git push -u origin claude/website-creation-publishing-o8ujcs
git push origin HEAD:main
```

⚠️ В этом же репозитории работала **параллельная сессия Claude** в ветке
`claude/ai-assistant-…` («audit worker», «knowledge packs»). Её деплои засоряют
список и однажды случайно попали на Production сайта. Если увидишь чужие
коммиты — не трогай их, но и не промотируй их деплои.

**Коммиты** — от имени владельца, с обязательным футером:

```bash
git -c user.email="8tyd7zkgfg@privaterelay.appleid.com" -c user.name="Claude" commit -m "$(cat <<'EOF'
Заголовок на английском

Тело — что и зачем.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BpPUACCtEfNCb4rL86rtQg
EOF
)"
```

PR не создавать, пока владелец явно не попросит.

---

## 4. Доступы и секреты — ГДЕ ОНИ ЛЕЖАТ

**В репозитории секретов нет и быть не должно.** Всё живёт в панелях:

| Ключ | Где взять | Куда прописан |
|---|---|---|
| `RESEND_API_KEY` | resend.com → API Keys | Vercel: проект сайта ✅ (проверить портал) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase → Settings → API | Vercel: проект сайта (для `/brief`) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | там же | Vercel: проект портала |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | Vercel: проект сайта (для выдачи логинов) |
| `NOTIFY_EMAIL` (опц.) | — | по умолчанию `pashasidorenko18@gmail.com` зашит в коде |
| `NOTIFY_FROM` (опц.) | после верификации домена в Resend | не задан → письма с `onboarding@resend.dev` |

**Панели, куда владелец имеет доступ:** vercel.com, supabase.com, resend.com,
github.com (`pyft4zym6y-cpu/Test`).

Если ключ нужен — **проси владельца добавить его в Vercel**, не вставляй в код.
Из контейнера разработки `api.resend.com` и `discovery.weexp.agency`
недоступны (прокси блокирует) — проверять интеграции можно только на проде
руками владельца.

---

## 5. Serverless-функции (`/api`, корень = проект сайта)

| Файл | Назначение |
|---|---|
| `lead.js` | приём заявок с сайта → письмо владельцу через Resend, reply-to = клиент, honeypot `company_website` |
| `portal-config.js` | отдаёт `window.__PORTAL_CONFIG` (URL+anon Supabase) для `/brief` |
| `brief-users.js` | админ-only: создать учётку с паролем / сменить пароль / удалить. Проверяет JWT вызывающего против `members.is_admin`, работает через service_role |
| `notify.js` | письма владельцу о вехах прогресса клиента в портале |
| `aqc.js` | AI-прогон страницы по AQC-чеклисту |
| `ga4.js` | тянет baseline из GA4 Data API |
| `fetch.js` | качает HTML чужого сайта для L0-скрининга (обход CORS) |

Те же файлы продублированы в `portal/api/` — портал деплоится как отдельный
проект. **При правке функции меняй обе копии.**

---

## 6. Что уже готово — НЕ ПЕРЕДЕЛЫВАТЬ

### 6.1 Публичный сайт weexp.agency

**Структура (IA v2, выбрана владельцем как «вариант 2»):** 5 разделов в меню —
Commerce OS (`/os`), Кейси (`/cases` + выпадающий список), Співпраця (`/services`),
Калькулятор (`/calculator`), Про нас (`/about`). Плюс активная кнопка
**«Заповнити бриф»** → `/brief/`. Блог — **только в подвале**, не в меню
(явное требование владельца).

Старые URL (`/approach`, `/system`, `/product`, `/expertise`, `/process`)
редиректят на якоря новых страниц через `<Navigate to={{pathname, hash}}>`.

**Три формата сотрудничества** (`src/components/Offers.tsx`, финальные условия):
- **01 Аудит** — $2,900 (оборот до ₴5 млн/міс) / $4,900 (выше), фикс, 4–6 недель,
  + 4 часа консультаций + контрольный звонок через 30 дней. Зачёт: 100% в формат 03,
  50% в формат 02 при старте в течение 30 дней.
- **02 Консалтинг** — $50/час, минимум 30 ч/мес (= от $1,500/мес), старт только
  после аудита, первые 3 месяца, предоплата, перенос до 20% часов, квартальные
  ревью. Требует проджекта на стороне клиента.
- **03 Управління** — от $3,000/мес, пилот 3 месяца с KPI, ответственность наша.
  **Гарантии ROI НЕТ** — владелец прямо запретил («работать бесплатно я точно не буду»).

**5 кейсов** (`src/pages/CaseDetailPage.tsx`, единый шаблон `CaseStory`, тип `CaseData`):
`premium-textile`, `fashion-apparel`, `consumer-dtc`, `fmcg-transformation`,
`fmcg-distribution`. Все — завершённые проекты, все анонимные (владелец: «только
анонимно»). Структура одинаковая: Було → Проблема → Рішення → Результат → Уроки.
Данные собраны через опросник из 160 вопросов (`portal/CASES_BRIEF.md`), ответы
владельца учтены.

**Блог** — 10 статей на украинском в `src/data/blog.ts`, структура AEO
(«Коротка відповідь» первым блоком), Article JSON-LD, связанные посты.

**Калькулятор разрыва** — 8 шагов, 12 ниш, цепная модель (перемножение рычагов),
консервативная нижняя граница. После результата — полноценная форма заявки.

**Лид-система:**
- Форма после калькулятора: имя*, ссылка на магазин*, телефон*, email (опционально).
- Форма на `/contact` — то же правило (телефон обязателен, email нет).
- Обе шлют на `/api/lead` → письмо владельцу с расчётом клиента внутри.
- Fallback на mailto, если бэкенд недоступен.
- **Клиенту письма НЕ отправляются** — владелец отменил автоответ («на хуя,
  мы показали результат на экране, он оставил заявку, заявка нам упала»).

**SEO/AEO/GEO слой:** хлебные крошки на всех страницах + BreadcrumbList JSON-LD,
per-route title/description/og/canonical, FAQPage JSON-LD на `/services`,
Article JSON-LD в блоге, `llms.txt`, `sitemap.xml`.

### 6.2 Бриф на сайте: weexp.agency/brief

Однофайловая сборка портала лежит в `public/brief/index.html`. Конфиг Supabase
приходит в рантайме из `/api/portal-config` — ключей в git нет. Флаг
`window.__BRIEF_PROD__` в `portal/src/main.tsx`: если конфиг не пришёл,
показывается заглушка «Портал тимчасово недоступний», а НЕ демо-режим.

**Пересборка брифа после любой правки портала:**

```bash
cd /home/user/Test/portal
rm -rf dist-artifact && npx vite build --config vite.artifact.config.ts
python3 - <<'EOF'
src = open('/home/user/Test/portal/dist-artifact/index.html', encoding='utf-8').read()
inject = ('<meta name="robots" content="noindex, nofollow">'
          '<script>window.__BRIEF_PROD__=true;</script>'
          '<script src="/api/portal-config"></script>')
open('/home/user/Test/public/brief/index.html','w',encoding='utf-8').write(src.replace('<head>','<head>'+inject,1))
open('/home/user/Test/public/demo/index.html','w',encoding='utf-8').write(src.replace('<head>','<head><meta name="robots" content="noindex, nofollow">',1))
EOF
```

### 6.3 Управление доступами (админка брифа)

Адрес: `https://weexp.agency/brief/#/admin` (видна только при `members.is_admin`).

- **Выдать логин и пароль** — генерируется читаемый пароль (без 0/O, 1/l),
  создаётся учётка через `/api/brief-users` + строка в `members`. Показывается
  пара + кнопка «Скопировать инструкцию для клиента 📋». Владелец сам решает,
  кому передавать.
- **🔑** — сменить пароль участнику (старый мгновенно недействителен).
- **✕** — отозвать доступ: удаляются и `members`-строка, и auth-учётка.
  Вход невозможен ни паролем, ни magic-link.
- **🔒 / 🟢 «Приём»** — закрыть/открыть заполнение по клиенту. Клиент видит
  баннер и режим только-чтение; **запись блокируют RLS-политики в БД**
  (`clients.locked` + `client_locked()` в политиках `answers` и `access_status`).
- **«Мой доступ»** — владелец задаёт себе пароль.

**Вход** (`portal/src/pages/Login.tsx`) — два режима: magic-link по почте
(только для адресов из `members`, проверка через RPC `is_invited`) и
email + пароль. `emailRedirectTo` включает `pathname`, потому что бриф живёт
в подпапке `/brief/`.

**Резюме AI** — карточка вверху `AdminClientPage`, тезисы пересчитываются из
текущих ответов: заполненность, Health Score, горящие/ключевые боли, цели,
критические разрывы, слабые домены, противоречия, топ-3 решения Decision Engine,
денежный разрыв, доступы. Кнопка «Скачать бриф + резюме (.md)».

### 6.4 Портал (методология)

Развивался до версии v12. Ключевые движки: Health Score (зрелость 18 доменов +
штрафы за критические разрывы), Decision Engine (IF-правила → приоритеты),
Confidence (достоверность выводов), детектор противоречий, 8 рычагов baseline,
Gantt, бюджет по rate card, анализатор выгрузки заказов, L0-скрининг,
AQC-чеклист, планировщик A/B. Подробности — `portal/method/SKILL.md`
и `portal/SERVICE_GUIDE.md`.

---

## 7. Правила по контенту сайта — нарушать нельзя

Выстраданы правками владельца, каждое — результат отдельного замечания:

1. **Цены только на `/services`.** Нигде больше — ни в футере, ни в кейсах,
   ни в блоках CTA («опять пихаешь цены куда не попадя»).
2. **Никаких названий реальных компаний-конкурентов** (Netpeak, Promodo и т.п.) —
   только архетипы («сетевое агентство», «фрилансер-одиночка»).
3. **Никаких названий платформ** в блоках «если/то» (Shopify, Odoo, OpenCart) —
   отпугивает. Абстрактно: «нічого страшного: побудуємо».
4. **Никаких гарантий ROI** и обещаний работать за результат.
5. **CTA-блоки ведут на калькулятор**, а не на контакты (кроме самой формы).
6. Тон: уверенный, без пафоса, «мы разработали 3 пакета услуг» — если спрашивают
   про цену вне `/services`.
7. Кейсы — только анонимно, без узнаваемых деталей.
8. Верстка: проверять мобильную (владелец присылает скриншоты с телефона),
   не допускать переносов строк в футере, горизонтального скролла.

---

## 8. Рабочие команды и грабли окружения

```bash
# Сайт
cd /home/user/Test && npm run build            # tsc + vite build
npx vite preview --port 4360 --strictPort      # превью (умирает между ходами — перезапускай)

# Портал
cd /home/user/Test/portal && npx tsc --noEmit  # типы
```

**Playwright** (тесты UI):
- `executablePath: '/opt/pw-browsers/chromium'` обязательно.
- Скрипт клади **внутрь проекта** (`/home/user/Test/.test-*.mjs`), иначе ESM не
  найдёт пакет `playwright`. После прогона удаляй.
- Используй `domcontentloaded` + `waitForTimeout`, **не** `networkidle` —
  анимация-бегущая строка не даёт сети «успокоиться».
- `page.route('**/api/lead', …)` — так тестировались лид-формы.

**Артефакт-превью сайта** (приватная страница для владельца):
URL `https://claude.ai/code/artifact/3ec5f03f-aa4e-4a0c-867d-7c6ca08d5607`.
Сборка: `rm -rf dist-artifact && npx vite build --config vite.artifact.config.ts`
из **корня**, затем python-постобработка (вырезать ссылки Google Fonts, взять
внутренности head/body, подставить инлайн-шрифты из scratchpad) и публикация
инструментом Artifact с параметром `url` — иначе создастся новый адрес.

**Прочие грабли:**
- `git` из scratchpad не работает — запускай из `/home/user/Test`.
- Не путай рабочую директорию при сборке артефактов сайта и портала.
- `python3` + regex по большим TSX-файлам однажды покорёжил файл — правь через
  Edit, а не через `re.sub`.

---

## 9. Что осталось сделать (открытые задачи)

**На стороне владельца (напоминать, но не тратить на это ходы):**
1. В Vercel-проект **сайта** добавить `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` → Redeploy (Production). Без этого `/brief`
   показывает заглушку.
2. Supabase → Authentication → URL Configuration → Redirect URLs → добавить
   `https://weexp.agency/brief/`.
3. Supabase → SQL Editor → прогнать свежий `portal/supabase/schema.sql`
   (добавит `clients.locked` и политики блокировки).
4. Проверить, что `RESEND_API_KEY` есть и в проекте портала (уведомления о вехах).
5. Опционально: подтвердить домен `weexp.agency` в Resend → потом
   `NOTIFY_FROM=weexp <hello@weexp.agency>`.

**Технический бэклог (по итогам SEO/UX-аудита, владелец приоритеты не расставил):**
- Пререндер/SSG сайта (сейчас чистый SPA — поисковики видят пустой HTML).
- Уникальные title для каждого кейса; og-картинки под страницы.
- Живые лица/отзывы на `/about`.
- Лид-магнит в блоге.
- Страница `/estimate` — тёмная тема выбивается из общего стиля, решить судьбу.

**Закрытые темы — не поднимать без просьбы:**
- Логотип/персонаж AI-бота — владелец свернул тему словами «Ладно похуй».
- Автописьма клиенту после калькулятора — отменены сознательно.
- Блок FM-01…40 в брифе по кейсам остался без ответов (FMCG-кейс можно
  обогатить позже, если владелец даст факты).

---

## 10. Как начать новому чату

1. Прочитай этот файл, затем `portal/PORTAL_SETUP.md` (раздел v12) и
   `DEPLOY.md`.
2. Проверь, на какой ветке находишься: должна быть
   `claude/website-creation-publishing-o8ujcs`.
3. Уточни у владельца одну вещь: выполнены ли пункты 1–3 из §9 (настройка
   Vercel/Supabase) — от этого зависит, работает ли `/brief` на проде.
4. Дальше работай по задачам владельца. Перед правкой контента сверься с §7.
