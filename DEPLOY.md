# weexp · Commerce OS — деплой и правки

Сайт: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion.
Многостраничный SPA (react-router), язык — украинский.

---

## 1. Локальный запуск

Нужен Node.js 18+ (https://nodejs.org).

```bash
npm install        # один раз — поставить зависимости
npm run dev        # dev-сервер на http://localhost:5173 с горячей перезагрузкой
npm run build      # продакшн-сборка в папку dist/
npm run preview    # посмотреть собранную версию локально
```

**Всё, что нужно выкладывать на хостинг, — содержимое папки `dist/` после
`npm run build`.** Ничего больше.

---

## 2. Роутер переключается сам

Обычная сборка (`npm run build`, деплой на Vercel/Netlify/Apache) использует
**BrowserRouter** — чистые URL вида `site.com/cases`, которые индексирует
Google. Артефакт-сборка (`vite.artifact.config.ts`) автоматически собирается
с HashRouter (`/#/cases`) — он нужен только для страницы-артефакта Claude.
Ничего переключать вручную не нужно. Конфиги для отдачи SPA по любому URL
уже лежат в репозитории:

| Хостинг | Файл | Делать ничего не надо |
|---|---|---|
| Netlify | `public/_redirects` | попадает в dist автоматически |
| Vercel | `vercel.json` | лежит в корне |
| Apache (shared-хостинг, cPanel) | `public/.htaccess` | попадает в dist автоматически |

---

## 3. Варианты хостинга (по простоте)

### Вариант А — Netlify (рекомендую, бесплатно)
1. `npm run build`
2. Зайти на https://app.netlify.com → Sites → **перетащить папку `dist/` мышкой** в окно.
   Сайт сразу получит адрес вида `random-name.netlify.app`.
3. Домен: Site settings → Domain management → Add custom domain → ввести свой
   домен → у регистратора домена прописать DNS, которые покажет Netlify
   (обычно A-запись `75.2.60.5` или CNAME на `<site>.netlify.app`).
   SSL-сертификат выпустится автоматически.
4. Обновление сайта = снова `npm run build` и перетащить `dist/`.
   Либо подключить GitHub-репозиторий (Add new site → Import from Git) — тогда
   каждый `git push` деплоится сам: build command `npm run build`, publish
   directory `dist`.

### Вариант Б — Vercel
1. https://vercel.com → Add New → Project → импортировать GitHub-репозиторий.
2. Framework: Vite (определится сам). Deploy.
3. Домен: Project → Settings → Domains → добавить свой, прописать DNS по подсказке.
   Каждый `git push` — автодеплой.

### Вариант В — обычный шаред-хостинг (cPanel/FTP, напр. укр. хостинги)
1. `npm run build`
2. Залить **содержимое** `dist/` (не саму папку) в `public_html/` через
   файловый менеджер cPanel или FTP (FileZilla).
3. `.htaccess` уже внутри — SPA и кеширование заработают сразу.
4. Домен и SSL (Let's Encrypt) включаются в панели хостинга.

---

## 4. Чек-лист после переезда на домен

- [ ] `index.html`: раскомментировать блок `og:image` и подставить свой домен
      (картинка `og-image.png` уже в сборке)
- [ ] `public/sitemap.xml`: заменить `https://YOUR-DOMAIN` на свой домен
- [ ] `public/robots.txt`: раскомментировать строку `Sitemap:` и подставить домен
- [ ] Google Search Console: добавить сайт, отправить sitemap
- [ ] Аналитика — раздел 5
- [ ] Форма — раздел 6
- [ ] Заменить события в блоке «Медіа» (`src/components/Media.tsx`) на реальные
      и реквизиты в `src/pages/LegalPages.tsx` на настоящие

## 5. Аналитика (GA4 / GTM)

События уже отправляются в `window.dataLayer`: `page_view` (каждая страница),
`cta_click` (кнопки «Забронювати сесію», с меткой места), `lead_submit`
(отправка формы, с оборотом). Осталось подключить контейнер:

1. Создать аккаунт GA4 (https://analytics.google.com) и/или GTM
   (https://tagmanager.google.com).
2. Вставить их сниппет в `index.html` сразу после `<head>`.
3. В GTM создать триггеры Custom Event на `page_view`, `cta_click`,
   `lead_submit` и повесить теги GA4. Без хостинга ничего не отправляется —
   заготовка «спит».

## 6. Форма заявки → бэкенд (вместо mailto)

Сейчас форма открывает почтовый клиент (mailto) — на своём хостинге замените
на сервис форм, чтобы лиды не терялись:

1. Зарегистрироваться на https://formspree.io (бесплатно до 50 заявок/мес),
   создать форму, получить endpoint вида `https://formspree.io/f/abcdwxyz`.
2. В `src/components/LeadForm.tsx` в `handleSubmit` заменить блок с
   `navigator.clipboard` и `window.location.href = mailto...` на:

```ts
const resp = await fetch('https://formspree.io/f/ВАШ_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ name, store, phone, turnover, comment }),
});
if (resp.ok) {
  setSent(true);
  track('lead_submit', { turnover, method: 'formspree' });
  say(`Дякую${name ? `, ${name.trim()}` : ''}! Заявку отримано — відповімо протягом робочого дня.`);
}
```

(функцию объявить `async`: `const handleSubmit = async (e: FormEvent) => …`).
Альтернативы: Web3Forms, Getform, свой webhook в Make/Zapier → CRM или
Google Sheets. Рядом с формой стоит добавить кнопку Telegram с вашим @handle —
для B2B в Украине это часто конвертит лучше формы.

---

## 7. Как править контент: карта файлов

| Что править | Файл |
|---|---|
| Главная (заголовок, CTA, три «двери») | `src/pages/Home.tsx` |
| Подход: доказательства, статус-кво, цена бездействия | `src/components/NewSections.tsx` |
| Система: модули M01–M12 и их описания | `src/components/System.tsx` |
| Продукт: 56 плейбуков, Gold Standards | `src/components/Product.tsx` |
| Экспертиза: 17 направлений | `src/components/Expertise.tsx` |
| Кейсы: обложки и цифры | `src/pages/CasesPage.tsx`, `src/pages/CaseDetailPage.tsx`, `src/components/Cases.tsx` |
| Процесс, команда, ядро | `src/components/Process.tsx` |
| Условия и вилки цен | `src/components/Offers.tsx` |
| О нас, основатель, регалии | `src/components/About.tsx`, `src/components/School.tsx` |
| Блок «Медіа» (конференции) | `src/components/Media.tsx` |
| Форма заявки, email/телефон | `src/components/LeadForm.tsx` |
| Меню и выпадающий список кейсов | `src/components/Nav.tsx` |
| Подвал (контакты, соцсети) | `src/components/Footer.tsx` |
| Юридические страницы, реквизиты | `src/pages/LegalPages.tsx` |
| Реплики AI-ассистента по секциям | `src/components/AssistantBot.tsx` (`SECTION_SAYS`, `ROUTE_IDLE`) |
| Внешний вид ассистента (5 вариантов) | `src/components/botConfig.ts` — поменять `BOT_VARIANT` на 1–5 |
| Цвета, шрифты, токены темы | `src/index.css` |
| Title/description/OG/schema.org | `index.html`, карта заголовков — `src/App.tsx` (`TITLES`) |

Тексты в файлах — обычные строки в разметке: меняете текст → сохраняете →
`npm run dev` показывает результат сразу. Дальше `npm run build` и деплой
(раздел 3). При git-деплое (Netlify/Vercel из репозитория) достаточно
`git add -A && git commit -m "правки" && git push`.

## 8. Пока сайт живёт на ссылке-артефакте Claude

Правки в этом режиме публикуются через чат Claude: попросите изменения — они
вносятся в код, пересобираются и публикуются на тот же URL. Ограничения
артефакта: URL с `#`, нельзя подключить аналитику/внешние сервисы, форма
работает только через mailto.
