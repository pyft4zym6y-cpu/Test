/*
 * Відправка лідів на /api/lead (Resend). Повертає статус, щоб форма могла
 * показати чесний результат: 'ok' — надіслано; 'not_configured' — бекенд не
 * налаштований (env RESEND_API_KEY); 'error' — мережа/збій відправлення.
 */
import { getUtmString } from '@/lib/utm';
import { authHeaders } from '@/lib/supa';

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
      headers: await authHeaders(),
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
