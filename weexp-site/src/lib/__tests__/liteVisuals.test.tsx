/**
 * Решение «грузить ли тяжёлое 3D» обязано приниматься в ПЕРВОМ рендере.
 *
 * `lazy()` начинает тянуть чанк тогда, когда элемент впервые отрендерился. Пока
 * решение жило в useEffect, телефон успевал скачать и распарсить ~474 КБ
 * three.js, и только потом сцена снималась: экономия была на рисовании, но не на
 * трафике. Замер это подтвердил — /diagnose и /contact на iPhone запрашивали
 * чанк до правки и не запрашивают после.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLiteVisuals } from '../liteVisuals';

const setEnv = (o: { touch?: boolean; reduce?: boolean; saveData?: boolean; mem?: number; cores?: number }) => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: /reduced-motion/.test(q) ? !!o.reduce : /pointer: coarse/.test(q) ? !!o.touch : false,
    media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    onchange: null, dispatchEvent: () => false,
  }));
  Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => o.mem });
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => o.cores ?? 16 });
  Object.defineProperty(navigator, 'connection', { configurable: true, get: () => ({ saveData: !!o.saveData }) });
};

afterEach(() => vi.unstubAllGlobals());

describe('useLiteVisuals', () => {
  it('мощный десктоп с мышью получает 3D', () => {
    setEnv({ mem: 16, cores: 16 });
    expect(renderHook(() => useLiteVisuals()).result.current).toBe(false);
  });

  it('сенсорный экран — без 3D, даже если устройство мощное', () => {
    // На iPhone эвристика «мало памяти или ядер» не срабатывает вообще: Safari
    // не отдаёт deviceMemory, а ядер там 6.
    setEnv({ touch: true, cores: 6 });
    expect(renderHook(() => useLiteVisuals()).result.current).toBe(true);
  });

  it('prefers-reduced-motion — без 3D', () => {
    setEnv({ reduce: true, mem: 16, cores: 16 });
    expect(renderHook(() => useLiteVisuals()).result.current).toBe(true);
  });

  it('Save-Data — без 3D: пользователь прямо просил экономить трафик', () => {
    setEnv({ saveData: true, mem: 16, cores: 16 });
    expect(renderHook(() => useLiteVisuals()).result.current).toBe(true);
  });

  it('слабая машина (мало и памяти, и ядер) — без 3D', () => {
    setEnv({ mem: 4, cores: 4 });
    expect(renderHook(() => useLiteVisuals()).result.current).toBe(true);
  });

  it('мало памяти, но много ядер — 3D остаётся: признак должен быть двойным', () => {
    setEnv({ mem: 4, cores: 16 });
    expect(renderHook(() => useLiteVisuals()).result.current).toBe(false);
  });

  // Главное свойство: ответ верен уже на первом рендере, до эффектов.
  it('решение готово в первом же рендере, а не после эффекта', () => {
    setEnv({ touch: true, mem: 16, cores: 16 });
    const seen: boolean[] = [];
    renderHook(() => { const v = useLiteVisuals(); seen.push(v); return v; });
    expect(seen[0], 'первый рендер уже должен знать ответ — иначе чанк уже качается').toBe(true);
  });

  it('сломанный navigator не роняет страницу', () => {
    vi.stubGlobal('matchMedia', () => { throw new Error('нет такого API'); });
    expect(renderHook(() => useLiteVisuals()).result.current).toBe(false);
  });
});
