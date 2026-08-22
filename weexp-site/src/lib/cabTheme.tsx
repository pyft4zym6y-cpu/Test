import { useEffect, useState } from 'react';

/**
 * Тема кабінету/адмінки: 'dark' | 'light'. За замовчуванням — системна
 * (prefers-color-scheme), далі памʼятає вибір у localStorage. Застосовується
 * класом `is-dark` на кореневому контейнері (див. cabinet.css → .cab.is-dark).
 * Стосується лише приватних екранів; маркетинговий сайт не чіпаємо.
 */
const KEY = 'weexp:cab-theme';

export function useCabTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s === 'dark') return true;
      if (s === 'light') return false;
      return matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch { /* ignore */ } }, [dark]);
  return { dark, toggle: () => setDark((v) => !v), cls: dark ? ' is-dark' : '' };
}

/** Кнопка-перемикач теми (сонце/місяць). Керована зовні. */
export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="cab-theme-btn"
      onClick={onToggle}
      aria-label={dark ? 'Світла тема' : 'Темна тема'}
      title={dark ? 'Світла тема' : 'Темна тема'}
    >
      {dark ? '☀' : '☾'}
    </button>
  );
}
