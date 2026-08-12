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
