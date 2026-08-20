import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import { CASES } from '@/data/cases';
import './system.css';

/**
 * Глибока сторінка послуги (одна на систему) за структурою ТЗ §4:
 * проблема → наслідки → діагностика → рішення → як працюємо (процес) →
 * результат → докази → умови → наступний крок. Дані — із SYSTEMS (data/xray),
 * докази — реальні кейси, відфільтровані за системою. /systems/:slug.
 */
export function ServicePage() {
  const { slug } = useParams();
  const sys = SYSTEMS.find((s) => s.slug === slug);
  const idx = sys ? SYSTEMS.findIndex((s) => s.slug === slug) : -1;

  useEffect(() => {
    if (sys) document.title = `${sys.title} — послуга WEEXP · Commerce OS`;
  }, [sys]);

  if (!sys) return <Navigate to="/#systems" replace />;

  const proofs = CASES.filter((c) => c.systems.includes(sys.key)).slice(0, 3);
  const prev = SYSTEMS[(idx - 1 + SYSTEMS.length) % SYSTEMS.length];
  const next = SYSTEMS[(idx + 1) % SYSTEMS.length];

  return (
    <section className="sysx svc" aria-label={sys.title}>
      <div className="svc-in">
        {/* Локальні крихти прибрано — глобальні «Головна / Системи / …» тепер у шапці (SystemShell). */}
        <header className="svc-head">
          <span className="sysx-kick">Система {sys.num} · {sys.en}</span>
          <h1 className="sysx-display svc-h1">{sys.title}</h1>
          <p className="svc-promise">{sys.bigIdea}</p>
          <div className="svc-when mono"><span>Коли це ваше вузьке місце</span><b>{sys.when}</b></div>
          <div className="svc-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Перевірити цю систему в діагностиці →</Link>
            <Link to="/contact" className="sysx-cta">Обговорити задачу</Link>
          </div>
        </header>

        <div className="svc-grid">
          <article className="svc-block svc-problem">
            <span className="svc-lab mono">01 · Проблема</span>
            <p className="svc-feel">«{sys.feel}»</p>
            <p className="svc-txt">Це відчуття власника, коли система «{sys.title.toLowerCase()}» не збудована. Далі — як це проявляється й у що обходиться.</p>
          </article>

          <article className="svc-block">
            <span className="svc-lab mono">02 · Наслідки й симптоми</span>
            <ul className="svc-pains">{sys.pains.map((p) => <li key={p}>{p}</li>)}</ul>
            <p className="svc-note mono">Кожен симптом — це гроші, що витікають повз касу: втрачений трафік, нижча конверсія, менший LTV чи вищі витрати.</p>
          </article>

          <article className="svc-block">
            <span className="svc-lab mono">03 · Що діагностуємо</span>
            <div className="svc-domains">{sys.domains.map((d) => <span key={d} className="svc-domain">{d}</span>)}</div>
            <p className="svc-txt">Перевіряємо кожен домен за даними (CRM/ERP/GA4 і ваші процеси), а не «на око». Логіка: <b>проблема → докази → впевненість → вплив → пріоритет</b>.</p>
          </article>

          <article className="svc-block svc-solution">
            <span className="svc-lab mono">04 · Що будуємо</span>
            <p className="svc-sell">{sys.sell}</p>
            <p className="svc-txt">Не набір робіт, а <b>систему, якою можна керувати</b>: із власником, метриками й регулярним циклом.</p>
          </article>

          <article className="svc-block svc-flow-block">
            <span className="svc-lab mono">05 · Як працюємо — ланцюг цінності</span>
            <div className="svc-flow">
              {sys.flow.map((f, i) => (
                <span key={f} className="svc-flow-step">
                  <i className="mono">{String(i + 1).padStart(2, '0')}</i>{f}
                  {i < sys.flow.length - 1 && <em aria-hidden="true">→</em>}
                </span>
              ))}
            </div>
            <p className="svc-note mono">Діагностика → побудова → доведення до економіки → передача під ключ (щоб працювало без героя).</p>
          </article>

          <article className="svc-block svc-result">
            <span className="svc-lab mono">06 · Результат</span>
            <p className="svc-txt"><b>{sys.bigIdea}</b> — керована система замість ручного режиму. Точні цілі та строки складаємо на діагностиці під ваш Definition of Done.</p>
          </article>
        </div>

        {proofs.length > 0 && (
          <div className="svc-proof">
            <span className="svc-lab mono">07 · Докази — де ця система дала дельту</span>
            <div className="svc-proof-grid">
              {proofs.map((c) => (
                <Link key={c.slug} to="/proof" className="svc-case">
                  <span className="svc-case-cat mono">{c.cat}</span>
                  <b className="sysx-display svc-case-hero">{c.hero}</b>
                  <span className="svc-case-lbl">{c.heroLabel}</span>
                </Link>
              ))}
            </div>
            <span className="svc-proof-note mono">Кожна дельта звірена з CRM / ERP / GA4 клієнта.</span>
          </div>
        )}

        <div className="svc-next">
          <div className="svc-next-l">
            <span className="sysx-kick">Умови й наступний крок</span>
            <h2 className="sysx-display svc-next-h">Точну вартість формуємо після діагностики</h2>
            <p className="svc-txt">Спершу — діагноз у грошах: скільки саме витікає у цій системі й що дасть найбільшу дельту. Обсяг і вартість робіт залежать від стану, тож фіксуємо їх після розбору.</p>
          </div>
          <div className="svc-next-r">
            <Link to="/diagnose" className="sysx-cta is-primary">Пройти діагностику →</Link>
            <Link to="/contact" className="sysx-cta">Запланувати розбір</Link>
          </div>
        </div>

        <nav className="svc-siblings">
          <Link to={`/systems/${prev.slug}`} className="svc-sib">← {prev.title}</Link>
          <Link to="/#systems" className="svc-sib is-mid mono">Усі 8 систем</Link>
          <Link to={`/systems/${next.slug}`} className="svc-sib">{next.title} →</Link>
        </nav>
      </div>
    </section>
  );
}
