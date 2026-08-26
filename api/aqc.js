// Vercel serverless: AI-прогон страницы по AQC-чеклисту (метод ai_driven_audit).
// По правилу метода машинный разбор даёт ГИПОТЕЗЫ с достоверностью 25 —
// консультант подтверждает или отклоняет каждую руками.
// Env: ANTHROPIC_API_KEY (обязательно), AQC_MODEL (по умолчанию claude-sonnet-5).
import { interview } from './_lib/interview.js';
import { fetchPage } from './_lib/fetch.js';
import { requireStaff } from './_lib/auth.js';

export default async function handler(req, res) {
  // /api/interview і /api/fetch → rewrite сюди з ?fn=… (ліміт 12 функцій Hobby).
  if (req.query?.fn === 'interview') return interview(req, res);
  if (req.query?.fn === 'fetch') return fetchPage(req, res);

  // Сам /api/aqc лишається задеплоєною функцією й доступний напряму, тому
  // rewrite'и його не захищають: без цієї перевірки будь-хто з інтернету палив
  // наш ключ Anthropic одним POST.
  if (!(await requireStaff(req, res))) return;

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
  const list = typeof items === 'string' ? JSON.parse(items) : items;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const pageResp = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 weexp-audit',
        'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8',
      },
    });
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

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AQC_MODEL || 'claude-sonnet-5',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    const text = (j.content ?? []).map((c) => c.text ?? '').join('');
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) throw new Error('Модель не вернула JSON');
    res.status(200).json({ verdicts: JSON.parse(m[0]), confidence: 25 });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}
