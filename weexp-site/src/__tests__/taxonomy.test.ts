/**
 * Сколько у нас систем, доменов и направлений — вопрос к данным, а не к тексту.
 *
 * Список направлений экспертизы живёт в EXPERTISES, а заголовки, описания,
 * prerender, sitemap и OG-карточки — в seo-data.json и og-gen.mjs. Когда
 * добавились брендинг, UX/UI и веб-разработка, три страницы остались без title,
 * без статики и без карточки: хаб на них ссылался, а для краулера их не
 * существовало, и мета-описание /expansion продолжало обещать «шість напрямів»
 * при девяти. Одна правда, записанная в трёх местах, расходится молча.
 *
 * Числа состава аудита (13 аудитов, 35 доменов, 18 доменов зрелости) свои
 * источники имели и были верны; страница цен набирала их руками, и здесь
 * сторожим уже не значение, а то, что она берёт их из модели.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEMS, TOTAL_SYSTEMS, TOTAL_DOMAINS } from '@/data/xray';
import { MATURITY_DOMAIN_MODULE } from '@/lib/supa';
import { AUDIT_BLOCKS } from '@/data/auditPack';
import { EXPERTISES } from '@/system/expertises';
import SEO from '@/lib/seo-data.json';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('размер таксономии считается из данных', () => {
  it('TOTAL_SYSTEMS и TOTAL_DOMAINS совпадают с SYSTEMS', () => {
    expect(TOTAL_SYSTEMS).toBe(SYSTEMS.length);
    expect(TOTAL_DOMAINS).toBe(SYSTEMS.reduce((n, s) => n + s.domains.length, 0));
  });

  it('страница цен берёт состав аудита из модели, а не набирает его', () => {
    // Комментарии вырезаем: сторож про то, что ВИДИТ клиент. Без этого он
    // ловил объяснение в шапке файла — ровно ту прозу, которая рассказывает,
    // откуда эти числа берутся.
    const pricing = read('src/system/Pricing.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(pricing).not.toMatch(/\d+ доменів діагностики/);
    expect(pricing).not.toMatch(/\d+ аудитів/);
    expect(pricing).toContain('TOTAL_DOMAINS');
    expect(pricing).toContain('AUDIT_BLOCKS.length');
  });

  it('«18 доменів зрілості» совпадает со своим источником', () => {
    // Это число осталось литералом: его источник — MATURITY_DOMAIN_MODULE в
    // lib/supa, а supa поднимает клиент Supabase прямо на импорте, и тащить
    // его в публичную страницу цен ради одного числа дороже, чем проверить.
    const n = Object.keys(MATURITY_DOMAIN_MODULE).length;
    expect(read('src/system/Pricing.tsx'), `модель знает ${n} доменов зрелости`)
      .toContain(`зрілість по ${n} доменах`);
  });

  it('число аудитов, которое ещё написано словами, совпадает с каталогом', () => {
    // В названии отчёта «Діагностичний звіт: 13 аудитів» число внутри строки —
    // перевести его в шаблон нельзя без потери заголовка, поэтому сверяем.
    const pack = read('src/data/auditPack.ts');
    for (const m of pack.matchAll(/(\d+)\s+(?:спеціалізованих\s+)?аудит(?:ів|и)\b/g)) {
      expect(Number(m[1]), `«${m[0]}» разошлось с AUDIT_BLOCKS`).toBe(AUDIT_BLOCKS.length);
    }
  });
});

describe('направления экспертизы — один список', () => {
  const slugs = EXPERTISES.map((e) => e.slug);

  it('seo-data описывает ровно те направления, что есть в EXPERTISES, и в том же порядке', () => {
    // Порядок важен: prerender строит ссылки хаба обходом Object.entries.
    expect(Object.keys(SEO.expansion)).toEqual(slugs);
  });

  it('у каждого направления есть заголовок и описание на обоих языках', () => {
    for (const [slug, m] of Object.entries(SEO.expansion) as [string, Record<string, string[]>][]) {
      for (const lang of ['uk', 'en']) {
        expect(m[lang]?.[0], `${slug}.${lang}: нет заголовка`).toBeTruthy();
        expect(m[lang]?.[1]?.length, `${slug}.${lang}: нет описания`).toBeGreaterThan(60);
      }
    }
  });

  it('у каждого направления своя OG-карточка', () => {
    // Пока карточки не было, страница отдавала карточку хаба: в ленте девять
    // разных ссылок выглядели одной и той же.
    const og = read('scripts/og-gen.mjs');
    const cards = [...og.matchAll(/\['([a-z-]+)', '[^']*', '[^']*'\],/g)].map((m) => m[1]);
    for (const slug of slugs) expect(cards, `нет карточки exp-${slug}`).toContain(slug);
  });

  it('описание /expansion называет столько направлений, сколько их есть', () => {
    // Тут стояло «Шість напрямів» / «Six directions», когда их стало девять:
    // мета-описание в выдаче обещало на три страницы меньше, чем сайт отдаёт.
    // Сторожим не конкретное слово, а расхождение слова с длиной списка.
    const UK = ['', 'один', 'два', 'три', 'чотири', 'пʼять', 'шість', 'сім', 'вісім', 'девʼять', 'десять'];
    const EN = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const hub = SEO.routes['/expansion'];

    const found = (text: string, words: string[]) =>
      words.map((w, n) => [w, n] as const)
        .filter(([w]) => w && new RegExp(`\\b${w}\\b`, 'i').test(text))
        .map(([, n]) => n);

    for (const [text, words] of [[hub.uk[1], UK], [hub.en[1], EN]] as const) {
      for (const n of found(text, words)) {
        expect(n, `«${text}» обещает ${n} направлений, а их ${EXPERTISES.length}`)
          .toBe(EXPERTISES.length);
      }
    }
  });
});
