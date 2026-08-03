import Idea from '../components/Idea';
import { Beliefs } from '../components/School';
import { StatusQuo, Glossary, PriceOfInaction, PageCta } from '../components/NewSections';

export default function ApproachPage() {
  return (
    <div className="pt-16">
      <StatusQuo />
      <Idea />
      <Glossary />
      <Beliefs />
      <PriceOfInaction />
      <PageCta label="Порахуємо ваш розрив у грошах" />
    </div>
  );
}
