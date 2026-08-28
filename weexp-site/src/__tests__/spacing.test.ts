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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '..', 'system', 'system.css'), 'utf8');
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

  it('сцена героя резервирует высоту шапки', () => {
    // Именно .sysx-scene, а не .sysx-stage: сцена абсолютна, padding родителя
    // её не двигает — такое правило изображало бы работу, которой не делает.
    expect(rule('.sysx-scene')).toMatch(/padding:\s*calc\(var\(--sysh-h\)/);
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

  it('список симптомов на странице системы имеет внутренний отступ', () => {
    expect(framed).toContain('svc-pains');
    const r = rule('.svc-pains');
    expect(r).toMatch(/padding:\s*clamp\(/);
    expect(r).not.toMatch(/padding:\s*0[;\s]/);
  });

  // Проверять так весь список бессмысленно: у половины классов padding живёт
  // в отдельном правиле ниже, а у контейнеров-сеток его несут дети. Полноту
  // даёт замер в браузере (padding < 10px у текстового листа с рамкой) — он
  // и нашёл здесь единственного нарушителя.

});

/**
 * Рядок логотипів по низу сцени (`.sysx-marquee`) — абсолютний і напівпрозорий:
 * він не ховає те, що під ним, а лягає зверху. Нижній відступ сцени про нього
 * не знав, тож на невисокому вікні (ноут ~840px і нижче) останні рядки —
 * «Безкоштовно · ~2 хв» і підказка про скрол — опинялись просто в смузі
 * логотипів. Замір: зазор був −23px, став +18px.
 */
describe('низ сцени: рядок логотипів', () => {
  const marquee = readFileSync(join(__dirname, '..', 'system', 'PartnerMarquee.tsx'), 'utf8');

  it('сцена резервує висоту рядка знизу', () => {
    expect(rule('.sysx-scene')).toMatch(/var\(--sysx-marq-h/);
  });

  it('висота міряється з живого вузла, а не задана числом', () => {
    expect(marquee).toMatch(/setProperty\('--sysx-marq-h'/);
    expect(marquee).toMatch(/getBoundingClientRect\(\)\.height/);
    expect(marquee).toMatch(/ResizeObserver/);
  });

  it('змінна ставиться на сцену, а не глобально', () => {
    // Рядок є лише на головній: глобальне значення з'їдало б низ сцен там,
    // де жодного рядка немає.
    expect(marquee).toMatch(/closest\('\.sysx-stage'\)/);
    expect(css).not.toMatch(/:root\s*\{[^}]*--sysx-marq-h/);
  });

  it('запасне значення нульове — сторінка без рядка не отримує порожнечу', () => {
    expect(rule('.sysx-scene')).toMatch(/var\(--sysx-marq-h,\s*0px\)/);
  });

  it('на низькому вікні підказку скролу прибирають, а не пришпилюють', () => {
    /*
     * Спершу її пришпилили абсолютно над рядком логотипів. Це прибрало наїзд
     * на логотипи й створило новий: пришпилена, вона вийшла з потоку, і вміст,
     * що центрується, наїжджав на неї знизу — на 1600×780 поверх рядка
     * «Безкоштовно · ~2 хв», на 1024×640 поверх «Як ми рахуємо і перевіряємо».
     * Підказка — найменш цінний елемент екрана: коли місця бракує, її місце
     * звільняють, а не накривають нею текст.
     */
    const at = css.indexOf('@media (max-height: 820px)');
    expect(at).toBeGreaterThan(0);
    const block = css.slice(at, css.indexOf('\n}', at));
    expect(block).toMatch(/\.sysx-scene > \.sysx-scrollhint \{ display: none; \}/);
    expect(block, 'підказку знову пришпилили в потік поверх сусіднього рядка').not.toMatch(/position:\s*absolute/);
  });
});
