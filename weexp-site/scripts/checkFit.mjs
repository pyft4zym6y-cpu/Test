/**
 * Перевірка, що текст не вилазить за свій контейнер на реальних ширинах.
 *
 * Знайдено цим скриптом: заголовок першого екрана «Продажі, які не тримаються
 * на вас» на телефоні обрізався по правому краю. Найпідступніше — що це НЕ
 * давало горизонтального скролу: сцена має overflow: hidden, тож
 * document.scrollWidth дорівнював clientWidth, і звичайна перевірка «сторінка
 * не скролиться вбік» показувала, що все гаразд. Слово просто зникало.
 *
 * Тому міряємо не скрол сторінки, а кожен помітний текстовий вузол проти
 * ВНУТРІШНЬОЇ ширини його контейнера. Це ловить і обрізання, і виліт.
 *
 * Вертикальний режим (--vertical) перевіряє інше: чи не лягає вміст першого
 * екрана на бігучий рядок партнерів і чи не йде за нижній край. Це окрема
 * хвороба: сцена — нескрольована, висотою рівно 100dvh, а хром браузера на
 * телефоні забирає в неї третину. Горизонтальна перевірка її не бачить.
 *
 * jsdom для цього не годиться — у нього немає розкладки; тому це скрипт, а не
 * vitest-тест. Запуск проти будь-якої збірки:
 *   node scripts/checkFit.mjs [http://127.0.0.1:8127]
 *   node scripts/checkFit.mjs [url] --vertical
 */
import { chromium } from 'playwright';

const ARGS = process.argv.slice(2);
const VERTICAL = ARGS.includes('--vertical');
const BASE = ARGS.find((a) => a.startsWith('http')) || 'http://127.0.0.1:8127';

/* Телефонні вікна МІНУС хром браузера — саме та висота, яку реально бачить
   людина, а не діагональ пристрою з реклами. */
const PHONES = [[430, 720], [430, 660], [428, 746], [414, 715], [412, 732],
                [393, 660], [390, 700], [375, 553], [360, 640], [320, 600]];
const WIDTHS = [320, 360, 390, 430, 540, 768, 1024, 1280, 1600];
/* Сторінки, де живуть найдовші заголовки й найщільніші сітки. */
const PATHS = ['/', '/en', '/systems', '/proof', '/pricing', '/expansion', '/people', '/audit-pack',
  // Блог: хаб і одна стаття. У статті найширший вміст сайту — таблиці, — і
  // саме вони найпростіше виносять сторінку за екран телефона.
  '/blog', '/blog/unit-ekonomika-ecommerce'];
/** Допуск на субпіксельне округлення шрифтових метрик. */
const SLACK = 1.5;

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

if (VERTICAL) {
  const bad = [];
  for (const [width, height] of PHONES) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const rows = await page.evaluate(() => {
      const scene = document.querySelector('.sysx-void');
      if (!scene) return [{ cls: '(сцену .sysx-void не знайдено)', overMarq: 1, overView: 1 }];
      const marq = document.querySelector('.sysx-marquee');
      const mTop = marq ? marq.getBoundingClientRect().top : Infinity;
      return [...scene.children].map((el) => {
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        if (cs.display === 'none' || +cs.opacity === 0 || b.height < 2) return null;
        return {
          cls: (el.className || '').toString().slice(0, 30),
          overMarq: Math.round(b.bottom - mTop),
          overView: Math.round(b.bottom - window.innerHeight),
        };
      }).filter(Boolean).filter((r) => r.overMarq > 0 || r.overView > 0);
    });
    for (const r of rows) bad.push({ width, height, ...r });
    await page.close();
  }
  await browser.close();
  if (!bad.length) {
    console.log(`fit --vertical: чисто — ${PHONES.length} телефонних вікон`);
    process.exit(0);
  }
  console.log(`fit --vertical: ${bad.length} наложень на першому екрані\n`);
  for (const b of bad) {
    console.log(`  ${b.width}×${b.height}  ${b.cls.padEnd(30)} на рядок партнерів +${b.overMarq}px, за екран +${b.overView}px`);
  }
  process.exit(1);
}

const problems = [];
for (const path of PATHS) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const found = await page.evaluate((slack) => {
      const out = [];
      for (const el of document.querySelectorAll('h1, h2, h3, p, li, a, span, b')) {
        if (!el.textContent?.trim()) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        // Елемент може бути невидимим через предка (скрол-сцени лежать на 0).
        let hidden = false;
        for (let a = el.parentElement; a; a = a.parentElement) {
          const p = getComputedStyle(a);
          if (p.display === 'none' || p.visibility === 'hidden' || +p.opacity === 0) { hidden = true; break; }
        }
        if (hidden) continue;
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) continue;

        /*
         * Абсолютні й фіксовані елементи навмисно стоять поза потоком і
         * можуть виходити за padding-box предка: значок «+» у кутку картки,
         * номер розділу на полі. Перша версія цієї перевірки їх не пропускала
         * і видала 400+ «знахідок», з яких справжніх було кілька — інструмент,
         * що кричить на все, нічим не кращий за той, що мовчить.
         */
        if (cs.position === 'absolute' || cs.position === 'fixed') continue;
        // Відʼємні поля — теж свідомий вихід за межі (виносні заголовки).
        if (['marginLeft', 'marginRight'].some((m) => parseFloat(cs[m] || '0') < 0)) continue;

        const parent = el.parentElement;
        if (!parent) continue;
        const pcs = getComputedStyle(parent);
        // Контейнер, який сам скролиться по горизонталі, ширший за свій бокс — це нормально.
        if (pcs.overflowX === 'auto' || pcs.overflowX === 'scroll') continue;
        const pbox = parent.getBoundingClientRect();
        const inner = {
          left: pbox.left + parseFloat(pcs.paddingLeft || '0'),
          right: pbox.right - parseFloat(pcs.paddingRight || '0'),
        };
        const over = Math.max(box.right - inner.right, inner.left - box.left);
        if (over > slack) {
          out.push({
            over: Math.round(over),
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 48),
            text: el.textContent.trim().slice(0, 52),
          });
        }
      }
      return out;
    }, SLACK);

    // Один і той самий вузол ловиться і як <h1>, і як <span> усередині: беремо найгірше.
    const seen = new Map();
    for (const f of found) {
      const key = f.tag + '|' + f.cls + '|' + f.text;
      if (!seen.has(key) || seen.get(key).over < f.over) seen.set(key, f);
    }
    for (const f of seen.values()) problems.push({ path, width, ...f });
    await page.close();
  }
}
await browser.close();

if (!problems.length) {
  console.log(`fit: чисто — ${PATHS.length} сторінок × ${WIDTHS.length} ширин`);
  process.exit(0);
}
console.log(`fit: ${problems.length} виходів за контейнер\n`);
for (const p of problems.sort((a, b) => b.over - a.over)) {
  console.log(`  ${String(p.width).padStart(4)}px ${p.path.padEnd(12)} +${String(p.over).padStart(3)}px  ${p.tag}.${p.cls}  «${p.text}»`);
}
process.exit(1);
