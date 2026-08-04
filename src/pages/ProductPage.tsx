import Product from '../components/Product';
import DemoOS from '../components/DemoOS';
import { GoldStandards, PlaybookNet, PageCta } from '../components/NewSections';

export default function ProductPage() {
  return (
    <div className="pt-16">
      <GoldStandards />
      <Product />
      <DemoOS />
      <PlaybookNet />
      <PageCta />
    </div>
  );
}
