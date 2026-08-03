import Idea from '../components/Idea';
import System from '../components/System';
import Product from '../components/Product';
import {
  StatusQuo,
  Glossary,
  HowItWorks,
  GoldStandards,
  PlaybookNet,
  PageCta,
} from '../components/NewSections';

export default function SystemPage() {
  return (
    <div className="pt-16">
      <StatusQuo />
      <Idea />
      <Glossary />
      <System />
      <HowItWorks />
      <GoldStandards />
      <Product />
      <PlaybookNet />
      <PageCta />
    </div>
  );
}
