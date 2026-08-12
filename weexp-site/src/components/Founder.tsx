import { Eyebrow, FadeIn } from '@/lib/primitives';
import './founder.css';

/** Засновник — Павло Сидоренко (контент старого About/брендбука). Без фото: бренд — схема > фото. */
const ARCH = ['Творець 60%', 'Мудрець 30%', 'Правитель 10%'];

export function Founder() {
  return (
    <section className="fnd" data-say="Не підрядник, а архітектор системи. Засновник — Павло Сидоренко.">
      <div className="wrap">
        <FadeIn><Eyebrow>Засновник · роль і теза</Eyebrow></FadeIn>
        <div className="fnd-grid">
          <FadeIn delay={0.06} className="fnd-left">
            <h2 className="fnd-h">Не підрядник. <span className="mk">Архітектор</span> системи.</h2>
            <p className="fnd-lead">Ми не беремо проєкти, де рішення вже ухвалене і потрібне лише його виправдання. Ми ставимо діагноз у грошах — навіть якщо він незручний.</p>
            <div className="fnd-arch">
              {ARCH.map((a) => <span key={a} className="fnd-chip mono">{a}</span>)}
            </div>
          </FadeIn>
          <FadeIn delay={0.14} className="fnd-card">
            <div className="fnd-mono">ПС</div>
            <blockquote className="fnd-quote">«Найдорожча помилка власника — плутати активність із системою. Ми будуємо те, що працює без нас.»</blockquote>
            <div className="fnd-name">Павло Сидоренко</div>
            <div className="fnd-role mono">Засновник · Head of Commerce OS</div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
