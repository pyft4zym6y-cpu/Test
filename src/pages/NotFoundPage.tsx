import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import { Eyebrow, Section } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="pt-16">
      <Section className="grid-bg min-h-[70vh] flex items-center">
        <FadeIn>
          <Eyebrow>Помилка 404</Eyebrow>
          <p className="font-pixel text-[#4D7C0F]" style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}>
            404
          </p>
          <h1 className="font-extrabold text-2xl md:text-4xl mt-6 tracking-tight">
            Такої сторінки немає — але система на місці
          </h1>
          <p className="text-[#5A6472] mt-4 max-w-xl leading-relaxed">
            Посилання застаріло або в адресі помилка. Почни з головної чи подивись кейси — там
            найцікавіше.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/"
              className="bg-[#A3E635] px-7 py-3.5 text-sm font-bold tracking-wider uppercase text-black hover:brightness-95 transition-[filter]"
            >
              На головну
            </Link>
            <Link
              to="/cases"
              className="border border-black/30 px-7 py-3.5 text-sm tracking-wider uppercase hover:bg-black/5 transition-colors"
            >
              Дивитись кейси →
            </Link>
          </div>
        </FadeIn>
      </Section>
    </div>
  );
}
