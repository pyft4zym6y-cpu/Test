// Vercel serverless: AI-прогон страницы по AQC-чеклисту (метод ai_driven_audit).
// По правилу метода машинный разбор даёт ГИПОТЕЗЫ с достоверностью 25 —
// консультант подтверждает или отклоняет каждую руками.
// Env: ANTHROPIC_API_KEY (обязательно), AQC_MODEL (по умолчанию claude-sonnet-5).
import { interview } from './_lib/interview.js';
import { fetchPage, assertPublic } from './_lib/fetch.js';
import { callClaudeJson } from './_lib/claude.js';
import { requireStaff } from './_lib/auth.js';
import { staffRateLimited } from './_lib/guard.js';

export default async function handler(req, res) {
  // /api/interview і /api/fetch → rewrite сюди з ?fn=… (ліміт 12 функцій Hobby).
  if (req.query?.fn === 'interview') return interview(req, res);
  if (req.query?.fn === 'fetch') return fetchPage(req, res);

  // Сам /api/aqc лишається задеплоєною функцією й доступний напряму, тому
  // rewrite'и його не захищають: без цієї перевірки будь-хто з інтернету палив
  // наш ключ Anthropic одним POST.
  const me = await requireStaff(req, res);
  if (!me) return;
  // Постатейний прогін іде сторінка за сторінкою, тому ліміт вищий за чернетки,
  // але він є: без нього один цикл у коді проходить весь сайт і весь бюджет.
  if (await staffRateLimited(req, res, me, 'aqc', 60)) return;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(200).json({
      error: 'AI-прогон не настроен: добавьте ANTHROPIC_API_KEY в переменные окружения Vercel.',
    });
    return;
  }
  const { url, page, items } = req.method === 'POST' ? req.body ?? {} : req.query;
  if (!url || !items) {
    res.status(400).json({ error: 'Нужны url, page и items (JSON-массив критериев)' });
    return;
  }
  let list;
  try {
    // Раньше разбор стоял ВНЕ try: битый JSON в items давал необработанное
    // исключение и 500 без причины вместо внятного 400.
    list = typeof items === 'string' ? JSON.parse(items) : items;
  } catch {
    res.status(400).json({ error: 'items должен быть корректным JSON-массивом критериев' });
    return;
  }
  if (!Array.isArray(list) || !list.length) {
    res.status(400).json({ error: 'items должен быть непустым массивом критериев' });
    return;
  }

  try {
    /*
     * SSRF: адрес приходит от вызывающего, а тело ответа уходит в промпт, откуда
     * цитаты возвращаются ему же в поле evidence. Без проверки это работающий
     * сканер внутренней сети и способ вычитать метаданные облака — при том что
     * ровно такой контур уже написан в _lib/fetch.js и просто не применялся тут.
     *
     * Редиректы вручную: с redirect:'follow' проверка первого адреса ничего не
     * значит — открытый редирект уводит нас куда угодно.
     */
    let current = new URL(url);
    await assertPublic(current);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let pageResp;
    for (let hop = 0; ; hop++) {
      pageResp = await fetch(current, {
      signal: ctrl.signal,
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 weexp-audit',
        'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8',
      },
    });
      const loc = pageResp.status >= 300 && pageResp.status < 400 ? pageResp.headers.get('location') : null;
      if (!loc) break;
      if (hop >= 3) throw new Error('слишком много редиректов');
      current = new URL(loc, current);
      await assertPublic(current);
    }
    clearTimeout(timer);
    if (pageResp.status >= 400) {
      res.status(200).json({ error: `Сайт ответил HTTP ${pageResp.status} (бот-защита?)` });
      return;
    }
    const html = (await pageResp.text())
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .slice(0, 120_000);

    const prompt = `Ты — UX-аудитор e-commerce, работаешь по стандарту Atomic Quality Criteria.
Страница типа «${page}»: ${url}
Ниже — её HTML (без скриптов и стилей). По каждому критерию вынеси вердикт СТРОГО по DOM-признакам.
Если по HTML определить нельзя (нужен рендер/поведение) — вердикт "unknown". Не выдумывай.

Критерии (JSON): ${JSON.stringify(list)}

Ответь ТОЛЬКО JSON-массивом объектов: {"id": "...", "verdict": "pass"|"fail"|"unknown", "evidence": "краткое DOM-доказательство"}.

HTML:
${html}`;

    const { data, truncated } = await callClaudeJson({
      key, model: process.env.AQC_MODEL || 'claude-sonnet-5',
      prompt, maxTokens: 3000, shape: '[',
    });
    // Обрезанный разбор — не полный: часть критериев осталась без вердикта, и
    // молча показывать их как «не проверено» нельзя.
    res.status(200).json({ verdicts: data, confidence: 25, ...(truncated ? { truncated: true } : {}) });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}
