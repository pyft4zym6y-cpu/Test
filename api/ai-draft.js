// Vercel serverless: AI-чернетки (2-в-1, ліміт Hobby = 12 функцій).
//  • Чернетка ПРОЄКТУ з відповідей глибокого аудиту (задачі/Гант, команда, тарифікація).
//  • Чернетка C-LEVEL ОЦІНКИ модулів аудиту (score/state/gap/rec/impact/priority) —
//    запити на /api/ai-score прилітають сюди через rewrite у vercel.json;
//    диспетчеризація за формою тіла: масив `modules` => оцінка, інакше => проєкт.
// Це чернетки — менеджер/аудитор редагує руками перед публікацією.
// Env: ANTHROPIC_API_KEY (обовʼязково), AI_DRAFT_MODEL (за замовч. claude-sonnet-5).

async function callClaude(key, sys, prompt) {
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
  return JSON.parse(m[0]);
}

const flatAnswers = (answers, fallback) => (answers && typeof answers === 'object' && Object.keys(answers).length
  ? Object.entries(answers).map(([k, v]) => `${k}: ${typeof v === 'object' && v && 'value' in v ? JSON.stringify(v.value) : JSON.stringify(v)}`).join('\n')
  : fallback);

/* ── Гілка 1: C-level оцінка модулів (колишній /api/ai-score) ── */
async function handleScore(req, res, key) {
  const { modules, answers, company, express } = req.body ?? {};
  if (!Array.isArray(modules) || !modules.length) { res.status(200).json({ error: 'Немає модулів для оцінки.' }); return; }

  const modList = modules.map((m) => `- ${m.key}: ${m.title}`).join('\n').slice(0, 6000);
  const flat = flatAnswers(answers, '(відповіді аудиту відсутні — спирайся на профіль і експрес-дані)').slice(0, 16000);
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
    const parsed = await callClaude(key, sys, prompt);
    res.status(200).json({ ok: true, scores: parsed.scores || {} });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}

/* ── Гілка 2: чернетка плану проєкту (рідний /api/ai-draft) ── */
async function handleDraft(req, res, key) {
  const { answers, company, knowledge, roleRates, specialists, startMonth, span } = req.body ?? {};
  if (!answers || typeof answers !== 'object' || !Object.keys(answers).length) {
    res.status(200).json({ error: 'Немає відповідей аудиту — клієнт ще не заповнив дані.' });
    return;
  }

  const flat = flatAnswers(answers, '').slice(0, 20000);
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
    const draft = await callClaude(key, sys, prompt);
    res.status(200).json({ ok: true, draft });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}

/* ── Гілка 3: перевірка достатності даних опитувальника (модерація) ── */
async function handleSufficiency(req, res, key) {
  const { answers, modules, company } = req.body ?? {};
  const flat = flatAnswers(answers, '');
  if (!flat) { res.status(200).json({ ok: true, verdict: { sufficient: false, coveragePct: 0, summary: 'Опитувальник порожній — даних немає.', missing: (modules || []).slice(0, 8).map((m) => ({ module: m.title || m.key, ask: 'Заповнити блок повністю.' })) } }); return; }
  const modList = (Array.isArray(modules) ? modules : []).map((m) => `- ${m.key}: ${m.title}`).join('\n').slice(0, 5000);
  const sys = `Ти — керівник аудиторської практики WEEXP. Твоє завдання — МОДЕРАЦІЯ вхідних даних глибокого аудиту: оцінити, чи ДОСТАТНЬО відповідей клієнта, щоб коректно сформувати повний пакет документів аудиту (висновки, оцінка зрілості, план). Будь вимогливим, але практичним: критичні прогалини — це відсутні фінансові показники, доступи до аналітики, опис бізнес-моделі. Відповідай українською.`;
  const prompt = `МОДУЛІ АУДИТУ:\n${modList}\n\nВІДПОВІДІ КЛІЄНТА:\n${flat.slice(0, 18000)}\n${company ? `\nКОМПАНІЯ: ${JSON.stringify(company).slice(0, 1500)}` : ''}

Оціни достатність даних. Поверни ТІЛЬКИ валідний JSON:
{ "sufficient": true|false, "coveragePct": 0-100, "summary": "2-3 речення: стан даних і головні прогалини", "missing": [{"module":"назва модуля","ask":"конкретне питання/дані, яких бракує"}] }
Правила: sufficient=true лише якщо покриття критичних модулів ≥70% і немає блокуючих прогалин; missing — максимум 8 найважливіших пунктів, сформульованих як готові питання клієнту.`;
  try {
    const v = await callClaude(key, sys, prompt);
    res.status(200).json({ ok: true, verdict: { sufficient: Boolean(v.sufficient), coveragePct: Math.max(0, Math.min(100, Number(v.coveragePct) || 0)), summary: String(v.summary || ''), missing: Array.isArray(v.missing) ? v.missing.slice(0, 8) : [] } });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}

import { requireStaff } from './_lib/auth.js';
import { staffRateLimited } from './_lib/guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  // Витрачає токени Anthropic — лише команда weexp.
  const me = await requireStaff(req, res);
  if (!me) return;
  // 30 чернеток на годину на людину: більше не потрібно навіть у найактивніший
  // день, а залипла кнопка без ліміту витратить бюджет за ніч.
  if (await staffRateLimited(req, res, me, 'ai-draft', 30)) return;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(200).json({ error: 'AI не налаштовано: додайте ANTHROPIC_API_KEY у Vercel.' }); return; }
  // Диспетчер: kind='sufficiency' → модерація; масив modules (або rewrite ai-score) → оцінка; інакше — чернетка проєкту.
  if (req.body?.kind === 'sufficiency') { await handleSufficiency(req, res, key); return; }
  const isScore = Array.isArray(req.body?.modules) || String(req.url || '').includes('ai-score');
  if (isScore) { await handleScore(req, res, key); return; }
  await handleDraft(req, res, key);
}
