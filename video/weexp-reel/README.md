# WEEXP — Remotion motion-graphics (video generation)

Брендові промо-відео сайту weexp.agency. Рендер справжнього mp4/H.264.

## Рендер
```bash
npm install
HS=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell | head -1)
npx remotion render src/index.ts WeexpReel out/reel.mp4 --codec h264 --crf 18 --browser-executable="$HS"
# готовий файл кладемо в weexp-site/public/promo/reel.mp4
```
Композиція `WeexpReel` — 1920×1080, 30fps, ~17с, 4 сцени (Hook → Reframe →
Solution → CTA). Тема бренду — `src/theme.ts` (ink/coral/emerald, Unbounded).
Правила motion-craft — скіл `remotion-motion-graphics`.
