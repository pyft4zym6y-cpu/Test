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
import { PAGES, EXTRA_PAGES, nameOf } from '../lib/nav';
import { HEADLINE_PROOF } from '../data/cases';

const SYS = join(__dirname, '..', 'system');
const files = readdirSync(SYS).filter((f) => f.endsWith('.tsx'));
const sources = files.map((f) => ({ f, src: readFileSync(join(SYS, f), 'utf8') }));

/** Підписи CTA за адресою призначення: <Link to={lp('/x')} className="…cta…">…</Link> */
function ctaLabels(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const re = /<Link[^>]*?to=\{(?:`\$\{)?lp\('(\/[a-z-]*)'\)[^>]*?className="[^"]*cta[^"]*"[^>]*>([\s\S]*?)<\/Link>/g;
  for (const { src } of sources) {
    for (const m of src.matchAll(re)) {
      const to = m[1];
      // з t('укр', 'eng') беремо українську; інакше — сирий текст
      const tm = /\{t\('([^']+)'/.exec(m[2]);
      const label = (tm ? tm[1] : m[2].replace(/<[^>]*>/g, '')).trim()
        .replace(/[\s→↗]+$/u, '').replace(/\s+/g, ' ');
      if (!label) continue;
      if (!out.has(to)) out.set(to, new Set());
      out.get(to)!.add(label);
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
});

describe('одна дія — одна назва', () => {
  const labels = ctaLabels();

  it('CTA взагалі знайдені — інакше тест нічого не стереже', () => {
    expect(labels.get('/diagnose')?.size ?? 0).toBeGreaterThan(0);
    expect(labels.get('/contact')?.size ?? 0).toBeGreaterThan(0);
  });

  it('/diagnose — не більше пʼяти підписів', () => {
    /*
     * Дозволено рівно пʼять: назва продукту («Express audit» — меню, шапка,
     * шторка), канонічна вигода («Порахувати витік» — усі герої) і три
     * контекстні, де сам розділ і є вигодою: дельта на /proof, виграш за
     * роллю, конкретна система на сторінці послуги.
     */
    const s = labels.get('/diagnose')!;
    expect([...s].sort(), `підписів ${s.size}: ${[...s].join(' · ')}`).toHaveLength(5);
  });

  it('/contact — не більше двох: заявка і референс', () => {
    const s = labels.get('/contact')!;
    expect([...s].sort(), `підписів ${s.size}: ${[...s].join(' · ')}`).toHaveLength(2);
  });

  it('/proof називається так само, як пункт меню', () => {
    const s = labels.get('/proof');
    for (const l of s ?? []) expect(l, `посилання «${l}» ≠ пункт меню`).toBe(nameOf('/proof', 'uk'));
  });
});

describe('числа збігаються зі своїм джерелом', () => {
  const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

  it('кількість аудитів у пакеті — та сама скрізь', () => {
    // auditPack.ts — джерело; сторінка цін і опис /audit-pack обіцяли 12.
    const pack = read('data/auditPack.ts');
    const n = (/(\d+) спеціалізованих аудитів/.exec(pack) || [])[1];
    expect(n, 'у auditPack.ts не знайдено кількості аудитів').toBeTruthy();
    expect(read('system/Pricing.tsx'), `Pricing обіцяє не ${n} аудитів`).toContain(`${n} аудитів`);
    expect(read('lib/seo-data.json'), `опис /audit-pack обіцяє не ${n} аудитів`).toContain(`${n} аудитів`);
  });

  it('кількість доменів на сторінці цін = кількості в моделі', () => {
    /*
     * Сторінка цін продавала «150+ спеціалізованих перевірок» — числа, якого
     * немає ніде в коді. Решта чисел на сайті перевіряються, і одне
     * неперевірюване роняє довіру до всіх. Замінено на домени, які можна
     * порахувати; тест тримає їх звʼязаними з моделлю.
     */
    const xray = read('data/xray.ts');
    const head = xray.slice(0, xray.indexOf('export const systemBySlug'));
    const domains = [...head.matchAll(/^\s*domains: \[([^\]]*)\]/gm)]
      .reduce((sum, m) => sum + m[1].split(',').length, 0);
    expect(domains, 'не вдалося порахувати домени').toBeGreaterThan(0);
    expect(read('system/Pricing.tsx'), `Pricing обіцяє не ${domains} доменів`)
      .toContain(`${domains} доменів діагностики`);
    expect(read('system/Pricing.tsx'), 'повернулось число без джерела')
      .not.toContain('150+');
  });

  it('числа першого екрана справді є в кейсах, на які посилаються', () => {
    /*
     * Перший екран головної не містив жодного числа результату — єдине, що там
     * стояло, це «$0.5–10M», розмір аудиторії. Тепер там три числа з кейсів.
     * Тест тримає їх звʼязаними з джерелом: якщо метрику в кейсі змінили або
     * прибрали, головна не має тихо продовжувати обіцяти старе.
     */
    const src = read('data/cases.ts');
    expect(HEADLINE_PROOF.length, 'смуга доказів порожня').toBeGreaterThan(0);
    for (const h of HEADLINE_PROOF) {
      const i = src.indexOf(`slug: '${h.slug}'`);
      expect(i, `кейса ${h.slug} не існує`).toBeGreaterThan(-1);
      // Дивимось лише всередині цього кейса — до початку наступного.
      const next = src.indexOf("slug: '", i + 10);
      const block = src.slice(i, next === -1 ? undefined : next);
      const re = new RegExp(`label: '${h.metric}'[^}]*?'${h.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`);
      expect(re.test(block), `${h.slug}: метрика «${h.metric}» більше не дає ${h.value}`).toBe(true);
    }
  });

  it('кількість систем у шапках файлів = кількості в моделі', () => {
    const xray = read('data/xray.ts');
    const keys = [...xray.matchAll(/^\s*\{\s*key: '[a-z-]+', num:/gm)].length;
    expect(keys, 'не вдалося порахувати системи в SYSTEMS').toBeGreaterThan(0);
    for (const f of ['data/xray.ts', 'data/cases.ts', 'system/SystemInMotion.tsx']) {
      // Не рахуємо число всередині діапазону («1–3 із 8 систем»): це не окрема заявка.
      const stale = read(f).match(/(?<![\d–-])\b([0-9]+) систем/gu) || [];
      for (const s of stale)
        expect(s, `${f}: «${s}» — у моделі ${keys}`).toBe(`${keys} систем`);
    }
  });
});
