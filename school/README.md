# Школа Commerce Architecture

Сайт школи e-commerce — освітнє крило екосистеми weexp · Commerce OS™
(засновник — Павло Сідоренко, weexp.agency).

Окремий застосунок за тим самим патерном, що й `/portal/` — не залежить від
кореневого сайту.

## Стек

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `motion` (`motion/react`) — анімації
- Шрифти: Italiana (заголовки), Manrope (текст), Marck Script (підпис)

## Команди

```bash
cd school
npm install
npm run dev      # локальна розробка
npm run build    # tsc + vite build → dist/
```

## Контент

- Червона секція-маніфест (`RedHero.tsx`) — точно за дизайн-специфікацією
  (#FF0000, логотип, підпис S.P.D, відео з Cloudinary з градієнтним переходом).
- Програма (`src/data/program.ts`) — з документа Ecommerce_Training_ByLevels_v10:
  12 рівнів · 114 модулів · 1325 питань, три блоки (Базовий 1–4, Середній 5–8,
  Просунутий 9–12).
- Курси на запис: Фундамент, Професіонал, Директор, Повна програма.
- Форма заявки відкриває mailto на pashasidorenko18@gmail.com.
