import { Burst, ComicButton, H1, Section } from '../components/comic';

export default function NotFound() {
  return (
    <Section className="halftone min-h-[70vh] flex items-center">
      <div className="text-center w-full py-16">
        <div className="flex justify-center mb-8">
          <Burst size={160} rotate={-6} color="var(--color-brand)">
            <span className="text-white text-[1.4rem]">Бам!</span>
          </Burst>
        </div>
        <H1 className="mb-4">
          404. Сторінка <span className="redmark">загубилась</span>
        </H1>
        <p className="font-semibold text-[16px] mb-9">
          Буває навіть у найкращих архітекторів. Повертаймося на головну.
        </p>
        <ComicButton to="/">На головну</ComicButton>
      </div>
    </Section>
  );
}
