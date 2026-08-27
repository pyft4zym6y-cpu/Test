// Один виклик Claude на всі serverless-маршрути (ai-draft, aqc, interview).
//
// Раніше цей виклик був у трьох копіях, і копії розійшлись у трьох місцях:
//
//  1. Обрив по max_tokens ніде не називався. Модель, яка не встигла дописати
//     JSON, віддавала обрізаний текст — і всі три маршрути повідомляли «Модель
//     не повернула JSON». Оператор бачив діагноз «модель зламалась», повторював
//     запит і отримував той самий обрив. Тепер причина називається своїм ім'ям.
//
//  2. Розбір JSON. interview.js мав акуратний прохід по балансу дужок (модель
//     іноді додає префікс або суфікс), а ai-draft.js і aqc.js — жадібний
//     /\{[\s\S]*\}/ і /\[[\s\S]*\]/. Жадібний захоплює зайве, щойно після JSON
//     трапиться будь-яка закривна дужка в прозі. Акуратний був написаний один
//     раз і не використовувався двома іншими.
//
//  3. Перевірка HTTP-статусу. interview.js перевіряв r.ok і показував тіло
//     помилки; двоє інших ішли одразу в r.json() і покладались на те, що
//     Anthropic віддасть JSON навіть на 5xx — проксі віддає HTML.
//
// Кеш промпту тут НЕ вмикаємо: системні промпти маршрутів — 139–698 токенів,
// нижче мінімального кешованого префікса (512–4096 залежно від моделі).
// cache_control виглядав би оптимізацією і не робив би нічого.

/**
 * Перший збалансований JSON-об'єкт або масив у тексті.
 * Рядки і екрановані лапки враховуються — інакше дужка всередині рядка
 * ламає підрахунок глибини.
 */
export function extractJson(text, open = '{') {
  const close = open === '{' ? '}' : ']';
  const start = text.indexOf(open);
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === open) depth += 1;
    else if (c === close) { depth -= 1; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;   // дужки не зійшлись — текст обірвано
}

/**
 * Виклик моделі з розбором JSON-відповіді.
 *
 * @param {object} o
 * @param {string} o.key      ANTHROPIC_API_KEY
 * @param {string} o.model    ідентифікатор моделі
 * @param {string} [o.system] системний промпт
 * @param {string} o.prompt   повідомлення користувача
 * @param {number} o.maxTokens
 * @param {'{'|'['} [o.shape] що очікуємо на виході — об'єкт чи масив
 * @param {number} [o.timeoutMs] обрив за часом (функція Vercel має свою стелю)
 * @returns розібраний JSON
 */
export async function callClaudeJson({ key, model, system, prompt, maxTokens, shape = '{', timeoutMs = 0 }) {
  const ctrl = timeoutMs ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      ...(ctrl ? { signal: ctrl.signal } : {}),
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: maxTokens, ...(system ? { system } : {}), messages: [{ role: 'user', content: prompt }] }),
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Anthropic HTTP ${r.status}${t ? ': ' + t.slice(0, 160) : ''}`);
  }
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || 'Anthropic error');

  const text = (j.content ?? []).map((c) => c.text ?? '').join('');
  const raw = extractJson(text, shape);
  if (!raw) {
    // Обрив — окрема причина, а не «модель не повернула JSON».
    if (j.stop_reason === 'max_tokens')
      throw new Error(`Відповідь обірвано на межі max_tokens (${maxTokens}) — JSON не дописано. Збільште ліміт або скоротіть вхід.`);
    if (j.stop_reason === 'refusal')
      throw new Error(`Модель відмовилась відповідати${j.stop_details?.category ? ` (${j.stop_details.category})` : ''}.`);
    throw new Error('Модель не повернула JSON');
  }
  // JSON зійшовся, але відповідь усе одно обірвано: віддаємо те, що є, і кажемо про це.
  return { data: JSON.parse(raw), truncated: j.stop_reason === 'max_tokens' };
}
