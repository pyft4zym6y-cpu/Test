/**
 * Межа помилки та діалоги. Це той код, який працює ЛИШЕ коли все інше зламалось,
 * тому перевірити його вручну майже неможливо: треба спершу щось зруйнувати.
 * Саме тому він і був неробочим — плашка без стилю, ретрай, що падає по колу.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PanelBoundary, Panel, DialogHost, askConfirm, askText } from '../dialog';

/** Компонент, який падає керовано: перший рендер завжди, далі — за прапорцем. */
function Boom({ failing }: { failing: () => boolean }) {
  if (failing()) throw new Error('панель зламалась');
  return <p>панель жива</p>;
}

let errSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => { errSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => errSpy.mockRestore());

describe('PanelBoundary', () => {
  it('ловить падіння і показує назву панелі, а не білий екран', () => {
    render(<PanelBoundary title="Дашборд"><Boom failing={() => true} /></PanelBoundary>);
    expect(screen.getByText(/Дашборд — помилка/)).toBeInTheDocument();
    // getAllBy — текст навмисно є двічі: у плашці й у розгортаному стеку.
    expect(screen.getAllByText(/панель зламалась/).length).toBeGreaterThan(0);
  });

  it('успішний ретрай повертає панель до життя', () => {
    let broken = true;
    render(<PanelBoundary title="Заявки"><Boom failing={() => broken} /></PanelBoundary>);
    broken = false;
    fireEvent.click(screen.getByText('Спробувати ще раз'));
    expect(screen.getByText('панель жива')).toBeInTheDocument();
  });

  it('після двох невдалих спроб пропонує перезавантаження, а не третій той самий результат', () => {
    render(<PanelBoundary title="Проєкти"><Boom failing={() => true} /></PanelBoundary>);
    fireEvent.click(screen.getByText('Спробувати ще раз'));
    fireEvent.click(screen.getByText('Спробувати ще раз'));
    expect(screen.queryByText('Спробувати ще раз')).toBeNull();
    expect(screen.getByText('Перезавантажити сторінку')).toBeInTheDocument();
    expect(screen.getByText(/повторна спроба не допомогла/)).toBeInTheDocument();
  });

  it('пише збій у консоль: інакше його видно лише на плашці, яку легко проґавити', () => {
    render(<PanelBoundary title="Рушій"><Boom failing={() => true} /></PanelBoundary>);
    const said = errSpy.mock.calls.some((c) => String(c[0]).includes('панель «Рушій» впала'));
    expect(said).toBe(true);
  });

  it('текст помилки можна скопіювати без devtools', () => {
    render(<PanelBoundary title="Журнал"><Boom failing={() => true} /></PanelBoundary>);
    fireEvent.click(screen.getByText('Скопіювати текст помилки'));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(String((navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain('панель зламалась');
  });

  it('здорова панель рендериться як є, без обгорток навколо', () => {
    render(<PanelBoundary title="Ок"><Boom failing={() => false} /></PanelBoundary>);
    expect(screen.getByText('панель жива')).toBeInTheDocument();
    expect(screen.queryByText(/помилка/)).toBeNull();
  });

  it('падіння однієї панелі не забирає сусідню — саме заради цього межа й потрібна', () => {
    render(
      <div>
        <PanelBoundary title="Ліва"><Boom failing={() => true} /></PanelBoundary>
        <PanelBoundary title="Права"><Boom failing={() => false} /></PanelBoundary>
      </div>,
    );
    expect(screen.getByText(/Ліва — помилка/)).toBeInTheDocument();
    expect(screen.getByText('панель жива')).toBeInTheDocument();
  });
});

describe('Panel', () => {
  it('обгортка несе і межу, і Suspense — щоб їх не забували поодинці', () => {
    render(<Panel title="Аналітика"><Boom failing={() => true} /></Panel>);
    expect(screen.getByText(/Аналітика — помилка/)).toBeInTheDocument();
  });
});

describe('askConfirm / askText', () => {
  it('підтвердження повертає true на «так» і false на «ні»', async () => {
    render(<DialogHost />);
    const yes = askConfirm({ title: 'Видалити клієнта?', confirmLabel: 'Видалити' });
    expect(await screen.findByText('Видалити клієнта?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Видалити'));
    expect(await yes).toBe(true);

    const no = askConfirm({ title: 'Ще раз?' });
    await screen.findByText('Ще раз?');
    fireEvent.click(screen.getByText('Скасувати'));
    expect(await no).toBe(false);
  });

  it('Escape = скасування: діалог не має ставати пасткою', async () => {
    render(<DialogHost />);
    const p = askConfirm({ title: 'Небезпечна дія' });
    await screen.findByText('Небезпечна дія');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(await p).toBe(false);
  });

  it('askText віддає введене значення', async () => {
    render(<DialogHost />);
    const p = askText({ title: 'Назва документа', confirmLabel: 'Зберегти', input: { initial: '' } });
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'Звіт 2' } });
    fireEvent.click(screen.getByText('Зберегти'));
    expect(await p).toBe('Звіт 2');
  });

  it('askText на скасуванні віддає null, а не порожній рядок — це різні речі', async () => {
    render(<DialogHost />);
    const p = askText({ title: 'Коментар', input: { initial: '' } });
    await screen.findByText('Коментар');
    fireEvent.click(screen.getByText('Скасувати'));
    expect(await p).toBeNull();
  });
});
