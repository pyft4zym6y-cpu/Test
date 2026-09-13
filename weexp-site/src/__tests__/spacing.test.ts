/**
 * Отступы под фиксированной шапкой.
 *
 * Шапка `position: fixed`, поэтому каждое место, которому нужно «не залезть под
 * неё», носило собственное число: 58px в хлебных крошках, 76px на мобильном,
 * 60px в reduced-motion. Шапка выросла до ~75px — и числа отстали молча:
 * крошки уехали ПОД неё, а на низком окне (ноутбук ~660px высоты) под неё
 * заезжал заголовок героя. Теперь число одно и меряется с живого узла;
 * тест держит, чтобы новые отступы не завели себе второе.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '..', 'system', 'system.css'), 'utf8');
const blogCss = readFileSync(join(__dirname, '..', 'system', 'blog.css'), 'utf8');
const shell = readFileSync(join(__dirname, '..', 'system', 'SystemShell.tsx'), 'utf8');

/** Тело правила по селектору (первое вхождение). */
const rule = (selector: string): string => {
  const i = css.indexOf(selector + ' {');
  const j = css.indexOf(selector + '{');
  const at = i >= 0 ? i : j;
  expect(at, `правило ${selector} не найдено`).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('}', at));
};

describe('высота шапки — одно число', () => {
  it('переменная объявлена с запасным значением', () => {
    expect(css).toMatch(/:root\s*\{[^}]*--sysh-h:\s*\d+px/);
  });

  it('шапка меряется с живого узла, а не задана константой в коде', () => {
    expect(shell).toMatch(/setProperty\('--sysh-h'/);
    expect(shell).toMatch(/getBoundingClientRect\(\)\.height/);
    expect(shell).toMatch(/ResizeObserver/);
  });

  it('хлебные крошки считают отступ от переменной', () => {
    const r = rule('.sysx-crumbs');
    expect(r).toContain('var(--sysh-h)');
    expect(r).not.toMatch(/padding:\s*calc\(\d+px/);
  });

  it('первый экран резервирует высоту шапки', () => {
    /*
     * Раньше проверялась `.sysx-scene` — абсолютная сцена скролл-фильма:
     * padding родителя её не двигал, поэтому запас считался именно на ней.
     * Фильма нет, герой — обычная секция в потоке, и запас живёт на ней.
     * Правило то же: число берётся из переменной, а не пишется руками.
     */
    const r = rule('.sysx-hero');
    expect(r).toMatch(/padding:\s*calc\(var\(--sysh-h\)/);
    expect(r, 'первый экран снова завёл своё число под шапку').not.toMatch(/padding:\s*calc\(\d+px/);
  });

  it('верхний контейнер каждой страницы блога резервирует высоту шапки', () => {
    /*
     * Проверки выше смотрят только в system.css — и блог прошёл мимо них
     * целиком: у статьи под шапкой ПОЛНОСТЬЮ скрывались хлебные крошки.
     * Они были в разметке, видимые, с нормальным цветом и размером — их
     * просто не было видно, и ни один тест этого не замечал.
     */
    const top = (sel: string): string => {
      const at = blogCss.indexOf(sel + ' {');
      expect(at, `правило ${sel} не найдено в blog.css`).toBeGreaterThanOrEqual(0);
      return blogCss.slice(at, blogCss.indexOf('}', at));
    };
    for (const sel of ['.blogp-in', '.blogh-head']) {
      expect(top(sel), `${sel} не считает высоту шапки`).toMatch(/padding:\s*calc\(var\(--sysh-h/);
    }
  });

  it('ни одно правило не отсчитывает шапку своим числом', () => {
    // Ловим то, чем оно было: calc(<число>px + env(safe-area-inset-top)) в
    // padding-top — так писали именно запас под шапку.
    const bad = [...css.matchAll(/padding-top:\s*calc\((\d+)px\s*\+\s*env\(safe-area-inset-top/g)];
    expect(bad.map((m) => m[1])).toEqual([]);
  });
});

describe('текст не упирается в рамку', () => {
  /** Классы, которым брутальный слой выдаёт рамку и тень. */
  const framed = (() => {
    const at = css.indexOf('/* — Картки / панелі: чорна рамка');
    expect(at).toBeGreaterThan(0);
    const block = css.slice(at, css.indexOf('){', at));
    return [...block.matchAll(/\.([a-z0-9-]+)/g)].map((m) => m[1]);
  })();

  it('список брутальных карточек не отстал от разметки', () => {
    /*
     * Здесь стояла проверка `.svc-pains` — списка симптомов на странице
     * системы. Страницы больше нет, класс стал мёртвым, и сторож начал
     * стеречь то, чего не существует.
     *
     * Проверяем правило, а не конкретный класс: каждое имя в списке должно
     * что-то оформлять. Когда страницу удаляют, её классы остаются в этом
     * перечне и тихо тащат за собой правила — так в system.css накопилось
     * шесть слоёв от удалённых разделов.
     */
    const tsx = readdirSync(join(__dirname, '..', 'system'))
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => readFileSync(join(__dirname, '..', 'system', f), 'utf8'))
      .join('\n');
    const dead = framed.filter((c) => !tsx.includes(c));
    expect(dead, `в списке брутальных карточек классы, которых нет в разметке: ${dead.join(', ')}`).toEqual([]);
  });

  // Проверять внутренние отступы так же построчно бессмысленно: у половины
  // классов padding живёт в отдельном правиле ниже, а у контейнеров-сеток его
  // несут дети. Полноту даёт замер в браузере (checkFit).
});

/**
 * Рядок логотипів (`.sysx-marquee`).
 *
 * Він був АБСОЛЮТНИЙ і напівпрозорий — лежав по низу липкої сцени й накривав
 * собою те, що під ним. Через це тут жив цілий механізм: ResizeObserver міряв,
 * скільки місця рядок зʼїдає знизу сцени, писав `--sysx-marq-h`, а сцена
 * закладала це число в нижній padding. Механізм двічі ламався мовчки (мірялась
 * висота рядка замість зайнятого місця; мобільне правило не читало змінну), і
 * «Безкоштовно · без реєстрації» лягало просто на логотипи.
 *
 * Рядок повернули у звичайний потік: він займає рівно свою висоту й нікого не
 * накриває. Резервувати місце нема під що — і міряти нема чого. Сторож тримає
 * саме це: щойно рядок знову виймуть із потоку, весь клас тих помилок
 * повернеться разом із ним.
 */
describe('рядок логотипів стоїть у потоці', () => {
  const marquee = readFileSync(join(__dirname, '..', 'system', 'PartnerMarquee.tsx'), 'utf8');

  it('рядок не виймають із потоку', () => {
    const r = rule('.sysx-marquee');
    expect(r, 'рядок знову absolute/fixed — він накриє собою нижні рядки героя')
      .not.toMatch(/position:\s*(absolute|fixed)/);
  });

  it('ніхто не резервує місце під рядок', () => {
    // Змінна існувала лише заради абсолютного рядка. Якщо вона знову з'явиться,
    // значить знову з'явився шар, що накриває текст.
    expect(css, '--sysx-marq-h повернулась — значить рядок знову поверх тексту')
      .not.toMatch(/--sysx-marq-h/);
    expect(marquee, 'компонент знову міряє сцену').not.toMatch(/getBoundingClientRect/);
  });
});
