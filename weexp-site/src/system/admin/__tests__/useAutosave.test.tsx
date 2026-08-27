/**
 * Автозбереження. Кожен його дефект втрачає роботу менеджера тихо — редактор
 * виглядає збереженим, а даних немає. Тому саме тут тест дорожчий за перегляд
 * коду: очима не видно ні гонки двох записів, ні втрати при демонтажі.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutosave } from '../useAutosave';

vi.mock('@/lib/toast', () => ({ toast: vi.fn() }));
import { toast } from '@/lib/toast';

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

const ok = () => Promise.resolve({ ok: true });

describe('useAutosave', () => {
  it('не пише одразу: правки склеюються дебаунсом', async () => {
    const save = vi.fn(ok);
    const { result } = renderHook(() => useAutosave<string>(save, 300));

    act(() => { result.current.touch('а'); result.current.touch('аб'); result.current.touch('абв'); });
    expect(save).not.toHaveBeenCalled();
    expect(result.current.state).toBe('dirty');

    await act(async () => { vi.advanceTimersByTime(300); });
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    // Пишеться ОСТАННЄ значення, а не перше: інакше редактор відкотив би текст.
    expect(save).toHaveBeenCalledWith('абв');
  });

  it('після успіху стан «saved» і проставлений час', async () => {
    const { result } = renderHook(() => useAutosave<string>(ok, 100));
    act(() => { result.current.touch('x'); });
    await act(async () => { vi.advanceTimersByTime(100); });
    await waitFor(() => expect(result.current.state).toBe('saved'));
    expect(result.current.savedAt).toMatch(/\d/);
  });

  it('помилка не зникає мовчки: стан «error» і текст причини', async () => {
    const save = vi.fn(() => Promise.resolve({ ok: false, error: 'RLS: немає прав' }));
    const { result } = renderHook(() => useAutosave<string>(save, 50));
    act(() => { result.current.touch('x'); });
    await act(async () => { vi.advanceTimersByTime(50); });
    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(result.current.error).toBe('RLS: немає прав');
  });

  it('flush() пише негайно, не чекаючи дебаунса', async () => {
    const save = vi.fn(ok);
    const { result } = renderHook(() => useAutosave<string>(save, 5000));
    act(() => { result.current.touch('терміново'); });
    await act(async () => { await result.current.flush(); });
    expect(save).toHaveBeenCalledWith('терміново');
  });

  it('flush() під час запису не створює другого паралельного — черга з одного', async () => {
    // Перший запис «зависає» до нашої команди, решта відповідають одразу:
    // інакше другий виклик теж повис би, і тест впав би за таймаутом замість
    // того, щоб перевірити чергу.
    let release: (v: { ok: boolean }) => void = () => {};
    let calls = 0;
    const save = vi.fn(() => {
      calls += 1;
      if (calls === 1) return new Promise<{ ok: boolean }>((r) => { release = r; });
      return Promise.resolve({ ok: true });
    });
    const { result } = renderHook(() => useAutosave<string>(save, 10));

    act(() => { result.current.touch('перше'); });
    await act(async () => { vi.advanceTimersByTime(10); });
    expect(save).toHaveBeenCalledTimes(1);

    // Другий виклик поки перший ще в польоті: має дочекатись, а не піти паралельно.
    let second: Promise<boolean> | undefined;
    act(() => { second = result.current.flush(); });
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => { release({ ok: true }); await second; });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('при демонтажі з незбереженим — записує, а не губить', async () => {
    const save = vi.fn(ok);
    const { result, unmount } = renderHook(() => useAutosave<string>(save, 5000));
    act(() => { result.current.touch('не встиг зберегти'); });
    expect(save).not.toHaveBeenCalled();
    await act(async () => { unmount(); });
    await waitFor(() => expect(save).toHaveBeenCalledWith('не встиг зберегти'));
  });

  it('після успішного запису демонтаж не пише вдруге', async () => {
    const save = vi.fn(ok);
    const { result, unmount } = renderHook(() => useAutosave<string>(save, 20));
    act(() => { result.current.touch('готово'); });
    await act(async () => { vi.advanceTimersByTime(20); });
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await act(async () => { unmount(); });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('помилка ПІСЛЯ демонтажу йде тостом: показати її в компоненті вже ніде', async () => {
    const save = vi.fn(() => Promise.resolve({ ok: false, error: 'мережа' }));
    const { result, unmount } = renderHook(() => useAutosave<string>(save, 5000));
    act(() => { result.current.touch('втрачається?'); });
    await act(async () => { unmount(); });
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(String((toast as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain('не збереглися');
  });

  it('beforeunload попереджає лише коли є незбережене', () => {
    const { result, unmount } = renderHook(() => useAutosave<string>(ok, 5000));

    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);

    act(() => { result.current.touch('брудно'); });
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);

    unmount();
  });

  it('слухач beforeunload знімається при демонтажі — інакше він накопичується на кожному відкритті картки', async () => {
    const { result, unmount } = renderHook(() => useAutosave<string>(ok, 5000));
    act(() => { result.current.touch('x'); });
    await act(async () => { unmount(); });
    const after = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});
