import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { CASES, localizeCase } from '@/data/cases';
import { SERVICES, servicePath } from '@/data/services';
import { PROCESS, AFTER } from '@/data/process';
import { EXPERTISES, L } from '@/system/expertises';
import { TEAM } from '@/data/team';
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

/* ── Як ми це робимо: шість кроків великими цифрами ───────────────────────
   Процес існував лише на сторінці цін, у її середині. Питання «а як ви
   працюєте» людина ставить ДО ціни. */
export function HowWeWork() {
  const t = useT();
  const lang = useLang();
  const i = lang === 'en' ? 1 : 0;
  return (
    <section className="sysx hb hb-how" aria-labelledby="hb-how-h">
      <div className="hb-in">
        <span className="sysx-kick">{t('Прозоро, без сюрпризів', 'Transparent, no surprises')}</span>
        <h2 id="hb-how-h" className="sysx-display hb-h">{t('Як ми це робимо', 'How we do it')}</h2>
        <ol className="hb-steps">
          {PROCESS.map((s) => (
            <li key={s.n} className="hb-step">
              <i className="hb-step-n" aria-hidden="true">{s.n}</i>
              <div className="hb-step-t">
                <b>{s.title[i]}</b>
                <p>{s.text[i]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Життя після передачі ─────────────────────────────────────────────────
   Відповідь на питання, яке власник ставить останнім: «а що буде, коли ви
   підете». Доти вона існувала лише в умовах формату 02 на сторінці цін. */
export function AfterHandover() {
  const lang = useLang();
  const i = lang === 'en' ? 1 : 0;
  return (
    <section className="sysx hb hb-after" aria-labelledby="hb-after-h">
      <div className="hb-in">
        <h2 id="hb-after-h" className="sysx-display hb-h">{AFTER.title[i]}</h2>
        <div className="hb-after-txt">
          {AFTER.text.map((p) => <p key={p[0]}>{p[i]}</p>)}
        </div>
      </div>
    </section>
  );
}

/* ── Хто це робить ────────────────────────────────────────────────────────
   Розмір і склад команди — теж аргумент, і на головній його не було зовсім. */
export function TeamStrip() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  return (
    <section className="sysx hb hb-team" aria-labelledby="hb-team-h">
      <div className="hb-in">
        <span className="sysx-kick">{t('Хто це робить', 'Who does it')}</span>
        <h2 id="hb-team-h" className="sysx-display hb-h">
          {t('Команда', 'The team')} — <span className="sysx-em">{TEAM.length}</span> {t('ролей, у кожної своя зона', 'roles, each with its own zone')}
        </h2>
        <ul className="hb-team-list">
          {TEAM.map((r) => (
            <li key={r.role} className="hb-team-item">
              <b>{lang === 'en' ? (r.roleEn || r.role) : r.role}</b>
              <span>{lang === 'en' ? (r.zoneEn || r.zone) : r.zone}</span>
            </li>
          ))}
        </ul>
        <Link to={lp('/people')} className="hb-claim-link mono">{t('Про нас', 'About')} →</Link>
      </div>
    </section>
  );
}

/* ── Темний блок-завершення ───────────────────────────────────────────────
   Одна дія в кінці сторінки. Доти фінальна сцена фільму пропонувала три
   кнопки поруч — тобто не пропонувала жодної. */
export function ClosingCta() {
  const t = useT();
  const lp = useLp();
  return (
    <section className="sysx hb hb-close" aria-labelledby="hb-close-h">
      <div className="hb-in">
        <h2 id="hb-close-h" className="sysx-display hb-close-h">
          {t('Почнімо з діагнозу,', 'Let us start with a diagnosis,')}<br />
          {t('а не з пропозиції', 'not with a proposal')}
        </h2>
        <p className="hb-close-l">
          {t(
            'Безкоштовний експрес-розрахунок дає перше число — скільки виторгу витікає щороку — і головне вузьке місце. Далі, якщо потрібно, глибокий аудит.',
            'A free express estimate gives the first number — how much revenue leaks each year — and the main bottleneck. Then, if needed, the deep audit.',
          )}
        </p>
        {/* Одна дія. Доти поруч стояло друге посилання — «Залишити заявку», —
            тобто людині в кінці сторінки пропонували вибрати спосіб звернення
            замість того, щоб звернутись. Заявка нікуди не зникла: вона в шапці
            на кожній сторінці й окремим розділом у меню. */}
        <Link to={lp('/diagnose')} className="sysx-cta is-primary hb-close-cta">
          {t('Порахувати витік', 'Calculate the leak')} →
        </Link>
      </div>
    </section>
  );
}
