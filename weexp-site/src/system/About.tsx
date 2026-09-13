import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useT, useLp, useLang } from '@/i18n';
import { TEAM, localizeRole } from '@/data/team';
import { CASES } from '@/data/cases';
import { L } from '@/system/expertises';
import { useJsonLd, ORIGIN } from '@/lib/seo';
import './system.css';

/*
 * Механіка довіри переїхала сюди з головної: там вона стояла між доказом і
 * послугою й відсувала їх на четвертий екран.
 *
 * Разом із нею приїхали були «чотири рівні пропозиції» та меседжинг за роллю
 * ЛПР — і поїхали назовсім. Це опис того, як влаштовані МИ, а не відповідь на
 * питання, з яким людина відкриває сторінку «Про нас».
 */
const Credibility = lazy(() => import('@/system/Credibility').then((m) => ({ default: m.Credibility })));

/**
 * «Про нас» (/people). Місія, візія, цінності, статусний блок власника і
 * глибина партнерської мережі. UA/EN.
 *
 * Коментар тут двічі обіцяв «9 напрямів» — і в шапці файлу, і над самим
 * масивом, — тоді як у масиві їх одинадцять і сторінка показувала 11. Код
 * казав одне, коментар інше: рівно та хвороба, через яку сайт уже одного разу
 * довелось перебирати.
 */
const FOUNDER = TEAM[0];

/*
 * Тут лежав перелік з одинадцяти компетенцій партнерської мережі — і саме він
 * показує, як наростає обсяг. Спершу його довелось відрізняти від девʼяти
 * ЕКСПЕРТИЗ, бо обидва звались «напрямами» і сайт казав то «девʼять», то
 * «одинадцять». Потім виявилось, що на цій самій сторінці вище вже стоять
 * девʼятнадцять ролей команди з зонами відповідальності — тобто відповідь на
 * те саме питання, тільки конкретніша, з іменами.
 *
 * Два списки «хто що робить» під одним заголовком — це не глибина, а 1.4
 * зайвих екрана. Лишились ролі; глибина мережі сказана числом у фактах.
 */

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

  return (
    <>
    <section className="sysx about">
      <div className="sysx-field" aria-hidden="true" />
      <div className="about-in">
        {/* Двоколонкова шапка: раніше вся сторінка тиснулась у ліву половину,
            а права лишалась порожньою. Праворуч — не декор, а фактаж, який
            і так є на сторінці нижче: масштаб, географія, глибина. */}
        <header className="about-head">
          {/* Заголовок іде на всю ширину контейнера, а не в колонку: інакше
              двоколонкова шапка лише міняє порожнечу праворуч на переноси
              ліворуч. Дві колонки починаються нижче заголовка. */}
          <span className="sysx-kick about-head-full">{t('Про нас', 'About us')}</span>
          <h1 className="sysx-display about-h1 about-head-full">{t('Ми будуємо ', 'We build a ')}<span className="hl">{t('систему', 'system')}</span>, {t('а не залежність', 'not dependency')}</h1>
          <span className="script about-script about-head-full">{t('Система замість героїзму.', 'A system instead of heroics.')}</span>
          <div className="about-head-l">
          <p className="sysx-lead about-lead">{t('WEEXP будує систему зростання для e-commerce і D2C-брендів. Ми перетворюємо онлайн-продажі з ручного режиму на керовану систему з восьми частин — щоб виторг зростав, а бізнес не тримався на власнику в операційці.', 'WEEXP builds a growth system for e-commerce and D2C brands. We turn online sales from manual mode into a managed system of eight parts — so revenue grows and the business doesn’t rest on the owner’s daily grind.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
          </div>
          <aside className="about-head-r">
            <span className="sysx-kick">{t('Коротко', 'In short')}</span>
            <ul className="about-facts">
              <li><b>8</b><span>{t('систем комерції в одній керованій', 'commerce systems in one managed whole')}</span></li>
              {/* Числа рахуються з переліків. Набрані руками, вони збігались із
                  джерелом лише доти, доки джерело не змінять: наступний кейс
                  тихо лишив би на сторінці «17». */}
              <li><b>{TEAM.length}</b><span>{t('ролей, у кожної свій відповідальний', 'roles, each with someone accountable')}</span></li>
              <li><b>{CASES.length}</b><span>{t('трансформацій, доведених до вимірюваного результату', 'transformations taken to a measurable result')}</span></li>
              <li><b>US · EU · MENA</b><span>{t('ринки, на яких працює команда', 'markets the team works in')}</span></li>
            </ul>
            <p className="about-facts-note mono">{t('Кожне число нижче на сторінці розкрито: хто відповідає, за що і з яким результатом.', 'Every number is unpacked further down: who is accountable, for what, and with what result.')}</p>
          </aside>
        </header>

        {/* Хто ми — розгорнутий блок про агентство */}
        <div className="about-sec about-who">
          <span className="sysx-kick">{t('Хто ми', 'Who we are')}</span>
          <div className="about-who-grid">
            {/* Було два абзаци на 110 слів: перший називав, хто ми, другий
                перераховував вісім систем і пояснював, що ми «не агентство
                окремих послуг». Перелік систем стоїть нижче іменами
                відповідальних, а «ми не агентство» читається як заперечення
                того, чого ніхто не казав. */}
            <p className="about-who-p">{t('WEEXP будує онлайн-продажі e-commerce і D2C-брендів як керовану систему — на ринках України, ЄС і США. Діагностуємо в грошах, знаходимо, де витікає виторг, і відповідаємо за результат, а не за окрему ділянку робіт.', 'WEEXP builds online sales for e-commerce and D2C brands as a managed system — across Ukraine, the EU and the US. We diagnose in money, find where revenue leaks, and are accountable for the result rather than for a single slice of work.')}</p>
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

        {/*
          * МІСІЯ, ВІЗІЯ Й ШІСТЬ ЦІННОСТЕЙ ЗВІДСИ ПІШЛИ.
          *
          * Разом це чотири блоки й близько 230 слів: «перетворити e-commerce з
          * героїзму на систему», «числа замість відчуттів», «чесність у
          * грошах». Усе це правда — і все це про нас, написане так, що жоден
          * конкурент не написав би протилежного. Сторінка «Про нас» на сайті,
          * який продає, відповідає на інше питання: чи можна довірити цим
          * людям свої гроші. На нього відповідають імена, числа, відповідальні
          * за зони й механіка довіри нижче — а не декларації.
          */}

        {/* Команда і власник */}
        <div className="about-sec">
          <span className="sysx-kick">{t('Команда і власник', 'Team & owner')}</span>
          <h2 className="sysx-display about-team-h">{t('У кожної системи —', 'Every system has')} <span className="hl-y">{t('свій власник', 'its own owner')}</span></h2>
          <p className="about-team-lead">{t('Ми не «універсали на все». Над вашим проєктом працює команда, структурована за вісьмома системами: у кожного контуру — відповідальний за результат.', 'We are not “generalists for everything”. Your project is run by a team structured around the eight systems: every circuit has someone accountable for the result.')}</p>

          <div className="about-founder">
            {FOUNDER.photo && (
              <div className="about-founder-ph"><img src={FOUNDER.photo} alt={`${fnd.name ?? 'Founder'} — ${t('засновник WEEXP', 'founder of WEEXP')}`} width="900" height="1125" loading="lazy" /></div>
            )}
            <div className="about-founder-l">
              <span className="about-eyebrow mono">{t('Засновник і архітектор Commerce', 'Founder & Architect of Commerce')}</span>
              {fnd.name && <h3 className="sysx-display about-name">{fnd.name}</h3>}
              <span className="about-role">{fnd.role}</span>
              {/* Було два абзаци на 140 слів. Другий переказував перший іншими
                  словами: «архітектор системи, а не консультант за ділянкою» →
                  «відповідає за результат, а не за фрагмент роботи». Лишився
                  один — із тим, що перевіряється: роки, ринки, рівень брендів,
                  за що саме відповідає. */}
              <p className="about-focus">{t('Понад 8 років будує міжнародний e-commerce на ринках США, ЄС і MENA — від виробників до брендів рівня Forbes TOP-250. Відповідає за фінансовий результат бізнесу, а не за окрему ділянку робіт: рішення ухвалюються на рівні системних змін, із P&L-відповідальністю й вимірюваним ефектом.', 'Over 8 years building international e-commerce across the US, EU and MENA — from manufacturers to Forbes TOP-250 brands. Accountable for the financial result of the business, not for a single slice of work: decisions are made at the level of systemic change, with P&L ownership and a measurable effect.')}</p>
              <div className="about-creds">
                <span><b>8+</b> {t('років у e-commerce', 'years in e-commerce')}</span>
                <span><b>US · EU · MENA</b></span>
                <span>{t('бренди', 'brands')} <b>Forbes TOP-250</b></span>
                <span>{t('бренди й виробники', 'brands & makers')} <b>D2C</b></span>
              </div>
            </div>
          </div>

          {/*
            * ПЕРЕЛІК ІЗ ОДИНАДЦЯТИ КОМПЕТЕНЦІЙ ПАРТНЕРСЬКОЇ МЕРЕЖІ ЗВІДСИ ПІШОВ.
            *
            * На одній сторінці стояли ДВА списки «хто що робить»: девʼятнадцять
            * ролей команди — і одразу під ними одинадцять компетенцій мережі з
            * описами. Обидва відповідали на те саме питання, другий дублював
            * перший іншими словами й коштував 1.4 екрана. Глибина мережі
            * лишилась числом у фактах угорі, де її й читають.
            */}
        </div>

        <div className="about-cta">
          <div>
            <span className="sysx-kick">{t('Хочете так само?', 'Want the same?')}</span>
            <b className="sysx-display about-cta-h">{t('Побачте, які системи у вас ', 'See which of your systems are ')}<span className="hl">{t('без власника', 'ownerless')}</span></b>
          </div>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/proof')} className="sysx-cta">{t('Кейси', 'Cases')} →</Link>
          </div>
        </div>
      </div>
    </section>
    {/* Лишилась тільки механіка довіри. «Чотири рівні пропозиції» й меседжинг
        за роллю ЛПР пішли: це опис нашої внутрішньої будови, а сторінка має
        відповідати на питання «чи можна вам вірити». */}
    <Suspense fallback={null}><Credibility /></Suspense>
    </>
  );
}
