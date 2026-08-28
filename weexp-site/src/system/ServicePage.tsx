import { useEffect } from 'react';
import { Link, Navigate, useParams, useLocation } from 'react-router-dom';
import { SYSTEMS, localizeSystem } from '@/data/xray';
import { CASES } from '@/data/cases';
import { applySeo, useJsonLd, ORIGIN } from '@/lib/seo';
import { useT, useLp, useLang } from '@/i18n';
import './system.css';

/**
 * Глибока сторінка послуги (одна на систему) за структурою ТЗ §4:
 * проблема → наслідки → діагностика → рішення → як працюємо (процес) →
 * результат → докази → умови → наступний крок. Дані — із SYSTEMS (data/xray),
 * докази — реальні кейси, відфільтровані за системою. /systems/:slug.
 */
export function ServicePage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const rawSys = SYSTEMS.find((s) => s.slug === slug);
  const idx = rawSys ? SYSTEMS.findIndex((s) => s.slug === slug) : -1;

  useEffect(() => {
    if (!rawSys) return;
    const s = localizeSystem(rawSys, lang);
    // Повний SEO (title/description/canonical/lang/hreflang) під поточну мову й URL.
    // Суфікс скорочено: «— послуга WEEXP · Commerce OS» це 29 символів, і
    // найдовший заголовок виходив на 62 при межі ~60, тобто обрізався у видачі.
    // Слово «послуга» ще й нічого не додає: його не шукають. Лишається бренд.
    applySeo(`${s.title} · Commerce OS · WEEXP`,
      `${s.title}: ${s.bigIdea}`, pathname);
  }, [rawSys, lang, pathname, t]);

  // Service-схема (schema.org) — Google краще розуміє послугу.
  const svcLd = rawSys ? (() => {
    const s = localizeSystem(rawSys, lang);
    return {
      '@context': 'https://schema.org', '@type': 'Service',
      name: s.title, description: s.bigIdea, serviceType: s.en,
      url: ORIGIN + (pathname === '/' ? '/' : pathname.replace(/\/$/, '')),
      provider: { '@type': 'Organization', name: 'WEEXP', url: ORIGIN },
      areaServed: [{ '@type': 'Country', name: 'Ukraine' }, { '@type': 'AdministrativeArea', name: 'EU' }, { '@type': 'Country', name: 'US' }],
    };
  })() : null;
  useJsonLd('service', svcLd);

  if (!rawSys) return <Navigate to="/systems" replace />;

  const sys = localizeSystem(rawSys, lang);
  const proofs = CASES.filter((c) => c.systems.includes(sys.key)).slice(0, 3);
  const prev = SYSTEMS[(idx - 1 + SYSTEMS.length) % SYSTEMS.length];
  const next = SYSTEMS[(idx + 1) % SYSTEMS.length];

  return (
    <section className="sysx svc" aria-label={sys.title}>
      <div className="svc-in">
        {/* Локальні крихти прибрано — глобальні «Головна / Системи / …» тепер у шапці (SystemShell). */}
        <header className="svc-head">
          <span className="sysx-kick">{t('Система', 'System')} {sys.num} · {sys.en}</span>
          <h1 className="sysx-display svc-h1">{sys.title}</h1>
          <p className="svc-promise">{sys.bigIdea}</p>
          <div className="svc-when mono"><span>{t('Коли це ваше вузьке місце', 'When this is your bottleneck')}</span><b>{sys.when}</b></div>
          <div className="svc-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Перевірити цю систему →', 'Check this system →')}</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
        </header>

        <div className="svc-grid">
          <article className="svc-block svc-problem">
            <span className="svc-lab mono">{t('01 · Проблема', '01 · Problem')}</span>
            <p className="svc-feel">«{sys.feel}»</p>
            <p className="svc-txt">{t('Це відчуття власника, коли система', 'This is what the owner feels when the')} «{sys.title.toLowerCase()}» {t('не збудована. Далі — як це проявляється й у що обходиться.', 'system is not built. Next — how it shows up and what it costs.')}</p>
          </article>

          <article className="svc-block">
            <span className="svc-lab mono">{t('02 · Наслідки й симптоми', '02 · Consequences & symptoms')}</span>
            <ul className="svc-pains">{sys.pains.map((p) => <li key={p}>{p}</li>)}</ul>
            <p className="svc-note mono">{t('Кожен симптом — це гроші, що витікають повз касу: втрачений трафік, нижча конверсія, менший LTV чи вищі витрати.', 'Every symptom is money leaking past the register: lost traffic, lower conversion, smaller LTV or higher costs.')}</p>
          </article>

          <article className="svc-block">
            <span className="svc-lab mono">{t('03 · Що діагностуємо', '03 · What we diagnose')}</span>
            <div className="svc-domains">{sys.domains.map((d) => <span key={d} className="svc-domain">{d}</span>)}</div>
            <p className="svc-txt">{t('Перевіряємо кожен домен за даними (CRM/ERP/GA4 і ваші процеси), а не «на око». Логіка:', 'We check every domain against data (CRM/ERP/GA4 and your processes), not by eye. The logic:')} <b>{t('проблема → докази → впевненість → вплив → пріоритет', 'problem → proof → confidence → impact → priority')}</b>.</p>
          </article>

          <article className="svc-block svc-solution">
            <span className="svc-lab mono">{t('04 · Що будуємо', '04 · What we build')}</span>
            <p className="svc-sell">{sys.sell}</p>
            <p className="svc-txt">{t('Не набір робіт, а', 'Not a bundle of tasks, but')} <b>{t('систему, якою можна керувати', 'a system you can manage')}</b>: {t('із власником, метриками й регулярним циклом.', 'with an owner, metrics and a regular cycle.')}</p>
          </article>

          <article className="svc-block svc-flow-block">
            <span className="svc-lab mono">{t('05 · Як працюємо — ланцюг цінності', '05 · How we work — the value chain')}</span>
            <div className="svc-flow">
              {sys.flow.map((f, i) => (
                <span key={f} className="svc-flow-step">
                  <i className="mono">{String(i + 1).padStart(2, '0')}</i>{f}
                  {i < sys.flow.length - 1 && <em aria-hidden="true">→</em>}
                </span>
              ))}
            </div>
            <p className="svc-note mono">{t('Діагностика → побудова → доведення до економіки → передача під ключ (щоб працювало без героя).', 'Diagnosis → build → drive to economics → turnkey handover (so it runs without a hero).')}</p>
          </article>

          <article className="svc-block svc-result">
            <span className="svc-lab mono">{t('06 · Результат', '06 · Result')}</span>
            <p className="svc-txt"><b>{sys.bigIdea}</b> — {t('керована система замість ручного режиму. Точні цілі та строки складаємо на діагностиці під ваш Definition of Done.', 'a managed system instead of manual mode. We set exact goals and timelines in the diagnostic, against your Definition of Done.')}</p>
          </article>
        </div>

        <div className="svc-proof">
          <span className="svc-lab mono">{t('07 · Докази — де ця система дала дельту', '07 · Proof — where this system delivered a delta')}</span>
          {proofs.length > 0 ? (
            <>
              <div className="svc-proof-grid">
                {proofs.map((c) => (
                  <Link key={c.slug} to={lp('/proof')} className="svc-case">
                    <span className="svc-case-cat mono">{c.cat}</span>
                    <b className="sysx-display svc-case-hero">{c.hero}</b>
                    <span className="svc-case-lbl">{c.heroLabel}</span>
                  </Link>
                ))}
              </div>
              <span className="svc-proof-note mono">{t('Кожна дельта звірена з CRM / ERP / GA4 клієнта.', 'Every delta is reconciled against the client’s CRM / ERP / GA4.')}</span>
            </>
          ) : (
            /* Fallback, щоб секція не зникала на системах без прив'язаних кейсів (консистентність шаблону). */
            <>
              <p className="svc-promise">{t('Ця система підсилює результат інших — сумарні дельти по всіх трансформаціях зібрані на сторінці доказів.', 'This system amplifies the others — the combined deltas across all transformations are gathered on the proof page.')}</p>
              <Link to={lp('/proof')} className="sysx-cta">{t('Наші перемоги →', 'Our wins →')}</Link>
            </>
          )}
        </div>

        <div className="svc-next">
          <div className="svc-next-l">
            <span className="sysx-kick">{t('Умови й наступний крок', 'Terms & next step')}</span>
            <h2 className="sysx-display svc-next-h">{t('Точну вартість формуємо після діагностики', 'We set the exact cost after the diagnostic')}</h2>
            <p className="svc-txt">{t('Спершу — діагноз у грошах: скільки саме витікає у цій системі й що дасть найбільшу дельту. Обсяг і вартість робіт залежать від стану, тож фіксуємо їх після розбору.', 'First — a diagnosis in money: how much exactly is leaking in this system and what will deliver the biggest delta. Scope and cost depend on the state, so we fix them after the review.')}</p>
          </div>
          <div className="svc-next-r">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік →', 'Calculate the leak →')}</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
        </div>

        <nav className="svc-siblings">
          <Link to={lp(`/systems/${prev.slug}`)} className="svc-sib">← {localizeSystem(prev, lang).title}</Link>
          <Link to={lp('/systems')} className="svc-sib is-mid mono">{t('Усі 8 систем', 'All 8 systems')}</Link>
          <Link to={lp(`/systems/${next.slug}`)} className="svc-sib">{localizeSystem(next, lang).title} →</Link>
        </nav>
      </div>
    </section>
  );
}
