import { useEffect, useRef } from 'react';
import { useT } from '@/i18n';
import './system.css';

/**
 * Технологічний стек як єдиний напівпрозорий рядок, що біжить по низу екрана —
 * частина сцени, а не окремий блок. Вставляється всередину .sysx-stage
 * (position: absolute; bottom). Дублюємо контент двічі для безшовного циклу.
 */
const ITEMS = [
  'Shopify', 'Magento', 'WooCommerce', 'PrestaShop', 'OpenCart', 'Odoo', 'Zoho CRM', 'Bitrix24',
  'HubSpot', 'Laravel', 'React', 'Node.js', 'Next.js', 'Stripe', 'PayPal', 'Wise', 'Amazon',
  'Allegro', 'eBay', 'Etsy', 'GA4', 'Google Tag Manager', 'Meta Pixel',
];

export function PartnerMarquee() {
  const t = useT();
  const box = useRef<HTMLElement>(null);

  /**
   * Скільки місця рядок займає знизу сцени → CSS-змінна `--sysx-marq-h`.
   *
   * Рядок абсолютний і напівпрозорий: він не ховає те, що під ним, а лягає
   * зверху. Нижній відступ сцени про нього не знав, тож на невисокому вікні
   * останні рядки — «Безкоштовно · ~2 хв» і підказка про скрол — опинялись
   * просто в смузі логотипів.
   *
   * Міряємо ВІДСТАНЬ ВІД НИЗУ СЦЕНИ, а не висоту рядка. Спершу тут стояло
   * el.height — і на десктопі це збігалось, бо рядок стоїть bottom: 0. На
   * телефоні він піднятий над нижньою панеллю (bottom: 58px), тож займає
   * 104px, а змінна казала 46. Резерв був удвічі менший за потрібний, і рядок
   * «безкоштовно · 2 хв» знову лягав на логотипи — цього разу мовчки, бо
   * механізм ніби працював. Питання, на яке відповідає змінна, має збігатися
   * з питанням, яке ставить відступ.
   *
   * Ставимо змінну на СЦЕНУ, а не на :root: рядок є лише на головній, і
   * глобальне значення з'їдало б низ сцен там, де жодного рядка немає.
   */
  useEffect(() => {
    const el = box.current; if (!el) return;
    const stage = el.closest('.sysx-stage') as HTMLElement | null; if (!stage) return;
    const set = () => {
      const occupied = stage.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
      stage.style.setProperty('--sysx-marq-h', Math.max(0, Math.round(occupied)) + 'px');
    };
    set();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', set); return () => window.removeEventListener('resize', set); }
    // Стежимо і за рядком, і за сценою: висота сцени змінюється при повороті
    // екрана й при згортанні адресного рядка браузера.
    const ro = new ResizeObserver(set); ro.observe(el); ro.observe(stage);
    return () => ro.disconnect();
  }, []);
  // section, а не div: у голого div немає ролі, і aria-label на ньому
  // заборонений — скрінрідер його просто ігнорував, тобто підпис не звучав
  // узагалі. У section з доступним іменем роль region з'являється сама.
  return (
    <section ref={box} className="sysx-marquee" aria-label={t('Технологічний стек і партнери', 'Technology stack & partners')}>
      <span className="sysx-marquee-lab mono" aria-hidden="true">{t('Працюємо зі стеком лідерів', "We work with the leaders' stack")}</span>
      <div className="sysx-marquee-view" aria-hidden="true">
        <div className="sysx-marquee-track">
          {[0, 1].map((dup) => (
            <div className="sysx-marquee-run" key={dup}>
              {ITEMS.map((it) => <span key={dup + it} className="sysx-marquee-item">{it}</span>)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
