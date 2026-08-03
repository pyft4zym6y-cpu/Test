import Product from '../components/Product';
import { GoldStandards, PlaybookNet, PageCta } from '../components/NewSections';

export default function ProductPage() {
  return (
    <div className="pt-16">
      <GoldStandards />
      <Product />
      <PlaybookNet />
      <PageCta />
    </div>
  );
}
