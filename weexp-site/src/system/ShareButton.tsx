import { useT } from '@/i18n';
import { toast } from '@/lib/toast';

/**
 * Кнопка «Поділитися»: нативний share на мобільних, копіювання посилання — фолбек.
 * Самодостатня, без залежностей. Клас .sysx-cta для єдиного стилю.
 */
export function ShareButton({ title, className = 'sysx-cta' }: { title?: string; className?: string }) {
  const t = useT();
  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const data = { title: title || 'WEEXP', text: title || 'WEEXP — Commerce OS', url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      toast(t('✓ Посилання скопійовано', '✓ Link copied'));
    } catch { /* користувач скасував share — тихо */ }
  };
  return (
    <button className={className} onClick={onShare} aria-label={t('Поділитися', 'Share')}>
      {t('Поділитися', 'Share')} ↗
    </button>
  );
}
