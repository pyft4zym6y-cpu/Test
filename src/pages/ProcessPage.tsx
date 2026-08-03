import Process from '../components/Process';
import Economics from '../components/Economics';
import { PriceOfInaction, PageCta } from '../components/NewSections';

export default function ProcessPage() {
  return (
    <div className="pt-16">
      <Process />
      <Economics />
      <PriceOfInaction />
      <PageCta label="Процес, що захищає ваш бюджет" />
    </div>
  );
}
