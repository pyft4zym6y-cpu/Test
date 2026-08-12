import { Eyebrow, FadeIn } from '@/lib/primitives';
import './states.css';

/** «Стани, а не воронка» — жизненный цикл бизнеса вдоль оси Independence Score. */
const STATES = [
  { band: '0–25', name: 'Хаос', text: 'Бізнес тримається на засновнику. Втрати сховані в операційці.' },
  { band: '25–50', name: 'Діагноз', text: 'Цифри на столі. Видно, де і скільки грошей втрачається.' },
  { band: '50–80', name: 'Система', text: 'Відділ, процеси, плейбуки. Зростання стає повторюваним.' },
  { band: '80–100', name: 'Незалежність', text: 'Бізнес працює і росте без вас. Готовий до ринків ЄС.' },
];

export function States() {
  return (
    <section className="st" data-say="Ми ведемо не по воронці, а по станах: хаос → діагноз → система → незалежність.">
      <div className="wrap">
        <FadeIn><Eyebrow>Життєвий цикл · стани, не воронка</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="st-h">Стани, а не <span className="mk">воронка</span></h2></FadeIn>
        <FadeIn delay={0.1}><p className="st-lead">Ми не тягнемо клієнта по етапах продажу. Ми рухаємо бізнес станами — і кожен вимірюється одним числом: Independence Score.</p></FadeIn>
        <div className="st-track">
          {STATES.map((s, i) => (
            <FadeIn key={s.name} delay={0.12 + i * 0.09} className="st-col">
              <div className={`st-node${i === STATES.length - 1 ? ' is-goal' : ''}`}>
                <span className="st-band mono">{s.band}</span>
                <span className="st-name">{s.name}</span>
                <p className="st-text">{s.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
