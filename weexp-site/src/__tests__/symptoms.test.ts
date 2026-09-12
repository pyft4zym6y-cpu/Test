/**
 * Сценарії клієнта: те, що ламається тихо.
 *
 * Сценарій — це стик трьох переліків: симптом бере текст із системи, веде на
 * сторінку системи й на сторінки експертиз. Жоден із цих звʼязків не падає
 * при поломці: неіснуючий слаг просто дає посилання в нікуди, непокрита
 * система просто зникає з головної, а забута експертиза просто перестає
 * продаватись. Усе це видно лише рахунком.
 *
 * Окремо важливо після того, як «Системи» пішли з головного меню: тепер блок
 * сценаріїв — ЄДИНИЙ шлях із головної до восьми сторінок систем. Якщо він
 * перестане покривати всі вісім, частина найкомерційніших сторінок сайту
 * знову стане сиротами — рівно тим, чим вони вже колись були.
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
      const view = uk.find((v) => v.systemPath === `/systems/${sys.slug}`)!;
      expect(view.say, sys.key).toBe(sys.feel);
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
    for (const v of symptomsFor('uk')) {
      expect(v.systemTitle).toBe(nameOf(v.systemPath, 'uk'));
      for (const f of v.fix) expect(f.title, f.path).toBe(nameOf(f.path, 'uk'));
    }
  });
});

describe('блок стоїть там, де вирішує', () => {
  it('сценарії на головній — до розбору восьми систем', () => {
    /*
     * Порядок і є змістом зміни: доти другим екраном ішла наша таксономія.
     * Якщо блок опиниться нижче SystemExplorer, усе повернеться на місце, і
     * помітити це можна буде лише очима.
     */
    const home = read('system/SystemInMotion.tsx');
    const symp = home.indexOf('<Symptoms ');
    const expl = home.indexOf('<SystemExplorer />');
    expect(symp, 'блоку сценаріїв немає на головній').toBeGreaterThan(0);
    expect(expl, 'розбору систем немає на головній').toBeGreaterThan(0);
    expect(symp, 'сценарії опинились ПІСЛЯ восьми систем').toBeLessThan(expl);
  });

  it('сценарії є і на діагностиці', () => {
    expect(read('system/LossCalculator.tsx')).toMatch(/<Symptoms\b/);
  });
});

describe('вісім систем не стали сиротами після виходу з меню', () => {
  it('«Системи» більше не пункт головного меню', () => {
    expect(PAGES.map((p) => p.to)).not.toContain('/systems');
  });

  it('назва сторінки збереглась — вона потрібна крихтам і підвалу', () => {
    expect(nameOf('/systems', 'uk')).toBeTruthy();
    expect(nameOf('/systems', 'en')).toBeTruthy();
  });

  it('блок сценаріїв веде і на кожну систему, і на оглядову сторінку', () => {
    // Оглядова /systems лишилась без пункту меню: єдиний вхід у неї — рядок
    // «вісім систем однією картою» у підвалі блоку.
    const src = read('system/Symptoms.tsx');
    expect(src, 'немає посилання на оглядову сторінку систем').toMatch(/lp\('\/systems'\)/);
    expect(src, 'картка не веде на сторінку системи').toMatch(/lp\(s\.systemPath\)/);
  });
});
