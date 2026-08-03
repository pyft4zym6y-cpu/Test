import MiniBot from '../components/MiniBot';
import System from '../components/System';
import { HowItWorks, PageCta } from '../components/NewSections';

export default function SystemPage() {
  return (
    <div className="pt-16">
      <System />
      <HowItWorks />
      <PageCta label="Подивитись систему в дії" />
      <MiniBot idleText="Наведи на модуль M01–M12 — поясню, що він робить →" />
    </div>
  );
}
