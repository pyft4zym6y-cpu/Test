import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { TEAM, localizeRole } from '@/data/team';
import { L } from '@/system/expertises';
import { useJsonLd, ORIGIN } from '@/lib/seo';
import './system.css';

/**
 * «Про нас» (/people). Місія, візія, цінності + статусний блок власника +
 * глибина експертизи агентства (9 напрямів, а не 18 вузьких посад). UA/EN.
 */
const FOUNDER = TEAM[0];

// 9 укрупнених напрямів експертизи (кожен — напрям + пул спеціалістів під задачу).
const AREAS: { t: [string, string]; d: [string, string] }[] = [
  { t: ['Head of E-commerce', 'Head of E-commerce'], d: ['Власник результату: зводить усі системи до зростання й P&L.', 'Owner of the result: aligns all systems toward growth and P&L.'] },
  { t: ['E-commerce Strategy', 'E-commerce Strategy'], d: ['Стратегія, позиціонування, модель росту й пріоритети.', 'Strategy, positioning, growth model and priorities.'] },
  { t: ['Business & Process Architect', 'Business & Process Architect'], d: ['Операційна модель, процеси, CRM/ERP, ролі та регламенти.', 'Operating model, processes, CRM/ERP, roles and playbooks.'] },
  { t: ['Marketing & Performance', 'Marketing & Performance'], d: ['Платний трафік, попит і креатив під юніт-економіку.', 'Paid traffic, demand and creative for unit economics.'] },
  { t: ['Retention & CRM', 'Retention & CRM'], d: ['Утримання, повторні продажі, LTV, lifecycle-сценарії.', 'Retention, repeat sales, LTV, lifecycle scenarios.'] },
  { t: ['SEO / GEO / AEO', 'SEO / GEO / AEO'], d: ['Органіка й видимість у пошуку та AI-відповідях.', 'Organic and visibility in search and AI answers.'] },
  { t: ['UX / CRO Lead', 'UX / CRO Lead'], d: ['Досвід і конверсія: каталог, картка, checkout, mobile.', 'Experience and conversion: catalog, product, checkout, mobile.'] },
  { t: ['Web & Technology', 'Web & Technology'], d: ['Платформа, інтеграції, швидкість, розробка й підтримка.', 'Platform, integrations, speed, development and support.'] },
  { t: ['Analytics & BI', 'Analytics & BI'], d: ['Наскрізна аналітика, дані й звітність для рішень.', 'End-to-end analytics, data and reporting for decisions.'] },
  { t: ['ERP & Automation', 'ERP & Automation'], d: ['Автоматизація бізнес-процесів: ERP, CRM, інтеграції та операційна автоматизація.', 'Business-process automation: ERP, CRM, integrations and operational automation.'] },
  { t: ['Marketplace Sales', 'Marketplace Sales'], d: ['Побудова та розвиток продажів на маркетплейсах: стратегія, управління каналом, масштабування.', 'Building and growing marketplace sales: strategy, channel management, scaling.'] },
];

export function About() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const fnd = localizeRole(FOUNDER, lang);

  // Person-схема засновника — краще для пошуку та Knowledge Graph.
  useJsonLd('person', {
    '@context': 'https://schema.org', '@type': 'Person',
    name: fnd.name, jobTitle: t('Засновник і архітектор Commerce', 'Founder & Architect of Commerce'),
    worksFor: { '@type': 'Organization', name: 'WEEXP', url: ORIGIN },
    ...(FOUNDER.photo ? { image: ORIGIN + FOUNDER.photo } : {}),
    url: ORIGIN + (lang === 'en' ? '/en/people' : '/people'),
  });

  const VALUES: { t: string; d: string }[] = [
    { t: t('Система, а не героїзм', 'A system, not heroics'), d: t('Результат тримається на процесах і стандартах, а не на конкретних людях і нічних змінах.', 'Results rest on processes and standards, not on specific people and night shifts.') },
    { t: t('Числа замість відчуттів', 'Numbers over gut feel'), d: t('Кожне рішення — за даними, кожна гіпотеза перевіряється. Ми рахуємо гроші, а не години.', 'Every decision is data-driven, every hypothesis is tested. We count money, not hours.') },
    { t: t('Власник у кожної системи', 'An owner for every system'), d: t('Зона відповідальності завжди має імʼя. Немає «спільної» відповідальності, яка нічия.', 'Every zone of responsibility has a name. No “shared” accountability that belongs to no one.') },
    { t: t('Незалежність клієнта', 'The client’s independence'), d: t('Успіх — коли система працює й зростає без нас. Це і є Independence Score.', 'Success is when the system runs and grows without us. That is the Independence Score.') },
    { t: t('Чесність у грошах', 'Honesty about money'), d: t('Говоримо про маржу й ризики прямо. Не «продати будь-що», а зробити бізнес прибутковим.', 'We talk about margin and risk openly. Not “sell at any cost”, but make the business profitable.') },
    { t: t('Передача, а не залежність', 'Handover, not dependency'), d: t('Лишаємо стандарт, документацію й навчену команду — а не тримаємо клієнта «на гачку».', 'We leave a standard, documentation and a trained team — we don’t keep the client “on the hook”.') },
  ];

  return (
    <section className="sysx about">
      <div className="sysx-field" aria-hidden="true" />
      <div className="about-in">
        <header className="about-head">
          <span className="sysx-kick">{t('Про нас', 'About us')}</span>
          <h1 className="sysx-display about-h1">{t('Ми будуємо ', 'We build a ')}<span className="hl">{t('систему', 'system')}</span>,<br />{t('а не залежність', 'not dependency')}</h1>
          <span className="script about-script">{t('Система замість героїзму.', 'A system instead of heroics.')}</span>
          <p className="sysx-lead about-lead">{t('WEEXP — це Commerce OS для e-commerce і D2C-брендів. Ми перетворюємо онлайн-продажі з ручного режиму на керовану систему з восьми частин — щоб виторг зростав, а бізнес не тримався на власнику в операційці.', 'WEEXP is a Commerce OS for e-commerce and D2C brands. We turn online sales from manual mode into a managed system of eight parts — so revenue grows and the business doesn’t rest on the owner’s daily grind.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">Express Audit →</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
        </header>

        {/* Хто ми — розгорнутий блок про агентство */}
        <div className="about-sec about-who">
          <span className="sysx-kick">{t('Хто ми', 'Who we are')}</span>
          <div className="about-who-grid">
            <p className="about-who-p">{t('WEEXP — це Commerce OS: команда й методологія, що будують онлайн-продажі як керовану систему. Ми працюємо з e-commerce і D2C-брендами $0.5–10M — від виробників до відомих брендів на ринках України, ЄС і США.', 'WEEXP is a Commerce OS: a team and methodology that build online sales as a managed system. We work with e-commerce and D2C brands $0.5–10M — from manufacturers to well-known brands across Ukraine, the EU and the US.')}</p>
            <p className="about-who-p">{t('Ми не «агентство окремих послуг». Ми діагностуємо бізнес у грошах, знаходимо, де саме витікає виторг, і збираємо вісім систем комерції в одну — стратегію, комерцію, попит, досвід, операції, дані, організацію й експансію. Там, де потрібна вузька експертиза, залучаємо перевірених партнерів і лідерів ринку — але відповідальність за результат тримаємо системно.', 'We are not an “agency of separate services”. We diagnose the business in money, find exactly where revenue leaks, and assemble eight commerce systems into one — strategy, commerce, demand, experience, operations, data, organization and expansion. Where narrow expertise is needed, we bring in vetted partners and market leaders — but we hold accountability for the result systemically.')}</p>
          </div>
          <div className="about-diff">
            {[
              { t: t('Діагноз у грошах, не «аудит на 80 сторінок»', 'A diagnosis in money, not an “80-page audit”'), d: t('Починаємо з числа: скільки втрачаєте й де саме.', 'We start with a number: how much you lose and where.') },
              { t: t('Система, а не набір послуг', 'A system, not a set of services'), d: t('Вісім систем працюють разом — ми не «латаємо» окремі діри.', 'Eight systems work together — we don’t “patch” isolated holes.') },
              { t: t('Незалежність як мета', 'Independence as the goal'), d: t('Будуємо так, щоб працювало й росло без нас.', 'We build so it runs and grows without us.') },
              { t: t('Мережа партнерів під задачу', 'A partner network for the task'), d: t('Вузьку експертизу закриваємо перевіреними професіоналами.', 'Narrow expertise is delivered by vetted professionals.') },
            ].map((x) => (
              <div key={x.t} className="about-diff-c"><b>{x.t}</b><span>{x.d}</span></div>
            ))}
          </div>
        </div>

        {/* Місія / Візія */}
        <div className="about-mv">
          <div className="about-mv-c">
            <span className="sysx-kick">{t('Місія', 'Mission')}</span>
            <p className="sysx-display about-mv-t">{t('Перетворити e-commerce з героїзму на систему — щоб бізнес зростав і не залежав від засновника.', 'Turn e-commerce from heroics into a system — so the business grows and no longer depends on its founder.')}</p>
          </div>
          <div className="about-mv-c about-mv-red">
            <span className="sysx-kick">{t('Візія', 'Vision')}</span>
            <p className="sysx-display about-mv-t">{t('Щоб кожен бренд міг будувати онлайн-продажі за стандартом лідерів — системно, за цифрами, без вигорання команди.', 'For every brand to build online sales to a market-leader standard — systematically, by the numbers, without burning the team out.')}</p>
          </div>
        </div>

        {/* Цінності */}
        <div className="about-sec">
          <span className="sysx-kick">{t('Цінності', 'Values')}</span>
          <div className="about-values">
            {VALUES.map((v, i) => (
              <div key={v.t} className="about-val">
                <i className="about-val-n mono">{String(i + 1).padStart(2, '0')}</i>
                <b>{v.t}</b>
                <span>{v.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Команда і власник */}
        <div className="about-sec">
          <span className="sysx-kick">{t('Команда і власник', 'Team & owner')}</span>
          <h2 className="sysx-display about-team-h">{t('У кожної системи —', 'Every system has')} <span className="hl-y">{t('свій власник', 'its own owner')}</span></h2>
          <p className="about-team-lead">{t('Ми не «універсали на все». Над вашим проєктом працює команда, структурована за системами Commerce OS: у кожного контуру — відповідальний за результат.', 'We are not “generalists for everything”. Your project is run by a team structured around the Commerce OS systems: every circuit has someone accountable for the result.')}</p>

          <div className="about-founder">
            {FOUNDER.photo && (
              <div className="about-founder-ph"><img src={FOUNDER.photo} alt={`${FOUNDER.name ?? 'Founder'} — ${t('засновник WEEXP', 'founder of WEEXP')}`} width="900" height="1125" loading="lazy" /></div>
            )}
            <div className="about-founder-l">
              <span className="about-eyebrow mono">{t('Засновник і архітектор Commerce', 'Founder & Architect of Commerce')}</span>
              {FOUNDER.name && <h3 className="sysx-display about-name">{FOUNDER.name}</h3>}
              <span className="about-role">{fnd.role}</span>
              <p className="about-focus">{t('Понад 8 років будує міжнародний e-commerce на ринках США, ЄС і MENA — від виробників до брендів рівня Forbes TOP-250. Працює з бізнесом не як консультант «за окремою ділянкою», а як архітектор системи: бачить онлайн-продажі цілісно — від стратегії й позиціонування до процесів, технологій, маркетингу, команди й фінансового результату.', 'Over 8 years building international e-commerce across the US, EU and MENA — from manufacturers to Forbes TOP-250 brands. Works with a business not as a consultant «for a single area», but as a system architect: sees online sales as a whole — from strategy and positioning to processes, technology, marketing, team and financial result.')}</p>
              <p className="about-focus">{t('Відповідає за результат бізнесу, а не за окремий фрагмент роботи: рішення ухвалюються на рівні системних змін — з P&L-відповідальністю, керованим циклом і вимірюваним ефектом. Саме власник найбільше виграє від системи: коли продажі перестають триматися на ручному режимі, звільняється головний ресурс — увага й час засновника.', 'Accountable for the business result, not a single fragment of work: decisions are made at the level of systemic change — with P&L ownership, a managed cycle and measurable effect. It’s the owner who benefits most from a system: once sales stop resting on manual mode, the main resource is freed — the founder’s attention and time.')}</p>
              <div className="about-creds">
                <span><b>8+</b> {t('років у e-commerce', 'years in e-commerce')}</span>
                <span><b>US · EU · MENA</b></span>
                <span>{t('бренди', 'brands')} <b>Forbes TOP-250</b></span>
                <span>P&amp;L <b>$0.5–10M</b></span>
              </div>
            </div>
          </div>

          <span className="about-roster-lab mono">{t('Глибина експертизи агентства — 11 напрямів, кожен із власним пулом спеціалістів під вашу задачу:', 'The agency’s depth of expertise — 11 practices, each with its own pool of specialists for your task:')}</span>
          <div className="about-roster about-roster-3">
            {AREAS.map((a, i) => (
              <div key={a.t[0]} className="about-role-c about-area-c">
                <i className="about-area-n mono">{String(i + 1).padStart(2, '0')}</i>
                <b>{L(a.t, lang)}</b>
                <span className="about-role-zone">{L(a.d, lang)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="about-cta">
          <div>
            <span className="sysx-kick">{t('Хочете так само?', 'Want the same?')}</span>
            <b className="sysx-display about-cta-h">{t('Побачте, які системи у вас ', 'See which of your systems are ')}<span className="hl">{t('без власника', 'ownerless')}</span></b>
          </div>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/proof')} className="sysx-cta">{t('Наші перемоги', 'Our wins')} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
