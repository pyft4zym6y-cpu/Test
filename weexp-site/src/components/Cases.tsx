import { Eyebrow, FadeIn } from '@/lib/primitives';
import { say, sayIdle } from '@/lib/bus';
import './cases.css';

const CASES = [
  { num: '×18', name: 'Преміум-текстиль', metric: '€48K → €900K · 18 міс', cat: 'Home & Decor', say: 'Преміум-текстиль: оборот ×18 за 18 місяців, конверсія 0,8% → 4,2%.' },
  { num: '+65%', name: 'Consumer DTC', metric: 'Forbes TOP-250 · 6 ринків', cat: 'Beauty / DTC', say: 'Consumer DTC: +65% до обороту, вихід на 6 ринків, Forbes TOP-250.' },
  { num: '≥19 млн ₴', name: 'Fashion Apparel', metric: 'програма росту 12 міс', cat: 'Fashion', say: 'Fashion: знайдено ≥19 млн ₴ недоотриманого обороту на рік.' },
  { num: '17K SKU', name: 'FMCG Distribution', metric: '+40% · CRM + ERP', cat: 'FMCG', say: 'FMCG-дистрибуція: 17 000 SKU під контролем, +40% через CRM і ERP.' },
];

export function Cases() {
  return (
    <section className="cases" data-say="Не один результат — система. Кожен кейс закритий цифрою з CRM, ERP і GA4.">
      <div className="wrap">
        <FadeIn><Eyebrow>Докази · кейси з CRM, ERP і GA4</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="cases-h">Кожен кейс — <span className="mk">окрема історія</span></h2></FadeIn>
        <div className="cases-grid">
          {CASES.map((c, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.08}>
              <article className="case" onMouseEnter={() => say(c.say)} onMouseLeave={() => sayIdle()} tabIndex={0}
                onFocus={() => say(c.say)} onBlur={() => sayIdle()}>
                <span className="case-cat mono">{c.cat}</span>
                <div className="case-num">{c.num}</div>
                <div className="case-name">{c.name}</div>
                <div className="case-metric mono">{c.metric}</div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
