import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import './home.css';

/**
 * Фінальний заклик — окремим модулем, а не всередині блоків головної.
 *
 * Він лежав у HomeBlocks і вантажився чанком головної, тому на інших сторінках
 * його просто не було. Найдорожче це коштувало блогу: сорок чотири статті —
 * головний вхід із пошуку — закінчувались останнім абзацом і нічим більше.
 * Людина дочитувала розбір своєї проблеми й упиралась у кінець сторінки.
 */
export function ClosingCta() {
  const t = useT();
  const lp = useLp();
  return (
    <section className="sysx hb hb-close" aria-labelledby="hb-close-h">
      <div className="hb-in">
        <h2 id="hb-close-h" className="sysx-display hb-close-h">
          {t('Почнімо з розмови,', 'Let us start with a talk,')}{' '}<br className="br-wide" />
          {t('а не з пропозиції', 'not with a proposal')}
        </h2>
        <p className="hb-close-l">
          {t(
            'Напишіть у двох реченнях, що відбувається. Відповімо протягом робочого дня, домовимось на 30 хвилин розмови — і скажемо прямо, чи можемо допомогти.',
            'Write two sentences about what is going on. We reply within a business day, agree a 30-minute call — and tell you straight whether we can help.',
          )}
        </p>
        {/* Одна дія. Доти поруч стояло друге посилання — «Залишити заявку», —
            тобто людині в кінці сторінки пропонували вибрати спосіб звернення
            замість того, щоб звернутись. Заявка нікуди не зникла: вона в шапці
            на кожній сторінці й окремим розділом у меню. */}
        <Link to={lp('/contact')} className="sysx-cta is-primary hb-close-cta">
          {t('Залишити заявку', 'Leave a request')} →
        </Link>
        {/* Другий шлях лишається тихим рядком, а не рівноцінною кнопкою:
            вибір із двох однакових кнопок відкладає обидві. */}
        <span className="sysx-alt-row mono">
          {t('Ще не готові говорити?', 'Not ready to talk yet?')}{' '}
          <Link to={lp('/diagnose')} className="sysx-cta-alt">{t('Порахувати витік', 'Calculate the leak')} →</Link>
        </span>
      </div>
    </section>
  );
}
