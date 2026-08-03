import MiniBot from '../components/MiniBot';
import Product from '../components/Product';
import { GoldStandards, PlaybookNet, PageCta } from '../components/NewSections';

export default function ProductPage() {
  return (
    <div className="pt-16">
      <GoldStandards />
      <Product />
      <PlaybookNet />
      <PageCta />
      <MiniBot idleText="Наведи на плитку PB-01…56 — розкажу, що всередині плейбука →" />
    </div>
  );
}
