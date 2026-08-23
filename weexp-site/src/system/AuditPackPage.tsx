import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import { PACK_REPORTS, chaptersOf, AUDIT_BLOCKS, TOTAL_CHECKS } from '@/data/auditPack';
import './system.css';

/**
 * /audit-pack — публічний склад пакета глибокого аудиту: 5 ємких звітів
 * (обіцянка формату 01 на /pricing), кожен зі змістом і конечною цінністю.
 * 12 спеціалізованих аудитів — глави Звіту 2. Джерело — src/data/auditPack.ts
 * (той самий канон, що й чеклист готовності в адмінці).
 */
export function AuditPackPage() {
  const t = useT();
  const lp = useLp();
  return (
    <section className="sysx apack" aria-label={t('Склад пакета аудиту', 'Audit pack contents')}>
      <div className="sysx-field" aria-hidden="true" />
      <div className="apack-in">
        <header className="apack-head">
          <span className="sysx-kick">{t('Формат 01 · Аудит · що всередині', 'Format 01 · Audit · what is inside')}</span>
          <h1 className="sysx-display apack-h1">{t('Пакет аудиту — ', 'The audit pack — ')}<span className="sysx-em">{t('5 звітів', '5 reports')}</span></h1>
          <p className="sysx-lead">{t('Жодних «звітів у повітрі»: до старту ви бачите повний зміст. Пʼять самодостатніх звітів — Презентація, Діагностичний том із 12 аудитами, Фінансовий звіт із мостом P&L, Роадмапа впровадження, Пропозиція та передача. Кожен зі змістом, конечною цінністю і логічним завершенням.', 'No “reports in the air”: before we start you see the full contents. Five self-contained reports — the Presentation, the Diagnostic volume with the 12 audits, the Financial report with the P&L bridge, the Implementation roadmap, the Proposal & handover. Each with a table of contents, terminal value and logical closure.')}</p>
        </header>

        {PACK_REPORTS.map((r, ri) => (
          <div key={r.id} className="apack-phase">
            <h2 className="apack-ph-t mono">{t('Звіт', 'Report')} {ri + 1} · {t(r.uk, r.en)}</h2>
            <p className="apack-d apack-method-lead">{t(r.descUk, r.descEn)} <b>{t(r.valueUk, r.valueEn)}</b></p>
            <div className="apack-grid">
              {chaptersOf(r.id).map((c, ci) => (
                <article key={c.id} className="apack-card">
                  <span className="apack-num mono">{ri + 1}.{String(ci + 1).padStart(2, '0')}</span>
                  <b className="apack-t">{t(c.uk, c.en)}</b>
                </article>
              ))}
            </div>
          </div>
        ))}

        <div className="apack-method">
          <h2 className="apack-ph-t mono">{t(`Методологія: E-commerce 360° · 12 аудитів · ${TOTAL_CHECKS}+ перевірок`, `Methodology: E-commerce 360° · 12 audits · ${TOTAL_CHECKS}+ checks`)}</h2>
          <p className="apack-d apack-method-lead">{t('Це не «аудит сайту». Ядро пакета — Звіт 2: діагностика всього бізнесу за 12 аудитами, кожен зі спільним каркасом: вердикт → методика → факти проти бенчмарків → знахідки з доказами → рекомендації з власником → звʼязки → що міряти через 90 днів.', 'This is not a “website audit”. The core of the pack is Report 2: a diagnosis of the whole business across 12 audits, each on a shared skeleton: verdict → method → facts vs benchmarks → evidenced findings → owned recommendations → links → what to measure in 90 days.')}</p>
          <div className="apack-blocks">
            {AUDIT_BLOCKS.map((b, i) => (
              <div key={b.key} className="apack-block">
                <span className="apack-num mono">{String(i + 1).padStart(2, '0')}</span>
                <b className="apack-bt">{t(b.uk, b.en)}</b>
                <p className="apack-bd">{t(b.taskUk, b.taskEn)}</p>
                <span className="apack-bn mono">{b.checks} {t('перевірок', 'checks')}</span>
                <p className="apack-bdocs mono">→ {t('Звіт 2, глава', 'Report 2, chapter')} 2.{String(i + 5).padStart(2, '0')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="apack-foot">
          <p className="sysx-lead">{t('Передача пакета — це не кінець: 4 години консультацій із розбором і контрольний дзвінок через 30 днів. А вартість аудиту зараховується у впровадження.', 'Handover is not the end: 4 hours of walkthrough consulting and a check-in call after 30 days. And the audit fee is credited toward implementation.')}</p>
          <div className="apack-ctas">
            <Link className="sysx-cta is-primary" to={`${lp('/contact')}?format=1`}>{t('Обговорити аудит →', 'Discuss the audit →')}</Link>
            <Link className="sysx-cta" to={lp('/pricing')}>{t('← Формати співпраці', '← Cooperation formats')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
