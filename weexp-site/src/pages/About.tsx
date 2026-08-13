import { PageHead } from '@/components/PageHead';
import { Manifest } from '@/components/Manifest';
import { States } from '@/components/States';
import { Founder } from '@/components/Founder';
import { Team } from '@/components/Team';

/** /about — агенція: маніфест, стани зростання, засновник, команда. */
export function About() {
  return (
    <>
      <PageHead
        kicker="Розділ · Агенція"
        title={<>Архітектори<br />цифрових систем</>}
        lead={<>8+ років у міжнародному e-commerce (US, EU, MENA). Ми перетворюємо досвід на <b>систему</b>, яку можна передати й масштабувати.</>}
      />
      <Manifest />
      <States />
      <Founder />
      <Team />
    </>
  );
}
