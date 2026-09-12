/**
 * Склад аудиту: те, що ламається тихо.
 *
 * Перелік видів аудиту — другий зріз того самого продукту: наші тринадцять
 * доменів діагностики (AUDIT_BLOCKS) мовою, якою клієнт їх шукає. Два
 * переліки однієї речі розходяться завжди, і мовчки:
 *
 *   — вид, привʼязаний до неіснуючого блоку, обіцяє перевірки, яких немає;
 *   — блок без жодного виду означає, що ми робимо роботу, про яку не кажемо.
 *
 * Окремо стережемо обіцянку часу. Сайт продавав «аудит за 2 хвилини» у семи
 * місцях — і цим знецінював платний аудит на 4–6 тижнів: людина читала «аудит»
 * і бачила форму з семи полів.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AUDIT_KINDS, auditBlockKeys } from '@/data/auditScope';
import { AUDIT_BLOCKS } from '@/data/auditPack';

const SRC = join(__dirname, '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

describe('види аудиту зведені з доменами діагностики', () => {
  it('кожен вид посилається на наявний домен', () => {
    const known = auditBlockKeys();
    const bad = AUDIT_KINDS.filter((k) => !known.has(k.block)).map((k) => `${k.name[0]} → ${k.block}`);
    expect(bad, `види без свого домену: ${bad.join(', ')}`).toEqual([]);
  });

  it('жоден домен не лишився без жодного виду', () => {
    // Домен без виду — робота, яку ми робимо й про яку клієнт не дізнається.
    const used = new Set(AUDIT_KINDS.map((k) => k.block));
    const orphans = AUDIT_BLOCKS.map((b) => b.key).filter((k) => !used.has(k));
    expect(orphans, `домени, не названі жодним видом: ${orphans.join(', ')}`).toEqual([]);
  });

  it('назви не повторюються і покривають те, що клієнт шукає', () => {
    const names = AUDIT_KINDS.map((k) => k.name[0]);
    expect(new Set(names).size, `дублі: ${names.join(' · ')}`).toBe(names.length);
    // Формулювання, під якими цю послугу шукають у пошуку. Якщо котресь зникне,
    // сторінка перестане відповідати на запит, заради якого вона написана.
    for (const need of ['UX/UI', 'воронки продажів', 'шляху клієнта', 'Контент-аудит',
                        'SEO-аудит', 'Технологічний', 'Маркетинговий', 'структури сайту'])
      expect(names.join(' | '), `зник вид «${need}»`).toContain(need);
  });

  it('англійська версія не лишає українського тексту', () => {
    const cyr = AUDIT_KINDS.flatMap((k) => [k.name[1], k.what[1]])
      .filter((x) => /\p{Script=Cyrillic}/u.test(x));
    expect(cyr, `кирилиця в англійській версії: ${cyr.join(' | ')}`).toEqual([]);
  });
});

describe('статика називає ті самі види', () => {
  it('дзеркало в prerender збігається з джерелом', () => {
    /*
     * prerender — окремий .mjs без доступу до TS, тож перелік там
     * продубльований. Саме ці формулювання людина набирає в пошуку, і саме
     * вони мають бути в статиці: без них сторінка не відповідає на запит,
     * заради якого написана. Дубль без сторожа розійшовся б мовчки.
     */
    const pre = readFileSync(join(SRC, '..', 'scripts', 'prerender.mjs'), 'utf8');
    const at = pre.indexOf('const AUDIT_KIND_NAMES = [');
    expect(at, 'дзеркала AUDIT_KIND_NAMES більше немає — тест треба переписати').toBeGreaterThan(0);
    const mirror = [...pre.slice(at, pre.indexOf('\n];', at)).matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(mirror).toEqual(AUDIT_KINDS.map((k) => k.name[0]));
  });
});

describe('аудит більше не продається як двохвилинна дія', () => {
  it('ніде в інтерфейсі не лишилось обіцянки «аудит за 2 хвилини»', () => {
    /*
     * Саме число хвилин не заборонене — воно є в статтях і в підписах до
     * чужих процесів. Заборонена ОБІЦЯНКА: «~2 хв» поруч із кнопкою й
     * «експрес-аудит за дві хвилини» в описі послуги.
     */
    const files = ['system', 'data'].flatMap((d) =>
      readdirSync(join(SRC, d)).filter((f) => /\.tsx?$/.test(f)).map((f) => `${d}/${f}`));
    const bad: string[] = [];
    for (const f of files) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      if (/~?2 хв\b|за 2 хвилини|за дві хвилини|~2 хвилини|in 2 minutes|two minutes|~2 min\b/.test(src))
        bad.push(f);
    }
    expect(bad, `обіцянка «аудит за 2 хвилини» повернулась у: ${bad.join(', ')}`).toEqual([]);
  });

  it('сторінка формату 01 і діагностика показують склад аудиту', () => {
    expect(read('system/ServiceFormat.tsx'), 'зі сторінки аудиту зник склад').toContain('<AuditScope />');
    expect(read('system/LossCalculator.tsx'), 'з діагностики зник склад аудиту').toContain('<AuditScope compact />');
    // Перелік один на два місця: другий інлайн-список був би другою правдою.
    expect(read('system/ServiceFormat.tsx'), 'на сторінці формату завівся власний перелік')
      .not.toContain('AUDIT_KINDS.map');
    expect(read('system/LossCalculator.tsx'), 'на діагностиці завівся власний перелік')
      .not.toContain('AUDIT_KINDS.map');
  });
});

describe('юридичний контур названий однаково', () => {
  it('маркетинговий текст більше не каже «ФОП»', () => {
    /*
     * Публічні юридичні сторінки (privacy, cookies, oferta) лишаються з
     * реальними реквізитами — їх змінює власник, а не цей тест. Тут — лише
     * маркетингові тексти про те, з ким клієнт підписує договір.
     */
    for (const f of ['data/process.ts', 'system/ProofTrust.tsx']) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(src, `${f}: повернулось «ФОП»`).not.toContain('ФОП');
      expect(src, `${f}: повернулось «sole proprietor»`).not.toContain('sole proprietor');
    }
    expect(read('data/process.ts'), 'крок «Договір» не називає європейську компанію')
      .toMatch(/європейською компанією|європейська компанія/);
  });
});
