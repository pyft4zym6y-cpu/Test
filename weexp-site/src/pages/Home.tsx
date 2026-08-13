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
            <Link to="/os" className="btn-primary mono">Відкрити Commerce OS →</Link>
            <Link to="/diagnostics" className="btn-ghost mono">Порахувати розрив →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
