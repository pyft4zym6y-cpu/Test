/**
 * Обход сайта — 1041 строка, на которых стоит весь аудит, и до сих пор ни одного
 * теста. Браузерную часть в юните не проверить, но решения, из-за которых аудит
 * ошибается, принимают чистые функции: какой тип у страницы, какие страницы
 * вообще брать в разбор, существует ли обязательный тип.
 *
 * Цена ошибки здесь — не падение, а неверное утверждение в документе клиента.
 * «Страницы возврата нет» при живой /obmin-ta-povernennya/ — это обвинение,
 * которое клиент проверит за минуту, и дальше он не поверит остальным 23 находкам.
 */
import { describe, it, expect } from 'vitest';
import {
  accessFromUrl, applyAccess, stripAccess, classify, pickCandidates,
  reachabilityDiagnosis, PAGE_TYPE_REGISTRY, type SiteCrawl,
} from '../crawl.js';

describe('доступ по ссылке-обходу', () => {
  it('вытаскивает параметры из ссылки, которую дал оператор', () => {
    expect(accessFromUrl('https://shop.ua/?access=secret123')).toEqual({ query: { access: 'secret123' } });
  });

  it('обычный адрес не превращается в доступ', () => {
    expect(accessFromUrl('https://shop.ua/')).toBeUndefined();
  });

  it('мусор вместо URL не роняет обход', () => {
    expect(accessFromUrl('не адрес')).toBeUndefined();
  });

  it('параметр добавляется к любой странице, а не только к корню', () => {
    const a = { query: { access: 'k' } };
    expect(applyAccess('https://shop.ua/catalog/', a)).toBe('https://shop.ua/catalog/?access=k');
  });

  it('чужие параметры страницы при этом не теряются', () => {
    const a = { query: { access: 'k' } };
    expect(applyAccess('https://shop.ua/search?q=диван', a)).toContain('q=%D0%B4%D0%B8%D0%B2%D0%B0%D0%BD');
  });

  it('в отчёт адрес возвращается чистым — иначе клиент увидит свой секрет в PDF', () => {
    const a = { query: { access: 'secret' } };
    const dirty = applyAccess('https://shop.ua/p/1', a);
    expect(stripAccess(dirty, a)).toBe('https://shop.ua/p/1');
    expect(stripAccess(dirty, a)).not.toContain('secret');
  });

  it('очистка не трогает собственные параметры страницы', () => {
    const a = { query: { access: 'secret' } };
    expect(stripAccess('https://shop.ua/search?q=x&access=secret', a)).toBe('https://shop.ua/search?q=x');
  });
});

describe('classify — тип страницы', () => {
  const none = {};

  it('корень — всегда главная', () => {
    expect(classify('https://shop.ua/', none, true)).toBe('home');
  });

  it('языковое зеркало главной — тоже главная, а не «контент»', () => {
    expect(classify('https://shop.ua/en/', none, false)).toBe('home');
    expect(classify('https://shop.ua/ua', none, false)).toBe('home');
  });

  // Прод-баг: у сервисных страниц в футере висят карточки товаров, и признак
  // manyCards уводил их в каталог. Отсюда правило «URL важнее DOM» для них.
  it('сервисная страница с карточками в футере не становится каталогом', () => {
    const withCards = { manyCards: true };
    for (const p of ['/blog/', '/about/', '/contact/', '/dostavka/', '/privacy/', '/povernennya/']) {
      expect(classify('https://shop.ua' + p, withCards, false), p).toBe('content');
    }
  });

  // Найдено этим тестом: жёсткая граница после основы ловила только английские
  // формы, и 18 из 26 реальных украинских адресов уходили в «каталог».
  it('склонённые формы опознаются — украинский и русский не английский', () => {
    const withCards = { manyCards: true };
    const service = [
      '/povernennya/', '/obmin-ta-povernennya/', '/vozvrat-tovara/',
      '/kontakty/', '/kontakti/', '/contacts/',
      '/dostavka-i-oplata/', '/oplata-i-dostavka/',
      '/kompaniya/', '/garantiya/', '/harantiia/',
      '/novyny/', '/statti/', '/porivnyannya/',
      '/publichna-oferta/', '/umovy-prodazhu/',
      '/konfidencijnist/', '/polityka-konfidencijnosti/',
      '/korporatyvni-podarunky/', '/optovym-klientam/',
    ];
    for (const p of service) {
      expect(classify('https://shop.ua' + p, withCards, false), p).toBe('content');
    }
  });

  // Обратная сторона: послабление не должно съесть настоящие категории и товары.
  // «optika» — это оптика, а не опт; «stativy» — штативы, а не статьи.
  it('товары и категории с похожими корнями сохраняют свой тип', () => {
    const withCards = { manyCards: true };
    for (const p of ['/optika/', '/stativy/', '/korpusni-mebli/', '/katalog/divany/', '/novinki-sezona-divan/']) {
      expect(classify('https://shop.ua' + p, withCards, false), p).toBe('plp');
    }
    for (const p of ['/product/divan-1', '/p/12345', '/statyv-manfrotto/']) {
      expect(classify('https://shop.ua' + p, { hasProductSchema: true }, false), p).toBe('pdp');
    }
  });

  it('FAQ отделён от прочего контента — по нему отдельная проверка аудита', () => {
    expect(classify('https://shop.ua/faq/', none, false)).toBe('faq');
    expect(classify('https://shop.ua/pytannya/', none, false)).toBe('faq');
  });

  it('чекаут важнее корзины, если признаки есть у обоих', () => {
    expect(classify('https://shop.ua/x', { isCheckoutUrl: true, isCartUrl: true }, false)).toBe('checkout');
  });

  it('разметка товара перевешивает множество карточек', () => {
    expect(classify('https://shop.ua/x', { hasProductSchema: true, manyCards: true }, false)).toBe('pdp');
  });

  it('кнопка «в корзину» без витрины карточек — это карточка товара', () => {
    expect(classify('https://shop.ua/x', { addToCart: true }, false)).toBe('pdp');
  });

  it('кнопка «в корзину» НА витрине карточек — это каталог, а не товар', () => {
    expect(classify('https://shop.ua/x', { addToCart: true, manyCards: true }, false)).toBe('plp');
  });

  it('не URL и без признаков — контент, а не исключение', () => {
    expect(classify('вообще не адрес', none, false)).toBe('content');
  });
});

describe('pickCandidates — что берём в разбор', () => {
  const root = 'https://shop.ua/';
  const links = [
    'https://shop.ua/katalog/', 'https://shop.ua/catalog/divany/',
    'https://shop.ua/product/1', 'https://shop.ua/product/2', 'https://shop.ua/tovar/3',
    'https://shop.ua/cart/', 'https://shop.ua/checkout/', 'https://shop.ua/faq/',
    'https://shop.ua/blog/', 'https://shop.ua/about/', 'https://shop.ua/dostavka/',
    'https://other.com/product/9',
    'https://shop.ua/logo.png', 'https://shop.ua/app.js', 'https://shop.ua/sitemap.xml',
  ];

  it('чужой домен в обход не попадает', () => {
    expect(pickCandidates(root, links, 20).some((h) => h.includes('other.com'))).toBe(false);
  });

  it('картинки, скрипты и xml не тратят бюджет обхода', () => {
    for (const h of pickCandidates(root, links, 20)) expect(h).not.toMatch(/\.(png|js|xml)$/);
  });

  it('сам корень повторно не берётся', () => {
    expect(pickCandidates(root, links, 20)).not.toContain(root);
  });

  it('соблюдает бюджет страниц', () => {
    expect(pickCandidates(root, links, 5)).toHaveLength(5);
  });

  it('при малом бюджете первыми идут каталог и товар — без них аудита нет', () => {
    const got = pickCandidates(root, links, 5).map((h) => new URL(h).pathname);
    expect(got.some((p) => /katalog|catalog/.test(p))).toBe(true);
    expect(got.some((p) => /product|tovar/.test(p))).toBe(true);
  });

  it('пустой список ссылок не роняет обход', () => {
    expect(pickCandidates(root, [], 5)).toEqual([]);
  });

  it('битый корень не роняет обход', () => {
    expect(pickCandidates('не адрес', links, 5)).toEqual([]);
  });

  it('дубликаты ссылок не съедают бюджет', () => {
    const dup = ['https://shop.ua/a/', 'https://shop.ua/a/', 'https://shop.ua/b/'];
    expect(pickCandidates(root, dup, 5)).toHaveLength(2);
  });
});

describe('PAGE_TYPE_REGISTRY — реестр обязательных типов', () => {
  it('идентификаторы уникальны', () => {
    const ids = PAGE_TYPE_REGISTRY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('обязательных типов ровно столько, сколько магазин обязан иметь', () => {
    // Число фиксируем намеренно: «обязательный тип не найден» уходит в документ
    // клиента как находка, поэтому список не должен расти молча.
    expect(PAGE_TYPE_REGISTRY.filter((t) => t.mandatory)).toHaveLength(12);
  });

  it('все пробы — относительные пути, а не чужие адреса', () => {
    for (const t of PAGE_TYPE_REGISTRY) {
      for (const p of t.probes) expect(p.startsWith('/'), `${t.id}: ${p}`).toBe(true);
    }
  });

  it('собственная проба типа опознаётся его же матчером', () => {
    // Иначе аудит стучится по адресу, который сам же потом не признает своим.
    for (const t of PAGE_TYPE_REGISTRY) {
      for (const p of t.probes) {
        if (t.id === 'home') continue;                       // корень матчится как ^/$
        expect(t.match.test(p), `${t.id}: проба ${p} не совпадает со своим match`).toBe(true);
      }
    }
  });

  const typeOf = (path: string) => PAGE_TYPE_REGISTRY.filter((t) => t.match.test(path)).map((t) => t.id);

  // Найдено этим тестом: проба '/b2b-podarunky/' лежала у типа 'corporate',
  // а его матчер её не признавал. Проба отрабатывала впустую — страница
  // отвечала 200, но тип оставался «не найдена».
  it('ни одна проба не остаётся без хозяина', () => {
    for (const t of PAGE_TYPE_REGISTRY) {
      for (const p of t.probes) {
        const owners = PAGE_TYPE_REGISTRY.filter((x) => x.match.test(p)).map((x) => x.id);
        expect(owners, `проба ${p} типа ${t.id} опознаётся как ${owners.join(', ') || 'ничто'}`).toContain(t.id);
      }
    }
  });

  it('украинские адреса возврата и оферты опознаются — это частая ложная находка', () => {
    expect(typeOf('/obmin-ta-povernennya/')).toContain('legal-return');
    expect(typeOf('/publichna-oferta/')).toContain('legal-terms');
    expect(typeOf('/konfidencijnist/')).toContain('legal-privacy');
  });

  it('«доставка и оплата» одной страницей опознаётся', () => {
    expect(typeOf('/dostavka-i-oplata/')).toContain('delivery-payment');
  });

  it('поиск опознаётся и по пути, и по параметру запроса', () => {
    expect(typeOf('/search/?q=test')).toContain('search');
    expect(typeOf('/?s=test')).toContain('search');
  });
});

describe('reachabilityDiagnosis — почему сайт не открылся', () => {
  const crawl = (o: Partial<{ error: string; status: number }>): SiteCrawl =>
    ({ error: o.error, pages: [{ status: o.status ?? null, error: o.error }] }) as unknown as SiteCrawl;

  it('429 называет ограничение частоты, а не «проверьте URL»', () => {
    expect(reachabilityDiagnosis(crawl({ status: 429 }))).toMatch(/частоту запросов/);
  });

  it('403 читается как бот-защита и подсказывает HEADFUL', () => {
    expect(reachabilityDiagnosis(crawl({ status: 403 }))).toMatch(/HEADFUL/);
  });

  it('Cloudflare в тексте ошибки достаточно и без кода', () => {
    expect(reachabilityDiagnosis(crawl({ error: 'Cloudflare challenge' }))).toMatch(/WAF/);
  });

  it('5xx отличается от 4xx', () => {
    expect(reachabilityDiagnosis(crawl({ status: 503 }))).toMatch(/ошибкой сервера \(HTTP 503\)/);
  });

  it('DNS отличается от таймаута — это разные действия оператора', () => {
    expect(reachabilityDiagnosis(crawl({ error: 'getaddrinfo ENOTFOUND' }))).toMatch(/DNS/);
    expect(reachabilityDiagnosis(crawl({ error: 'Timeout 30000ms exceeded' }))).toMatch(/таймаут/);
  });

  it('непонятная причина не выдумывает диагноз', () => {
    expect(reachabilityDiagnosis(crawl({ error: 'нечто небывалое' }))).toMatch(/Проверьте URL/);
  });
});
