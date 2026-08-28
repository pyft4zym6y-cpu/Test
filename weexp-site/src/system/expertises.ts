/**
 * Фокусні експертизи WEEXP (хаб «Експансія»). Кожна — окрема підсторінка
 * /expansion/:slug зі своїм описом. Двомовно (uk, en) через кортежі + L().
 * Міжнародна експансія лишається однією з експертиз (колишня /expansion).
 */
export type Lng = 'uk' | 'en';
type P = [string, string]; // [uk, en]
export const L = (p: P, lang: Lng): string => (lang === 'en' ? p[1] : p[0]);

export type Expertise = {
  slug: string;
  tag: P;
  title: P;
  tagline: P;          // рукописний акцент
  intro: P;
  services: { name: P; desc: P }[];
  deliverables: P[];
  process: { t: P; d: P }[];
  outcome: P;
  /**
   * Яку БІЗНЕС-ЗАДАЧУ закриває експертиза. Без цього поля список неминуче
   * читається як перелік послуг: «брендинг, UX, розробка» — і клієнт сам має
   * здогадатись, навіщо це йому. Одне речення, мовою власника, не нашою.
   */
  job: P;
};

export const EXPERTISES: Expertise[] = [
  {
    slug: 'international',
    job: [
      'Ринок вичерпано, а зростати треба — і незрозуміло, який ринок узяти наступним і чи вистачить маржі.',
      'The market is saturated but you must grow — and it is unclear which market to take next and whether margin will hold.',
    ],
    tag: ['Ринки ЄС і США', 'EU & US markets'],
    title: ['Міжнародна експансія', 'International expansion'],
    tagline: ['Вихід за межі одного ринку — системно.', 'Beyond a single market — systematically.'],
    intro: [
      'Виводимо бренд на ЄС/США як систему, а не «спробуємо й подивимось»: вибір ринку за юніт-економікою, юрособа й податки, локалізація, власний сайт і маркетплейси, логістика та перші продажі.',
      'We take a brand into the EU/US as a system, not «let’s try and see»: market choice by unit economics, legal entity and taxes, localization, own site and marketplaces, logistics and first sales.',
    ],
    services: [
      { name: ['Вибір ринку', 'Market selection'], desc: ['Попит, конкуренція, CAC і розмір категорії — куди йти першими.', 'Demand, competition, CAC and category size — where to go first.'] },
      { name: ['Інфраструктура', 'Infrastructure'], desc: ['Юрособа, VAT/OSS, платежі й розрахунки під ринок.', 'Legal entity, VAT/OSS, payments and settlements for the market.'] },
      { name: ['Локалізація', 'Localization'], desc: ['Мова, контент, ціни й офер під локального клієнта.', 'Language, content, prices and offer for the local customer.'] },
      { name: ['Канали', 'Channels'], desc: ['Власний сайт + Amazon / Allegro / локальні маркетплейси.', 'Own site + Amazon / Allegro / local marketplaces.'] },
      { name: ['Логістика й fulfillment', 'Logistics & fulfillment'], desc: ['Склади, доставка, повернення й penetration маркетплейсів.', 'Warehousing, delivery, returns and marketplace penetration.'] },
      { name: ['Юніт-економіка ринку', 'Market unit economics'], desc: ['Рахуємо маржу до запуску, а не після перших збитків.', 'We model margin before launch, not after the first losses.'] },
    ],
    deliverables: [
      ['Карта пріоритетних ринків із обґрунтуванням', 'Prioritized market map with rationale'],
      ['Модель юніт-економіки на ринок', 'Per-market unit-economics model'],
      ['План запуску на 90 днів', '90-day launch plan'],
      ['Чек-лист legal / tax / payment', 'Legal / tax / payment checklist'],
    ],
    process: [
      { t: ['Аудит готовності', 'Readiness audit'], d: ['Продукт, маржа, запас операцій на 6–12 міс.', 'Product, margin, 6–12 mo operational runway.'] },
      { t: ['Вибір ринку', 'Market choice'], d: ['Один перший ринок за економікою, не «усе одразу».', 'One first market by economics, not «all at once».'] },
      { t: ['Інфраструктура', 'Infrastructure'], d: ['Юрособа, податки, платежі, логістика.', 'Entity, taxes, payments, logistics.'] },
      { t: ['Запуск', 'Launch'], d: ['Лістинги, контент, перший трафік і замовлення.', 'Listings, content, first traffic and orders.'] },
      { t: ['Оптимізація', 'Optimization'], d: ['Доводимо до позитивної економіки й плейбуку.', 'To positive economics and a repeatable playbook.'] },
    ],
    outcome: [
      'Перший ринок, доведений до позитивної економіки, і повторюваний плейбук для наступних.',
      'A first market taken to positive economics, and a repeatable playbook for the next ones.',
    ],
  },
  {
    slug: 'automation',
    job: [
      'Бізнес тримається на памʼяті кількох людей: замовлення губляться, цифри в кожного свої, власник у операційці.',
      'The business rests on a few people’s memory: orders slip, everyone has their own numbers, the owner is stuck in operations.',
    ],
    tag: ['Операції без ручного режиму', 'Operations without manual mode'],
    title: ['Бізнес-процеси', 'Business processes'],
    tagline: ['Щоб бізнес працював без героїзму.', 'So the business runs without heroics.'],
    intro: [
      'Вибудовуємо й автоматизуємо бізнес-процеси, з яких витікають час і гроші: CRM і воронка продажів, інтеграції ERP / склад / доставка, ролі та регламенти, автоматичні сценарії й звітність у реальному часі.',
      'We design and automate the business processes that leak time and money: CRM and sales pipeline, ERP / warehouse / delivery integrations, roles and playbooks, automated scenarios and real-time reporting.',
    ],
    services: [
      { name: ['CRM і pipeline', 'CRM & pipeline'], desc: ['Єдина воронка продажів зі статусами й відповідальними.', 'One sales pipeline with statuses and owners.'] },
      { name: ['Інтеграції', 'Integrations'], desc: ['ERP, склад, каса, доставка, платежі — в один контур.', 'ERP, warehouse, POS, delivery, payments — into one loop.'] },
      { name: ['Автосценарії', 'Auto-scenarios'], desc: ['Тригери, розсилки, зміни статусів, нагадування.', 'Triggers, campaigns, status changes, reminders.'] },
      { name: ['Єдина звітність / BI', 'Unified reporting / BI'], desc: ['Одні цифри для всіх рішень, а не в кожного свої.', 'One set of numbers for all decisions, not per-person.'] },
      { name: ['Ролі й регламенти', 'Roles & playbooks'], desc: ['RACI, зони відповідальності, повторювані процеси.', 'RACI, ownership zones, repeatable processes.'] },
      { name: ['Документообіг і задачі', 'Docs & task flow'], desc: ['Задачі, погодження й документи без хаосу в чатах.', 'Tasks, approvals and docs without chat chaos.'] },
    ],
    deliverables: [
      ['Карта процесів as-is → to-be', 'Process map as-is → to-be'],
      ['Налаштована CRM та інтеграції', 'Configured CRM and integrations'],
      ['Дашборд ключових метрик', 'Key-metrics dashboard'],
      ['Регламенти й ролі команди', 'Playbooks and team roles'],
    ],
    process: [
      { t: ['Аудит процесів', 'Process audit'], d: ['Де саме ручна робота й втрати.', 'Where the manual work and losses are.'] },
      { t: ['Дизайн to-be', 'To-be design'], d: ['Як має працювати без героїзму.', 'How it should run without heroics.'] },
      { t: ['Впровадження', 'Implementation'], d: ['CRM, інтеграції, сценарії.', 'CRM, integrations, scenarios.'] },
      { t: ['Навчання', 'Enablement'], d: ['Команда працює в системі, а не повз неї.', 'The team works in the system, not around it.'] },
      { t: ['Підтримка', 'Support'], d: ['Стабілізація й розвиток контуру.', 'Stabilization and further development.'] },
    ],
    outcome: [
      'Менше ручних дій і помилок, прозорі цифри, бізнес не залежить від пам’яті окремих людей.',
      'Fewer manual steps and errors, transparent numbers, a business that doesn’t depend on individuals’ memory.',
    ],
  },
  {
    slug: 'branding',
    job: [
      'Вас порівнюють лише за ціною: бренд нічим не відрізняється, і кожен продаж доводиться вигризати знижкою.',
      'You are compared on price alone: the brand stands for nothing, and every sale has to be bought with a discount.',
    ],
    tag: ['Позиціонування й айдентика', 'Positioning & identity'],
    title: ['Брендинг', 'Branding'],
    tagline: ['Щоб вибирали вас, а не дешевше.', 'So they choose you, not the cheaper one.'],
    intro: [
      'Будуємо бренд як комерційний інструмент: позиціонування, яке пояснює, чому дорожче; візуальну систему, яку впізнають; і мову, якою бренд говорить однаково в рекламі, на сайті й у підтримці.',
      'We build the brand as a commercial instrument: positioning that explains why you cost more, a visual system people recognize, and a voice the brand speaks consistently in ads, on site and in support.',
    ],
    services: [
      { name: ['Позиціонування', 'Positioning'], desc: ['Для кого, проти кого і чому дорожче — у одному реченні.', 'For whom, against whom and why you cost more — in one sentence.'] },
      { name: ['Бренд-стратегія', 'Brand strategy'], desc: ['Обіцянка, докази, архітектура брендів і продуктів.', 'Promise, proof, architecture of brands and products.'] },
      { name: ['Brand Identity', 'Brand identity'], desc: ['Логотип, знак, константи — впізнаваність без пояснень.', 'Logo, mark, constants — recognition without explanation.'] },
      { name: ['Візуальна система', 'Visual system'], desc: ['Типографіка, колір, сітка, фото, шаблони під усі носії.', 'Type, color, grid, imagery, templates for every surface.'] },
      { name: ['Tone of voice', 'Tone of voice'], desc: ['Як бренд говорить у рекламі, на сайті й у підтримці.', 'How the brand speaks in ads, on site and in support.'] },
      { name: ['Бренд-бук', 'Brand book'], desc: ['Правила, за якими бренд не розсиплеться без нас.', 'Rules that keep the brand intact without us.'] },
    ],
    deliverables: [
      ['Платформа бренду: позиціонування й обіцянка', 'Brand platform: positioning and promise'],
      ['Айдентика й візуальна система', 'Identity and visual system'],
      ['Tone of voice з прикладами', 'Tone of voice with examples'],
      ['Бренд-бук і шаблони носіїв', 'Brand book and asset templates'],
    ],
    process: [
      { t: ['Дослідження', 'Research'], d: ['Категорія, конкуренти, мова клієнта.', 'Category, competitors, the customer’s language.'] },
      { t: ['Позиціонування', 'Positioning'], d: ['Чим ви відрізняєтесь і чим це доводите.', 'What sets you apart and what proves it.'] },
      { t: ['Айдентика', 'Identity'], d: ['Знак, система, носії.', 'Mark, system, assets.'] },
      { t: ['Впровадження', 'Rollout'], d: ['Сайт, реклама, упаковка, комунікація.', 'Site, ads, packaging, communication.'] },
      { t: ['Стандарт', 'Standard'], d: ['Бренд-бук і навчання команди.', 'Brand book and team enablement.'] },
    ],
    outcome: [
      'Бренд, за який готові платити більше, і команда, яка вміє його тримати без нас.',
      'A brand people pay more for, and a team able to hold it without us.',
    ],
  },
  {
    slug: 'ux-ui',
    job: [
      'Трафік є, а замовлень мало: люди доходять до кошика й зникають.',
      'Traffic is there but orders are not: people reach the cart and vanish.',
    ],
    tag: ['Досвід і конверсія', 'Experience & conversion'],
    title: ['UX/UI дизайн', 'UX/UI design'],
    tagline: ['Кожен зайвий крок коштує замовлення.', 'Every extra step costs an order.'],
    intro: [
      'Проєктуємо шлях клієнта від першого дотику до повторної покупки й перетворюємо його на конверсію: дослідження, сценарії, інтерфейс, тестування гіпотез на реальних грошах, а не на смаку.',
      'We design the customer journey from first touch to repeat purchase and turn it into conversion: research, flows, interface, hypotheses tested on real money rather than taste.',
    ],
    services: [
      { name: ['UX-дослідження', 'UX research'], desc: ['Де саме люди зупиняються й чому — за даними й сесіями.', 'Where exactly people stop and why — from data and sessions.'] },
      { name: ['Customer journey', 'Customer journey'], desc: ['Шлях від першого дотику до повторної покупки.', 'The path from first touch to repeat purchase.'] },
      { name: ['UI та дизайн-система', 'UI & design system'], desc: ['Інтерфейс і компоненти, які масштабуються без хаосу.', 'Interface and components that scale without chaos.'] },
      { name: ['CRO', 'CRO'], desc: ['Гіпотези, тести, зміни, які видно у виторгу.', 'Hypotheses, tests, changes visible in revenue.'] },
      { name: ['Каталог і картка', 'Catalog & product page'], desc: ['Пошук, фільтри, картка товару, кошик, checkout.', 'Search, filters, product page, cart, checkout.'] },
      { name: ['Мобільний досвід', 'Mobile experience'], desc: ['Більшість трафіку — з телефона; дизайн починається з нього.', 'Most traffic is mobile; design starts there.'] },
    ],
    deliverables: [
      ['Карта шляху клієнта з вузькими місцями', 'Customer journey map with bottlenecks'],
      ['Прототипи ключових екранів', 'Prototypes of the key screens'],
      ['UI-кіт і дизайн-система', 'UI kit and design system'],
      ['Беклог CRO-гіпотез з оцінкою впливу', 'CRO hypothesis backlog with impact estimates'],
    ],
    process: [
      { t: ['Аналіз', 'Analysis'], d: ['Дані, записи сесій, воронка по кроках.', 'Data, session recordings, step-by-step funnel.'] },
      { t: ['Сценарії', 'Flows'], d: ['Як має бути, щоб кроків стало менше.', 'How it should work with fewer steps.'] },
      { t: ['Дизайн', 'Design'], d: ['Прототип, UI, дизайн-система.', 'Prototype, UI, design system.'] },
      { t: ['Тести', 'Tests'], d: ['Перевіряємо на трафіку, а не на думках.', 'Validated on traffic, not opinions.'] },
      { t: ['Впровадження', 'Rollout'], d: ['Передача в розробку й контроль результату.', 'Handover to development and result control.'] },
    ],
    outcome: [
      'Вищий відсоток замовлень із того самого трафіку — і документована система, за якою це можна повторювати.',
      'A higher share of orders from the same traffic — and a documented system to repeat it.',
    ],
  },
  {
    slug: 'web-development',
    job: [
      'Кожна зміна на сайті — це тижні очікування й ризик щось зламати.',
      'Every change to the site means weeks of waiting and the risk of breaking something.',
    ],
    tag: ['E-commerce розробка', 'E-commerce development'],
    title: ['Веб-розробка', 'Web development'],
    tagline: ['Сайт має заробляти, а не вимагати уваги.', 'A site should earn, not demand attention.'],
    intro: [
      'Будуємо й розвиваємо магазин так, щоб він витримував зростання: платформа під вашу модель, інтеграції з обліком і логістикою, кастомна логіка там, де коробка не вміє, і швидкість, яку видно в конверсії.',
      'We build and evolve the store so it survives growth: a platform matched to your model, integrations with accounting and logistics, custom logic where off-the-shelf fails, and speed you can see in conversion.',
    ],
    services: [
      { name: ['E-commerce розробка', 'E-commerce development'], desc: ['Магазин під вашу модель продажів, а не навпаки.', 'A store built around your sales model, not the reverse.'] },
      { name: ['CMS і платформи', 'CMS & platforms'], desc: ['Shopify, Magento, WooCommerce, кастом — вибір за задачею.', 'Shopify, Magento, WooCommerce, custom — chosen by the task.'] },
      { name: ['Інтеграції', 'Integrations'], desc: ['ERP, CRM, склад, доставка, платежі, маркетплейси.', 'ERP, CRM, warehouse, delivery, payments, marketplaces.'] },
      { name: ['Custom development', 'Custom development'], desc: ['Логіка, якої немає в коробці: тарифи, конфігуратори, B2B.', 'Logic no box provides: pricing, configurators, B2B.'] },
      { name: ['Швидкість і стабільність', 'Speed & reliability'], desc: ['Core Web Vitals, навантаження в пік, моніторинг.', 'Core Web Vitals, peak load, monitoring.'] },
      { name: ['Підтримка й розвиток', 'Support & evolution'], desc: ['Релізи без страху: тести, стенди, відкат.', 'Releases without fear: tests, staging, rollback.'] },
    ],
    deliverables: [
      ['Технічна архітектура рішення', 'Technical architecture of the solution'],
      ['Робочий магазин з інтеграціями', 'A working store with integrations'],
      ['Регламент релізів і моніторинг', 'Release playbook and monitoring'],
      ['Документація для вашої команди', 'Documentation for your team'],
    ],
    process: [
      { t: ['Технічний аудит', 'Technical audit'], d: ['Що гальмує й що ламається.', 'What slows down and what breaks.'] },
      { t: ['Архітектура', 'Architecture'], d: ['Платформа, інтеграції, межі кастому.', 'Platform, integrations, limits of custom code.'] },
      { t: ['Розробка', 'Development'], d: ['Ітераціями, з демо й тестами.', 'In iterations, with demos and tests.'] },
      { t: ['Запуск', 'Launch'], d: ['Міграція, перевірка, план відкату.', 'Migration, verification, rollback plan.'] },
      { t: ['Розвиток', 'Evolution'], d: ['Релізи без ризику для продажів.', 'Releases without risk to sales.'] },
    ],
    outcome: [
      'Магазин, який витримує зростання, і команда, яка може змінювати його швидко й без страху.',
      'A store that survives growth, and a team able to change it fast and without fear.',
    ],
  },
  {
    slug: 'technology',
    job: [
      'Сайт гальмує зростання: повільний, падає в пік, кожна зміна коштує тижнів.',
      'The site is capping growth: slow, breaks at peak, every change costs weeks.',
    ],
    tag: ['Платформа, код, інфраструктура', 'Platform, code, infrastructure'],
    title: ['E-commerce Technology', 'E-commerce Technology'],
    tagline: ['Магазин як інженерний актив.', 'The store as an engineering asset.'],
    intro: [
      'Уся технологічна основа комерції: Shopify / Shopify Plus, Magento, WooCommerce, OpenCart або custom-розробка — плюс frontend, backend, UX/UI, mobile, інтеграції та API, DevOps і хостинг, QA, кібербезпека й технічна підтримка. Обираємо стек під задачу, а не під моду.',
      'The full technology backbone of commerce: Shopify / Shopify Plus, Magento, WooCommerce, OpenCart or custom development — plus frontend, backend, UX/UI, mobile, integrations and APIs, DevOps and hosting, QA, cybersecurity and technical support. We pick the stack for the task, not the trend.',
    ],
    services: [
      { name: ['Платформа', 'Platform'], desc: ['Shopify Plus / Magento / WooCommerce / OpenCart / custom — під ваш кейс.', 'Shopify Plus / Magento / WooCommerce / OpenCart / custom — for your case.'] },
      { name: ['Frontend і UX/UI', 'Frontend & UX/UI'], desc: ['Каталог, картка, checkout, mobile — під конверсію та швидкість.', 'Catalog, product, checkout, mobile — for conversion and speed.'] },
      { name: ['Backend і API', 'Backend & API'], desc: ['Бізнес-логіка, інтеграції, API між системами.', 'Business logic, integrations, APIs between systems.'] },
      { name: ['Інтеграції', 'Integrations'], desc: ['CRM / ERP / платежі / маркетплейси / доставка в один контур.', 'CRM / ERP / payments / marketplaces / delivery into one loop.'] },
      { name: ['DevOps і хостинг', 'DevOps & hosting'], desc: ['CI/CD, інфраструктура, продуктивність і стабільність.', 'CI/CD, infrastructure, performance and stability.'] },
      { name: ['QA, безпека, підтримка', 'QA, security, support'], desc: ['Тестування, кібербезпека й розвиток спринтами.', 'Testing, cybersecurity and sprint-based development.'] },
    ],
    deliverables: [
      ['Архітектура рішення і вибір стека', 'Solution architecture and stack choice'],
      ['Робочий магазин із інтеграціями', 'Live store with integrations'],
      ['DevOps-контур, моніторинг, безпека', 'DevOps pipeline, monitoring, security'],
      ['Документація, доступи, SLA підтримки', 'Documentation, access handover, support SLA'],
    ],
    process: [
      { t: ['Дискавері', 'Discovery'], d: ['Цілі, обмеження, вимоги до системи.', 'Goals, constraints, system requirements.'] },
      { t: ['Архітектура', 'Architecture'], d: ['Стек, інтеграції, модель даних.', 'Stack, integrations, data model.'] },
      { t: ['Розробка', 'Development'], d: ['Frontend, backend, API, mobile.', 'Frontend, backend, API, mobile.'] },
      { t: ['QA і запуск', 'QA & launch'], d: ['Тести, безпека, реліз, моніторинг.', 'Tests, security, release, monitoring.'] },
      { t: ['Підтримка', 'Support'], d: ['SLA, спринти покращень, розвиток.', 'SLA, improvement sprints, growth.'] },
    ],
    outcome: [
      'Технологічна база, якою можна керувати й масштабувати, — а не набір непов’язаних підрядників і «чорних скриньок».',
      'A technology base you can manage and scale — not a set of disconnected contractors and black boxes.',
    ],
  },
  {
    slug: 'marketing',
    job: [
      'Реклама зʼїдає бюджет, а прибутку не додає: ліди є, окупності немає.',
      'Ads eat the budget without adding profit: leads exist, payback does not.',
    ],
    tag: ['Трафік і попит під економіку', 'Traffic and demand for the economics'],
    title: ['Маркетинг', 'Marketing'],
    tagline: ['Не «більше реклами» — більше прибутку.', 'Not «more ads» — more profit.'],
    intro: [
      'Будуємо маркетинг, що працює на юніт-економіку: перформанс, SEO, контент, CRM-маркетинг і утримання. Кожен канал — із метрикою й відповідальним, а не «для галочки».',
      'We build marketing that works for unit economics: performance, SEO, content, CRM marketing and retention. Every channel has a metric and an owner, not «just because».',
    ],
    services: [
      { name: ['Performance', 'Performance'], desc: ['Google / Meta / маркетплейси під CAC і ROAS.', 'Google / Meta / marketplaces for CAC and ROAS.'] },
      { name: ['SEO і контент', 'SEO & content'], desc: ['Органіка як актив із передбачуваним трафіком.', 'Organic as an asset with predictable traffic.'] },
      { name: ['CRM-маркетинг', 'CRM marketing'], desc: ['Утримання, повторні продажі, LTV.', 'Retention, repeat sales, LTV.'] },
      { name: ['Аналітика й атрибуція', 'Analytics & attribution'], desc: ['Чесні цифри по каналах, а не «десь спрацювало».', 'Honest per-channel numbers, not «something worked».'] },
      { name: ['Позиціонування', 'Positioning'], desc: ['Меседжинг і офер, що відбудовують від конкурентів.', 'Messaging and offer that stand apart from competitors.'] },
      { name: ['Креатив і лендінги', 'Creative & landing pages'], desc: ['Креатив і сторінки під конверсію, а не лайки.', 'Creative and pages for conversion, not likes.'] },
    ],
    deliverables: [
      ['Медіаплан під CAC / ROAS', 'Media plan for CAC / ROAS'],
      ['Дерево метрик і атрибуція', 'Metrics tree and attribution'],
      ['Календар контенту', 'Content calendar'],
      ['Звітність із висновками', 'Reporting with conclusions'],
    ],
    process: [
      { t: ['Аудит каналів', 'Channel audit'], d: ['Що працює, що зливає бюджет.', 'What works, what burns budget.'] },
      { t: ['Стратегія', 'Strategy'], d: ['Канали й метрики під економіку.', 'Channels and metrics for the economics.'] },
      { t: ['Запуск', 'Launch'], d: ['Кампанії, контент, креатив.', 'Campaigns, content, creative.'] },
      { t: ['Оптимізація', 'Optimization'], d: ['Ріжемо неефективне, підсилюємо робоче.', 'Cut the ineffective, scale the working.'] },
      { t: ['Масштабування', 'Scaling'], d: ['Зростання без втрати економіки.', 'Growth without breaking the economics.'] },
    ],
    outcome: [
      'Передбачуваний потік клієнтів із контрольованою вартістю й зростанням LTV.',
      'A predictable flow of customers with controlled cost and growing LTV.',
    ],
  },
  {
    slug: 'sales-channels',
    job: [
      'Один канал дає майже весь виторг — і будь-який його збій зупиняє бізнес.',
      'One channel carries nearly all revenue — and any hiccup in it stops the business.',
    ],
    tag: ['Продажі поза власним сайтом', 'Sales beyond your own site'],
    title: ['Канали продажів', 'Sales channels'],
    tagline: ['Там, де ваш товар уже шукають.', 'Where your product is already searched for.'],
    intro: [
      'Розвиваємо продажі там, де вже є попит: Amazon, Allegro, eBay, Etsy, Rozetka, Prom, Kaufland, Zalando та інші маркетплейси, а також B2B, social commerce, retail-інтеграції й omnichannel. Залучаємо marketplace-інтеграторів, спеціалізовані агенції та feed-management провайдерів під конкретний канал.',
      'We grow sales where demand already lives: Amazon, Allegro, eBay, Etsy, Rozetka, Prom, Kaufland, Zalando and other marketplaces, plus B2B, social commerce, retail integrations and omnichannel. We bring in marketplace integrators, specialized agencies and feed-management providers for each channel.',
    ],
    services: [
      { name: ['Глобальні маркетплейси', 'Global marketplaces'], desc: ['Amazon, eBay, Kaufland, Zalando, Allegro — лістинг, контент, ранжування.', 'Amazon, eBay, Kaufland, Zalando, Allegro — listing, content, ranking.'] },
      { name: ['Локальні майданчики', 'Local platforms'], desc: ['Rozetka, Prom, Etsy — вихід і зростання на домашніх ринках.', 'Rozetka, Prom, Etsy — entry and growth on home markets.'] },
      { name: ['Feed-management', 'Feed management'], desc: ['Фіди, контент і ціни під вимоги кожного майданчика.', 'Feeds, content and pricing for each platform’s rules.'] },
      { name: ['B2B-канал', 'B2B channel'], desc: ['Оптові й дистрибуційні продажі як окремий напрям.', 'Wholesale and distribution sales as a separate track.'] },
      { name: ['Social commerce', 'Social commerce'], desc: ['Instagram / TikTok Shop та продажі в соцмережах.', 'Instagram / TikTok Shop and social-native sales.'] },
      { name: ['Omnichannel і retail', 'Omnichannel & retail'], desc: ['Retail-інтеграції й єдиний досвід між каналами.', 'Retail integrations and one experience across channels.'] },
    ],
    deliverables: [
      ['Карта каналів із пріоритетами', 'Prioritized channel map'],
      ['Налаштовані лістинги й фіди', 'Configured listings and feeds'],
      ['Юніт-економіка по кожному каналу', 'Per-channel unit economics'],
      ['План масштабування каналів', 'Channel scaling plan'],
    ],
    process: [
      { t: ['Аудит каналів', 'Channel audit'], d: ['Де вже є попит на ваш товар.', 'Where demand for your product already is.'] },
      { t: ['Пріоритизація', 'Prioritization'], d: ['Канали за економікою й зусиллям.', 'Channels by economics and effort.'] },
      { t: ['Запуск', 'Launch'], d: ['Лістинги, фіди, контент, ціни.', 'Listings, feeds, content, pricing.'] },
      { t: ['Оптимізація', 'Optimization'], d: ['Ранжування, конверсія, повернення.', 'Ranking, conversion, returns.'] },
      { t: ['Масштабування', 'Scaling'], d: ['Нові майданчики й ринки.', 'New platforms and markets.'] },
    ],
    outcome: [
      'Продажі не залежать від одного сайту: кілька керованих каналів зі своєю економікою й відповідальними.',
      'Sales no longer depend on one site: several managed channels, each with its own economics and owner.',
    ],
  },
  {
    slug: 'data-growth',
    job: [
      'Рішення ухвалюються на відчуттях, бо цифрам не можна вірити.',
      'Decisions are made on gut feel, because the numbers cannot be trusted.',
    ],
    tag: ['Дані, що керують зростанням', 'Data that drives growth'],
    title: ['Data & Growth', 'Data & Growth'],
    tagline: ['Рішення на цифрах, не на відчуттях.', 'Decisions on numbers, not gut feel.'],
    intro: [
      'Перетворюємо дані на зростання: GA4, GTM, BI й дашборди, атрибуція, CRO та A/B-тести, персоналізація й рекомендаційні рушії, AI, forecasting, pricing, мерчандайзинг і customer analytics. Не «звіти заради звітів», а рішення, що піднімають виручку й маржу.',
      'We turn data into growth: GA4, GTM, BI and dashboards, attribution, CRO and A/B testing, personalization and recommendation engines, AI, forecasting, pricing, merchandising and customer analytics. Not «reports for reports», but decisions that lift revenue and margin.',
    ],
    services: [
      { name: ['Аналітика й трекінг', 'Analytics & tracking'], desc: ['GA4, GTM, події, наскрізний трекінг без «дірок».', 'GA4, GTM, events, end-to-end tracking without gaps.'] },
      { name: ['BI й дашборди', 'BI & dashboards'], desc: ['Одні цифри для рішень: виручка, маржа, когорти.', 'One set of numbers for decisions: revenue, margin, cohorts.'] },
      { name: ['Атрибуція', 'Attribution'], desc: ['Чесний внесок каналів у продажі, а не «десь спрацювало».', 'Honest channel contribution to sales, not «something worked».'] },
      { name: ['CRO і A/B-тести', 'CRO & A/B testing'], desc: ['Системні тести гіпотез замість здогадок.', 'Systematic hypothesis testing instead of guessing.'] },
      { name: ['Персоналізація й AI', 'Personalization & AI'], desc: ['Рекомендації, forecasting, pricing на основі даних.', 'Recommendations, forecasting, data-driven pricing.'] },
      { name: ['Customer analytics', 'Customer analytics'], desc: ['Сегменти, LTV, мерчандайзинг під поведінку клієнта.', 'Segments, LTV, merchandising driven by customer behavior.'] },
    ],
    deliverables: [
      ['Налаштована наскрізна аналітика', 'Configured end-to-end analytics'],
      ['BI-дашборд ключових метрик', 'Key-metrics BI dashboard'],
      ['Бэклог CRO / A/B-гіпотез', 'CRO / A/B hypothesis backlog'],
      ['Модель прогнозу й ціноутворення', 'Forecasting and pricing model'],
    ],
    process: [
      { t: ['Аудит даних', 'Data audit'], d: ['Що вимірюється, де «сліпі зони».', 'What’s measured, where the blind spots are.'] },
      { t: ['Інфраструктура', 'Infrastructure'], d: ['Трекінг, BI, атрибуція.', 'Tracking, BI, attribution.'] },
      { t: ['Гіпотези', 'Hypotheses'], d: ['CRO / A/B-беклог за впливом.', 'CRO / A/B backlog by impact.'] },
      { t: ['Впровадження', 'Implementation'], d: ['Тести, персоналізація, pricing.', 'Tests, personalization, pricing.'] },
      { t: ['Масштабування', 'Scaling'], d: ['Що спрацювало — у систему.', 'What worked — into the system.'] },
    ],
    outcome: [
      'Рішення ухвалюються на цифрах: видно, що приносить гроші, і зростання стає керованим, а не випадковим.',
      'Decisions are made on numbers: it’s clear what makes money, and growth becomes managed, not accidental.',
    ],
  },
];

export const expertiseBySlug = (slug: string | undefined): Expertise | undefined =>
  EXPERTISES.find((e) => e.slug === slug);
