import { Eyebrow, FadeIn, CountUp } from '@/lib/primitives';
import './team.css';

/** Команда — ядро + поди (из старого Process). Компактно. */
const CORE = [
  { to: 40, suffix: '+', label: 'фахівців у мережі' },
  { to: 6, label: 'команд-ядер' },
  { to: 8, label: 'подів під домени' },
];
const PODS = ['CRO', 'Retention', 'Трафік', 'Контент', 'Технічна', 'Аналітика', 'Бренд', 'Операції'];

export function Team() {
  return (
    <section className="tm" data-say="Не одна людина — команда подів під кожен домен, зібрана під вашу задачу.">
      <div className="wrap">
        <FadeIn><Eyebrow>Команда · поди під домени</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="tm-h">Не людина. <span className="mk">Система команд.</span></h2></FadeIn>
        <FadeIn delay={0.1}><p className="tm-lead">Під вашу задачу збирається ядро й поди — кожен закриває свій домен Commerce OS. Ви працюєте з системою, а не із залежністю від однієї людини.</p></FadeIn>
        <div className="tm-core">
          {CORE.map((c, i) => (
            <FadeIn key={i} delay={0.12 + i * 0.08}>
              <div className="tm-num"><span className="tm-v"><CountUp to={c.to} suffix={c.suffix} /></span><span className="tm-l">{c.label}</span></div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.34}>
          <div className="tm-pods">
            {PODS.map((p) => <span key={p} className="tm-pod mono">{p}</span>)}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
