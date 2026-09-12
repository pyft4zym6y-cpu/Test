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
 * Режим --contrast шукає третю хворобу: текст, якого не видно взагалі. У
 * index.css роками стояло глобальне h1,h2 { color: var(--paper) } — спадок
 * темної версії сайту. Кожен заголовок, чий власний клас не задавав колір
 * явно, ставав БІЛИМ на кремовому тлі. Так зникли назви форматів на новій
 * сторінці послуг і чотири заголовки в кабінеті клієнта — «Дорожня карта»,
 * «Команда», «Фінансовий календар», «Помісячна тарифікація». Ні розкладка, ні
 * тести цього не бачили: елемент є, розмір правильний, текст на місці.
 *
 * Поріг навмисно низький (2.0 при нормі WCAG 4.5): шукаємо не «слабкий
 * контраст», а «не видно». Інструмент, що кричить на кожен сірий підпис,
 * нічим не кращий за той, що мовчить.
 *
 *   node scripts/checkFit.mjs [http://127.0.0.1:8127]
 *   node scripts/checkFit.mjs [url] --vertical
 *   node scripts/checkFit.mjs [url] --contrast
 */
import { createRequire } from 'node:module';

// playwright резолвимо від робочої теки: скрипт живе тут, а браузер стоїть у
// worker/. Скрипти запускаються з worker — див. exportPdf.mjs.
const { chromium } = createRequire(process.cwd() + '/').call(null, 'playwright');

const ARGS = process.argv.slice(2);
const VERTICAL = ARGS.includes('--vertical');
const CONTRAST = ARGS.includes('--contrast');
const BASE = ARGS.find((a) => a.startsWith('http')) || 'http://127.0.0.1:8127';

/* Телефонні вікна МІНУС хром браузера — саме та висота, яку реально бачить
   людина, а не діагональ пристрою з реклами. */
const PHONES = [[430, 720], [430, 660], [428, 746], [414, 715], [412, 732],
                [393, 660], [390, 700], [375, 553], [360, 640], [320, 600]];
const WIDTHS = [320, 360, 390, 430, 540, 768, 1024, 1280, 1600];
/* Сторінки, де живуть найдовші заголовки й найщільніші сітки. */
const PATHS = ['/', '/en', '/systems', '/proof', '/pricing', '/expansion', '/people', '/audit-pack',
  // Послуги: хаб і одна сторінка формату. У картці формату найдовші рядки —
  // ціна з періодом в один ряд і перелік «що входить».
  '/services', '/services/audit',
  // Блог: хаб і одна стаття. У статті найширший вміст сайту — таблиці, — і
  // саме вони найпростіше виносять сторінку за екран телефона.
  '/blog', '/blog/unit-ekonomika-ecommerce'];
/** Допуск на субпіксельне округлення шрифтових метрик. */
const SLACK = 1.5;

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

if (CONTRAST) {
  /*
   * Текст, якого не видно: колір тексту майже збігається з тлом під ним.
   *
   * Тло шукаємо вгору по предках до першого непрозорого — саме так його
   * бачить око. Прозорість самого кольору враховуємо: rgba(20,18,16,.1) на
   * кремовому — це світло-сірий, а не чорний.
   */
  const bad = [];
  for (const path of PATHS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    // Догортуємо до низу: блоки з reveal лишаються прозорими, поки їх не побачили.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    const rows = await page.evaluate(() => {
      const rgb = (v) => {
        const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/.exec(v || '');
        return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
      };
      const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
      const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

      const out = [];
      for (const el of document.querySelectorAll('h1, h2, h3, h4, p, li, a, span, b, strong, td, th, button, label')) {
        // Тільки ВЛАСНИЙ текст: інакше кожен контейнер повторює текст дітей.
        const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        if (!own) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const box = el.getBoundingClientRect();
        if (box.width < 4 || box.height < 4) continue;
        // Невидимі предки (скрол-сцени на opacity 0, приховані блоки).
        let opac = 1, hid = false;
        for (let a = el; a; a = a.parentElement) { const p = getComputedStyle(a);
          if (p.display === 'none' || p.visibility === 'hidden') { hid = true; break; }
          opac *= +p.opacity; }
        if (hid || opac < 0.5) continue;
        // Прихований службовий вміст пререндера (clip: rect(0 0 0 0)).
        if (el.closest('[style*="clip:rect(0 0 0 0)"], [style*="clip: rect(0 0 0 0)"]')) continue;
        /*
         * aria-hidden — декорація, яку скрінрідер не читає й людина не має
         * читати: величезні «примарні» числа на тлі /proof намальовані
         * обведенням при прозорій заливці, і за кольором заливки вони мають
         * контраст 1:1. Це не «текст, якого не видно», а фон.
         */
        if (el.closest('[aria-hidden="true"]')) continue;

        let bg = null;
        for (let a = el; a; a = a.parentElement) {
          const c = rgb(getComputedStyle(a).backgroundColor);
          if (c && c.a > 0.85) { bg = c; break; }
        }
        if (!bg) bg = { r: 255, g: 255, b: 255, a: 1 };
        const fg = rgb(cs.color);
        if (!fg) continue;
        const r = ratio(over(fg, bg), bg);
        if (r < 2) out.push({ ratio: +r.toFixed(2), tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 40), text: own.slice(0, 46),
          fg: cs.color, bg: `rgb(${bg.r},${bg.g},${bg.b})` });
      }
      return out;
    });
    for (const r of rows) bad.push({ path, ...r });
    await page.close();
  }
  await browser.close();
  if (!bad.length) {
    console.log(`fit --contrast: чисто — ${PATHS.length} сторінок`);
    process.exit(0);
  }
  console.log(`fit --contrast: ${bad.length} місць, де текст не видно\n`);
  for (const b of bad.sort((x, y) => x.ratio - y.ratio)) {
    console.log(`  ${b.path.padEnd(14)} ${String(b.ratio).padStart(5)}:1  ${b.tag}.${b.cls}  ${b.fg} на ${b.bg}  «${b.text}»`);
  }
  process.exit(1);
}

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
