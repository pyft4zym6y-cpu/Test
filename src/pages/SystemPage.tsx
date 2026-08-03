import System from '../components/System';
import { HowItWorks, PageCta } from '../components/NewSections';

export default function SystemPage() {
  return (
    <div className="pt-16">
      <System />
      <HowItWorks />
      <PageCta label="Подивитись систему в дії" />
    </div>
  );
}
