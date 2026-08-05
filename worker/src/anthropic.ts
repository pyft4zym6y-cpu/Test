/**
 * Тонкий клиент Claude для аудитора. Модель по умолчанию — claude-opus-5
 * (переопределяется AUDIT_MODEL). Возвращает текст; для структурированных
 * ответов просим строгий JSON и парсим устойчиво.
 */
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = process.env.AUDIT_MODEL || 'claude-opus-5';

let client: Anthropic | null = null;
function get(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY не задан — аналитический слой недоступен');
  if (!client) client = new Anthropic();
  return client;
}

export const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function ask(system: string, user: string, maxTokens = 8000): Promise<string> {
  // adaptive thinking / effort могут опережать типы установленного SDK — параметры валидны на API
  const params: any = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: user }],
  };
  const resp = await get().messages.create(params);
  return resp.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');
}

/** Извлекает первый JSON-объект из ответа (терпимо к обёрткам ```json). */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('В ответе нет JSON-объекта');
  return JSON.parse(raw.slice(start, end + 1)) as T;
}
