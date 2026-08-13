import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { LEVELS } from '@/data/xray';
import './score-page.css';

const RISE: Record<string, string> = {
  'Хаос': 'Винести знання з голови власника у процеси й регламенти.',
  'Залежність': 'Відв’язати ключові функції від конкретних людей.',
  'Функції': 'Звести напрями в єдиний контур даних і P&L.',
  'Система': 'Стандартизувати governance і передати операційне керування.',
  'Незалежність': 'Тримати стандарт і масштабувати на нові ринки.',
};

/** /how-it-works/independence-score — пропрієтарний актив: що вимірює, як рахується, 5 рівнів. */
export function IndependenceScorePage() {
  return (
    <>
      <PageHead
        kicker="Метрика · Independence Score"
        title={<>Наскільки бізнес<br />здатний працювати без вас</>}
        lead={<>Independence Score — це рівень зрілості e-commerce від 0 до 100. Він вимірює головне:
          чи тримається бізнес на <b>системі</b>, а не на герої.</>}
      />

      <section className="wrap sp-what">
        <div className="sp-what-col">
          <h3 className="sp-h mono">Що вимірює</h3>
          <p>Автономність: наскільки залучення, конверсія, утримання, операції та дані працюють як система без щоденного втручання власника.</p>
        </div>
        <div className="sp-what-col">
          <h3 className="sp-h mono">Як рахується</h3>
          <p>18 доменів здоров’я → зважене на автономність середнє. Операції, дані й утримання важать більше за трафік, бо саме вони роблять бізнес незалежним.</p>
        </div>
        <div className="sp-what-col">
          <h3 className="sp-h mono">Навіщо</h3>
          <p>Щоб бачити не «скільки продали», а «наскільки бізнес стійкий». Це KPI передачі: коли ви можете відійти — і система не падає.</p>
        </div>
      </section>

      <section className="wrap sp-levels">
        <span className="page-kick">П’ять рівнів зрілості</span>
        {LEVELS.map((l, i) => (
          <div key={l.code} className="sp-level" style={{ ['--i' as string]: i / (LEVELS.length - 1) }}>
            <span className="sp-level-code mono">{l.code}</span>
            <div className="sp-level-body">
              <span className="sp-level-title">{l.title}</span>
              <span className="sp-level-line">{l.line}</span>
              <span className="sp-level-rise mono">↑ {RISE[l.title]}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Дізнайтеся свій Independence Score за 2 хвилини.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Пройти X-Ray →</Link>
            <Link to="/how-it-works/business-health" className="btn-ghost mono">Business Health →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
