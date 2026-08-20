import { useT } from '@/i18n';
import './system.css';

/**
 * Єдина сходинкова смуга діагностики — показуємо на всіх кроках (калькулятор,
 * карта, кабінет), щоб клієнт бачив ОДИН безперервний шлях, а не окремі попапи.
 * active: 1..5. Пройдені кроки позначені ✓, поточний підсвічений.
 */
export function FunnelSteps({ active }: { active: number }) {
  const t = useT();
  const STEPS = [t('Профіль', 'Profile'), t('Симптоми', 'Symptoms'), t('Витік', 'Leak'), t('Карта', 'Map'), t('Кабінет', 'Cabinet')];
  return (
    <div className="fsteps mono" role="list" aria-label={t(`Крок ${active} з ${STEPS.length}`, `Step ${active} of ${STEPS.length}`)}>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = n < active;
        return (
          <span key={s} role="listitem" className={'fstep' + (n === active ? ' is-on' : '') + (done ? ' is-done' : '')}>
            <b>{done ? '✓' : String(n).padStart(2, '0')}</b>
            <span>{s}</span>
            {n < STEPS.length && <i aria-hidden="true">→</i>}
          </span>
        );
      })}
    </div>
  );
}
