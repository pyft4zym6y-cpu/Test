import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { applySeo, useJsonLd } from '@/lib/seo';
import { SERVICES, serviceBySlug, servicePath, fillCounts } from '@/data/services';
import { PROCESS } from '@/data/process';
import { AUDIT_BLOCKS } from '@/data/auditPack';
import { AuditScope } from '@/system/AuditScope';
import { TOTAL_DOMAINS } from '@/data/xray';
import './system.css';
import './home.css';
import './services.css';

/**
 * /services/:slug — сторінка одного формату співпраці.
 *
 * Усе, що тут показано, лежить у data/services.ts — тому сторінка формату,
 * картка на головній, хаб послуг і таблиця цін не можуть розійтися.
 *
 * Числа складу аудиту підставляються саме тут: services.ts лишається легким і
 * не тягне таксономію (64 КБ) у чанк головної, а ця сторінка її й так
 * вантажить. Що підстановка не поїде в розмітку сирою — звіряє services.test.ts.
 */
export function ServiceFormat() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const i = lang === 'en' ? 1 : 0;
  const s = serviceBySlug(slug);

  const counts = { audits: AUDIT_BLOCKS.length, domains: TOTAL_DOMAINS };
  const name = s ? s.name[i] : '';
  const promise = s ? s.promise[i] : '';

  useJsonLd('service-offer', s ? {
    '@context': 'https://schema.org', '@type': 'Service',
    name: `WEEXP — ${name}`, serviceType: 'E-commerce operations & growth',
    provider: { '@type': 'Organization', '@id': 'https://weexp.agency/#org', name: 'WEEXP' },
    areaServed: ['UA', 'EU', 'US'],
    description: promise,
  } : null);

  if (!s) return <Navigate to={lp('/services')} replace />;
  applySeo(`${name} — ${t('формат співпраці з WEEXP', 'a way to work with WEEXP')}`, promise, pathname);

  const idx = SERVICES.findIndex((x) => x.slug === s.slug);
  const next = SERVICES[(idx + 1) % SERVICES.length];

  return (
    <section className="sysx srv srvf" aria-label={name}>
      <div className="sysx-field" aria-hidden="true" />
      <div className="srv-in">
        <Link to={lp('/services')} className="srvf-back mono">← {t('Послуги', 'Services')}</Link>

        <header className="srvf-head">
          <span className="sysx-kick">{s.n} · {s.tag[i]}</span>
          <h1 className="sysx-display srv-h1">{name}</h1>
          {/* Обіцянка стоїть одразу під заголовком і найбільшим кеглем після
              нього: це те єдине речення, після якого людина розуміє, чи це
              про неї. Ціна — нижче, бо ціна без розуміння послуги нічого не
              означає; на сторінці цін вона колись ішла першою. */}
          <p className="srvf-promise">{promise}</p>
          <div className="srvf-price">
            <b>{s.price[i]}</b>
            <span className="mono">{s.period[i]}</span>
          </div>
          {s.scopes && (
            <ul className="srvf-scopes">
              {s.scopes.map((x) => (
                <li key={x.name[0]}><span>{x.name[i]}</span><b className="mono">{x.price}</b></li>
              ))}
            </ul>
          )}
          <p className="srvf-note">{s.priceNote[i]}</p>
          <div className="sysx-cta-row">
            <Link to={`${lp('/contact')}?format=${Number(s.n)}`} className="sysx-cta is-primary">{t('Залишити заявку', 'Leave a request')} →</Link>
            <Link to={lp('/diagnose')} className="sysx-cta">{t('Порахувати витік', 'Calculate the leak')} →</Link>
          </div>
        </header>

        <div className="srvf-body">
          <div className="srvf-block">
            <span className="sysx-kick">{t('Кому підходить', "Who it's for")}</span>
            <p className="srvf-txt">{s.forWhom[i]}</p>
          </div>

          <div className="srvf-block">
            <span className="sysx-kick">{t('Що входить', "What's included")}</span>
            <ul className="srvf-list">
              {s.includes.map((x) => <li key={x[0]}><i aria-hidden="true" />{fillCounts(x[i], counts)}</li>)}
            </ul>
          </div>

          <div className="srvf-block">
            <span className="sysx-kick">{t('Формат роботи', 'How we work')}</span>
            <p className="srvf-txt">{s.format[i]}</p>
          </div>

          <div className="srvf-block">
            <span className="sysx-kick">{t('Умови', 'Terms')}</span>
            <p className="srvf-txt">{s.terms[i]}</p>
          </div>

          <div className="srvf-block srvf-resp">
            <span className="sysx-kick">{t('Відповідальність', 'Accountability')}</span>
            <p className="srvf-txt"><b>{s.resp[i]}</b></p>
          </div>
        </div>

        {/* Перелік видів аудиту — спільний компонент: той самий, що на
            /diagnose. Написати його двічі означало б завести другу правду. */}
        {s.slug === 'audit' && <AuditScope />}

        {/* Склад пакета аудиту був окремою сторінкою — переліком із 19
            артефактів, тобто чек-листом наших внутрішніх процесів. Те, що
            справді цікавить клієнта, — що він отримає на руки — лишилось
            рядком «Що входить» вище. */}
        <div className="srv-steps">
          <span className="sysx-kick">{t('Однаково для всіх', 'Same for all three')}</span>
          <h2 className="sysx-display srv-h2">{t('Як ми це робимо', 'How we do it')}</h2>
          <ol className="hb-steps">
            {PROCESS.map((x) => (
              <li key={x.n} className="hb-step">
                <i className="hb-step-n" aria-hidden="true">{x.n}</i>
                <div className="hb-step-t">
                  <b>{x.title[i]}</b>
                  <p>{x.text[i]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="srv-foot">
          <p className="srv-foot-t">
            {t('Наступний формат:', 'Next format:')}{' '}
            <Link to={lp(servicePath(next))} className="srv-foot-link mono">{next.name[i]} →</Link>
          </p>
          <Link to={lp('/services')} className="sysx-cta">{t('Послуги', 'Services')} →</Link>
        </div>
      </div>
    </section>
  );
}
