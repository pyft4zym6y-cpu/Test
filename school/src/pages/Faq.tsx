import { useState } from 'react';
import { FAQ } from '../data/school';
import { ComicButton, PageHead, Pop, Section } from '../components/comic';

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <PageHead
        eyebrow="FAQ"
        title={
          <>
            Питання, які ти <span className="redmark">і так</span> хотів поставити
          </>
        }
      />
      <Section className="!pt-8">
        <div className="flex flex-col gap-5 max-w-3xl">
          {FAQ.map((item, i) => (
            <Pop key={item.q} delay={(i % 4) * 0.05}>
              <div className="comic-border bg-white hard-shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="font-oswald font-bold uppercase text-[17px] leading-snug">
                    {item.q}
                  </span>
                  <span
                    className={`font-oswald font-bold text-2xl text-brand transition-transform ${
                      open === i ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {open === i && (
                  <div className="px-6 pb-6 -mt-1">
                    <p className="text-[14.5px] leading-relaxed text-ink/75 border-t-[3px] border-ink pt-4">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            </Pop>
          ))}
        </div>
        <Pop className="mt-12">
          <p className="font-semibold text-[15px] mb-5">Не знайшов свого питання?</p>
          <ComicButton to="/contacts" variant="ink">
            Запитати напряму
          </ComicButton>
        </Pop>
      </Section>
    </>
  );
}
