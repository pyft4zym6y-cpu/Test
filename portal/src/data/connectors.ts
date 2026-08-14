/**
 * Каталог коннекторов — единый источник для выпадающего выбора в портале
 * (клиент выбирает нужный перед подключением) и для воркера. Заземлён на реестр
 * доступов метода (AC-01…20, EX-01…06). Тип: api (живой T4), file (выгрузка T3),
 * external (наша сторона, без доступов клиента).
 */
export type ConnType = 'api' | 'file' | 'external';
export type Connector = { id: string; name: string; type: ConnType; auth?: string; ac?: string };
export type ConnectorGroup = { key: string; title: string; connectors: Connector[] };

export const CONNECTOR_GROUPS: ConnectorGroup[] = [
  { key: 'analytics', title: 'A · Веб-аналитика и трекинг', connectors: [
    { id: 'ga4', name: 'Google Analytics 4', type: 'api', auth: 'Service account', ac: 'AC-01' },
    { id: 'gtm', name: 'Google Tag Manager', type: 'api', auth: 'OAuth', ac: 'AC-02' },
    { id: 'meta-pixel', name: 'Meta Pixel / Conversions API', type: 'api', auth: 'Meta OAuth' },
    { id: 'hotjar', name: 'Hotjar', type: 'api', auth: 'API key' },
    { id: 'clarity', name: 'Microsoft Clarity', type: 'api', auth: 'API key' },
  ] },
  { key: 'seo', title: 'B · Поисковая видимость / SEO', connectors: [
    { id: 'gsc', name: 'Google Search Console', type: 'api', auth: 'OAuth', ac: 'AC-03' },
    { id: 'bing-wmt', name: 'Bing Webmaster Tools', type: 'api', auth: 'API key' },
    { id: 'ahrefs', name: 'Ahrefs / Semrush / Serpstat', type: 'external', auth: 'наша подписка', ac: 'AC-04' },
    { id: 'psi', name: 'PageSpeed Insights / CrUX', type: 'external', auth: 'публичный' },
  ] },
  { key: 'ads', title: 'C · Рекламные кабинеты', connectors: [
    { id: 'google-ads', name: 'Google Ads', type: 'api', auth: 'OAuth + dev token', ac: 'AC-07' },
    { id: 'meta-ads', name: 'Meta Ads Manager', type: 'api', auth: 'Meta OAuth', ac: 'AC-08' },
    { id: 'tiktok-ads', name: 'TikTok Ads', type: 'api', auth: 'OAuth' },
    { id: 'bing-ads', name: 'Microsoft (Bing) Ads', type: 'api', auth: 'OAuth' },
    { id: 'merchant-center', name: 'Google Merchant Center', type: 'api', auth: 'OAuth' },
  ] },
  { key: 'crm', title: 'D · CRM / email-SMS / retention', connectors: [
    { id: 'klaviyo', name: 'Klaviyo', type: 'api', auth: 'API key', ac: 'AC-09' },
    { id: 'esputnik', name: 'eSputnik', type: 'api', auth: 'API key', ac: 'AC-09' },
    { id: 'getresponse', name: 'GetResponse', type: 'api', auth: 'API key' },
    { id: 'mailchimp', name: 'Mailchimp', type: 'api', auth: 'OAuth' },
    { id: 'sendpulse', name: 'SendPulse', type: 'api', auth: 'API key' },
    { id: 'keycrm', name: 'KeyCRM', type: 'api', auth: 'API key' },
    { id: 'retailcrm', name: 'RetailCRM', type: 'api', auth: 'API key' },
    { id: 'bitrix24', name: 'Bitrix24', type: 'api', auth: 'OAuth' },
    { id: 'hubspot', name: 'HubSpot', type: 'api', auth: 'OAuth' },
    { id: 'pipedrive', name: 'Pipedrive', type: 'api', auth: 'API key' },
  ] },
  { key: 'telephony', title: 'D2 · IP-телефония', connectors: [
    { id: 'binotel', name: 'Binotel', type: 'api', auth: 'API key' },
    { id: 'ringostat', name: 'Ringostat', type: 'api', auth: 'API key' },
    { id: 'phonet', name: 'Phonet', type: 'api', auth: 'API key' },
    { id: 'stream-telecom', name: 'Stream Telecom', type: 'api', auth: 'API key' },
    { id: 'unitalk', name: 'UniTalk', type: 'api', auth: 'API key' },
    { id: 'nova-pbx', name: 'Nova PBX (Нова Пошта)', type: 'api', auth: 'API key' },
    { id: 'asterisk', name: 'Asterisk / FreePBX', type: 'api', auth: 'AMI/ARI' },
  ] },
  { key: 'platform', title: 'E · Платформа магазина / хостинг', connectors: [
    { id: 'shopify', name: 'Shopify', type: 'api', auth: 'OAuth', ac: 'AC-05' },
    { id: 'woocommerce', name: 'WooCommerce / WordPress', type: 'api', auth: 'Consumer key', ac: 'AC-05' },
    { id: 'horoshop', name: 'Хорошоп', type: 'api', auth: 'API key' },
    { id: 'bitrix', name: '1C-Bitrix', type: 'api', auth: 'API key' },
    { id: 'opencart', name: 'OpenCart', type: 'file', auth: 'выгрузка' },
    { id: 'prestashop', name: 'PrestaShop', type: 'api', auth: 'Webservice key' },
    { id: 'magento', name: 'Magento', type: 'api', auth: 'OAuth' },
    { id: 'insales', name: 'InSales', type: 'api', auth: 'API key' },
    { id: 'tilda', name: 'Tilda', type: 'file', auth: 'выгрузка' },
    { id: 'hosting', name: 'Хостинг / сервер (логи)', type: 'file', auth: 'SSH/ручное', ac: 'AC-06' },
  ] },
  { key: 'ops', title: 'F · ERP / товароучёт / операции', connectors: [
    { id: '1c', name: '1С / BAS', type: 'api', auth: 'API/выгрузка', ac: 'AC-10' },
    { id: 'dilovod', name: 'Dilovod', type: 'api', auth: 'API key' },
    { id: 'moysklad', name: 'МойСклад', type: 'api', auth: 'API key' },
    { id: 'odoo', name: 'Odoo', type: 'api', auth: 'API key' },
    { id: 'novaposhta', name: 'Nova Poshta', type: 'api', auth: 'API key', ac: 'AC-16' },
    { id: 'ukrposhta', name: 'Ukrposhta', type: 'api', auth: 'API key' },
    { id: 'zendesk', name: 'Zendesk', type: 'api', auth: 'API key', ac: 'AC-15' },
    { id: 'freshdesk', name: 'Freshdesk', type: 'api', auth: 'API key' },
    { id: 'gorgias', name: 'Gorgias', type: 'api', auth: 'API key' },
    { id: 'helpcrunch', name: 'HelpCrunch', type: 'api', auth: 'API key' },
  ] },
  { key: 'marketplace', title: 'G · Маркетплейсы', connectors: [
    { id: 'rozetka', name: 'Rozetka', type: 'api', auth: 'кабинет/API', ac: 'AC-11' },
    { id: 'prom', name: 'Prom.ua', type: 'api', auth: 'API key' },
    { id: 'allo', name: 'Allo', type: 'api', auth: 'кабинет' },
    { id: 'epicentr', name: 'Epicentr', type: 'api', auth: 'кабинет' },
    { id: 'kasta', name: 'Kasta', type: 'api', auth: 'кабинет' },
    { id: 'amazon', name: 'Amazon (SP-API)', type: 'api', auth: 'OAuth' },
    { id: 'ebay', name: 'eBay', type: 'api', auth: 'OAuth' },
    { id: 'kaufland', name: 'Kaufland', type: 'api', auth: 'API key' },
    { id: 'allegro', name: 'Allegro', type: 'api', auth: 'OAuth' },
    { id: 'price-agg', name: 'Прайс-агрегаторы (Hotline / Price.ua)', type: 'external', auth: 'скрейп/API' },
  ] },
  { key: 'finance', title: 'H · Финансы и данные', connectors: [
    { id: 'pnl', name: 'Управленческая отчётность / P&L', type: 'file', auth: 'файл', ac: 'AC-12' },
    { id: 'orders-export', name: 'Выгрузка заказов 24 мес', type: 'file', auth: 'файл', ac: 'AC-13' },
    { id: 'products-export', name: 'Выгрузка товаров + себестоимости', type: 'file', auth: 'файл', ac: 'AC-14' },
    { id: 'liqpay', name: 'LiqPay', type: 'api', auth: 'API key' },
    { id: 'fondy', name: 'Fondy', type: 'api', auth: 'API key' },
    { id: 'wayforpay', name: 'WayForPay', type: 'api', auth: 'API key' },
    { id: 'stripe', name: 'Stripe', type: 'api', auth: 'API key' },
  ] },
  { key: 'cx', title: 'I · Клиентский опыт / голос клиента', connectors: [
    { id: 'google-reviews', name: 'Google Reviews', type: 'api', auth: 'OAuth', ac: 'AC-20' },
    { id: 'trustpilot', name: 'Trustpilot', type: 'api', auth: 'API key' },
    { id: 'surveys', name: 'Опросы / исследования клиентов', type: 'file', auth: 'файл/анкета', ac: 'AC-19' },
    { id: 'instagram', name: 'Instagram (Graph)', type: 'api', auth: 'Meta OAuth' },
    { id: 'facebook', name: 'Facebook (Graph)', type: 'api', auth: 'Meta OAuth' },
    { id: 'tiktok', name: 'TikTok (органика)', type: 'api', auth: 'OAuth' },
  ] },
  { key: 'design', title: 'J · Дизайн и бренд', connectors: [
    { id: 'figma', name: 'Figma (макеты / дизайн-система)', type: 'api', auth: 'Personal token', ac: 'EX-03' },
    { id: 'brandbook', name: 'Бренд-бук / гайдлайны', type: 'file', auth: 'файл', ac: 'AC-18' },
  ] },
  { key: 'external', title: 'K · Внешние сервисы (без доступов клиента)', connectors: [
    { id: 'wappalyzer', name: 'Wappalyzer (стек)', type: 'external' },
    { id: 'ssllabs', name: 'SSL Labs (безопасность)', type: 'external' },
    { id: 'ad-library', name: 'Meta Ad Library / Google Ads Transparency', type: 'external' },
    { id: 'similarweb', name: 'Similarweb (трафик)', type: 'external' },
    { id: 'webarchive', name: 'Web Archive (история)', type: 'external' },
  ] },
];

export const ALL_CONNECTORS: Connector[] = CONNECTOR_GROUPS.flatMap((g) => g.connectors);
export const connectorById = new Map(ALL_CONNECTORS.map((c) => [c.id, c]));

export const TYPE_LABEL: Record<ConnType, string> = {
  api: 'Живой доступ (API)',
  file: 'Выгрузка / файл',
  external: 'Внешний сервис (без доступа клиента)',
};
