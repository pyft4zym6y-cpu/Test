import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { TEAM, localizeRole } from '@/data/team';
import { shortOf } from '@/data/xray';
import './system.css';

/**
 * «Про нас» (/people). Місія, візія, цінності + компактний блок команди і
 * власника (структура: хто веде проєкт). Бруталіст-верстка, без cinematic-фільму,
 * щоб сторінка читалась за секунди й не було наповзань. UA/EN.
 */
const FOUNDER = TEAM[0];
const ROSTER = TEAM.slice(1);

export function About() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const fnd = localizeRole(FOUNDER, lang);

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
              <span className="about-eyebrow mono">{t('Засновник і архітектор', 'Founder & architect')}</span>
              {FOUNDER.name && <h3 className="sysx-display about-name">{FOUNDER.name}</h3>}
              <span className="about-role">{fnd.role}</span>
              <p className="about-focus">{fnd.focus}</p>
              <p className="about-focus">{t('Саме власник бізнесу найбільше виграє від системи: коли продажі перестають триматися на ручному режимі, звільняється головний ресурс — увага й час засновника. Наша роль — зняти з власника операційний героїзм і дати керований актив, а не ще одного підрядника, якого треба контролювати.', 'It’s the business owner who benefits most from a system: once sales stop resting on manual mode, the main resource is freed — the founder’s attention and time. Our role is to take operational heroics off the owner and hand over a managed asset, not one more contractor to supervise.')}</p>
              <div className="about-chips">{FOUNDER.owns.map((k) => <span key={k} className="about-chip mono">{shortOf(k, lang)}</span>)}</div>
              <span className="about-exp mono">{fnd.exp}</span>
            </div>
          </div>

          <span className="about-roster-lab mono">{t('Хто працює над вашим проєктом — власники за системами:', 'Who works on your project — owners by system:')}</span>
          <div className="about-roster">
            {ROSTER.map((r) => {
              const lr = localizeRole(r, lang);
              return (
                <div key={r.role} className="about-role-c">
                  <b>{lr.role}</b>
                  <span className="about-role-zone">{lr.zone}</span>
                </div>
              );
            })}
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
