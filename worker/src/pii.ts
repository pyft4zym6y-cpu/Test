/**
 * PII-МАСКИРОВАНИЕ НА ВХОДЕ — жёсткий контроль, а не рекомендация.
 *
 * Замечание внешнего аудита №6: система рекомендует хешировать e-mail, но технически
 * принимает сырые email/phone. Здесь — маскирование на ingestion layer: любые ответы
 * опросника / текст, попадающие в анализ (в т.ч. к Claude) и в артефакты, проходят
 * маскирование e-mail и телефонов. E-mail → стабильный токен (одинаковый вход → тот же
 * токен), телефон → [phone]. Числа-цены/счётчики не трогаем (маскируем только явные телефоны).
 */
import { createHash } from 'node:crypto';

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// телефон: 10+ цифр с типичными разделителями (допускаем ") " и "(0" — до 2 подряд)
const PHONE_RE = /\+?\d(?:[\s()\-.]{0,2}\d){9,}/g;

const emailToken = (e: string) => 'eml_' + createHash('sha256').update(e.toLowerCase()).digest('hex').slice(0, 10);

export type MaskResult = { text: string; emails: number; phones: number };

/** Маскирует e-mail и телефоны в строке. */
export function maskPII(input: string): MaskResult {
  let emails = 0, phones = 0;
  let text = input.replace(EMAIL_RE, (m) => { emails++; return emailToken(m); });
  text = text.replace(PHONE_RE, (m) => {
    // не маскируем короткие/«не телефонные» последовательности (напр. даты 2024-01-01)
    const digits = (m.match(/\d/g) || []).length;
    if (digits < 10) return m;
    phones++;
    return '[phone]';
  });
  return { text, emails, phones };
}

/** Глубоко маскирует все строковые значения объекта/массива. Возвращает копию + счётчики. */
export function maskDeep<T>(value: T): { value: T; emails: number; phones: number } {
  let emails = 0, phones = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') { const r = maskPII(v); emails += r.emails; phones += r.phones; return r.text; }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) out[k] = walk(val);
      return out;
    }
    return v;
  };
  return { value: walk(value) as T, emails, phones };
}
