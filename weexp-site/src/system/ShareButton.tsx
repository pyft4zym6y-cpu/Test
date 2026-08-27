import { useT } from '@/i18n';
import { toast } from '@/lib/toast';

/**
 * Кнопка «Поділитися»: нативний share, копіювання посилання — фолбек.
 *
 * Була тиха. Один `catch { }` ловив ВСЕ: і скасування користувачем, і реальну
 * помилку. На iOS у приватному вікні `navigator.share` кидає, а
 * `navigator.clipboard` там може бути взагалі відсутнім — обидва шляхи падали
 * в порожній catch, і кнопка просто нічого не робила. Мовчазна кнопка гірша за
 * кнопку з помилкою: користувач не знає, чи він промахнувся, чи вона зламана.
 *
 * Тепер три рівні: нативний share → clipboard → старий execCommand. Якщо не
 * спрацював жоден — показуємо саме посилання, щоб його можна було скопіювати
 * вручну. Мовчки виходимо ЛИШЕ коли користувач сам закрив системний діалог.
 */
export function ShareButton({ title, className = 'sysx-cta' }: { title?: string; className?: string }) {
  const t = useT();

  /** Останній рубіж: прихована textarea + execCommand. Працює там, де немає Clipboard API. */
  const legacyCopy = (text: string): boolean => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      // Поза екраном, але у DOM: без цього виділення не спрацює.
      ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);   // iOS ігнорує select() без цього
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch { return false; }
  };

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'WEEXP', text: title || 'WEEXP — Commerce OS', url });
        return;
      } catch (e) {
        // Користувач закрив системний діалог — це не помилка, мовчимо.
        if (e instanceof DOMException && e.name === 'AbortError') return;
        // Будь-що інше — падаємо у фолбек нижче, а не зникаємо.
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast(t('✓ Посилання скопійовано', '✓ Link copied'));
        return;
      }
    } catch { /* немає дозволу або не secure context — пробуємо старий шлях */ }

    if (legacyCopy(url)) {
      toast(t('✓ Посилання скопійовано', '✓ Link copied'));
      return;
    }
    // Скопіювати не вдалось — віддаємо адресу текстом, щоб дія не пропала намарно.
    toast(t(`Скопіюйте посилання вручну: ${url}`, `Copy the link manually: ${url}`), 'err');
  };

  return (
    <button className={className} onClick={onShare} aria-label={t('Поділитися', 'Share')}>
      {t('Поділитися', 'Share')} ↗
    </button>
  );
}
