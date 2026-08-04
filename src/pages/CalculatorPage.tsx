import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import { Eyebrow, Section, SectionTitle, CountUp, Bar } from '../components/ui';
import { say } from '../components/speech';
import { track } from '../components/analytics';

/*
 * Калькулятор упущеного обороту — покроковий майстер.
 * Модель чесна: важелі воронки перемножуються (ланцюгова атрибуція),
 * а не складаються; показуємо консервативну нижню межу діапазону.
 * Бенчмарки — з практики weexp (Gold Standards), трафік беремо незмінним.
 */

type Niche = {
  id: string;
  label: string;
  crNorm: number; // верхня межа «норми» CR, %
  crGold: number; // золотий стандарт CR, %
  repeatTarget: number; // цільова частка повторних замовлень, %
  aovHint: string;
};

const NICHES: Niche[] = [
  { id: 'fashion', label: 'Fashion · одяг і взуття', crNorm: 2.2, crGold: 3.2, repeatTarget: 35, aovHint: '1 500–3 500 ₴' },
  { id: 'beauty', label: 'Beauty · косметика', crNorm: 2.8, crGold: 4.0, repeatTarget: 45, aovHint: '900–2 000 ₴' },
  { id: 'home', label: 'Дім · меблі · декор', crNorm: 1.4, crGold: 2.2, repeatTarget: 20, aovHint: '2 500–9 000 ₴' },
  { id: 'electronics', label: 'Електроніка · техніка', crNorm: 1.8, crGold: 2.6, repeatTarget: 25, aovHint: '3 000–15 000 ₴' },
  { id: 'fmcg', label: 'FMCG · товари щодня', crNorm: 3.2, crGold: 5.0, repeatTarget: 55, aovHint: '600–1 500 ₴' },
  { id: 'other', label: 'Інша ніша', crNorm: 2.0, crGold: 3.0, repeatTarget: 30, aovHint: '—' },
];

const STEPS = ['Ніша', 'Оборот', 'Конверсія', 'Повторні'] as const;

const STEP_SAYS = [
  'Обери нішу — підставлю еталони саме твоєї категорії.',
  'Місячний оборот e-commerce. Приблизно — норм, це ж оцінка згори.',
  'Конверсія у покупку: в GA4 це Sessions → Purchases. Не знаєш — постав приблизно.',
  'Частка замовлень від повторних клієнтів. Саме тут ховаються найдешевші гроші.',
];

const fmtUAH = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} млн ₴`;
  return `${Math.round(n / 1000).toLocaleString('uk-UA')} тис ₴`;
};

const inputCls =
  'w-full bg-white border border-black/10 px-4 py-3.5 text-lg font-mono text-[#12161C] placeholder:text-[#8b93a0] focus:outline-none focus:border-[#65A30D] transition-colors';

export default function CalculatorPage() {
  const [step, setStep] = useState(0);
  const [nicheId, setNicheId] = useState<string | null>(null);
  const [revenue, setRevenue] = useState(''); // тис ₴ / міс
  const [cr, setCr] = useState('');
  const [repeat, setRepeat] = useState('');
  const [done, setDone] = useState(false);

  const niche = NICHES.find((n) => n.id === nicheId) ?? NICHES[NICHES.length - 1];

  const calc = useMemo(() => {
    const M = (parseFloat(revenue.replace(',', '.')) || 0) * 1000; // ₴/міс
    const crC = Math.min(Math.max(parseFloat(cr.replace(',', '.')) || 0, 0.1), 15);
    const rC = Math.min(Math.max(parseFloat(repeat.replace(',', '.')) || 0, 0), 80) / 100;
    const R = M * 12;

    const inNorm = crC >= niche.crNorm;
    const crT = inNorm ? niche.crGold : niche.crNorm;
    const crFactor = Math.min(Math.max(crT / crC, 1), 3); // кап ×3 — без фантастики

    const rT = Math.max(rC, niche.repeatTarget / 100);
    const repFactor = Math.min(Math.max((1 - rC) / (1 - rT), 1), 1.6);

    const upliftFull = crFactor * repFactor - 1;
    const potentialFull = R * upliftFull;
    const potentialCons = potentialFull * 0.55; // нижня половина діапазону

    // ланцюгова атрибуція: внески перемножених важелів, сума = потенціал
    const crShare = R * (crFactor - 1);
    const repShare = R * crFactor * (repFactor - 1);

    return {
      valid: M > 0 && crC > 0,
      R,
      inNorm,
      crC,
      crT,
      rC: rC * 100,
      rT: rT * 100,
      potentialFull,
      potentialCons,
      monthlyCons: potentialCons / 12,
      crShare,
      repShare,
      upliftPct: Math.round(upliftFull * 100),
    };
  }, [revenue, cr, repeat, niche]);

  const next = () => {
    if (step < 3) {
      setStep(step + 1);
      say(STEP_SAYS[step + 1]);
      track('calc_step', { step: step + 1 });
    } else {
      setDone(true);
      track('calc_result', { niche: niche.id, uplift_pct: calc.upliftPct });
      say(
        `Порахував: консервативно ≈ ${fmtUAH(calc.potentialCons)} на рік лишається на столі. Хочеш точний розрахунок по твоїх даних — тисни «Забронювати сесію».`,
      );
    }
  };

  const canNext =
    (step === 0 && !!nicheId) ||
    (step === 1 && parseFloat(revenue) > 0) ||
    (step === 2 && parseFloat(cr) > 0) ||
    step === 3;

  const reset = () => {
    setDone(false);
    setStep(0);
    setNicheId(null);
    setRevenue('');
    setCr('');
    setRepeat('');
  };

  return (
    <div className="pt-16">
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Калькулятор · Недоотриманий оборот · Безкоштовно</Eyebrow>
          <SectionTitle as="h1">
            Скільки грошей ваш магазин
            <br />
            <span className="lime-text">лишає на столі</span> щороку?
          </SectionTitle>
          <p className="text-[#5A6472] mt-5 max-w-2xl leading-relaxed">
            Чотири питання — і ви бачите розрив між своєю воронкою та еталонами вашої ніші,
            переведений у гривні. Рахуємо чесно: важелі перемножуються, а не складаються,
            показуємо консервативну нижню межу.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="card p-7 md:p-10 mt-10 max-w-3xl" style={{ borderColor: 'rgba(101,163,13,0.35)' }}>
            {!done ? (
              <>
                {/* Прогрес */}
                <div className="flex items-center gap-2 mb-8 flex-wrap">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <span
                        className={`font-pixel text-[0.5rem] px-2.5 py-1.5 border ${
                          i === step
                            ? 'bg-[#A3E635] border-[#A3E635] text-black'
                            : i < step
                              ? 'border-[#65A30D]/50 text-[#4D7C0F]'
                              : 'border-black/15 text-black/40'
                        }`}
                      >
                        0{i + 1} {s}
                      </span>
                      {i < STEPS.length - 1 && <span className="text-black/20">—</span>}
                    </div>
                  ))}
                </div>

                {step === 0 && (
                  <div>
                    <p className="font-bold text-xl mb-5">У якій ніші працює ваш магазин?</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {NICHES.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setNicheId(n.id)}
                          className={`card card-hover text-left px-5 py-4 transition-colors ${
                            nicheId === n.id ? 'border-[#65A30D] bg-[#F4FBE8]' : ''
                          }`}
                        >
                          <span className="font-mono text-sm text-[#12161C]">{n.label}</span>
                          <span className="block font-mono text-[0.62rem] text-[#5A6472] mt-1.5">
                            еталон CR {n.crNorm}% · повторні {n.repeatTarget}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <p className="font-bold text-xl mb-2">Місячний оборот e-commerce, тис ₴</p>
                    <p className="text-[#5A6472] text-sm mb-5">
                      Оборот саме онлайн-каналу. Типовий чек ніші «{niche.label}»: {niche.aovHint}.
                    </p>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      placeholder="Напр. 2 500 (= 2,5 млн ₴/міс)"
                      className={inputCls}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {[500, 1500, 5000, 15000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRevenue(String(v))}
                          className="font-mono text-xs px-3.5 py-2 border border-black/15 hover:border-[#65A30D] transition-colors"
                        >
                          {v >= 1000 ? `${v / 1000} млн` : `${v} тис`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <p className="font-bold text-xl mb-2">Конверсія сайту в покупку, %</p>
                    <p className="text-[#5A6472] text-sm mb-5">
                      У GA4: Sessions → Purchases. Еталон ніші: норма {niche.crNorm}% · золотий
                      стандарт {niche.crGold}%.
                    </p>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0.1"
                      max="15"
                      value={cr}
                      onChange={(e) => setCr(e.target.value)}
                      placeholder="Напр. 1,2"
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <p className="font-bold text-xl mb-2">Частка повторних замовлень, %</p>
                    <p className="text-[#5A6472] text-sm mb-5">
                      Скільки замовлень роблять клієнти, що вже купували. Не знаєте — лишіть
                      порожнім, порахуємо від 10%. Ціль ніші: {niche.repeatTarget}%.
                    </p>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="80"
                      value={repeat}
                      onChange={(e) => setRepeat(e.target.value)}
                      placeholder="Напр. 15 (необов'язково)"
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => step > 0 && setStep(step - 1)}
                    className={`flex items-center gap-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                      step === 0 ? 'text-black/25 cursor-default' : 'text-[#5A6472] hover:text-[#12161C]'
                    }`}
                  >
                    <ArrowLeft size={14} /> Назад
                  </button>
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={next}
                    className={`flex items-center gap-2.5 px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.12em] transition-all ${
                      canNext
                        ? 'bg-[#A3E635] text-black hover:brightness-95'
                        : 'bg-black/10 text-black/35 cursor-not-allowed'
                    }`}
                  >
                    {step === 3 ? 'Порахувати розрив' : 'Далі'} <ArrowRight size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div aria-live="polite">
                <p className="font-pixel text-[0.5rem] text-[#4D7C0F] mb-3">
                  РЕЗУЛЬТАТ · {niche.label.toUpperCase()}
                </p>
                <p className="font-bold text-xl mb-1">Консервативно ви недоотримуєте</p>
                <p className="font-mono font-extrabold text-5xl md:text-6xl text-[#DB2777] mt-2">
                  {calc.potentialCons >= 1_000_000 ? (
                    <>
                      ≈ <CountUp to={Math.round(calc.potentialCons / 100_000) / 10} /> млн ₴
                    </>
                  ) : (
                    <>
                      ≈ <CountUp to={Math.round(calc.potentialCons / 1000)} /> тис ₴
                    </>
                  )}
                  <span className="text-2xl text-[#5A6472]"> / рік</span>
                </p>
                <p className="text-[#5A6472] text-sm mt-3">
                  ≈ {fmtUAH(calc.monthlyCons)} кожного місяця зволікання · повний потенціал при
                  реалізації всіх важелів — до {fmtUAH(calc.potentialFull)}/рік.
                </p>

                <div className="mt-8 flex flex-col gap-5">
                  <div>
                    <div className="flex justify-between font-mono text-[0.68rem] uppercase tracking-wider text-[#5A6472] mb-2">
                      <span>
                        Конверсія: {calc.crC}% → {calc.crT}%{calc.inNorm ? ' (до золотого стандарту)' : ''}
                      </span>
                      <span>{fmtUAH(calc.crShare)}/рік</span>
                    </div>
                    <Bar percent={Math.round((calc.crShare / (calc.crShare + calc.repShare || 1)) * 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[0.68rem] uppercase tracking-wider text-[#5A6472] mb-2">
                      <span>
                        Повторні: {Math.round(calc.rC)}% → {Math.round(calc.rT)}%
                      </span>
                      <span>{fmtUAH(calc.repShare)}/рік</span>
                    </div>
                    <Bar
                      percent={Math.round((calc.repShare / (calc.crShare + calc.repShare || 1)) * 100)}
                      gradient="linear-gradient(90deg, #7C3AED, #DB2777)"
                    />
                  </div>
                </div>

                <p className="text-[#5A6472] text-[0.7rem] leading-relaxed mt-7 border-t border-black/10 pt-5">
                  Це орієнтир на еталонах практики weexp при незмінному трафіку, а не гарантія.
                  Важелі пораховано ланцюгом (перемноження, не додавання), показано нижню половину
                  діапазону. Точний розрахунок — по ваших даних GA4 / CRM / P&L на Diagnostic
                  Sprint.
                </p>

                <div className="flex flex-wrap gap-4 mt-7">
                  <Link
                    to="/contact"
                    onClick={() => track('cta_click', { location: 'calculator_result' })}
                    className="bg-[#A3E635] px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.12em] text-black hover:brightness-95 transition-[filter]"
                  >
                    Забронювати сесію →
                  </Link>
                  <Link
                    to="/cases"
                    className="border border-black/30 px-7 py-3.5 font-mono text-sm uppercase tracking-wider hover:bg-black/5 transition-colors"
                  >
                    Як ми це повертаємо: кейси
                  </Link>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#5A6472] hover:text-[#12161C] transition-colors"
                  >
                    <RotateCcw size={13} /> Перерахувати
                  </button>
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="font-mono text-[0.66rem] text-[#5A6472] mt-6 max-w-3xl">
            Методика: розрив = різниця двох станів воронки проти еталонів Gold Standards (52
            метрики) з категорійними поправками. Та сама модель, якою ми рахуємо аудити клієнтів.
          </p>
        </FadeIn>
      </Section>
    </div>
  );
}
