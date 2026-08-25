import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Download, CheckCircle2 } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import { Eyebrow } from '../components/ui';
import { track } from '../components/analytics';
import Breadcrumbs from '../components/Breadcrumbs';
import { sendLead } from '../components/leads';
import { NICHES, fmtUAH, num, compute as computeAudit, type Tone } from '../lib/audit';
import { markLead } from '../lib/account';

/*
 * КАЛЬКУЛЯТОР АУДИТУ — єдиний step-by-step інструмент у одному вікні (3 кроки):
 *   Крок 1 · Ключові цифри → одразу показуємо недоотриманий оборот (гачок).
 *   Крок 2 · Уточнення → розширюємо рамку вводних, уточнюємо підсумок кроку 1.
 *   Крок 3 · Передфінал → скрупульозні питання під співпрацю.
 * Фінал → завантажити PDF-аудит (оглядовий) + залишити заявку (лист власнику).
 *
 * Гроші рахуються ЧЕСНО: два важелі воронки (конверсія, повторні) перемножуються
 * ланцюгом, показується консервативна нижня межа (×0.55). Уточнення НЕ роздувають
 * суму — вони підвищують достовірність і збагачують профіль каналів.
 */

const inputCls =
  'w-full bg-white border border-black/10 px-4 py-3 text-lg font-mono text-[#12161C] placeholder:text-[#8b93a0] focus:outline-none focus:border-[#65A30D] transition-colors';

const TONE: Record<Tone, { bg: string; fg: string; mark: string }> = {
  red: { bg: 'rgba(220,38,38,0.08)', fg: '#DC2626', mark: '🔴' },
  yellow: { bg: 'rgba(180,83,9,0.08)', fg: '#B45309', mark: '🟡' },
  green: { bg: 'rgba(77,124,15,0.1)', fg: '#4D7C0F', mark: '🟢' },
  na: { bg: 'rgba(90,100,114,0.08)', fg: '#5A6472', mark: '·' },
};

/* ── стан ── */
type State = {
  // крок 1
  nicheId: string | null; revenue: string; aov: string; cr: string; repeat: string;
  // крок 2
  organic: string; email: string; margin: string; trafficSrc: string; marketplaceDep: string; mobileShare: string;
  // крок 3
  goal: string; pain: string; whoRuns: string; stack: string[]; budget: string; timeline: string;
};
const EMPTY: State = {
  nicheId: null, revenue: '', aov: '', cr: '', repeat: '',
  organic: '', email: '', margin: '', trafficSrc: '', marketplaceDep: '', mobileShare: '',
  goal: '', pain: '', whoRuns: '', stack: [], budget: '', timeline: '',
};

const STEPS = ['Ключові цифри', 'Уточнення', 'Передфінал'] as const;


const CHIPS = (opts: string[], val: string, set: (v: string) => void) => (
  <div className="flex flex-wrap gap-2">
    {opts.map((o) => (
      <button key={o} type="button" onClick={() => set(val === o ? '' : o)}
        className="px-3.5 py-2 text-sm border transition-colors"
        style={val === o ? { borderColor: '#65A30D', background: 'rgba(101,163,13,0.1)', color: '#3f6212', fontWeight: 600 } : { borderColor: 'rgba(10,14,18,0.14)', color: '#5A6472' }}>
        {o}
      </button>
    ))}
  </div>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <div className="text-[13px] font-semibold text-[#12161C] mb-1.5">{label}</div>
    {children}
    {hint && <div className="text-xs text-[#8b93a0] mt-1.5">{hint}</div>}
  </label>
);

export default function CalculatorPage() {
  const [s, setS] = useState<State>(EMPTY);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false); // показали гроші після кроку 1
  const [done, setDone] = useState(false);
  const [lead, setLead] = useState({ name: '', site: '', email: '', phone: '', hp: '' });
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadErr, setLeadErr] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const upd = (patch: Partial<State>) => setS((p) => ({ ...p, ...patch }));
  const calc = useMemo(() => {
    const extraFilled2 = [s.organic, s.email, s.margin, s.trafficSrc, s.marketplaceDep, s.mobileShare].filter(Boolean).length;
    const extraFilled3 = [s.goal, s.pain, s.whoRuns, s.budget, s.timeline].filter(Boolean).length + (s.stack.length ? 1 : 0);
    return computeAudit({ ...s, extraFilled2, extraFilled3 });
  }, [s]);

  const step1ok = s.nicheId && num(s.revenue) > 0 && num(s.cr) > 0;
  const canNext = step === 0 ? step1ok : true;

  const next = () => {
    if (step === 0 && step1ok && !revealed) { setRevealed(true); track('calc_step1_revealed', { niche: s.nicheId }); }
    if (step < STEPS.length - 1) { setStep(step + 1); track('calc_step', { step: step + 1 }); }
    else { finish(); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => { if (step > 0) setStep(step - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setS(EMPTY); setStep(0); setRevealed(false); setDone(false); setLeadSent(false); };

  function finish() {
    setDone(true);
    track('calc_finish', { potential: Math.round(calc.potentialCons), confidence: calc.confidence });
    try { localStorage.setItem('weexp-audit-v1', JSON.stringify({ state: s, result: { potentialCons: calc.potentialCons, confidence: calc.confidence }, at: new Date().toISOString() })); } catch { /* noop */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function downloadPdf() {
    track('calc_pdf', {});
    document.body.classList.add('printing-audit');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-audit'), 500);
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (lead.hp) return; // honeypot
    if (!lead.email && !lead.phone) { setLeadErr(true); return; }
    setLeadBusy(true); setLeadErr(false);
    const calcSummary = [
      `Ніша: ${calc.niche.label}`,
      `Оборот/міс: ${num(s.revenue) * 1000} ₴ · чек ${s.aov || '—'} ₴`,
      `Конверсія ${s.cr}% · повторні ${s.repeat || '—'}%`,
      `Недоотримано (консерв.): ${fmtUAH(calc.potentialCons)}/рік · достовірність ${calc.confidence}%`,
      s.organic && `Органіка ${s.organic}% · email ${s.email || '—'}% · маржа ${s.margin || '—'}%`,
      s.trafficSrc && `Трафік: ${s.trafficSrc} · маркетплейси: ${s.marketplaceDep || '—'} · mobile ${s.mobileShare || '—'}%`,
      s.goal && `Ціль: ${s.goal} · біль: ${s.pain || '—'}`,
      s.whoRuns && `Маркетинг веде: ${s.whoRuns} · стек: ${s.stack.join(', ') || '—'}`,
      s.budget && `Бюджет на ріст: ${s.budget} · терміни: ${s.timeline || '—'}`,
    ].filter(Boolean).join('\n');
    const ok = await sendLead({
      source: 'calculator-audit', name: lead.name, email: lead.email, phone: lead.phone,
      store: lead.site, turnover: `${num(s.revenue)} тис ₴/міс`, calc: calcSummary, company_website: lead.hp,
    });
    setLeadBusy(false);
    if (ok) { setLeadSent(true); markLead(lead.email || lead.phone); track('calc_lead', {}); } else { setLeadErr(true); }
  }

  const zonesShown = calc.zones.filter((z) => !(step === 0 && (z.label === 'Органіка' || z.label === 'Email / CRM')));

  /* ── ФІНАЛ ── */
  if (done) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] pb-24">
        <div className="max-w-3xl mx-auto px-5 pt-8">
          <Breadcrumbs items={[{ label: 'Калькулятор аудиту' }]} />
        </div>
        {/* друкований звіт */}
        <div ref={reportRef} id="audit-report" className="max-w-3xl mx-auto px-5 mt-4">
          <div className="bg-white border border-black/10">
            <div className="px-7 py-6 bg-[#12161C] text-white">
              <div className="font-mono text-[11px] tracking-widest text-[#a3e635] uppercase">weexp · оглядовий аудит</div>
              <div className="text-2xl font-bold mt-2">Ваш недоотриманий оборот</div>
              <div className="text-sm text-white/60 mt-1">{calc.niche.label} · оцінка за галузевими еталонами · {new Date().toLocaleDateString('uk-UA')}</div>
            </div>
            <div className="px-7 py-7">
              <div className="text-[13px] text-[#5A6472]">Консервативна нижня межа, на рік</div>
              <div className="text-5xl font-bold font-mono text-[#DC2626] mt-1">{fmtUAH(calc.potentialCons)}</div>
              <div className="text-sm text-[#5A6472] mt-2">≈ {fmtUAH(calc.monthlyCons)}/міс · потенціал зростання +{calc.upliftPct}% · достовірність оцінки {calc.confidence}%</div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {calc.zones.map((z) => (
                  <div key={z.label} className="border border-black/10 px-4 py-3" style={{ background: TONE[z.tone].bg }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#12161C]">{z.label}</span>
                      <span className="font-mono text-sm" style={{ color: TONE[z.tone].fg }}>{TONE[z.tone].mark} {z.value}</span>
                    </div>
                    <div className="text-[11px] text-[#8b93a0] mt-1">{z.hint}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-black/10 pt-5">
                <div className="text-[13px] font-semibold text-[#12161C] mb-2">Де саме лишаються гроші (оглядово)</div>
                <ul className="text-sm text-[#3a4048] space-y-1.5">
                  <li>• Конверсія: до цілі ніші не вистачає — це найдорожчий важіль (≈ {fmtUAH(calc.crShare * 0.55)}/рік).</li>
                  <li>• Повторні покупки: база недопрацьована (≈ {fmtUAH(calc.repShare * 0.55)}/рік).</li>
                  {calc.marginLoss !== null && <li>• У прибутку (після маржі {s.margin}%): ≈ {fmtUAH(calc.marginLoss)}/рік.</li>}
                  <li className="text-[#8b93a0]">Це оглядова оцінка за еталонами галузі. Точні цифри й покроковий план — у повному аудиті з доступом до ваших даних.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* дії — не друкуються */}
        <div className="max-w-3xl mx-auto px-5 mt-5 no-print">
          <div className="flex flex-wrap gap-3">
            <button onClick={downloadPdf} className="inline-flex items-center gap-2 px-5 py-3 bg-[#12161C] text-white font-semibold hover:bg-black transition-colors">
              <Download size={18} /> Завантажити PDF
            </button>
            <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-3 border border-black/15 text-[#5A6472] hover:border-black/30 transition-colors">
              <RotateCcw size={16} /> Пройти знову
            </button>
          </div>

          {/* заявка */}
          <div className="bg-white border border-black/10 mt-6 px-7 py-7">
            {leadSent ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-[#4D7C0F] shrink-0 mt-0.5" size={22} />
                <div>
                  <div className="font-bold text-lg text-[#12161C]">Заявку прийнято</div>
                  <div className="text-sm text-[#5A6472] mt-1">Ми зв’яжемося найближчим часом. Ваш оглядовий аудит уже можна завантажити кнопкою вище.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={submitLead}>
                <div className="font-bold text-lg text-[#12161C]">Хочу повний аудит і план зростання</div>
                <div className="text-sm text-[#5A6472] mt-1 mb-4">Залиште контакт — надішлемо детальний розбір із доступом до ваших даних і дорожню карту під ці цифри.</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="Ім’я" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
                  <input className={inputCls} placeholder="Сайт магазину" value={lead.site} onChange={(e) => setLead({ ...lead, site: e.target.value })} />
                  <input className={inputCls} placeholder="Email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
                  <input className={inputCls} placeholder="Телефон" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
                </div>
                <input tabIndex={-1} autoComplete="off" value={lead.hp} onChange={(e) => setLead({ ...lead, hp: e.target.value })} style={{ position: 'absolute', left: '-9999px' }} aria-hidden />
                {leadErr && <div className="text-sm text-[#DC2626] mt-2">Вкажіть email або телефон — і спробуйте ще раз.</div>}
                <button disabled={leadBusy} className="mt-4 inline-flex items-center gap-2 px-6 py-3.5 bg-[#65A30D] text-white font-semibold hover:bg-[#4d7c0f] transition-colors disabled:opacity-60">
                  {leadBusy ? 'Надсилаю…' : 'Залишити заявку'} <ArrowRight size={18} />
                </button>
                <div className="text-xs text-[#8b93a0] mt-3">Дані з аудиту прийдуть нам разом із заявкою. Ми не передаємо їх третім сторонам.</div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── МАЙСТЕР ── */
  return (
    <div className="min-h-screen bg-[#f6f7f8] pb-28">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <Breadcrumbs items={[{ label: 'Калькулятор аудиту' }]} />
        <FadeIn>
          <Eyebrow>Калькулятор аудиту · 2 хвилини</Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#12161C] mt-3 leading-tight">Скільки обороту ваш магазин лишає на столі</h1>
          <p className="text-[#5A6472] mt-3 max-w-xl">Три кроки в одному вікні. Дайте ключові цифри — покажемо недоотриманий оборот за еталонами вашої ніші, а далі уточнимо картину.</p>
        </FadeIn>

        {/* прогрес */}
        <div className="flex gap-2 mt-7">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className="h-1" style={{ background: i <= step ? '#65A30D' : 'rgba(10,14,18,0.1)' }} />
              <div className="text-[11px] mt-1.5 font-mono" style={{ color: i === step ? '#12161C' : '#8b93a0', fontWeight: i === step ? 700 : 400 }}>{i + 1}. {label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 mt-6 grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* поля кроку */}
        <div className="bg-white border border-black/10 px-6 py-6">
          {step === 0 && (
            <FadeIn className="space-y-5">
              <Field label="Ніша" hint="Підставлю еталони саме вашої категорії">
                <div className="grid grid-cols-2 gap-2">
                  {NICHES.map((n) => (
                    <button key={n.id} type="button" onClick={() => upd({ nicheId: n.id })}
                      className="text-left px-3 py-2.5 text-[13px] border transition-colors"
                      style={s.nicheId === n.id ? { borderColor: '#65A30D', background: 'rgba(101,163,13,0.08)', color: '#3f6212', fontWeight: 600 } : { borderColor: 'rgba(10,14,18,0.12)', color: '#5A6472' }}>
                      {n.label}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Оборот на місяць, тис ₴" hint="приблизно"><input className={inputCls} inputMode="decimal" placeholder="напр. 800" value={s.revenue} onChange={(e) => upd({ revenue: e.target.value })} /></Field>
                <Field label="Середній чек, ₴"><input className={inputCls} inputMode="decimal" placeholder="напр. 1800" value={s.aov} onChange={(e) => upd({ aov: e.target.value })} /></Field>
                <Field label="Конверсія сайту, %" hint="замовлення ÷ візити × 100"><input className={inputCls} inputMode="decimal" placeholder="напр. 1.4" value={s.cr} onChange={(e) => upd({ cr: e.target.value })} /></Field>
                <Field label="Повторні покупки, %" hint="частка клієнтів, що купують ≥2 разів"><input className={inputCls} inputMode="decimal" placeholder="напр. 18" value={s.repeat} onChange={(e) => upd({ repeat: e.target.value })} /></Field>
              </div>
            </FadeIn>
          )}

          {step === 1 && (
            <FadeIn className="space-y-5">
              <p className="text-sm text-[#5A6472]">Уточнимо картину — так оцінка стає точнішою, а профіль каналів повнішим.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Органіка в трафіку, %"><input className={inputCls} inputMode="decimal" placeholder="напр. 25" value={s.organic} onChange={(e) => upd({ organic: e.target.value })} /></Field>
                <Field label="Email/CRM у виручці, %"><input className={inputCls} inputMode="decimal" placeholder="напр. 8" value={s.email} onChange={(e) => upd({ email: e.target.value })} /></Field>
                <Field label="Маржа після собівартості, %"><input className={inputCls} inputMode="decimal" placeholder="напр. 45" value={s.margin} onChange={(e) => upd({ margin: e.target.value })} /></Field>
              </div>
              <Field label="Головне джерело трафіку">{CHIPS(['Платна реклама', 'Пошук/органіка', 'Соцмережі', 'Маркетплейси', 'Email/CRM'], s.trafficSrc, (v) => upd({ trafficSrc: v }))}</Field>
              <Field label="Наскільки залежите від маркетплейсів (Rozetka/Prom тощо)">{CHIPS(['Не залежимо', 'Частково', 'Сильно залежимо'], s.marketplaceDep, (v) => upd({ marketplaceDep: v }))}</Field>
              <Field label="Частка мобільного трафіку, %"><input className={inputCls} inputMode="decimal" placeholder="напр. 65" value={s.mobileShare} onChange={(e) => upd({ mobileShare: e.target.value })} /></Field>
            </FadeIn>
          )}

          {step === 2 && (
            <FadeIn className="space-y-5">
              <p className="text-sm text-[#5A6472]">Останній крок — щоб підготувати повний аудит саме під вашу ситуацію.</p>
              <Field label="Головна ціль на найближчі 6–12 міс">{CHIPS(['Зростання обороту', 'Більше прибутку/маржі', 'Утримання клієнтів', 'Вихід у нові канали/ринки'], s.goal, (v) => upd({ goal: v }))}</Field>
              <Field label="Що болить найбільше зараз">{CHIPS(['Дорогий трафік', 'Низька конверсія', 'Мало повторних', 'Немає аналітики', 'Все на маркетплейсах'], s.pain, (v) => upd({ pain: v }))}</Field>
              <Field label="Хто веде маркетинг">{CHIPS(['Власник сам', 'In-house команда', 'Агенція/фрілансери', 'Ніхто системно'], s.whoRuns, (v) => upd({ whoRuns: v }))}</Field>
              <Field label="Що вже підключено">
                <div className="flex flex-wrap gap-2">
                  {['GA4', 'CRM', 'Email-розсилки', 'Рекламні кабінети', 'Наскрізна аналітика'].map((o) => {
                    const on = s.stack.includes(o);
                    return <button key={o} type="button" onClick={() => upd({ stack: on ? s.stack.filter((x) => x !== o) : [...s.stack, o] })}
                      className="px-3.5 py-2 text-sm border transition-colors"
                      style={on ? { borderColor: '#65A30D', background: 'rgba(101,163,13,0.1)', color: '#3f6212', fontWeight: 600 } : { borderColor: 'rgba(10,14,18,0.14)', color: '#5A6472' }}>{o}</button>;
                  })}
                </div>
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Бюджет на зростання / міс">{CHIPS(['до 30к ₴', '30–100к ₴', '100–300к ₴', '300к+ ₴'], s.budget, (v) => upd({ budget: v }))}</Field>
                <Field label="Коли готові почати">{CHIPS(['Зараз', '1–2 міс', 'Вивчаю'], s.timeline, (v) => upd({ timeline: v }))}</Field>
              </div>
            </FadeIn>
          )}

          {/* навігація */}
          <div className="flex items-center justify-between mt-7 pt-5 border-t border-black/10">
            <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-1.5 text-sm text-[#5A6472] disabled:opacity-30 hover:text-[#12161C]">
              <ArrowLeft size={16} /> Назад
            </button>
            <button onClick={next} disabled={!canNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#12161C] text-white font-semibold hover:bg-black transition-colors disabled:opacity-40">
              {step < STEPS.length - 1 ? (step === 0 ? 'Показати мій оборот' : 'Далі') : 'Отримати аудит'} <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* живий результат */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-[#12161C] text-white px-6 py-6">
            <div className="font-mono text-[11px] tracking-widest text-[#a3e635] uppercase">Недоотримано / рік</div>
            {revealed || step1ok ? (
              <>
                <div className="text-4xl font-bold font-mono mt-2 text-[#a3e635]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmtUAH(calc.potentialCons)}
                </div>
                <div className="text-[13px] text-white/55 mt-2">консервативно · ≈ {fmtUAH(calc.monthlyCons)}/міс</div>
                <div className="text-[13px] text-white/55">потенціал +{calc.upliftPct}% · достовірність {calc.confidence}%</div>
                <div className="mt-4 space-y-2">
                  {zonesShown.map((z) => (
                    <div key={z.label} className="flex items-center justify-between text-[13px]">
                      <span className="text-white/70">{z.label}</span>
                      <span className="font-mono" style={{ color: z.tone === 'red' ? '#f87171' : z.tone === 'yellow' ? '#fbbf24' : z.tone === 'green' ? '#a3e635' : 'rgba(255,255,255,0.4)' }}>{z.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-white/50 mt-3 leading-relaxed">Заповніть нішу, оборот і конверсію на кроці 1 — і тут з’явиться ваш недоотриманий оборот.</div>
            )}
          </div>
          <div className="text-[11px] text-[#8b93a0] mt-2 px-1">Оцінка за галузевими еталонами (Baymard/NN·g), не виміряний факт. Точні цифри — у повному аудиті.</div>
        </div>
      </div>
    </div>
  );
}
