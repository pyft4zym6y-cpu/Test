/**
 * Слова, які бачить відвідувач, живуть у різних файлах — і розходяться тихо.
 *
 * Замір до цих тестів, на зібраному сайті:
 *   · /diagnose — головна конверсія — називалась ДВАНАДЦЯТЬМА різними
 *     підписами: «Express audit», «Безкоштовна діагностика», «Пройти
 *     діагностику», «Порахувати витік», «Порахувати мій витік», «Знайти вузьке
 *     місце», «Побачити мій виграш», «Знайти свою дельту», «Почати з
 *     експрес-аудиту», «Почати з діагностики», «Пройти Express Audit»,
 *     «Перевірити цю систему в діагностиці». Людина, що пройшла три сторінки,
 *     бачила чотири різні назви й не могла зрозуміти, що це одна дія.
 *   · /contact — шістьма, /proof — трьома.
 *   · Назви сторінок жили в ТРЬОХ списках (меню, підвал, крихти) і вже
 *     розійшлись: у меню «Наші перемоги» — у крихтах «Докази»; «Про нас» —
 *     «Команда»; «Початок співпраці» — «Формати та ціни».
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES, EXTRA_PAGES, SUB_PAGES, nameOf } from '../lib/nav';
import { SERVICES } from '../data/services';
import { EXPERTISES } from '../system/expertises';
import { TOTAL_DOMAINS } from '../data/xray';
import { AUDIT_BLOCKS } from '../data/auditPack';
import { HEADLINE_PROOF } from '../data/cases';

const SYS = join(__dirname, '..', 'system');
const files = readdirSync(SYS).filter((f) => f.endsWith('.tsx'));
const sources = files.map((f) => ({ f, src: readFileSync(join(SYS, f), 'utf8') }));

/**
 * Кожне внутрішнє посилання: куди веде, як підписане і чи це кнопка.
 *
 * Доти збирач дивився тільки на className із «cta» — і не бачив, що підвал
 * блогу кличе «Усі статті», сторінка 404 — «Докази» й «Експансія», а хаб
 * експертиз — «Формати роботи». Половина сайту називала розділи по-своєму,
 * і жоден тест цього не показував.
 */
type LinkUse = { to: string; label: string; button: boolean };

function siteLinks(): LinkUse[] {
  const out: LinkUse[] = [];
  /*
   * Якір після адреси лишаємо в цілі: посилання на /proof#method веде в
   * РОЗДІЛ сторінки, а не на сторінку. Такий підпис пояснює, що там усередині
   * («як ми рахуємо ці цифри»), і назвою розділу бути не зобовʼязаний.
   */
  const re = /<Link([^>]*?)to=\{(?:`\$\{)?lp\('(\/[a-z/-]*)'\)([^}]*?)\}([^>]*?)>([\s\S]*?)<\/Link>/g;
  /*
   * Кабінет клієнта й адмінка — закриті поверхні на app.weexp.agency, а не
   * розділи публічного сайту: у них свій шапковий рядок («кабінет») і свій
   * вихід («на сайт»). Правило про назви розділів стосується сайту.
   */
  const CLOSED = /^(Cabinet|AdminPanel|ProjectView|admin\/)/;
  for (const { f, src } of sources) {
    if (CLOSED.test(f)) continue;
    for (const m of src.matchAll(re)) {
      const attrs = m[1] + m[4];
      const anchor = /['`]#/.test(m[3]) ? '#' : '';
      const to = m[2] + anchor;
      // з t('укр', 'eng') беремо українську; інакше — сирий текст
      const tm = /\{t\('([^']+)'/.exec(m[5]);
      const label = (tm ? tm[1] : m[5].replace(/<[^>]*>/g, '')).trim()
        .replace(/[\s→↗←]+$/u, '').replace(/^[←\s]+/u, '').replace(/\s+/g, ' ');
      if (!label || label.startsWith('{')) continue;
      /*
       * Кнопкою вважаємо будь-який клас, що закінчується на -cta: у шапці це
       * sysh-cta, в тілі сторінок sysx-cta. Перша версія знала лише про
       * другий — і кнопка в шапці читалась як текстове посилання.
       */
      out.push({ to, label, button: /className="[^"]*[a-z]+-cta\b/.test(attrs) });
    }
  }
  return out;
}


describe('назви сторінок — один перелік', () => {
  it('меню, підвал і крихти не тримають власних списків назв', () => {
    for (const f of ['SystemShell.tsx', 'SiteFooter.tsx', 'Breadcrumbs.tsx']) {
      const src = readFileSync(join(SYS, f), 'utf8');
      expect(src, `${f} не бере назви з lib/nav`).toMatch(/from '@\/lib\/nav'/);
    }
  });

  it('короткі назви підсторінок не розійшлись із джерелом', () => {
    /*
     * SUB_PAGES дублює назви експертиз навмисно: expertises.ts важкий (34 КБ),
     * і тягнути його на сторінку статті заради двох слів немає сенсу. Ціна
     * цього рішення — цей тест.
     *
     * Вісім систем звідси пішли разом зі своїми сторінками: вони описували
     * нашу внутрішню методологію й дублювали і девʼять експертиз, і
     * шістнадцять видів аудиту.
     */
    const bad: string[] = [];
    for (const p of SUB_PAGES) {
      if (p.to.startsWith('/expansion/')) {
        const e = EXPERTISES.find((x) => `/expansion/${x.slug}` === p.to);
        if (!e) { bad.push(`${p.to}: експертизи з таким слагом немає`); continue; }
        if (e.title[0] !== p.uk) bad.push(`${p.to}: «${p.uk}» ≠ «${e.title[0]}»`);
        if (e.title[1] !== p.en) bad.push(`${p.to}: «${p.en}» ≠ «${e.title[1]}»`);
      }
      if (p.to.startsWith('/services/')) {
        const m = SERVICES.find((x) => `/services/${x.slug}` === p.to);
        if (!m) { bad.push(`${p.to}: формату з таким слагом немає`); continue; }
        if (m.name[0] !== p.uk) bad.push(`${p.to}: «${p.uk}» ≠ «${m.name[0]}»`);
      }
    }
    expect(bad, `назви розійшлись:\n${bad.join('\n')}`).toEqual([]);
  });

  it('кожна експертиза й кожен формат мають назву в переліку', () => {
    const named = new Set(SUB_PAGES.map((p) => p.to));
    const missing = [
      ...EXPERTISES.map((e) => `/expansion/${e.slug}`),
      ...SERVICES.map((m) => `/services/${m.slug}`),
    ].filter((to) => !named.has(to));
    expect(missing, `підсторінки без назви: ${missing.join(', ')}`).toEqual([]);
  });

  it('жодна названа сторінка не лишилась без входу', () => {
    /*
     * Меню скоротилось до семи пунктів, і чотири сторінки з нього вийшли:
     * головна, Express audit, системи й склад пакета аудиту. Вони не зникли —
     * їх тримає підвал. Якщо перелік у підвалі відстане від lib/nav, сторінка
     * просто стане недосяжною: рівно так вісім сторінок /systems/* колись уже
     * ставали сиротами, і помітити це можна було тільки очима.
     */
    const foot = readFileSync(join(SYS, 'SiteFooter.tsx'), 'utf8');
    const at = foot.indexOf('const FOOT_EXTRA = [');
    expect(at, 'переліку FOOT_EXTRA більше немає — тест треба переписати').toBeGreaterThan(0);
    const listed = [...foot.slice(at, foot.indexOf('];', at)).matchAll(/'([^']+)'/g)].map((m) => m[1]);
    /*
     * «Кабінет» — виняток: він живе на app.weexp.agency, і посилання на нього
     * в підвалі сайту вело відвідувача з сайту геть. Назва потрібна крихтам,
     * входу з публічного сайту він не має й не повинен мати.
     */
    const orphans = EXTRA_PAGES.map((p) => p.to)
      .filter((to) => to !== '/cabinet' && !listed.includes(to));
    expect(orphans, `сторінки без входу ні з меню, ні з підвалу: ${orphans.join(', ')}`).toEqual([]);
  });

  it('у кожної сторінки меню є назва обома мовами', () => {
    for (const p of [...PAGES, ...EXTRA_PAGES]) {
      expect(nameOf(p.to, 'uk'), `немає укр. назви для ${p.to}`).toBeTruthy();
      expect(nameOf(p.to, 'en'), `немає англ. назви для ${p.to}`).toBeTruthy();
    }
  });

  it('назви не повторюються — два пункти з однією назвою нерозрізненні', () => {
    const uk = PAGES.map((p) => p.uk);
    expect(new Set(uk).size, `дублі в меню: ${uk.join(', ')}`).toBe(uk.length);
  });

  it('назви не відрізняються однією літерою', () => {
    /*
     * «Система» (головна) і «Системи» (перелік восьми) стояли поруч у меню:
     * формально різні рядки, на око — те саме. Порівнюємо за основою слова.
     */
    const stem = (x: string) => x.toLowerCase().replace(/[аиіїяьы]+$/u, '');
    const stems = PAGES.map((p) => stem(p.uk));
    const dupes = stems.filter((x, i) => stems.indexOf(x) !== i);
    expect(dupes, `пункти майже однакові: ${dupes.join(', ')}`).toEqual([]);
  });

  it('головна називається в меню так само, як у крихтах', () => {
    const crumbs = readFileSync(join(SYS, 'Breadcrumbs.tsx'), 'utf8');
    const home = /const HOME: \[string, string\] = \['([^']+)'/.exec(crumbs);
    expect(home, 'у Breadcrumbs не знайдено назви головної').toBeTruthy();
    expect(nameOf('/', 'uk'), 'меню і крихти називають головну по-різному').toBe(home![1]);
  });
});

describe('одна дія — одна назва', () => {
  const links = siteLinks();

  it('посилання взагалі знайдені — інакше тест нічого не стереже', () => {
    expect(links.length, 'у розмітці не знайдено жодного внутрішнього посилання').toBeGreaterThan(20);
    expect(links.some((l) => l.button), 'жодної кнопки не розпізнано').toBe(true);
    expect(links.some((l) => !l.button), 'жодного звичайного посилання не розпізнано').toBe(true);
  });

  it('звичайне посилання називає розділ так само, як меню', () => {
    /*
     * Правило, яке тримає весь сайт узгодженим. Посилання-ТЕКСТ на сторінку,
     * у якої є назва в lib/nav, зобовʼязане цю назву й носити: інакше людина
     * не впізнає, що вже там була. Кнопки — виняток: вони називають ДІЮ
     * («Порахувати витік»), і для них правило нижче.
     */
    const bad = links
      .filter((l) => !l.button)
      .filter((l) => { const c = nameOf(l.to, 'uk'); return c && l.label !== c; })
      .map((l) => `${l.to}: «${l.label}» замість «${nameOf(l.to, 'uk')}»`);
    expect([...new Set(bad)], `розділи, названі не так, як у меню:\n${[...new Set(bad)].join('\n')}`).toEqual([]);
  });

  it('у кнопки на одну адресу — одна назва дії', () => {
    /*
     * Дві різні дії на одну сторінку читаються як дві різні сторінки.
     *
     * ВИНЯТОК — /contact, і він свідомий, не забутий. Власник задав для заявки
     * підписи під контекст: у герої «Знайти точки росту», після переліку
     * напрямів «Знайти можливості для росту», після опису першого кроку
     * «Обговорити мій e-commerce», у шапці «Залишити заявку». Це його рішення
     * про тон, і сторож не місце, щоб його переголосувати.
     *
     * Правило лишається живим там, де його й порушували: на другому шляху.
     * Розрахунок уже одного разу жив під двома назвами — «Порахувати витік» і
     * «Експрес-аудит», — і людина не розуміла, що вже там була.
     */
    const byTo = new Map<string, Set<string>>();
    for (const l of links.filter((x) => x.button && x.to !== '/contact')) {
      if (!byTo.has(l.to)) byTo.set(l.to, new Set());
      byTo.get(l.to)!.add(l.label);
    }
    const bad = [...byTo].filter(([, set]) => set.size > 1)
      .map(([to, set]) => `${to}: ${[...set].join(' · ')}`);
    expect(bad, `адреси з кількома назвами дії:\n${bad.join('\n')}`).toEqual([]);
    // Виняток не має розповзтись: адрес зі списку рівно одна.
    const all = new Map<string, Set<string>>();
    for (const l of links.filter((x) => x.button)) {
      if (!all.has(l.to)) all.set(l.to, new Set());
      all.get(l.to)!.add(l.label);
    }
    expect([...all].filter(([, set]) => set.size > 1).map(([to]) => to)).toEqual(['/contact']);
  });

  it('посилань на видалені сторінки не лишилось', () => {
    // /systems, /audit-pack і /pricing більше не існують: посилання на них
    // вели б відвідувача в 301 замість сторінки.
    const gone = ['/systems', '/audit-pack', '/pricing'];
    const bad = [...new Set(links.map((l) => l.to))]
      .filter((to) => gone.some((g) => to === g || to.startsWith(g + '/')));
    expect(bad, `посилання на видалені сторінки: ${bad.join(', ')}`).toEqual([]);
  });
});
