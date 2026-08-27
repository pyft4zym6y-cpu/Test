/**
 * Одно экранирование на всю базу.
 *
 * Копий было шесть, и все экранировали только `& < >`. Ни одна интерполяция
 * сегодня не стоит в атрибуте — я проверил каждую, — но шесть копий это шесть
 * мест, где следующий title="${esc(x)}" откроет дыру, и ни одного места, где
 * это чинится один раз.
 */
import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../escapeHtml';

describe('escapeHtml', () => {
  it('закрывает разметку', () => {
    expect(escapeHtml('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('амперсанд экранируется первым — иначе получится двойное экранирование', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('кавычки тоже — ради атрибутов', () => {
    // Ровно то, чего не умели шесть прежних копий.
    expect(escapeHtml('" onerror="alert(1)')).toBe('&quot; onerror=&quot;alert(1)');
    expect(escapeHtml("' onload='x")).toBe('&#39; onload=&#39;x');
  });

  it('вырваться из атрибута нечем', () => {
    const html = `<img alt="${escapeHtml('x" onerror="alert(1)')}">`;
    expect(html).toBe('<img alt="x&quot; onerror=&quot;alert(1)">');
    expect(html.match(/"/g)).toHaveLength(2);   // только кавычки самого атрибута
  });

  it('null и undefined дают пустую строку, а не «null» в документе клиента', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('числа и даты приводятся к строке', () => {
    expect(escapeHtml(0)).toBe('0');
    expect(escapeHtml(false)).toBe('false');
  });

  it('обычный текст не портится — в том числе украинский и типографика', () => {
    expect(escapeHtml('Кава «Лавацца» — 250 г')).toBe('Кава «Лавацца» — 250 г');
  });

  it('escH из админки — та же функция, а не вторая копия', async () => {
    const { escH } = await import('@/system/admin/shared');
    expect(escH).toBe(escapeHtml);
  });
});
