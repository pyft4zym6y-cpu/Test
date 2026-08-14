import { lazy, Suspense, useRef, useState } from 'react';
import { computeLoss, eur, SYS, type LossInput, type LossResult, type SysKey } from './lossModel';
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
const FIELDS: { k: keyof Omit<LossInput, 'symptoms'>; label: string; unit: string; hint?: string }[] = [
  { k: 'monthlyRevenue', label: 'Онлайн-виторг', unit: '€ / міс' },
  { k: 'aov', label: 'Середній чек', unit: '€' },
  { k: 'conversion', label: 'Конверсія', unit: '%' },
  { k: 'repeatRate', label: 'Частка повторних', unit: '%' },
  { k: 'returnsRate', label: 'Повернення + скасування', unit: '%' },
  { k: 'grossMargin', label: 'Валова маржа', unit: '%' },
  { k: 'cac', label: 'Вартість залучення (CAC)', unit: '€', hint: 'необовʼязково' },
];
const PAIN: Record<SysKey, string> = {
  strategy: 'Не розуміємо, куди рости', commercial: 'Виторг є, а прибутку — ні',
  customer: 'Клієнт дорогий і не повертається', experience: 'Люди заходять, але не купують',
  operations: 'Забагато ручної роботи', data: 'У кожного свої цифри',
  org: 'Усе тримається на власнику',
};
const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');

export function LossCalculator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inp, setInp] = useState<LossInput>({ monthlyRevenue: 0, aov: 0, conversion: 0, repeatRate: 0, returnsRate: 0, grossMargin: 0, cac: 0, symptoms: [] });
  const [res, setRes] = useState<LossResult | null>(null);
  const [stage2, setStage2] = useState(false);
  const alerts = useRef<number[]>([]);

  const setNum = (k: keyof Omit<LossInput, 'symptoms'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInp((s) => ({ ...s, [k]: parseFloat(e.target.value) || 0 }));
  const toggle = (k: SysKey) => setInp((s) => ({ ...s, symptoms: s.symptoms.includes(k) ? s.symptoms.filter((x) => x !== k) : [...s.symptoms, k] }));
  const compute = () => { const r = computeLoss(inp); setRes(r); alerts.current = r.bottleneckNodes; setStep(3); };
  const restart = () => { alerts.current = []; setRes(null); setStep(1); };
  const primaryLabel = (k: SysKey) => SYS.find((s) => s.key === k)!.label;

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className="sysx-calc-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.72} alerts={alerts} /></Suspense></div>

      <div className="sysx-calc-panel">
        {step !== 3 && (
          <header className="sysx-calc-head">
            <div className="sysx-kick">Крок 1 з 2 · Калькулятор витрат · 5 хвилин</div>
            <h1 className="sysx-display sysx-calc-h1">Порахуйте, скільки<br />ви <span className="sysx-em">втрачаєте</span></h1>
            <p className="sysx-lead">Спершу — число: скільки грошей витікає з вітрини щороку. Потім, у повній діагностиці, перетворимо його на карту: де саме й як повернути.</p>
            <div className="sysx-steps mono"><span className={step === 1 ? 'on' : ''}>01 Профіль</span><i>→</i><span className={step === 2 ? 'on' : ''}>02 Симптоми</span><i>→</i><span>03 Ваш витік</span></div>
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
              <button className="sysx-cta is-primary" onClick={() => setStep(2)} disabled={!inp.monthlyRevenue}>Далі → симптоми</button>
              <span className="sysx-note mono">Оцінка за наданими даними. Не фінансовий аудит.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sysx-card">
            <p className="sysx-lead">Де відчуваєте проблему? Позначте все, що відгукується — кожен симптом перебудовує вашу систему.</p>
            <div className="sysx-sym">
              {SYS.map((s) => (
                <button key={s.key} className={`sysx-sym-b${inp.symptoms.includes(s.key) ? ' on' : ''}`} onClick={() => toggle(s.key)}>
                  <b>{s.label}</b><span>«{PAIN[s.key]}»</span>
                </button>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta" onClick={() => setStep(1)}>← Назад</button>
              <button className="sysx-cta is-primary" onClick={compute}>Показати витік →</button>
            </div>
          </div>
        )}

        {step === 3 && res && (
          <div className="sysx-result">
            <div className="sysx-kick">Ваш витік в e-commerce · оцінка</div>
            <div className="sysx-total">
              <span className="sysx-total-big sysx-display">{eur(res.total)}<span>/ рік</span></span>
              <span className="sysx-total-cap mono">оцінена можливість · діапазон {eur(res.range[0])}–{eur(res.range[1])}</span>
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
              <span className="sysx-kick">Головний bottleneck</span>
              <b className="sysx-display">{primaryLabel(res.primary)}</b>
              <span className="mono">вторинний — {primaryLabel(res.secondary)}</span>
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
              <span className="sysx-kick">Три перші дії</span>
              <ol>{res.actions.map((a) => <li key={a.key}>{a.text}</li>)}</ol>
            </div>

            {/* Крок 2 — місток до повної діагностики: число → карта → план */}
            <div className="sysx-next2">
              <span className="sysx-kick">Крок 2 з 2 · Повна діагностика</span>
              <p className="sysx-next2-lead">Це <b>оцінка за 5 хвилин</b>. Повна діагностика підтвердить цифру вашими даними (CRM/ERP/GA4) і покаже, <b>де саме</b> витікає виторг і <b>як його повернути</b> — план під Definition of Done.</p>
              <div className="sysx-next2-ladder mono">
                <span><b>Зараз</b><i>Число: скільки втрачаєте</i></span>
                <em>→</em>
                <span><b>Крок 2</b><i>Карта: де саме й чому</i></span>
                <em>→</em>
                <span><b>Побудова</b><i>План повернення виторгу</i></span>
              </div>
            </div>

            <div className="sysx-calc-actions">
              <button className="sysx-cta is-primary" onClick={() => setStage2(true)}>Крок 2 — глибша діагностика →</button>
              <button className="sysx-cta" onClick={restart}>Перерахувати</button>
            </div>
            <span className="sysx-note mono">Оцінка за наданими даними. Не фінансовий аудит. Етап 2 уточнює зріз за логікою Commerce OS.</span>
          </div>
        )}
      </div>

      {stage2 && <Suspense fallback={null}><Stage2 stage1={inp} onClose={() => setStage2(false)} /></Suspense>}
    </section>
  );
}
