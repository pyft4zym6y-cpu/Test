import { Link } from 'react-router-dom';
import { Hero } from '@/components/Hero';
import { DepartmentAnatomy } from '@/components/DepartmentAnatomy';
import { Proof } from '@/components/Proof';
import { Engine } from '@/components/Engine';
import { Usp } from '@/components/Usp';
import { GlobalReach } from '@/components/GlobalReach';
import { TechStack } from '@/components/TechStack';
import { VideoBlock } from '@/components/VideoBlock';

/** Головна — ворота «WEEXP OS»: герой → розрив плоскості → промо → доказ → global → система → стек. */
export function Home() {
  return (
    <>
      <Hero />
      <DepartmentAnatomy />
      <section className="wrap home-video">
        <VideoBlock title="WEEXP — система замість героїзму" sub="Хто ми і як будуємо e-commerce як функцію бізнесу" />
      </section>
      <Proof />
      <GlobalReach />
      <section id="system"><Engine /></section>
      <Usp />
      <TechStack />
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
