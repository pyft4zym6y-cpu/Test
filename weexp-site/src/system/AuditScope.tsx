import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { AUDIT_KINDS } from '@/data/auditScope';
import { AUDIT_BLOCKS, TOTAL_CHECKS } from '@/data/auditPack';
import './services.css';

/**
 * Склад глибокого аудиту — мовою клієнта.
 *
 * Один компонент на два місця: сторінку формату 01 і сторінку діагностики.
 * Написати перелік двічі було б рівно тією помилкою, яку цей сайт уже
 * виправляв у форматах співпраці й у процесі, — одна правда в двох файлах.
 *
 * На /diagnose він потрібен окремо. Сторінка обіцяла «діагностику за пʼять
 * хвилин» і на цьому закінчувалась: людина йшла з враженням, що аудит
 * WEEXP — це форма з семи полів. Насправді форма дає орієнтир, а аудит — це
 * 4–6 тижнів розбору всієї структури e-commerce.
 */
export function AuditScope({ compact = false }: {
  /** На /diagnose показуємо тільки назви: там головне — сам калькулятор. */
  compact?: boolean;
}) {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const i = lang === 'en' ? 1 : 0;

  return (
    <section className={'sysx srv srvf-scope' + (compact ? ' is-compact' : '')} aria-labelledby="scope-h">
      <div className="srvf-scope-in">
        <span className="sysx-kick">{t('Що саме перевіряємо', 'What exactly we check')}</span>
        <h2 id="scope-h" className="sysx-display srv-h2">
          {t(`${AUDIT_KINDS.length} аудитів усередині одного`, `${AUDIT_KINDS.length} audits inside one`)}
        </h2>
        <p className="srvf-txt srvf-kinds-l">
          {t(
            `Це не перевірка сайту. Ми розбираємо всю структуру e-commerce — від комерційної моделі й аналітики до операційних процесів і технологій: ${AUDIT_BLOCKS.length} доменів діагностики, ${TOTAL_CHECKS}+ перевірок, 4–6 тижнів роботи.`,
            `This is not a website check. We take apart the whole e-commerce structure — from the commercial model and analytics to operational processes and technology: ${AUDIT_BLOCKS.length} diagnostic domains, ${TOTAL_CHECKS}+ checks, 4–6 weeks of work.`,
          )}
        </p>

        <ol className="srvf-kind-list">
          {AUDIT_KINDS.map((k, n) => (
            <li key={k.name[0]} className="srvf-kind">
              <i className="srvf-kind-n mono" aria-hidden="true">{String(n + 1).padStart(2, '0')}</i>
              <div>
                <b>{k.name[i]}</b>
                {!compact && <p>{k.what[i]}</p>}
              </div>
            </li>
          ))}
        </ol>

        {compact && (
          <div className="srvf-scope-foot">
            <Link to={lp('/services/audit')} className="sysx-cta is-primary">
              {t('Детальніше про формат', 'More on this format')} 01 →
            </Link>
            <Link to={lp('/audit-pack')} className="srvf-pack-link mono">
              {t('Що ви отримаєте на виході', 'What you get at the end')} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
