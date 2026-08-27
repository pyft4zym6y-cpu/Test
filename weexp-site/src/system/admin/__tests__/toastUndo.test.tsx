/**
 * Тост зі скасуванням. Механізм задуманий як заміна діалогу «ви впевнені?» —
 * тому в нього є вимога, якої в тоста зазвичай немає: він мусить надійно
 * викликати дію рівно один раз. Відкат, що спрацював двічі, гірший за
 * відсутній: він поверне і те, що видалили навмисно.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toaster, toast, toastUndo } from '@/lib/toast';

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => {
  // Стор тостів модульний і не має скидання — у продакшні це правильно
  // (застосунок один), але між тестами він тече. Проганяємо таймери за межу
  // життя найдовшого тоста замість того, щоб додавати в бібліотеку
  // тестовий reset, якого в проді нікому не треба.
  act(() => { vi.advanceTimersByTime(20000); });
  vi.useRealTimers();
});

describe('toastUndo', () => {
  it('показує повідомлення й кнопку скасування', () => {
    render(<Toaster />);
    act(() => { toastUndo('Нотатку видалено', () => {}); });
    expect(screen.getByText('Нотатку видалено')).toBeInTheDocument();
    expect(screen.getByText('Скасувати')).toBeInTheDocument();
  });

  it('клік викликає відкат', () => {
    const undo = vi.fn();
    render(<Toaster />);
    act(() => { toastUndo('Задачу видалено', undo); });
    fireEvent.click(screen.getByText('Скасувати'));
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('подвійний клік не відкочує двічі — тост зникає з першим', () => {
    const undo = vi.fn();
    render(<Toaster />);
    act(() => { toastUndo('Платіж видалено', undo); });
    const btn = screen.getByText('Скасувати');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('живе довше за звичайний тост: три секунди — менше, ніж людина усвідомлює помилку', () => {
    render(<Toaster />);
    act(() => { toastUndo('Видалено', () => {}); });
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByText('Скасувати')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByText('Скасувати')).toBeNull();
  });

  it('після зникнення відкат уже не викликається', () => {
    const undo = vi.fn();
    render(<Toaster />);
    act(() => { toastUndo('Видалено', undo); });
    act(() => { vi.advanceTimersByTime(9000); });
    expect(screen.queryByText('Скасувати')).toBeNull();
    expect(undo).not.toHaveBeenCalled();
  });

  it('звичайний toast лишається без кнопки — дію має лише той, у кого є що відкочувати', () => {
    render(<Toaster />);
    act(() => { toast('Збережено'); });
    expect(screen.getByText('Збережено')).toBeInTheDocument();
    expect(screen.queryByText('Скасувати')).toBeNull();
  });

  it('кілька відкатів співіснують і не плутають дії між собою', () => {
    const a = vi.fn(); const b = vi.fn();
    render(<Toaster />);
    act(() => { toastUndo('Перше', a); toastUndo('Друге', b); });
    const buttons = screen.getAllByText('Скасувати');
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
  });

  it('асинхронний відкат не ламає тост', async () => {
    const undo = vi.fn().mockResolvedValue(undefined);
    render(<Toaster />);
    act(() => { toastUndo('Видалено', undo); });
    await act(async () => { fireEvent.click(screen.getByText('Скасувати')); });
    expect(undo).toHaveBeenCalled();
  });
});
