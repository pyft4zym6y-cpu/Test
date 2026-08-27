/**
 * Автозаповнення профілю. Ризик тут не в тому, що воно чогось не перенесе —
 * а в тому, що воно ТИХО перетре уточнення менеджера. Половина тестів саме
 * про це: коли пропозиція не має зʼявлятись.
 */
import { describe, it, expect } from 'vitest';
import { suggestProfile, applySuggestions, fillableCount } from '../fillFromAnswers';
import type { AuditAnswer, DiagRecord } from '@/lib/supa';

const A = (m: Record<string, unknown>): Record<string, AuditAnswer> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { value: v }]));

describe('suggestProfile', () => {
  it('переносить те, чого в картці немає', () => {
    const s = suggestProfile({}, A({ company_niche: 'Кава й техніка', technology_platform_v: 'Shopify 2.0' }));
    expect(s.map((x) => x.field).sort()).toEqual(['niche', 'platform']);
    expect(s.find((x) => x.field === 'niche')?.value).toBe('Кава й техніка');
  });

  it('НЕ пропонує там, де менеджер уже щось поставив', () => {
    const rec: DiagRecord = { company: { niche: 'уточнено в розмові' } };
    const s = suggestProfile(rec, A({ company_niche: 'з анкети' }));
    expect(s.some((x) => x.field === 'niche')).toBe(false);
  });

  it('порожня відповідь не породжує пропозицію', () => {
    expect(suggestProfile({}, A({ company_niche: '', company_markets: '   ' }))).toEqual([]);
  });

  it('називає джерело: пропозицію має бути де перевірити', () => {
    const s = suggestProfile({}, A({ business_model_one: 'продаємо каву обсмаження власного цеху' }));
    expect(s[0].from).toBe('business_model_one');
    expect(s[0].label).toBe('Бізнес-модель');
  });

  it('мультивибір збирається у список, а не в «[object Object]»', () => {
    const s = suggestProfile({}, A({ analytics_traffic: ['SEO', 'Google Ads', 'Email/CRM'] }));
    expect(s[0].value).toEqual(['SEO', 'Google Ads', 'Email/CRM']);
  });

  it('обʼєкт-відповідь не потрапляє в профіль сміттям', () => {
    expect(suggestProfile({}, A({ company_niche: { some: 'object' } }))).toEqual([]);
  });

  it('порожня анкета — порожній результат, без падінь', () => {
    expect(suggestProfile({}, {})).toEqual([]);
    expect(suggestProfile({ company: {} }, {})).toEqual([]);
  });

  it('незнайомі ключі анкети ігноруються', () => {
    expect(suggestProfile({}, A({ some_random_key: 'значення' }))).toEqual([]);
  });
});

describe('applySuggestions', () => {
  it('пише лише вибране й не чіпає решту профілю', () => {
    const company = { name: 'Кава', contactName: 'Олена' };
    const s = suggestProfile({ company }, A({ company_niche: 'Кава', technology_platform_v: 'Shopify' }));
    const next = applySuggestions(company, s.filter((x) => x.field === 'platform'));
    expect(next.platform).toBe('Shopify');
    expect(next.niche).toBeUndefined();
    expect(next.name).toBe('Кава');
    expect(next.contactName).toBe('Олена');
  });

  it('не мутує вихідний профіль — інакше скасування було б неможливе', () => {
    const company = { name: 'Кава' };
    const before = JSON.stringify(company);
    applySuggestions(company, suggestProfile({ company }, A({ company_niche: 'нова' })));
    expect(JSON.stringify(company)).toBe(before);
  });

  it('поля-списки лишаються масивом, а строкові — рядком', () => {
    const s = suggestProfile({}, A({ analytics_traffic: ['SEO', 'Email/CRM'], company_niche: 'Кава' }));
    const next = applySuggestions({}, s);
    expect(Array.isArray(next.acqChannels)).toBe(true);
    expect(typeof next.niche).toBe('string');
  });

  it('порожній вибір лишає профіль як був', () => {
    const company = { name: 'Кава' };
    expect(applySuggestions(company, [])).toEqual(company);
  });
});

describe('fillableCount', () => {
  it('рахує рівно те, що реально перенесеться', () => {
    const rec: DiagRecord = { company: { niche: 'зайнято' } };
    const answers = A({ company_niche: 'з анкети', company_markets: 'UA, PL', technology_platform_v: 'Shopify' });
    expect(fillableCount(rec, answers)).toBe(2);
  });

  it('нуль, коли переносити нічого', () => {
    expect(fillableCount({ company: { niche: 'є' } }, A({ company_niche: 'з анкети' }))).toBe(0);
  });
});
