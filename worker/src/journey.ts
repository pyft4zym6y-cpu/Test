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
    return { source: 'браузер/тест', human: 'элемент не откликнулся за отведённое время (таймаут автоматизации — не подтверждённый дефект сайта, нужна ручная перепроверка)' };
  if (/net::|ERR_|ENOTFOUND|ECONN|ETIMEDOUT|SSL|certificate|socket hang/i.test(s))
    return { source: 'сеть', human: 'сетевая ошибка при загрузке (соединение/сертификат/таймаут сети)' };
  if (/navigation|frame was detached|Execution context was destroyed|Target closed/i.test(s))
    return { source: 'сайт', human: 'страница не завершила навигацию / контекст разрушился при переходе' };
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
      add('Вход', 'Открываю главную страницу', 'Страница отвечает и рендерится', ok ? `открылась (HTTP ${resp?.status()})` : `ошибка HTTP ${resp?.status() ?? '—'}`, ok ? 'пройден' : 'тупик', ['UX', 'TECH']);
      if (!ok) return steps;
    } catch (e) { add('Вход', 'Открываю главную страницу', 'Страница отвечает', `не открылась: ${String(e).slice(0, 80)}`, 'тупик', ['UX', 'TECH']); return steps; }

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
        add('Поиск', 'Ввожу запрос «подарунок» и жму Enter', 'Выдача с товарами или внятное «не найдено» с альтернативами', found ? 'выдача с товарами' : emptyMsg ? 'пустая выдача — есть ли альтернативы/подсказки, проверить' : 'страница результатов открылась', found ? 'пройден' : 'спотыкание', ['UX', 'CRO']);
      } else {
        add('Поиск', 'Ищу поле поиска на первом экране', 'Поиск доступен с любой страницы', 'поле поиска не найдено', 'не найден', ['UX', 'CRO']);
      }
    } catch (e) { const f = classifyFail(e); add('Поиск', 'Пробую поиск', 'Выдача с товарами', `не удалось проверить поиск: ${f.human}`, 'спотыкание', ['UX'], { source: f.source }); }

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
      add('Каталог', 'Перехожу из меню в каталог', 'Листинг с товарами открывается за один клик', onPlp ? `листинг открылся: ${page.url().slice(0, 80)}` : 'листинг с товарами не открылся за один клик', onPlp ? 'пройден' : 'спотыкание', ['UX', 'SEO']);
    } catch (e) { const f = classifyFail(e); add('Каталог', 'Перехожу в каталог', 'Листинг открывается', `не удалось открыть каталог: ${f.human}`, 'спотыкание', ['UX'], { source: f.source }); }

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
      const repro = `попыток входа: ${pdpTries}${hrefs.length ? ` (стратегии: клик + ${hrefs.length} прямых перехода)` : ''} → ${onPdp ? 'открылась' : 'ни одна не открыла PDP'}`;
      if (onPdp) add('Карточка', 'Открываю товар из листинга (несколько стратегий входа)', 'Карточка с ценой и кнопкой «в корзину»', 'карточка открылась, кнопка покупки на месте', 'пройден', ['UX', 'CRO'], { source: 'сайт', reproducibility: repro });
      else if (!hrefs.length) add('Карточка', 'Ищу ссылку на товар в листинге', 'Карточка с кнопкой «в корзину»', 'в листинге не найдено ссылок на карточку товара', 'тупик', ['UX', 'CRO'], { source: 'сайт', reproducibility: repro });
      else add('Карточка', 'Открываю товар из листинга (несколько стратегий входа)', 'Карточка с ценой и кнопкой «в корзину»', `карточка не открылась после ${pdpTries} попыток — вероятно таймаут автоматизации, а не дефект сайта; нужна ручная перепроверка`, 'спотыкание', ['UX', 'CRO'], { source: 'браузер/тест', reproducibility: repro });
    } catch (e) { const f = classifyFail(e); add('Карточка', 'Открываю товар', 'Карточка с кнопкой покупки', `не удалось: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['UX'], { source: f.source, reproducibility: `попыток: ${pdpTries}` }); }

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
        add('Добавление в корзину', 'Нажимаю «в корзину» на карточке', 'Явное подтверждение: счётчик корзины растёт или всплывает окно', inCart ? `товар добавлен (${modal ? 'подтверждение показано' : `счётчик ${before ?? 0} → ${after}`})` : 'нажатие без видимой реакции — покупатель не понимает, добавилось ли', inCart ? 'пройден' : 'спотыкание', ['CRO', 'UX']);
      } catch (e) { const f = classifyFail(e); add('Добавление в корзину', 'Нажимаю «в корзину»', 'Явное подтверждение добавления', `не удалось нажать «в корзину»: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['CRO'], { source: f.source }); }

      /* 6 · Избранное */
      try {
        const wl = page.locator(WISHLIST_BTN).first();
        if (await wl.count()) {
          await wl.click({ timeout: 6000 });
          await page.waitForTimeout(1200);
          const auth = await page.evaluate(() => /увійти|войти|login|зарегистр|реєстрац/i.test(document.querySelector('[class*="modal" i], [class*="popup" i]')?.textContent ?? '')).catch(() => false);
          add('Избранное', 'Нажимаю «в избранное» на карточке', 'Товар сохраняется без принудительной регистрации', auth ? 'требует входа/регистрации — барьер для захвата отложенного спроса' : 'товар отмечен в избранном', auth ? 'спотыкание' : 'пройден', ['UX', 'MKT']);
        } else {
          add('Избранное', 'Ищу кнопку «в избранное»', 'Механика сохранения на потом присутствует', 'кнопка избранного не найдена на карточке', 'не найден', ['UX', 'MKT']);
        }
      } catch (e) { const f = classifyFail(e); add('Избранное', 'Пробую избранное', 'Товар сохраняется', `не удалось проверить избранное: ${f.human}`, 'спотыкание', ['UX'], { source: f.source }); }
    } else {
      const why = pdpSource === 'браузер/тест'
        ? 'шаг не проверен: вход в карточку не удался по таймауту автоматизации (не дефект сайта — перепроверить вручную)'
        : 'шаг недостижим: карточка не открылась';
      add('Добавление в корзину', '—', 'Явное подтверждение добавления', why, 'не проверялся', ['CRO'], { source: pdpSource });
      add('Избранное', '—', 'Сохранение на потом', why, 'не проверялся', ['UX'], { source: pdpSource });
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
      add('Корзина', 'Открываю корзину', inCart ? 'Добавленный товар в корзине: количество, сумма, следующий шаг' : 'Корзина открывается и внятна', cartOk ? 'корзина открылась, состав и сумма читаются' : 'корзина не открылась или нечитабельна', cartOk ? 'пройден' : 'тупик', ['CRO', 'UX']);
    } catch (e) { const f = classifyFail(e); add('Корзина', 'Открываю корзину', 'Состав и сумма читаются', `корзина не открылась: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['CRO'], { source: f.source }); }

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
        add('Чекаут', 'Перехожу к оформлению (не оформляю заказ)', 'Форма ≤8–10 полей, гостевой заказ возможен', info.fields
          ? `форма из ${info.fields} видимых полей${info.guest ? ', гостевой заказ упоминается' : info.forcedAuth ? ', похоже на принудительную регистрацию' : ''}`
          : 'форма оформления не открылась', status, ['CRO', 'UX']);
      } catch (e) { const f = classifyFail(e); add('Чекаут', 'Перехожу к оформлению', 'Форма оформления открывается', `форма оформления не открылась: ${f.human}`, f.source === 'сайт' ? 'тупик' : 'спотыкание', ['CRO'], { source: f.source }); }
    } else {
      add('Чекаут', '—', 'Форма оформления', 'шаг недостижим: корзина не открылась', 'не проверялся', ['CRO']);
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
      add('Тупик: страница 404', 'Открываю несуществующий адрес', 'Честная 404 с навигацией и поиском — мягкая посадка', soft ? `отдан статус ${st} вместо 404 («мягкая 404» — мусор в индексе)` : helpful ? `404 с навигацией — покупатель не теряется` : `404 без навигации и поиска — голый тупик`, soft ? 'спотыкание' : helpful ? 'пройден' : 'тупик', ['SEO', 'UX']);
    } catch { add('Тупик: страница 404', 'Открываю несуществующий адрес', 'Честная 404 с навигацией', 'страница не открылась', 'спотыкание', ['SEO']); }
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
    add('Мобильный: вход', 'Открываю главную на смартфоне (390px)', 'Страница адаптивна, без горизонтального скролла', mOk ? (horiz ? 'горизонтальный скролл — вёрстка вылезает за экран' : 'адаптив в порядке') : 'не открылась', mOk ? (horiz ? 'спотыкание' : 'пройден') : 'тупик', ['MOB', 'UX']);
    if (mOk) {
      const prod = mp.locator(PRODUCT_LINK).first();
      let mPdp = false;
      if (await prod.count()) { await prod.click({ timeout: 8000 }).catch(() => {}); await mp.waitForTimeout(1200); mPdp = (await mp.locator(ADD_TO_CART).count()) > 0; }
      const btn = mPdp ? mp.locator(ADD_TO_CART).first() : null;
      let tapOk = false;
      if (btn) { try { const bb = await btn.boundingBox(); tapOk = Boolean(bb && bb.height >= 40); } catch { /* noop */ } }
      add('Мобильный: покупка', 'Открываю карточку и проверяю кнопку «в корзину» под палец', 'Кнопка достижима и ≥40px (thumb zone)', mPdp ? (tapOk ? 'кнопка покупки удобна для тапа' : 'кнопка покупки мала или недостижима без зума') : 'карточка на мобильном не открылась', mPdp ? (tapOk ? 'пройден' : 'спотыкание') : 'тупик', ['MOB', 'CRO']);
    } else {
      add('Мобильный: покупка', '—', 'Кнопка покупки под палец', 'шаг недостижим: мобильная главная не открылась', 'не проверялся', ['MOB']);
    }
  } catch { add('Мобильный: вход', 'Открываю главную на смартфоне', 'Адаптив без скролла', 'сбой мобильного контекста', 'спотыкание', ['MOB']); }
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
    ...steps.filter((s) => s.status === 'тупик').map((s) => `ТУПИК — ${s.stage}: ${s.result}`),
    ...steps.filter((s) => s.status === 'спотыкание').map((s) => `${s.stage}: ${s.result}`),
    ...steps.filter((s) => s.status === 'не найден').map((s) => `${s.stage}: ${s.result}`),
  ];
  // Сбой на стороне теста/сети — НЕ дефект сайта: не превращаем его в P0/P1-рекомендацию.
  const isTestSide = (s: JourneyStep) => s.source === 'браузер/тест' || s.source === 'сеть';
  const recommendations = [
    ...steps.filter((s) => s.status === 'тупик' && !isTestSide(s)).map((s) => ({ pr: 'P0' as const, action: `${s.stage}: устранить тупик — ${s.expected.toLowerCase()}`, effect: 'Разблокирует шаг воронки, на котором покупатель уходит' })),
    ...steps.filter((s) => s.status === 'спотыкание' && !isTestSide(s)).map((s) => ({ pr: 'P1' as const, action: `${s.stage}: убрать трение — ${s.expected.toLowerCase()}`, effect: 'Снижает потери на шаге' })),
    ...steps.filter((s) => s.status === 'не найден').map((s) => ({ pr: 'P2' as const, action: `${s.stage}: добавить механику — ${s.expected.toLowerCase()}`, effect: 'Закрывает пользовательский сценарий, которого сейчас нет' })),
    ...steps.filter((s) => isTestSide(s)).map((s) => ({ pr: 'P2' as const, action: `${s.stage}: перепроверить вручную — сбой на стороне ${s.source === 'сеть' ? 'сети' : 'теста'}, не подтверждённый дефект сайта`, effect: 'Исключает ложную находку: шаг не засчитан как дефект до ручной перепроверки' })),
  ];

  // Тупики/трение только со стороны САЙТА идут в вердикт (сбои теста не рвут путь клиента).
  const siteDeadends = steps.filter((s) => s.status === 'тупик' && !isTestSide(s)).length;
  const testSide = steps.filter((s) => isTestSide(s)).length;
  const verdict = !steps.length ? 'Путь клиента не пройден — сайт недоступен.'
    : siteDeadends === 0 && friction <= 1 ? `Путь до чекаута проходим: ${passed}/${steps.length} шагов чисто, критических обрывов нет.`
    : siteDeadends === 0 ? `Путь проходим, но с трением: ${friction} шагов заставляют покупателя думать или сомневаться.`
    : `Путь клиента рвётся: ${siteDeadends} тупиков до оформления заказа — часть покупателей физически не доходит до оплаты.`;

  const worst = steps.find((s) => s.status === 'тупик' && !isTestSide(s)) ?? steps.find((s) => s.status === 'спотыкание' && !isTestSide(s));
  const conclusion = [
    `Система прошла путь покупателя руками: вход → поиск → каталог → карточка → корзина → чекаут + тупиковые сценарии. Из ${steps.length} шагов чисто пройдено ${passed}, с трением ${friction}, тупиков ${deadends}, недоступных механик ${notFound}. Это не мнение, а протокол фактического прохождения на дату аудита.`,
    worst
      ? `Самая дорогая точка — «${worst.stage}»: ${worst.result}. Все шаги до неё оплачены трафиком, поэтому потери на этом шаге стоят дороже всего: каждый процент улучшения здесь работает на весь предыдущий путь.`
      : 'Критических точек потерь в основном сценарии не обнаружено — резерв в скорости и деталях шагов, а не в проходимости.',
    testSide
      ? `Каждый шаг размечен по источнику сбоя (сайт / браузер-тест / сеть) и воспроизводимости. ${testSide} ${testSide === 1 ? 'шаг отнесён' : 'шага(ов) отнесены'} к сбою на стороне теста, а не сайта, — такие шаги вынесены на ручную перепроверку и НЕ засчитаны как дефекты, чтобы не завышать картину.`
      : 'Каждый шаг размечен по источнику сбоя (сайт / браузер-тест / сеть) и воспроизводимости — таймаут автоматизации не выдаётся за дефект сайта.',
    'Тест выполнен по одному целевому сценарию на десктопе; мобильный проход, оплата и сценарии авторизованного покупателя — на A1 (там же путь сверяется с фактической воронкой GA4: где по данным теряется больше всего).',
  ];

  return { client, takenAt, steps, passed, friction, deadends, notFound, strengths, weaknesses, recommendations, verdict, conclusion };
}
