/*
 * Відправка лідів на /api/lead (Resend). Повертає true при успіху;
 * при будь-якій помилці — false, і форма показує mailto-fallback.
 */
export type LeadPayload = {
  source: string;
  email?: string;
  phone?: string;
  name?: string;
  store?: string;
  turnover?: string;
  comment?: string;
  calc?: string;
  company_website?: string; // honeypot — завжди порожнє в людей
};

export async function sendLead(payload: LeadPayload): Promise<boolean> {
  try {
    const r = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    return Boolean(j.ok);
  } catch {
    return false;
  }
}
