import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import { track } from '../components/analytics';

/*
 * Смета проекта — тёмная секция-калькулятор по шаблону:
 * слева форма (тип услуги, страницы, допы, срок), справа сравнение
 * «агентство / фрилансер / weexp». Логика цен — из шаблона.
 */

type Service = 'design' | 'development' | 'both';
type Timeline = 'regular' | 'fast' | 'rush';

const ACCENT = '#FF5656';

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className="w-5 h-5 rounded-full border-2 inline-flex items-center justify-center shrink-0 transition-colors"
      style={{ borderColor: on ? ACCENT : 'rgba(255,255,255,0.25)' }}
    >
      {on && <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />}
    </span>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      className="w-5 h-5 border-2 rounded inline-flex items-center justify-center shrink-0 transition-colors"
      style={{ borderColor: on ? ACCENT : 'rgba(255,255,255,0.25)', background: on ? ACCENT : 'transparent' }}
    >
      {on && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6.5L4.5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export default function EstimatePage() {
  const [serviceType, setServiceType] = useState<Service>('both');
  const [pages, setPages] = useState(5);
  const [needContent, setNeedContent] = useState(false);
  const [needSEO, setNeedSEO] = useState(false);
  const [timeline, setTimeline] = useState<Timeline>('regular');

  const price = useMemo(() => {
    const base = serviceType === 'design' ? 399 : serviceType === 'development' ? 199 : 499;
    const perPage = serviceType === 'both' ? 200 : 100;
    let total = Math.max(base, base + (pages - 1) * perPage);
    if (needContent) total += pages * 50;
    if (needSEO) total += pages * 50;
    if (timeline === 'rush') total += pages * 100;
    if (timeline === 'fast') total += pages * 25;
    return total;
  }, [serviceType, pages, needContent, needSEO, timeline]);

  const agency = 8000 + (pages - 1) * (serviceType === 'both' ? 1000 : 400);
  const freelancer = 3000 + (pages - 1) * (serviceType === 'both' ? 500 : 200);

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const services: { id: Service; label: string }[] = [
    { id: 'design', label: 'Тільки дизайн' },
    { id: 'development', label: 'Тільки розробка' },
    { id: 'both', label: 'Дизайн + розробка' },
  ];
  const timelines: { id: Timeline; label: string; price: string }[] = [
    { id: 'rush', label: 'До 7 днів', price: '+$100/стор' },
    { id: 'fast', label: 'До 14 днів', price: '+$25/стор' },
    { id: 'regular', label: 'Звичайний темп (обговоримо)', price: '' },
  ];

  return (
    <div className="pt-16" style={{ background: '#0A0A0A' }}>
      <section id="calculator-section" className="py-16 md:py-28 px-4 md:px-16">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="font-mono uppercase tracking-widest text-xs text-white/50 mb-4">
                Спробуй калькулятор оцінки проєкту
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-white">
                Преміум-сайт у межах вашого бюджету
              </h1>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-white/10">
              {/* LEFT: форма */}
              <div className="p-8 lg:p-12 divide-y divide-[#1E1E1E]" style={{ background: '#0D0D0D' }}>
                <div className="pb-7">
                  <h3 className="text-white font-semibold mb-4">Яка послуга потрібна?</h3>
                  <div className="flex flex-col gap-3">
                    {services.map((s) => (
                      <button key={s.id} type="button" onClick={() => setServiceType(s.id)}
                        className="flex items-center gap-3 text-left text-white/85 hover:text-white transition-colors">
                        <Radio on={serviceType === s.id} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="py-7">
                  <h3 className="text-white font-semibold mb-4">
                    Кількість сторінок: <span style={{ color: ACCENT }}>{pages}</span>
                  </h3>
                  <input
                    type="range" min={1} max={30} step={1} value={pages}
                    onChange={(e) => setPages(Number(e.target.value))}
                    className="w-full accent-[#FF5656]"
                    aria-label="Кількість сторінок"
                  />
                  <div className="flex justify-between font-mono text-xs text-white/40 mt-1">
                    <span>1</span>
                    <span>30</span>
                  </div>
                </div>

                <div className="py-7">
                  <h3 className="text-white font-semibold mb-4">Додатково</h3>
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={() => setNeedContent(!needContent)}
                      className="flex items-center justify-between gap-3 text-left text-white/85 hover:text-white transition-colors">
                      <span className="flex items-center gap-3"><Check on={needContent} /> Потрібна допомога з контентом</span>
                      <span className="font-mono text-sm" style={{ color: ACCENT }}>+$50/стор</span>
                    </button>
                    <button type="button" onClick={() => setNeedSEO(!needSEO)}
                      className="flex items-center justify-between gap-3 text-left text-white/85 hover:text-white transition-colors">
                      <span className="flex items-center gap-3"><Check on={needSEO} /> SEO-оптимізація сайту</span>
                      <span className="font-mono text-sm" style={{ color: ACCENT }}>+$50/стор</span>
                    </button>
                  </div>
                </div>

                <div className="pt-7">
                  <h3 className="text-white font-semibold mb-4">Наскільки швидко потрібно?</h3>
                  <div className="flex flex-col gap-3">
                    {timelines.map((t) => (
                      <button key={t.id} type="button" onClick={() => setTimeline(t.id)}
                        className="flex items-center justify-between gap-3 text-left text-white/85 hover:text-white transition-colors">
                        <span className="flex items-center gap-3"><Radio on={timeline === t.id} /> {t.label}</span>
                        {t.price && <span className="font-mono text-sm" style={{ color: ACCENT }}>{t.price}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: оценка */}
              <div className="p-8 lg:p-12 border border-white/10 lg:rounded-r-2xl flex flex-col gap-5" style={{ minHeight: 718 }}>
                <div>
                  <h3 className="text-white text-xl font-semibold">Орієнтовна вартість</h3>
                  <p className="text-white/50 text-sm mt-1">
                    Порівняйте три шляхи до того самого результату — і скільки коштує кожен.
                  </p>
                </div>

                <div className="rounded-2xl p-6 space-y-3 bg-white/5">
                  <p className="text-white/60 text-sm">Типове агентство візьме мінімум</p>
                  <p className="text-4xl font-bold text-white">{fmt(agency)}</p>
                  <p className="text-white/40 text-sm">+ забагато зайвого часу й додаткових витрат</p>
                </div>

                <div className="rounded-2xl p-6 space-y-3 bg-white/5">
                  <p className="text-white/60 text-sm">Звичайний фрілансер візьме мінімум</p>
                  <p className="text-4xl font-bold text-white">{fmt(freelancer)}</p>
                  <p className="text-white/40 text-sm">+ забагато головного болю і переписок</p>
                </div>

                <div className="rounded-2xl p-6 space-y-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                  <p className="text-white/90 text-sm">З weexp</p>
                  <p className="text-5xl font-bold">{fmt(price)}</p>
                  <p className="text-white/90 text-sm">Збережіть гроші, час і нерви</p>
                </div>

                <Link
                  to="/contact"
                  onClick={() => track('cta_click', { location: 'estimate_calculator', total: price })}
                  className="mt-auto text-center bg-white text-black font-mono text-sm font-bold uppercase tracking-[0.12em] px-7 py-4 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Зафіксувати оцінку → обговорити проєкт
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
