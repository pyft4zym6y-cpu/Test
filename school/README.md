# Школа Commerce Architecture

Сайт онлайн-школи e-commerce «Commerce Architecture» (засновник — Павло
Сидоренко). Окремий застосунок за тим самим патерном, що й `/portal/` — не
залежить від кореневого сайту.

## Стек

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `motion` (`motion/react`) — анімації
- `react-router-dom` (HashRouter) — багатосторінкова структура
- Шрифти: Oswald (заголовки), Manrope (текст), Caveat + Marck Script (рукописні акценти)

## Дизайн

Комікс-стиль: жирні Oswald-заголовки з червоними плашками (`.redmark`),
хардові тіні (`.hard-shadow`), товсті чорні рамки (`.comic-border`),
halftone-крапки, спіч-бабли, зіркові «вибухи» (Burst), біжучий рядок.
Палітра: paper `#FFFDF8`, ink `#111`, brand `#FF0000`, sun `#FFD100`.
UI-кіт — `src/components/comic.tsx`.

## Сторінки

`/` головна · `/about` місія, візія, цінності, засновник · `/courses`
каталог (загальні треки + точкові курси) · `/courses/:id` сторінка курсу ·
`/program` 12 рівнів програми · `/enroll` запис · `/faq` · `/contacts` ·
`/privacy` · `/terms` · 404.

## Контент

- Смислова база (позиціонування, місія, візія, цінності, FAQ) — `src/data/school.ts`.
- Програма — `src/data/program.ts`, з документа Ecommerce_Training_ByLevels_v10:
  12 рівнів · 114 модулів · 1325 питань.
- Курси — `src/data/courses.ts`: 4 загальні треки + 12 точкових курсів (з них 3 експертні)
  із практикумами, шаблонами та апсел-ланцюжком «Куди далі».
- Форма заявки відкриває mailto на пошту школи.

## Команди

```bash
cd school
npm install
npm run dev      # локальна розробка
npm run build    # tsc + vite build → dist/
```
