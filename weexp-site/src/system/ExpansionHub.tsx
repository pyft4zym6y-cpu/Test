import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { EXPERTISES, L } from '@/system/expertises';
import './system.css';

/**
 * Індекс експертиз — девʼять напрямів, кожен веде на свою сторінку.
 *
 * БУВ ХАБОМ НА 873 СЛОВА Й 8.3 ЕКРАНА: девʼять карток, у кожній тег, заголовок,
 * рукописний підзаголовок, задача власника й абзац опису — плюс абзац про
 * мережу партнерів на сім рядків. Тобто перед тим, як натиснути потрібний
 * напрям, людина читала переказ усіх девʼяти.
 *
 * Індекс — це список. Розгорнутий опис живе на сторінці напряму, куди людина
 * і йде за ним; там він доречний, бо вона вже обрала, про що читати.
 *
 * Експертиза — НЕ те, що купують: купують формат співпраці (/services).
 * Тому сторінки немає в головному меню: вона конкурувала з «Послугами» й
 * відводила вбік того, хто шукав, що саме замовити. Вхід на неї — з послуг,
 * із підвалу і з пошуку.
 */
export function ExpansionHub() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  return (
    <section className="sysx xhub">
      <div className="sysx-field" aria-hidden="true" />
      <div className="xhub-in">
        <header className="xhub-head">
          <span className="sysx-kick">{t('Зона робіт', 'Scope of work')}</span>
          <h1 className="sysx-display xhub-h1">{t('Наші ', 'Our ')}<span className="hl">{t('експертизи', 'expertise')}</span></h1>
          <p className="sysx-lead">{t('Девʼять напрямів, якими ми закриваємо задачі. Це не окремі продукти: вони входять у будь-який із трьох форматів — змінюється лише те, хто тримає кермо.', 'Nine areas through which we close the work. Not separate products: they go into any of the three formats — only who holds the wheel changes.')}</p>
        </header>

        <ul className="xhub-list">
          {EXPERTISES.map((e, i) => (
            <li key={e.slug}>
              <Link to={lp(`/expansion/${e.slug}`)} className="xhub-row">
                <span className="xhub-n mono">{String(i + 1).padStart(2, '0')}</span>
                <b className="xhub-row-h">{L(e.title, lang)}</b>
                <span className="xhub-row-j">{L(e.job, lang)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="xhub-cta">
          <div>
            <span className="sysx-kick">{t('З чого почати?', 'Where to start?')}</span>
            <b className="sysx-display xhub-cta-h">{t('Почніть з ', 'Start with ')}<span className="hl-y">{t('аудиту', 'the audit')}</span></b>
          </div>
          <div className="sysx-cta-row">
            <Link to={lp('/contact')} className="sysx-cta is-primary">{t('Залишити заявку', 'Leave a request')} →</Link>
            <Link to={lp('/diagnose')} className="sysx-cta">{t('Порахувати витік', 'Calculate the leak')} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
