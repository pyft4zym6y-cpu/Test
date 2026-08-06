import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import { Eyebrow, Section, SectionTitle, CountUp, Bar } from '../components/ui';
import { say } from '../components/speech';
import { track } from '../components/analytics';
import Breadcrumbs from '../components/Breadcrumbs';
import { sendLead } from '../components/leads';

/*
 * Калькулятор недоотриманого обороту — покроковий майстер (8 кроків).
 * Гроші рахуються чесно: два важелі воронки (конверсія, повторні)
 * перемножуються ланцюгом, а не складаються; показується консервативна
 * нижня межа. Решта відповідей живлять профіль здоров'я каналів і маржу —
 * без подвійного рахунку тих самих грошей.
 */

type Niche = {
  id: string;
  label: string;
  crNorm: number;
  crGold: number;
  repeatTarget: number;
  aovLow: number;
  aovHigh: number;
};

const NICHES: Niche[] = [
  { id: 'fashion', label: 'Fashion · одяг і взуття', crNorm: 2.2, crGold: 3.2, repeatTarget: 35, aovLow: 1500, aovHigh: 3500 },
  { id: 'beauty', label: 'Beauty · косметика', crNorm: 2.8, crGold: 4.0, repeatTarget: 45, aovLow: 900, aovHigh: 2000 },
  { id: 'home', label: 'Дім · меблі · декор', crNorm: 1.4, crGold: 2.2, repeatTarget: 20, aovLow: 2500, aovHigh: 9000 },
  { id: 'electronics', label: 'Електроніка · техніка', crNorm: 1.8, crGold: 2.6, repeatTarget: 25, aovLow: 3000, aovHigh: 15000 },
  { id: 'fmcg', label: 'FMCG · товари щодня', crNorm: 3.2, crGold: 5.0, repeatTarget: 55, aovLow: 600, aovHigh: 1500 },
  { id: 'kids', label: 'Дитячі товари', crNorm: 2.4, crGold: 3.4, repeatTarget: 40, aovLow: 800, aovHigh: 2500 },
  { id: 'pets', label: 'Зоотовари', crNorm: 2.6, crGold: 3.8, repeatTarget: 50, aovLow: 600, aovHigh: 1500 },
  { id: 'sport', label: 'Спорт · outdoor', crNorm: 1.8, crGold: 2.6, repeatTarget: 28, aovLow: 1500, aovHigh: 4500 },
  { id: 'jewelry', label: 'Ювелірка · аксесуари', crNorm: 1.2, crGold: 2.0, repeatTarget: 22, aovLow: 2000, aovHigh: 8000 },
  { id: 'auto', label: 'Автотовари', crNorm: 1.6, crGold: 2.4, repeatTarget: 30, aovLow: 1000, aovHigh: 4000 },
  { id: 'health', label: 'Здоровʼя · аптека', crNorm: 3.0, crGold: 4.5, repeatTarget: 50, aovLow: 500, aovHigh: 1200 },
  { id: 'other', label: 'Інша ніша', crNorm: 2.0, crGold: 3.0, repeatTarget: 30, aovLow: 800, aovHigh: 4000 },
];

const ORGANIC_TARGET = 35; // % трафіку
const EMAIL_TARGET = 20; // % виручки

const STEPS = ['Ніша', 'Оборот', 'Чек', 'Конверсія', 'Повторні', 'Трафік', 'CRM', 'Маржа'] as const;

const STEP_SAYS = [
  'Обери нішу — підставлю еталони саме твоєї категорії.',
  'Місячний оборот e-commerce. Приблизно — норм, це ж оцінка згори.',
  'Середній чек. Порахую кількість замовлень і звірю з діапазоном ніші.',
  'Конверсія у покупку: в GA4 це Sessions → Purchases. Не знаєш — постав приблизно.',
  'Частка замовлень від повторних клієнтів. Тут ховаються найдешевші гроші.',
  'Частка органіки в трафіку. Що вона нижча — то дорожчий кожен новий клієнт.',
  'Скільки % виручки дає email/CRM? Менше 10% — база просто лежить мертвим вантажем.',
  'Маржинальність після собівартості й логістики — переведу втрати в прибуток.',
];

const fmtUAH = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} млн ₴`;
  return `${Math.round(n / 1000).toLocaleString('uk-UA')} тис ₴`;
};

const num = (s: string) => parseFloat(s.replace(',', '.')) || 0;

const inputCls =
  'w-full bg-white border border-black/10 px-4 py-3.5 text-lg font-mono text-[#12161C] placeholder:text-[#8b93a0] focus:outline-none focus:border-[#65A30D] transition-colors';

type Zone = { label: string; value: string; tone: 'red' | 'yellow' | 'green' | 'na'; hint: string };

const TONE: Record<Zone['tone'], { bg: string; fg: string; mark: string }> = {
  red: { bg: 'rgba(220,38,38,0.08)', fg: '#DC2626', mark: '🔴' },
  yellow: { bg: 'rgba(180,83,9,0.08)', fg: '#B45309', mark: '🟡' },
  green: { bg: 'rgba(77,124,15,0.1)', fg: '#4D7C0F', mark: '🟢' },
  na: { bg: 'rgba(90,100,114,0.08)', fg: '#5A6472', mark: '·' },
};

export default function CalculatorPage() {
  const [step, setStep] = useState(0);
  const [nicheId, setNicheId] = useState<string | null>(null);
  const [revenue, setRevenue] = useState(''); // тис ₴/міс
  const [aov, setAov] = useState(''); // ₴
  const [cr, setCr] = useState('');
  const [repeat, setRepeat] = useState('');
  const [organic, setOrganic] = useState('');
  const [email, setEmail] = useState('');
  const [margin, setMargin] = useState('');
  const [done, setDone] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSent, setLeadSent] = useState(false);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadErr, setLeadErr] = useState(false);

  const niche = NICHES.find((n) => n.id === nicheId) ?? NICHES[NICHES.length - 1];

  const calc = useMemo(() => {
    const M = num(revenue) * 1000;
    const crC = Math.min(Math.max(num(cr), 0.1), 15);
    const rC = Math.min(Math.max(num(repeat) || 10, 0), 80) / 100;
    const aovC = num(aov);
    const orgC = organic === '' ? null : Math.min(Math.max(num(organic), 0), 100);
    const emC = email === '' ? null : Math.min(Math.max(num(email), 0), 100);
    const mgC = margin === '' ? null : Math.min(Math.max(num(margin), 5), 90);
    const R = M * 12;

    const inNorm = crC >= niche.crNorm;
    const crT = inNorm ? niche.crGold : niche.crNorm;
    const crFactor = Math.min(Math.max(crT / crC, 1), 3);

    const rT = Math.max(rC, niche.repeatTarget / 100);
    const repFactor = Math.min(Math.max((1 - rC) / (1 - rT), 1), 1.6);

    const upliftFull = crFactor * repFactor - 1;
    const potentialFull = R * upliftFull;
    const potentialCons = potentialFull * 0.55;
    const crShare = R * (crFactor - 1);
    const repShare = R * crFactor * (repFactor - 1);

    const orders = aovC > 0 ? Math.round(M / aovC) : null;
    const marginLoss = mgC !== null ? potentialCons * (mgC / 100) : null;

    const zones: Zone[] = [
      {
        label: 'Конверсія',
        value: `${crC}%`,
        tone: crC >= niche.crGold ? 'green' : crC >= niche.crNorm ? 'yellow' : 'red',
        hint: `норма ${niche.crNorm}% · золотий стандарт ${niche.crGold}%`,
      },
      {
        label: 'Повторні',
        value: `${Math.round(rC * 100)}%`,
        tone: rC * 100 >= niche.repeatTarget ? 'green' : rC * 100 >= niche.repeatTarget * 0.6 ? 'yellow' : 'red',
        hint: `ціль ніші ${niche.repeatTarget}%`,
      },
      {
        label: 'Органіка',
        value: orgC === null ? '—' : `${orgC}%`,
        tone: orgC === null ? 'na' : orgC >= ORGANIC_TARGET ? 'green' : orgC >= 20 ? 'yellow' : 'red',
        hint: orgC === null ? 'не вказано' : `ціль ≥${ORGANIC_TARGET}% — інакше ріст купується`,
      },
      {
        label: 'Email / CRM',
        value: emC === null ? '—' : `${emC}%`,
        tone: emC === null ? 'na' : emC >= EMAIL_TARGET ? 'green' : emC >= 10 ? 'yellow' : 'red',
        hint: emC === null ? 'не вказано' : `ціль ≥${EMAIL_TARGET}% виручки`,
      },
      {
        label: 'Середній чек',
        value: aovC > 0 ? `${aovC.toLocaleString('uk-UA')} ₴` : '—',
        tone: aovC <= 0 ? 'na' : aovC < niche.aovLow ? 'yellow' : 'green',
        hint:
          aovC <= 0
            ? 'не вказано'
            : `типовий діапазон ніші ${niche.aovLow.toLocaleString('uk-UA')}–${niche.aovHigh.toLocaleString('uk-UA')} ₴`,
      },
    ];
    const redCount = zones.filter((z) => z.tone === 'red').length;

    return {
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
      orders,
      marginLoss,
      zones,
      redCount,
    };
  }, [revenue, aov, cr, repeat, organic, email, margin, niche]);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      say(STEP_SAYS[step + 1]);
      track('calc_step', { step: step + 1 });
    } else {
      setDone(true);
      track('calc_result', { niche: niche.id, uplift_pct: calc.upliftPct, red_zones: calc.redCount });
      say(
        `Порахував: консервативно ≈ ${fmtUAH(calc.potentialCons)} на рік лишається на столі${
          calc.redCount ? `, і ${calc.redCount} ${calc.redCount === 1 ? 'зона' : 'зони'} у червоному` : ''
        }. Точний розрахунок по твоїх даних — тисни «Забронювати сесію».`,
      );
    }
  };

  const canNext =
    (step === 0 && !!nicheId) ||
    (step === 1 && num(revenue) > 0) ||
    (step === 3 && num(cr) > 0) ||
    step === 2 ||
    step >= 4;

  const reset = () => {
    setDone(false);
    setStep(0);
    setNicheId(null);
    setRevenue('');
    setAov('');
    setCr('');
    setRepeat('');
    setOrganic('');
    setEmail('');
    setMargin('');
  };

  const stepInput = (
    title: string,
    hint: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    opts: { max?: number; optional?: boolean } = {},
  ) => (
    <div>
      <p className="font-bold text-xl mb-2">
        {title}
        {opts.optional && (
          <span className="font-normal text-sm text-[#5A6472] ml-2">(необов&rsquo;язково)</span>
        )}
      </p>
      <p className="text-[#5A6472] text-sm mb-5">{hint}</p>
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        max={opts.max}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
        autoFocus
      />
    </div>
  );

  return (
    <div className="pt-16">
      <Breadcrumbs items={[{ label: 'Калькулятор розриву' }]} />
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Калькулятор · Недоотриманий оборот · Безкоштовно</Eyebrow>
          <SectionTitle as="h1">
            Скільки грошей ваш магазин
            <br />
            <span className="lime-text">лишає на столі</span> щороку?
          </SectionTitle>
          <p className="text-[#5A6472] mt-5 max-w-2xl leading-relaxed">
            Вісім питань — і ви бачите розрив між своєю воронкою та еталонами ніші в гривнях, плюс
            профіль здоров&rsquo;я каналів. Рахуємо чесно: важелі перемножуються, а не складаються,
            показуємо консервативну нижню межу.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="card p-7 md:p-10 mt-10 max-w-3xl" style={{ borderColor: 'rgba(101,163,13,0.35)' }}>
            {!done ? (
              <>
                <div className="flex items-center gap-1.5 mb-8 flex-wrap">
                  {STEPS.map((s, i) => (
                    <span
                      key={s}
                      className={`font-pixel text-[0.46rem] px-2 py-1.5 border ${
                        i === step
                          ? 'bg-[#A3E635] border-[#A3E635] text-black'
                          : i < step
                            ? 'border-[#65A30D]/50 text-[#4D7C0F]'
                            : 'border-black/15 text-black/40'
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {step === 0 && (
                  <div>
                    <p className="font-bold text-xl mb-5">У якій ніші працює ваш магазин?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {NICHES.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setNicheId(n.id)}
                          className={`card card-hover text-left px-3.5 py-3 transition-colors ${
                            nicheId === n.id ? 'border-[#65A30D] bg-[#F4FBE8]' : ''
                          }`}
                        >
                          <span className="block font-semibold text-[0.82rem] leading-snug text-[#12161C]">
                            {n.label}
                          </span>
                          <span className="block font-mono text-[0.58rem] text-[#5A6472] mt-1">
                            CR {n.crNorm}% · повторні {n.repeatTarget}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 &&
                  stepInput(
                    'Місячний оборот e-commerce, тис ₴',
                    'Оборот саме онлайн-каналу, у тисячах гривень.',
                    revenue,
                    setRevenue,
                    'Напр. 2 500 (= 2,5 млн ₴/міс)',
                  )}

                {step === 2 &&
                  stepInput(
                    'Середній чек, ₴',
                    `Типовий діапазон ніші «${niche.label}»: ${niche.aovLow.toLocaleString('uk-UA')}–${niche.aovHigh.toLocaleString('uk-UA')} ₴.`,
                    aov,
                    setAov,
                    `Напр. ${Math.round((niche.aovLow + niche.aovHigh) / 2).toLocaleString('uk-UA')}`,
                    { optional: true },
                  )}

                {step === 3 &&
                  stepInput(
                    'Конверсія сайту в покупку, %',
                    `У GA4: Sessions → Purchases. Еталон ніші: норма ${niche.crNorm}% · золотий стандарт ${niche.crGold}%.`,
                    cr,
                    setCr,
                    'Напр. 1,2',
                    { max: 15 },
                  )}

                {step === 4 &&
                  stepInput(
                    'Частка повторних замовлень, %',
                    `Скільки замовлень роблять клієнти, що вже купували. Не знаєте — лишіть порожнім (візьмемо 10%). Ціль ніші: ${niche.repeatTarget}%.`,
                    repeat,
                    setRepeat,
                    'Напр. 15',
                    { max: 80, optional: true },
                  )}

                {step === 5 &&
                  stepInput(
                    'Частка органічного трафіку, %',
                    `SEO + прямі заходи + брендовий пошук. Ціль ≥${ORGANIC_TARGET}%: що менша органіка, то дорожчий кожен новий клієнт.`,
                    organic,
                    setOrganic,
                    'Напр. 25',
                    { max: 100, optional: true },
                  )}

                {step === 6 &&
                  stepInput(
                    'Частка виручки з email / CRM, %',
                    `Скільки % виручки приносять розсилки й автоланцюжки. Ціль ≥${EMAIL_TARGET}%. Менше 10% — база клієнтів лежить без діла.`,
                    email,
                    setEmail,
                    'Напр. 8',
                    { max: 100, optional: true },
                  )}

                {step === 7 &&
                  stepInput(
                    'Маржинальність, %',
                    'Після собівартості, логістики й повернень. Переведемо недоотриманий оборот у недоотриманий прибуток.',
                    margin,
                    setMargin,
                    'Напр. 45',
                    { max: 90, optional: true },
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
                    {step === STEPS.length - 1 ? 'Порахувати розрив' : 'Далі'} <ArrowRight size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div aria-live="polite">
                <p className="font-pixel text-[0.5rem] text-[#4D7C0F] mb-3">
                  РЕЗУЛЬТАТ · {niche.label.toUpperCase()}
                  {calc.orders ? ` · ≈${calc.orders.toLocaleString('uk-UA')} ЗАМОВЛЕНЬ/МІС` : ''}
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
                  ≈ {fmtUAH(calc.monthlyCons)} кожного місяця зволікання
                  {calc.marginLoss !== null && (
                    <>
                      {' '}
                      · з них <strong className="text-[#12161C]">
                        ≈ {fmtUAH(calc.marginLoss)} — втрачений прибуток
                      </strong>
                    </>
                  )}{' '}
                  · повний потенціал — до {fmtUAH(calc.potentialFull)}/рік.
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

                {/* Профіль здоров'я */}
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#5A6472] mt-8 mb-3">
                  Профіль здоров&rsquo;я · проти еталонів ніші
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {calc.zones.map((z) => (
                    <div
                      key={z.label}
                      className="flex items-baseline justify-between gap-3 px-4 py-3 border border-black/[0.07]"
                      style={{ background: TONE[z.tone].bg }}
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[0.7rem] uppercase tracking-wider text-[#12161C]">
                          {TONE[z.tone].mark} {z.label}
                        </span>
                        <span className="block font-mono text-[0.62rem] text-[#5A6472] mt-0.5">{z.hint}</span>
                      </div>
                      <span className="font-mono font-bold text-sm shrink-0" style={{ color: TONE[z.tone].fg }}>
                        {z.value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[#5A6472] text-[0.68rem] leading-relaxed mt-3">
                  Органіка й email не додані в суму розриву — це чесність проти подвійного рахунку:
                  вони впливають на вартість росту, а не на окремий оборот.
                </p>

                <p className="text-[#5A6472] text-[0.7rem] leading-relaxed mt-6 border-t border-black/10 pt-5">
                  Це орієнтир на еталонах практики weexp при незмінному трафіку, а не гарантія.
                  Важелі пораховано ланцюгом (перемноження, не додавання), показано нижню половину
                  діапазону. Точний розрахунок — по ваших даних GA4 / CRM / P&L на Diagnostic
                  Sprint.
                </p>

                {/* ---- Лід-захват: розрахунок на email ---- */}
                <div className="card p-5 mt-7" style={{ borderColor: 'rgba(101,163,13,0.4)', background: '#F8FCEF' }}>
                  {leadSent ? (
                    <p className="text-sm text-[#3F6212] leading-relaxed">
                      <b>Готово, заявку отримано!</b> Подивимося на ваші цифри й звʼяжемося
                      упродовж робочого дня — розберемо, які важелі закривати першими.
                    </p>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (leadBusy) return;
                        setLeadBusy(true);
                        const ok = await sendLead({
                          source: 'calculator',
                          email: leadEmail,
                          phone: leadPhone,
                          calc: [
                            `Ніша: ${niche.label}`,
                            `Оборот: ${revenue} тис ₴/міс · чек ${aov} ₴`,
                            `CR: ${cr}% (норма ${niche.crNorm}%) · повторні ${repeat || '~10'}%`,
                            `Розрив (консервативно): ${fmtUAH(calc.potentialCons)}/рік · ${fmtUAH(calc.monthlyCons)}/міс`,
                          ].join('\n'),
                        });
                        setLeadBusy(false);
                        if (ok) {
                          setLeadSent(true);
                          track('lead_submit', { method: 'api', source: 'calculator' });
                        } else {
                          setLeadErr(true);
                        }
                      }}
                    >
                      <p className="font-bold text-[0.95rem]">Хочете розбір цих цифр?</p>
                      <p className="text-[#5A6472] text-xs mt-1 leading-relaxed">
                        Залиште контакти — подивимося на ваш розрахунок і звʼяжемося упродовж
                        робочого дня: які важелі закривати першими саме у вашій ситуації. Без
                        розсилок і спаму.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5 mt-3.5">
                        <input
                          type="email"
                          required
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="Email *"
                          className={inputCls + ' sm:flex-1 !text-sm !py-3'}
                        />
                        <input
                          type="tel"
                          pattern="[+()0-9\-\s]{10,18}"
                          inputMode="tel"
                          title="Телефон у форматі +38 0XX XXX XX XX"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="Телефон (щоб швидше)"
                          className={inputCls + ' sm:flex-1 !text-sm !py-3'}
                        />
                        <button
                          type="submit"
                          disabled={leadBusy}
                          className="bg-[#A3E635] px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-black hover:brightness-95 transition-[filter] disabled:opacity-60"
                        >
                          {leadBusy ? 'Надсилаємо…' : 'Отримати розбір →'}
                        </button>
                      </div>
                      {leadErr && (
                        <p className="text-[#B45309] text-xs mt-2.5 leading-relaxed">
                          Не вдалося надіслати. Напишіть нам напряму:{' '}
                          <a href="mailto:pashasidorenko18@gmail.com" className="underline">
                            pashasidorenko18@gmail.com
                          </a>
                        </p>
                      )}
                    </form>
                  )}
                </div>

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
