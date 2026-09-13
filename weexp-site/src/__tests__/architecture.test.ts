/**
 * Перший екран і ваги автономності.
 *
 * Блок «Як це влаштовано» — чотири рівні пропозиції — з сайту пішов разом із
 * data/architecture.ts: це був опис того, як влаштовані МИ, на сторінці, де
 * людина шукає, що ми для неї робимо. Разом із ним пішли й тести на звʼязок
 * його чисел зі сторінками — звʼязувати більше нічого.
 *
 * Лишилось те, що стереже саму пропозицію: H1 називає послугу, на першому
 * екрані одна кнопка, і ваги автономності не розходяться з моделлю.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICES } from '@/data/services';
import { SYSTEMS, AUTONOMY_W } from '@/data/xray';


const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('три формата', () => {
  it('номера идут подряд и у каждого своя страница', () => {
    expect(SERVICES.map((x) => x.n)).toEqual(
      Array.from({ length: SERVICES.length }, (_, k) => String(k + 1).padStart(2, '0')));
    const app = read('src/App.tsx');
    expect(app, 'нет маршрута /services').toContain("'/services'");
    expect(app, 'нет маршрута страницы формата').toContain("'/services/:slug'");
  });
});

describe('первый экран', () => {
  const home = read('src/system/SystemInMotion.tsx');

  it('H1 говорит о потребности клиента, а не о нашей работе', () => {
    /*
     * H1 прошёл четыре состояния. «Система замість героїзму» — позиция бренда.
     * «Продажі, які не тримаються на вас» — обещание результата: лучше, но
     * человек всё ещё не знает, ЧТО мы делаем. «Перебудовуємо онлайн-продажі»
     * назвало услугу — и подлежащим стали МЫ: первое, что видит человек, —
     * чем занят исполнитель, а не что он сам получит.
     *
     * Теперь H1 называет результат клиента («Більше продажів з того самого
     * трафіку»), а чем мы его добываем — строкой ниже. Сторож держит правило,
     * а не формулировку: не начинать с глагола от первого лица (мы делаем) и
     * называть предмет, ради которого человек пришёл.
     */
    const h1 = /<h1 className="sysx-display sysx-h1">([\s\S]*?)<\/h1>/.exec(home)?.[1] ?? '';
    expect(h1, 'H1 не найден').toBeTruthy();
    for (const slogan of ['героїзму', 'heroics'])
      expect(h1, 'H1 снова стал слоганом').not.toContain(slogan);
    const uk = [...h1.matchAll(/t\('([^']+)'/g)].map((m) => m[1]).join(' ');
    /*
     * Граница слова здесь — (\s|$), а не \b. `\b` в JS считает словом только
     * ASCII: после кириллического «о» и перед пробелом границы для него НЕТ,
     * поэтому первая версия правила молча пропускала «Перебудовуємо продажі» —
     * ровно тот случай, ради которого написана.
     */
    expect(uk, `H1 снова про нас, а не про клиента: «${uk}»`).not.toMatch(/^\S*(уємо|ємо|аємо|имо)(\s|$)/);
    expect(uk, 'H1 не называет того, ради чего человек пришёл').toMatch(/продаж|виторг|прибут|e-commerce/i);
  });

  it('на первом экране ровно одна кнопка', () => {
    /*
     * Было две рядом — «порахувати витік» и «залишити заявку», — то есть
     * человеку предлагали выбрать способ обращения раньше, чем он понял
     * услугу. Вторая никуда не делась: она постоянно стоит в шапке.
     */
    const at = home.indexOf('sysx-hero-in');
    expect(at, 'первый экран не найден').toBeGreaterThan(0);
    const hero = home.slice(at, home.indexOf('</section>', at));
    // sysx-cta-row — это контейнер, а не кнопка: без границы слова
    // регулярка считала его за вторую кнопку.
    const ctas = [...hero.matchAll(/className="sysx-cta(?=[ "])/g)].length;
    expect(ctas, `кнопок на первом экране: ${ctas}`).toBe(1);
  });

  it('не обещает, что деньги текут сами', () => {
    // Обещание пассивного дохода противоречит всему остальному тексту: мы
    // продаём управляемую систему, а не автопилот.
    expect(home).not.toContain('гроші течуть');
    expect(home).not.toContain('money flows');
  });

  it('финальная сцена не повторяет лид первого экрана', () => {
    const leads = [...home.matchAll(/className="sysx-lead">\{t\('([^']{60,})'/g)].map((m) => m[1]);
    expect(new Set(leads).size, 'два лида на странице совпадают слово в слово').toBe(leads.length);
  });
});

describe('ваги автономності', () => {
  /*
   * Independence Score і Business Health — один і той самий розрахунок:
   * середнє по восьми системах, зважене на автономність. Ваги лежали двома
   * копіями (data/xray і system/lossModel) під двома назвами підсумку. Копії
   * були байт у байт однакові, тому ніщо не падало — і саме тому правка ваг в
   * одному файлі мовчки розвела б два бали за ті самі відповіді.
   */
  it('живуть в одному місці', () => {
    const loss = read('src/system/lossModel.ts');
    expect(loss, 'у lossModel знову зʼявився власний набір ваг')
      .not.toMatch(/const W: Record<SysKey, number> = \{/);
    expect(loss).toContain('AUTONOMY_W');
  });

  it('покривають усі вісім систем', () => {
    expect(Object.keys(AUTONOMY_W).sort()).toEqual(SYSTEMS.map((s) => s.key).sort());
    for (const [k, v] of Object.entries(AUTONOMY_W)) {
      expect(v, `${k}: вага поза розумним діапазоном`).toBeGreaterThan(0);
      expect(v, `${k}: вага поза розумним діапазоном`).toBeLessThanOrEqual(2);
    }
  });

  it('дають організації більшу вагу, ніж експансії', () => {
    // Це і є сенс метрики: бізнес без ролей і процесів тримається на людині,
    // скільки б ринків він не мав. Якщо ваги зрівняти, бал перестане міряти
    // незалежність і стане просто середнім здоровʼям.
    expect(AUTONOMY_W.org).toBeGreaterThan(AUTONOMY_W.expansion);
    expect(AUTONOMY_W.operations).toBeGreaterThan(AUTONOMY_W.expansion);
  });
});
