import { useState } from 'react';
import { Eyebrow, FadeIn } from '@/lib/primitives';
import { say } from '@/lib/bus';
import './demoos.css';

/** DemoOS — интерактивный BI-дашборд (переосмысленный DemoOS старого сайта). ДЕМО-ДАНІ. */
const TABS = ['Воронка', 'Юніт-економіка', 'Когорти'] as const;
const FUNNEL = [
  { s: 'Візити', v: 100, g: 100 }, { s: 'Картка товару', v: 42, g: 55 },
  { s: 'Кошик', v: 8.4, g: 14 }, { s: 'Оформлення', v: 3.1, g: 6.5 }, { s: 'Оплата', v: 2.4, g: 4.2 },
];
const UNIT = [
  { k: 'CAC', v: '$12', b: 40 }, { k: 'LTV', v: '$58', b: 78 },
  { k: 'LTV:CAC', v: '4,8×', b: 82 }, { k: 'CM2', v: '34%', b: 60 },
];
const COH = [
  [100, 46, 32, 27, 24, 22], [100, 51, 38, 31, 28, 26], [100, 44, 30, 25, 22, 20],
  [100, 55, 42, 36, 33, 31], [100, 49, 35, 29, 26, 24],
];
const MONTHS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'];

export function DemoOS() {
  const [tab, setTab] = useState(0);
  const pick = (i: number) => { setTab(i); say(`Демо-дашборд: ${TABS[i]}. Це показує, як система дивиться на бізнес у грошах.`); };
  return (
    <section className="demo" data-say="Так виглядає операційна система зсередини: воронка, юніт-економіка, когорти — у грошах.">
      <div className="wrap">
        <FadeIn><Eyebrow>Продукт · як це працює</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="demo-h">Бізнес у грошах, а не в <span className="mk">відчуттях</span></h2></FadeIn>
        <FadeIn delay={0.1}>
          <div className="term">
            <div className="term-bar">
              <span className="term-dot" /><span className="term-dot" /><span className="term-dot" />
              <span className="term-title mono">commerce-os · dashboard <span className="demo-live">● ДЕМО-ДАНІ</span></span>
            </div>
            <div className="term-tabs">
              {TABS.map((t, i) => (
                <button key={t} type="button" className={`term-tab mono${i === tab ? ' is-on' : ''}`} onClick={() => pick(i)}>{t}</button>
              ))}
            </div>
            <div className="term-body">
              {tab === 0 && (
                <div className="fnl">
                  {FUNNEL.map((f) => (
                    <div key={f.s} className="fnl-row">
                      <span className="fnl-lab mono">{f.s}</span>
                      <div className="fnl-track">
                        <span className="fnl-gold" style={{ width: `${f.g}%` }} />
                        <span className="fnl-fill" style={{ width: `${f.v}%` }} />
                      </div>
                      <span className="fnl-val mono">{String(f.v).replace('.', ',')}%</span>
                    </div>
                  ))}
                  <p className="demo-note mono">Суцільне — факт, контур — еталон Gold Standard. Розрив = недоотриманий оборот.</p>
                </div>
              )}
              {tab === 1 && (
                <div className="unit">
                  {UNIT.map((u) => (
                    <div key={u.k} className="unit-card">
                      <span className="unit-k mono">{u.k}</span>
                      <span className="unit-v">{u.v}</span>
                      <div className="unit-bar"><span style={{ width: `${u.b}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
              {tab === 2 && (
                <div className="coh">
                  <div className="coh-row coh-head">
                    <span className="coh-lab mono">когорта</span>
                    {MONTHS.map((m) => <span key={m} className="coh-cell mono coh-mh">{m}</span>)}
                  </div>
                  {COH.map((row, i) => (
                    <div key={i} className="coh-row">
                      <span className="coh-lab mono">Q{i + 1}</span>
                      {row.map((val, j) => (
                        <span key={j} className="coh-cell mono" style={{ background: `rgba(58,136,115,${(val / 100) * 0.9 + 0.05})`, color: val > 45 ? '#0A1218' : '#C0D3CC' }}>{val}</span>
                      ))}
                    </div>
                  ))}
                  <p className="demo-note mono">Утримання по когортах: де база «протікає» — туди йде retention-плейбук.</p>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
