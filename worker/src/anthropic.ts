/**
 * Тонкий клиент Claude для аудитора. Модель по умолчанию — claude-opus-5
 * (переопределяется AUDIT_MODEL). Возвращает текст; для структурированных
 * ответов просим строгий JSON и парсим устойчиво.
 */
import Anthropic from '@anthropic-ai/sdk';
import { maybeCompress } from './headroom.js';

export const MODEL = process.env.AUDIT_MODEL || 'claude-opus-5';

let client: Anthropic | null = null;
function get(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY не задан — аналитический слой недоступен');
  if (!client) client = new Anthropic();
  return client;
}

export const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** Низкоуровневый вызов для агентного цикла (tool-use). params — как в API. */
export async function createMessage(params: any): Promise<any> {
  return get().messages.create({ model: MODEL, ...params });
}

export async function ask(system: string, user: string, maxTokens = 8000): Promise<string> {
  // Опциональное сжатие крупного payload (headroom-ai) — no-op по умолчанию; системный промпт не трогаем.
  const userMsg = await maybeCompress(user);
  // adaptive thinking / effort могут опережать типы установленного SDK — параметры валидны на API
  const params: any = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: userMsg }],
  };
  const resp = await get().messages.create(params);
  return resp.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');
}

/** Возвращает срез сбалансированного JSON-объекта, начиная с raw[start] === '{',
 *  корректно проходя строки и экранирование. null — объект не закрыт. */
function balancedObject(raw: string, start: number): string | null {
  let depth = 0, inStr = false, escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return raw.slice(start, i + 1); }
  }
  return null;
}

/** Извлекает ПЕРВЫЙ полный JSON-объект из ответа модели. Устойчив к:
 *  обёрткам ```json, пояснительному тексту до/после, двум объектам подряд
 *  (прод-баг: «Unexpected non-whitespace character after JSON»), хвостовым
 *  запятым. Прежняя реализация резала от первой { до ПОСЛЕДНЕЙ } и падала. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const sources = fenced ? [fenced[1], text] : [text];
  let lastErr: unknown = null;
  for (const raw of sources) {
    let from = 0;
    for (let k = 0; k < 8; k++) {
      const start = raw.indexOf('{', from);
      if (start === -1) break;
      const slice = balancedObject(raw, start);
      if (!slice) break;
      try { return JSON.parse(slice) as T; }
      catch (e) {
        try { return JSON.parse(slice.replace(/,\s*([}\]])/g, '$1')) as T; }
        catch (e2) { lastErr = e2; }
      }
      from = start + 1;
    }
  }
  throw new Error(`В ответе нет валидного JSON-объекта${lastErr ? ` (${String(lastErr).slice(0, 80)})` : ''}`);
}

/** Человеческое объяснение типовых ошибок API — чтобы в логе прогона была не
 *  голая 400, а понятное действие для владельца. */
export function apiErrorHint(e: unknown): string {
  const s = String((e as { message?: string })?.message ?? e);
  if (/credit balance is too low/i.test(s)) return ' → Баланс Anthropic API исчерпан: пополните кредиты в console.anthropic.com → Plans & Billing (ключ, заданный на Railway). До пополнения аналитический слой (дедукции, гипотезы, синтез, КП) пропускается; детерминированные отчёты формируются полностью.';
  if (/invalid x-api-key|authentication_error|401/i.test(s)) return ' → Ключ ANTHROPIC_API_KEY недействителен или отозван — проверьте переменную окружения на Railway.';
  if (/rate.?limit|overloaded|429|529/i.test(s)) return ' → API перегружен или упёрся в лимит — повторите прогон через несколько минут.';
  return '';
}
