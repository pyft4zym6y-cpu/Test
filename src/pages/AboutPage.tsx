import About from '../components/About';
import School from '../components/School';
import Trust from '../components/Trust';
import { PageCta } from '../components/NewSections';

export default function AboutPage() {
  return (
    <div className="pt-16">
      <About />
      <School />
      <Trust />
      <PageCta label="Познайомимось за 30 хвилин" />
    </div>
  );
}
