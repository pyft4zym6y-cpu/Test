// Vercel serverless: AI-чернетка проекту з відповідей глибокого аудиту.
// Клод читає відповіді аудиту + базу знань агенції (правила менеджера) і повертає
// ЧЕРНЕТКУ плану: задачі (Гант), команду, помісячну тарифікацію. Це чернетка —
// менеджер редагує руками перед публікацією клієнту.
// Env: ANTHROPIC_API_KEY (обовʼязково), AI_DRAFT_MODEL (за замовч. claude-sonnet-5).
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(200).json({ error: 'AI-чернетка не налаштована: додайте ANTHROPIC_API_KEY у змінні оточення Vercel.' });
    return;
  }
  const { answers, company, knowledge, roleRates, specialists, startMonth, span } = req.body ?? {};
  if (!answers || typeof answers !== 'object' || !Object.keys(answers).length) {
    res.status(200).json({ error: 'Немає відповідей аудиту — клієнт ще не заповнив дані.' });
    return;
  }

  // Стисла вижимка відповідей (qkey → значення), щоб не роздувати промпт.
  const flat = Object.entries(answers)
    .map(([k, v]) => `${k}: ${typeof v === 'object' && v && 'value' in v ? JSON.stringify(v.value) : JSON.stringify(v)}`)
    .join('\n')
    .slice(0, 20000);
  const rates = Array.isArray(roleRates) && roleRates.length
    ? roleRates.map((r) => `${r.role}: €${r.rate}/год`).join('; ')
    : 'ставки не задані — постав розумні оцінки в €/год для ринку послуг';
  const specs = Array.isArray(specialists) && specialists.length
    ? specialists.map((s) => `${s.name} (${s.role}, €${s.rate}/год)`).join('; ')
    : '';

  const sys = `Ти — досвідчений проєкт-директор диджитал-агенції WEEXP. На основі відповідей глибокого аудиту компанії клієнта ти складаєш ЧЕРНЕТКУ плану ведення проєкту: дорожню карту (Гант), команду і помісячну тарифікацію. Це чернетка для менеджера — будь конкретним, реалістичним, спирайся на відповіді аудиту й на базу знань (методику агенції). Валюта — євро, без ПДВ. Відповідай ЛИШЕ мовою відповідей аудиту (як правило українською).`;

  const startNote = startMonth ? `Місяць старту: ${startMonth} (індекс задачі startM=0 = цей місяць).` : 'Місяць старту не заданий — рахуй startM від 0.';
  const spanNote = `Горизонт плану: ${Math.max(1, Math.min(24, Number(span) || 6))} місяців. lenM і startM — у місяцях у цих межах.`;

  const prompt = `ВІДПОВІДІ АУДИТУ КОМПАНІЇ${company ? ` «${company}»` : ''}:
${flat}

БАЗА ЗНАНЬ / МЕТОДИКА АГЕНЦІЇ (дотримуйся її при плануванні):
${(knowledge && String(knowledge).slice(0, 8000)) || '(порожня — використай найкращі практики ведення проєктів)'}

СТАВКИ РОЛЕЙ: ${rates}
${specs ? `ДОСТУПНІ СПЕЦІАЛІСТИ: ${specs}` : ''}
${startNote} ${spanNote}

Склади чернетку плану. Поверни ТІЛЬКИ валідний JSON (без markdown, без пояснень навколо) такої форми:
{
  "title": "коротка назва проєкту",
  "tasks": [{"name":"етап/задача","track":"напрям","startM":0,"lenM":2,"progress":0,"owner":"роль"}],
  "team": [{"role":"роль","name":""}],
  "tariff": [{"month":"YYYY-MM","items":[{"label":"робота · роль","hours":40,"rate":50}]}],
  "rationale": "1-3 речення: чому саме такий план випливає з аудиту"
}
Правила: 5–12 задач; команда 3–6 ролей; тарифікація на 2–4 місяці з реалістичними годинами й ставками з блоку СТАВКИ. Місяці tariff — послідовні від старту. Не вигадуй факти, яких немає в аудиті.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_DRAFT_MODEL || 'claude-sonnet-5',
        max_tokens: 4000,
        system: sys,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    const text = (j.content ?? []).map((c) => c.text ?? '').join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Модель не повернула JSON');
    const draft = JSON.parse(m[0]);
    res.status(200).json({ ok: true, draft });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}
