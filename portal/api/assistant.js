// Vercel serverless: AI-со-пилот аудита Commerce OS.
// Проксирует чат в Claude, добавляя персону метода и ЖИВОЙ СНИМОК аудита
// (посчитанный детерминированно на клиенте) как ground truth. LLM объясняет и
// рассуждает — числа берёт из снимка и не выдумывает.
//
// Env (Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY  — ключ Claude API (обязателен; без него портал уходит в
//                        офлайн-режим детерминированных ответов на клиенте).
//   ASSISTANT_MODEL    — необязательно, по умолчанию claude-opus-5.
//
// POST { messages: [{role, content}], context: "<ground-truth текст>" }
// Ответ — потоковый text/plain (дельты текста); при отсутствии ключа — 501.

const SYSTEM = `Ты — со-пилот консультанта в методе Commerce OS: операционной системе e-commerce-консалтинга. Ты помогаешь вести аудит интернет-магазина: объясняешь Health Score, переводишь разрывы в деньги, подбираешь плейбуки, готовишь вопросы клиенту и куски отчёта/КП.

ДНК метода — держи всегда:
- Цепочка вывода: факт → зона → эталон → разрыв → деньги → плейбук → предложение. У каждого числа есть источник.
- Считай в обороте (₴), а не в процентах: владелец мыслит оборотом и стоимостью компании.
- Никогда не складывай разрывы по рычагам воронки (трафик, CR, чек, оплата, выкуп, повторные) — это последовательные множители, сложение завышает итог. Потенциал = разность двух состояний воронки; вклад рычагов — цепной атрибуцией.
- Всегда помечай границу факт/допущение. Если данных нет — скажи прямо и вынеси в открытые вопросы, не выдумывай.
- «Не обнаружено» ≠ «отсутствует»: различай нет функции / есть, но не находится / есть, но работает неверно.
- Группируй боли по причине, а не по симптому. Каждую цель — числом и с источником. Закладывай консервативную нижнюю границу.

ГЛАВНОЕ ПРАВИЛО ПРО ЦИФРЫ: ниже дан ЖИВОЙ СНИМОК АУДИТА, посчитанный движком портала. Все числа (Health Score, деньги, рычаги, решения, разрывы) бери строго из него. Не пересчитывай и не придумывай значения. Если в снимке чего-то нет — скажи, что это ещё не посчитано, и что нужно заполнить/какой доступ запросить, чтобы посчитать.

Стиль: по-деловому и кратко, на языке клиента (по умолчанию русский). Ссылайся на ID (PB-xx, DE-xx, R-xx, коды вопросов), когда это уместно. Не выводи внутренних XML-тегов.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(501).json({ error: 'no_key' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const context = typeof body?.context === 'string' ? body.context : '';
  if (!messages.length) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  const model = process.env.ASSISTANT_MODEL || 'claude-opus-5';
  const system = [
    { type: 'text', text: SYSTEM },
    { type: 'text', text: context || '# ЖИВОЙ СНИМОК АУДИТА\nПока пусто — аудит не начат или данные не заполнены.' },
  ];

  const payload = {
    model,
    max_tokens: 2000,
    system,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    stream: true,
    messages: messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-16)
      .map((m) => ({ role: m.role, content: m.content })),
  };

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream_unreachable', detail: String(e).slice(0, 200) });
    return;
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    res.status(upstream.status || 502).json({ error: 'upstream_error', detail: text.slice(0, 400) });
    return;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  // Разбираем SSE Anthropic и отдаём клиенту только текстовые дельты.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';
      for (const chunk of chunks) {
        const line = chunk.split('\n').find((l) => l.startsWith('data:'));
        if (!line) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const evt = JSON.parse(data);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            res.write(evt.delta.text);
          }
        } catch { /* пропускаем нераспарсенный кадр */ }
      }
    }
  } catch (e) {
    res.write(`\n[поток прерван: ${String(e).slice(0, 120)}]`);
  }
  res.end();
}
