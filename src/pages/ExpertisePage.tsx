import MiniBot from '../components/MiniBot';
import Expertise from '../components/Expertise';
import { PageCta } from '../components/NewSections';

export default function ExpertisePage() {
  return (
    <div className="pt-16">
      <Expertise />
      <PageCta label="Не знаєте, з чого почати? Почнімо з діагностики" />
      <MiniBot idleText="Наведи на напрям — поясню, як ми з ним працюємо →" />
    </div>
  );
}
