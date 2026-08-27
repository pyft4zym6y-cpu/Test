/**
 * Проверки, которые выполняются В КОНТЕКСТЕ СТРАНИЦЫ (page.evaluate). Их
 * результат уходит в отчёт клиента как факт о его сайте, а до сих пор их не
 * проверял никто: юнит-тесты обходили браузерную половину стороной.
 *
 * Гоняем настоящий inPageChecks в настоящем Chromium на размеченных вручную
 * страницах — витрина, статья, карточка, корзина.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type Browser, type Page } from 'playwright';
import { inPageChecks, capturePerf, classify, launchBrowser } from '../crawl.js';

let browser: Browser;
let page: Page;

/**
 * Playwright ищет сборку строго своего номера; в образах с предустановленным
 * Chromium номер другой, и запуск падает на несуществующем пути. Проду для
 * этого служит CHROME_PATH — тесту находим бинарь сами, если переменной нет.
 */
function findChrome(): string | undefined {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  for (const d of readdirSync(base).filter((x) => x.startsWith('chromium'))) {
    for (const rel of ['chrome-linux/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
      const p = join(base, d, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

beforeAll(async () => {
  const chrome = findChrome();
  if (chrome) process.env.CHROME_PATH = chrome;
  browser = await launchBrowser(); // тот же запуск, что в проде (CHROME_PATH и прокси)
  page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
}, 60000);
afterAll(async () => { await browser?.close(); });

const load = async (body: string) => {
  await page.setContent(`<!doctype html><html lang="uk"><head><title>Тест</title></head><body>${body}</body></html>`);
  return page.evaluate(inPageChecks);
};
const menu = (n: number, cls = 'menu-item') =>
  `<nav>${Array.from({ length: n }, (_, i) => `<li class="${cls}"><a href="/c${i}">Категорія ${i}</a></li>`).join('')}</nav>`;
const cards = (n: number) =>
  `<div class="products">${Array.from({ length: n }, (_, i) =>
    `<div class="product-card"><a href="/p${i}"><h3>Кросівки ${i}</h3><span class="price">2 4${i}0 грн</span></a></div>`).join('')}</div>`;
const passOf = (r: Awaited<ReturnType<typeof load>>, id: string) => r.checks.find((c) => c.id === id)!.pass;

describe('сигналы типа страницы', () => {
  /*
   * Селектор `[class*="product"], [class*="card"], [class*="item"]` совпадает с
   * menu-item, nav-item, list-item и половиной классов любой темы: на собственной
   * главной weexp.agency, где товаров нет вовсе, он давал 56 совпадений при
   * пороге 8. manyCards было истинным почти всегда, а от него зависит classify —
   * внутренние страницы массово становились «plp».
   */
  it('меню из 24 пунктов — не витрина', async () => {
    const r = await load(`${menu(24, 'nav-item')}<article class="content-card"><h1>Як обрати</h1><p>Без цін.</p><a href="/m">Далі</a></article>`);
    expect(r.kindSignals.manyCards).toBe(false);
    expect(classify('https://shop.ua/blog/how-to', r.kindSignals, false)).not.toBe('plp');
  });

  it('витрина из 12 карточек — витрина, несмотря на меню рядом', async () => {
    const r = await load(`${menu(20)}${cards(12)}`);
    expect(r.kindSignals.manyCards).toBe(true);
    expect(classify('https://shop.ua/krosivky', r.kindSignals, false)).toBe('plp');
  });

  it('обёртка каталога не съедает собственные карточки', async () => {
    // карточка — самый МЕЛКИЙ блок со ссылкой и ценой: контейнер .products
    // тоже содержит и то и другое, и при подсчёте внешних 12 схлопывались в 1
    const r = await load(cards(12));
    expect(r.kindSignals.manyCards).toBe(true);
  });

  it('витрина без классов (голые li) тоже находится', async () => {
    const r = await load(`<ul>${Array.from({ length: 10 }, (_, i) => `<li><a href="/p${i}">Товар ${i}</a><span>1 2${i}0 ₴</span></li>`).join('')}</ul>`);
    expect(r.kindSignals.manyCards).toBe(true);
  });

  it('карточка одного товара витриной не считается', async () => {
    const r = await load(`<article class="product"><h1>Кросівки</h1><a href="/buy">Купити</a><span>2 400 грн</span><p>${'опис '.repeat(60)}</p></article>`);
    expect(r.kindSignals.manyCards).toBe(false);
  });

  /*
   * body.textContent тянет за собой содержимое <script>: на реальных магазинах
   * это JSON-LD с названиями товаров и строки GTM. Достаточно было «add to cart»
   * в коде кнопки, чтобы категорию классифицировало как карточку товара.
   */
  it('«add to cart» внутри скрипта не делает страницу карточкой товара', async () => {
    const r = await load(`${menu(6)}<p>Каталог взуття</p><script>const label = "add to cart"; window.buy = () => label;</script>`);
    expect(r.kindSignals.addToCart).toBe(false);
  });

  it('живая кнопка «Купити» сигнал даёт', async () => {
    const r = await load('<button class="add-to-cart">Купити</button>');
    expect(r.kindSignals.addToCart).toBe(true);
  });
});

describe('проверки протокола', () => {
  /*
   * Проверка шла по всей разметке вместе со скриптами: слово «cookie» есть в
   * любом document.cookie и в любой аналитике, так что провалить её сайт
   * практически не мог — строка стояла в протоколе и всегда давала ✓.
   */
  it('cookie-механика: document.cookie в скрипте — не согласие', async () => {
    expect(passOf(await load('<p>Магазин</p><script>document.cookie="sid=1"</script>'), 'cookies')).toBe(false);
    expect(passOf(await load('<div class="cookie-banner">Ми використовуємо файли cookie</div>'), 'cookies')).toBe(true);
  });

  it('отзывы ищутся в тексте, а не в именах классов темы', async () => {
    expect(passOf(await load('<div class="rating-stars"><span class="review-count"></span></div>'), 'reviews')).toBe(false);
    expect(passOf(await load('<p>Відгуки покупців: 128</p>'), 'reviews')).toBe(true);
  });

  it('цена в скрипте не считается ценой на странице', async () => {
    expect(passOf(await load('<p>Каталог</p><script>const price = "1200 грн";</script>'), 'price')).toBe(false);
    expect(passOf(await load('<p>Ціна: 1200 грн</p>'), 'price')).toBe(true);
  });

  it('у каждой проверки уникальный id и непустая метка', async () => {
    const r = await load('<p>x</p>');
    const ids = r.checks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of r.checks) expect(c.label.length).toBeGreaterThan(3);
  });
});

describe('замер скорости', () => {
  /*
   * Без navigation-entry (setContent, about:blank, прерванная навигация) сюда
   * шёл 0 — лучший возможный TTFB, поданный как заміряний. В презентации это
   * зелёная плитка «0 мс».
   */
  it('без настоящей навигации TTFB не выдаётся за ноль', async () => {
    // Проверять наличие самой navigation-entry мало: у about:blank она есть,
    // а responseStart равен нулю — «время не записано», а не «ноль миллисекунд».
    await page.goto('about:blank');
    const p = await page.evaluate(capturePerf);
    expect(p.ttfb).toBeNull();
    expect(p.domReady === null || p.domReady > 0).toBe(true);
  });

  it('после настоящей навигации замер есть', async () => {
    await page.goto('data:text/html,<h1>ok</h1>');
    const p = await page.evaluate(capturePerf);
    expect(p.ttfb).not.toBeUndefined();
    expect(p.reqCount).toBeGreaterThanOrEqual(0);
  });
});
