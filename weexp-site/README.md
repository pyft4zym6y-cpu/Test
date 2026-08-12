# WEEXP — сайт

Інтерактивний скролл-сайт WEEXP (операційний партнер з e-commerce).
Один безперервний дайджест на наскрізному Independence Score.

## Стек
Vite · React 18 · TypeScript · three.js (WebGL System Map) · GSAP + ScrollTrigger ·
Lenis · Framer Motion · split-type · @fontsource (Unbounded / IBM Plex).

## Розробка
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview
```

## Деплой
Статика в `dist/`. Vercel (auto-detect Vite) або Netlify (`netlify.toml`).
Заголовки безпеки та кеш ассетів — у `vercel.json` / `netlify.toml`.

> Перед деплоєм замініть домен-плейсхолдер `weexp.com.ua` у `index.html`,
> `public/robots.txt`, `public/sitemap.xml` на реальний.

## Форма
Ліди йдуть на `pashasidorenko18@gmail.com` (mailto). Для серверного прийому —
підключити endpoint у `src/components/Contact.tsx`.
