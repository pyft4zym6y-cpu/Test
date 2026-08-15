import { PageHead } from '@/components/PageHead';
import { BusinessXray } from '@/components/BusinessXray';
import { QUESTIONS_FULL } from '@/data/xray';

/** /diagnose/full — розширена самодіагностика (28 питань) зі збереженням результату. */
export function FullDiagnosis() {
  return (
    <>
      <PageHead
        kicker="Інструмент · Повна діагностика"
        title={<>Повна діагностика<br />системи онлайн-продажів</>}
        lead={<>Глибший зріз по всіх 8 системах — {QUESTIONS_FULL.length} тверджень. <b>Результат зберігається</b> у
          браузері: повертайтесь і продовжуйте з того ж місця. Далі — заявка на повний Diagnosis у грошах.</>}
      />
      <section className="wrap">
        <BusinessXray questions={QUESTIONS_FULL} storageKey="weexp-xray-full" full />
      </section>
    </>
  );
}
