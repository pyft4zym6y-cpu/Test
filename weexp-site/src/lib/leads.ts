/*
 * Відправка лідів на /api/lead (Resend). Повертає статус, щоб форма могла
 * показати чесний результат: 'ok' — надіслано; 'not_configured' — бекенд не
 * налаштований (env RESEND_API_KEY); 'error' — мережа/збій відправлення.
 */
import { getUtmString } from '@/lib/utm';

/**
 * Заголовки для /api/lead. Раніше тут стояв статичний `import { authHeaders }
 * from '@/lib/supa'` — і кожен відвідувач, який просто відкрив контактну форму
 * чи калькулятор, тягнув увесь SDK Supabase (239 кБ) заради одного заголовка,
 * якого в нього все одно немає: анонімна людина не має сесії.
 *
 * Тепер SDK підвантажується ЛИШЕ коли в localStorage справді лежить сесія.
 * Ключ Supabase зберігає у форматі `sb-<project-ref>-auth-token`, тож наявність
 * входу видно без завантаження бібліотеки. Немає ключа — немає й запиту.
 */
async function leadHeaders(): Promise<Record<string, string>> {
  const plain = { 'content-type': 'application/json' };
  let signedIn = false;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i) || '';
      if (/^sb-.*-auth-token$/.test(k)) { signedIn = true; break; }
    }
  } catch { /* приватне вікно без сховища — вважаємо анонімом */ }
  if (!signedIn) return plain;
  try {
    const { authHeaders } = await import('@/lib/supa');
    return await authHeaders();
  } catch { return plain; }
}

export type LeadPayload = {
  source: string;
  email?: string;
  phone?: string;
  name?: string;
  store?: string;
  site?: string;      // сайт клієнта (окремо від назви магазину)
  turnover?: string;
  role?: string;      // роль ЛПР
  task?: string;      // головна задача / напрям
  timeline?: string;  // терміни
  budget?: string;    // орієнтовний бюджет
  comment?: string;
  diag?: string; // текстовий підсумок Business X-Ray / повної діагностики
  calc?: string; // розрахунок калькулятора
  company_website?: string; // honeypot — завжди порожнє в людей
  turnstile?: string;       // токен перевірки «я не робот» (якщо ввімкнена)
};

export type LeadResult = 'ok' | 'not_configured' | 'error' | 'too_many' | 'robot';

export async function sendLead(payload: LeadPayload): Promise<LeadResult> {
  try {
    // Додаємо first-touch UTM у коментар (видно в CRM і в листі, без зміни схеми БД).
    const utm = getUtmString();
    const body = utm ? { ...payload, comment: [payload.comment, utm].filter(Boolean).join(' · ') } : payload;
    // Токен сесії, якщо людина увійшла: сервер за ним відрізняє заявку з
    // кабінету (де віджета перевірки немає) від анонімної форми сайту.
    const r = await fetch('/api/lead', {
      method: 'POST',
      headers: await leadHeaders(),
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (j.ok) return 'ok';
    if (j.error === 'not_configured') return 'not_configured';
    // Ліміт частоти й перевірка на бота мають бути видимі формі: інакше людина
    // бачить абстрактну «помилку» і б'ється в неї далі.
    if (r.status === 429) return 'too_many';
    if (r.status === 400 && /робот/i.test(String(j.error || ''))) return 'robot';
    return 'error';
  } catch {
    return 'error';
  }
}
