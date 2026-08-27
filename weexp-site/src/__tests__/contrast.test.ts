/**
 * Контраст цветовых токенов. Проверяется арифметикой, а не глазами: разница
 * между 3.94:1 и 4.5:1 на экране не видна, и именно поэтому такое живёт годами.
 *
 * Замер axe-core до починки: 99 узлов с нарушениями WCAG AA на восьми публичных
 * страницах, 74 из них — фирменный красный #F5301C в роли текста и фона кнопок
 * (3.94:1 на белом при норме 4.5). Мы продаём аудит, который это и находит.
 *
 * Правило, которое держит этот тест: красный, СОПРИКАСАЮЩИЙСЯ с текстом, берёт
 * --red-ink на светлом и --red на тёмном. Направление переворачивается, потому
 * что требование 4.5:1 читается с обеих сторон.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '..', 'system', 'system.css'), 'utf8');

/** Значение токена из :root. */
const token = (name: string): string => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`токен --${name} не найден`);
  return m[1];
};

const lin = (c: number) => (c /= 255, c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const WHITE = '#FFFFFF';
const AA = 4.5;

/*
 * Светлые поверхности, на которых реально лежит текст. Проверять только на
 * белом было мало: --red-ink давал 5.01 на белом и честно проходил, а на
 * панели #F3EFE6 — 4.37, то есть не проходил. Белый на сайте почти нигде не
 * фон; фон — крем и панель.
 */
const SURFACES: Record<string, string> = {
  'белый': WHITE,
  'крем (--cream)': '#FAF5E9',
  'панель (.sysh)': '#F3EFE6',
  'бумага документов': '#FBF4E4',
};

describe('красный на светлом', () => {
  it('--red-ink проходит AA как текст на КАЖДОЙ светлой поверхности', () => {
    for (const [name, bg] of Object.entries(SURFACES))
      expect(ratio(token('red-ink'), bg), `--red-ink на «${name}»`).toBeGreaterThanOrEqual(AA);
  });

  it('белый текст на --red-ink тоже проходит: это фон кнопок', () => {
    expect(ratio(WHITE, token('red-ink'))).toBeGreaterThanOrEqual(AA);
  });

  it('семантические алиасы наследуют доступное значение', () => {
    // --data, --alert, --bad читаются как информация, то есть как текст.
    for (const t of ['data', 'alert', 'bad'])
      for (const [name, bg] of Object.entries(SURFACES))
        expect(ratio(token(t), bg), `--${t} на «${name}»`).toBeGreaterThanOrEqual(AA);
  });

  it('красный в шапке (--sh-data) — тоже текст, тоже на панели', () => {
    const m = css.match(/--sh-data:\s*(#[0-9A-Fa-f]{6})/);
    expect(m, 'токен --sh-data не найден').toBeTruthy();
    for (const [name, bg] of Object.entries(SURFACES))
      expect(ratio(m![1], bg), `--sh-data на «${name}»`).toBeGreaterThanOrEqual(AA);
  });

  it('чистый бренд-красный на белом НЕ проходит — потому он и не для текста', () => {
    // Этот тест закрепляет причину разделения: если он вдруг станет проходить,
    // значит кто-то поменял --red, и два токена больше не нужны.
    expect(ratio(token('red'), WHITE)).toBeLessThan(AA);
  });
});

describe('красный на тёмном — правило переворачивается', () => {
  it('чистый --red на тёмном проходит AA', () => {
    expect(ratio(token('red'), token('deep'))).toBeGreaterThanOrEqual(AA);
  });

  it('а --red-ink на тёмном НЕ проходит — он рассчитан на светлый фон', () => {
    expect(ratio(token('red-ink'), token('deep'))).toBeLessThan(AA);
  });
});

describe('прочие пары, которые ломались', () => {
  it('подвал: серый на тёмном', () => {
    expect(ratio('#7A828C', token('deep'))).toBeGreaterThanOrEqual(AA);
    expect(css).not.toMatch(/color:\s*#6b727b/i);   // прежнее значение давало 3.84:1
  });

  it('жёлтый бейдж читается на тёмном', () => {
    expect(ratio(token('yellow'), token('deep'))).toBeGreaterThanOrEqual(AA);
  });

  it('статусы ok и warn проходят на белом', () => {
    for (const t of ['ok-strong', 'warn-strong']) {
      expect(ratio(token(t), WHITE), `--${t}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe('правило записано в самом файле', () => {
  it('у токенов объяснено, чем --red отличается от --red-ink', () => {
    // Иначе следующий разработчик поставит --red на текст, и всё вернётся.
    expect(css).toMatch(/--red-ink/);
    expect(css).toMatch(/торкається тексту/);
  });
});
