import Idea from '../components/Idea';
import System from '../components/System';
import Product from '../components/Product';
import DemoOS from '../components/DemoOS';
import Expertise from '../components/Expertise';
import { Beliefs } from '../components/School';
import {
  Proof, StatusQuo, Glossary, HowItWorks, GoldStandards, PlaybookNet,
  PriceOfInaction, PageCta,
} from '../components/NewSections';
import SubNav from '../components/SubNav';
import Breadcrumbs from '../components/Breadcrumbs';

export const OS_SECTIONS = [
  { id: 'why', label: 'Чому зараз' },
  { id: 'system', label: 'Система' },
  { id: 'product', label: 'Продукт' },
  { id: 'expertise', label: 'Експертиза' },
  { id: 'principles', label: 'Принципи' },
];

const anchor = { scrollMarginTop: 126 } as React.CSSProperties;

/*
 * Одна велика сторінка «Commerce OS»: чому старий підхід більше не працює →
 * як влаштована система → що саме ви купуєте → якими напрямами закриваємо →
 * на яких принципах стоїмо. Колишні /approach, /system, /product, /expertise.
 */
export default function CommerceOsPage() {
  return (
    <div className="pt-16">
      <SubNav items={OS_SECTIONS} />
      <Breadcrumbs items={[{ label: 'Commerce OS' }]} />

      <div id="why" style={anchor}>
        <Proof />
        <StatusQuo />
        <Idea />
      </div>

      <div id="system" style={anchor}>
        <System />
        <HowItWorks />
      </div>

      <div id="product" style={anchor}>
        <GoldStandards />
        <Product />
        <DemoOS />
        <PlaybookNet />
      </div>

      <div id="expertise" style={anchor}>
        <Expertise />
      </div>

      <div id="principles" style={anchor}>
        <Glossary />
        <Beliefs />
        <PriceOfInaction />
      </div>

      <PageCta />
    </div>
  );
}
