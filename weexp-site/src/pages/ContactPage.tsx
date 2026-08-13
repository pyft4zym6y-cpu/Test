import { PageHead } from '@/components/PageHead';
import { Contact } from '@/components/Contact';

/** /contact — форма-лід (mailto → pashasidorenko18@gmail.com) + прямі контакти засновника. */
export function ContactPage() {
  return (
    <>
      <PageHead
        kicker="Розділ · Контакти"
        title={<>Тепер очевидно:<br />зростання — це система</>}
        lead={<>Залиште вхідні дані — повернемось із першим зрізом <b>розриву у грошах</b>. Це ще не робота, це діагноз.</>}
      />
      <Contact />
    </>
  );
}
