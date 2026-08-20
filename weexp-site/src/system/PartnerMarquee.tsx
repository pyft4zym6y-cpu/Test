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
  return (
    <div className="sysx-marquee" aria-label={t('Технологічний стек і партнери', 'Technology stack & partners')}>
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
    </div>
  );
}
