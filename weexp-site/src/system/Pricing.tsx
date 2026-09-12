import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useT, useLp, useLang } from '@/i18n';
import { useJsonLd } from '@/lib/seo';
import './system.css';
import { HEADLINE_PROOF } from '@/data/cases';
import { TOTAL_DOMAINS } from '@/data/xray';
import { AUDIT_BLOCKS } from '@/data/auditPack';
import { SERVICES, servicePath, fillCounts } from '@/data/services';
import { PROCESS } from '@/data/process';

/**
 * Формати співпраці — три моделі за рівнем НАШОЇ відповідальності за результат:
 *   01 Аудит       — разовий проєкт, далі клієнт діє сам (потрібна карта, не руки);
 *   02 Консалтинг  — ми архітектор і контроль, руки — команда клієнта;
 *   03 Управління  — проєкт ведемо ми, фінальна відповідальність наша.
 * Портовано зі старої версії у світлу систему .sysx (монохром + синій акцент).
 *
 * Числа складу аудиту беруть із даних, а не з рядка. Самі числа були
 * правильні — 13 аудитів у AUDIT_BLOCKS, 35 доменів у SYSTEMS, 18 доменів
 * зрілості в MATURITY_DOMAIN_MODULE, — але набрані руками: наступна зміна
 * моделі мовчки лишила б на сторінці цін стару обіцянку. Тепер джерело одне.
 *
 * 18 доменів зрілості лишились літералом свідомо: їхнє джерело —
 * MATURITY_DOMAIN_MODULE у lib/supa, а supa піднімає клієнт Supabase просто на
 * імпорті. Тягнути його в публічну сторінку цін заради одного числа дорожче,
 * ніж перевірити це число тестом (taxonomy.test.ts).
 */
/**
 * Картка формату для розмітки: та сама модель із data/services.ts, з якої вже
 * знято мову й підставлено числа складу аудиту.
 *
 * Доти перелік форматів жив просто тут, у рендері. Поки вони показувались на
 * одній сторінці, це було нормально; тепер формати — головна вісь сайту (пункт
 * меню, блок на головній, три власні сторінки), і чотири копії того самого
 * тексту розійшлися б мовчки.
 */
type Model = {
  slug: string; n: string; name: string; tag: string; period: string; price: string; priceNote: string;
  scopes?: { name: string; price: string }[];
  featured?: boolean; forWhom: string; includes: string[]; format: string; terms: string; resp: string;
};

export function Pricing() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const i = lang === 'en' ? 1 : 0;
  // SEO (title/description/lang/hreflang) для /pricing і /en/pricing — централізовано в RouteSeo.
  const [open, setOpen] = useState<number | null>(0);

  // Числа складу аудиту беруть із даних, а не з рядка: набрані руками, вони
  // мовчки застаріли б при наступній зміні моделі.
  const counts = { audits: AUDIT_BLOCKS.length, domains: TOTAL_DOMAINS };
  const MODELS: Model[] = SERVICES.map((m) => ({
    slug: m.slug, n: m.n, featured: m.featured,
    name: m.name[i], tag: m.tag[i], period: m.period[i], price: m.price[i], priceNote: m.priceNote[i],
    scopes: m.scopes?.map((x) => ({ name: x.name[i], price: x.price })),
    forWhom: m.forWhom[i], includes: m.includes.map((x) => fillCounts(x[i], counts)),
    format: m.format[i], terms: m.terms[i], resp: m.resp[i],
  }));

  const COMPARE: { k: string; v: [string, string, string] }[] = [
    { k: t('Відповідальний за результат', 'Responsible for the result'), v: [t('Ваша команда', 'Your team'), t('Ви · ми — за якість рішень', 'You · us — for decision quality'), t('Ми', 'Us')] },
    { k: t('Хто виконує руками', 'Who does the hands-on work'), v: [t('Ваша команда', 'Your team'), t('Ваша команда під контролем', 'Your team, under our control'), t('Ми + наші партнери', 'Us + our partners')] },
    { k: t('Що потрібно від вас', 'What we need from you'), v: [t('Дані й доступи', 'Data and access'), t('Проджект + виконавці', 'A project lead + doers'), t('Рішення та бюджет', 'Decisions and budget')] },
    { k: t('Модель оплати', 'Payment model'), v: [t('Фіксована за проєкт', 'Fixed per project'), t('$50/год · мін. 30 год/міс', '$50/hr · min. 30 hrs/mo'), t('від $4,900/міс', 'from $4,900/mo')] },
    { k: t('Мінімальний вхід', 'Minimum entry'), v: ['$2,900', t('$1,500/міс', '$1,500/mo'), t('$4,900/міс', '$4,900/mo')] },
    { k: t('Мінімальний термін', 'Minimum term'), v: [t('разово', 'one-off'), t('3 місяці', '3 months'), t('пілот 3 міс → 6–12 міс', 'pilot 3 mo → 6–12 mo')] },
    { k: t('Зарахування аудиту', 'Audit credited'), v: ['—', t('50% у 1-й місяць', '50% in month 1'), t('100% у 1-й місяць', '100% in month 1')] },
  ];

  const FAQ = [
    { q: t('Скільки це коштує?', 'How much does it cost?'), a: t('Три формати — від разового аудиту до управління під ключ: кожен знаходить свій за масштабом і ситуацією. Усі ціни відкриті вище, у блоці «Формати та ціни».', 'Three formats — from a one-off audit to managed delivery: each finds its own by scale and situation. All prices are open above, in the "Pricing & formats" block.') },
    { q: t('Коли буде результат?', 'When will there be a result?'), a: t('Перший вимірюваний — за 30–60 днів. Швидкі перемоги в першій хвилі.', 'The first measurable one — within 30–60 days. Quick wins in the first wave.') },
    { q: t('У нас своя CMS / специфіка', 'We have our own CMS / specifics'), a: t('Платформо-незалежний підхід. Міграція — лише за реальної потреби.', 'A platform-independent approach. Migration — only when genuinely needed.') },
    { q: t('Хто виконує роботу?', 'Who does the work?'), a: t('Залежить від формату: в аудиті й консалтингу — ваша команда, в управлінні — ми + наші партнери з OKR і DoD.', 'It depends on the format: in audit and consulting — your team; in managed delivery — us + our partners with OKRs and DoD.') },
    { q: t('Чому дешевше за ринок?', 'Why cheaper than the market?'), a: t('Ринок США бере за таку експертизу $75–250/год, fractional-керівники — $8–22K/міс. Ми працюємо напряму, без офісних накладних агенції — ви платите за експертизу, а не за бренд.', "The US market charges $75–250/hr for this expertise, fractional executives — $8–22K/mo. We work directly, without an agency's office overhead — you pay for expertise, not for a brand.") },
    { q: t('Чим захищений мій бюджет?', 'How is my budget protected?'), a: t('Кожен етап має Definition of Done — вимірюваний критерій приймання. Наступний транш стартує лише після прийнятого результату попереднього, а звітність щомісяця показує факт проти плану.', 'Each stage has a Definition of Done — a measurable acceptance criterion. The next tranche starts only after the previous result is accepted, and monthly reporting shows actuals against plan.') },
  ];
  // FAQPage-розмітка для Google (rich-сніпет). Будується з видимого FAQ — без окремого UI.
  useJsonLd('faq', {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
  // Offer-каталог трьох форматів співпраці (реальні, відкриті ціни — без вигадок).
  useJsonLd('pricing-offers', {
    '@context': 'https://schema.org', '@type': 'Service',
    name: 'WEEXP — система зростання для e-commerce', serviceType: 'E-commerce operations & growth',
    provider: { '@type': 'Organization', '@id': 'https://weexp.agency/#org', name: 'WEEXP' },
    areaServed: ['UA', 'EU', 'US'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: t('Формати співпраці', 'Cooperation formats'),
      itemListElement: [
        { '@type': 'Offer', name: t('Аудит', 'Audit'), priceCurrency: 'USD', price: '2900',
          priceSpecification: { '@type': 'PriceSpecification', minPrice: '2900', maxPrice: '4900', priceCurrency: 'USD' },
          description: t('Аудит інтернет-магазину або відділу e-commerce, 4–6 тижнів.', 'Online-store or e-commerce department audit, 4–6 weeks.') },
        { '@type': 'Offer', name: t('Консалтинг і супровід', 'Consulting & advisory'), priceCurrency: 'USD', price: '50',
          priceSpecification: { '@type': 'UnitPriceSpecification', price: '50', priceCurrency: 'USD', unitCode: 'HUR', referenceQuantity: { '@type': 'QuantitativeValue', value: '30', unitCode: 'HUR' } },
          description: t('Погодинно, мінімум 30 год/міс ($1,500/міс).', 'Hourly, minimum 30 hrs/mo ($1,500/mo).') },
        { '@type': 'Offer', name: t('Управління під ключ', 'Managed delivery'), priceCurrency: 'USD', price: '4900',
          priceSpecification: { '@type': 'PriceSpecification', minPrice: '4900', priceCurrency: 'USD' },
          description: t('Трансформація під ключ, 6–12 місяців, від $4,900/міс.', 'Turnkey transformation, 6–12 months, from $4,900/mo.') },
      ],
    },
  });

  return (
    <section className="sysx pric" aria-label={t('Формати та ціни', 'Pricing & formats')}>
      <div className="sysx-field" aria-hidden="true" />
      <div className="pric-in">
        {/* Шапка стала двоколонковою: текст ліворуч, докази праворуч. Раніше
            все стояло однією колонкою — заголовок ламався на чотири рядки, а
            права половина екрана лишалась порожньою. */}
        <header className="pric-head">
          <span className="sysx-kick pric-head-full">{t('Відкриті ціни · без прихованих умов', 'Open prices · no hidden terms')}</span>
          {/* Сторінку відкривають, щоб побачити суми. Заголовок «Три формати —
              за рівнем нашої відповідальності» відповідав на інше питання, а
              людина, що натиснула «Ціни», спершу читала тезу про нас.
              Теза лишилась — підрядком. */}
          <h1 className="sysx-display pric-h1 pric-head-full">{t('Ціни', 'Pricing')}</h1>
          <p className="sysx-sub pric-head-full">{t('Три формати — за рівнем нашої відповідальності за результат', 'Three formats — by the level of our responsibility for the result')}</p>
          <div className="pric-head-l">
          <p className="sysx-lead">{t('Різниця не в «пакетах послуг», а в тому, хто несе фінальну відповідальність за результат: ваша команда з нашою картою, ваша команда під нашим контролем — чи ми повністю.', 'The difference isn\'t in "service packages" but in who bears final responsibility for the result: your team with our map, your team under our control — or us entirely.')}</p>
          {/*
            * У першому екрані сторінки цін стояли $2,900 і $4,900 — і жодного
            * сигналу довіри: ні числа з кейса, ні згадки про звірку з
            * CRM/ERP/GA4, ні зняття ризику. Ціна йшла раніше підстави.
            * Три числа — ті самі, що на головній, з тих самих кейсів.
            */}
          </div>
          <aside className="pric-head-r">
            <span className="sysx-kick">{t('Підстава для цих цін', 'What backs these prices')}</span>
            <ul className="sysx-proofstrip mono pric-proof">
              {HEADLINE_PROOF.map((h) => (
                <li key={h.metric}><b>{h.value}</b> <span>{t(h.uk, h.en)}</span></li>
              ))}
            </ul>
            <p className="pric-reassure mono">
              {t('Дельти звірені з CRM / ERP / GA4 клієнта. ', 'Deltas verified against the client’s CRM / ERP / GA4. ')}
              <b>{t('100% вартості аудиту зараховується', '100% of the audit fee is credited')}</b>
              {t(' у перший місяць формату 03 (50% — у формат 02), якщо старт упродовж 30 днів.', ' toward the first month of format 03 (50% toward format 02) if you start within 30 days.')}
            </p>
          </aside>
        </header>

        {/* Аудит — обовʼязкові ворота: «Старт — тільки після аудиту» стоїть і в
            02, і в 03. Три рівні картки змушували порівнювати $2,900 з
            «від $4,900/міс» — тобто вибирати між тим, між чим вибору немає.
            Робимо послідовність видимою, витрину лишаємо як карту маршруту. */}
        <p className="pric-seq mono">
          <b>{t('Крок 1 — аудит.', 'Step 1 — the audit.')}</b>{' '}
          {t('Він обовʼязковий: без діагностики ми не консультуємо і не беремо управління. Чим продовжити — 02 чи 03 — вирішуєте за його результатом, через 4–6 тижнів.',
             'It is mandatory: without the diagnosis we neither advise nor take over delivery. Which way to continue — 02 or 03 — you decide from its result, in 4–6 weeks.')}
        </p>

        <div className="pric-grid">
          {MODELS.map((m) => (
            <article key={m.n} className={'pric-card' + (m.featured ? ' is-featured' : '')}>
              {m.featured && <span className="pric-badge mono">{t('Найчастіший вибір', 'Most common choice')}</span>}
              <span className="pric-tag mono">{m.n} · {m.tag}</span>
              <h2 className="pric-name">{m.name}</h2>
              <div className="pric-price-row">
                <b className="pric-price">{m.price}</b>
                <span className="pric-period mono">{m.period}</span>
              </div>
              {m.scopes && (
                <ul className="pric-scopes">
                  {m.scopes.map((s) => (
                    <li key={s.name}><span>{s.name}</span><b className="mono">{s.price}</b></li>
                  ))}
                </ul>
              )}
              <p className="pric-note">{m.priceNote}</p>

              <span className="pric-lab mono">{t('Кому підходить', "Who it's for")}</span>
              <p className="pric-txt">{m.forWhom}</p>

              <span className="pric-lab mono">{t('Що входить', "What's included")}</span>
              <ul className="pric-list">
                {m.includes.map((it) => <li key={it}><span aria-hidden="true">—</span>{it}</li>)}
              </ul>

              <span className="pric-lab mono">{t('Формат роботи', 'How we work')}</span>
              <p className="pric-txt">{m.format}</p>

              <span className="pric-lab mono">{t('Умови', 'Terms')}</span>
              <p className="pric-txt">{m.terms}</p>

              <p className="pric-resp">{m.resp}</p>
              {m.n === '01' && (
                <div className="pric-pack-links">
                  <Link to={lp('/audit-pack') + '?scope=store'} className="pric-pack-link mono">{t('Аудит магазину $2,900 — що всередині →', 'Store audit $2,900 — what is inside →')}</Link>
                  <Link to={lp('/audit-pack') + '?scope=dept'} className="pric-pack-link mono">{t('Аудит відділу $4,900 — що всередині →', 'Department audit $4,900 — what is inside →')}</Link>
                </div>
              )}
              {/* Сторінка формату — те саме, що й у меню «Послуги»: тут людина
                  порівнює, там читає про один. */}
              <Link to={lp(servicePath({ slug: m.slug as never }))} className="pric-pack-link mono">{t('Про формат', 'About this format')} {m.n} →</Link>
              <Link to={`${lp('/contact')}?format=${Number(m.n)}`} className={'sysx-cta pric-cta' + (m.featured ? ' is-primary' : '')}>{t('Обговорити формат', 'Discuss format')} {m.n} →</Link>
            </article>
          ))}
        </div>

        {/* Порівняльна таблиця (десктоп) / стопка (мобайл) */}
        <div className="pric-compare">
          <table className="pric-table">
            <thead>
              <tr><th /><th>{t('01 · Аудит', '01 · Audit')}</th><th>{t('02 · Консалтинг', '02 · Consulting')}</th><th>{t('03 · Управління', '03 · Managed')}</th></tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.k}>
                  <td className="pric-table-k mono">{row.k}</td>
                  {row.v.map((cell, ci) => <td key={ci}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pric-compare-m">
            {COMPARE.map((row) => (
              <div key={row.k} className="pric-compare-card">
                <span className="pric-table-k mono">{row.k}</span>
                {row.v.map((cell, ci) => (
                  <p key={ci}><b className="mono">0{ci + 1}</b> {cell}</p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Завжди — вхід через діагностику */}
        <div className="pric-always">
          <span className="pric-always-lab mono">{t('Завжди', 'Always')}</span>
          <p>{t('Будь-яка співпраця починається з діагностики — без неї ми не консультуємо і не беремо управління. Інвестиція зіставляється з упущеним оборотом із калькулятора, кожен етап — з DoD і траншами під результат.', "Any cooperation begins with diagnostics — without it we don't consult and don't take on delivery. The investment is compared with the revenue lost from the calculator, each stage — with DoD and tranches tied to results.")}</p>
          <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
        </div>

        {/* Як влаштована співпраця — прозорий процес від контакту до передачі */}
        <div className="pric-flow">
          <span className="sysx-kick">{t('Як влаштована співпраця', 'How the engagement works')}</span>
          <h2 className="sysx-display pric-flow-h">{t('Від контакту до передачі — ', 'From first contact to handover — ')}<span className="sysx-em">{t('прозоро', 'transparently')}</span></h2>
          <div className="pric-flow-steps">
            {PROCESS.map((x) => ({ n: x.n, t: [x.title[i], x.text[i]] })).map((s) => (
              <div key={s.n} className="pric-flow-step">
                <i className="pric-flow-n mono">{s.n}</i>
                <b className="pric-flow-t">{s.t[0]}</b>
                <p className="pric-flow-d">{s.t[1]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ + обмежена доступність */}
        <div className="pric-faqwrap">
          <div className="pric-faq">
            <span className="sysx-kick">{t('FAQ · знімаємо заперечення', 'FAQ · removing objections')}</span>
            <div className="pric-faq-list">
              {FAQ.map((f, i) => (
                <div key={f.q} className={'pric-faq-item' + (open === i ? ' is-open' : '')}>
                  <button className="pric-faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                    <span>{f.q}</span><i aria-hidden="true">{open === i ? '−' : '+'}</i>
                  </button>
                  {open === i && <p className="pric-faq-a">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
          <aside className="pric-avail">
            <span className="pric-always-lab mono">{t('Обмежена доступність', 'Limited availability')}</span>
            <b className="pric-avail-h">{t('Глибина замість потоку', 'Depth over volume')}</b>
            <p>{t('Беремо обмежену кількість активних мандатів одночасно — щоб кожен клієнт отримав увагу рівня P&L-власника, а не «ще один проєкт у черзі».', 'We take on a limited number of active mandates at once — so each client gets attention at the level of a P&L owner, not "one more project in the queue".')}</p>
            <div className="pric-avail-ratio"><b>1 : 1</b><span>{t('один власник —', 'one owner —')}<br />{t('один фокус на результат', 'one focus on the result')}</span></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
