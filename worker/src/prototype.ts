/**
 * Эталонный прототип страницы ↔ композиция клиента. Инновация метода Commerce OS:
 * страница разбирается не как список дефектов, а как КОМПОЗИЦИЯ — состав и порядок
 * блоков, — и сверяется с эталонной композицией типа страницы из UX-энциклопедии
 * (главы: PDP 23, PLP 22, Cart 24, Checkout 25). Результат — «путь клиента против
 * эталонного пути»: какие блоки эталона есть, каких нет, что нарушает порядок
 * вопросов пользователя. Работает на T1/L0 (без доступов) — по блокам, снятым
 * обходом (`PageAudit.ux.blocks`).
 *
 * Это то, что в примерах называется pdp_comparison / lanavitta_vs_reference.
 */
import type { AuditDataset } from './report.js';
import type { PageAudit, PageKind } from './crawl.js';
import { ask, extractJson, hasKey } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

export type Weight = 'core' | 'important' | 'nice';
export type Block = { key: string; name: string; role: string; chapter: string; weight: Weight; detail?: string };
export type ReferencePage = { title: string; chapter: string; principle?: string; blocks: Block[] };

/** Эталонные композиции по типам страниц (блок-в-блок из глав UX-энциклопедии). */
export const REFERENCE: Partial<Record<PageKind, ReferencePage>> = {
  home: {
    title: 'Головна', chapter: 'розд. 11–12, 26, 30',
    principle: 'Вітрина за 5 секунд відповідає: куди я потрапив, що тут є, чи можна довіряти, з чого почати.',
    blocks: [
      { key: 'nav', name: 'Навігація / категорії', role: 'інформаційний запах, вхід у каталог', chapter: 'розд. 12', weight: 'core', detail: 'Категорії читаються за 5 секунд, ≤9 пунктів першого рівня (закон Гіка). Назви — мова покупця, не внутрішня номенклатура.' },
      { key: 'search', name: 'Пошук', role: 'швидкий шлях до товару', chapter: 'розд. 15', weight: 'important', detail: 'Видиме поле (не лише іконка), підказки, терпимість до одруківок. Для каталогу 50+ SKU пошук — другий за частотою шлях до товару.' },
      { key: 'hero', name: 'Перший екран / оффер', role: 'позиціонування і головний оффер', chapter: 'розд. 17', weight: 'important', detail: 'За 5 секунд відповідає: куди я потрапив, що тут є, чому саме тут. Один головний оффер, не карусель із пʼяти конкурентних банерів.' },
      { key: 'usp_bar', name: 'УТП / переваги', role: 'причина купувати тут', chapter: 'розд. 26', weight: 'important', detail: 'Конкретика замість «якість і сервіс»: власне виробництво, термін доставки, повернення, гарантія — коротко смугою під першим екраном.' },
      { key: 'product_grid', name: 'Добірки товарів', role: 'залучення в каталог', chapter: 'розд. 30', weight: 'important', detail: 'Бестселери/новинки/сезон — керовані добірки, а не випадкові товари. Картка в сітці: фото, ціна, рейтинг, швидкий перехід.' },
      { key: 'trust', name: 'Блок довіри', role: 'зняття тривоги на вході', chapter: 'розд. 26', weight: 'important', detail: 'Гарантія, повернення, способи оплати, реальні контакти — сигнали «тут безпечно купувати» до першого кліку в каталог.' },
      { key: 'reviews', name: 'Відгуки / соц. доказ', role: 'підтвердження репутації', chapter: 'розд. 26', weight: 'nice', detail: 'Живі відгуки з фото/іменами, рейтинг магазину, «нас рекомендують» — підтвердження репутації на вході.' },
      { key: 'newsletter', name: 'Підписка / утримання', role: 'захоплення контакту', chapter: 'розд. 45', weight: 'nice', detail: 'Захоплення контакту зі зрозумілою цінністю (знижка/гайд), єдині умови в усіх блоках підписки. Початок retention-контуру.' },
      { key: 'footer_contacts', name: 'Футер: контакти, оплата, доставка', role: 'реквізити довіри і навігація', chapter: 'розд. 26', weight: 'core', detail: 'Повні реквізити продавця (юрособа, адреса), робочий e-mail/телефон, правові сторінки, оплата/доставка. Футер — паспорт магазину.' },
    ],
  },
  plp: {
    title: 'Каталог / PLP', chapter: 'розд. 22',
    principle: 'Лістинг допомагає швидко звузити вибір і перейти в картку без втрати контексту.',
    blocks: [
      { key: 'breadcrumbs', name: 'Хлібні крихти', role: 'положення в каталозі', chapter: 'розд. 22.5', weight: 'important', detail: 'Повний шлях із розміткою BreadcrumbList — навігація вгору і перелінковка ваги.' },
      { key: 'category_title', name: 'Заголовок категорії (H1)', role: 'підтвердження місця', chapter: 'розд. 22.6', weight: 'core', detail: 'H1 із предметом категорії (не «Каталог»). Категорія — головна посадкова під тематичні запити.' },
      { key: 'category_description', name: 'Опис категорії (SEO)', role: 'контекст + видимість', chapter: 'розд. 22.19', weight: 'nice', detail: 'Короткий корисний текст вибору (не «портянка» заради SEO), розгорнутий — під сіткою.' },
      { key: 'product_count', name: 'Кількість товарів', role: 'масштаб вибору', chapter: 'розд. 22.7', weight: 'important', detail: 'Лічильник результатів поруч із фільтрами — зворотний звʼязок «скільки залишилося після фільтра».' },
      { key: 'filters', name: 'Фільтрація / фасети', role: 'звуження вибору', chapter: 'розд. 22, 14', weight: 'core', detail: 'Фасети за вирішальними атрибутами (розмір, матеріал, ціна, колір), миттєве застосування, лічильники значень, скидання. Фасетні URL під контролем індексації.' },
      { key: 'sort', name: 'Сортування', role: 'керування порядком видачі', chapter: 'розд. 22.8', weight: 'important', detail: 'Популярні/ціна/новинки/рейтинг. Дефолтне сортування — керований мерчандайзинг, а не «як лягло з бази».' },
      { key: 'view_toggle', name: 'Перемикання вигляду', role: 'щільність/детальність', chapter: 'розд. 22.9', weight: 'nice', detail: 'Сітка/список для різних сценаріїв порівняння.' },
      { key: 'product_grid', name: 'Сітка товарів (картки)', role: 'ядро лістингу', chapter: 'розд. 22.10', weight: 'core', detail: 'Картка сітки: фото, ціна, рейтинг, наявність, швидкі дії. Єдина висота/структура — скановність.' },
      { key: 'pagination', name: 'Пагінація / підвантаження', role: 'доступ до всього асортименту', chapter: 'розд. 22.15', weight: 'important', detail: '«Показати ще» + пагінація з індексованими URL. Нескінченний скрол без URL ховає хвіст від пошуку.' },
      { key: 'faq', name: 'FAQ за категорією', role: 'зняття заперечень + SEO', chapter: 'розд. 22', weight: 'nice', detail: 'Питання вибору цієї категорії з FAQPage-розміткою — знімає заперечення й потрапляє в прямі відповіді.' },
    ],
  },
  pdp: {
    title: 'Картка товару / PDP', chapter: 'розд. 23',
    principle: 'Картка відповідає на питання в порядку їх виникнення: що це → чи підійде → скільки → чи є → коли → чи можна довіряти → що кажуть інші → чи є альтернатива → чи купувати.',
    blocks: [
      { key: 'breadcrumbs', name: 'Хлібні крихти + H1', role: 'повернення на рівень вище', chapter: 'розд. 23.4', weight: 'important', detail: 'Крихти повні, до підкатегорії. H1 = назва + ключова характеристика (склад/розмір) — пошуковий сигнал і перша відповідь на питання вибору. Рейтинг біля заголовка — соц. доказ у першому екрані.' },
      { key: 'product_header', name: 'Заголовок товару (H1)', role: '«що це»', chapter: 'розд. 23.5', weight: 'core', detail: 'Не просто назва моделі: склад і розмір у заголовку. Артикул і рейтинг поруч.' },
      { key: 'gallery', name: 'Галерея', role: '«чи підійде»: ракурси, деталі', chapter: 'розд. 23.4', weight: 'core', detail: 'Пʼять типів медіа: предметне фото, в інтерʼєрі (масштаб), макро текстури (заміна тактильності), відео, фото покупців. Зум по наведенню; головне фото в пріоритеті завантаження.' },
      { key: 'price', name: 'Ціна / блок покупки', role: '«скільки коштує»', chapter: 'розд. 23.5', weight: 'core', detail: 'Ціна одразу, стара ціна чесна. Наявність і термін доставки — поруч із ціною, до кнопки.' },
      { key: 'add_to_cart', name: 'Кнопка «До кошика»', role: 'головна дія', chapter: 'розд. 23.4', weight: 'core', detail: 'Великий CTA у першому екрані. Мікро-довіра ПІД кнопкою (повернення 14 днів, гарантія, оплата при отриманні) — заперечення знімаються там, де ухвалюється рішення, а не внизу сторінки.' },
      { key: 'variants', name: 'Вибір варіанта', role: 'розмір/колір/комплектація', chapter: 'розд. 23.4', weight: 'important', detail: 'Одна картка = одна модель: колір/розмір перемикаються всередині, URL параметром, canonical на базову. Недоступні варіанти перекреслені, а не приховані. Розміри з призначенням («140×200 — крісло», «200×220 — двоспальна»).' },
      { key: 'trust', name: 'Блок довіри', role: '«чи можна довіряти»', chapter: 'розд. 23.4, 26', weight: 'important', detail: 'Повернення/обмін, гарантія виробника, безпечна оплата, власне виробництво — коротко в картці. Унікальна перевага виробника (зразок тканини, процес) — те, чого немає в реселера.' },
      { key: 'delivery', name: 'Доставка', role: '«коли отримаю»', chapter: 'розд. 23.4', weight: 'important', detail: 'Вартість і термін — у картці, до кошика (39% відмов оформлення — через пізні витрати). Поріг безкоштовної доставки сформульований однаково на всьому сайті.' },
      { key: 'payment', name: 'Оплата', role: 'способи оплати', chapter: 'розд. 23.4', weight: 'important', detail: 'Способи оплати видно в картці (карта, при отриманні, розстрочка). Логотипи платіжних систем як сигнал довіри.' },
      { key: 'description', name: 'Опис', role: 'деталі товару', chapter: 'розд. 23.4', weight: 'core', detail: 'Інформаційний приріст виробника: процес, сировина, цифри виробництва — у картці, не лише на «Про нас». Саме це цитують генеративні системи.' },
      { key: 'specifications', name: 'Характеристики', role: 'порівняння і вибір', chapter: 'розд. 23.4', weight: 'important', detail: 'Значення, а не лише число: «300 г/м² · середня щільність». Атрибути зі довідника, не руками. Кожна характеристика перекладена на мову рішення.' },
      { key: 'reviews', name: 'Відгуки', role: '«що кажуть інші»', chapter: 'розд. 23.4', weight: 'important', detail: 'Фото покупців у реальному інтерʼєрі (справжній колір і масштаб), «підтверджена покупка», відповіді бренду на негатив. Відгуки спільні для всіх варіантів моделі, не роздроблені за кольорами.' },
      { key: 'qa', name: 'Питання і відповіді', role: 'зняття заперечень', chapter: 'розд. 23.4', weight: 'nice', detail: 'Q&A ≠ FAQ: питання пишуть покупці — там справжні заперечення. Розмітка QAPage; відповіді самодостатні.' },
      { key: 'video', name: 'Відео', role: 'демонстрація', chapter: 'розд. 23.4', weight: 'nice', detail: 'Відео товару/процесу в галереї — для текстилю відео замінює тактильність.' },
      { key: 'related', name: 'Cross-sell / схожі', role: '«чи є альтернатива», зростання AOV', chapter: 'розд. 23.4', weight: 'important', detail: 'ТРИ різні блоки, не одна карусель: «інші кольори моделі» (утримання у виборі), «з цим беруть» (зростання чека: подушка, набір, пакування), «схожі» (порятунок, якщо модель не підійшла).' },
      { key: 'recently_viewed', name: 'Нещодавно переглянуті', role: 'повернення до вибору', chapter: 'розд. 23.4', weight: 'nice', detail: 'Повернення до порівняння без пошуку заново. Плюс липка панель покупки на мобільному: дочитав відгуки — не скролить назад до кнопки.' },
    ],
  },
  cart: {
    title: 'Кошик', chapter: 'розд. 24',
    principle: 'Кошик утримує рішення і без тертя веде в оформлення, попутно підвищуючи чек.',
    blocks: [
      { key: 'qty_control', name: 'Список товарів + зміна кількості', role: 'контроль замовлення', chapter: 'розд. 24.3', weight: 'core', detail: 'Фото, варіант, ціна, зміна кількості й видалення — без перезавантаження. Перерахунок підсумку миттєвий.' },
      { key: 'wishlist', name: 'Зберегти на потім / Wishlist', role: 'зниження відмови', chapter: 'розд. 24.3', weight: 'nice', detail: '«Відкласти» замість видалення — зберігає намір і контакт із товаром.' },
      { key: 'promo_code', name: 'Промокод', role: 'застосування знижки', chapter: 'розд. 24.3', weight: 'important', detail: 'Згорнуте поле (відкрите — провокує вихід шукати код), миттєва валідація, зрозуміла помилка.' },
      { key: 'delivery_calc', name: 'Розрахунок доставки', role: 'прозорість вартості', chapter: 'розд. 24.3', weight: 'important', detail: 'Вартість і термін доставки видно в кошику, до оформлення. Прогрес до безкоштовної доставки — мотиватор добору.' },
      { key: 'order_summary', name: 'Вартість замовлення', role: 'підсумок без сюрпризів', chapter: 'розд. 24.3', weight: 'core', detail: 'Товари + доставка + знижка = підсумок, без витрат, що спливають пізніше (39% відмов оформлення — пізні витрати).' },
      { key: 'related', name: 'Cross-sell', role: 'зростання AOV', chapter: 'розд. 24.3', weight: 'nice', detail: '«З цим беруть» у кошику: доповнюючі товари в один клік, без виходу з кошика.' },
      { key: 'add_to_cart', name: 'Головний CTA → оформлення', role: 'перехід до оплати', chapter: 'розд. 24.3', weight: 'core', detail: 'Один домінуючий CTA «Оформити». Способи оплати поруч — зняття тривоги до кліку.' },
      { key: 'continue_shopping', name: 'Продовжити покупки', role: 'повернення в каталог', chapter: 'розд. 24.3', weight: 'nice', detail: 'Повернення в каталог без втрати кошика — вторинною кнопкою, не конкуруючи з оформленням.' },
    ],
  },
  checkout: {
    title: 'Оформлення', chapter: 'розд. 25',
    principle: 'Мінімум етапів: кошик → контакти → доставка → оплата → перевірка → підтвердження. Кожен зайвий крок знижує завершення.',
    blocks: [
      { key: 'order_summary', name: 'Перевірка замовлення / сума', role: 'упевненість у складі', chapter: 'розд. 25.15', weight: 'core', detail: 'Склад, доставка і підсумок видно на кожному кроці. Зміна замовлення — без втрати введених даних.' },
      { key: 'contact_form', name: 'Контактні дані', role: 'звʼязок за замовленням', chapter: 'розд. 25.7', weight: 'core', detail: 'Мінімум полів (імʼя, телефон, — e-mail опціонально), автозаповнення, маски, зрозумілі помилки біля поля. Кожне зайве поле знижує завершення.' },
      { key: 'delivery_selection', name: 'Вибір доставки', role: 'спосіб і термін', chapter: 'розд. 25.10', weight: 'core', detail: 'Способи з ціною і терміном (для UA: відділення/поштомат/курʼєр), вибір відділення без виходу зі сторінки.' },
      { key: 'payment_selection', name: 'Вибір оплати', role: 'спосіб оплати', chapter: 'розд. 25.11', weight: 'core', detail: 'Карта / при отриманні / розстрочка — з поясненням. Дефолт — найчастіший спосіб.' },
      { key: 'guest_checkout', name: 'Гостьове оформлення', role: 'без обовʼязкової реєстрації (−19% покинутих)', chapter: 'розд. 25.5', weight: 'important', detail: 'Покупка без реєстрації; акаунт пропонується ПІСЛЯ оплати однією кнопкою.' },
      { key: 'trust', name: 'Елементи довіри', role: 'безпека оплати', chapter: 'розд. 25.16', weight: 'important', detail: 'Значки безпечної оплати, повернення/гарантія поруч із кнопкою оплати, контакт живої людини за проблеми.' },
    ],
  },
  faq: {
    title: 'FAQ / часті питання', chapter: 'FAQ',
    principle: 'FAQ читають і люди, і пошукові/AI-системи з однією метою — отримати пряму відповідь. Кожна відповідь самодостатня, веде далі й знімає заперечення до покупки.',
    blocks: [
      { key: 'search', name: 'Заголовок + пошук по питаннях', role: 'вхід у сторінку: предметний H1 і пошук (після 20 питань категорії не рятують)', chapter: 'FAQ 01', weight: 'core' },
      { key: 'faq', name: 'Категорії і топ-питання', role: 'топ-5 закривають половину звернень; категорії з URL — посадкові', chapter: 'FAQ 02', weight: 'core' },
      { key: 'contact_form', name: 'Блок «не знайшли відповідь» + контакт', role: 'форма питання — джерело реальних формулювань покупців', chapter: 'FAQ 04', weight: 'important' },
      { key: 'related', name: 'Виходи в каталог із відповідей', role: 'відповів — і веде в товар, а не в глухий кут', chapter: 'FAQ 05', weight: 'important' },
      { key: 'breadcrumbs', name: 'Хлібні крихти', role: 'положення і повернення', chapter: 'FAQ 01', weight: 'nice' },
    ],
  },
  content: {
    title: 'Контент / блог', chapter: 'розд. 35–36',
    principle: 'Стаття веде від питання до товару: відповідає на запит і мʼяко переводить у каталог.',
    blocks: [
      { key: 'breadcrumbs', name: 'Хлібні крихти', role: 'навігація', chapter: 'розд. 11', weight: 'nice', detail: 'Шлях у хаб/рубрику — контекст і перелінковка.' },
      { key: 'product_header', name: 'Заголовок (H1)', role: 'тема матеріалу', chapter: 'розд. 36', weight: 'core', detail: 'H1 = питання/тема, як її шукають. Пряма відповідь (40–60 слів) — першим блоком, деталі нижче (AEO).' },
      { key: 'author', name: 'Автор / дата', role: 'експертність (E-E-A-T)', chapter: 'розд. 36', weight: 'nice', detail: 'Автор з експертизою, дата оновлення — сигнали довіри для пошуку та AI-видачі.' },
      { key: 'toc', name: 'Зміст', role: 'навігація по довгому тексту', chapter: 'розд. 36', weight: 'nice', detail: 'Якірний зміст для довгих матеріалів — навігація і sitelinks.' },
      { key: 'related', name: 'Посилання на товари / схожі статті', role: 'переведення в каталог', chapter: 'розд. 35', weight: 'important', detail: '2–3 виходи в каталог за темою статті: читач «як обрати плед» — у найкращій точці для переходу до пледів. Стаття без посилань — глухий кут.' },
      { key: 'share', name: 'Шеринг', role: 'дистрибуція', chapter: 'розд. 36', weight: 'nice', detail: 'Кнопки шерингу там, де читають, — дистрибуція без бюджету.' },
      { key: 'newsletter', name: 'Підписка', role: 'захоплення контакту', chapter: 'розд. 45', weight: 'nice', detail: 'Захоплення контакту в контексті теми (гайд/чек-лист) — теплий вхід у retention.' },
    ],
  },
};

export type BlockVerdict = 'present' | 'missing';
export type PageComposition = {
  kind: PageKind;
  title: string;
  chapter: string;
  principle?: string;
  url: string;
  screenshot?: string;
  blocks: { name: string; role: string; chapter: string; weight: Weight; verdict: BlockVerdict }[];
  coverage: number;                 // % присутствующих core+important блоков
  missingCore: string[];
};

export type PrototypeReport = {
  pages: PageComposition[];
  narrative?: PrototypeNarrative;
};

export type PrototypeNarrative = {
  summary: string;
  perPage: { title: string; pathVsReference: string }[];
};

function comparePage(p: PageAudit): PageComposition | null {
  const ref = REFERENCE[p.kind];
  if (!ref) return null;
  const present = p.ux?.blocks ?? {};
  const blocks = ref.blocks.map((b) => ({ name: b.name, role: b.role, chapter: b.chapter, weight: b.weight, verdict: (present[b.key] ? 'present' : 'missing') as BlockVerdict }));
  const weighed = blocks.filter((b) => b.weight !== 'nice');
  const have = weighed.filter((b) => b.verdict === 'present').length;
  const coverage = weighed.length ? Math.round((have / weighed.length) * 100) : 0;
  const missingCore = blocks.filter((b) => b.weight === 'core' && b.verdict === 'missing').map((b) => b.name);
  return { kind: p.kind, title: ref.title, chapter: ref.chapter, principle: ref.principle, url: p.finalUrl || p.url, screenshot: p.screenshot, blocks, coverage, missingCore };
}

/** Детерминированная сверка композиции разобранных страниц с эталонными прототипами. */
export function buildPrototypeReport(ds: AuditDataset): PrototypeReport {
  const seen = new Set<PageKind>();
  const pages: PageComposition[] = [];
  for (const p of ds.client.pages) {
    if (p.error || !p.checks.length) continue;
    if (seen.has(p.kind)) continue; // один представитель на тип
    const c = comparePage(p);
    if (c) { pages.push(c); seen.add(p.kind); }
  }
  return { pages };
}

export function prototypeFacts(r: PrototypeReport): string {
  const out: string[] = [];
  for (const pg of r.pages) {
    out.push(`\n[${pg.title}] ${pg.url} — покриття еталонної композиції ${pg.coverage}% (принцип: ${pg.principle ?? '—'})`);
    for (const b of pg.blocks) out.push(`  ${b.verdict === 'present' ? 'Є' : 'НЕМАЄ'} · ${b.name} (${b.weight}) — ${b.role} [${b.chapter}]`);
    if (pg.missingCore.length) out.push(`  Відсутні ядрові блоки: ${pg.missingCore.join(', ')}`);
  }
  return out.join('\n');
}

const SYSTEM = `Ти — провідний UX-архітектор. Розбираєш сторінки e-commerce як КОМПОЗИЦІЮ (склад і порядок блоків), а не як список дефектів. Тобі дано звірку композиції клієнта з еталонною композицією типу сторінки з UX-енциклопедії методу.

Завдання: описати ШЛЯХ КЛІЄНТА проти еталонного шляху. Правила:
- Лише за фактами звірки. Нічого не вигадуй.
- Це зовнішній обхід без доступів: «не виявлено» ≠ «відсутнє» — враховуй патерни приховування (за табом, згорнуто, інший брейкпоінт). Формулюй як спостереження/гіпотезу.
- Для картки товару спирайся на порядок питань користувача (що це → чи підійде → скільки → чи є → коли → довіра → що кажуть → альтернатива → чи купувати). Покажи, на якому питанні шлях клієнта рветься через відсутній/зміщений блок.
- Відповідь ОБОВʼЯЗКОВО українською мовою, тон професійний. Пиши про шлях і рішення користувача, а не «блок X відсутній» сухо — повʼяжи з втратою конверсії/довіри.

Поверни СТРОГО JSON:
{
  "summary": "3–4 речення: наскільки композиція вітрини близька до еталона, де системно рветься шлях клієнта",
  "perPage": [{"title": "Головна|Каталог / PLP|Картка товару / PDP|Кошик|Оформлення|Контент / блог", "pathVsReference": "шлях клієнта на цій сторінці проти еталонного: що веде до рішення, де обрив через відсутній блок, ефект"}]
}`;

export async function narratePrototype(ds: AuditDataset, r: PrototypeReport): Promise<PrototypeNarrative | null> {
  if (!hasKey() || !r.pages.length) return null;
  const user = `Клієнт: ${ds.client.finalUrl || ds.client.rootUrl}.\n\nЗВІРКА КОМПОЗИЦІЇ З ЕТАЛОНОМ:\n${prototypeFacts(r)}\n\nЗбери JSON. perPage — по одному обʼєкту на кожен тип сторінки зі звірки. Уся текстова частина — українською.`;
  try {
    const text = await ask(SYSTEM + (await knowledgeFor('prototype', 'website')), user, 8000);
    const n = extractJson<PrototypeNarrative>(text);
    if (!n.summary || !Array.isArray(n.perPage)) return null;
    return n;
  } catch { return null; }
}

const MARK: Record<BlockVerdict, string> = { present: '✓ є', missing: '✕ немає' };

export function renderPrototypeMd(ds: AuditDataset, r: PrototypeReport): string {
  const out: string[] = [];
  out.push(`# Еталонний прототип ↔ композиція клієнта — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Розбір композиції сторінок проти еталона (розділи UX-енциклопедії)_`);
  out.push('');
  out.push('Сторінка розбирається як **композиція** — склад і порядок блоків, — і звіряється з еталонною композицією свого типу. Результат — шлях клієнта проти еталонного шляху. Оцінки — спостереження зовнішнього обходу; «не виявлено» ≠ «відсутнє» (перевірте патерни приховування).');
  out.push('');
  if (!r.pages.length) { out.push('> Сторінки не розібрано (сайт недоступний/бот-захист).'); return out.join('\n'); }

  if (r.narrative?.summary) { out.push('## Резюме'); out.push(r.narrative.summary); out.push(''); }

  for (const pg of r.pages) {
    out.push(`## ${pg.title} — ${pg.url}`);
    out.push(`Покриття еталонної композиції: **${pg.coverage}%**. Еталон: ${pg.chapter}.`);
    if (pg.principle) out.push(`> Принцип еталона: ${pg.principle}`);
    const narr = r.narrative?.perPage.find((x) => x.title === pg.title);
    if (narr) { out.push(''); out.push(narr.pathVsReference); }
    out.push('');
    out.push('| Еталонний блок | Важливість | У клієнта | Роль у шляху клієнта | Розділ |');
    out.push('| --- | --- | --- | --- | --- |');
    for (const b of pg.blocks) out.push(`| ${b.name} | ${b.weight} | ${MARK[b.verdict]} | ${b.role} | ${b.chapter} |`);
    if (pg.missingCore.length) { out.push(''); out.push(`**Відсутні ядрові блоки:** ${pg.missingCore.join(', ')} — шлях клієнта рветься тут.`); }
    out.push('');
  }
  out.push('---');
  out.push('_Метод: сторінка = композиція, а не набір дефектів. Еталонні прототипи — з UX-енциклопедії (PDP розд. 23, PLP розд. 22, Cart розд. 24, Checkout розд. 25). З доступами уточнюється, чи блок прихований, чи відсутній._');
  return out.join('\n');
}
