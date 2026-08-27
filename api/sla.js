// Щоденна перевірка нормативів стадій (SLA) → лист власнику.
//
// Навіщо серверно: адмінка бачить прострочене лише коли її ВІДКРИЛИ. Заявка,
// що стоїть третій день, поки ніхто не заходив, нікого не турбувала.
//
// Викликається:
//   • кроном Vercel (див. vercel.json → crons), заголовок Authorization: Bearer $CRON_SECRET;
//   • вручну командою (сесія staff) — щоб перевірити, що працює.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (читання всіх записів у обхід RLS),
//      CRON_SECRET (Vercel ставить сам), NOTIFY_EMAIL/RESEND_API_KEY — через /api/notify.
import { requireStaff, logServerEvent } from './_lib/auth.js';

/**
 * Пороги стадій. Дублюються з `weexp-site/src/system/admin/auditRequests.ts`:
 * два різні збирачі (Vite і serverless) не можуть імпортувати один модуль без
 * зайвої інфраструктури. Раніше тут стояв коментар «пороги мають збігатися» —
 * і саме так вони й розійшлись: в адмінці два рівні (warn і breach), а тут був
 * ОДИН, рівний breach. Тобто щоденний лист приходив у день, коли стадія вже
 * прострочена, і жодного попередження до того не було.
 *
 * Тепер обидва рівні тут, а збіг перевіряє тест
 * (`admin/__tests__/slaSync.test.ts`) — він читає цей файл і падає, щойно
 * значення розійдуться. Обіцянка в коментарі стала перевіркою.
 */
const SLA = {
  new: { warn: 1, breach: 2 },
  review: { warn: 1, breach: 2 },
  need_data: { warn: 5, breach: 10 },
  granted: { warn: 5, breach: 14 },
  filling: { warn: 7, breach: 21 },
  clarify: { warn: 5, breach: 10 },
  in_work: { warn: 10, breach: 21 },
  done: { warn: 3, breach: 7 },
  project: { warn: 5, breach: 10 },
  delivery: { warn: 14, breach: 30 },
  care: { warn: 30, breach: 60 },
};
const LABEL = {
  new: 'Нова заявка', review: 'На модерації', need_data: 'Потрібні дані', granted: 'Доступ надано',
  filling: 'Клієнт заповнює', clarify: 'Уточнення', in_work: 'В роботі', done: 'Завершено',
  project: 'Впровадження: план', delivery: 'Впровадження: робота', care: 'Супровід',
};

const projectsOf = (rec) => (rec.projects?.length ? rec.projects : rec.project ? [rec.project] : []);

/** Та сама логіка, що в UI: статус виводиться з даних, а не зберігається. */
function statusOf(rec) {
  const ts = rec.funnel?.tierStatus || {};
  const st = ts.DEEP || ['granted', 'data', 'requested', 'rejected'].find((p) => Object.values(ts).includes(p));
  const pr = projectsOf(rec);
  if (pr.length > 0 && pr.every((p) => p.closedAt)) return 'care';
  if (pr.some((p) => p.published)) return 'delivery';
  if (pr.length > 0) return 'project';
  if (rec.auditClosedAt) return 'done';
  const mod = rec.deepModeration?.status;
  if (mod === 'accepted') return 'in_work';
  if (mod === 'clarify') return 'clarify';
  if (mod === 'submitted') return 'review';
  if (st === 'rejected') return null;      // відхилене не «зависає»
  if (st === 'granted') {
    const started = Object.keys(rec.stage3 || {}).length || Object.keys(rec.accessLog || {}).length
      || (rec.clientFiles || []).length || (rec.marketplaces || []).length;
    return started ? 'filling' : 'granted';
  }
  if (st === 'data') return 'need_data';
  if (st === 'requested' || rec.funnel?.deepRequested) return 'new';
  return null;
}

function lastMoveAt(rec) {
  const hist = Object.values(rec.funnel?.tierHistory || {}).flat().map((h) => h?.at);
  return [rec.deepModeration?.at, rec.auditClosedAt, rec.updatedAt, ...hist].filter(Boolean).sort().pop() || '';
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = String(req.headers?.authorization || '');
  const byCron = secret && auth === `Bearer ${secret}`;
  if (!byCron && !(await requireStaff(req, res))) return;

  const URL_BASE = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL_BASE || !KEY) { res.status(200).json({ error: 'not_configured: потрібні SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY' }); return; }

  try {
    // Тягнемо лише поля, потрібні для стадії: повний jsonb кожного клієнта тут
    // не потрібен (там анкета, документ аудиту з версіями, зрізи бази знань), а
    // PostgREST мовчки обрізає видачу на 1000 рядках — тому ще й сторінками.
    const KEYS = ['funnel', 'projects', 'project', 'auditClosedAt', 'deepModeration',
      'stage3', 'accessLog', 'clientFiles', 'marketplaces', 'company', 'updatedAt'];
    const select = 'user_id,email,' + KEYS.map((k) => `${k}:data->${k}`).join(',');
    const PAGE = 500;
    const rows = [];
    for (let from = 0; ; from += PAGE) {
      const r = await fetch(`${URL_BASE}/rest/v1/diagnostics?select=${encodeURIComponent(select)}&order=user_id`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + PAGE - 1}` },
      });
      if (!r.ok) { res.status(200).json({ error: `supabase ${r.status}` }); return; }
      const page = await r.json();
      rows.push(...page.map((p) => ({ user_id: p.user_id, email: p.email, data: p })));
      if (page.length < PAGE) break;
      if (from > 20000) break;   // запобіжник від нескінченного циклу
    }

    /** Відповідальний зі складу проєкту — щоб лист казав не лише ЩО стоїть, а й у кого. */
    const pmOf = (rec) => {
      const team = projectsOf(rec).flatMap((p) => p.team || []);
      const pm = team.find((m) => /pm|проект|менедж/i.test(m.role || ''));
      return pm?.name || '';
    };

    const overdue = [];
    const soon = [];
    for (const row of rows) {
      const rec = row.data || {};
      const st = statusOf(rec);
      if (!st || !SLA[st]) continue;
      const at = lastMoveAt(rec);
      if (!at) continue;
      const days = Math.floor((Date.now() - new Date(at).getTime()) / 86400000);
      const item = { email: row.email, company: rec.company?.name || '', st, days, limit: SLA[st].breach, pm: pmOf(rec) };
      if (days >= SLA[st].breach) overdue.push(item);
      else if (days >= SLA[st].warn) soon.push({ ...item, limit: SLA[st].breach });
    }
    overdue.sort((a, b) => b.days - a.days);
    soon.sort((a, b) => b.days - a.days);

    if (overdue.length || soon.length) {
      const origin = process.env.SITE_ORIGIN || 'https://weexp.agency';
      const line = (o) => `• ${o.company || o.email}${o.pm ? ` (${o.pm})` : ''} — «${LABEL[o.st]}» стоїть ${o.days} дн. (норматив ${o.limit})`;
      const text = [
        ...(overdue.length ? [`ПРОСТРОЧЕНО: ${overdue.length}`, '', ...overdue.map(line), ''] : []),
        // Попередження — головна зміна: раніше лист приходив у день, коли вже
        // пізно. День-два запасу коштують дешевше за прострочену заявку.
        ...(soon.length ? [`НАБЛИЖАЄТЬСЯ: ${soon.length}`, '', ...soon.map(line), ''] : []),
        `Адмінка: ${origin}/admin`,
      ].join('\n');
      const subject = overdue.length
        ? `SLA: ${overdue.length} прострочених${soon.length ? ` + ${soon.length} на межі` : ''}`
        : `SLA: ${soon.length} стадій наближаються до порога`;
      await fetch(`${origin}/api/notify`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject, text }),
      }).catch(() => {});
    }
    // Слід у журналі: інакше «чому мені прийшов цей лист» не має відповіді.
    void logServerEvent(byCron ? 'cron' : 'manual', 'sla_check', { detail: `перевірено ${rows.length}, прострочено ${overdue.length}, на межі ${soon.length}` });
    res.status(200).json({ ok: true, checked: rows.length, overdue: overdue.length, soon: soon.length, items: overdue.slice(0, 50), soonItems: soon.slice(0, 50) });
  } catch (e) {
    res.status(200).json({ error: String(e).slice(0, 200) });
  }
}
