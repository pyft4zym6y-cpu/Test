import './system.css';

/**
 * Технологічні партнери — лаконічна монохромна стрічка вордмарків, згрупована за
 * галуззю (лідери кожного виду). Свідомо без різнокаліберних кольорових лого:
 * єдиний стриманий стиль читається як «ми працюємо з усім стеком лідерів», а не
 * як строката вітрина. Використовується на головній і на сторінці експансії.
 */
const GROUPS: { cat: string; items: string[] }[] = [
  { cat: 'Платформи', items: ['Shopify', 'Magento', 'WooCommerce', 'PrestaShop', 'OpenCart'] },
  { cat: 'ERP / CRM', items: ['Odoo', 'Zoho CRM', 'Bitrix24', 'HubSpot'] },
  { cat: 'Розробка', items: ['Laravel', 'React', 'Node.js', 'Next.js'] },
  { cat: 'Оплати', items: ['Stripe', 'PayPal', 'Wise'] },
  { cat: 'Маркетплейси', items: ['Amazon', 'Allegro', 'eBay', 'Etsy'] },
  { cat: 'Аналітика', items: ['GA4', 'Google Tag Manager', 'Meta Pixel'] },
];

export function PartnersStrip({ compact = false }: { compact?: boolean }) {
  return (
    <section className={'sysx sysx-partners' + (compact ? ' is-compact' : '')} aria-label="Технологічні партнери">
      <div className="pt-in">
        <div className="pt-head">
          <span className="sysx-kick">Технологічний стек і партнери</span>
          <h2 className="sysx-display pt-h">Будуємо на тому, чому<br />довіряють <span className="sysx-em">лідери ринку</span>.</h2>
          <p className="pt-lead">Не прив’язані до однієї платформи — збираємо контур під задачу з перевірених систем: від вітрини й ERP до оплат, маркетплейсів і аналітики.</p>
        </div>
        <div className="pt-groups">
          {GROUPS.map((g) => (
            <div key={g.cat} className="pt-group">
              <span className="pt-cat mono">{g.cat}</span>
              <div className="pt-logos">
                {g.items.map((it) => <span key={it} className="pt-logo">{it}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
