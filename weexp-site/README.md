# WEEXP — сайт

Сайт WEEXP (операційний партнер з e-commerce): звичайні сторінки зі звичайним
скролом. Скрол-фільмів — липких сцен, крізь які «їде камера», — більше немає:
прокрутка рухає сторінку, а не прозорість шарів.

## Стек
Vite · React 18 · TypeScript · @fontsource/golos-text (одна гарнітура на весь
сайт) · three.js — лише як декоративний фон /diagnose і /contact, і лише на
десктопі (див. `src/lib/liteVisuals.ts`).

Тут значились ще GSAP + ScrollTrigger, Lenis, Framer Motion і split-type — стек
скрол-фільмів. Жоден із них не імпортувався з коду вже після переходу на власний
рушій сцен, а після прибирання самих фільмів зник і привід їх повертати.

## Розробка
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview
```

## Деплой на weexp.agency
Мета/канонікал/OG/sitemap налаштовані на `https://weexp.agency`. Node 20 (`.nvmrc`).

**Vercel (рекомендовано):**
1. Import repo → Root Directory `weexp-site` (Vite визначається автоматично).
2. Build `npm run build`, Output `dist`.
3. Settings → Domains → додати `weexp.agency` (+ `www` з редіректом).
4. DNS: `A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com` (точні значення покаже Vercel).

**Netlify:** `netlify.toml` готовий (build `npm run build`, publish `dist`) → Add custom domain.

Security-заголовки, immutable-кеш, `404.html` — у `vercel.json`/`netlify.toml`/`public/`.
CI-гейт якості — `.lighthouserc.json`.

## Форма
Ліди йдуть на `pashasidorenko18@gmail.com` (mailto). Для серверного прийому —
підключити endpoint у `src/components/Contact.tsx`.
