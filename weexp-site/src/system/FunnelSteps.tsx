import './system.css';

/**
 * Єдина сходинкова смуга діагностики — показуємо на всіх кроках (калькулятор,
 * карта, кабінет), щоб клієнт бачив ОДИН безперервний шлях, а не окремі попапи.
 * active: 1..5. Пройдені кроки позначені ✓, поточний підсвічений.
 */
const STEPS = ['Профіль', 'Симптоми', 'Витік', 'Карта', 'Кабінет'];

export function FunnelSteps({ active }: { active: number }) {
  return (
    <div className="fsteps mono" role="list" aria-label={`Крок ${active} з ${STEPS.length}`}>
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
