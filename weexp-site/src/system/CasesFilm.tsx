import { Link } from 'react-router-dom';
import { CASES, localizeCase } from '@/data/cases';
import { shortOf } from '@/data/xray';
import { useT, useLp, useLang } from '@/i18n';
import { ShareButton } from '@/system/ShareButton';
import { ProofTrust } from '@/system/ProofTrust';
import './system.css';

/**
 * /proof — докази в цифрах.
 *
 * БУВ СКРОЛ-ФІЛЬМ НА 820vh: сім кейсів лежали один поверх одного на absolute
 * усередині липкої сцени, а прокрутка міняла їхню прозорість. Вісім висот
 * вікна ходу на сім карток; жодну не можна було побачити поруч із сусідньою,
 * порівняти дві чи просто перемотати до потрібної; посилання всередині жили
 * лише завдяки окремому правилу, бо сцена гасила pointer-events; на телефоні
 * фільм і так вимикався — там сторінка була звичайною, і саме вона працювала.
 *
 * Тепер сторінка одна для всіх: сім кейсів підряд, звичайний скрол. Кожен
 * кейс — число-герой, дельти до→після з CRM/ERP/GA4, урок і команда.
 */
const REEL = ['premium-textile', 'consumer-dtc', 'cosmetics-holding', 'fashion-apparel', 'electronics-marketplace', 'supplements-health', 'pharmacy-omnichannel']
  .map((s) => CASES.find((c) => c.slug === s)!).filter(Boolean);

export function CasesFilm() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();

  return (
    <>
    <section className="sysx sysx-proof" aria-label={t('WEEXP — докази: трансформації в цифрах', 'WEEXP — proof: transformations in numbers')}>
      <div className="sysx-field" aria-hidden="true" />
      <div className="cf-in">
        <header className="cf-head">
          {/* Число — з переліку кейсів, а не з рядка. */}
          <div className="sysx-kick">{t(`${CASES.length} трансформацій`, `${CASES.length} transformations`)}</div>
          {/* Заголовок збігається з пунктом меню й крихтою. */}
          <h1 className="sysx-display sysx-h1">{t('Кейси', 'Cases')}</h1>
          <p className="sysx-sub">{t('Систему видно в цифрах', 'You see the system in the numbers')}</p>
          <p className="sysx-lead">{t('Не обіцянки, а дельти до→після з CRM, ERP і GA4: кейс анонімний, число реальне.', 'Not promises but before→after deltas from CRM, ERP and GA4: the case is anonymized, the number is real.')}</p>
          <div className="sysx-cta-row cf-head-cta">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
          </div>
        </header>

        <ol className="cf-list">
        {REEL.map((c, i) => {
          const lc = localizeCase(c, lang);
          return (
          <li key={c.slug} className="cf-case">
            <div className="cf-hero">
              <span className="cf-n mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="cf-cat mono">{lc.cat}</span>
              <span className="cf-num sysx-display">{lc.hero}</span>
              <span className="cf-heroLabel">{lc.heroLabel}</span>
              <span className="cf-window mono">{lc.window}</span>
              <p className="cf-money">{lc.money}</p>
              <div className="cf-chips">{lc.systems.map((k) => <span key={k} className="cf-chip mono">{shortOf(k, lang)}</span>)}</div>
            </div>
            <div className="cf-deltas">
              <span className="cf-deltas-h mono">{t('До → після', 'Before → After')}</span>
              {/*
                * ТРИ ДЕЛЬТИ, А НЕ ПʼЯТЬ. Сторінка відповідає на одне питання —
                * «у вас справді виходить?». Три числа відповідають на нього так
                * само, як пʼять; решта — глибина для того, хто вже вирішив.
                */}
              {lc.metrics.slice(0, 3).map((m) => (
                <div key={m.label} className="cf-row">
                  <span className="cf-row-l">{m.label}</span>
                  <span className="cf-row-v"><i className="cf-before">{m.before}</i><em className="cf-arrow mono" aria-hidden="true">→</em><b className="cf-after">{m.after}</b>{m.note && <span className="cf-note mono">{m.note}</span>}</span>
                </div>
              ))}
              {/*
                * Відгук лишається: це єдине, що на сторінці говорить не нашим
                * голосом. Урок, рядок звірки й склад команди пішли — урок був
                * висновком ДЛЯ НАС, звірка повторювалась сім разів тим самим
                * реченням (тепер вона сказана один раз нижче, у блоці про
                * метод), а перелік ролей на кожному кейсі — це знову розповідь
                * про нас там, де мали бути числа клієнта.
                */}
              {lc.testimonial && (
                <blockquote className="cf-quote">
                  <p>«{lc.testimonial.quote}»</p>
                  <cite className="mono">{lc.testimonial.name ? `${lc.testimonial.name}, ` : ''}{lc.testimonial.role}</cite>
                </blockquote>
              )}
            </div>
          </li>
          );
        })}
        </ol>

        {/* Одна дія в кінці сторінки — щоб кейси не були глухим кутом. */}
        <div className="cf-outro">
          <div className="sysx-kick">{t('Ваша трансформація', 'Your transformation')}</div>
          <h2 className="sysx-display sysx-h2">{t('Наступне число', 'The next number')}{' '}<br className="br-wide" />{t('у стрічці — ', 'in the reel is ')}<span className="sysx-em">{t('ваше', 'yours')}</span>.</h2>
          <p className="sysx-lead">{t('Почніть із діагнозу: безкоштовний розрахунок покаже, яка система дасть вам найбільшу дельту.', 'Start with the diagnosis: a free estimate shows which system delivers the biggest delta for you.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} <span aria-hidden="true">→</span></Link>
            <ShareButton title={t('WEEXP — докази в цифрах', 'WEEXP — proof in numbers')} />
          </div>
        </div>
      </div>
    </section>
    <ProofTrust />
    </>
  );
}
