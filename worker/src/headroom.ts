/**
 * Опциональное сжатие контекста через headroom-ai (github.com/headroomlabs-ai/headroom)
 * ПЕРЕД отправкой крупных полезных нагрузок в Claude. Экономит токены на объёмных
 * данных обхода (DOM/блоки/логи), не трогая выверенные системные промпты.
 *
 * Дизайн — безопасность по умолчанию:
 *  - выключено, пока не задан HEADROOM_COMPRESS=1;
 *  - зависимость подгружается динамически: её отсутствие НЕ ломает сборку/импорт;
 *  - результат принимается, только если это непустая строка КОРОЧЕ исходной
 *    (сжатие обязано уменьшать); иначе — молчаливый откат к оригиналу;
 *  - любая ошибка → оригинал. Поведение по умолчанию побайтно не меняется.
 *
 * Включение: `npm i headroom-ai` в worker/ + переменная HEADROOM_COMPRESS=1.
 */

const ENABLED = () => process.env.HEADROOM_COMPRESS === '1';
const MIN_LEN = Number(process.env.HEADROOM_MIN_LEN || 2000); // мелкие payload сжимать не выгодно

// Приводим неизвестную форму ответа headroom к строке (str | {text|content|compressed|prompt}).
function asText(out: unknown): string | null {
  if (typeof out === 'string') return out;
  if (out && typeof out === 'object') {
    const o = out as Record<string, unknown>;
    for (const k of ['text', 'content', 'compressed', 'prompt', 'result']) {
      if (typeof o[k] === 'string') return o[k] as string;
    }
  }
  return null;
}

/** Возвращает сжатый текст, либо оригинал (если выключено / не выгодно / сбой). */
export async function maybeCompress(text: string): Promise<string> {
  if (!ENABLED() || !text || text.length < MIN_LEN) return text;
  try {
    // @ts-ignore — необязательная зависимость, типов может не быть до установки
    const mod: any = await import('headroom-ai').catch(() => null);
    const compress = mod?.compress ?? mod?.default?.compress;
    if (typeof compress !== 'function') return text;
    const out = await compress(text, { model: process.env.AUDIT_MODEL || 'claude-opus-5' });
    const compact = asText(out);
    // Принять только если это реально короче — иначе форма ответа не та, что ждём.
    return compact && compact.length > 0 && compact.length < text.length ? compact : text;
  } catch {
    return text;
  }
}
