import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { EXPERTISES, L } from '@/system/expertises';
import './system.css';

/**
 * Хаб «Експертизи» — девʼять напрямів роботи. Кожен веде на свою підсторінку
 * /expansion/:slug.
 *
 * Сторінка мала ТРИ назви: пункт меню казав «Експертизи», заголовок сторінки —
 * «Екосистема партнерів», а title у видачі — «Експертизи WEEXP — напрями
 * роботи». Людина тиснула одне, потрапляла на друге, а в закладці бачила третє.
 * Тепер заголовок збігається з меню, а розповідь про перевірену мережу
 * партнерів лишилась — але нижче, як пояснення, а не як назва сторінки.
 *
 * Експертиза — НЕ те, що купують: купують формат співпраці (/services).
 * Експертиза — зона робіт усередині будь-якого з них, і тепер сторінка це
 * каже прямо, а не лишає людині здогадуватись, чим «Брендинг» відрізняється
 * від «Аудиту» в сусідньому пункті меню.
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
          <span className="sysx-kick">{t('Девʼять напрямів · зона робіт', 'Nine areas · scope of work')}</span>
          <h1 className="sysx-display xhub-h1">{t('Наші ', 'Our ')}<span className="hl">{t('експертизи', 'expertise')}</span></h1>
          <p className="sysx-lead">{t('Девʼять напрямів, якими ми закриваємо задачі. Це не окремі продукти: експертизи входять у будь-який із трьох форматів співпраці — змінюється тільки те, хто тримає кермо.', 'Nine areas through which we close the work. These are not separate products: the expertise goes into any of the three cooperation formats — only who holds the wheel changes.')}</p>
          <p className="xhub-arch">
            <Link to={lp('/services')} className="xhub-arch-link mono">{t('Формати роботи', 'Ways to work')} →</Link>
          </p>
          {/* Перевірена мережа — пояснення, а не назва сторінки: доти цей абзац
              стояв заголовком і людина не розуміла, куди потрапила. */}
          <p className="xhub-arch">{t('Вам не треба самостійно шукати, перевіряти й порівнювати десятки виконавців: ми вже сформували мережу лідерів ринку в кожному напрямі й під конкретну задачу підбираємо найсильніших. Зверху екосистеми — WEEXP: ', 'You do not need to search for, vet and compare dozens of contractors yourself: we have already built a network of market leaders in each area and pick the strongest for the task at hand. On top of the ecosystem — WEEXP: ')}<b>E-commerce Architecture &amp; Management</b>. {t('Ми визначаємо, що, навіщо і в якій послідовності робити, — мережа закриває конкретні компетенції.', 'We define what, why and in what order to do it — the network closes the specific competencies.')}</p>
        </header>

        <div className="xhub-grid">
          {EXPERTISES.map((e, i) => (
            <Link key={e.slug} to={lp(`/expansion/${e.slug}`)} className="xhub-card">
              <span className="xhub-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="xhub-tag">{L(e.tag, lang)}</span>
              <h2 className="sysx-display xhub-card-h">{L(e.title, lang)}</h2>
              <span className="script xhub-script">{L(e.tagline, lang)}</span>
              {/* Спершу задача власника, потім наш опис. Без цього рядка блок
                  читається як перелік послуг, з якого клієнт має сам здогадатись,
                  навіщо це йому. */}
              <p className="xhub-job">{L(e.job, lang)}</p>
              <p className="xhub-card-p">{L(e.intro, lang)}</p>
              <span className="xhub-more">{t('Детальніше', 'Learn more')} →</span>
            </Link>
          ))}
        </div>

        <div className="xhub-cta">
          <div>
            <span className="sysx-kick">{t('Не знаєте, з чого почати?', 'Not sure where to start?')}</span>
            <b className="sysx-display xhub-cta-h">{t('Почніть з ', 'Start with ')}<span className="hl-y">Express Audit</span></b>
          </div>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
