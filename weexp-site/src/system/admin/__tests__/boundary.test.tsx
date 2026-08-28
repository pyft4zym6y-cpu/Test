/**
 * Межа помилки та діалоги. Це той код, який працює ЛИШЕ коли все інше зламалось,
 * тому перевірити його вручну майже неможливо: треба спершу щось зруйнувати.
 * Саме тому він і був неробочим — плашка без стилю, ретрай, що падає по колу.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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


describe('застарілий бандл після деплою', () => {
  /*
   * Реальний збій у проді: адмінка не відкривала картку клієнта й картку
   * заявки — «Failed to fetch dynamically imported module … UserDetail-*.js ·
   * повторна спроба не допомогла». Ця межа стоїть усередині застосунку й
   * ловила збій раніше за глобальну, тому пропонувала повтор. Повторити
   * завантаження чанка, якого більше немає, неможливо: другий запит дає той
   * самий 404.
   */
  const Boom = ({ msg }: { msg: string }) => { throw new Error(msg); };
  const STALE = 'Failed to fetch dynamically imported module: https://weexp.agency/assets/UserDetail-4DKZFaHF.js';

  it('на зниклому чанку не пропонує повтор, а веде на перезавантаження', () => {
    render(<PanelBoundary title="Картка клієнта"><Boom msg={STALE} /></PanelBoundary>);
    expect(screen.queryByText(/Спробувати ще раз/)).not.toBeInTheDocument();
    expect(screen.getByText(/Перезавантажити сторінку/)).toBeInTheDocument();
    expect(screen.queryByText(/повторна спроба не допомогла/)).not.toBeInTheDocument();
  });

  it('пояснює причину людською мовою — а стектрейс лишає під «технічними деталями»', () => {
    render(<PanelBoundary title="Картка заявки"><Boom msg={STALE} /></PanelBoundary>);
    // Зверху — причина словами, зрозумілими менеджеру.
    expect(screen.getByText(/нова версія сайту/i)).toBeInTheDocument();
    // Сирий текст нікуди не зник: його копіюють у підтримку. Але він у
    // згорнутому блоці, а не замість пояснення.
    expect(screen.getByText(/Технічні деталі/)).toBeInTheDocument();
    expect(screen.getByText(/UserDetail-4DKZFaHF/)).toBeInTheDocument();
  });

  it('звичайний збій панелі поводиться як раніше — повтор лишається', () => {
    render(<PanelBoundary title="Дашборд"><Boom msg="Cannot read properties of undefined" /></PanelBoundary>);
    expect(screen.getByText(/Спробувати ще раз/)).toBeInTheDocument();
    // Текст видно і в плашці, і в технічних деталях — обидва місця доречні.
    expect(screen.getAllByText(/Cannot read properties of undefined/).length).toBeGreaterThan(0);
  });
});

describe('шлях «заявка → проект» видно на будь-якій стадії', () => {
  /*
   * Блок «Наступний крок» показувався ЛИШЕ на стадії «Завершена». Менеджер,
   * дивлячись на «Нову» заявку, не бачив ні кнопки, ні натяку, що переведення
   * в проект узагалі існує — звідси й питання «як перевести клієнта з воронки
   * в проект». Правило (проект створюємо із завершеної заявки) лишилось; воно
   * просто перестало бути невидимим.
   */
  const src = readFileSync(join(__dirname, '..', 'LeadDetail.tsx'), 'utf8');

  it('блок не сховано за стадією', () => {
    expect(src, 'блок знову рендериться лише при cur === «done»').not.toMatch(/\{cur === 'done' && \(\s*<Block title="Наступний крок">/);
    expect(src).toContain('<Block title="Наступний крок">');
  });

  it('на незавершеній заявці сказано, чого бракує, і є чим це виправити', () => {
    expect(src).toMatch(/cur !== 'done'/);
    expect(src).toContain('Позначити завершеною');
  });

  it('відсутній кабінет пояснюється до кліку, а не тостом після', () => {
    // Раніше про це дізнавались лише натиснувши кнопку й отримавши тост.
    expect(src).toMatch(/!client \?/);
    expect(src).toContain('кабінету з поштою');
  });
});
