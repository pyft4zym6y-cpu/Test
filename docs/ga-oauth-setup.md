# GA4-конектор: налаштування Google OAuth (покроково)

Мета: клієнт у кабінеті натискає «Підключити конектор» → бачить стандартне
вікно Google → дає READ-ONLY доступ до своєї Google Analytics → менеджер
у картці клієнта тисне «Перевірити підключення» і бачить превʼю даних.

Разова настройка ~15 хвилин. Потрібні: акаунт Google (будь-який робочий),
доступ до Vercel-проєкту і до Supabase.

---

## Крок 1 · Проєкт у Google Cloud Console

1. Відкрити https://console.cloud.google.com/ (увійти під робочим Google-акаунтом WEEXP).
2. Зверху зліва — селектор проєктів → **New Project**.
   - Project name: `weexp-audit-connector` (будь-яка назва).
   - Location/Organization: лишити як є → **Create**.
3. Переконатися, що новий проєкт ОБРАНО в селекторі (назва видна зверху).

## Крок 2 · Увімкнути два API

(меню ☰ → APIs & Services → **Library**)

Вмикаємо ОДРАЗУ все, що використовуватиме аудит (безкоштовно, нічого не ламає):

1. **Google Analytics Data API** → Enable — метрики GA4 (сесії/замовлення/виручка).
2. **Google Analytics Admin API** → Enable — список властивостей клієнта.
3. **Google Search Console API** → Enable — кліки/покази/запити з GSC
   (те саме підключення клієнта покриває і GSC — scope додано в код).
4. (опційно, на майбутнє) **Content API for Shopping** → Enable — Merchant Center.
5. (опційно) **Tag Manager API** → Enable — читання контейнерів GTM.
6. **PageSpeed Insights API** → Enable — швидкість/Core Web Vitals по URL
   (БЕЗ OAuth: працює одразу; опційно створіть API key — Credentials →
   Create credentials → API key → у Vercel як `PAGESPEED_API_KEY`, квота 25k/день).

На перспективу (безкоштовно, вмикається так само в Library):
7. **Chrome UX Report API** — польові Core Web Vitals по origin (CrUX),
   історія по місяцях — для трендів швидкості в аудиті.
8. **Google Sheets API** + **Google Drive API** — автоматична видача клієнту
   живих таблиць (Гант, юніт-моделі, реєстр знахідок) замість статичних файлів.
9. **BigQuery API** — якщо у клієнта налаштований експорт GA4 → BigQuery:
   аудит сирих подій без семплювання.
10. **Safe Browsing API** — перевірка, чи не позначений сайт клієнта як небезпечний.

⚠ **Google Ads API — окрема історія**: крім увімкнення API потрібен
**Developer Token** (Google Ads → Tools → API Center), який Google видає
за заявкою і розглядає днями. Увімкнути API можна зараз, але конектор
для Ads підключимо окремим кроком, коли буде токен.

## Крок 3 · Екран згоди (OAuth consent screen)

(APIs & Services → **OAuth consent screen**; у новому інтерфейсі це
«Google Auth Platform → Branding/Audience»)

1. User type: **External** → Create.
2. Branding:
   - App name: `WEEXP Audit` (це побачить клієнт у вікні Google).
   - User support email: ваша робоча пошта.
   - App domain / Authorized domains: `weexp.agency`.
   - Developer contact email: та сама пошта. → Save.
3. Scopes → **Add or remove scopes** → знайти й позначити:
   - `.../auth/analytics.readonly` (Google Analytics, read-only)
   - `.../auth/webmasters.readonly` (Search Console, read-only)
   - `openid`, `.../auth/userinfo.email`
   → Update → Save.
4. Audience / Test users → **Add users** → додати:
   - свою пошту (для тесту),
   - пошти клієнтів, які підключатимуться (див. «Важливо про режими» нижче).

## Крок 4 · Створити OAuth Client (Web application)

(APIs & Services → **Credentials** → **+ Create credentials** → **OAuth client ID**)

1. Application type: **Web application**.
2. Name: `weexp-ga4-connector`.
3. **Authorized redirect URIs** → Add URI → вставити РІВНО:

   ```
   https://weexp.agency/api/ga4
   ```

   ⚠ Найчастіші помилки саме тут:
   - без слеша в кінці (`…/api/ga4`, НЕ `…/api/ga4/`);
   - без query-параметрів (`?action=…` додавати НЕ треба — Google їх не приймає,
     наш код розпізнає callback за параметром `code`);
   - схема `https`, домен без `www`.
   - (опційно, для тестів прев'ю-деплоїв можна додати другим рядком
     `https://<preview-домен>.vercel.app/api/ga4`)
4. **Create** → зʼявиться вікно з **Client ID** і **Client secret** → скопіювати обидва
   (secret більше не покажуть — за потреби створюється новий).

## Крок 5 · Змінні у Vercel

(Vercel → проєкт сайту → Settings → **Environment Variables** → Production)

| Name | Value |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Client ID з кроку 4 (закінчується на `.apps.googleusercontent.com`) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Client secret з кроку 4 |

Після додавання — **Redeploy** останнього деплою (env підхоплюються на деплої).

Також мають існувати (вже стоять для інших функцій):
`SUPABASE_URL` (або `VITE_SUPABASE_URL`) і `SUPABASE_SERVICE_ROLE_KEY`.

## Крок 6 · Таблиця в Supabase

Supabase → SQL Editor → New query → вставити вміст `docs/ga-connections.sql` → Run.
(Створює `ga_connections` з RLS deny-all — токени читає лише сервер.)

## Крок 7 · Перевірка end-to-end

1. Зайти в кабінет клієнта → Документи → картка **Google Analytics 4** →
   **«Підключити конектор»** → вікно Google → обрати акаунт, у якого Є доступ
   до GA4 → Allow.
2. Повернення в кабінет: тост «✓ Google Analytics підключено», статус «Підключено»,
   під карткою — email акаунта і властивості.
3. Адмінка → Користувачі → картка цього клієнта → блок
   **«Аналітика клієнта (GA4)»** → «Перевірити підключення» → обрати властивість →
   **«Превʼю даних (30 дн)»** → сесії/замовлення/виручка/CR/чек + канали + пристрої.

---

## Важливо про режими додатку (Testing vs Published)

- Scope `analytics.readonly` — «sensitive», тому в режимі **Testing**:
  - підключитися можуть ЛИШЕ пошти зі списку Test users (до 100);
  - refresh-токени живуть **7 днів** — раз на тиждень клієнту доведеться
    перепідключатися.
- Для бойової роботи: OAuth consent screen → **Publish app**.
  - Після публікації Google покаже «unverified app» попередження
    (клієнт тисне Advanced → Continue) — працює, токени безстрокові.
  - Щоб прибрати попередження повністю — пройти верифікацію Google
    (форма в консолі; потрібні домен, privacy policy на сайті — у нас є).
- Практична стратегія: опублікувати одразу; верифікацію подати паралельно.

## Якщо щось пішло не так

| Симптом | Причина → що робити |
|---|---|
| `redirect_uri_mismatch` у вікні Google | URI в кроці 4 не збігається байт-у-байт → виправити на `https://weexp.agency/api/ga4` |
| `access_denied` / «app not verified» блокує | режим Testing і пошти немає в Test users → додати пошту або Publish app |
| Повернення з `ga=error&reason=store` | не виконано SQL з кроку 6 або немає `SUPABASE_SERVICE_ROLE_KEY` |
| Кнопка каже «конектор не налаштовано» | env з кроку 5 не задані або деплой не перезапущено |
| «властивостей не знайдено» після підключення | акаунт, під яким увійшов клієнт, не має доступу до жодної GA4-властивості → нехай увійде під тим акаунтом, який бачить їхню аналітику |
| Превʼю каже `invalid_grant` | refresh-токен протух (Testing-режим, 7 днів) → клієнт перепідключається; для постійної роботи — Publish app |
