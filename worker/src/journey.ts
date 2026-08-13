/**
 * Journey-тестирование: система проходит путь покупателя руками — открывает
 * сайт, ищет, открывает каталог и карточку, кладёт товар в корзину и избранное,
 * доходит до чекаута, проверяет тупики (пустой поиск, несуществующая страница).
 * Каждый шаг: действие → ожидание по эталону → фактический результат → статус.
 * Ничего не оформляет и не оплачивает: тест останавливается на форме чекаута.
 */
import type { Browser, Page } from 'playwright';
import type { Dim } from './pagereport.js';

export type StepStatus = 'пройден' | 'спотыкание' | 'тупик' | 'не найден' | 'не проверялся';
/** Источник сбоя шага — чтобы не выдавать таймаут автоматизации за дефект сайта. */
export type FailSource = 'сайт' | 'браузер/тест' | 'сеть' | 'unknown';
export type JourneyStep = {
  n: number; stage: string; action: string; expected: string; result: string;
  status: StepStatus; dims: Dim[];
  source?: FailSource;          // кто виноват в сбое (для колонки «источник»)
  reproducibility?: string;     // сколько попыток / воспроизводимость (напр. «2/2 попытки»)
};

/** Классифицирует исключение Playwright: таймаут теста ≠ подтверждённый дефект сайта. */
function classifyFail(e: unknown): { source: FailSource; human: string } {
  const s = String(e);
  if (/Timeout.*exceeded|waiting for|locator\.\w+: Timeout/i.test(s))
    return { source: 'браузер/тест', human: 'елемент не відгукнувся за відведений час (таймаут автоматизації — не підтверджений дефект сайту, потрібна ручна перевірка)' };
  if (/net::|ERR_|ENOTFOUND|ECONN|ETIMEDOUT|SSL|certificate|socket hang/i.test(s))
    return { source: 'сеть', human: 'мережева помилка під час завантаження (зʼєднання/сертифікат/таймаут мережі)' };
  if (/navigation|frame was detached|Execution context was destroyed|Target closed/i.test(s))
    return { source: 'сайт', human: 'сторінка не завершила навігацію / контекст зруйнувався під час переходу' };
  return { source: 'unknown', human: s.replace(/\s+/g, ' ').slice(0, 90) };
}
export type JourneyReport = {
  client: string; takenAt: string;
  steps: JourneyStep[];
  passed: number; friction: number; deadends: number; notFound: number;
  strengths: string[]; weaknesses: string[];
  recommendations: { pr: 'P0' | 'P1' | 'P2'; action: string; effect: string }[];
  verdict: string; conclusion: string[];
};

const SEARCH_INPUT = 'input[type="search"], input[name="search" i], input[name="q"], [class*="search" i] input:not([type="hidden"]), input[placeholder*="пошук" i], input[placeholder*="поиск" i], input[placeholder*="search" i]';
const PRODUCT_LINK = '[class*="product" i] a[href], [class*="card" i] a[href], [class*="item" i] a[href]';
const ADD_TO_CART = '[class*="add-to-cart" i], [data-add-to-cart], button[name*="add" i]';
const WISHLIST_BTN = '[class*="wishlist" i] button, button[class*="wishlist" i], [class*="favorite" i] button, [data-wishlist], a[class*="wishlist" i]';
const CART_LINK = 'a[href*="cart" i], a[href*="korzina" i], a[href*="basket" i], [class*="cart" i] a';
const CHECKOUT_BTN = 'a[href*="checkout" i], button[class*="checkout" i], a[class*="checkout" i], a[href*="oform" i]';

const cartBadgeCount = async (page: Page): Promise<number | null> => {
  try {
    return await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[class*="cart" i] [class*="count" i], [class*="cart" i] [class*="badge" i], [class*="cart-count" i], [class*="counter" i]'));
      for (const el of els) { const n = parseInt((el.textContent ?? '').trim(), 10); if (Number.isFinite(n)) return n; }
      return null;
    });
  } catch { return null; }
};

const hasProducts = async (page: Page): Promise<boolean> => {
  try { return await page.evaluate(() => document.querySelectorAll('[class*="product" i], [class*="card" i], [class*="item" i]').length >= 3); } catch { return false; }
};

/** Проходит путь клиента на реальном сайте. Все шаги защищены: падение шага —
 *  это результат («тупик»/«спотыкание»), а не падение аудита. */
export async function runJourney(browser: Browser, origin: string, log?: (m: string) => void): Promise<JourneyStep[]> {
  const steps: JourneyStep[] = [];
  let n = 0;
  const add = (stage: string, action: string, expected: string, result: string, status: StepStatus, dims: Dim[], extra?: { source?: FailSource; reproducibility?: string }) =>
    steps.push({ n: ++n, stage, action, expected, result, status, dims, ...extra });

  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'uk-UA' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);

  try {
    /* 1 · Вход */
    try {
      const resp = await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 25000 });
      const ok = Boolean(resp && resp.status() < 400);
      add('Вхід', 'Відкриваю головну сторінку', 'Сторінка відповідає і рендериться', ok ? `відкрилася (HTTP ${resp?.status()})` : `помилка HTTP ${resp?.status() ?? '—'}`, ok ? 'пройден' : 'тупик', ['UX', 'TECH']);
      if (!ok) return steps;
    } catch (e) { add('Вхід', 'Відкриваю головну сторінку', 'Сторінка відповідає', `не відкрилася: ${String(e).slice(0, 80)}`, 'тупик', ['UX', 'TECH']); return steps; }

    /* 2 · Поиск */
    let searchWorked = false;
    try {
      const inp = page.locator(SEARCH_INPUT).first();
      if (await inp.count()) {
        await inp.click({ timeout: 5000 });
        await inp.fill('подарунок');
        await inp.press('Enter');
        await page.waitForLoadState('domcontentloaded', { timeout: 12000 }).catch(() => {});
        await page.waitForTimeout(1200);
        const found = await hasProducts(page);
        const emptyMsg = await page.evaluate(() => /нічого не знайдено|ничего не найдено|no results|не найдено/i.test(document.body?.textContent ?? '')).catch(() => false);
        searchWorked = found || !emptyMsg;
        add('Пошук', 'Вводжу запит «подарунок» і тисну Enter', 'Видача з товарами або зрозуміле «не знайдено» з альтернативами', found ? 'видача з товарами' : emptyMsg ? 'порожня видача — чи є альтернативи/підказки, перевірити' : 'сторінка результатів відкрилася', found ? 'пройден' : 'спотыкание', ['UX', 'CRO']);
      } else {
        add('Пошук', 'Шукаю поле пошуку на першому екрані', 'Пошук доступний з будь-якої сторінки', 'поле пошуку не знайдено', 'не найден', ['UX', 'CRO']);
      }
    } catch (e) { const f = classifyFail(e); add('Пошук', 'Пробую пошук', 'Видача з товарами', `не вдалося перевірити пошук: ${f.human}`, 'спотыкание', ['UX'], { source: f.source }); }

    /* 3 · Каталог */
    let onPlp = false;
    try {
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      const catLink = page.locator('a[href*="katalog" i], a[href*="catalog" i], a[href*="category" i], a[href*="collection" i], nav a, header a').first();
      if (await catLink.count()) {
        await catLink.click({ timeout: 8000 });
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(1000);
        onPlp = await hasProducts(page);
      }
      add('Каталог', 'Переходжу з меню в каталог', 'Лістинг із товарами відкривається за один клік', onPlp ? `лістинг відкрився: ${page.url().slice(0, 80)}` : 'лістинг із товарами не відкрився за один клік', onPlp ? 'пройден' : 'спотыкание', ['UX', 'SEO']);
    } catch (e) { const f = classifyFail(e); add('Каталог', 'Переходжу в каталог', 'Лістинг відкривається', `не вдалося відкрити каталог: ${f.human}`, 'спотыкание', ['UX'], { source: f.source }); }

    /* 4 · Карточка из листинга — несколько стратегий входа + повтор, чтобы таймаут
       автоматизации не выдавался за «карточку не открыть» (это ложно рвало путь). */
    let onPdp = false;
    let pdpTries = 0;
    let pdpSource: FailSource = 'сайт';
    const isPdp = async () => (await page.locator(ADD_TO_CART).count()) > 0
      || await page.evaluate(() => (/в корзину|в кошик|додати|купити|купить/i.test(document.body?.textContent ?? '')) && Boolean(document.querySelector('h1'))).catch(() => false);
    try {
      // собираем несколько ссылок-кандидатов на товар (заголовок / картинка / карточка)
      const hrefs: string[] = await page.evaluate((sel) => {
        const set = new Set<string>();
        document.querySelectorAll(sel).forEach((a) => { const h = (a as HTMLAnchorElement).href; if (h && !/#$|javascript:/i.test(h)) set.add(h); });
        return Array.from(set).slice(0, 6);
      }, PRODUCT_LINK).catch(() => [] as string[]);
      // стратегия A: клик по первой карточке
      try {
        const prod = page.locator(PRODUCT_LINK).first();
        if (await prod.count()) { pdpTries++; await prod.click({ timeout: 8000 }); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForTimeout(900); onPdp = await isPdp(); }
      } catch (e) { pdpSource = classifyFail(e).source; }
      // стратегия B: прямой переход по href-кандидатам (обходит перехваченные клики/таймауты)
      for (const h of hrefs) {
        if (onPdp) break;
        try { pdpTries++; await page.goto(h, { waitUntil: 'domcontentloaded', timeout: 20000 }); await page.waitForTimeout(700); onPdp = await isPdp(); }
        catch (e) { pdpSource = classifyFail(e).source; }
      }
      const repro = `спроб входу: ${pdpTries}${hrefs.length ? ` (стратегії: клік + ${hrefs.length} прямих переходи)` : ''} → ${onPdp ? 'відкрилася' : 'жодна не відкрила PDP'}`;
      if (onPdp) add('Картка', 'Відкриваю товар із лістингу (декілька стратегій входу)', 'Картка з ціною і кнопкою «до кошика»', 'картка відкрилася, кнопка купівлі на місці', 'пройден', ['UX', 'CRO'], { source: 'сайт', reproducibility: repro });
      else if (!hrefs.length) add('Картка', 'Шукаю посилання на товар у лістингу', 'Картка з кнопкою «до кошика»', 'у лістингу не знайдено посилань на картку товару', 'тупик', ['UX', 'CRO'], { source: 'сайт', reproducibility: repro });
      else add('Картка', 'Відкриваю товар із лістингу (декілька стратегій входу)', 'Картка з ціною і кнопкою «до кошика»', `картка не відкрилася після ${pdpTries} спроб — імовірно таймаут автоматизації, а не дефект сайту; потрібна ручна перевірка`, 'спотыкание', ['UX', 'CRO'], { source: 'браузер/тест', reproducibility: repro });
    } catch (e) { const f = classifyFail(e); add('Картка', 'Відкриваю товар', 'Картка з кнопкою купівлі', `не вдалося: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['UX'], { source: f.source, reproducibility: `спроб: ${pdpTries}` }); }

    /* 5 · В корзину */
    let inCart = false;
    if (onPdp) {
      try {
        const before = await cartBadgeCount(page);
        const btn = page.locator(ADD_TO_CART).first();
        const clickable = await btn.count()
          ? btn
          : page.locator('button, a').filter({ hasText: /в корзину|в кошик|додати|купити|купить|buy/i }).first();
        await clickable.click({ timeout: 8000 });
        await page.waitForTimeout(2500);
        const after = await cartBadgeCount(page);
        const modal = await page.evaluate(() => Boolean(document.querySelector('[class*="modal" i], [class*="popup" i], [class*="notification" i], [class*="added" i]'))).catch(() => false);
        inCart = (before !== null && after !== null && after > before) || (before === null && after !== null && after > 0) || modal || /cart|korzina|basket/i.test(page.url());
        add('Додавання в кошик', 'Натискаю «до кошика» на картці', 'Явне підтвердження: лічильник кошика зростає або спливає вікно', inCart ? `товар додано (${modal ? 'підтвердження показано' : `лічильник ${before ?? 0} → ${after}`})` : 'натискання без видимої реакції — покупець не розуміє, чи додалося', inCart ? 'пройден' : 'спотыкание', ['CRO', 'UX']);
      } catch (e) { const f = classifyFail(e); add('Додавання в кошик', 'Натискаю «до кошика»', 'Явне підтвердження додавання', `не вдалося натиснути «до кошика»: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['CRO'], { source: f.source }); }

      /* 6 · Избранное */
      try {
        const wl = page.locator(WISHLIST_BTN).first();
        if (await wl.count()) {
          await wl.click({ timeout: 6000 });
          await page.waitForTimeout(1200);
          const auth = await page.evaluate(() => /увійти|войти|login|зарегистр|реєстрац/i.test(document.querySelector('[class*="modal" i], [class*="popup" i]')?.textContent ?? '')).catch(() => false);
          add('Обране', 'Натискаю «в обране» на картці', 'Товар зберігається без примусової реєстрації', auth ? 'вимагає входу/реєстрації — барʼєр для захоплення відкладеного попиту' : 'товар позначено в обраному', auth ? 'спотыкание' : 'пройден', ['UX', 'MKT']);
        } else {
          add('Обране', 'Шукаю кнопку «в обране»', 'Механіка збереження на потім присутня', 'кнопку обраного не знайдено на картці', 'не найден', ['UX', 'MKT']);
        }
      } catch (e) { const f = classifyFail(e); add('Обране', 'Пробую обране', 'Товар зберігається', `не вдалося перевірити обране: ${f.human}`, 'спотыкание', ['UX'], { source: f.source }); }
    } else {
      const why = pdpSource === 'браузер/тест'
        ? 'крок не перевірено: вхід у картку не вдався через таймаут автоматизації (не дефект сайту — перевірити вручну)'
        : 'крок недосяжний: картка не відкрилася';
      add('Додавання в кошик', '—', 'Явне підтвердження додавання', why, 'не проверялся', ['CRO'], { source: pdpSource });
      add('Обране', '—', 'Збереження на потім', why, 'не проверялся', ['UX'], { source: pdpSource });
    }

    /* 7 · Корзина */
    let cartOk = false;
    try {
      const cl = page.locator(CART_LINK).first();
      if (await cl.count()) await cl.click({ timeout: 8000 }).catch(async () => page.goto(new URL('/cart', origin).toString(), { waitUntil: 'domcontentloaded' }));
      else await page.goto(new URL('/cart', origin).toString(), { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      cartOk = await page.evaluate(() => {
        const t = document.body?.textContent ?? '';
        const hasQty = Boolean(document.querySelector('[class*="quantity" i], [class*="qty" i], input[type="number"]'));
        const hasTotal = /разом|итого|total|сума|сумма/i.test(t);
        return hasQty || hasTotal;
      }).catch(() => false);
      add('Кошик', 'Відкриваю кошик', inCart ? 'Доданий товар у кошику: кількість, сума, наступний крок' : 'Кошик відкривається і зрозумілий', cartOk ? 'кошик відкрився, склад і сума читаються' : 'кошик не відкрився або нечитабельний', cartOk ? 'пройден' : 'тупик', ['CRO', 'UX']);
    } catch (e) { const f = classifyFail(e); add('Кошик', 'Відкриваю кошик', 'Склад і сума читаються', `кошик не відкрився: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['CRO'], { source: f.source }); }

    /* 8 · Чекаут */
    if (cartOk) {
      try {
        const cb = page.locator(CHECKOUT_BTN).first();
        if (await cb.count()) await cb.click({ timeout: 8000 });
        else await page.goto(new URL('/checkout', origin).toString(), { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(1500);
        const info = await page.evaluate(() => {
          const fields = document.querySelectorAll('form input:not([type="hidden"]), form select, form textarea').length;
          const t = document.body?.textContent ?? '';
          const forcedAuth = /увійти|войти|login|зарегистр|реєстрац/i.test(t) && !/без реєстрац|без регистрац|гост|guest/i.test(t);
          const guest = /без реєстрац|без регистрац|як гість|как гость|guest/i.test(t);
          return { fields, forcedAuth, guest };
        }).catch(() => ({ fields: 0, forcedAuth: false, guest: false }));
        const status: StepStatus = info.fields > 0 ? (info.forcedAuth ? 'спотыкание' : info.fields > 10 ? 'спотыкание' : 'пройден') : 'тупик';
        add('Оформлення', 'Переходжу до оформлення (не оформлюю замовлення)', 'Форма ≤8–10 полів, гостьове замовлення можливе', info.fields
          ? `форма з ${info.fields} видимих полів${info.guest ? ', гостьове замовлення згадується' : info.forcedAuth ? ', схоже на примусову реєстрацію' : ''}`
          : 'форма оформлення не відкрилася', status, ['CRO', 'UX']);
      } catch (e) { const f = classifyFail(e); add('Оформлення', 'Переходжу до оформлення', 'Форма оформлення відкривається', `форма оформлення не відкрилася: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['CRO'], { source: f.source }); }
    } else {
      add('Оформлення', '—', 'Форма оформлення', 'крок недосяжний: кошик не відкрився', 'не проверялся', ['CRO']);
    }

    /* 9 · Тупик: несуществующая страница */
    try {
      const resp404 = await page.goto(new URL(`/weexp-journey-404-${Math.random().toString(36).slice(2, 8)}/`, origin).toString(), { waitUntil: 'domcontentloaded' });
      const st = resp404?.status() ?? 0;
      const soft = st < 400;
      const helpful = await page.evaluate(() => {
        const hasNav = Boolean(document.querySelector('nav, header a'));
        const hasSearch = Boolean(document.querySelector('input[type="search"], [class*="search" i] input'));
        return hasNav || hasSearch;
      }).catch(() => false);
      add('Глухий кут: сторінка 404', 'Відкриваю неіснуючу адресу', 'Чесна 404 з навігацією та пошуком — мʼяка посадка', soft ? `віддано статус ${st} замість 404 («мʼяка 404» — сміття в індексі)` : helpful ? `404 з навігацією — покупець не губиться` : `404 без навігації та пошуку — голий глухий кут`, soft ? 'спотыкание' : helpful ? 'пройден' : 'тупик', ['SEO', 'UX']);
    } catch { add('Глухий кут: сторінка 404', 'Відкриваю неіснуючу адресу', 'Чесна 404 з навігацією', 'сторінка не відкрилася', 'спотыкание', ['SEO']); }
  } finally {
    await ctx.close().catch(() => {});
  }

  /* 10 · Мобильный проход (компактный): вход → карточка → в корзину на 390×844. */
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const mp = await mctx.newPage();
  mp.setDefaultTimeout(12000);
  try {
    const resp = await mp.goto(origin, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => null);
    const mOk = Boolean(resp && resp.status() < 400);
    const horiz = mOk ? await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 5).catch(() => false) : false;
    add('Мобільний: вхід', 'Відкриваю головну на смартфоні (390px)', 'Сторінка адаптивна, без горизонтального скролу', mOk ? (horiz ? 'горизонтальний скрол — верстка вилазить за екран' : 'адаптив у порядку') : 'не відкрилася', mOk ? (horiz ? 'спотыкание' : 'пройден') : 'тупик', ['MOB', 'UX']);
    if (mOk) {
      const prod = mp.locator(PRODUCT_LINK).first();
      let mPdp = false;
      if (await prod.count()) { await prod.click({ timeout: 8000 }).catch(() => {}); await mp.waitForTimeout(1200); mPdp = (await mp.locator(ADD_TO_CART).count()) > 0; }
      const btn = mPdp ? mp.locator(ADD_TO_CART).first() : null;
      let tapOk = false;
      if (btn) { try { const bb = await btn.boundingBox(); tapOk = Boolean(bb && bb.height >= 40); } catch { /* noop */ } }
      add('Мобільний: покупка', 'Відкриваю картку і перевіряю кнопку «до кошика» під палець', 'Кнопка досяжна і ≥40px (thumb zone)', mPdp ? (tapOk ? 'кнопка купівлі зручна для тапу' : 'кнопка купівлі мала або недосяжна без зуму') : 'картка на мобільному не відкрилася', mPdp ? (tapOk ? 'пройден' : 'спотыкание') : 'тупик', ['MOB', 'CRO']);
    } else {
      add('Мобільний: покупка', '—', 'Кнопка купівлі під палець', 'крок недосяжний: мобільна головна не відкрилася', 'не проверялся', ['MOB']);
    }
  } catch { add('Мобільний: вхід', 'Відкриваю головну на смартфоні', 'Адаптив без скролу', 'збій мобільного контексту', 'спотыкание', ['MOB']); }
  finally { await mctx.close().catch(() => {}); }

  log?.(`· journey: шагов ${steps.length}, тупиков ${steps.filter((s) => s.status === 'тупик').length}`);
  return steps;
}

/** Сводит шаги в отчёт с консалтинговым каркасом. */
export function buildJourneyReport(steps: JourneyStep[], clientUrl: string, takenAt: string): JourneyReport {
  let client = clientUrl;
  try { client = new URL(clientUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const passed = steps.filter((s) => s.status === 'пройден').length;
  const friction = steps.filter((s) => s.status === 'спотыкание').length;
  const deadends = steps.filter((s) => s.status === 'тупик').length;
  const notFound = steps.filter((s) => s.status === 'не найден').length;

  const strengths = steps.filter((s) => s.status === 'пройден').map((s) => `${s.stage}: ${s.result}`);
  const weaknesses = [
    ...steps.filter((s) => s.status === 'тупик').map((s) => `ГЛУХИЙ КУТ — ${s.stage}: ${s.result}`),
    ...steps.filter((s) => s.status === 'спотыкание').map((s) => `${s.stage}: ${s.result}`),
    ...steps.filter((s) => s.status === 'не найден').map((s) => `${s.stage}: ${s.result}`),
  ];
  // Сбой на стороне теста/сети — НЕ дефект сайта: не превращаем его в P0/P1-рекомендацию.
  const isTestSide = (s: JourneyStep) => s.source === 'браузер/тест' || s.source === 'сеть';
  const recommendations = [
    ...steps.filter((s) => s.status === 'тупик' && !isTestSide(s)).map((s) => ({ pr: 'P0' as const, action: `${s.stage}: усунути глухий кут — ${s.expected.toLowerCase()}`, effect: 'Розблоковує крок воронки, на якому покупець іде' })),
    ...steps.filter((s) => s.status === 'спотыкание' && !isTestSide(s)).map((s) => ({ pr: 'P1' as const, action: `${s.stage}: прибрати тертя — ${s.expected.toLowerCase()}`, effect: 'Знижує втрати на кроці' })),
    ...steps.filter((s) => s.status === 'не найден').map((s) => ({ pr: 'P2' as const, action: `${s.stage}: додати механіку — ${s.expected.toLowerCase()}`, effect: 'Закриває користувацький сценарій, якого зараз немає' })),
    ...steps.filter((s) => isTestSide(s)).map((s) => ({ pr: 'P2' as const, action: `${s.stage}: перевірити вручну — збій на боці ${s.source === 'сеть' ? 'мережі' : 'тесту'}, не підтверджений дефект сайту`, effect: 'Виключає хибну знахідку: крок не зараховано як дефект до ручної перевірки' })),
  ];

  // Тупики/трение только со стороны САЙТА идут в вердикт (сбои теста не рвут путь клиента).
  const siteDeadends = steps.filter((s) => s.status === 'тупик' && !isTestSide(s)).length;
  const testSide = steps.filter((s) => isTestSide(s)).length;
  const verdict = !steps.length ? 'Шлях клієнта не пройдено — сайт недоступний.'
    : siteDeadends === 0 && friction <= 1 ? `Шлях до оформлення прохідний: ${passed}/${steps.length} кроків чисто, критичних обривів немає.`
    : siteDeadends === 0 ? `Шлях прохідний, але з тертям: ${friction} кроків змушують покупця думати або сумніватися.`
    : `Шлях клієнта рветься: ${siteDeadends} глухих кутів до оформлення замовлення — частина покупців фізично не доходить до оплати.`;

  const worst = steps.find((s) => s.status === 'тупик' && !isTestSide(s)) ?? steps.find((s) => s.status === 'спотыкание' && !isTestSide(s));
  const conclusion = [
    `Система пройшла шлях покупця руками: вхід → пошук → каталог → картка → кошик → оформлення + тупикові сценарії. Із ${steps.length} кроків чисто пройдено ${passed}, з тертям ${friction}, глухих кутів ${deadends}, недоступних механік ${notFound}. Це не думка, а протокол фактичного проходження на дату аудиту.`,
    worst
      ? `Найдорожча точка — «${worst.stage}»: ${worst.result}. Усі кроки до неї оплачені трафіком, тому втрати на цьому кроці коштують найдорожче: кожен відсоток покращення тут працює на весь попередній шлях.`
      : 'Критичних точок втрат в основному сценарії не виявлено — резерв у швидкості та деталях кроків, а не в прохідності.',
    testSide
      ? `Кожен крок розмічено за джерелом збою (сайт / браузер-тест / мережа) і відтворюваністю. ${testSide} ${testSide === 1 ? 'крок віднесено' : 'кроків віднесено'} до збою на боці тесту, а не сайту, — такі кроки винесено на ручну перевірку і НЕ зараховано як дефекти, щоб не завищувати картину.`
      : 'Кожен крок розмічено за джерелом збою (сайт / браузер-тест / мережа) і відтворюваністю — таймаут автоматизації не видається за дефект сайту.',
    'Тест виконано за одним цільовим сценарієм на десктопі; мобільний прохід, оплата та сценарії авторизованого покупця — на наступному етапі (там же шлях звіряється з фактичною воронкою GA4: де за даними втрачається найбільше).',
  ];

  return { client, takenAt, steps, passed, friction, deadends, notFound, strengths, weaknesses, recommendations, verdict, conclusion };
}
