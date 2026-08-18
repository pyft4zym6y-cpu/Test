/*
 * Відправка лідів на /api/lead (Resend). Повертає статус, щоб форма могла
 * показати чесний результат: 'ok' — надіслано; 'not_configured' — бекенд не
 * налаштований (env RESEND_API_KEY); 'error' — мережа/збій відправлення.
 */
export type LeadPayload = {
  source: string;
  email?: string;
  phone?: string;
  name?: string;
  store?: string;
  turnover?: string;
  role?: string;      // роль ЛПР
  task?: string;      // головна задача / напрям
  timeline?: string;  // терміни
  budget?: string;    // орієнтовний бюджет
  comment?: string;
  diag?: string; // текстовий підсумок Business X-Ray / повної діагностики
  calc?: string; // розрахунок калькулятора
  company_website?: string; // honeypot — завжди порожнє в людей
};

export type LeadResult = 'ok' | 'not_configured' | 'error';

export async function sendLead(payload: LeadPayload): Promise<LeadResult> {
  try {
    const r = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (j.ok) return 'ok';
    if (j.error === 'not_configured') return 'not_configured';
    return 'error';
  } catch {
    return 'error';
  }
}
