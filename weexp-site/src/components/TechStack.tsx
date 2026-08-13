import './tech-stack.css';

/** Стек і екосистема, якою керує WEEXP. Wordmark-и (без лого) у брендовій сітці. */
const STACK: { group: string; tools: string[] }[] = [
  { group: 'Платформи', tools: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento', 'OpenCart', 'Хорошоп'] },
  { group: 'Дані та BI', tools: ['GA4', 'GTM', 'BigQuery', 'Looker Studio', 'Power BI', 'Segment'] },
  { group: 'CRM і retention', tools: ['HubSpot', 'Salesforce', 'Klaviyo', 'eSputnik', 'SendPulse', 'Customer.io'] },
  { group: 'ERP і операції', tools: ['Odoo', 'SAP', 'NetSuite', 'Dilovod', 'BAS / 1C', 'WMS'] },
  { group: 'Реклама і канали', tools: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'Amazon', 'Rozetka', 'Merchant Center'] },
  { group: 'AI та автоматизація', tools: ['OpenAI', 'n8n', 'Make', 'Zapier', 'GA4 BigQuery ML', 'Feed-менеджмент'] },
];

export function TechStack() {
  return (
    <section className="ts" data-say="Ми будуємо на стеку світового рівня — і зводимо його в один керований контур.">
      <div className="wrap">
        <span className="page-kick">Екосистема · один керований контур</span>
        <h2 className="ts-h">Будуємо на стеку<br /><span className="mk">світового рівня</span></h2>
        <p className="ts-lead">Не «впроваджуємо інструмент». Ми зводимо платформу, дані, CRM, ERP і рекламу
          в єдину систему, якою можна керувати — від GA4 до Odoo.</p>
        <div className="ts-grid">
          {STACK.map((g) => (
            <div key={g.group} className="ts-col">
              <span className="ts-col-h mono">{g.group}</span>
              <div className="ts-tools">
                {g.tools.map((t) => <span key={t} className="ts-tool mono">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
        <p className="ts-note mono">Стек добираємо під задачу. Мета — не набір систем, а один source of truth.</p>
      </div>
    </section>
  );
}
