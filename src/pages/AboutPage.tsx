import About from '../components/About';
import { SchoolIdentity } from '../components/School';
import Trust from '../components/Trust';
import Media from '../components/Media';
import { PageCta } from '../components/NewSections';

export default function AboutPage() {
  return (
    <div className="pt-16">
      <About />
      <SchoolIdentity />
      <Trust />
      <Media />
      <PageCta />
    </div>
  );
}
