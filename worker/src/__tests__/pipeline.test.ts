/**
 * Решения оркестратора, которые меняют весь прогон: считать ли живой сайт
 * заглушкой (и уйти на резервный контур по скриншотам) и во что превращается
 * адрес, введённый оператором. 996 строк pipeline.ts до сих пор проверялись
 * только как текст — исполнялись из них ноль.
 */
import { describe, it, expect } from 'vitest';
import { detectStub, normalizeUrl, slug } from '../pipeline.js';
import type { SiteCrawl, PageAudit, UxProbe } from '../crawl.js';

const ux = (over: Partial<UxProbe> = {}): UxProbe => ({
  bodyWords: 800, productCards: 0, filters: false, sortControl: false, galleryImages: 0,
  addToCartProminent: false, variantSelector: false, priceVisible: false, ...over,
} as UxProbe);

const pg = (over: Partial<PageAudit> = {}): PageAudit => ({
  url: 'https://shop.ua/', finalUrl: 'https://shop.ua/', kind: 'home', status: 200,
  title: 'Магазин взуття', checks: [], score: 70, ux: ux(), ...over,
} as PageAudit);

const site = (pages: PageAudit[], stack?: unknown): SiteCrawl =>
  ({ root: 'https://shop.ua/', reachable: true, pages, stack } as unknown as SiteCrawl);

describe('нормализация адреса', () => {
  it('голый домен достраивается схемой', () => {
    expect(normalizeUrl('lanavitta.com')).toBe('https://lanavitta.com/');
  });
  it('пробелы внутри адреса не роняют обход', () => {
    expect(normalizeUrl(' shop.ua /katalog ')).toBe('https://shop.ua/katalog');
  });
  it('пустая строка остаётся пустой, а не превращается в https://', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('   ')).toBe('');
  });
  it('http не переписывается в https молча', () => {
    expect(normalizeUrl('http://shop.ua')).toBe('http://shop.ua/');
  });
  it('slug не падает на мусоре', () => {
    expect(slug('https://www.shop.ua/x')).toBe('shop-ua');
    expect(slug('не адрес')).toBe('site');
  });
});

describe('детектор заглушки', () => {
  it('живой магазин заглушкой не считается', () => {
    const s = site([
      pg({ title: 'Магазин взуття', ux: ux({ productCards: 12, priceVisible: true }) }),
      pg({ title: 'Кросівки', url: 'https://shop.ua/krosivky', ux: ux({ productCards: 24, priceVisible: true }) }),
    ]);
    expect(detectStub(s)).toBe(false);
  });

  it('coming-soon в заголовке — заглушка даже на одной странице', () => {
    expect(detectStub(site([pg({ title: 'Coming soon' })]))).toBe(true);
    expect(detectStub(site([pg({ title: 'Сайт в разработке' })]))).toBe(true);
  });

  /*
   * Вторая ветка детектора («все страницы — одинаковый тонкий контент без
   * коммерции») опиралась на ux.productCards > 4. Тот же счётчик, что и
   * manyCards: селектор ловил menu-item и list-item и давал десятки совпадений
   * на любой странице — на собственной главной weexp.agency 56 при пороге 8.
   * Значит noCommerce было ложным почти всегда, и эта ветка не срабатывала
   * никогда: заглушку ловил только текст coming-soon. Счётчик исправлен в
   * crawl.ts, ветка снова живая — тест её и держит.
   */
  it('одинаковые тонкие страницы без коммерции — заглушка', () => {
    const thin = (u: string) => pg({ url: u, title: 'Hostinger', ux: ux({ bodyWords: 40 }) });
    expect(detectStub(site([thin('https://shop.ua/'), thin('https://shop.ua/a'), thin('https://shop.ua/b')]))).toBe(true);
  });

  it('тонкие страницы, но с товарами — не заглушка', () => {
    const thin = (u: string) => pg({ url: u, title: 'Hostinger', ux: ux({ bodyWords: 40, productCards: 12 }) });
    expect(detectStub(site([thin('https://shop.ua/'), thin('https://shop.ua/a')]))).toBe(false);
  });

  it('разные заголовки — не заглушка, даже если текста мало', () => {
    expect(detectStub(site([
      pg({ title: 'Головна', ux: ux({ bodyWords: 40 }) }),
      pg({ title: 'Про нас', url: 'https://shop.ua/about', ux: ux({ bodyWords: 40 }) }),
    ]))).toBe(false);
  });

  it('одна тонкая страница заглушкой не объявляется — данных мало', () => {
    expect(detectStub(site([pg({ title: 'Hostinger', ux: ux({ bodyWords: 40 }) })]))).toBe(false);
  });

  it('недоступный сайт — не заглушка (это другой диагноз)', () => {
    expect(detectStub(site([pg({ error: 'сеть: timeout', score: null })]))).toBe(false);
    expect(detectStub(site([]))).toBe(false);
  });

  it('coming-soon в сигналах стека тоже ловится', () => {
    const s = site([pg({ title: 'Shop' })], { signals: ['новий сайт wordpress'] });
    expect(detectStub(s)).toBe(true);
  });
});
