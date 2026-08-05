/**
 * Агентный обход (T1, автономный добор фактов). Claude ведёт аудит сам:
 * запрашивает обход дополнительных страниц, скачивание внешних источников и
 * веб-поиск, а воркер исполняет эти инструменты. Заканчивает вызовом finish со
 * структурированным анализом. Даёт ту самую автономность «сам заходит и копает».
 *
 * Обёрнут в try/catch на стороне run.ts — при сбое остаётся одношаговый analyze().
 */
import type { Browser } from 'playwright';
import { createMessage } from './anthropic.js';
import { auditSingle } from './crawl.js';
import { datasetToPrompt, systemFor, type Analysis } from './analyze.js';
import type { AuditDataset } from './report.js';

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    healthNote: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', properties: {
      area: { type: 'string' }, status: { type: 'string' }, fact: { type: 'string' }, why: { type: 'string' }, confidence: { type: 'number' },
    }, required: ['area', 'status', 'fact', 'why', 'confidence'] } },
    pains: { type: 'array', items: { type: 'object', properties: {
      cause: { type: 'string' }, symptoms: { type: 'array', items: { type: 'string' } }, evidence: { type: 'array', items: { type: 'string' } },
    }, required: ['cause', 'symptoms', 'evidence'] } },
    competitors: { type: 'string' },
    missingFacts: { type: 'array', items: { type: 'string' } },
    scope: { type: 'array', items: { type: 'object', properties: {
      playbook: { type: 'string' }, reason: { type: 'string' }, wave: { type: 'number' },
    }, required: ['playbook', 'reason', 'wave'] } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'healthNote', 'findings', 'pains', 'competitors', 'missingFacts', 'scope', 'openQuestions'],
};

function tools(webSearch: boolean): any[] {
  const t: any[] = [
    { name: 'crawl_page', description: 'Обойти ещё одну страницу сайта клиента или конкурента настоящим браузером и получить проверки голд-стандарта. Используй, чтобы проверить конкретный тип страницы (PDP, чекаут, категория, доставка).', input_schema: { type: 'object', properties: { url: { type: 'string', description: 'полный http(s) URL' } }, required: ['url'] } },
    { name: 'fetch_url', description: 'Скачать текст произвольной страницы (внешний источник, прайс-агрегатор, страница конкурента, соцсеть). Возвращает очищенный текст. Только для чтения фактов.', input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
    { name: 'finish', description: 'Завершить аудит и сдать итоговый структурированный анализ L0.', input_schema: ANALYSIS_SCHEMA },
  ];
  if (webSearch) t.push({ type: 'web_search_20260209', name: 'web_search' });
  return t;
}

async function runTool(browser: Browser, ds: AuditDataset, name: string, input: any): Promise<string> {
  try {
    if (name === 'crawl_page') {
      const url = String(input?.url ?? '');
      if (!/^https?:\/\//i.test(url)) return 'Ошибка: нужен http(s) URL';
      const p = await auditSingle(browser, url);
      // обогащаем датасет новой страницей (попадёт и в материалы)
      ds.client.pages.push({ url: p.url, finalUrl: p.finalUrl, kind: p.kind, status: p.status, title: p.title, checks: p.checks, score: p.score, error: p.error });
      const fails = p.checks.filter((c) => !c.pass).map((c) => `${c.group}: ${c.label}`);
      return JSON.stringify({ url: p.finalUrl, kind: p.kind, score: p.score, title: p.title, failed: fails, tech: p.tech, error: p.error });
    }
    if (name === 'fetch_url') {
      const url = String(input?.url ?? '');
      if (!/^https?:\/\//i.test(url)) return 'Ошибка: нужен http(s) URL';
      const r = await fetch(url, { headers: { 'user-agent': 'weexp-audit' }, signal: AbortSignal.timeout(15000) });
      const html = await r.text();
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return `HTTP ${r.status}. Текст (обрезан):\n${text.slice(0, 6000)}`;
    }
    return `Неизвестный инструмент: ${name}`;
  } catch (e) {
    return `Ошибка инструмента ${name}: ${String(e).slice(0, 160)}`;
  }
}

export async function agentAnalyze(browser: Browser, ds: AuditDataset, opts: { maxSteps?: number; engineFactsStr?: string } = {}): Promise<Analysis> {
  const maxSteps = opts.maxSteps ?? 8;
  let webSearch = process.env.AUDIT_WEB_SEARCH !== '0';
  const system = systemFor(ds) +
    `\n\nУ тебя есть инструменты: crawl_page (обойти ещё страницу браузером), fetch_url (скачать текст любой страницы — в т.ч. макеты Figma по ссылке, страницы конкурентов), web_search (поиск в вебе — конкуренты, ниша, бренд, цена в канале). Сначала добери недостающие факты инструментами (2–6 вызовов), затем вызови finish с полным анализом. Не выдумывай — если факт не подтверждён, помечай допущением и клади в missingFacts/openQuestions.`;
  const messages: any[] = [{ role: 'user', content: datasetToPrompt(ds, opts.engineFactsStr) + '\n\nВеди аудит. Добери факты инструментами, затем вызови finish.' }];

  for (let step = 0; step < maxSteps; step++) {
    let resp: any;
    try {
      resp = await createMessage({ max_tokens: 8000, system, tools: tools(webSearch), thinking: { type: 'adaptive' }, output_config: { effort: 'medium' }, messages });
    } catch (e) {
      // web_search может быть недоступен на модели/тарифе — отключаем и повторяем шаг
      if (webSearch && /web_search|tool/i.test(String(e))) { webSearch = false; continue; }
      throw e;
    }

    if (resp.stop_reason === 'pause_turn') { messages.push({ role: 'assistant', content: resp.content }); continue; }

    const finishBlock = resp.content?.find((b: any) => b.type === 'tool_use' && b.name === 'finish');
    if (finishBlock) return normalize(finishBlock.input);

    const toolUses = (resp.content ?? []).filter((b: any) => b.type === 'tool_use');
    messages.push({ role: 'assistant', content: resp.content });
    if (!toolUses.length) {
      // финальный ход без finish — просим сдать анализ вызовом finish
      messages.push({ role: 'user', content: 'Заверши: вызови инструмент finish с полным анализом по схеме.' });
      continue;
    }
    const results = [];
    for (const tu of toolUses) {
      const out = await runTool(browser, ds, tu.name, tu.input);
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out });
    }
    messages.push({ role: 'user', content: results });
  }

  // бюджет шагов исчерпан — форсируем finish одним запросом
  messages.push({ role: 'user', content: 'Бюджет шагов исчерпан. Немедленно вызови finish с лучшим анализом на текущих фактах.' });
  const last: any = await createMessage({ max_tokens: 8000, system, tools: tools(false), tool_choice: { type: 'tool', name: 'finish' }, messages });
  const fb = last.content?.find((b: any) => b.type === 'tool_use' && b.name === 'finish');
  if (fb) return normalize(fb.input);
  throw new Error('Агент не сдал finish за отведённые шаги');
}

function normalize(a: any): Analysis {
  return {
    summary: a?.summary ?? '', healthNote: a?.healthNote ?? '', findings: a?.findings ?? [], pains: a?.pains ?? [],
    competitors: a?.competitors ?? '', missingFacts: a?.missingFacts ?? [], scope: a?.scope ?? [], openQuestions: a?.openQuestions ?? [],
  };
}
