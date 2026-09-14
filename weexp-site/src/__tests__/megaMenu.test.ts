/**
 * МЕГА-МЕНЮ: З ВЕРХНЬОЇ НАВІГАЦІЇ ВИДНО ВСЕ, ЩО ГЛИБШЕ ПЕРШОГО РІВНЯ.
 *
 * Меню показувало шість адрес, а під ними жили ще двадцять одна: три формати
 * послуг, девʼять експертиз, девʼять розділів блогу. Побачити їх можна було,
 * лише зайшовши в розділ і здогадавшись, що там усередині ще рівень. Для
 * власника сайту це виглядало так: сторінки є, індексуються, приймають
 * трафік — а в структурі їх немає.
 *
 * Сторож тримає ДВА правила. Перше: жодна сторінка другого рівня не зникає з
 * меню. Друге, важливіше: перелік рахується з ДАНИХ. Набраний руками, він
 * відстане з першою ж правкою — так уже сталось із дзеркалом меню в
 * пререндері, і саме тому тут перевіряється не вміст, а джерело.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { megaSections } from '@/lib/megaMenu';
import { SERVICES, servicePath } from '@/data/services';
import { EXPERTISES } from '@/system/expertises';

const SRC = join(__dirname, '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

describe('мега-меню показує всі рівні', () => {
  const mega = megaSections();
  const all = mega.flatMap((s) => s.items.map((i) => i.to));

  it('кожен формат послуг є в меню', () => {
    const missing = SERVICES.map(servicePath).filter((u) => !all.includes(u));
    expect(missing, `форматів немає в меню: ${missing.join(', ')}`).toEqual([]);
    expect(SERVICES.length).toBeGreaterThan(2);
  });

  it('кожна експертиза є в меню', () => {
    const missing = EXPERTISES.map((e) => `/expansion/${e.slug}`).filter((u) => !all.includes(u));
    expect(missing, `експертиз немає в меню: ${missing.join(', ')}`).toEqual([]);
    expect(EXPERTISES.length).toBeGreaterThan(5);
  });

  it('розділів блогу в меню НЕМАЄ', () => {
    /*
     * Перша версія виводила в панель девʼять розділів блогу. Це інший тип
     * сторінок: туди приходять читати, а не купувати, — і в навігації вони
     * відсували послуги вниз. На телефоні буквально за край: у шторку набралось
     * 1354px вмісту при вікні 568px, і «Послуги» опинились на 724px ВИЩЕ
     * екрана. У меню лишається те, що продає; блог — звичайний пункт, його
     * розділи живуть на самій сторінці блогу.
     */
    const blogItems = mega.filter((s) => s.to === '/blog').flatMap((s) => s.items);
    expect(blogItems, 'розділи блогу знову в меню').toEqual([]);
    const cats = all.filter((u) => u.includes('c='));
    expect(cats, 'у меню фільтри блогу').toEqual([]);
    // Сам розділ у меню лишається — інакше це знову сторінка поза структурою.
    expect(mega.map((s) => s.to)).toContain('/blog');
  });

  it('панель мають лише комерційні розділи', () => {
    const withPanel = mega.filter((s) => s.items.length).map((s) => s.to).sort();
    expect(withPanel).toEqual(['/expansion', '/services']);
  });

  it('перелік рахується з даних, а не набраний руками', () => {
    /*
     * Головне правило. Якщо завтра зʼявиться десята експертиза чи четвертий
     * формат, вони мусять потрапити в меню самі — інакше сторож вище лише
     * зафіксує розходження, замість того щоб його не допустити.
     */
    const code = read('lib/megaMenu.ts');
    for (const src of ['SERVICES', 'EXPERTISES'])
      expect(code, `перелік меню не спирається на ${src}`).toContain(src);
    const hardcoded = [...code.matchAll(/to:\s*'\/(services|expansion)\/[a-z-]+'/g)];
    expect(hardcoded.map((m) => m[0]), 'адреси підрозділів набрані в меню руками').toEqual([]);
  });

  it('панель відкривається не лише мишею', () => {
    /*
     * На тач-екрані hover не існує, а панель, яку не можна відкрити з
     * клавіатури, ховає сторінки від усіх, хто не користується мишею.
     * Тому в пункті з дітьми є кнопка з aria-expanded, а не сам лише hover.
     */
    const shell = read('system/SystemShell.tsx');
    expect(shell, 'немає кнопки-каретки').toContain('sysh-caret');
    expect(shell, 'стан панелі не повідомляється скрінрідеру').toMatch(/aria-expanded=\{mega === l\.to\}/);
    expect(shell, 'панель не закривається з клавіатури').toContain("e.key === 'Escape'");
  });

  it('посилання панелі є в розмітці, а не зʼявляються від JS', () => {
    // Панель ховає атрибут hidden, а не умова рендера: інакше краулер і пошук
    // по сторінці не бачать двадцять одне посилання, які й мали стати видимими.
    const shell = read('system/SystemShell.tsx');
    expect(shell).toMatch(/className="sysh-mega" hidden=\{!open\}/);
  });

  it('мобільна шторка показує той самий перелік', () => {
    // Шість пунктів на телефоні й двадцять сім на десктопі — це два різні
    // сайти для двох різних людей.
    const shell = read('system/SystemShell.tsx');
    expect(shell, 'у шторці немає вкладеного переліку').toContain('sysh-sheet-sub');
    expect(shell, 'шторка бере пункти не з того самого джерела').toMatch(/sysh-sheet-links[\s\S]{0,400}MEGA\.map/);
  });
});
