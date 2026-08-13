import { Link } from 'react-router-dom';
import { Hero } from '@/components/Hero';
import { Transform } from '@/components/Transform';
import { Proof } from '@/components/Proof';
import { Engine } from '@/components/Engine';
import { Usp } from '@/components/Usp';

/** Головна — ворота «WEEXP OS»: герой → розрив плоскості → доказ → карта системи → USP. */
export function Home() {
  return (
    <>
      <Hero />
      <Transform />
      <Proof />
      <section id="system"><Engine /></section>
      <Usp />
      <section className="home-cta wrap" data-say="Оберіть модуль системи або поставте діагноз.">
        <div className="home-cta-in">
          <p className="home-cta-lead">Подивіться, як влаштована система — або одразу порахуйте свій розрив у грошах.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
            <Link to="/what-we-build" className="btn-ghost mono">Подивитися, що ми будуємо →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
