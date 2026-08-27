/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { runChecks, checkCount, checkCountByGroup } from '../screen';

const page = (head = '', body = '') =>
  `<!doctype html><html lang="uk"><head>${head}</head><body>${body}</body></html>`;
const pass = (html: string, id: string) =>
  runChecks(html, 'https://shop.ua').find((c) => c.id === id)!.pass;

describe('L0-скрининг', () => {
  it('протокол сам сообщает свой размер (в подписях число не дублируем)', () => {
    expect(checkCount()).toBe(30);
    expect(checkCountByGroup('SEO')).toBe(10);
    expect(checkCountByGroup('UX')).toBe(10);
    expect(checkCountByGroup('Техника')).toBe(10);
  });

  it('у каждой проверки уникальный id', () => {
    const ids = runChecks(page(), 'https://shop.ua').map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('id проверки описывает то, что она проверяет', () => {
    const checks = runChecks(page('<link rel="preconnect" href="https://f.gs">'), 'https://shop.ua');
    // раньше эта проверка называлась favicon-svg — остаток копипасты
    expect(checks.find((c) => c.id === 'preload')!.pass).toBe(true);
    expect(checks.find((c) => c.id === 'favicon-svg')).toBeUndefined();
  });

  /*
   * Проверка consent шла по всей разметке вместе со скриптами. Слово «cookie»
   * есть в любом document.cookie и в любой аналитике, так что провалить её
   * сайт практически не мог: строка стояла в протоколе и всегда давала ✓.
   */
  it('текст страницы не включает исходники скриптов', () => {
    // body.textContent тянул за собой <script>: слово в коде засчитывалось как
    // содержимое страницы сразу в шести проверках группы.
    const withScript = page('', '<script>const delivery="Нова пошта"; const price="1200 ₴";</script>');
    expect(pass(withScript, 'delivery')).toBe(false);
    expect(pass(withScript, 'price')).toBe(false);
    expect(pass(page('', '<p>Доставка Новою поштою, ціна 1200 ₴</p>'), 'delivery')).toBe(true);
  });

  it('cookie-баннер: скрипт со словом cookie — не механика согласия', () => {
    expect(pass(page('', '<script>document.cookie="sid=1"</script>'), 'cookies')).toBe(false);
    expect(pass(page('', '<div class="cookie-banner">Ми використовуємо файли cookie</div>'), 'cookies')).toBe(true);
    expect(pass(page('', '<p>Ми використовуємо cookie для аналітики</p>'), 'cookies')).toBe(true);
  });

  /*
   * Единственная UX-проверка, смотревшая в сырую разметку, а не в текст: имя
   * класса из темы («rating-stars») засчитывалось как найденные отзывы.
   */
  it('отзывы ищутся в тексте страницы, а не в именах классов', () => {
    expect(pass(page('', '<div class="rating-stars"><span class="review-count"></span></div>'), 'reviews')).toBe(false);
    expect(pass(page('', '<p>Відгуки покупців: 128</p>'), 'reviews')).toBe(true);
  });

  it('пустая страница проваливает почти всё, полная — проходит больше', () => {
    const empty = runChecks(page(), 'http://shop.ua').filter((c) => c.pass).length;
    const rich = runChecks(page(
      '<title>Магазин взуття та аксесуарів онлайн</title>' +
      '<meta name="description" content="Купити взуття онлайн з доставкою по Україні: понад 4000 моделей, оплата карткою та готівкою.">' +
      '<link rel="canonical" href="https://shop.ua"><meta name="viewport" content="width=device-width">' +
      '<link rel="icon" href="/f.ico"><meta charset="utf-8">',
      '<h1>Взуття</h1><a href="tel:+380">Подзвонити</a><a href="/cart">Кошик</a>' +
      '<p>Ціна 1200 ₴ · доставка Новою поштою · контакти: Київ</p><p>Відгуки: 128</p>',
    ), 'https://shop.ua').filter((c) => c.pass).length;
    expect(rich).toBeGreaterThan(empty);
    expect(empty).toBeLessThan(checkCount() / 2);
  });
});
