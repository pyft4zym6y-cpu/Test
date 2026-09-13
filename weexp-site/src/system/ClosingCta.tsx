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
          {t('Почнімо з діагнозу,', 'Let us start with a diagnosis,')}<br />
          {t('а не з пропозиції', 'not with a proposal')}
        </h2>
        <p className="hb-close-l">
          {t(
            'Безкоштовний експрес-розрахунок дає перше число — скільки виторгу витікає щороку — і головне вузьке місце. Далі, якщо потрібно, глибокий аудит.',
            'A free express estimate gives the first number — how much revenue leaks each year — and the main bottleneck. Then, if needed, the deep audit.',
          )}
        </p>
        {/* Одна дія. Доти поруч стояло друге посилання — «Залишити заявку», —
            тобто людині в кінці сторінки пропонували вибрати спосіб звернення
            замість того, щоб звернутись. Заявка нікуди не зникла: вона в шапці
            на кожній сторінці й окремим розділом у меню. */}
        <Link to={lp('/diagnose')} className="sysx-cta is-primary hb-close-cta">
          {t('Порахувати витік', 'Calculate the leak')} →
        </Link>
      </div>
    </section>
  );
}
