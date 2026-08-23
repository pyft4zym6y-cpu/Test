import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import { PACK_PHASES, packByPhase, AUDIT_BLOCKS, TOTAL_CHECKS, PACK_SHORT } from '@/data/auditPack';
import './system.css';

/**
 * /audit-pack — публічний склад пакета глибокого аудиту: ті самі «19 артефактів»
 * з формату 01 на /pricing, розгорнуті поіменно. Прозорість продажу: клієнт до
 * оплати бачить, що саме отримає. Джерело переліку — src/data/auditPack.ts
 * (той самий, що й чеклист готовності в адмінці).
 */
export function AuditPackPage() {
  const t = useT();
  const lp = useLp();
  let n = 0;
  return (
    <section className="sysx apack" aria-label={t('Склад пакета аудиту', 'Audit pack contents')}>
      <div className="sysx-field" aria-hidden="true" />
      <div className="apack-in">
        <header className="apack-head">
          <span className="sysx-kick">{t('Формат 01 · Аудит · що всередині', 'Format 01 · Audit · what is inside')}</span>
          <h1 className="sysx-display apack-h1">{t('Пакет аудиту — ', 'The audit pack — ')}<span className="sysx-em">{t('19 артефактів', '19 artifacts')}</span></h1>
          <p className="sysx-lead">{t('Жодних «звітів у повітрі»: до старту ви бачите повний перелік. 19 повноцінних документів — від Презентації, Матриці зрілості, Роадмапи, Плану 90 днів і Цільової моделі до детальних звітів 12 аудитів та доказової бази. Кожен — робочий інструмент, не додаток.', 'No “reports in the air”: before we start you see the full list. 19 full documents — from the Presentation, Maturity matrix, Roadmap, 90-day plan and Target model to the detailed reports of the 12 audits and the evidence base. Each one is a working tool, not an appendix.')}</p>
        </header>

        {PACK_PHASES.map((ph) => (
          <div key={ph.key} className="apack-phase">
            <h2 className="apack-ph-t mono">{t(ph.uk, ph.en)}</h2>
            <div className="apack-grid">
              {packByPhase(ph.key).map((a) => {
                n += 1;
                return (
                  <article key={a.id} className="apack-card">
                    <span className="apack-num mono">{String(n).padStart(2, '0')}</span>
                    <b className="apack-t">{t(a.uk, a.en)}</b>
                    <p className="apack-d">{t(a.descUk, a.descEn)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        ))}

        <div className="apack-method">
          <h2 className="apack-ph-t mono">{t(`Методологія: E-commerce 360° · 12 блоків · ${TOTAL_CHECKS}+ перевірок`, `Methodology: E-commerce 360° · 12 blocks · ${TOTAL_CHECKS}+ checks`)}</h2>
          <p className="apack-d apack-method-lead">{t('Це не «аудит сайту». Кожен документ пакета спирається на діагностику всього бізнесу за 12 блоками — від економіки до команди. Business → Market → Product → Customer → Website → SEO/GEO → Marketing → CRM → Analytics → Operations → Technology → Organization.', 'This is not a “website audit”. Every document rests on a diagnosis of the whole business across 12 blocks — from economics to the team.')}</p>
          <div className="apack-blocks">
            {AUDIT_BLOCKS.map((b, i) => (
              <div key={b.key} className="apack-block">
                <span className="apack-num mono">{String(i + 1).padStart(2, '0')}</span>
                <b className="apack-bt">{t(b.uk, b.en)}</b>
                <p className="apack-bd">{t(b.taskUk, b.taskEn)}</p>
                <span className="apack-bn mono">{b.checks} {t('перевірок', 'checks')}</span>
                <p className="apack-bdocs mono">→ {b.docs.map((d) => PACK_SHORT[d]).filter(Boolean).join(' · ')}</p>
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
