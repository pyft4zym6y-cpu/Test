/**
 * Кеш промптов. Ломается он молча: всё работает, просто дороже — и заметить это
 * можно только по доле чтений из кеша.
 *
 * Найдено в этом проходе:
 *  · агентный цикл (до девяти вызовов) кеша не использовал вовсе, и вся растущая
 *    история — включая дампы страниц по 6 КБ в результатах инструментов —
 *    переоплачивалась на каждом шаге;
 *  · счётчик вёл cacheRead/cacheWrite, но наружу они не выходили: инструмент
 *    был, показаний нет;
 *  · оценка стоимости брала ВСЕ входные токены по полной ставке, хотя чтение из
 *    кеша дешевле входа вдесятеро — «cost per audit» завышался тем сильнее, чем
 *    лучше работал кеш.
 */
import { describe, it, expect } from 'vitest';
import { cachedSystem, markCachePoint } from '../agent.js';
import { estimateLlmCostUsd, CACHE_READ_MULT, MODEL_PRICE_IN } from '../version.js';
import { buildRunRecord } from '../runrecord.js';

type Block = { type: string; text: string; cache_control?: { type: string; ttl?: string } };
const msg = (role: string, ...blocks: string[]): { role: string; content: Block[] } =>
  ({ role, content: blocks.map((t): Block => ({ type: 'text', text: t })) });
const points = (ms: any[]) =>
  ms.flatMap((m) => (Array.isArray(m.content) ? m.content : [])).filter((b: any) => b.cache_control).length;

describe('системный блок', () => {
  it('помечен точкой кеша — она накрывает и tools, и system', () => {
    // Порядок рендера tools → system → messages, кеш префиксный.
    const [b] = cachedSystem('метод');
    expect(b.cache_control).toEqual({ type: 'ephemeral', ttl: '1h' });
  });

  it('TTL час, а не пять минут: шаг агента включает обход страницы браузером', () => {
    expect(cachedSystem('x')[0].cache_control.ttl).toBe('1h');
  });

  it('текст не искажается — иначе префикс разойдётся и кеш промахнётся', () => {
    expect(cachedSystem('ровно этот текст')[0].text).toBe('ровно этот текст');
  });
});

describe('точка кеша в растущей истории', () => {
  it('ставится на предпоследнее сообщение: свежий ход остаётся вне кеша', () => {
    const ms = [msg('user', 'a'), msg('assistant', 'b'), msg('user', 'c')];
    markCachePoint(ms);
    expect(ms[1].content[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(ms[2].content[0].cache_control).toBeUndefined();
  });

  it('точка всегда ровно одна — лимит четыре на запрос', () => {
    // Без снятия старой их накапливалось бы по одной за ход, и на пятом
    // запрос отвергался бы целиком.
    const ms: any[] = [msg('user', 'a')];
    for (let i = 0; i < 8; i++) {
      ms.push(msg('assistant', `ход ${i}`), msg('user', `ответ ${i}`));
      markCachePoint(ms);
      expect(points(ms), `после хода ${i}`).toBe(1);
    }
  });

  it('точка переезжает вперёд с каждым ходом', () => {
    const ms: any[] = [msg('user', 'a'), msg('assistant', 'b'), msg('user', 'c')];
    markCachePoint(ms);
    const first = ms.findIndex((m) => m.content.some((b: any) => b.cache_control));
    ms.push(msg('assistant', 'd'), msg('user', 'e'));
    markCachePoint(ms);
    const second = ms.findIndex((m) => m.content.some((b: any) => b.cache_control));
    expect(second).toBeGreaterThan(first);
  });

  it('короткая история не ломает разметку', () => {
    expect(() => markCachePoint([])).not.toThrow();
    expect(() => markCachePoint([msg('user', 'a')])).not.toThrow();
  });

  it('сообщение со строковым content пропускается, а не падает', () => {
    const ms: any[] = [{ role: 'user', content: 'строка' }, msg('assistant', 'b'), msg('user', 'c')];
    expect(() => markCachePoint(ms)).not.toThrow();
  });
});

describe('стоимость по составу входа', () => {
  it('чтение из кеша дешевле полного входа вдесятеро', () => {
    const full = estimateLlmCostUsd({ inputTokens: 1_000_000, outputTokens: 0 });
    const cached = estimateLlmCostUsd({ inputTokens: 0, outputTokens: 0, cacheRead: 1_000_000 });
    expect(cached).toBeCloseTo(full * CACHE_READ_MULT, 6);
    expect(full).toBeCloseTo(MODEL_PRICE_IN, 6);
  });

  it('запись в кеш дороже входа — иначе оценка занижалась бы', () => {
    const full = estimateLlmCostUsd({ inputTokens: 1_000_000, outputTokens: 0 });
    const written = estimateLlmCostUsd({ inputTokens: 0, outputTokens: 0, cacheWrite: 1_000_000 });
    expect(written).toBeGreaterThan(full);
  });

  it('прогон с хорошим кешем стоит заметно меньше, чем считалось раньше', () => {
    // Раньше все входные токены шли по полной ставке.
    const totalIn = 1_000_000, cacheRead = 900_000, uncached = 100_000;
    const старая = estimateLlmCostUsd({ inputTokens: totalIn, outputTokens: 0 });
    const новая = estimateLlmCostUsd({ inputTokens: uncached, outputTokens: 0, cacheRead });
    expect(новая).toBeLessThan(старая / 3);
  });
});

describe('Run Record показывает кеш', () => {
  const base = {
    auditId: 'a1', client: 'ТОВ Тест', tier: 1 as const, takenAt: '2026-08-01T00:00:00Z',
    generatedAt: '2026-08-01T01:00:00Z',
    config: { agentic: true, prelaunch: false, premium: false, webSearch: false, hasApiKey: true },
    input: { site: 'https://x.ua', competitors: 0, pagesCrawled: 5, competitorPagesCrawled: 0,
             backupScreenshots: false, answersProvided: false },
    files: ['qa.json'],
  };

  it('доля чтений из кеша попадает в запись прогона', () => {
    const rr = buildRunRecord({ ...base, usage: {
      calls: 9, inputTokens: 1_000_000, outputTokens: 20_000,
      uncachedInput: 200_000, cacheRead: 800_000, cacheWrite: 40_000,
    } });
    expect(rr.cost.cacheReadTokens).toBe(800_000);
    expect(rr.cost.cacheWriteTokens).toBe(40_000);
    expect(rr.cost.cacheHitRate).toBe(0.8);
  });

  it('прогон без кеша даёт нулевую долю, а не пустоту', () => {
    const rr = buildRunRecord({ ...base, usage: {
      calls: 1, inputTokens: 50_000, outputTokens: 1_000, uncachedInput: 50_000, cacheRead: 0, cacheWrite: 0,
    } });
    expect(rr.cost.cacheHitRate).toBe(0);
  });

  it('старая запись без разбивки не ломается и считается как раньше', () => {
    const rr = buildRunRecord({ ...base, usage: { calls: 1, inputTokens: 100_000, outputTokens: 1_000 } });
    expect(rr.cost.llmCostUsd).toBeCloseTo(estimateLlmCostUsd({ inputTokens: 100_000, outputTokens: 1_000 }), 6);
  });

  it('без вызовов доля не выдумывается', () => {
    const rr = buildRunRecord({ ...base });
    expect(rr.cost.cacheHitRate).toBeNull();
  });
});
