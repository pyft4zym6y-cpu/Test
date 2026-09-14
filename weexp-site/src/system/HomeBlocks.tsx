import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { CASES, localizeCase } from '@/data/cases';
import { SERVICES, servicePath } from '@/data/services';
import { EXPERTISES, L } from '@/system/expertises';
import { AUDIT_BLOCKS } from '@/data/auditPack';
import { AUDIT_KINDS_COUNT } from '@/data/auditScope';
import './home.css';

/**
 * Блоки головної сторінки після героя.
 *
 * ПОРЯДОК І Є ЗМІСТОМ ЗМІНИ. Доти головна йшла так: герой → шість метафоричних
 * сцен скрол-фільму («частини мають працювати як одне») → вісім систем →
 * чотири рівні пропозиції → меседжинг за роллю → механіка довіри → FAQ.
 * Тобто пʼять екранів методології до першого доказу і жодної згадки про те,
 * що саме людина може купити й за скільки.
 *
 * Тепер: доказ → послуга → зона робіт → чим лагодимо → з чим приходять →
 * як працюємо → що буде після → хто це робить. Кожен блок відповідає на одне
 * питання й закінчується; лірика лишилась рівно в одному місці — герої.
 *
 * Усі блоки в одному файлі навмисно: вони йдуть підряд і вантажаться разом,
 * а сім окремих lazy-чанків дали б сім запитів на одну прокрутку.
 */

/** Скільки кейсів показуємо на головній. Решта — на /proof. */
const HOME_CASES = 5;

/* ── Рядок експертизи: одне речення з числом, одразу перед кейсами ─────────
   Числа рахуються з даних. Набрані руками, вони мовчки застаріли б при
   наступному доданому кейсі — цю помилку сайт уже проходив. */
export function HomeProofLine() {
  const t = useT();
  const nis = new Set(CASES.map((c) => c.cat.split('·')[0].trim())).size;
  return (
    <section className="sysx hb hb-claim" aria-labelledby="hb-claim-h">
      <div className="hb-in">
        <h2 id="hb-claim-h" className="hb-claim-h">
          {t(
            `Ми перебудували онлайн-продажі ${CASES.length} компаній у ${nis} нішах — з вітрини на керовану систему.`,
            `We have rebuilt online sales for ${CASES.length} companies across ${nis} niches — from a storefront into a managed system.`,
          )}
        </h2>
      </div>
    </section>
  );
}

/* ── Комплексність: що саме ми закриваємо ────────────────────────────────
 *
 * ПОЗИЦІЮВАННЯ, ЯКОГО НА САЙТІ НЕ БУЛО СКАЗАНО ПРЯМО.
 *
 * Сайт обіцяв більше продажів, називав три формати й девʼять експертиз — але
 * ніде не казав головного: ми беремо ВСЮ структуру e-commerce, а не одну
 * ділянку. Для власника це різниця між «ще один підрядник по рекламі» і «ті,
 * хто відповідає за результат цілком»; саме вона вирішує, чи є сенс писати.
 *
 * Числа рахуються з даних — тих самих, за якими зібраний аудит. Набрані
 * руками, вони розійшлися б із першою ж правкою переліку.
 */
export function Coverage() {
  const t = useT();
  const lang = useLang();
  return (
    <section className="sysx hb hb-cover" aria-labelledby="hb-cover-h">
      <div className="hb-in">
        <span className="sysx-kick">{t('Комплексний e-commerce', 'Full-scope e-commerce')}</span>
        <h2 id="hb-cover-h" className="sysx-display hb-h">
          {t('Не одна ділянка, а ', 'Not one slice, but ')}<span className="sysx-em">{t('вся структура продажів', 'the whole sales structure')}</span>
        </h2>
        <p className="hb-cover-l">
          {t(
            'Реклама, сайт, склад і аналітика ламаються разом і лагодяться разом. Ми дивимось усі домени одразу — і починаємо з того, який коштує вам найдорожче.',
            'Ads, site, warehouse and analytics break together and are fixed together. We look at every domain at once — and start with the one costing you the most.',
          )}
        </p>
        <ul className="hb-cover-nums">
          <li><b>{AUDIT_BLOCKS.length}</b><span>{t('доменів діагностики', 'diagnostic domains')}</span></li>
          <li><b>{AUDIT_KINDS_COUNT}</b><span>{t('видів аудиту всередині одного', 'audit types inside one')}</span></li>
          <li><b>{EXPERTISES.length}</b><span>{t('експертиз, якими це закриваємо', 'expertise areas that close it')}</span></li>
        </ul>
        <ul className="hb-cover-chips" aria-label={t('Домени діагностики', 'Diagnostic domains')}>
          {AUDIT_BLOCKS.map((b) => (
            <li key={b.key} className="hb-cover-chip">{lang === 'en' ? b.en : b.uk}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Що буде після заявки ─────────────────────────────────────────────────
 *
 * Головна дія сайту — написати нам. Найбільше їй заважає не ціна й не довіра
 * до експертизи, а невідомість: скільки чекати відповіді, чи буде дзвінок із
 * презентацією на сорок слайдів, чи доведеться щось вирішувати одразу.
 *
 * Три рядки знімають рівно це. Вони стоять ПЕРЕД запереченнями й фінальною
 * кнопкою: спершу людина бачить, що перший крок дешевий, і аж потім її
 * просять його зробити.
 */
export function AfterRequest() {
  const t = useT();
  const STEPS: [string, string][][] = [
    [['Ви пишете у двох реченнях', 'You write two sentences'], ['Що відбувається й чого хочеться. Без брифів і анкет.', 'What is going on and what you want. No briefs or forms.']],
    [['Відповідаємо протягом робочого дня', 'We reply within a business day'], ['Домовляємось на 30 хвилин розмови у зручний час.', 'We agree on a 30-minute call at a time that suits you.']],
    [['Кажемо прямо, чи можемо допомогти', 'We say straight if we can help'], ['Якщо так — надсилаємо, що і за скільки. Якщо ні — теж скажемо.', 'If yes — we send what and for how much. If not — we say that too.']],
  ];
  const i = 0;
  return (
    <section className="sysx hb hb-after" aria-labelledby="hb-after-h">
      <div className="hb-in">
        <span className="sysx-kick">{t('Перший крок', 'The first step')}</span>
        <h2 id="hb-after-h" className="sysx-display hb-h">{t('Що буде після заявки', 'What happens after you write')}</h2>
        <ol className="hb-after-steps">
          {STEPS.map((st, k) => (
            <li key={st[0][0]} className="hb-after-step">
              <i className="hb-after-n" aria-hidden="true">{String(k + 1).padStart(2, '0')}</i>
              <b>{t(st[0][i], st[0][1])}</b>
              <span>{t(st[1][i], st[1][1])}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Кейси великими числами ───────────────────────────────────────────────
   Кейсів на головній не було взагалі: доказ жив на окремій сторінці, куди з
   головної вів один рядок дрібним шрифтом. */
export function HomeCases() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const items = CASES.slice(0, HOME_CASES).map((c) => localizeCase(c, lang));
  return (
    <section className="sysx hb hb-cases" aria-labelledby="hb-cases-h">
      <div className="hb-in">
        <span className="sysx-kick">{t('Що з цього виходить', 'What comes out of it')}</span>
        <h2 id="hb-cases-h" className="sysx-display hb-h">{t('Кейси', 'Cases')}</h2>

        <ol className="hb-case-list">
          {items.map((c) => (
            <li key={c.slug} className="hb-case">
              <div className="hb-case-who">
                <span className="hb-case-cat mono">{c.cat}</span>
                <b className="hb-case-name">{c.name}</b>
                <p className="hb-case-lead">{c.lead}</p>
                <span className="hb-case-win mono">⚡ {c.window}</span>
              </div>
              <ul className="hb-nums">
                <li className="hb-num">
                  <b>{c.hero}</b>
                  <span>{c.heroLabel}</span>
                </li>
                {/* Метрики того самого рангу, що й головне число: усі три —
                    результат. Доти вони були вдвічі дрібніші. */}
                {c.metrics.slice(0, 2).map((m) => (
                  <li key={m.label} className="hb-num">
                    <b>{m.after}</b>
                    <span>{m.label} — {t('було', 'was')} {m.before}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        {/* Підпис канонічний: «Кейси» — так само, як пункт меню й крихта.
            «Усі кейси» було б другим імʼям для однієї дії. */}
        <Link to={lp('/proof')} className="sysx-cta is-primary">
          {t('Кейси', 'Cases')} →
        </Link>
      </div>
    </section>
  );
}

/* ── Три формати як продукт ───────────────────────────────────────────────
   Доти вони лежали всередині сторінки цін: щоб дізнатись, що саме WEEXP
   продає, треба було спершу натиснути «Ціни». */
export function HomeServices() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const i = lang === 'en' ? 1 : 0;
  return (
    <section className="sysx hb hb-serv" aria-labelledby="hb-serv-h">
      <div className="hb-in">
        <span className="sysx-kick">{t('Що ми робимо', 'What we do')}</span>
        <h2 id="hb-serv-h" className="sysx-display hb-h">{t('Три формати роботи', 'Three ways to work')}</h2>
        <p className="sysx-lead hb-lead">
          {t(
            'Відрізняються не «пакетом послуг», а тим, хто відповідає за результат: ваша команда з нашою картою, ваша команда під нашим контролем — чи ми повністю.',
            'They differ not by «service package» but by who is accountable for the result: your team with our map, your team under our control — or us entirely.',
          )}
        </p>

        <ul className="hb-serv-grid">
          {SERVICES.map((s) => (
            <li key={s.slug} className={'hb-serv-card' + (s.featured ? ' is-featured' : '')}>
              <span className="hb-serv-n mono">{s.n}</span>
              <h3 className="hb-serv-name">{s.name[i]}</h3>
              <p className="hb-serv-promise">{s.promise[i]}</p>
              <div className="hb-serv-price">
                <b>{s.price[i]}</b>
                <span className="mono">{s.period[i]}</span>
              </div>
              <Link to={lp(servicePath(s))} className="hb-serv-link mono">
                {t('Детальніше про формат', 'More on this format')} →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Експертизи плоским переліком ─────────────────────────────────────────
   Девʼять експертиз доти стояли картками — тобто в тому самому ранзі, що й
   формати співпраці. Людина бачила два переліки однакової ваги й мусила сама
   вирішити, що з них вона купує. Експертиза — не товар, а зона робіт: перелік,
   а не вітрина. Посилання лишились: у кожної є власна сторінка. */
export function HomeExpertise() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  return (
    <section className="sysx hb hb-exp" aria-labelledby="hb-exp-h">
      <div className="hb-in">
        <span className="sysx-kick">{t('Чим лагодимо', 'What we fix it with')}</span>
        <h2 id="hb-exp-h" className="sysx-display hb-h">{t('Наші експертизи', 'Our expertise')}</h2>
        <ul className="hb-exp-list">
          {EXPERTISES.map((e) => (
            <li key={e.slug}>
              <Link to={lp(`/expansion/${e.slug}`)} className="hb-exp-item">
                <i aria-hidden="true" />{L(e.title, lang)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Процес, «життя після» і команда з головної пішли ─────────────────────
 *
 * Не видалені — переставлені туди, де на них є питання:
 *   — шість кроків процесу читає той, хто вже обирає формат, тож вони живуть
 *     на сторінці формату (ServiceFormat, дані з @/data/process);
 *   — «життя після передачі» стало питанням у FAQ: це заперечення, яке ставлять
 *     один раз і останнім, а не розділ на третину екрана;
 *   — склад команди — на /people, куди веде і меню, і підвал.
 *
 * На головній вони разом займали 2.8 екрана й 314 слів, стоячи між доказом і
 * дією. Замір: 13 блоків, 12.2 екрана, 1204 слова — і остання секція сторінки
 * вела не до заявки, а в блог.
 */

/* ── Темний блок-завершення ───────────────────────────────────────────────
 * Одна дія в кінці сторінки. Доти фінальна сцена фільму пропонувала три кнопки
 * поруч — тобто не пропонувала жодної.
 *
 * Сам блок переїхав в окремий модуль: його потребує не лише головна, а поки він
 * лежав тут, разом із ним довелось би тягнути чанк усіх блоків головної — і
 * тому /blog закінчувався нічим. Реекспорт лишається, щоб SystemInMotion не
 * переписував свої імпорти.
 */
export { ClosingCta } from '@/system/ClosingCta';
