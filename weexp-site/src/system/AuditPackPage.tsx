import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import { PACK_PHASES, packByPhase } from '@/data/auditPack';
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
          <p className="sysx-lead">{t('Жодних «звітів у повітрі»: до старту ви бачите повний перелік документів, які отримаєте. Кожен артефакт — окремий документ із висновками, доказами або планом.', 'No “reports in the air”: before we start you see the full list of documents you will receive. Each artifact is a separate document with conclusions, evidence or a plan.')}</p>
        </header>

        {PACK_PHASES.map((ph) => (
          <div key={ph.key} className="apack-phase">
            <h2 className="apack-ph-t mono">{t(ph.uk, ph.en)}</h2>
            <div className="apack-grid">
              {packByPhase(ph.key).map((a) => {
                n += 1;
                return (
                  <article key={a.id} className={'apack-card' + (a.audience === 'internal' ? ' is-int' : '')}>
                    <span className="apack-num mono">{String(n).padStart(2, '0')}</span>
                    <b className="apack-t">{t(a.uk, a.en)}</b>
                    <p className="apack-d">{t(a.descUk, a.descEn)}</p>
                    <span className={'apack-aud mono' + (a.audience === 'internal' ? ' int' : '')}>{a.audience === 'client' ? t('передається вам', 'handed to you') : t('робочий документ · на запит', 'working doc · on request')}</span>
                  </article>
                );
              })}
            </div>
          </div>
        ))}

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
