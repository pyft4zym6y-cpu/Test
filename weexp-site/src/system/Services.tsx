import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { useJsonLd } from '@/lib/seo';
import { useState } from 'react';
import { EXPERTISES, L } from '@/system/expertises';
import { SERVICES, servicePath, COMPARE } from '@/data/services';
import './system.css';
import './home.css';
import './services.css';

/**
 * /services — хаб послуг. Перший пункт меню й перша відповідь на питання, з
 * яким людина приходить: «що ви для мене робите».
 *
 * Доти такої сторінки не було взагалі. Три формати співпраці — єдине, що
 * клієнт справді купує, — лежали всередині /pricing, під заголовком «Три
 * формати за рівнем нашої відповідальності». Щоб дізнатись, ЩО продає WEEXP,
 * треба було спершу натиснути «Ціни».
 *
 * Розподіл між цією сторінкою і /pricing свідомий: тут — що це за формат і
 * кому він, там — порівняльна таблиця й умови поруч. Джерело в обох одне
 * (data/services.ts), тому розійтися вони не можуть.
 */
export function Services() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const i = lang === 'en' ? 1 : 0;
  const [open, setOpen] = useState<number | null>(0);

  const FAQ = [
    { q: t('З чого починається робота?', 'How does it start?'),
      a: t('З аудиту. Без діагностики ми не консультуємо і не беремо управління: вести проєкт без карти означає вести його навмання.',
           'With the audit. Without diagnostics we neither advise nor take over delivery: running a project without a map means running it blind.') },
    { q: t('Коли буде перший результат?', 'When is the first result?'),
      a: t('Перший вимірюваний — за 30–60 днів після старту робіт. Швидкі перемоги планують у першу хвилю навмисно: вони фінансують наступні.',
           'The first measurable one — within 30–60 days of kickoff. Quick wins are planned into the first wave on purpose: they fund the ones that follow.') },
    { q: t('Чим захищений мій бюджет?', 'How is my budget protected?'),
      a: t('Кожен етап має Definition of Done — вимірюваний критерій приймання. Наступний транш стартує лише після прийнятого попереднього.',
           'Each stage has a Definition of Done — a measurable acceptance criterion. The next tranche starts only after the previous one is accepted.') },
    { q: t('У нас своя CMS і своя специфіка', 'We have our own CMS and specifics'),
      a: t('Підхід платформо-незалежний. Міграцію пропонуємо лише тоді, коли нинішня система справді впирається в стелю, — і показуємо це цифрами.',
           'The approach is platform-independent. We propose migration only when the current system genuinely hits its ceiling — and we show it in numbers.') },
    { q: t('Чому дешевше за ринок?', 'Why cheaper than the market?'),
      a: t('Ринок США бере за таку експертизу $75–250/год. Ми працюємо напряму, без офісних накладних агенції: ви платите за експертизу, а не за бренд.',
           'The US market charges $75–250/hr for this expertise. We work directly, without an agency\u2019s office overhead: you pay for expertise, not for a brand.') },
  ];

  useJsonLd('services-list', {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('Послуги WEEXP', 'WEEXP services'),
    itemListElement: SERVICES.map((s, k) => ({
      '@type': 'ListItem', position: k + 1, name: s.name[i],
      url: 'https://weexp.agency' + (lang === 'en' ? '/en' : '') + servicePath(s),
    })),
  });

  return (
    <section className="sysx srv" aria-label={t('Послуги', 'Services')}>
      <div className="sysx-field" aria-hidden="true" />
      <div className="srv-in">
        <header className="srv-head">
          <span className="sysx-kick">{t('Три формати роботи', 'Three ways to work')}</span>
          <h1 className="sysx-display srv-h1">{t('Що ми ', 'What we ')}<span className="sysx-em">{t('робимо', 'do')}</span></h1>
          <p className="sysx-lead srv-lead">
            {t(
              'Ми перебудовуємо онлайн-продажі: знаходимо, де витікають гроші, і закриваємо це руками — своїми або вашими. Формати відрізняються не «пакетом послуг», а тим, хто відповідає за результат.',
              'We rebuild online sales: we find where the money leaks and close it — with our hands or yours. The formats differ not by «service package» but by who is accountable for the result.',
            )}
          </p>
        </header>

        {/* Аудит — обовʼязкові ворота в обидва інші формати. Якщо не сказати це
            тут, три картки читаються як меню з рівноцінних варіантів. */}
        <p className="srv-seq mono">
          <b>{t('Крок 1 — аудит.', 'Step 1 — the audit.')}</b>{' '}
          {t('Без діагностики ми не консультуємо і не беремо управління. Чим продовжити — 02 чи 03 — вирішуєте за його результатом.',
             'Without the diagnosis we neither advise nor take over delivery. Which way to continue — 02 or 03 — you decide from its result.')}
        </p>

        <ul className="hb-serv-grid srv-grid">
          {SERVICES.map((s) => (
            <li key={s.slug} className={'hb-serv-card' + (s.featured ? ' is-featured' : '')}>
              <span className="hb-serv-n mono">{s.n} · {s.tag[i]}</span>
              <h2 className="hb-serv-name">{s.name[i]}</h2>
              <p className="hb-serv-promise">{s.promise[i]}</p>
              <p className="srv-for">{s.forWhom[i]}</p>
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

        {/*
          * Порівняння форматів поруч. Переїхало зі сторінки цін, яка описувала
          * ті самі три формати: два пункти меню на одну сутність. На телефоні
          * таблиця стає стопкою карток — рядок із чотирьох колонок там не
          * читається ні за яких кеглів.
          */}
        <div className="srv-compare">
          <span className="sysx-kick">{t('Порівняння', 'Side by side')}</span>
          <h2 className="sysx-display srv-h2">{t('Чим вони відрізняються', 'How they differ')}</h2>
          <div className="srv-table-wrap">
            <table className="srv-table">
              <thead>
                <tr>
                  <th />
                  {SERVICES.map((m) => <th key={m.slug}>{m.n} · {m.name[i]}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.k[0]}>
                    <td className="srv-table-k mono">{row.k[i]}</td>
                    {row.v.map((cell, ci) => <td key={ci}>{cell[i]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="srv-stack">
            {SERVICES.map((m, mi) => (
              <div key={m.slug} className="srv-stack-card">
                <b className="srv-stack-h">{m.n} · {m.name[i]}</b>
                {COMPARE.map((row) => (
                  <p key={row.k[0]}><span className="mono">{row.k[i]}</span>{row.v[mi][i]}</p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Заперечення знімаємо тут, а не на окремій сторінці: людина ставить
            ці питання рівно в момент вибору формату. */}
        <div className="srv-faq">
          <span className="sysx-kick">{t('Питання перед стартом', 'Questions before you start')}</span>
          <h2 className="sysx-display srv-h2">{t('Коротко про головне', 'The short answers')}</h2>
          <div className="srv-faq-list">
            {FAQ.map((f, k) => (
              <div key={f.q} className={'srv-faq-item' + (open === k ? ' is-open' : '')}>
                <button type="button" className="srv-faq-q" aria-expanded={open === k}
                  onClick={() => setOpen(open === k ? null : k)}>
                  <span>{f.q}</span><i aria-hidden="true">{open === k ? '−' : '+'}</i>
                </button>
                {open === k && <p className="srv-faq-a">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/*
          * Зона робіт — рядком, а не розділом меню.
          *
          * «Експертизи» стояли другим пунктом головного меню й конкурували з
          * «Послугами» за ту саму увагу: людина, яка шукала, ЩО замовити, йшла
          * дивитись девʼять напрямів РОБІТ. Тут вони на своєму місці — після
          * форматів, як відповідь на «а що саме ви робите всередині».
          */}
        <section className="srv-exp" aria-labelledby="srv-exp-h">
          <span className="sysx-kick">{t('Зона робіт', 'Scope of work')}</span>
          <h2 id="srv-exp-h" className="sysx-display srv-h2">{t('Що робимо всередині формату', 'What we do inside a format')}</h2>
          <ul className="srv-exp-list">
            {EXPERTISES.map((e) => (
              <li key={e.slug}>
                <Link to={lp(`/expansion/${e.slug}`)} className="srv-exp-i">{L(e.title, lang)}</Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="srv-foot">
          <p className="srv-foot-t">
            {t('Не знаєте, який формат ваш? Почніть із безкоштовного розрахунку — він покаже масштаб витоку.',
               'Not sure which format is yours? Start with the free estimate — it shows the scale of the leak.')}
          </p>
          <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
        </div>
      </div>
    </section>
  );
}
