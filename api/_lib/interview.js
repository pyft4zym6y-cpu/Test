// Vercel serverless: Крок 5 — динамічне AI-інтерв'ю поглибленої діагностики.
// Веде розмову як досвідчений консультант: ставить ПО ОДНОМУ непрямому,
// підібраному під випадок питанню, поглиблюється туди, де у відповідях видно
// біль чи прогалину — щоб клієнт «виклав усі карти». Коли даних достатньо (або
// action:'finish') — повертає структурований поглиблений діагноз.
//
// Env: ANTHROPIC_API_KEY (обов'язково), INTERVIEW_MODEL (за замовч. claude-sonnet-5).
//
// POST /api/interview
//   body: { context, history:[{q,a}], action?: 'ask'|'finish' }
//   → { mode:'question', question:{text,why,hint,kind,options?}, coverage, done }
//   → { mode:'diagnosis', diagnosis:{summary,problems[],rootCauses[],roadmap[],connect[]}, coverage:100 }

// Дозволяємо функції жити довше за дефолтні ~10с (інакше виклик Claude обривається
// → на фронті «Звʼязок перервався»). Vercel застосує стелю плану.
export const config = { maxDuration: 60 };

const TARGET_Q = 7; // орієнтир глибини; модель може завершити раніше/пізніше
// Швидка модель за замовчуванням — щоб укладатися в таймаут функції й тримати діалог жвавим.
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

// Вирізаємо перший збалансований JSON-об'єкт (модель іноді додає префікс/суфікс).
function extractJson(text) {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

const clampInt = (n, lo, hi, dflt) => {
  const x = Math.round(Number(n));
  return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : dflt;
};

export async function interview(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(200).json({ error: 'not_configured' }); return; }

  const body = req.body ?? {};
  const context = body.context ?? {};
  const history = Array.isArray(body.history) ? body.history.slice(0, 20) : [];
  const action = body.action === 'finish' ? 'finish' : 'ask';
  const answered = history.filter((h) => h && String(h.a || '').trim()).length;

  // Стислий, безпечний зріз контексту для моделі.
  const ctx = {
    site: String(context.site || '').slice(0, 200) || null,
    overall: context.overall ?? null,
    bottleneck: context.bottleneck ? { label: String(context.bottleneck.label || '').slice(0, 80), score: context.bottleneck.score ?? null } : null,
    goals: (context.goals || []).slice(0, 6).map((g) => String(g).slice(0, 120)),
    pains: (context.pains || []).slice(0, 8).map((p) => ({ label: String(p.label || '').slice(0, 80), detail: String(p.detail || '').slice(0, 160) })),
    systems: (context.systems || []).slice(0, 10).map((s) => ({ label: String(s.label || '').slice(0, 60), score: s.score ?? null })),
    marketing: (context.marketing || []).slice(0, 12).map((m) => ({ label: String(m.label || '').slice(0, 60), value: String(m.value || '').slice(0, 40) })),
    finance: (context.finance || []).slice(0, 12).map((m) => ({ label: String(m.label || '').slice(0, 60), value: String(m.value || '').slice(0, 40) })),
    completeness: context.completeness ?? null,
  };

  const system = `Ти — головний консультант WEEXP: діагностуєш e-commerce-бізнеси на рівні C-level. Ведеш Крок 5 — поглиблене інтерв'ю. Твоя майстерність — ставити НЕПРЯМІ, підібрані під конкретний випадок питання так, щоб власник сам «виклав усі карти»: розкрив реальні цифри, процеси, вузькі місця й страхи, які ховає навіть від себе.

ПРАВИЛА ІНТЕРВ'Ю:
- Рівно ОДНЕ питання за раз. Коротке, конкретне, людське — не анкета.
- Відштовхуйся від вузького місця («${ctx.bottleneck ? ctx.bottleneck.label : 'невідоме'}»), цілей клієнта та його попередніх відповідей. Поглиблюйся туди, де видно біль або ухильність.
- Став практичні, «продажні» питання про гроші, процеси й людей: не «чи є у вас аналітика», а «коли востаннє ви дивилися, на якому кроці кошика відвалюється більшість — і що там побачили».
- Не повторюй уже поставлене. Не питай те, що вже відомо з контексту.
- Мова — українська. Тон — спокійний, професійний, без тиску й лестощів.
- Покривай теми поступово: трафік і попит, конверсія вітрини, повторні продажі/retention, юніт-економіка (CAC, маржа, чек), операції та швидкість, дані й інтеграції, команда й власники процесів, готовність до експансії.

ЗАВЕРШЕННЯ: коли зібрано достатньо, щоб упевнено назвати кореневі причини (орієнтир — близько ${TARGET_Q} змістовних відповідей), або коли просять завершити — віддавай не питання, а поглиблений діагноз.

Відповідай ЗАВЖДИ і ТІЛЬКИ валідним JSON (без markdown, без коментарів), однією з двох форм:

1) Наступне питання:
{"mode":"question","coverage":<0-100 оцінка повноти картини>,"done":false,"question":{"text":"...","why":"навіщо це питання — 1 речення для клієнта","hint":"підказка як відповісти або приклад, коротко","kind":"text"|"choice","options":["..."]}}
Поле options — тільки для kind:"choice" (2–5 варіантів). Для відкритих питань kind:"text" без options.

2) Поглиблений діагноз (коли done):
{"mode":"diagnosis","coverage":100,"diagnosis":{"summary":"2–3 речення головного висновку","problems":[{"title":"...","evidence":"на чому ґрунтується — з відповідей/даних","confidence":"висока"|"середня"|"попередня","impact":"на що впливає у грошах/процесі","priority":"P1"|"P2"|"P3"}],"rootCauses":["коренева причина 1","..."],"roadmap":[{"title":"крок","detail":"що робимо","horizon":"напр. 2–4 тижні"}],"connect":[{"what":"які дані/доступи підключити (GA4, CRM, CMS тощо)","why":"що це дасть діагностиці"}]}}
Не вигадуй цифр, яких клієнт не називав. Спирайся на його відповіді та контекст.`;

  const userMsg = `КОНТЕКСТ КЛІЄНТА (з Кроків 1–4):
${JSON.stringify(ctx, null, 2)}

ХІД ІНТЕРВ'Ю (питання → відповідь клієнта):
${history.length ? history.map((h, i) => `${i + 1}. Q: ${String(h.q || '').slice(0, 300)}\n   A: ${String(h.a || '').slice(0, 600) || '(без відповіді)'}`).join('\n') : '(ще не було питань)'}

Змістовних відповідей: ${answered}.
${action === 'finish' ? 'КЛІЄНТ ПРОСИТЬ ЗАВЕРШИТИ — віддай mode:"diagnosis".' : `Дай наступний крок: ${answered >= TARGET_Q ? 'імовірно вже пора mode:"diagnosis"' : 'постав наступне питання mode:"question"'}.`}`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 55000);
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.INTERVIEW_MODEL || DEFAULT_MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    clearTimeout(timer);
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`Anthropic HTTP ${r.status}${t ? ': ' + t.slice(0, 160) : ''}`);
    }
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || 'Anthropic error');
    const text = (j.content ?? []).map((c) => c.text ?? '').join('');
    const raw = extractJson(text);
    if (!raw) throw new Error('Модель не повернула JSON');
    const out = JSON.parse(raw);

    if (out.mode === 'diagnosis' && out.diagnosis) {
      const d = out.diagnosis;
      res.status(200).json({
        mode: 'diagnosis',
        coverage: 100,
        diagnosis: {
          summary: String(d.summary || '').slice(0, 800),
          problems: (d.problems || []).slice(0, 8).map((p) => ({
            title: String(p.title || '').slice(0, 160),
            evidence: String(p.evidence || '').slice(0, 400),
            confidence: ['висока', 'середня', 'попередня'].includes(p.confidence) ? p.confidence : 'попередня',
            impact: String(p.impact || '').slice(0, 300),
            priority: /^P[123]$/.test(p.priority) ? p.priority : 'P2',
          })),
          rootCauses: (d.rootCauses || []).slice(0, 6).map((x) => String(x).slice(0, 300)),
          roadmap: (d.roadmap || []).slice(0, 8).map((s) => ({
            title: String(s.title || '').slice(0, 160), detail: String(s.detail || '').slice(0, 400), horizon: String(s.horizon || '').slice(0, 60),
          })),
          connect: (d.connect || []).slice(0, 8).map((c) => ({ what: String(c.what || '').slice(0, 160), why: String(c.why || '').slice(0, 300) })),
        },
      });
      return;
    }

    // Питання (з захистом полів)
    const q = out.question || {};
    const kind = q.kind === 'choice' ? 'choice' : 'text';
    res.status(200).json({
      mode: 'question',
      coverage: clampInt(out.coverage, 0, 100, Math.min(95, 20 + answered * 12)),
      done: false,
      question: {
        text: String(q.text || 'Розкажіть докладніше про поточне вузьке місце у ваших словах.').slice(0, 400),
        why: String(q.why || '').slice(0, 200),
        hint: String(q.hint || '').slice(0, 200),
        kind,
        options: kind === 'choice' ? (q.options || []).slice(0, 5).map((o) => String(o).slice(0, 120)) : undefined,
      },
    });
  } catch (e) {
    res.status(200).json({ error: String(e.message || e).slice(0, 200) });
  }
}
