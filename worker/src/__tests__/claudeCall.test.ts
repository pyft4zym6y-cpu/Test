/**
 * Один вызов Claude на три serverless-маршрута (ai-draft, aqc, interview).
 * Копий было три, и они разошлись в трёх местах — обрыв по max_tokens нигде не
 * назывался, разбор JSON у двоих был жадный, проверка HTTP-статуса была у одного.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
// @ts-expect-error — JS-модуль без типов
import { extractJson, callClaudeJson } from '../../../api/_lib/claude.js';

afterEach(() => vi.unstubAllGlobals());

const reply = (text: string, over: Record<string, unknown> = {}) => ({
  ok: true, status: 200,
  json: async () => ({ content: [{ type: 'text', text }], stop_reason: 'end_turn', ...over }),
});
const call = (over = {}) => callClaudeJson({ key: 'k', model: 'm', prompt: 'p', maxTokens: 100, ...over });

describe('извлечение JSON из ответа модели', () => {
  it('берёт объект, окружённый прозой', () => {
    expect(extractJson('Ось відповідь: {"a":1} — готово')).toBe('{"a":1}');
  });

  /*
   * Жадный /\{[\s\S]*\}/ захватывал бы всё до последней закрывающей скобки в
   * тексте — то есть прихватывал прозу за JSON.
   */
  it('не захватывает лишнего, когда после JSON есть закрывающая скобка', () => {
    expect(extractJson('{"a":1} и ещё пояснение с } внутри')).toBe('{"a":1}');
  });

  it('скобка внутри строки не ломает подсчёт глубины', () => {
    expect(extractJson('{"a":"}{","b":2}')).toBe('{"a":"}{","b":2}');
    // экранированная кавычка не закрывает строку, значит } после неё — внутри
    const withEscape = '{"a":"він сказав \\" і } тут","b":2}';
    expect(extractJson(withEscape)).toBe(withEscape);
  });

  it('вложенность считается правильно', () => {
    expect(extractJson('шум {"a":{"b":[1,2]},"c":3} хвост')).toBe('{"a":{"b":[1,2]},"c":3}');
  });

  it('массивы извлекаются тем же способом', () => {
    expect(extractJson('перед [{"id":1},{"id":2}] после', '[')).toBe('[{"id":1},{"id":2}]');
  });

  it('оборванный текст даёт null, а не куски', () => {
    expect(extractJson('{"a":1,"b":')).toBeNull();
    expect(extractJson('вообще без скобок')).toBeNull();
  });
});

describe('обрыв ответа называется своим именем', () => {
  /*
   * Модель, не успевшая дописать JSON, отдавала обрезанный текст — и все три
   * маршрута сообщали «Модель не повернула JSON». Оператор читал это как
   * «модель сломалась», повторял запрос и получал тот же обрыв.
   */
  it('max_tokens: сказано, что дело в лимите, а не в модели', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply('{"a":1,"b":', { stop_reason: 'max_tokens' })));
    await expect(call()).rejects.toThrow(/max_tokens \(100\)/);
  });

  it('отказ модели тоже назван, с категорией', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply('не можу', { stop_reason: 'refusal', stop_details: { category: 'cyber' } })));
    await expect(call()).rejects.toThrow(/відмовилась.*cyber/);
  });

  it('просто нет JSON — прежнее сообщение', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply('текст без структуры')));
    await expect(call()).rejects.toThrow(/не повернула JSON/);
  });

  it('JSON сошёлся, но ответ всё равно обрезан — это видно вызывающему', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply('[{"id":1}]', { stop_reason: 'max_tokens' })));
    const r = await call({ shape: '[' });
    expect(r.truncated).toBe(true);
    expect(r.data).toEqual([{ id: 1 }]);
  });

  it('нормальный ответ не помечается обрезанным', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply('{"ok":true}')));
    const r = await call();
    expect(r.truncated).toBe(false);
    expect(r.data).toEqual({ ok: true });
  });
});

describe('ошибки транспорта', () => {
  it('HTTP-ошибка показывает статус и тело', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 529, text: async () => 'overloaded' })));
    await expect(call()).rejects.toThrow(/HTTP 529.*overloaded/);
  });

  it('ошибка в теле ответа поднимается как есть', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ error: { message: 'credit balance too low' } }) })));
    await expect(call()).rejects.toThrow(/credit balance/);
  });

  it('система передаётся, только когда она есть', async () => {
    const bodies: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: any) => { bodies.push(JSON.parse(init.body)); return reply('{"a":1}'); }));
    await call();
    expect(bodies[0]).not.toHaveProperty('system');
    await call({ system: 'ти консультант' });
    expect(bodies[1].system).toBe('ти консультант');
  });
});
