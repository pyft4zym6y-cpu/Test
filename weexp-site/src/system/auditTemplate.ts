/*
 * Шаблон глибокого аудиту (конструктор). Один глобальний шаблон із версіонуванням.
 * Блоки → питання. Типи питань, обов’язковість, підказки, умовна логіка, ролі.
 * Зберігається в Supabase (audit_template) із локальним фолбеком для розробки.
 */
import { CONFIGURED, supabase } from '@/lib/supa';

export type QType = 'text' | 'longtext' | 'number' | 'single' | 'multi' | 'file' | 'access' | 'date' | 'scale' | 'rank' | 'rate10';
export const Q_TYPES: { v: QType; label: string; hint: string }[] = [
  { v: 'text', label: 'Відкрите — коротка відповідь', hint: 'один рядок' },
  { v: 'longtext', label: 'Відкрите — довга відповідь', hint: 'абзац' },
  { v: 'number', label: 'Число', hint: 'сума, кількість' },
  { v: 'single', label: 'Вибір одного варіанта', hint: 'радіо' },
  { v: 'multi', label: 'Вибір декількох', hint: 'чекбокси' },
  { v: 'file', label: 'Файл', hint: 'завантаження' },
  { v: 'access', label: 'Доступ (email)', hint: 'GA4/CRM/реклама' },
  { v: 'date', label: 'Дата', hint: 'календар' },
  { v: 'scale', label: 'Шкала 1–10', hint: 'одна оцінка' },
  { v: 'rank', label: 'Пріоритети 1–10 по пунктах', hint: 'розставити пріоритети' },
  { v: 'rate10', label: 'Важливість 1–10 по пунктах', hint: 'оцінити кожен пункт' },
];

export type Question = {
  key: string; label: string; type: QType;
  required?: boolean; hint?: string; options?: string[];
  condQKey?: string; condValue?: string;   // показати, якщо відповідь на condQKey === condValue
};
export type Block = { key: string; title: string; role?: string; cat?: string; questions: Question[] };
export type AuditTemplate = { version: number; blocks: Block[] };

/** Ролі всередині заказника — обмежують, хто які блоки заповнює. */
export const CLIENT_ROLES = ['Власник', 'Маркетинг', 'Аналітика', 'Фінанси', 'Технічний', 'Операції'];

export const uid = (p = 'q') => `${p}_${Math.random().toString(36).slice(2, 8)}`;

/** Стартовий шаблон — на базі методології Tier-2 (внутрішньо), клієнту як єдиний аудит. */
export const DEFAULT_TEMPLATE: AuditTemplate = {
  version: 1,
  blocks: [
    { key: 'company', title: 'Компанія та ціль', role: 'Власник', questions: [
      { key: 'goal', label: 'Головна бізнес-ціль на 6–12 міс', type: 'longtext', required: true, hint: 'напр.: вийти на €X виторгу / знизити CAC' },
      { key: 'niche', label: 'Ніша / категорія товарів', type: 'text', required: true },
      { key: 'markets', label: 'Ринки, де продаєте зараз', type: 'text' },
      { key: 'revenue', label: 'Оборот на місяць (€)', type: 'number' },
    ]},
    { key: 'analytics', title: 'Аналітика та доступи', role: 'Аналітика', questions: [
      { key: 'ga4', label: 'Доступ до Google Analytics 4 (email аналітика)', type: 'access', required: true, hint: 'додайте audit@weexp.agency як Переглядач' },
      { key: 'gsc', label: 'Доступ до Search Console', type: 'access' },
      { key: 'traffic', label: 'Основні джерела трафіку', type: 'multi', options: ['SEO', 'Google Ads', 'Meta Ads', 'Email/CRM', 'Маркетплейси', 'Реферали'] },
    ]},
    { key: 'economics', title: 'Юніт-економіка', role: 'Фінанси', questions: [
      { key: 'aov', label: 'Середній чек (€)', type: 'number' },
      { key: 'cogs', label: 'Собівартість / маржа', type: 'text', hint: 'хоча б приблизно' },
      { key: 'repeat', label: 'Частка повторних покупок', type: 'scale', hint: 'оцініть 1–10' },
      { key: 'orders', label: 'Вивантаження замовлень за 12 міс', type: 'file' },
    ]},
    { key: 'tech', title: 'Технічне та процеси', role: 'Технічний', questions: [
      { key: 'platform', label: 'Платформа магазину', type: 'single', options: ['Shopify', 'Magento', 'WooCommerce', 'OpenCart', 'Custom', 'Інше'] },
      { key: 'pains', label: 'Головні болі в процесах', type: 'longtext' },
      { key: 'cms', label: 'Доступ до CMS/адмінки (read-only)', type: 'access' },
    ]},
  ],
};

/* ── Повний C-level фреймворк аудиту (16 модулів A–P) ──
   Кожен модуль = блок із питаннями (Q), доступами (access) і файлами (file).
   Це стартовий каркас: адмін розширює/скорочує під тип бізнесу в конструкторі.
   Завантажується кнопкою «Завантажити фреймворк» (не перетирає збережене без згоди). */
type QI = [string, string, QType, (Partial<Question> | undefined)?];
const mod = (cat: string, key: string, title: string, role: string, items: QI[]): Block => ({
  key, cat, title, role,
  questions: items.map(([k, label, type, extra]) => ({ key: `${key}_${k}`, label, type, ...(extra || {}) })),
});
export const AUDIT_FRAMEWORK: AuditTemplate = {
  version: 1,
  blocks: [
    mod('01', 'business', 'Business: модель та економіка', 'Власник', [
      ['why_now', 'Чому ви вирішили почати проект саме зараз?', 'single', { required: true, options: ['Падають продажі', 'Не можемо масштабуватись', 'Вимога інвестора', 'Вихід на новий ринок', 'Зміна платформи', 'Пішла ключова людина', 'Інше'] }],
      ['why_fall', 'З якого місяця почалось падіння і що змінилось у той момент?', 'longtext', { condQKey: 'business_why_now', condValue: 'Падають продажі' }],
      ['scale_break', 'Що ламається першим при зростанні x2?', 'multi', { condQKey: 'business_why_now', condValue: 'Не можемо масштабуватись', options: ['Склад', 'Платформа', 'Команда', 'Гроші', 'Закупівлі', 'Підтримка'] }],
      ['model_one', 'Бізнес-модель одним реченням: хто платить, за що і чому саме вам', 'longtext', { required: true }],
      ['model', 'Модель продажів', 'multi', { options: ['B2C', 'B2B', 'D2C', 'B2B2C', 'Marketplace', 'Опт'] }],
      ['channels_share', 'Частка виручки за каналами: сайт / маркетплейси / опт / розниця / соцмережі (%)', 'longtext'],
      ['dependency', 'Якщо найбільший канал завтра вимкнуть — скільки місяців проживе бізнес?', 'single', { options: ['<1 міс', '1–3 міс', '3–6 міс', '>6 міс', 'Не знаємо'] }],
      ['rev_dyn', 'Динаміка виручки за останні 24 місяці по кварталах', 'longtext'],
      ['seasonality', 'Сезонність: пікові та провальні місяці, частка Q4 у річній виручці', 'text'],
      ['geo_now', 'Географія продажів зараз: країни та частка виручки кожної', 'text', { required: true }],
      ['geo_target', 'Цільові ринки на 12–24 місяці і чому саме вони', 'text'],
      ['margin', 'Валова маржа, %', 'number'],
      ['unit_level', 'Чи порахована юніт-економіка на рівні ОДНОГО замовлення?', 'single', { required: true, options: ['Так', 'Частково', 'Ні'] }],
      ['unit_items', 'Що включено в розрахунок юніт-економіки?', 'multi', { options: ['COGS', 'Еквайринг', 'Упаковка', 'Доставка', 'Повернення', 'Реклама', 'Підтримка', 'Нічого'] }],
      ['neg_cm', 'Яка частка SKU має відʼємний contribution margin?', 'text'],
      ['ltv_cac', 'LTV, CAC та їх співвідношення (як рахуєте)', 'text'],
      ['ccc', 'Cash conversion cycle: DIO / DSO / DPO, скільки днів', 'text'],
      ['cash_gap', 'Чи бувають касові розриви?', 'single', { options: ['Регулярно', 'Іноді', 'Немає'] }],
      ['runway', 'Burn rate на місяць і на скільки місяців вистачає грошей (runway)', 'text'],
      ['top_sku', 'Частка виручки топ-20 SKU і топ-10% клієнтів', 'text'],
      ['breakeven', 'Точка беззбитковості за оборотом на місяць', 'text'],
      ['finmodel', 'Чи є фінансова модель на 12–36 місяців?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['tried', 'Що вже пробували за останні 12 міс і що НЕ спрацювало (агентства, канали, зміни)?', 'longtext', { required: true }],
      ['goals_rank', 'Розставте пріоритети цілей: 1 — найвищий, 10 — найнижчий', 'rank', { required: true, options: ['Зростання обороту', 'Зростання прибутку', 'Вихід на нові ринки', 'Автономність від власника', 'Залучення інвестицій', 'Побудова бренду', 'Зниження залежності від каналу'] }],
      ['risk', 'Прийнятний рівень ризику', 'single', { options: ['Консервативний', 'Збалансований', 'Агресивний'] }],
      ['success12', 'Що має статися через 12 місяців, щоб ви назвали проект успішним?', 'longtext', { required: true }],
      ['pnl_file', 'Управлінський P&L / фінмодель (вивантаження, під NDA)', 'file'],
      ['orders_file', 'Вивантаження замовлень за 24 місяці (CSV)', 'file', { required: true }],
    ]),
    mod('02', 'market', 'Market: ринок, конкуренти, бренд', 'Маркетинг', [
      ['top10', 'Топ-10 конкурентів за рівнем загрози (за спаданням)', 'longtext', { required: true }],
      ['direct_vs', 'Хто з них прямий конкурент, а хто замінник?', 'text'],
      ['monitor', 'Чи ведеться регулярний моніторинг конкурентів?', 'single', { options: ['Системно зі звітом', 'Нерегулярно', 'Дивимось ціни', 'Не ведеться'] }],
      ['price_pos', 'Цінова політика конкурентів відносно вашої', 'single', { options: ['Ми дешевші', 'На рівні', 'Ми дорожчі', 'Розкид', 'Не знаємо'] }],
      ['moat', 'Які сильні сторони конкурентів ви НЕ можете скопіювати, а які слабкості можете використати?', 'longtext'],
      ['attack', 'Якби ви були конкурентом — як би атакували власний бізнес?', 'longtext'],
      ['positioning', 'Позиціонування одним реченням. Чи може конкурент підписатися під ним?', 'longtext', { required: true }],
      ['promise', 'Brand Promise + мінімум три RTB (докази: факт, цифра, сертифікат)', 'longtext'],
      ['three_words', 'Три слова, які мають спадати клієнту на думку при згадці бренду', 'text'],
      ['brand_measure', 'Як вимірюється сила бренду?', 'multi', { options: ['Brand awareness', 'Brand search volume', 'Частка прямого трафіку', 'NPS', 'Цінова премія', 'Не вимірюється'] }],
      ['premium', 'Чи можете продавати дорожче за конкурентів за рахунок бренду?', 'single', { options: ['Так, стійко', 'Іноді', 'Ні', 'Продаємо дешевше'] }],
      ['brand_legal', 'Бренд захищено юридично в UA та ЄС (ТМ / EUIPO)?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['brand_rate', 'Оцініть силу бренду за напрямами (1–10)', 'rate10', { options: ['Впізнаваність', 'Довіра', 'Візуальна система', 'Tone of voice', 'Репутація і відгуки', 'Employer brand'] }],
      ['brandbook_file', 'Бренд-бук / гайдлайни (файл)', 'file'],
      ['swot_file', 'SWOT / конкурентний аналіз, якщо є (файл)', 'file'],
    ]),
    mod('03', 'product', 'Product: асортимент і ціни', 'Маркетинг', [
      ['jtbd', 'Яку задачу клієнта розвʼязує продукт? Сформулюйте від імені клієнта, не компанії', 'longtext', { required: true }],
      ['why_buy', 'Три причини, чому купують саме у вас — словами клієнтів', 'longtext'],
      ['verified', 'Ці причини підтверджені даними чи це думка команди?', 'single', { options: ['Дослідження клієнтів', 'Дані поведінки', 'Думка команди', 'Не перевірялось'] }],
      ['why_not', 'Чому клієнти НЕ купують? Що зупиняє на останньому кроці?', 'longtext'],
      ['sku_count', 'Кількість SKU / категорій / брендів', 'text', { required: true }],
      ['abc', 'Чи проводився ABC/XYZ-аналіз асортименту?', 'single', { options: ['Так', 'Давно', 'Ні'] }],
      ['dead_stock', 'Частка SKU без продажів за 6 міс + оборотність запасів', 'text'],
      ['oos', 'Який % часу топ-SKU перебувають out-of-stock?', 'text'],
      ['matrix', 'Лінійка: вхід, ядро, преміум, аксесуари. Hero products. Що купують разом?', 'longtext'],
      ['pricing_how', 'Як формується ціна?', 'single', { options: ['Cost-plus (націнка)', 'По ринку', 'По цінності', 'Змішано'] }],
      ['promo', 'Чи є промо-календар і правила знижок?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['discount_share', 'Частка замовлень зі знижкою та середня глибина знижки', 'text'],
      ['below_cost', 'Чи є товари, що продаються нижче собівартості з урахуванням УСІХ витрат?', 'single', { options: ['Так', 'Не знаємо', 'Ні'] }],
      ['price15', 'Що має змінитися в продукті, щоб підняти ціну на 15%?', 'longtext'],
      ['attrs', 'Глибина атрибутики товарів для фільтрів і порівняння', 'scale', { hint: '1 — лише назва, 10 — повна атрибутика' }],
      ['feed_file', 'Вивантаження каталогу / товарного фіда (CSV/XML)', 'file', { required: true }],
      ['cost_file', 'Прайс + собівартість за SKU (закрито, під NDA)', 'file'],
    ]),
    mod('04', 'customer', 'Customer: сегменти та утримання', 'Маркетинг', [
      ['personas', 'Скільки описаних персон і на яких даних вони побудовані?', 'text'],
      ['segments', 'Які сегменти клієнтів розрізняєте? Частка виручки найціннішого', 'longtext', { required: true }],
      ['barriers', 'Що заважає ПЕРШІЙ покупці?', 'multi', { options: ['Недовіра до магазину', 'Ціна', 'Складність вибору', 'Умови доставки', 'Умови повернення', 'Немає відгуків', 'Немає потрібної оплати'] }],
      ['cjm', 'Чи побудована карта шляху клієнта (CJM) хоча б для одного сегмента?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['lost_stage', 'На якому етапі шляху втрачається найбільше клієнтів?', 'single', { options: ['Обізнаність', 'Розгляд', 'Вибір', 'Покупка', 'Отримання', 'Повторна покупка'] }],
      ['repeat', 'Repeat rate і через скільки днів відбувається друга покупка', 'text', { required: true }],
      ['nps', 'Чи вимірюється NPS і яка динаміка?', 'single', { options: ['Регулярно', 'Разово', 'Не вимірюється'] }],
      ['voc', 'Як збирається Voice of Customer?', 'single', { options: ['Системно з тегуванням', 'Читаємо вибірково', 'Лише скарги', 'Не збирається'] }],
      ['reviews_per', 'Скільки відгуків на 100 замовлень? Домінуючі теми негативу', 'text'],
      ['support', 'Канали підтримки клієнтів і середній час першої відповіді', 'text'],
      ['first_find', 'Як клієнти знаходять вас уперше?', 'multi', { options: ['Пошук', 'Реклама', 'Соцмережі', 'Рекомендації', 'Маркетплейс', 'Офлайн', 'Не знаємо'] }],
      ['sources', 'Які джерела інформації клієнт використовує перед покупкою?', 'multi', { options: ['Пошук Google', 'AI-асистенти', 'Відгуки', 'YouTube', 'Соцмережі', 'Маркетплейси', 'Друзі'] }],
      ['quotes', 'Що клієнти кажуть про вас своїми словами? Наведіть три цитати', 'longtext'],
      ['icp', 'Чи є профіль «ідеального клієнта» (ICP) з вимірними ознаками?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['unprofitable', 'Які клієнти обслуговуються у збиток?', 'single', { options: ['Знаємо і є такі', 'Не знаємо', 'Немає'] }],
      ['research_file', 'Дослідження / опитування клієнтів (файл)', 'file'],
    ]),
    mod('05', 'website', 'Website: UX та конверсія', 'Технічний', [
      ['funnel', 'Воронка у цифрах: Session → PDP → Cart → Checkout → Purchase', 'longtext', { required: true }],
      ['cr_devices', 'Конверсія за пристроями: desktop / mobile', 'text'],
      ['checkout', 'Скільки кроків у чекауті? Чи є гостьове замовлення?', 'text'],
      ['abandon', 'Кинуті кошики: чи є тригерні ланцюжки повернення?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['cart_top', 'Які товари найчастіше додають у кошик, але не купують?', 'text'],
      ['search', 'Внутрішній пошук: чи аналізуються нульові запити?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['ab_tests', 'A/B-тести: скільки на місяць і хто веде?', 'text'],
      ['heatmaps', 'Heatmaps / записи сесій використовуються?', 'single', { options: ['Так', 'Іноді', 'Ні'] }],
      ['trust', 'Де на сайті знімаються заперечення: ціна, довіра, доставка, повернення?', 'longtext'],
      ['speed', 'Швидкість ключових сторінок на мобільних (LCP)', 'text'],
      ['a11y', 'Відповідність вимогам доступності WCAG (для ЄС)?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['app', 'Мобільний застосунок', 'single', { options: ['Є', 'Плануємо', 'Немає'] }],
      ['ux_rate', 'Оцініть кожну зону сайту від 1 до 10', 'rate10', { required: true, options: ['Головна сторінка', 'Каталог і фільтри', 'Картка товару', 'Кошик', 'Checkout', 'Mobile-версія', 'Внутрішній пошук'] }],
      ['cms_access', 'Доступ до CMS/адмінки (read-only)', 'access', { required: true }],
      ['funnel_file', 'Вивантаження/скриншот воронки з аналітики', 'file'],
    ]),
    mod('06', 'seo', 'SEO / GEO / AEO', 'Маркетинг', [
      ['organic_share', 'Яка частка виручки приходить з органічного пошуку?', 'text', { required: true }],
      ['index', 'Скільки сторінок в індексі і скільки всього на сайті?', 'text'],
      ['semantic', 'Чи зібране семантичне ядро і коли оновлювалось?', 'single', { options: ['Так', 'Давно', 'Ні'] }],
      ['unique_desc', 'Описи товарів', 'single', { options: ['Унікальні', 'Частково', 'Копія постачальника'] }],
      ['schema', 'Які структуровані дані є?', 'multi', { options: ['Product', 'Offer', 'Review', 'FAQ', 'Breadcrumb', 'Немає'] }],
      ['cwv', 'Core Web Vitals на мобільних: LCP / INP / CLS', 'text'],
      ['facets', 'Фасетні сторінки: індексація керується правилами?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['links', 'Посилальний профіль і робота з зовнішніми посиланнями', 'text'],
      ['migration', 'Чи була міграція сайту і що сталося з трафіком?', 'text'],
      ['ai_vis', 'Чи моніториться присутність бренду в AI-відповідях (ChatGPT, Perplexity, AI Overviews)?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['ai_ready', 'Контент готовий до цитування AI: чіткі відповіді, таблиці, факти?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['oos_pages', 'Як обробляються товари out-of-stock і зняті з продажу?', 'single', { options: ['410/404', 'Редірект', 'Лишаються', 'Не визначено'] }],
      ['multilang', 'Мультимовність і коректність hreflang', 'single', { options: ['Так', 'Частково', 'Ні', 'Не застосовно'] }],
      ['gsc_access', 'Google Search Console (доступ)', 'access', { required: true }],
      ['tools_access', 'Ahrefs / Semrush / Serpstat (доступ або звіти)', 'access'],
    ]),
    mod('07', 'acquisition', 'Acquisition: платні канали', 'Маркетинг', [
      ['budget', 'Місячний маркетинговий бюджет і розподіл за каналами', 'text', { required: true }],
      ['mer', 'MER: загальна виручка / загальний маркетинговий бюджет', 'text'],
      ['who', 'Хто веде рекламу?', 'single', { options: ['Всередині', 'Агентство', 'Змішано'] }],
      ['owner_access', 'Чи має власник доступ до ВСІХ рекламних кабінетів і даних?', 'single', { condQKey: 'acquisition_who', condValue: 'Агентство', options: ['Так', 'Ні'] }],
      ['brand_share', 'Частка брендового трафіку в платному пошуку', 'text'],
      ['attribution', 'Як атрибутуються продажі між каналами?', 'single', { options: ['Last click', 'Data-driven', 'Модель MMM', 'Не атрибутуються'] }],
      ['cac_dyn', 'Динаміка CAC за 12 міс. CAC нових vs тих, що повертаються', 'text'],
      ['creatives', 'Скільки нових креативів на місяць і хто їх робить?', 'text'],
      ['media', 'Власні медіа-активи', 'multi', { options: ['Блог', 'YouTube', 'Email-база', 'Telegram', 'Немає'] }],
      ['untested', 'Які канали ви не пробували і чому?', 'text'],
      ['channels_rate', 'Оцініть віддачу каналів 1–10 (пропустіть ті, що не використовуєте)', 'rate10', { options: ['Google Search', 'PMax / Shopping', 'Meta Ads', 'TikTok Ads', 'Email / CRM', 'Інфлюенсери', 'Affiliate', 'Реклама на маркетплейсах'] }],
      ['gads_access', 'Google Ads (read-only доступ)', 'access'],
      ['meta_access', 'Meta Ads Manager (Analyst)', 'access'],
      ['merchant_access', 'Google Merchant Center (Standard)', 'access'],
      ['reports_file', 'Рекламні звіти за 6–12 міс (файл)', 'file'],
    ]),
    mod('08', 'crm', 'CRM / Retention', 'Маркетинг', [
      ['crm_share', 'Частка виручки з email / SMS / push', 'text', { required: true }],
      ['platform', 'Яка платформа CRM / розсилок?', 'text'],
      ['flows', 'Які автоматичні ланцюжки налаштовані?', 'multi', { options: ['Welcome', 'Кинутий кошик', 'Кинутий перегляд', 'Post-purchase', 'Реактивація', 'Дні народження', 'Немає'] }],
      ['rfm', 'Чи є RFM або інша сегментація бази?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['ltv_cohort', 'LTV по когортах і каналах залучення відомий?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['loyalty', 'Програма лояльності працює економічно (порахований ефект)?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['deliver', 'Доставленість і open rate листів', 'text'],
      ['auth3', 'SPF, DKIM, DMARC налаштовані?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['profile', 'Єдиний профіль клієнта між сайтом, маркетплейсами й офлайном?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['base', 'Розмір email/SMS бази та її активна частина', 'text'],
      ['dormant', 'Що робите з клієнтами, які купили один раз понад рік тому?', 'text'],
      ['gdpr', 'Відповідність GDPR / закону про персональні дані?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['crm_access', 'Доступ до CRM/ESP (Klaviyo / eSputnik / HubSpot…)', 'access', { required: true }],
      ['base_file', 'Вивантаження бази (знеособлено, під NDA)', 'file'],
    ]),
    mod('09', 'analytics', 'Analytics: дані та BI', 'Аналітика', [
      ['stack', 'Які системи аналітики встановлені?', 'multi', { required: true, options: ['GA4', 'GTM', 'Server-side', 'Внутрішня BI', 'Нічого'] }],
      ['match', 'Чи збігаються дані аналітики з бекендом по замовленнях?', 'single', { required: true, options: ['Розходження <5%', '5–15%', '>15%', 'Не звірялось'] }],
      ['events', 'Подієва модель налаштована (перегляд, кошик, чекаут, покупка)?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['margin_pass', 'Собівартість і маржа передаються в аналітику?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['dwh', 'Де живуть дані?', 'single', { options: ['DWH', 'Коробкові звіти', 'Excel', 'Немає'] }],
      ['dashboards', 'Які дашборди існують і хто ними користується?', 'text'],
      ['alerts', 'Чи є алерти на аномалії (падіння конверсії, помилки оплати)?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['consent', 'Consent management є і як впливає на дані?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['ga4_access', 'Google Analytics 4 (Viewer)', 'access', { required: true }],
      ['gtm_access', 'Google Tag Manager (Read)', 'access'],
      ['bi_file', 'Приклад управлінського дашборда / звіту (файл)', 'file'],
    ]),
    mod('10', 'operations', 'Operations: склад і логістика', 'Операції', [
      ['warehouse', 'Склад', 'single', { required: true, options: ['Власний', '3PL', 'Змішано', 'Дропшипінг'] }],
      ['wms', 'Чи є WMS і адресне зберігання?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['pick_err', '% помилок збірки; % замовлень, відвантажених у день оформлення', 'text'],
      ['stock_acc', 'Точність обліку залишків', 'text'],
      ['delivery', 'Служби доставки, їх частки, вартість логістики на замовлення', 'text'],
      ['returns', '% повернень, основні причини, вартість обробки', 'text', { required: true }],
      ['otif', 'OTIF / SLA доставки відстежуються?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['erp', 'Яка ERP?', 'single', { options: ['Odoo', '1C/BAS', 'SAP', 'Інша', 'Немає ERP'] }],
      ['erp_none', 'Де ведеться облік закупівель, залишків і собівартості?', 'longtext', { condQKey: 'operations_erp', condValue: 'Немає ERP' }],
      ['suppliers', 'Кількість постачальників, умови оплати, тривалість циклу поставки', 'text'],
      ['mp', 'Чи продаєте на маркетплейсах?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['mp_econ', 'Юніт-економіка маркетплейсів з комісіями, логістикою й поверненнями порахована?', 'single', { condQKey: 'operations_mp', condValue: 'Так', options: ['Так', 'Ні'] }],
      ['mp_share', 'Площадки, частка виручки з кожної, рейтинг і відгуки', 'text', { condQKey: 'operations_mp', condValue: 'Так' }],
      ['payments', 'Способи оплати, їх частки, % відхилених оплат', 'text'],
      ['vat_oss', 'ПДВ-реєстрації в країнах продажу / OSS-IOSS для дистанційних продажів у ЄС', 'single', { options: ['Так, все оформлено', 'Частково', 'Ні', 'Не застосовно'] }],
      ['gpsr_epr', 'Готовність до GPSR (відповідальна особа в ЄС) та EPR-реєстрацій (упаковка/електроніка)', 'single', { options: ['Так', 'Частково', 'Ні', 'Не знаємо про це'] }],
      ['erp_access', 'Доступ до ERP / WMS (read-only)', 'access'],
      ['stock_file', 'Вивантаження залишків та оборотності (файл)', 'file'],
    ]),
    mod('11', 'technology', 'Technology: платформа й безпека', 'Технічний', [
      ['platform_v', 'Платформа магазину і версія', 'text', { required: true }],
      ['devs', 'Хто займається розробкою?', 'single', { options: ['Внутрішня команда', 'Підрядник', 'Фрилансери', 'Ніхто'] }],
      ['infra', 'Що з інженерної інфраструктури є?', 'multi', { options: ['Документація', 'Git', 'Staging', 'CI/CD', 'Нічого'] }],
      ['custom', 'Наскільки платформа відхилена від стандарту', 'scale', { hint: '1 — стандарт, 10 — повний кастом' }],
      ['integrations', 'Які системи інтегровані між собою?', 'multi', { options: ['ERP', 'CRM', 'WMS', '1C/BAS', 'Маркетплейси', 'Бухгалтерія', 'Нічого'] }],
      ['data_flow', 'Як передаються дані між системами?', 'single', { options: ['API real-time', 'Періодичні вивантаження', 'Вручну'] }],
      ['backup', 'Резервне копіювання', 'single', { options: ['Є і перевіряли відновлення', 'Є, але не перевіряли', 'Немає'] }],
      ['security', 'Безпека: SSL, доступи, вразливості. Хто володіє доменом, хостингом, акаунтами?', 'longtext'],
      ['pim', 'Де живуть товарні дані?', 'single', { options: ['PIM', 'У платформі', 'Excel', 'ERP'] }],
      ['sla', 'Чи є SLA з підрядником і час реакції на інциденти?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['change', 'Чи розглядається зміна платформи і чому?', 'single', { options: ['Так', 'Можливо', 'Ні'] }],
      ['hosting_access', 'Хостинг / сервер (read-only або метрики)', 'access'],
      ['arch_file', 'Схема архітектури / техдокументація (файл)', 'file'],
    ]),
    mod('12', 'organization', 'Organization: команда, процеси, AI', 'Власник', [
      ['org', 'Оргструктура e-commerce напряму. Хто володіє кожним каналом?', 'longtext', { required: true }],
      ['missing', 'Які компетенції критично відсутні всередині?', 'multi', { options: ['Аналітика', 'SEO', 'Performance', 'CRM', 'Операції', 'Фінанси', 'Міжнародне', 'AI'] }],
      ['key_person', 'Чи є залежність від одного ключового співробітника?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['owner_free', 'Що станеться з бізнесом, якщо власник поїде на 3 місяці?', 'single', { required: true, options: ['Все стане', 'Просяде', 'Продовжить працювати'] }],
      ['okr', 'Чи є система цілей і оцінки (OKR/KPI) для команди?', 'single', { options: ['Так', 'Частково', 'Ні'] }],
      ['rhythm', 'Управлінський ритм: які зустрічі та з якою періодичністю?', 'text'],
      ['decisions', 'Як ухвалюються рішення?', 'single', { options: ['Одноосібно', 'Колегіально', 'За даними', 'Хаотично'] }],
      ['processes', 'Наскільки процеси описані в документах', 'scale', { hint: '1 — нічого, 10 — все формалізовано' }],
      ['manual', 'Який % часу команди йде на ручну рутину? Що вже автоматизовано?', 'text'],
      ['ai_use', 'Чи використовується AI у бізнес-процесах сьогодні?', 'single', { options: ['Так', 'Точково', 'Ні'] }],
      ['ai_maturity', 'AI-зрілість компанії', 'single', { options: ['L1 Хаос: разове використання', 'L2 Повторювано: окремі співробітники', 'L3 Визначено: є процеси', 'L4 Керовано: є метрики', 'L5 Оптимізовано: AI в ядрі'] }],
      ['ai_block', 'Що заважає впроваджувати AI сьогодні?', 'multi', { options: ['Дані', 'Люди', 'Процеси', 'Довіра', 'Бюджет', 'Ніщо'] }],
      ['invest_budget', 'Орієнтовний бюджет на впровадження змін (окремо від поточного маркетингового), €/міс', 'text', { required: true }],
      ['project_team', 'Хто з команди буде виділений на проект впровадження?', 'single', { required: true, options: ['Виділена людина fulltime', 'Кілька людей part-time', 'Лише власник', 'Поки ніхто'] }],
      ['frozen', 'Що НЕ можна змінювати найближчі 6–12 міс (платформа, підрядник, бренд, ціни…)?', 'longtext'],
      ['sponsor', 'Хто спонсор проекту і хто підтримуватиме зміни через 6 місяців?', 'text'],
      ['resist', 'Готовність команди до змін', 'scale', { hint: '1 — активний опір, 10 — повна підтримка' }],
      ['block_rate', 'Оцініть ВАЖЛИВІСТЬ кожного напряму для вашого бізнесу (1–10)', 'rate10', { required: true, options: ['Економіка і фінанси', 'Ринок і бренд', 'Асортимент і ціни', 'Клієнт і утримання', 'Сайт і конверсія', 'SEO і органіка', 'Платна реклама', 'CRM і retention', 'Аналітика', 'Операції і логістика', 'Технології', 'Команда і процеси'] }],
      ['org_file', 'Оргструктура (файл)', 'file'],
    ]),
  ],
};

/* ── Дошивка фреймворку під документи пакета ──
   Кожне питання/файл нижче ЖИВИТЬ конкретний документ фінального пакета
   (томи A–E, звіти 1–5, Гант) — щоб зібрати максимально вичерпну інформацію
   без другого кола питань до клієнта. hint показує, куди йде відповідь. */
const PACK_EXTRA: Record<string, [string, string, QType, (Partial<Question> | undefined)?][]> = {
  business: [
    ['pl24', 'P&L помісячно за 24 місяці (Excel / Google Sheets)', 'file', { required: true, hint: '→ Звіт 3: міст P&L, окупність, сезонність' }],
    ['cashflow', 'Cash Flow / рух коштів за 12 місяців', 'file', { hint: '→ Звіт 3: каса, підготовка Q4' }],
    ['goal12', 'Ціль на 12 міс одним числом (виручка або прибуток / міс) + що для вас «успіх»', 'text', { required: true, hint: '→ Звіт 1: точка Б у горизонтах' }],
    ['attempts', 'Що вже пробували за останні 2 роки (агентства, редизайни, проєкти) і чим закінчилось', 'longtext', { required: true, hint: '→ Звіти 1/2: розділ «що вже пробували» — не радимо провалене повторно' }],
  ],
  market: [
    ['competitors3', 'Топ-3 прямі конкуренти (посилання на сайти)', 'text', { required: true, hint: '→ Том A: порівняння з еталоном · Звіт 2, Market' }],
    ['bench', 'На кого рівняєтесь у ніші — найкращий приклад магазину/бренду', 'text', { hint: '→ еталони для поблочних порівнянь' }],
  ],
  product: [
    ['top_sku', 'Топ-20 SKU за виручкою: вивантаження з цінами й залишками', 'file', { required: true, hint: '→ Том A: вибірка карток · Звіт 2, Product' }],
    ['cost_sku', 'Повна собівартість топ-SKU (закупівля + логістика + пакування)', 'file', { hint: '→ Звіт 3: юніт-економіка й важелі маржі' }],
  ],
  customer: [
    ['voc', 'Експорт відгуків за 6–12 міс (усі майданчики, з оцінками й датами)', 'file', { hint: '→ Том E: VoC, момент розпакування · Звіт 2, Customer' }],
    ['support_dialogs', 'Вибірка листувань підтримки: 20–30 діалогів (знеособлено)', 'file', { hint: '→ Том A: Q&A на картці · Том E: етап Support' }],
    ['nps_state', 'Чи міряєте NPS/задоволеність? Якщо так — останні результати', 'text', { hint: '→ Том E: етап Advocacy, baseline' }],
  ],
  website: [
    ['key_pages', 'Ключові сторінки для посторінкового розбору: головна, топ-3 категорії, топ-5 карток, кошик, checkout (URL списком)', 'longtext', { required: true, hint: '→ Том A: поблочний розбір 0–5 і макети «зараз → як треба»' }],
    ['ab_history', 'Що тестували на сайті за рік (A/B, редизайни) і з яким результатом', 'longtext', { hint: '→ Том A: щоб не рекомендувати вже провалене' }],
  ],
  seo: [
    ['sem_export', 'Вивантаження семантики / позицій (якщо ведеться: Ahrefs/Semrush/Serpstat)', 'file', { hint: '→ Том C: кластери, покриття, пріоритети' }],
    ['blog_state', 'Стан блогу/гайдів: скільки матеріалів, хто і як часто пише', 'text', { hint: '→ Томи B/C: контент-план' }],
  ],
  acquisition: [
    ['creatives', 'Приклади рекламних креативів за 3 міс: топ-3 і 3 провальні', 'file', { hint: '→ Звіт 2, Acquisition: що працює в креативі' }],
  ],
  crm: [
    ['letters', 'Приклади листів: транзакційні + маркетингові (5–10 штук, скрини або html)', 'file', { hint: '→ Том B: цільові тексти листів «зараз → як треба»' }],
    ['flows_list', 'Які автоланцюжки (flows) налаштовані зараз — список із тригерами', 'longtext', { required: true, hint: '→ Том E: етап Repeat — вікно 30–60 днів' }],
  ],
  analytics: [
    ['orders24', 'Вивантаження замовлень з бекенда за 24 міс (CSV: дата, сума, id клієнта, канал, статус)', 'file', { required: true, hint: '→ звірка GA4 ↔ бекенд, когорти, повторні — Звіти 2/3' }],
  ],
  operations: [
    ['carriers', 'Звіти перевізників за 6–12 міс: строки, статуси, пошкодження/бій', 'file', { hint: '→ Том E: доставка й розпакування · Звіт 2, Operations' }],
    ['stock', 'Залишки та обіговість по SKU (вивантаження зі складу/ERP)', 'file', { hint: '→ Звіт 2, Operations: OOS і dead stock у грошах' }],
  ],
  technology: [
    ['releases', 'Як релізиться сайт: хто, як часто, чи є staging/бекапи', 'text', { hint: '→ Звіт 2, Technology · Гант W2: staging' }],
  ],
  organization: [
    ['contractors', 'Підрядники: хто, за що відповідає, бюджет/міс, строк договору', 'longtext', { required: true, hint: '→ Гант: лист «Підрядники» + тендерний блок' }],
    ['capacity', 'Ємність команди: ролі × годин на тиждень, доступних на проєкт', 'longtext', { hint: '→ Звіт 4: ресурсна модель без перевантажень' }],
    ['decisions', 'Які рішення ухвалює ЛИШЕ власник (список типів рішень)', 'longtext', { hint: '→ Звіт 4: лінія автономності, політики делегування' }],
  ],
};
for (const b of AUDIT_FRAMEWORK.blocks) {
  const ex = PACK_EXTRA[b.key];
  if (!ex) continue;
  for (const [k, label, type, extra] of ex) {
    if (!b.questions.some((q) => q.key === `${b.key}_${k}`)) b.questions.push({ key: `${b.key}_${k}`, label, type, ...(extra || {}) });
  }
}

/* ── Єдиний фреймворк ──
   Пресетів за типом бізнесу немає свідомо: аудит завжди стартує з максимально
   вичерпного набору (принцип «краще надлишковий максимум інформації»);
   адмін прибирає нерелевантне вручну, а не вгадує наперед. */
export const FRAMEWORK_PRESETS: { id: string; label: string; modules: string[] }[] = [
  { id: 'full', label: 'Єдиний повний фреймворк (12 модулів)', modules: ['business', 'market', 'product', 'customer', 'website', 'seo', 'acquisition', 'crm', 'analytics', 'operations', 'technology', 'organization'] },
];
/** Свіжий блок «Customer Archetype» (CA1…CAn) — окремий набір питань під портрет аудиторії. */
export function customerArchetypeBlock(n: number): Block {
  const key = uid('ca');
  const items: [string, string, QType, (Partial<Question> | undefined)?][] = [
    ['who', `Хто цей клієнт (CA${n}): demographics / business profile`, 'longtext', { required: true }],
    ['geo', 'Географія, дохід / розмір бізнесу', 'text'],
    ['jtbd', 'Потреби та jobs-to-be-done', 'longtext'],
    ['pains', 'Болі, мотивація, барʼєри, заперечення', 'longtext'],
    ['criteria', 'Критерії вибору та тригери покупки', 'text'],
    ['value', 'Частота покупки, середній чек, LTV', 'text'],
    ['retention', 'Retention / churn / preferred channels', 'text'],
    ['journey', 'Customer journey і post-purchase поведінка', 'longtext'],
  ];
  return { key, cat: 'CA', title: `Клієнт — CA${n}`, role: 'Маркетинг', questions: items.map(([k, label, type, extra]) => ({ key: `${key}_${k}`, label, type, ...(extra || {}) })) };
}

/** Побудувати шаблон під пресет: модулі AUDIT_FRAMEWORK у порядку пресету. */
export function frameworkFor(presetId: string): AuditTemplate {
  const preset = FRAMEWORK_PRESETS.find((p) => p.id === presetId) || FRAMEWORK_PRESETS[0];
  const byKey = new Map(AUDIT_FRAMEWORK.blocks.map((b) => [b.key, b]));
  const blocks = preset.modules.map((k) => byKey.get(k)).filter((b): b is Block => !!b);
  return { version: 1, blocks: structuredClone(blocks) };
}

const LS_KEY = 'weexp:audit-template-v1';

export async function loadTemplate(): Promise<AuditTemplate> {
  if (CONFIGURED) {
    try {
      const { data } = await supabase.from('audit_template').select('version,schema').eq('active', true).maybeSingle();
      const schema = data?.schema as { blocks?: Block[] } | undefined;
      if (schema?.blocks) return { version: (data?.version as number) || 1, blocks: schema.blocks };
    } catch { /* fallback */ }
  }
  try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r) as AuditTemplate; } catch { /* ignore */ }
  return DEFAULT_TEMPLATE;
}

export async function saveTemplate(t: AuditTemplate): Promise<{ ok: boolean; error?: string; local?: boolean }> {
  const next: AuditTemplate = { ...t, version: (t.version || 1) };
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  if (!CONFIGURED) return { ok: true, local: true };
  try {
    // Нова версія активна; попередні лишаються (заморожені для вже початих аудитів).
    await supabase.from('audit_template').update({ active: false }).eq('active', true);
    const { error } = await supabase.from('audit_template').upsert({ version: next.version, schema: { blocks: next.blocks }, active: true });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
