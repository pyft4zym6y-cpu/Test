import Offers from '../components/Offers';
import { Competitors } from '../components/Market';
import { Fork, PageCta } from '../components/NewSections';

export default function ServicesPage() {
  return (
    <div className="pt-16">
      <Offers />
      <Competitors />
      <Fork />
      <PageCta />
    </div>
  );
}
