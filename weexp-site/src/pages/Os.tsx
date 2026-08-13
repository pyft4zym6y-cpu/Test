import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Engine } from '@/components/Engine';
import { DemoOS } from '@/components/DemoOS';
import { Flywheel } from '@/components/Flywheel';

/** Commerce OS — головний модуль: карта системи, робочий інтерфейс, маховик. */
export function Os() {
  return (
    <>
      <PageHead
        kicker="Модуль · Commerce OS"
        title={<>Операційна система<br />вашого e-commerce</>}
        lead={<>Не поради збоку, а <b>працююча система</b>: залучення, конверсія, утримання, операції та фінанси зведені в один контур, яким можна керувати.</>}
      />
      <section id="system"><Engine /></section>
      <DemoOS />
      <Flywheel />
      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Порахуйте, скільки грошей система повертає саме вам.</p>
          <div className="home-cta-row">
            <Link to="/diagnostics" className="btn-primary mono">Діагностика розриву →</Link>
            <Link to="/cases" className="btn-ghost mono">Дивитись кейси →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
