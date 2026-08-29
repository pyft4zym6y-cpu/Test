import { Link, useSearchParams } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { PACK_REPORTS, PACK_VOLUMES, PACK_DOC_COUNT, PACK_AUDITS, chaptersOf, AUDIT_BLOCKS, TOTAL_CHECKS, auditOfBlock } from '@/data/auditPack';
import './system.css';

/**
 * /audit-pack — публічний склад пакета глибокого аудиту: 5 ємких звітів
 * (обіцянка формату 01 на /pricing), кожен зі змістом і конечною цінністю.
 * Спеціалізовані аудити — глави Звіту 2. Джерело — src/data/auditPack.ts
 * (той самий канон, що й чеклист готовності в адмінці).
 */
export function AuditPackPage() {
  const t = useT();
  const lang = useLang();
  const lp = useLp();
  const [params, setParams] = useSearchParams();
  const scope = params.get('scope') === 'dept' ? 'dept' : 'store';
  const setScope = (v: 'store' | 'dept') => setParams({ scope: v }, { replace: true });
  const volumes = PACK_VOLUMES.filter((v) => scope === 'dept' || v.scope === 'both');
  // Той самий рахунок, що й PACK_DOC_COUNT, але з урахуванням фільтра томів
  // на сторінці. Розбіжність між ними тримає тест auditPack.test.ts.
  const docCount = PACK_REPORTS.length + volumes.length;
  const N = PACK_AUDITS.length;   // 13-й аудит додано — число більше не пишемо руками
  return (
    <section className="sysx apack" aria-label={t('Склад пакета аудиту', 'Audit pack contents')}>
      <div className="sysx-field" aria-hidden="true" />
      <div className="apack-in">
        <header className="apack-head">
          <span className="sysx-kick">{t('Формат 01 · Аудит · що всередині', 'Format 01 · Audit · what is inside')}</span>
          <h1 className="sysx-display apack-h1">{t('Пакет аудиту — ', 'The audit pack — ')}<span className="sysx-em">{docCount} {t('документів', 'documents')}</span></h1>
          <div className="apack-scopes" role="tablist" aria-label={t('Глибина аудиту', 'Audit depth')}>
            <button role="tab" aria-selected={scope === 'store'} className={'apack-scope' + (scope === 'store' ? ' is-on' : '')} onClick={() => setScope('store')}>
              <b>{t('Аудит інтернет-магазину', 'Online-store audit')}</b><span className="mono">$2,900</span>
            </button>
            <button role="tab" aria-selected={scope === 'dept'} className={'apack-scope' + (scope === 'dept' ? ' is-on' : '')} onClick={() => setScope('dept')}>
              <b>{t('Аудит відділу e-commerce', 'E-commerce department audit')}</b><span className="mono">$4,900</span>
            </button>
          </div>
          <p className="sysx-lead">{scope === 'dept'
            ? t(`Повна глибина: діагностика всього відділу e-commerce за ${N} аудитами — від економіки й каналів до операцій, команди, організації та експансії. 5 звітів + 5 посторінкових томів «зараз → як треба» + повноробочий Гант-план Excel.`, `Full depth: a diagnosis of the entire e-commerce department across the ${N} audits — from economics and channels to operations, team, organisation and expansion. 5 reports + 5 page-by-page “now → should-be” volumes + a fully working Excel Gantt.`)
            : t('Фокус на магазині та шляху клієнта: сайтові аудити з 12, кожна сторінка поблочно проти еталона, контент і SEO, 15 етапів шляху клієнта. 5 звітів + 4 посторінкові томи «зараз → як треба» + повноробочий Гант-план Excel.', 'Focus on the store and the customer journey: the site audits of the 12, every page block-by-block against the benchmark, content and SEO, the 15 journey stages. 5 reports + 4 page-by-page “now → should-be” volumes + a fully working Excel Gantt.')}</p>
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

        <div className="apack-phase">
          <h2 className="apack-ph-t mono">{t('Робочі томи та інструменти', 'Working volumes & tools')}</h2>
          <p className="apack-d apack-method-lead">{t('Звіти кажуть «що і чому», томи показують «де саме і як має бути»: кожна сторінка, кожен блок і кожен етап шляху — парами «зараз → як треба» з дельтами. Гант — робочий Excel-файл, у якому живе проєкт.', 'Reports say “what and why”; the volumes show “exactly where and how it should be”: every page, block and journey stage as “now → should-be” pairs with deltas. The Gantt is a working Excel file the project lives in.')}</p>
          <div className="apack-grid">
            {volumes.map((v) => (
              <article key={v.id} className="apack-card apack-vol">
                <b className="apack-t">{t(v.uk, v.en)}</b>
                <p className="apack-bd">{t(v.descUk, v.descEn)}</p>
                <span className="apack-bn mono">{lang === 'en' ? v.volEn : v.vol}</span>
              </article>
            ))}
            {scope === 'store' && (
              <article className="apack-card apack-vol is-dim">
                <b className="apack-t">{t('Том D · Стартові шаблони', 'Volume D · Starter templates')}</b>
                <p className="apack-bd">{t('Вакансія PM, політика знижок із розрахунком, сценарій читки — входить в аудит відділу e-commerce.', 'PM job description, discount policy with a worked example, review script — included in the department audit.')}</p>
                <button className="apack-bn mono apack-up" onClick={() => setScope('dept')}>{t('→ у аудиті відділу $4,900', '→ in the department audit $4,900')}</button>
              </article>
            )}
          </div>
        </div>

        <div className="apack-method">
          <h2 className="apack-ph-t mono">{t(`Методологія: E-commerce 360° · ${N} аудитів · ${TOTAL_CHECKS}+ перевірок`, `Methodology: E-commerce 360° · ${N} audits · ${TOTAL_CHECKS}+ checks`)}</h2>
          <p className="apack-d apack-method-lead">{t(`Це не «аудит сайту». Ядро пакета — Звіт 2: діагностика всього бізнесу за ${N} аудитами, кожен зі спільним каркасом: вердикт → методика → факти проти бенчмарків → знахідки з доказами → рекомендації з власником → звʼязки → що міряти через 90 днів.`, `This is not a “website audit”. The core of the pack is Report 2: a diagnosis of the whole business across ${N} audits, each on a shared skeleton: verdict → method → facts vs benchmarks → evidenced findings → owned recommendations → links → what to measure in 90 days.`)}</p>
          <div className="apack-blocks">
            {AUDIT_BLOCKS.map((b, i) => {
              const siteCore = ['product', 'customer', 'website', 'seo', 'marketing', 'crm', 'analytics'].includes(b.key);
              const dim = scope === 'store' && !siteCore;
              const au = auditOfBlock(b.key);
              return (
              <details key={b.key} className={'apack-block' + (dim ? ' is-dim' : '')}>
                {/* <details>, а не кнопка на стані: розкривається без JS,
                    доступний з клавіатури «з коробки», і вміст лишається в
                    розмітці — його бачать і пошук, і AI-асистенти. */}
                <summary className="apack-bsum">
                  <span className="apack-num mono">{String(i + 1).padStart(2, '0')}</span>
                  <b className="apack-bt">{t(b.uk, b.en)}</b>
                  <p className="apack-bd">{t(b.taskUk, b.taskEn)}</p>
                  <span className="apack-bn mono">{b.checks} {t('перевірок', 'checks')}</span>
                  <span className="apack-bmore mono" aria-hidden="true">+</span>
                </summary>
                {au && (
                  <div className="apack-bopen">
                    {/* Англійського опису в каталозі немає — показувати
                        українську англомовному відвідувачу гірше, ніж не
                        показувати нічого. Решта полів мовно-нейтральна. */}
                    {lang !== 'en' && <p className="apack-bopen-d">{au.descUk}</p>}
                    <dl className="apack-bmeta mono">
                      <div><dt>{t('Код', 'Code')}</dt><dd>{au.code}</dd></div>
                      <div><dt>{t('Рушій', 'Engine')}</dt>
                        <dd>{au.engine.length ? au.engine.join(' · ') : t('збирається аналітиком', 'assembled by the analyst')}</dd></div>
                      <div><dt>{t('Методики', 'Playbooks')}</dt><dd>{au.skills.join(' · ')}</dd></div>
                      <div><dt>{t('Глибина', 'Depth')}</dt>
                        <dd>{au.scope === 'dept' ? t('лише аудит відділу', 'department audit only') : t('обидва формати', 'both formats')}</dd></div>
                    </dl>
                  </div>
                )}
                <p className="apack-bdocs mono">{dim ? t('→ в аудиті відділу e-commerce', '→ in the department audit') : `→ ${t('Звіт 2, глава', 'Report 2, chapter')} 2.${String(i + 5).padStart(2, '0')}`}</p>
              </details>
              );
            })}
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
