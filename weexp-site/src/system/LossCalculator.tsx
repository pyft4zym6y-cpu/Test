import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { computeLoss, eur, project, SYS, type LossInput, type LossResult, type SysKey } from './lossModel';
import { saveExpressAudit } from './cabinetData';
import { useT, useLp } from '@/i18n';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));
const Stage2 = lazy(() => import('@/system/Stage2').then((m) => ({ default: m.Stage2 })));

/**
 * Калькулятор витрат — перший крок воронки діагностики (крок 1 з 2). Дає ЧИСЛО:
 * скільки грошей витікає з вітрини щороку (оцінка за даними + бенчмарками). Далі
 * природно веде до кроку 2 — повної діагностики, що перетворює число на КАРТУ:
 * де саме, чому і як повернути. Заповнюючи профіль, користувач бачить, як його
 * бізнес складається в Commerce System; на результаті вузол-bottleneck пульсує.
 */
const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');

export function LossCalculator() {
  const t = useT();
  const lp = useLp();
  const FIELDS: { k: keyof Omit<LossInput, 'symptoms'>; label: string; unit: string; hint?: string }[] = [
    { k: 'monthlyRevenue', label: t('Онлайн-виторг', 'Online revenue'), unit: t('€ / міс', '€ / mo') },
    { k: 'aov', label: t('Середній чек', 'Average order value (AOV)'), unit: '€' },
    { k: 'conversion', label: t('Конверсія', 'Conversion'), unit: '%' },
    { k: 'repeatRate', label: t('Частка повторних', 'Repeat purchase share'), unit: '%' },
    { k: 'returnsRate', label: t('Повернення + скасування', 'Returns + cancellations'), unit: '%' },
    { k: 'grossMargin', label: t('Валова маржа', 'Gross margin'), unit: '%' },
    { k: 'cac', label: t('Вартість залучення (CAC)', 'Acquisition cost (CAC)'), unit: '€', hint: t('необовʼязково', 'optional') },
  ];
  const PAIN: Record<SysKey, string> = {
    strategy: t('Не розуміємо, куди рости', "We don't know where to grow"),
    commercial: t('Виторг є, а прибутку — ні', 'Revenue is there, profit is not'),
    customer: t('Клієнт дорогий і не повертається', "Customers are expensive and don't return"),
    experience: t('Люди заходять, але не купують', "People come but don't buy"),
    operations: t('Забагато ручної роботи', 'Too much manual work'),
    data: t('У кожного свої цифри', 'Everyone has their own numbers'),
    org: t('Усе тримається на власнику', 'Everything rests on the owner'),
    expansion: t('Уперлися в стелю ринку', 'Hit the market ceiling'),
  };
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inp, setInp] = useState<LossInput>({ monthlyRevenue: 0, aov: 0, conversion: 0, repeatRate: 0, returnsRate: 0, grossMargin: 0, cac: 0, symptoms: [] });
  const [res, setRes] = useState<LossResult | null>(null);
  const [stage2, setStage2] = useState(false);
  const alerts = useRef<number[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  // Зміна кроку — підводимо панель до верху вьюпорта (щоб екран не «стрибав» посередині форми)
  useEffect(() => {
    const el = panelRef.current; if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, [step]);

  const setNum = (k: keyof Omit<LossInput, 'symptoms'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInp((s) => ({ ...s, [k]: parseFloat(e.target.value) || 0 }));
  const toggle = (k: SysKey) => setInp((s) => ({ ...s, symptoms: s.symptoms.includes(k) ? s.symptoms.filter((x) => x !== k) : [...s.symptoms, k] }));
  const compute = () => { const r = computeLoss(inp); setRes(r); alerts.current = r.bottleneckNodes; saveExpressAudit(inp, r); setStep(3); };
  const restart = () => { alerts.current = []; setRes(null); setStep(1); };
  const primaryLabel = (k: SysKey) => SYS.find((s) => s.key === k)!.label;

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className="sysx-calc-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.72} alerts={alerts} /></Suspense></div>

      <div className="sysx-calc-panel" ref={panelRef}>
        {step !== 3 && (
          <header className="sysx-calc-head">
            <div className="sysx-kick">{t('Діагностика e-commerce · крок', 'E-commerce diagnostics · step')} {step} · {t('~5 хвилин', '~5 minutes')}</div>
            <h1 className="sysx-display sysx-calc-h1">{t('Діагностика:', 'Diagnostics:')}<br />{t('почнімо з ', "let's start with ")}<span className="sysx-em">{t('числа', 'a number')}</span></h1>
            <p className="sysx-lead">{t('Один інструмент від першого числа до плану. Спершу порахуємо, скільки витікає щороку; далі — карта систем, кабінет із вашими даними та поглиблений розбір. Це кроки однієї діагностики, а не окремі інструменти.', 'One tool from the first number to the plan. First we calculate how much leaks each year; then — the systems map, a cabinet with your data, and an in-depth review. These are steps of one diagnostic, not separate tools.')}</p>
            <div className="sysx-steps mono"><span className={step === 1 ? 'on' : ''}>{t('01 Профіль', '01 Profile')}</span><i>→</i><span className={step === 2 ? 'on' : ''}>{t('02 Симптоми', '02 Symptoms')}</span><i>→</i><span>{t('03 Витік', '03 Leak')}</span><i>→</i><span>{t('04 Карта', '04 Map')}</span><i>→</i><span>{t('05 Кабінет', '05 Cabinet')}</span></div>
          </header>
        )}

        {step === 1 && (
          <div className="sysx-card">
            <div className="sysx-grid">
              {FIELDS.map((f) => (
                <label key={f.k} className="sysx-inp">
                  <span className="sysx-inp-l">{f.label}{f.hint && <i> · {f.hint}</i>}</span>
                  <span className="sysx-inp-row">
                    <input type="number" inputMode="decimal" min={0} value={inp[f.k] || ''} onChange={setNum(f.k)} placeholder="0" />
                    <span className="sysx-inp-u mono">{f.unit}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta is-primary" onClick={() => setStep(2)} disabled={!inp.monthlyRevenue}>{t('Далі → симптоми', 'Next → symptoms')}</button>
              <span className="sysx-note mono">{t('Оцінка за наданими даними. Не фінансовий аудит.', 'An estimate based on your data. Not a financial audit.')}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sysx-card">
            <p className="sysx-lead">{t('Де відчуваєте проблему? Позначте все, що відгукується — кожен симптом перебудовує вашу систему.', 'Where do you feel the problem? Check everything that resonates — each symptom reshapes your system.')}</p>
            <div className="sysx-sym">
              {SYS.map((s) => (
                <button key={s.key} className={`sysx-sym-b${inp.symptoms.includes(s.key) ? ' on' : ''}`} onClick={() => toggle(s.key)}>
                  <b>{s.label}</b><span>«{PAIN[s.key]}»</span>
                </button>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta" onClick={() => setStep(1)}>{t('← Назад', '← Back')}</button>
              <button className="sysx-cta is-primary" onClick={compute}>{t('Показати витік →', 'Show the leak →')}</button>
            </div>
          </div>
        )}

        {step === 3 && res && (
          <div className="sysx-result">
            <div className="sysx-kick">{t('Ваш витік в e-commerce · оцінка', 'Your e-commerce leak · estimate')}</div>
            <div className="sysx-total">
              <span className="sysx-total-big sysx-display">{eur(res.total)}<span>{t('/ рік', '/ year')}</span></span>
              <span className="sysx-total-cap mono">{t('оцінена можливість · діапазон ', 'estimated opportunity · range ')}{eur(res.range[0])}–{eur(res.range[1])}</span>
            </div>

            <div className="sysx-leaks">
              {res.leaks.slice(0, 5).map((l, i) => {
                const max = res.leaks[0].amount || 1;
                return (
                  <div key={l.label + i} className="sysx-leak">
                    <span className="sysx-leak-l">{l.label}</span>
                    <span className="sysx-leak-bar"><i style={{ width: `${Math.round((l.amount / max) * 100)}%` }} /></span>
                    <span className="sysx-leak-v mono">{eur(l.amount)}</span>
                  </div>
                );
              })}
            </div>

            <div className="sysx-bottleneck">
              <span className="sysx-kick">{t('Головний bottleneck', 'Main bottleneck')}</span>
              <b className="sysx-display">{primaryLabel(res.primary)}</b>
              <span className="mono">{t('вторинний — ', 'secondary — ')}{primaryLabel(res.secondary)}</span>
            </div>

            <div className="sysx-health">
              <div className="sysx-health-head"><span className="sysx-kick">Business Health</span><b className="sysx-display">{res.overallHealth}<i>/100</i></b></div>
              <div className="sysx-health-grid">
                {res.health.map((h) => (
                  <div key={h.key} className="sysx-hbar">
                    <span className="sysx-hbar-l mono">{h.label.split(' ')[0]}</span>
                    <span className={`sysx-hbar-t ${HW(h.score)}`}><i style={{ width: `${h.score}%` }} /></span>
                    <span className="sysx-hbar-v mono">{h.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sysx-actions">
              <span className="sysx-kick">{t('Три перші дії', 'First three actions')}</span>
              <ol>{res.actions.map((a) => <li key={a.key}>{a.text}</li>)}</ol>
            </div>

            {/* «Зараз → Куди можемо прийти» — чорнова ціль (уточнимо на наступних кроках) */}
            {(() => {
              const proj = project(inp, res);
              if (!proj.income.length) return null;
              return (
                <div className="s2-project sysx-proj1">
                  <div className="s2-proj-head">
                    <span className="sysx-kick">{t('Зараз → Куди можемо прийти · чорнова ціль', 'Now → Where we can get to · draft target')}</span>
                    <p className="s2-proj-sub">{t('Перша оцінка за ', 'First estimate over ')}<b>{proj.horizon}</b>{t('. На Кроці 2 і в кабінеті цей діапазон ', '. On Step 2 and in the cabinet this range ')}<b>{t('уточнюється', 'is refined')}</b>{t(' вашими даними — не рахуємо наново.', ' by your data — no recalculation from scratch.')}</p>
                  </div>
                  <div className="s2-proj-income">
                    {proj.income.map((d) => (
                      <div key={d.label} className={`s2-proj-inc${d.hero ? ' is-hero' : ''}`}>
                        <span className="s2-proj-inc-l mono">{d.label}</span>
                        <div className="s2-proj-inc-v"><span className="s2-proj-now">{d.before}</span><em aria-hidden="true">→</em><b className="sysx-display s2-proj-aft">{d.after}</b></div>
                        <span className="s2-proj-badge up">+{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Наступний крок тієї ж діагностики: число → карта → кабінет → план */}
            <div className="sysx-next2">
              <span className="sysx-kick">{t('Крок 4 · Повна карта систем', 'Step 4 · Full systems map')}</span>
              <p className="sysx-next2-lead">{t('Ви завершили ', 'You completed ')}<b>{t('кроки 1–3', 'steps 1–3')}</b>{t(' — маєте число. Далі, у тій самій діагностиці, підтвердимо його вашими даними (CRM/ERP/GA4) і покажемо, ', ' — you have a number. Next, in the same diagnostic, we confirm it with your data (CRM/ERP/GA4) and show ')}<b>{t('де саме', 'exactly where')}</b>{t(' витікає виторг і ', ' revenue leaks and ')}<b>{t('як його повернути', 'how to recover it')}</b>{t(' — план під Definition of Done.', ' — a plan under Definition of Done.')}</p>
              <div className="sysx-next2-ladder mono">
                <span><b>{t('Кроки 1–3', 'Steps 1–3')}</b><i>{t('Число: скільки втрачаєте', 'Number: how much you lose')}</i></span>
                <em>→</em>
                <span><b>{t('Крок 4', 'Step 4')}</b><i>{t('Карта: де саме й чому', 'Map: exactly where and why')}</i></span>
                <em>→</em>
                <span><b>{t('Крок 5', 'Step 5')}</b><i>{t('Кабінет + план повернення', 'Cabinet + recovery plan')}</i></span>
              </div>
            </div>

            <div className="sysx-calc-actions">
              <button className="sysx-cta is-primary" onClick={() => setStage2(true)}>{t('Далі: повна карта систем →', 'Next: full systems map →')}</button>
              <Link className="sysx-cta" to={lp('/cabinet')}>{t('Зберегти в кабінет →', 'Save to cabinet →')}</Link>
              <button className="sysx-cta" onClick={restart}>{t('Перерахувати', 'Recalculate')}</button>
            </div>
            <span className="sysx-note mono">{t('Оцінка за наданими даними. Не фінансовий аудит. Етап 2 уточнює зріз за логікою Commerce OS.', 'An estimate based on your data. Not a financial audit. Stage 2 refines the cut using Commerce OS logic.')}</span>
          </div>
        )}
      </div>

      {stage2 && res && <Suspense fallback={null}><Stage2 stage1={inp} stage1Result={res} onClose={() => setStage2(false)} /></Suspense>}
    </section>
  );
}
