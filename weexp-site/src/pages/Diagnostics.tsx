import { PageHead } from '@/components/PageHead';
import { Calculator } from '@/components/Calculator';
import { Proof } from '@/components/Proof';

/** /diagnostics — інтерактивний розрахунок розриву виручки + доказ на реальному кейсі. */
export function Diagnostics() {
  return (
    <>
      <PageHead
        kicker="Інструмент · Діагностика"
        title={<>Скільки ви лишаєте<br />на столі щороку?</>}
        lead={<>Чесна математика без подвійного рахунку: рахуємо <b>консервативний</b> розрив між тим, що є, і нормою сегмента.</>}
      />
      <section id="calc"><Calculator /></section>
      <Proof />
    </>
  );
}
