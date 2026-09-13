import { useT } from '@/i18n';
import './system.css';

/**
 * Технологічний стек як єдиний рядок, що біжить під героєм. Дублюємо контент
 * двічі для безшовного циклу.
 *
 * БУВ АБСОЛЮТНИЙ — лежав по низу липкої сцени скрол-фільму, напівпрозорий,
 * поверх тексту. Через це тут жив ResizeObserver, який міряв, скільки місця
 * рядок з'їдає знизу, і писав `--sysx-marq-h` на сцену, щоб нижні рядки героя
 * не лягали на логотипи. Сцени більше немає: рядок стоїть у звичайному потоці
 * й займає рівно свою висоту — резервувати місце нема потреби, і міряти теж.
 */
const ITEMS = [
  'Shopify', 'Magento', 'WooCommerce', 'PrestaShop', 'OpenCart', 'Odoo', 'Zoho CRM', 'Bitrix24',
  'HubSpot', 'Laravel', 'React', 'Node.js', 'Next.js', 'Stripe', 'PayPal', 'Wise', 'Amazon',
  'Allegro', 'eBay', 'Etsy', 'GA4', 'Google Tag Manager', 'Meta Pixel',
];

export function PartnerMarquee() {
  const t = useT();
  // section, а не div: у голого div немає ролі, і aria-label на ньому
  // заборонений — скрінрідер його просто ігнорував, тобто підпис не звучав
  // узагалі. У section з доступним іменем роль region з'являється сама.
  return (
    <section className="sysx-marquee" aria-label={t('Технологічний стек і партнери', 'Technology stack & partners')}>
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
