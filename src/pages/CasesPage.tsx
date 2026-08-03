import Cases from '../components/Cases';
import { Industries } from '../components/Market';
import { RayCase, PageCta } from '../components/NewSections';

export default function CasesPage() {
  return (
    <div className="pt-16">
      <Cases />
      <RayCase />
      <Industries />
      <PageCta label="Ваш кейс може бути наступним" />
    </div>
  );
}
