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
 *   node scripts/checkFit.mjs [url] --vertical   (фіксований хром поверх тексту)
 *   node scripts/checkFit.mjs [url] --contrast
 *
 * Режим --wrap ловить четверту хворобу: підпис, який ліг на два рядки.
 * Заголовок переносити можна й треба, а КНОПКА, пункт меню, вкладка чи чип —
 * ні: «Порахувати витік» у два рядки читається як два різні написи, ламає
 * висоту ряду й лишає під собою порожнє місце. Міряємо число рядків у самому
 * вузлі — кількістю прямокутників, які повертає getClientRects() для його
 * тексту, — на всіх дев'яти ширинах.
 *
 *   node scripts/checkFit.mjs [url] --wrap
 *
 * Режим --orphan ловить п'яту: речення, з якого на новий рядок з'їхало одне-два
 * слова. Це не «перенос узагалі» — абзац на три рівні рядки читається добре, —
 * а саме висяче слово: рядок із одного слова під повним рядком читається як
 * обрив, а в картці ще й тягне за собою зайву висоту. Міряємо, скільки СЛІВ
 * стоїть в останньому візуальному рядку заголовка, ліда й підпису картки.
 *
 *   node scripts/checkFit.mjs [url] --orphan
 */
import { createRequire } from 'node:module';

// playwright резолвимо від робочої теки: скрипт живе тут, а браузер стоїть у
// worker/. Скрипти запускаються з worker — див. exportPdf.mjs.
const { chromium } = createRequire(process.cwd() + '/').call(null, 'playwright');

const ARGS = process.argv.slice(2);
const VERTICAL = ARGS.includes('--vertical');
const CONTRAST = ARGS.includes('--contrast');
const WRAP = ARGS.includes('--wrap');
const ORPHAN = ARGS.includes('--orphan');
const BASE = ARGS.find((a) => a.startsWith('http')) || 'http://127.0.0.1:8127';

/* Телефонні вікна МІНУС хром браузера — саме та висота, яку реально бачить
   людина, а не діагональ пристрою з реклами. */
const PHONES = [[430, 720], [430, 660], [428, 746], [414, 715], [412, 732],
                [393, 660], [390, 700], [375, 553], [360, 640], [320, 600]];
const WIDTHS = [320, 360, 390, 430, 540, 768, 1024, 1280, 1600];
/* Сторінки, де живуть найдовші заголовки й найщільніші сітки. */
const PATHS = ['/', '/en', '/proof', '/expansion', '/people', 
  // Послуги: хаб і одна сторінка формату. У картці формату найдовші рядки —
  // ціна з періодом в один ряд і перелік «що входить».
  '/services', '/services/audit',
  // Діагностика: під формою тепер лежить перелік із 16 видів аудиту.
  '/diagnose',
  // Блог: хаб і одна стаття. У статті найширший вміст сайту — таблиці, — і
  // саме вони найпростіше виносять сторінку за екран телефона.
  '/blog', '/blog/unit-ekonomika-ecommerce'];
/** Допуск на субпіксельне округлення шрифтових метрик. */
const SLACK = 1.5;

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

if (ORPHAN) {
  /*
   * Жодних висячих 1–2 слів.
   *
   * Перевіряємо ролі, де речення має читатись цілим: заголовки, ліди,
   * підзаголовки, обіцянки карток. Тіло статті блогу сюди НЕ входить — там
   * довга проза, і вимагати від неї рівних рядків означало б переписувати
   * сорок лонгридів під ширину екрана.
   *
   * Рахуємо не рядки, а слова в ОСТАННЬОМУ рядку: рівний абзац у три рядки —
   * норма, а той самий абзац, де останнє слово з'їхало саме, — дефект.
   */
  const SEL = [
    '.sysx h1', '.sysx h2', '.sysx h3',
    '.sysx-lead', '.sysx-sub', '.hb-claim-h', '.hb-case-lead', '.hb-serv-promise',
    '.cf-heroLabel', '.cf-money', '.srv-lead', '.srvf-promise', '.symp-q',
  ].join(', ');
  const bad = [];
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const path of PATHS) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(250);
      const rows = await page.evaluate((sel) => {
        const out = [];
        for (const el of document.querySelectorAll(sel)) {
          if (el.closest('.blogp-body, .blogp-toc, footer')) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
          let hidden = false;
          for (let a = el.parentElement; a; a = a.parentElement) {
            const p = getComputedStyle(a);
            if (p.display === 'none' || p.visibility === 'hidden' || +p.opacity === 0) { hidden = true; break; }
          }
          if (hidden) continue;

          /*
           * Кожне слово міряємо окремим Range і групуємо за верхом його
           * прямокутника: так виходить розкладка «слово → візуальний рядок»,
           * якої не дає ні висота вузла, ні число прямокутників тексту.
           */
          const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          const lines = new Map();
          const r = document.createRange();
          let total = 0;
          for (let n = walk.nextNode(); n; n = walk.nextNode()) {
            const t = n.textContent;
            for (const m of t.matchAll(/\S+/g)) {
              r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
              const box = r.getBoundingClientRect();
              if (!box.width) continue;
              const key = Math.round(box.top);
              lines.set(key, (lines.get(key) || 0) + 1);
              total++;
            }
          }
          if (lines.size < 2 || total < 4) continue;   // один рядок або зовсім короткий підпис
          const last = [...lines.entries()].sort((a, b) => a[0] - b[0]).at(-1)[1];
          if (last <= 2)
            out.push({ last, rows: lines.size,
              cls: (el.className || '').toString().slice(0, 30),
              text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 52) });
        }
        return out;
      }, SEL);
      for (const x of rows) bad.push({ path, width, ...x });
    }
    await page.close();
  }
  await browser.close();
  if (!bad.length) {
    console.log(`fit --orphan: чисто — ${PATHS.length} сторінок × ${WIDTHS.length} ширин`);
    process.exit(0);
  }
  console.log(`fit --orphan: ${bad.length} речень із висячим словом\n`);
  for (const b of bad.sort((x, y) => x.last - y.last)) {
    console.log(`  ${String(b.width).padStart(4)}px ${b.path.padEnd(14)} ${b.last} сл. у ${b.rows}-му рядку  ${b.cls.padEnd(22)} «${b.text}»`);
  }
  process.exit(1);
}

if (WRAP) {
  /*
   * Один підпис — один рядок.
   *
   * Перевіряємо тільки ті ролі, де перенос — помилка: кнопки (.sysx-cta,
   * .sysh-cta), пункти меню й шторки, вкладки нижньої панелі, чипи й бейджі,
   * підписи-мітки. Заголовки, ліди й абзаци сюди не входять: там перенос
   * нормальний, і сторож, який кричав би й на них, нічого не вартий.
   */
  const SEL = [
    '.sysx-cta', '.sysh-cta', '.sysh-link', '.sysh-sheet-link', '.sysh-tab span',
    '.hb-serv-link', '.srv-foot-link', '.srvf-pack-link', '.symp-where', '.symp-all',
    '.sysx-kick', '.hb-claim-link', '.blogt-all', '.srv-table thead th', '.srvf-kind-n',
    // Числа кейсів: одне число — один рядок, і воно має вміщатись у свою комірку.
    '.hb-num b',
  ].join(', ');
  const bad = [];
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(BASE + (ARGS.find((a) => a.startsWith('/')) || '/'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    for (const path of PATHS) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(250);
      const rows = await page.evaluate((sel) => {
        const out = [];
        for (const el of document.querySelectorAll(sel)) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
          let hidden = false;
          for (let a = el.parentElement; a; a = a.parentElement) {
            const p = getComputedStyle(a);
            if (p.display === 'none' || p.visibility === 'hidden' || +p.opacity === 0) { hidden = true; break; }
          }
          if (hidden) continue;
          const box = el.getBoundingClientRect();
          if (box.height < 2) continue;
          /*
           * Рахуємо рядки самого ТЕКСТУ, а не висоту вузла: у кнопки є
           * padding, і ділити висоту на line-height — гадати. Range над
           * текстовими вузлами дає рівно стільки прямокутників, скільки
           * візуальних рядків зайняв напис.
           */
          const r = document.createRange();
          let lines = 0, text = '';
          for (const n of el.childNodes) {
            if (n.nodeType !== 3 || !n.textContent.trim()) continue;
            r.selectNodeContents(n);
            const tops = new Set([...r.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.top)));
            lines = Math.max(lines, tops.size);
            text += n.textContent.trim() + ' ';
          }
          if (lines > 1) out.push({ lines, cls: (el.className || '').toString().slice(0, 36), text: text.trim().slice(0, 44) });
          /*
           * Друга хвороба того самого місця: підпис із white-space: nowrap
           * не переноситься — він ВИЛАЗИТЬ. Рядок один, тож перевірка вище
           * його не побачить, а горизонтальна теж ні: у блокового елемента
           * бокс дорівнює комірці, і за межі виходить лише текст усередині.
           * Саме так «≥19 млн ₴» на 900px виїжджало з колонки на 40px.
           */
          if (cs.whiteSpace.startsWith('nowrap') && el.scrollWidth > el.clientWidth + 1)
            out.push({ lines: 1, over: el.scrollWidth - el.clientWidth,
              cls: (el.className || '').toString().slice(0, 36),
              text: (el.textContent || '').trim().slice(0, 44) });
        }
        return out;
      }, SEL);
      for (const r of rows) bad.push({ path, width, ...r });
    }
    await page.close();
  }
  await browser.close();
  if (!bad.length) {
    console.log(`fit --wrap: чисто — ${PATHS.length} сторінок × ${WIDTHS.length} ширин`);
    process.exit(0);
  }
  console.log(`fit --wrap: ${bad.length} підписів, що не вміщаються в один рядок\n`);
  for (const b of bad.sort((x, y) => (y.lines + (y.over ? 1 : 0)) - (x.lines + (x.over ? 1 : 0)))) {
    const what = b.over ? `вилазить на ${b.over}px` : `${b.lines} рядки`;
    console.log(`  ${String(b.width).padStart(4)}px ${b.path.padEnd(14)} ${what.padEnd(18)} ${b.cls}  «${b.text}»`);
  }
  process.exit(1);
}

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
  /*
   * НАКЛАДАННЯ ФІКСОВАНОГО ХРОМУ НА ТЕКСТ.
   *
   * Режим міряв інше: скільки останній рядок сцени `.sysx-void` заїжджає на
   * рядок логотипів. І сцена, і абсолютний рядок пішли разом зі скрол-фільмом,
   * тож перевірка перетворилась на «елемента не знайдено» — сторож, який падає
   * не тому, що знайшов дефект, а тому, що дивиться на сторінку, якої немає.
   *
   * Клас помилок лишився, але тепер його джерело інше й одне: шапка (fixed
   * зверху) і нижня панель вкладок (fixed знизу, ~58px + safe-area). Вони
   * лежать ПОВЕРХ документа, тож будь-який текст під ними просто не видно —
   * найчастіше це останній блок сторінки й перший рядок під шапкою.
   *
   * Тому міряємо на телефонних вікнах у двох положеннях: на самому верху й у
   * самому низу сторінки.
   */
  const bad = [];
  for (const [width, height] of PHONES) {
    const page = await browser.newPage({ viewport: { width, height } });
    for (const path of ['/', '/proof', '/services', '/diagnose']) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      for (const where of ['top', 'bottom']) {
        await page.evaluate((w) => window.scrollTo(0, w === 'top' ? 0 : document.body.scrollHeight), where);
        await page.waitForTimeout(250);
        const rows = await page.evaluate(() => {
          const chrome = [...document.querySelectorAll('.sysh-nav, .sysh-tabs, .ckc')]
            .filter((el) => getComputedStyle(el).position === 'fixed')
            .map((el) => ({ cls: el.className.toString().split(' ')[0], r: el.getBoundingClientRect() }));
          if (!chrome.length) return [];
          const out = [];
          for (const el of document.querySelectorAll('h1, h2, h3, p, li, a, button, span')) {
            const txt = (el.textContent || '').trim();
            if (!txt) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            if (cs.position === 'fixed' || el.closest('.sysh-nav, .sysh-tabs, .ckc')) continue;
            const b = el.getBoundingClientRect();
            if (b.height < 2 || b.bottom < 0 || b.top > innerHeight) continue;
            // Рахуємо лише ЛИСТЯ: у батька бокс містить дітей і дає ті самі
            // накладання вдруге й втретє.
            if ([...el.children].some((c) => (c.textContent || '').trim())) continue;
            for (const c of chrome) {
              const dy = Math.min(b.bottom, c.r.bottom) - Math.max(b.top, c.r.top);
              const dx = Math.min(b.right, c.r.right) - Math.max(b.left, c.r.left);
              if (dy > 1 && dx > 1)
                out.push({ over: Math.round(dy), by: c.cls, text: txt.slice(0, 34) });
            }
          }
          return out;
        });
        for (const r of rows) bad.push({ width, height, path, where, ...r });
      }
    }
    await page.close();
  }
  await browser.close();
  if (!bad.length) {
    console.log(`fit --vertical: чисто — ${PHONES.length} телефонних вікон × 4 сторінки × верх і низ`);
    process.exit(0);
  }
  console.log(`fit --vertical: ${bad.length} накладань фіксованого хрому на текст\n`);
  for (const b of bad.sort((x, y) => y.over - x.over).slice(0, 40)) {
    console.log(`  ${b.width}×${b.height} ${b.path.padEnd(11)} ${b.where.padEnd(7)} ${b.by.padEnd(11)} +${b.over}px  «${b.text}»`);
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
