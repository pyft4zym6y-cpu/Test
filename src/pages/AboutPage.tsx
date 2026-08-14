import About from '../components/About';
import { SchoolIdentity } from '../components/School';
import Trust from '../components/Trust';
import Media from '../components/Media';
import { PageCta } from '../components/NewSections';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AboutPage() {
  return (
    <div className="pt-16">
      <Breadcrumbs items={[{ label: 'Про нас' }]} />
      <About />
      <SchoolIdentity />
      <Trust />
      <Media />
      <PageCta />
    </div>
  );
}
