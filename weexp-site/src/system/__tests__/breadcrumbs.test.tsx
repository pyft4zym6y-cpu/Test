/**
 * Хлебные крошки на URL с конечным слешем.
 *
 * `crumbsFor` искал маршрут точным ключом в таблице названий, поэтому `/proof/`
 * (так отдаёт каталог любой статический сервер, так же приходят ссылки из
 * писем и чужих сайтов) не находил ничего: страница оставалась без крошек —
 * и без разметки BreadcrumbList для поиска, то есть без сниппета с путём.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RouteBreadcrumbs } from '../Breadcrumbs';

const at = (path: string) => {
  cleanup();
  render(<MemoryRouter initialEntries={[path]}><RouteBreadcrumbs /></MemoryRouter>);
};

describe('хлібні крихти', () => {
  it('рисуются на обычном маршруте', () => {
    at('/proof');
    expect(screen.getByLabelText('Хлібні крихти')).toBeTruthy();
    expect(screen.getByText('Наші перемоги')).toBeTruthy();
  });

  it('рисуются и когда URL пришёл с конечным слешем', () => {
    at('/proof/');
    expect(screen.getByLabelText('Хлібні крихти')).toBeTruthy();
    expect(screen.getByText('Наші перемоги')).toBeTruthy();
  });

  it('то же в английской версии', () => {
    at('/en/pricing/');
    expect(screen.getByText('Pricing')).toBeTruthy();
  });

  it('на главной крошек нет — их незачем показывать', () => {
    at('/');
    expect(screen.queryByLabelText('Хлібні крихти')).toBeNull();
  });
});
