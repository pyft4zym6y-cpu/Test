import MiniBot from '../components/MiniBot';
import Idea from '../components/Idea';
import { Beliefs } from '../components/School';
import { Proof, StatusQuo, Glossary, PriceOfInaction, PageCta } from '../components/NewSections';

export default function ApproachPage() {
  return (
    <div className="pt-16">
      <Proof />
      <StatusQuo />
      <Idea />
      <Glossary />
      <Beliefs />
      <PriceOfInaction />
      <PageCta label="Порахуємо ваш розрив у грошах" />
      <MiniBot idleText="Наведи на цифри доказу — розповім, як ми цього досягли →" />
    </div>
  );
}
