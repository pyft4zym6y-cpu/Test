/**
 * Перехід «заявка → проєкт» — єдиний шлях від первинного контакту до роботи.
 *
 * Було: кнопка з'являлась ЛИШЕ на стадії «Завершена», а сама «Завершена»
 * читалась як «заявку закрито». Після дзвінка менеджер не знав, куди подіти
 * клієнта, і шукав його між двома воронками — «Аудити» й «Проєкти».
 *
 * Стало: у картці заявки один головний блок «Наступний крок». Він або веде
 * в проєкт, або прямо каже, чого для цього бракує. «Конвертована в проєкт» —
 * не статус у базі, а факт наявності проєкту, тож розійтися з реальністю не може.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { LeadDetail } from '../LeadDetail';
import { canConvert, stageView, leadStageLabel } from '../shared';
import type { AdminRow, LeadRow } from '@/lib/supa';

vi.mock('@/lib/supa', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  setLeadDeal: async () => ({ ok: true }),
}));

const CLIENT: AdminRow = { userId: 'u1', email: 'anna@shop.ua', company: 'Krambox', record: {} };
const lead = (p: Partial<LeadRow> = {}): LeadRow => ({ id: 'l1', email: 'anna@shop.ua', name: 'Анна', status: 'new', ...p });

const onConvert = vi.fn();
const draw = (l: LeadRow, rows: AdminRow[] = [CLIENT]) => {
  cleanup();
  render(<LeadDetail lead={l} allRows={rows} onClose={() => {}} onStatus={() => {}} onDeal={() => {}}
    onConvert={onConvert} onDelete={() => {}} busy="" onOpenClient={() => {}} />);
};
beforeEach(() => onConvert.mockClear());

describe('похідна стадія «конвертована»', () => {
  it('зʼявляється від наявності проєкту, а не від статусу', () => {
    expect(stageView(lead({ status: 'progress' }))).toBe('progress');
    expect(stageView(lead({ status: 'progress', deal: { projectId: 'pr_1' } }))).toBe('converted');
    expect(leadStageLabel(lead({ status: 'new', deal: { projectId: 'pr_1' } })).l).toBe('Конвертована в проєкт');
  });

  it('конвертувати можна із будь-якої живої стадії', () => {
    for (const st of ['new', 'qualified', 'progress'] as const) {
      expect(canConvert(lead({ status: st })), st).toBe(true);
    }
    // Відсіяну й закриту — ні: спершу поверніть заявку в роботу.
    // 'done' — легасі-статус, він зводиться в «Архів»: окремої «Завершеної»
    // між «довели до проєкту» і «закрили» більше немає.
    for (const st of ['unqualified', 'archive', 'done'] as const) {
      expect(canConvert(lead({ status: st })), st).toBe(false);
    }
    // Двічі один проєкт не створюємо.
    expect(canConvert(lead({ status: 'qualified', deal: { projectId: 'pr_1' } }))).toBe(false);
  });
});

describe('картка заявки: наступний крок', () => {
  it('на кваліфікованій заявці пропонує створити проєкт', () => {
    draw(lead({ status: 'qualified' }));
    const b = screen.getByRole('button', { name: /Створити проєкт/ });
    fireEvent.click(b);
    expect(onConvert).toHaveBeenCalledTimes(1);
  });

  it('на новій заявці кнопка теж є — переходу більше не треба чекати', () => {
    draw(lead({ status: 'new' }));
    expect(screen.getByRole('button', { name: /Створити проєкт/ })).toBeTruthy();
    expect(screen.queryByText(/Позначити завершеною/)).toBeNull();
  });

  it('без кабінету пояснює це до кліку, а не тостом після', () => {
    draw(lead({ status: 'qualified' }), []);
    expect(screen.getByText(/Потрібен кабінет клієнта/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Створити проєкт/ })).toBeNull();
    expect(screen.getByText(/anna@shop.ua/, { selector: 'b' })).toBeTruthy();
  });

  it('на некваліфікованій каже, що заявка поза роботою, і не пропонує проєкт', () => {
    draw(lead({ status: 'unqualified' }));
    expect(screen.getByText(/Заявка поза роботою/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Створити проєкт/ })).toBeNull();
  });

  it('після конвертації показує проєкт і посилання на нього', () => {
    draw(lead({ status: 'progress', deal: { projectId: 'pr_1', projectUserId: 'u1' } }));
    expect(screen.getByText(/Проєкт створено/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Перейти до проєкту/ }));
    expect(onConvert).toHaveBeenCalledTimes(1);
  });
});
