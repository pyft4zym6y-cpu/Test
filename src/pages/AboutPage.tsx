import About from '../components/About';
import { SchoolIdentity } from '../components/School';
import Trust from '../components/Trust';
import { PageCta } from '../components/NewSections';

export default function AboutPage() {
  return (
    <div className="pt-16">
      <About />
      <SchoolIdentity />
      <Trust />
      <PageCta label="Познайомимось за 30 хвилин" />
    </div>
  );
}
