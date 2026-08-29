# WEEXP — карта інфраструктури

Одна сторінка «що де живе». Мета — прибрати відчуття хаосу: не 10 різних
хостингів, а **2 платформи, якими ти керуєш** (Vercel + Railway) + Supabase +
кілька API-ключів + GitHub для коду. Нижче — точний перелік із репозиторію.

> Заповни колонки **Власник / Логін** самостійно (у коді їх немає — це облікові дані).

---

## 1. Коротко: реальна форма стека

| Шар | Сервіс | Це «хостинг»? |
|---|---|---|
| Код | **GitHub** | ні — сховище git |
| Веб (сайт, портал, school, API-функції) | **Vercel** | так |
| Воркер-аудитор (браузер + Claude) | **Railway** | так — потрібен контейнер |
| БД / Auth / Storage | **Supabase** | так (managed-бекенд) |
| Пошта | **Resend** | ні — API-ключ |
| AI-модель | **Anthropic (Claude)** | ні — API-ключ |
| GA4 + вхід через Google | **Google Cloud** | ні — API-ключ/OAuth |

**Висновок:** свести до «одного» неможливо — Claude, Google-логін і пошту
не можна self-host. Реальний мінімум — цей список. Хаос лікується SSO +
цією картою (розділ 5), а не переїздом на VPS.

---

## 2. Сервіси детально

### GitHub — код
- **Роль:** репозиторій, гілки, деплой-тригери.
- **Гілки:** `main`, робоча `claude/ai-assistant-comerc-oc-qufqcc`, прод-оверлей `claude/website-creation-publishing-o8ujcs`.
- **Власник / Логін:** _______________

### Vercel — веб + serverless
- **Роль:** збірка та хостинг усіх веб-частин + serverless-функції `/api/*`.
- **Проєкти (кожен зі своїм `vercel.json`):**
  - корінь → будує `weexp-site` (маркетинговий сайт), `outputDirectory: weexp-site/dist`
  - `portal/` → клієнтський портал (`portal/vercel.json`)
  - `school/` → школа (`school/vercel.json`)
  - `weexp-site/vercel.json` → налаштування самого сайту
- **Serverless-функції `api/`:** `lead.js`, `notify.js` (Resend) · `ga4.js` (Google Analytics Data) · `interview.js`, `aqc.js` (Anthropic) · `portal-config.js` (Supabase) · `fetch.js`, `brief-users.js`
- **Власник / Логін:** _______________

### Railway — воркер-аудитор
- **Роль:** контейнер (Dockerfile `worker/Dockerfile`) — Playwright/Chromium + Claude; обхід сайтів, аналіз UX/CRO, генерація docx/pptx/xlsx.
- **Чому окремо:** справжній браузер + довгі задачі — **не влазить у serverless** (ліміти часу/пам'яті). Потрібен контейнер-хост.
- **Конфіг:** `railway.json` (healthcheck `/health`, порт `8787`, restart ON_FAILURE).
- **Дубль:** у репо є ще `render.yaml` — **обери один хост (Railway АБО Render), другий конфіг видали**, щоб не плодити місця деплою.
- **Власник / Логін:** _______________

### Supabase — дані / авторизація / файли
- **Роль:** Postgres (таблиця `diagnostics`), Auth (email + Google OAuth), Storage (бакет `tier-files` для файлів рівнів T3).
- **Проєкт:** `lpbyigsezimqofygpfof.supabase.co`
- **Треба донастроїти:** RLS-політики для менеджера/адміна, бакет `tier-files` (див. чат).
- **Власник / Логін:** _______________

### Resend — транзакційна пошта
- **Роль:** відправлення лідів і сповіщень (`api/lead.js`, `api/notify.js`).
- **Власник / Логін:** _______________

### Anthropic (Claude) — AI
- **Роль:** аудитор-воркер + `api/interview.js`, `api/aqc.js`.
- **Консоль:** platform.claude.com
- **Власник / Логін:** _______________

### Google Cloud — GA4 + вхід через Google
- **Роль:** Google Analytics Data API (`api/ga4.js`) + OAuth «Вхід через Google» (креденшали живуть у Supabase → Providers → Google).
- **Власник / Логін:** _______________

### Зовнішні дата-провайдери (для воркера, опційно)
- **PageSpeed** (`PSI_KEY`, Google), **Serpstat** (`SERPSTAT_KEY`), **SimilarWeb** (`SIMILARWEB_KEY`).

---

## 3. Env-ключі — де що лежить

### Клієнт (Vite, публічні — потрапляють у бандл)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ACCESS_CODES          # коди доступу до глибокого аудиту
VITE_REPORT_WEBHOOK
VITE_VITALS_URL
```

### Vercel — serverless (`api/*`), приватні
```
RESEND_API_KEY             # пошта
NOTIFY_EMAIL               # куди падають ліди
ANTHROPIC_API_KEY          # interview / aqc
SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
PSI_KEY                    # PageSpeed (GA4-функція/аудит)
```

### Railway — воркер, приватні
```
ANTHROPIC_API_KEY
AUDIT_SERVER_TOKEN         # захист ендпоінта воркера
AUDIT_MODEL / AQC_MODEL / INTERVIEW_MODEL / ASSISTANT_MODEL
AUDIT_MAX_MINUTES / CLAUDE_TIMEOUT_MS / CLAUDE_MAX_RETRIES / PDF_TIMEOUT_MS
CHROME_PATH / PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
SERPSTAT_KEY / SIMILARWEB_KEY / PSI_KEY
```
> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` — **тільки на сервері** (Vercel/Railway env),
> ніколи не в клієнтський код і не в git.

---

## 4. Мапа деплою

| Що | Звідки будується | Куди |
|---|---|---|
| Маркетинговий сайт | `weexp-site/` (через кореневий `vercel.json`) | Vercel · прод-гілка `claude/website-creation-publishing-o8ujcs` · домен **weexp.agency** |
| Ведення проєкту (кабінет клієнта + консоль) | те саме складання | той самий проєкт Vercel · домен **app.weexp.agency** |
| Портал | `portal/` | Vercel (окремий проєкт) |
| School | `school/` | Vercel (окремий проєкт) |
| API-функції | `api/` | Vercel (serverless) |
| Воркер-аудитор | `worker/Dockerfile` | Railway (контейнер) |

### Два домени одного складання

Сайт і ведення проєкту розведені по походженнях, але збираються разом. Одне
складання обрано свідомо: `/api/*` лежить у тому самому розгортанні, тож на
обох хостах воно лишається СВОЇМ — не потрібні ні CORS, ні розширення
`connect-src` у CSP, ні другий бюджет serverless-функцій.

Межа проходить не між «сайтом» і «не сайтом», а між тим, що породжує сама
сторінка, і тим, що живе далі. Адмінка сайту — це заявки: форма на сторінці їх
створює, з ними працюють до «беремо в роботу», і належить вона сайту так само,
як форма, що їх наповнює. Усе після заявки — клієнти, аудити, проєкти, воркер,
методики — окремий сервіс із власним входом, куди приходить і клієнт.

| | weexp.agency | app.weexp.agency |
|---|---|---|
| Що віддає | маркетингові сторінки + `/admin` (заявки) | `/cabinet` (клієнт), `/manage` (консоль) |
| Чужі адреси | `/cabinet`, `/manage` → 301 на app | `/admin` та решта → 301 на сайт |
| robots.txt | дозвільний, з картою сайту | `Disallow: /` (файл `public/robots-app.txt`) |
| X-Robots-Tag | звичайний | `noindex, nofollow, noarchive` на всі відповіді |
| Оболонка | повна: меню, підвал, крихти | згорнута: знак, мова, вихід |

Перелік вкладок кожної поверхні — одне джерело: поле `surface` у `TABS`
(`src/system/admin/shared.tsx`). Маршрути, редиректи й меню читають його, а не
повторюють межу руками.

Правила живуть у кореневому `vercel.json` (умова `has: host`), а всередині
застосунку їх дублює сторож `src/lib/HostGuard.tsx` — серверні редиректи не
бачать переходів роутером усередині SPA. Тести: `src/__tests__/origins.test.ts`.

**Що треба зробити руками у Vercel (я цього зробити не можу):**

1. Проєкт сайту → *Settings → Domains* → **Add** `app.weexp.agency`.
2. Обрати **не** «Redirect to weexp.agency», а звичайне обслуговування домену:
   інакше Vercel розверне піддомен на основний, і всі правила нижче не
   спрацюють жодного разу.
3. У реєстратора домену додати запис, який покаже Vercel:
   `CNAME app → cname.vercel-dns.com` (точне значення Vercel показує на екрані
   додавання домену — беріть його, а не це).
4. Дочекатись сертифіката (кілька хвилин) і перевірити:
   `curl -sI https://weexp.agency/cabinet | head -3` → має бути `301` на
   `https://app.weexp.agency/cabinet`.

**Наслідок, про який варто знати:** сесія Supabase лежить у `localStorage` і
прив'язана до походження, тож усі, хто зараз залогінений на weexp.agency, один
раз увійдуть заново вже на app.weexp.agency. Це свідомий вибір: тримати сесію
на обох доменах означало б перевести її в cookie з `Domain=.weexp.agency`, а
це помітно ширша поверхня для CSRF заради разової зручності.

---

## 5. Чек-лист «менше логінів/хаосу» (без переїзду)

1. **Єдиний вхід (SSO).** Уві всі консолі заходити **через один Google-акаунт**:
   - [ ] GitHub → Settings → Password and authentication → підключити Google/SSO
   - [ ] Vercel → «Continue with GitHub/Google»
   - [ ] Railway → «Login with GitHub»
   - [ ] Supabase → «Continue with GitHub/Google»
   - [ ] Resend → «Continue with Google»
   - [ ] Anthropic Console → Google
   → один логін, кілька вкладок замість 6 паролів.
2. **Один власник і рахунок.** Перевести всі сервіси на один e-mail-власника й одну картку.
3. **Прибрати дублі.** Обрати Railway **або** Render для воркера → видалити зайвий конфіг (`render.yaml` чи `railway.json`).
4. **Згрупувати Vercel-проєкти** в одну Team (site + portal + school).
5. **Один кокпіт.** Операційна видимість (користувачі / аудити / аналітика / ліди / T1–T4) — в адмінці `/admin` (у розробці). Ця карта — довідник «де що живе».

---

## 6. Що НЕ раджу
- **VPS «усе на один сервер»** — під драйвер «менше логінів» не працює: додає
  сисадмінство (патчі, бекапи, SSL, аптайм), а Google/Claude/пошту все одно
  лишає зовні. Виправдано лише за вимоги «дані в Україні» або повного контролю.
- **Єдина монолітна CMS (MODX/WordPress) на все** — це повний ререрайт сайту,
  втрата SPA/кабінету/Supabase і все одно без AI та Google-логіну.

_Оновлюй цей файл при зміні стека._

## Бібліотека агенції (kb_library)

Наші методики, шаблони, чек-листи та інструкції — те, як працює команда.
НЕ плутати з «Базою знань клієнта»: та лежить у `diagnostics.data` і описує
конкретного клієнта, збираючись сама з його даних.

Два шари:

* **базовий** — `weexp-site/src/data/kbLibrary.ts`. У репозиторії, змінюється
  через ревʼю, працює завжди й без бази;
* **командний** — таблиця `kb_library`, те, що додають з адмінки
  («Аудит і проєкти → Бібліотека»).

SQL: `docs/kb-library.sql` (таблиця, індекси, RLS через `weexp_role()`, тригер
`updated_at`). Читає вся команда, редагують `super` і `admin`.

Поки SQL не виконано, панель прямо каже про це й показує базовий шар:
порожня бібліотека і невиконана міграція виглядають однаково, тому причина
завжди пишеться текстом.
