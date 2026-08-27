/**
 * Статические страницы в public/ (правовые документы и 404) отдаются напрямую,
 * минуя сборку: ни токенов, ни компонентов, ни системы контраста они не видят.
 * Ровно поэтому смену айдентики они пережили в старом виде — тёмный #0A1218
 * оставался в них после того, как весь сайт стал светлым, и клиент, открывший
 * «Політику приватності» из футера, попадал на страницу другого продукта.
 *
 * Тест держит их привязанными к живой палитре: значения приходится повторять
 * вручную, значит их надо проверять машинно.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = join(__dirname, '..', '..', 'public');
const PAGES = readdirSync(PUBLIC)
  .filter((f) => f.endsWith('.html') && !f.startsWith('google'))   // google*.html — подтверждение владения
  .map((f) => ({ f, src: readFileSync(join(PUBLIC, f), 'utf8') }));

/** Палитра отставленной тёмной айдентики — её быть не должно нигде. */
const RETIRED = /#0A1218|#B7C0C6|#D6362B|#94A0A8|#6E7C86|#E7EAE7/i;

const hex = (h: string) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a: string, b: string) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

const PAPER = '#FAF5E9';

describe('статические страницы public/', () => {
  it('страницы вообще найдены — иначе тест пустой', () => {
    expect(PAGES.map((p) => p.f).sort()).toEqual(['404.html', 'cookies.html', 'oferta.html', 'privacy.html']);
  });

  it('отставленная тёмная айдентика не осталась ни в одной', () => {
    const guilty = PAGES.filter((p) => RETIRED.test(p.src)).map((p) => p.f);
    expect(guilty, 'страница в палитре снятого с эксплуатации сайта').toEqual([]);
  });

  it('фон — бумага текущей айдентики', () => {
    for (const p of PAGES) expect(p.src, p.f).toMatch(new RegExp(`background:\\s*${PAPER}`, 'i'));
  });

  it('каждый цвет текста читаем на этой бумаге', () => {
    /*
     * Собираем ФАКТИЧЕСКИЕ значения color: из страницы и проверяем каждое.
     * Так тест ловит и цвет, который добавят завтра, а не только сегодняшние.
     */
    const LARGE = new Set(['#F5301C']);   // только в крупных начертаниях (h1 48px+/800): порог 3.0
    for (const p of PAGES) {
      const colors = [...p.src.matchAll(/color:\s*(#[0-9A-Fa-f]{6})/g)].map((m) => m[1].toUpperCase());
      expect(colors.length, `${p.f}: цвета текста не найдены`).toBeGreaterThan(2);
      for (const c of new Set(colors)) {
        if (c === '#FFFFFF') continue;                       // белый — только на заливке, проверяется ниже
        const need = LARGE.has(c) ? 3.0 : 4.5;
        expect(`${p.f} ${c}: ${ratio(c, PAPER).toFixed(2)} ≥ ${need}`)
          .toBe(`${p.f} ${c}: ${Math.max(ratio(c, PAPER), need).toFixed(2)} ≥ ${need}`);
      }
    }
  });

  it('белая подпись ставится только на заливку, которая её выдерживает', () => {
    for (const p of PAGES) {
      // правило вида `color:#fff;background:#XXXXXX` — кнопка
      for (const m of p.src.matchAll(/color:\s*#fff(?:fff)?\s*;\s*background:\s*(#[0-9A-Fa-f]{6})/gi))
        expect(ratio('#FFFFFF', m[1]), `${p.f}: белый на ${m[1]}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('правовые документы сохраняют обязательные разделы', () => {
    // Оболочку меняли, текст — нет. Если раздел исчез, это уже не оформление.
    const must: Record<string, string[]> = {
      'privacy.html': ['Розпорядник даних', 'Які дані ми збираємо', 'Ваші права', 'cookie'],
      'oferta.html': ['WEEXP'],
      'cookies.html': ['cookie'],
    };
    for (const [file, parts] of Object.entries(must)) {
      const page = PAGES.find((p) => p.f === file)!;
      for (const part of parts) expect(page.src, `${file}: пропал «${part}»`).toContain(part);
    }
  });
});
