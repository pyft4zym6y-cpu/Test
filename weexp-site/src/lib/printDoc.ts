/**
 * Кнопка печати в генерируемых документах.
 *
 * Она стояла как `onclick="window.print()"` — и это единственное, что мешало
 * включить Content-Security-Policy: обработчик в атрибуте требует
 * `script-src 'unsafe-inline'`, а с ним политика перестаёт защищать от того,
 * ради чего её ставят.
 *
 * Документ открывается через `window.open('')` и наследует происхождение
 * сайта, поэтому CSP на него распространяется. Обработчик вешаем ИЗ
 * открывающего окна: этот код лежит во внешнем файле и проходит
 * `script-src 'self'`. В разметке документа остаётся только `data-print`.
 */

/** Разметка кнопки печати — без inline-обработчика. */
export const printButton = (bg: string, margin = '8px 0') =>
  `<button class="noprint" data-print type="button" style="margin:${margin};background:${bg};color:#fff;border:0;border-radius:6px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer">🖨 Друк / зберегти в PDF</button>`;

/** Привязать печать к кнопкам документа. Вызывать после document.close(). */
export function bindPrint(w: Window | null): void {
  if (!w) return;
  w.document.querySelectorAll('[data-print]').forEach((el) =>
    el.addEventListener('click', () => w.print()));
}
