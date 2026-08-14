# Деплой школи на піддомен weexp.agency

Сайт школи — окремий Vercel-проєкт із цього ж репозиторію (так само, як
портал). Рекомендований піддомен: `school.weexp.agency` (або
`academy.weexp.agency` — на смак власника).

## Крок 1. Створити проєкт у Vercel

1. https://vercel.com → **Add New → Project** → імпортувати той самий
   GitHub-репозиторій `pyft4zym6y-cpu/Test`.
2. **Root Directory** → натиснути Edit → обрати папку **`school`**. Це
   головне: без цього Vercel збере кореневий сайт.
3. Framework Preset: **Vite** (визначиться автоматично).
   Build Command `npm run build`, Output Directory `dist` — залишити як є.
4. Deploy.

## Крок 2. Production-ветка

Project → **Settings → Git → Production Branch** → вписати
`claude/red-site-react-jmj4i3`.

⚠️ Як і в кореневого сайту, production-ветка — НЕ `main`. Пуші в цю ветку
автоматично деплоять школу.

## Крок 3. Піддомен

1. Project → **Settings → Domains → Add** → ввести `school.weexp.agency`.
2. Vercel покаже DNS-запис. Оскільки домен weexp.agency вже обслуговується
   Vercel-ом (проєкт `weexp`), зазвичай достатньо підтвердити — Vercel сам
   запропонує прив'язати піддомен. Якщо ні: у DNS реєстратора додати
   CNAME `school` → `cname.vercel-dns.com`.

## Крок 4. Приймання заявок (env-змінні)

Форма запису шле POST на `/api/enroll` (serverless-функція в `school/api/`).
Щоб заявки приходили, у Vercel-проєкті школи: **Settings → Environment
Variables** → додати:

- `RESEND_API_KEY` — той самий ключ Resend, що на основному сайті
  (обовʼязково для email-каналу);
- `NOTIFY_EMAIL` / `NOTIFY_FROM` — опційно (за замовчуванням — пошта
  засновника);
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — опційно, дублювання заявок у
  Telegram (створити бота через @BotFather, chat_id — свій).

Після додавання змінних — Redeploy. Поки змінні не задані, форма
автоматично відкриває поштовий клієнт (mailto) — заявки не губляться.

## Що вже готово в репозиторії

- `school/vercel.json` — кеш-заголовки для статичних асетів.
- Роутинг — HashRouter (`/#/courses`), тому rewrites не потрібні.
  Якщо колись перейдемо на BrowserRouter — додати в `school/vercel.json`
  rewrites як у кореневому `vercel.json`.
- Збірка перевірена: `cd school && npm install && npm run build`.

## Перевірка після деплою

- [ ] Головна відкривається, шрифти Oswald/Caveat підвантажилися
- [ ] Відео в секції-маніфесті грає (Cloudinary)
- [ ] Переходи `/#/courses`, `/#/program`, `/#/enroll` працюють
- [ ] Форма запису відкриває поштовий клієнт із заявкою
