/**
 * Історія взаємодії з клієнтом.
 *
 * «Історія активності» знала про чотири речі: експрес-аудит, зміни рівнів
 * доступу, заявку з кабінету й дату оновлення профілю. Коли прийшла заявка і
 * звідки, коли клієнт відкрив аудит, що завантажив, що ми передали, коли
 * створили проєкт — усе це доводилось збирати очима по вкладках.
 *
 * Правило, яке тут стережеться: нічого не вигадуємо. Подія потрапляє в стрічку
 * тільки якщо в даних є її час. Домальовувати «ймовірні» кроки за датою
 * оновлення означало б показувати менеджеру історію, якої не було.
 */
import { describe, it, expect } from 'vitest';
import { clientTimeline } from '../timeline';
import type { AdminRow, LeadRow } from '@/lib/supa';

const row = (p: Partial<AdminRow> = {}): AdminRow => ({ userId: 'u1', email: 'anna@shop.ua', ...p });
const at = (d: string) => `2026-08-${d}T10:00:00Z`;

describe('стрічка подій', () => {
  it('порожній клієнт не породжує подій', () => {
    expect(clientTimeline(row(), null)).toEqual([]);
  });

  it('заявка з форми потрапляє в історію з джерелом', () => {
    const leads: LeadRow[] = [{ id: 'l1', email: 'anna@shop.ua', at: at('01'), source: 'форма /diagnose', task: 'Падає конверсія' }];
    const ev = clientTimeline(row(), leads);
    expect(ev[0].kind).toBe('lead');
    expect(ev[0].text).toContain('форма /diagnose');
    expect(ev[0].note).toBe('Падає конверсія');
  });

  it('чужі заявки не потрапляють у картку', () => {
    const leads: LeadRow[] = [{ id: 'l2', email: 'other@shop.ua', at: at('01') }];
    expect(clientTimeline(row(), leads)).toEqual([]);
  });

  it('збирає кроки з усіх джерел і сортує від нових до старих', () => {
    const r = row({
      updatedAt: at('20'),
      funnel: { deepAt: at('05'), meetAt: at('03'), tierHistory: { DEEP: [{ st: 'granted', at: at('06'), by: 'manager', byEmail: 'pm@weexp.agency' }] } },
      record: {
        express: { at: at('02'), total: 1000, range: [800, 1200], primary: 'experience', overallHealth: 61 },
        clientFiles: [{ id: 'f1', group: 'report', title: 'P&L 2025', path: 'p/f1', at: at('08') }],
        sharedDocs: [{ id: 'd1', title: 'Діагностичний звіт', at: at('12'), by: 'pm@weexp.agency' }],
        deepModeration: { status: 'submitted', at: at('09') },
        auditJobs: [{ id: 'j1', at: at('10'), site: 'shop.ua', status: 'done', health: 58 }],
        projects: [{ id: 'pr1', title: 'Krambox · супровід', origin: { at: at('15'), by: 'pm@weexp.agency' } }],
      },
    });
    const ev = clientTimeline(r, null);
    const texts = ev.map((e) => e.text);
    expect(texts).toEqual(expect.arrayContaining([
      expect.stringContaining('експрес-аудит'),
      expect.stringContaining('Запит на глибокий аудит'),
      expect.stringContaining('Запит на зустріч'),
      expect.stringContaining('відкрито доступ'),
      expect.stringContaining('Клієнт завантажив'),
      expect.stringContaining('Передано клієнту'),
      expect.stringContaining('модерацію'),
      expect.stringContaining('Прогін рушієм'),
      expect.stringContaining('Створено проєкт'),
    ]));
    const times = ev.map((e) => e.at);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it('видно, чий це був крок', () => {
    const r = row({ record: { express: { at: at('02'), total: 1, range: [1, 2], primary: 'experience', overallHealth: 50 } } });
    expect(clientTimeline(r, null)[0].by).toBe('клієнт');
    const r2 = row({ record: { sharedDocs: [{ id: 'd', title: 'Звіт', at: at('03') }] } });
    expect(clientTimeline(r2, null)[0].by).toBe('команда');
    const r3 = row({ record: { auditJobs: [{ id: 'j', at: at('04'), status: 'done' }] } });
    expect(clientTimeline(r3, null)[0].by).toBe('рушій');
  });

  it('подія без часу не вигадується', () => {
    const r = row({ record: { clientFiles: [{ id: 'f', group: 'export', title: 'без дати', path: 'p/f' }] } });
    expect(clientTimeline(r, null)).toEqual([]);
  });

  it('той самий факт із двох джерел не дублюється', () => {
    const r = row({ updatedAt: at('20') });
    const twice = clientTimeline({ ...r, record: {} }, null);
    expect(twice.filter((e) => e.text === 'Оновлення профілю клієнта')).toHaveLength(1);
  });
});
