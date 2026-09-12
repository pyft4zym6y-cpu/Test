import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { useJsonLd } from '@/lib/seo';
import { SERVICES, servicePath } from '@/data/services';
import { PROCESS } from '@/data/process';
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
          <span className="sysx-kick">{t('Три формати · за рівнем нашої відповідальності', 'Three formats · by the level of our responsibility')}</span>
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

        <div className="srv-steps">
          <span className="sysx-kick">{t('Однаково для всіх трьох', 'The same for all three')}</span>
          <h2 className="sysx-display srv-h2">{t('Як ми це робимо', 'How we do it')}</h2>
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

        <div className="srv-foot">
          <p className="srv-foot-t">
            {t('Порівняти формати поруч — умови, мінімальний термін і хто що робить:', 'Compare the formats side by side — terms, minimum commitment and who does what:')}
            {' '}
            <Link to={lp('/pricing')} className="srv-foot-link mono">{t('Ціни', 'Pricing')} →</Link>
          </p>
          <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
        </div>
      </div>
    </section>
  );
}
