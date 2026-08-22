// Vercel serverless: AI-чернетка C-level оцінки модулів аудиту.
// Клод читає відповіді клієнта (аудит + експрес) і повертає ЧЕРНЕТКУ оцінки
// по кожному модулю: score, current state, gap, рекомендація, impact, priority.
// Це чернетка — аудитор редагує руками. Env: ANTHROPIC_API_KEY (обовʼязково),
// AI_DRAFT_MODEL (за замовч. claude-sonnet-5).
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(200).json({ error: 'AI не налаштовано: додайте ANTHROPIC_API_KEY у Vercel.' }); return; }

  const { modules, answers, company, express } = req.body ?? {};
  if (!Array.isArray(modules) || !modules.length) { res.status(200).json({ error: 'Немає модулів для оцінки.' }); return; }

  const modList = modules.map((m) => `- ${m.key}: ${m.title}`).join('\n').slice(0, 6000);
  const flat = answers && typeof answers === 'object'
    ? Object.entries(answers).map(([k, v]) => `${k}: ${typeof v === 'object' && v && 'value' in v ? JSON.stringify(v.value) : JSON.stringify(v)}`).join('\n').slice(0, 16000)
    : '(відповіді аудиту відсутні — спирайся на профіль і експрес-дані)';
  const exp = express ? `Експрес-аудит: витік ${express.total}/рік, Business Health ${express.overallHealth}/100, головна проблема ${express.primary}${express.secondary ? `, друга ${express.secondary}` : ''}.` : '';
  const comp = company ? `Компанія: ${JSON.stringify(company).slice(0, 2000)}` : '';

  const sys = `Ти — досвідчений C-level e-commerce аудитор агенції WEEXP. На основі даних клієнта склади ЧЕРНЕТКУ оцінки зрілості по кожному модулю аудиту. Будь консервативним і чесним: якщо даних мало — став нижчий score і познач у gap, що потрібно зібрати. Не вигадуй фактів. Відповідай мовою даних (як правило українською).`;
  const prompt = `${comp}
${exp}

ВІДПОВІДІ АУДИТУ:
${flat}

МОДУЛІ ДЛЯ ОЦІНКИ (key: назва):
${modList}

Оціни КОЖЕН модуль. Поверни ТІЛЬКИ валідний JSON (без markdown):
{ "scores": { "<moduleKey>": {"score":0-100,"state":"поточний стан 1 реченням","gap":"головний розрив","rec":"рекомендація","impact":"low|med|high","priority":"P1|P2|P3"} } }
Правила: score — зрілість 0–100 (мало даних → 20–40); impact/priority узгодь із витоком і болями з експрес-аудиту; P1 — критичні вузькі місця. Ключі об'єкта scores = точні moduleKey зі списку.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.AI_DRAFT_MODEL || 'claude-sonnet-5', max_tokens: 4000, system: sys, messages: [{ role: 'user', content: prompt }] }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    const text = (j.content ?? []).map((c) => c.text ?? '').join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Модель не повернула JSON');
    const parsed = JSON.parse(m[0]);
    res.status(200).json({ ok: true, scores: parsed.scores || {} });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}
