/**
 * Сценарії клієнта: те, що ламається тихо.
 *
 * Сценарій — це стик трьох переліків: симптом бере текст із системи, веде на
 * сторінку системи й на сторінки експертиз. Жоден із цих звʼязків не падає
 * при поломці: неіснуючий слаг просто дає посилання в нікуди, непокрита
 * система просто зникає з головної, а забута експертиза просто перестає
 * продаватись. Усе це видно лише рахунком.
 *
 * Вісім сторінок систем сайт більше не має: вони описували нашу внутрішню
 * методологію, були сиротами в дереві й дублювали і девʼять експертиз, і
 * шістнадцять видів аудиту. Назва системи в картці лишилась текстом — вона
 * пояснює, ЩО зламалось, — а наступним кроком стоїть аудит, який це й
 * знаходить. Тому тепер стережемо інше: що сценарій не завів власного тексту
 * симптому й що всі вісім причин названі рівно по одному разу.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYMPTOMS, symptomsFor } from '@/data/symptoms';
import { SYSTEMS } from '@/data/xray';
import { EXPERTISES } from '@/system/expertises';
import { PAGES, nameOf } from '@/lib/nav';

const SRC = join(__dirname, '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

describe('сценарії покривають обидві осі', () => {
  it('кожна з восьми систем має рівно один сценарій', () => {
    // Менше — система стає недосяжною з головної. Більше — два сценарії
    // ведуть в одне місце, і людина двічі читає ту саму відповідь.
    const byKey = SYMPTOMS.map((s) => s.system);
    expect([...byKey].sort()).toEqual(SYSTEMS.map((s) => s.key).sort());
  });

  it('кожна експертиза згадана хоча б в одному сценарії', () => {
    /*
     * Експертизи лишились у меню, але купує їх людина зі сценарію. Експертиза,
     * якої немає в жодному, доступна тільки тому, хто відкрив хаб і гортає
     * перелік, — тобто майже нікому.
     */
    const used = new Set(SYMPTOMS.flatMap((s) => s.fix));
    const orphans = EXPERTISES.map((e) => e.slug).filter((s) => !used.has(s));
    expect(orphans, 'експертизи без жодного сценарію').toEqual([]);
  });

  it('усі слаги експертиз у сценаріях існують', () => {
    const known = new Set(EXPERTISES.map((e) => e.slug));
    const bad = SYMPTOMS.flatMap((s) => s.fix.filter((f) => !known.has(f)));
    expect(bad).toEqual([]);
  });
});

describe('текст сценарію не заводить третьої копії', () => {
  it('симптом береться з поля feel системи, а не переписується поруч', () => {
    // Мова симптомів уже існувала у двох місцях (feel у системах, job в
    // експертизах). Третій перелік формулювань був би повторенням тієї самої
    // помилки, через яку сайт і довелось перебирати.
    const uk = symptomsFor('uk');
    for (const s of SYMPTOMS) {
      const sys = SYSTEMS.find((x) => x.key === s.system)!;
      const view = uk.find((v) => v.say === sys.feel)!;
      expect(view, sys.key).toBeTruthy();
    }
    expect(read('data/symptoms.ts'), 'у сценаріях зʼявився власний текст симптому')
      .toMatch(/localizeSystem/);
  });

  it('англійська версія не лишає українського тексту', () => {
    const en = symptomsFor('en');
    const cyr = en.flatMap((v) => [v.say, v.mean, v.systemTitle, ...v.fix.map((f) => f.title)])
      .filter((x) => /[а-яїієґ]/i.test(x));
    expect(cyr).toEqual([]);
  });

  it('підписи посилань беруться з lib/nav, а не пишуться заново', () => {
    // Інакше кнопка називає сторінку інакше, ніж сама сторінка.
    for (const v of symptomsFor('uk'))
      for (const f of v.fix) expect(f.title, f.path).toBe(nameOf(f.path, 'uk'));
  });

  it('причина названа текстом, а не посиланням у нікуди', () => {
    // Сторінок систем немає; посилання на /systems/* вело б у 301.
    const src = read('system/Symptoms.tsx');
    expect(src, 'у картці лишилось посилання на сторінку системи').not.toMatch(/\/systems/);
    for (const v of symptomsFor('uk')) expect(v.systemTitle, 'причина без назви').toBeTruthy();
  });
});

describe('блок стоїть там, де вирішує', () => {
  it('сценарії на головній стоять перед процесом, а не після', () => {
    /*
     * Розбір восьми систем із головної пішов разом зі своїми сторінками.
     * Лишився порядок, заради якого блок і ставили: спершу людина впізнає
     * свою проблему, і лише потім читає, як ми працюємо. Навпаки — це знову
     * розповідь про нас раніше за розмову про неї.
     */
    const home = read('system/SystemInMotion.tsx');
    const symp = home.indexOf('<Symptoms ');
    const how = home.indexOf('<HowWeWork />');
    expect(symp, 'блоку сценаріїв немає на головній').toBeGreaterThan(0);
    expect(how, 'блоку процесу немає на головній').toBeGreaterThan(0);
    expect(symp, 'сценарії опинились після процесу').toBeLessThan(how);
    expect(home, 'розбір восьми систем повернувся на головну').not.toContain('SystemExplorer');
  });

  it('сценарії є і на діагностиці', () => {
    expect(read('system/LossCalculator.tsx')).toMatch(/<Symptoms\b/);
  });
});

describe('наступний крок після впізнавання', () => {
  it('блок веде в аудит, а не в методологію', () => {
    /*
     * Доти підвал блоку вів на карту восьми систем — тобто на опис того, як
     * влаштовані ми. Людина, яка щойно впізнала свою проблему, має отримати
     * пропозицію, а не схему.
     */
    const src = read('system/Symptoms.tsx');
    expect(src, 'блок не веде в аудит').toMatch(/services\/audit/);
  });

  it('сторінок систем більше немає в переліку назв', () => {
    expect([...PAGES].map((p) => p.to)).not.toContain('/systems');
  });
});
