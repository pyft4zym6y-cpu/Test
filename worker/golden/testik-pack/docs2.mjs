// a06–a10 — зведені звіти + матриця зрілості + розрив у грошах.
import { doc, page, bench, kpi, setDocNo } from './gen.mjs';

/* ════ a06 · Досвід і конверсія ════ */
setDocNo('a06 · Досвід і конверсія');
doc('06-dosvid-konversiia.html', 'a06 · Досвід і конверсія — Тестик', [
  page('', 'Зведений звіт · Website + Customer + CRM', `
    <span class="ebrow">Документ a06 · Website-аудит · Customer-аудит · CRM-аудит</span>
    <h1 class="big">Сайт збирає попит.<br>Оформлення і повернення клієнта — <span class="mark">зливають</span>.</h1>
    <div class="kpis" style="margin-top:7mm">
      ${kpi('1.22%', 'CR сайту · GA4+бекенд', 'bad')}
      ${kpi('43.6%', 'checkout completion · GA4', 'bad')}
      ${kpi('0.9%', 'CR mobile (74% трафіку)', 'bad')}
      ${kpi('13%', 'repeat rate 365d · замовлення', 'bad')}
    </div>
    ${bench('Конверсія сайту', '1.22%', 30, 52, 'бенч ніші 1.8–2.4%')}
    ${bench('Checkout completion', '43.6%', 44, 65, 'бенч 65%+ · Baymard')}
    ${bench('Cart → Purchase', '17.5%', 35, 62, 'бенч 28–35%')}
    <h2 class="st" style="margin-top:6mm">Чекаут: 5 180 людей на місяць починають платити. 2 920 — не закінчують</h2>
    <table class="t">
      <tr><th>Знахідка</th><th>Доказ</th><th class="num">Ефект/рік</th><th>Пріоритет</th></tr>
      <tr class="hl"><td><b>Вартість доставки видно лише на кроці оплати</b></td><td>скринкаст + топ-причина відмов за Baymard</td><td class="num"><b>частина €190k</b></td><td><span class="sev h">W1</span></td></tr>
      <tr><td>9 обовʼязкових полів (норма — до 8 туди входять імʼя/телефон/адреса)</td><td>розбір форми, порівняння з еталоном</td><td class="num">частина €190k</td><td><span class="sev h">W1</span></td></tr>
      <tr><td>Оплата: немає BLIK для PL-замовлень з сайту</td><td>аналіз відмов по країнах: PL checkout −31% до UA</td><td class="num">€18k</td><td><span class="sev m">W2</span></td></tr>
      <tr><td>Кинутий кошик: тригерних листів немає</td><td>eSputnik: flows-аудит</td><td class="num">частина €150k</td><td><span class="sev h">W2</span></td></tr>
    </table>
  `, 1, 4),
  page('', 'Зведений звіт · Website + Customer + CRM', `
    <h2 class="st">Mobile: реклама платить за візити, які не встигають відкритись</h2>
    <div class="kpis c3">
      ${kpi('4.6s', 'LCP mobile · CrUX (поріг 2.5)', 'bad')}
      ${kpi('310ms', 'INP · поріг 200ms', 'bad')}
      ${kpi('0.18', 'CLS · поріг 0.1', 'bad')}
    </div>
    <table class="t">
      <tr><th>Причина</th><th>Деталь</th><th>Рішення (в межах OpenCart)</th></tr>
      <tr><td><b>Зображення без стиснення</b></td><td>hero-фото PDP 1.8–2.6 MB, без WebP/AVIF, без lazy</td><td>конвертація + CDN-ресайз — найбільший внесок у LCP</td></tr>
      <tr><td>18 синхронних скриптів</td><td>3 чат-віджети (один живий), старі пікселі</td><td>ревізія GTM, async, видалення мертвих</td></tr>
      <tr><td>Немає критичного CSS</td><td>рендер чекає повний бандл теми</td><td>інлайн критичного CSS для PDP/каталогу</td></tr>
      <tr><td>Хостинг TTFB 1.1s у пік</td><td>панель хостингу, вечірні години</td><td>кеш сторінок + перегляд тарифу</td></tr>
    </table>
    <h2 class="st" style="margin-top:6mm">Картка товару: сильні фото, слабкі докази</h2>
    <table class="t">
      <tr><th>Еталон PDP (Baymard)</th><th>«Тестик»</th><th>Розрив</th></tr>
      <tr><td>6+ фото, відео у контексті</td><td>7 фото, без відео</td><td><span class="sev l">ok</span></td></tr>
      <tr><td>Відгуки з розподілом оцінок</td><td>відгуки є лише на 12% SKU, без розподілу</td><td><span class="sev m">W2</span></td></tr>
      <tr><td>Строк доставки над fold</td><td>«1–3 дні» дрібним під описом</td><td><span class="sev h">W1</span></td></tr>
      <tr><td>Повернення поруч із CTA</td><td>лише в футері</td><td><span class="sev m">W2</span></td></tr>
    </table>
  `, 2, 4),
  page('', 'Зведений звіт · Website + Customer + CRM', `
    <h2 class="st">Клієнт: хто купує і чому не повертається</h2>
    <p class="body"><b>Сегменти по замовленнях 24 міс (RFM-наближення без вивантаження бази — див. обмеження a02):</b></p>
    <table class="t">
      <tr><th>Сегмент</th><th class="num">Частка клієнтів</th><th class="num">Частка виручки</th><th>Що з ним робити</th></tr>
      <tr><td><b>Одноразові</b> (1 покупка, &gt;90 дн)</td><td class="num">71%</td><td class="num">54%</td><td>реактиваційний flow + поповнюваний асортимент (аксесуари, змінні частини)</td></tr>
      <tr class="hl"><td><b>Ядро</b> (2+ покупки)</td><td class="num">13%</td><td class="num">31%</td><td>захищати: пріоритетна підтримка, ранній доступ, програма рекомендацій</td></tr>
      <tr><td>Свіжі (&lt;90 дн, 1 покупка)</td><td class="num">16%</td><td class="num">15%</td><td>післяпродажний ланцюжок: догляд за посудом → друга покупка ≤60 дн</td></tr>
    </table>
    <p class="body" style="margin-top:4mm"><b>Медіана до 2-ї покупки — 96 днів.</b> Вікно контакту (30–60 день), коли клієнт готовий
    повернутись, зараз порожнє: жодного касання після листа-підтвердження.</p>
    <div class="callout">Голос клієнта (відгуки, 6 міс, 214 шт.): 62% негативу — «довго їхало» та «прийшло розбите»,
    і лише 9% — про сам продукт. Це операційна криза досвіду, не продуктова. → передано в a12 (беклог) як W1-задача «стандарт пакування».</div>
    <h2 class="st" style="margin-top:5mm">CRM-контур: що будуємо (хвиля 2)</h2>
    <table class="t">
      <tr><th>Flow</th><th>Тригер</th><th>Очікуваний внесок · джерело бенчу</th></tr>
      <tr><td>Кинутий кошик (3 листи + SMS)</td><td>кошик &gt; 45 хв</td><td class="num">7–9% повернених кошиків · галузеві дані ESP</td></tr>
      <tr><td>Післяпродажний (догляд + крос-сел)</td><td>доставка + 7 дн</td><td class="num">частина repeat 13→20%</td></tr>
      <tr><td>Реактивація 90/180</td><td>без покупки 90 дн</td><td class="num">3–5% сегмента</td></tr>
      <tr><td>Поповнення (змінні аксесуари)</td><td>цикл споживання SKU</td><td class="num">унікальний для ніші важіль</td></tr>
    </table>
  `, 3, 4),
  page('', 'Зведений звіт · Website + Customer + CRM', `
    <h2 class="st">Зведення знахідок блоку — 14, з них 5 у хвилю 1</h2>
    <table class="t">
      <tr><th>#</th><th>Знахідка</th><th>Severity</th><th>Хвиля</th><th class="num">Ефект/рік</th></tr>
      <tr class="hl"><td class="num">06-01</td><td>Доставка невидима до оплати</td><td><span class="sev h">high</span></td><td>W1</td><td class="num" rowspan="3"><b>€190k</b><br><span class="src">разом, checkout</span></td></tr>
      <tr class="hl"><td class="num">06-02</td><td>4 зайві поля форми</td><td><span class="sev h">high</span></td><td>W1</td></tr>
      <tr><td class="num">06-03</td><td>Строк доставки під fold на PDP</td><td><span class="sev m">med</span></td><td>W1</td></tr>
      <tr><td class="num">06-04</td><td>LCP 4.6s: зображення+скрипти+CSS</td><td><span class="sev h">high</span></td><td>W2</td><td class="num">€120k</td></tr>
      <tr><td class="num">06-05</td><td>CRM-flows відсутні (4 сценарії)</td><td><span class="sev h">high</span></td><td>W2</td><td class="num">€150k</td></tr>
      <tr><td class="num">06-06</td><td>DMARC немає</td><td><span class="sev h">high</span></td><td>W1</td><td class="num">умова №5</td></tr>
      <tr><td class="num">06-07</td><td>BLIK для PL з сайту</td><td><span class="sev m">med</span></td><td>W2</td><td class="num">€18k</td></tr>
      <tr><td class="num">06-08…14</td><td>відгуки на PDP, повернення біля CTA, пошук-нулі, A/B-процес, heatmaps, консент-банер UX, сторінка доставки</td><td><span class="sev m">med/low</span></td><td>W2–W3</td><td class="num">разом ≈ €25k</td></tr>
    </table>
    <p class="marg" style="margin-top:5mm">Повний реєстр з доказами — a11. Задачі з виконавцями — a12. Шлях клієнта з моментами істини — a13.
    Ефекти вже включені у €433k (a10) — цей документ їх деталізує, не додає зверху.</p>
  `, 4, 4),
].join(''));

/* ════ a07 · Трафік і видимість ════ */
setDocNo('a07 · Трафік і видимість');
doc('07-trafik-vydymist.html', 'a07 · Трафік і видимість — Тестик', [
  page('', 'Зведений звіт · SEO/GEO + Acquisition + Analytics', `
    <span class="ebrow">Документ a07 · SEO/GEO-аудит · Acquisition-аудит · Analytics-аудит</span>
    <h1 class="big">Платний трафік окупається.<br>Органіка — <span class="mark">недобудована</span>, дані — криві.</h1>
    <div class="kpis" style="margin-top:7mm">
      ${kpi('€14.5k', 'бюджет/міс · кабінети')}
      ${kpi('8.5', 'MER · виручка/бюджет', 'ok')}
      ${kpi('€18', 'CAC новий (paid) · розрах.')}
      ${kpi('31%', 'брендові кліки у платному', 'bad')}
    </div>
    <h2 class="st">Канали: звідки гроші насправді (бекенд, не GA4)</h2>
    <table class="t">
      <tr><th>Канал</th><th class="num">Виручка/міс</th><th class="num">Частка</th><th>Стан</th></tr>
      <tr><td>Google Ads (Search + PMax)</td><td class="num">€34k</td><td class="num">28%</td><td>ROAS ок, але PMax канібалізує бренд: 31% кліків — брендові запити</td></tr>
      <tr><td>Органіка + direct</td><td class="num">€31k</td><td class="num">25%</td><td>росте повільніше ринку; фасетні дублі гальмують</td></tr>
      <tr><td>Allegro</td><td class="num">€28k</td><td class="num">23%</td><td>велика виручка, contribution 3% (див. a08)</td></tr>
      <tr><td>Meta Ads</td><td class="num">€17k</td><td class="num">14%</td><td>2 креативи, 3 міс, частота 4.1 — втома креативів</td></tr>
      <tr><td>Email/CRM</td><td class="num">€6k</td><td class="num">4.8%</td><td><b>головний недовикористаний канал</b> (див. a06)</td></tr>
      <tr><td>Інші</td><td class="num">€7k</td><td class="num">5%</td><td>реферали, соцмережі органічні</td></tr>
    </table>
    <div class="callout" style="margin-top:4mm"><b>Брендовий податок:</b> ≈ €2.5k/міс бюджету йде на кліки за запитом «тестик» —
    людей, які й так шукали магазин. Захист бренду в PMax через виключення — W1, ефект €20–25k/рік (входить у SEO-важіль обережно).</div>
  `, 1, 4),
  page('', 'Зведений звіт · SEO/GEO + Acquisition + Analytics', `
    <h2 class="st">SEO: індекс роздутий сміттям, гроші — у 340 сторінках</h2>
    <div class="kpis c3">
      ${kpi('9 400', 'сторінок в індексі · GSC', 'bad')}
      ${kpi('≈1 100', 'реальних сторінок · кроул')}
      ${kpi('340', 'сторінок = 85% орг. виручки')}
    </div>
    <table class="t">
      <tr><th>Знахідка</th><th>Доказ</th><th>Хвиля</th></tr>
      <tr class="hl"><td><b>Фасетні дублі: ?color=&sort=&page= в індексі</b></td><td>GSC: 8.3k «проіндексовано», кроул: без canonical-правил</td><td><span class="sev h">W3</span> (обережно, після сезону)</td></tr>
      <tr><td>210 OOS-SKU віддають 200 і «немає в наявності»</td><td>кроул + правило: 410/редірект на категорію</td><td><span class="sev m">W2</span></td></tr>
      <tr><td>Описи товарів = текст постачальника (61% SKU)</td><td>порівняння з 4 конкурентами: дублікати</td><td><span class="sev m">W3</span></td></tr>
      <tr><td>Schema: Product без Review/AggregateRating</td><td>валідатор; зірки в SERP відсутні</td><td><span class="sev m">W2</span></td></tr>
      <tr><td>hreflang UA/PL відсутній (PL-версіяız сайту в планах)</td><td>кроул</td><td><span class="sev l">W3</span></td></tr>
    </table>
    <h2 class="st" style="margin-top:5mm">GEO/AEO: бренд невидимий для AI-пошуку</h2>
    <p class="body">Перевірка в ChatGPT/Perplexity/AI Overviews за 12 комерційними запитами ніші: «Тестик» не згадується жодного разу —
    конкуренти №2 і №4 зʼявляються у 7/12. Причини: немає llms.txt, немає фактологічних блоків і FAQ-розмітки,
    брак зовнішніх згадок. Це W3-програма контенту, ефект зростає з часом.</p>
  `, 2, 4),
  page('', 'Зведений звіт · SEO/GEO + Acquisition + Analytics', `
    <h2 class="st">Аналітика: чому «злітні прилади» показують не ту висоту</h2>
    <div class="hero m"><div class="n">22%</div><div class="cap">замовлень не доходить до GA4 — звірка purchase-подій з бекендом за 6 міс</div></div>
    <table class="t">
      <tr><th>Причина</th><th class="num">Внесок</th><th>Фікс</th></tr>
      <tr class="hl"><td><b>Apple Pay / швидкі оплати: redirect повз сторінку «дякуємо»</b></td><td class="num">≈ 13%</td><td>server-side подія purchase з бекенда (Measurement Protocol) — W1</td></tr>
      <tr><td>Consent Mode: відмови в ЄС ріжуть теги</td><td class="num">≈ 7%</td><td>Consent Mode v2 + моделювання — W1</td></tr>
      <tr><td>Дубль-транзакції при перезавантаженні</td><td class="num">≈ −2%</td><td>transaction_id дедуплікація — W1</td></tr>
    </table>
    <p class="body" style="margin-top:4mm"><b>Маржа в аналітиці відсутня:</b> рішення по кампаніях ухвалюються за виручкою.
    Після фіксу — передача margin у purchase-події, і кампанії порівнюються за contribution (W2).
    <b>Дашборд:</b> зараз Excel раз на місяць; будуємо щотижневий авто-звіт: виручка/маржа/CAC/repeat по каналах (W2).</p>
    <div class="callout v"><b>Правило до кінця фіксу приладів (W1):</b> усі грошові рішення — тільки від бекенд-замовлень.
    Канальні частки GA4 вважати орієнтиром ±20%, не фактом.</div>
  `, 3, 4),
  page('', 'Зведений звіт · SEO/GEO + Acquisition + Analytics', `
    <h2 class="st">Зведення знахідок блоку — 12, з них 4 у хвилю 1</h2>
    <table class="t">
      <tr><th>#</th><th>Знахідка</th><th>Severity</th><th>Хвиля</th><th class="num">Ефект/рік</th></tr>
      <tr class="hl"><td class="num">07-01</td><td>GA4: purchase −22% (3 причини)</td><td><span class="sev h">high</span></td><td>W1</td><td class="num">умова всіх рішень</td></tr>
      <tr class="hl"><td class="num">07-02</td><td>Бренд-канібалізація PMax</td><td><span class="sev h">high</span></td><td>W1</td><td class="num">€22k</td></tr>
      <tr><td class="num">07-03</td><td>Фасетні дублі індексу</td><td><span class="sev h">high</span></td><td>W3</td><td class="num" rowspan="3">€85k<br><span class="src">SEO разом</span></td></tr>
      <tr><td class="num">07-04</td><td>OOS-сторінки без правил</td><td><span class="sev m">med</span></td><td>W2</td></tr>
      <tr><td class="num">07-05</td><td>Дубльовані описи 61% SKU</td><td><span class="sev m">med</span></td><td>W3</td></tr>
      <tr><td class="num">07-06</td><td>Меta: втома креативів (частота 4.1)</td><td><span class="sev m">med</span></td><td>W2</td><td class="num">€15k</td></tr>
      <tr><td class="num">07-07</td><td>Маржа не в аналітиці</td><td><span class="sev h">high</span></td><td>W2</td><td class="num">якість рішень</td></tr>
      <tr><td class="num">07-08…12</td><td>schema-зірки, AI-видимість, hreflang, звіт щотижня, атрибуція</td><td><span class="sev m">med/low</span></td><td>W2–W3</td><td class="num">розподілено</td></tr>
    </table>
    <p class="marg" style="margin-top:5mm">Методологічні пороги: Google CWV (LCP ≤2.5s · INP ≤200ms · CLS ≤0.1), Consent Mode v2 (обовʼязковий для ЄС з 03.2024),
    E-E-A-T-рамка для контенту. Ефекти включені у €433k (a10).</p>
  `, 4, 4),
].join(''));

/* ════ a08 · Бізнес і ринок ════ */
setDocNo('a08 · Бізнес і ринок');
doc('08-biznes-rynok.html', 'a08 · Бізнес і ринок — Тестик', [
  page('', 'Зведений звіт · Business + Market + Product + Operations', `
    <span class="ebrow">Документ a08 · Business-аудит · Market-аудит · Product-аудит · Operations-аудит</span>
    <h1 class="big">Модель прибуткова.<br>Прибуток зʼїдають <span class="mark">хвіст і борг каналу</span>.</h1>
    <h2 class="st" style="margin-top:7mm">Юніт-економіка сайту (P&L + замовлення 24 міс)</h2>
    <table class="t">
      <tr><th>Рядок</th><th class="num">на замовлення</th><th class="num">% від AOV €42</th></tr>
      <tr><td>Валова маржа (52%)</td><td class="num">€21.8</td><td class="num">52%</td></tr>
      <tr><td>− Доставка</td><td class="num">€4.2</td><td class="num">10%</td></tr>
      <tr><td>− Еквайринг</td><td class="num">€0.9</td><td class="num">2.1%</td></tr>
      <tr><td>− Упаковка</td><td class="num">€0.6</td><td class="num">1.4%</td></tr>
      <tr><td>− Повернення (аморт.)</td><td class="num">€1.1</td><td class="num">2.6%</td></tr>
      <tr class="hl"><td><b>Contribution до реклами</b></td><td class="num"><b>€15.0</b></td><td class="num"><b>36%</b></td></tr>
      <tr><td>− Реклама (на замовлення, блендед)</td><td class="num">€6.4</td><td class="num">15%</td></tr>
      <tr class="hl"><td><b>Contribution після реклами</b></td><td class="num"><b>€8.6</b></td><td class="num"><b>≈12% виручки</b></td></tr>
    </table>
    <div class="kpis" style="margin-top:5mm">
      ${kpi('€61', 'LTV 12 міс (contribution) · когорти')}
      ${kpi('3.4', 'LTV:CAC UA · поріг 3.0', 'ok')}
      ${kpi('1.9', 'LTV:CAC PL · поріг 2.5', 'bad')}
      ${kpi('38%', 'виручки року — Q4 · сезонність')}
    </div>
  `, 1, 4),
  page('', 'Зведений звіт · Business + Market + Product + Operations', `
    <h2 class="st">Асортимент: 20 SKU годують компанію, 210 — заморожують кеш</h2>
    <div class="kpis c3">
      ${kpi('58%', 'виручки — топ-20 SKU · ERP')}
      ${kpi('33%', 'SKU без продажів 6 міс', 'bad')}
      ${kpi('€70k', 'кешу в dead stock · залишки', 'bad')}
    </div>
    <table class="t">
      <tr><th>ABC/XYZ</th><th class="num">SKU</th><th class="num">Виручка</th><th>Політика</th></tr>
      <tr class="hl"><td><b>A + стабільний попит</b></td><td class="num">64</td><td class="num">71%</td><td>щотижневий контроль OOS (зараз 17% часу — головний операційний витік)</td></tr>
      <tr><td>B</td><td class="num">180</td><td class="num">22%</td><td>звичайний цикл закупівель</td></tr>
      <tr><td>C + без продажів 6 міс</td><td class="num">210</td><td class="num">2%</td><td><b>розпродаж до собівартості → €70k кешу на закупівлю А-групи перед Q4</b></td></tr>
      <tr><td>решта C</td><td class="num">186</td><td class="num">5%</td><td>перегляд перед наступним замовленням постачальнику</td></tr>
    </table>
    <div class="callout">Минулорічна знижка −25% на «мертвий» асортимент дала виручку без прибутку: без собівартості по SKU
    частина пішла нижче нуля. Правило з W1: жодної знижки без розрахунку contribution. Позначено «очікує погодження» до отримання собівартості по SKU (a02).</div>
    <h2 class="st" style="margin-top:5mm">Операції: посуд бʼється, клієнт іде</h2>
    <p class="body"><b>2.1% відправлень приходять з боєм</b> (звіти перевізників + повернення). Кожен випадок = продукт + доставка туди-назад +
    підтримка + втрачений клієнт (кореляція: після бою repeat падає вдвічі). Вартість проблеми ≈ €31k/рік. Рішення W1 — стандарт пакування
    (подвійний гофрокартон + фіксація), тест на 200 відправленнях, потім у норму. OTIF зараз не вимірюється — додаємо у щотижневий дашборд.</p>
  `, 2, 4),
  page('', 'Зведений звіт · Business + Market + Product + Operations', `
    <h2 class="st">Allegro: чверть виручки — і найтонша маржа</h2>
    <table class="t">
      <tr><th>Рядок (на середнє замовлення €35)</th><th class="num">€</th><th class="num">%</th></tr>
      <tr><td>Валова маржа</td><td class="num">€18.2</td><td class="num">52%</td></tr>
      <tr><td>− Комісія Allegro</td><td class="num">€4.2</td><td class="num">12%</td></tr>
      <tr><td>− Логістика (Smart! + пакування)</td><td class="num">€6.1</td><td class="num">17%</td></tr>
      <tr><td>− Allegro Ads</td><td class="num">€2.5</td><td class="num">7%</td></tr>
      <tr><td>− Повернення PL (вищі за UA)</td><td class="num">€1.6</td><td class="num">4.6%</td></tr>
      <tr class="hl"><td><b>Contribution</b></td><td class="num"><b>€1.1</b></td><td class="num"><b>≈3%</b></td></tr>
    </table>
    <p class="body" style="margin-top:4mm"><b>Канал не закривати — лікувати:</b> 1) передоцінка 40 SKU, де ціна нижча за беззбитковість
    з урахуванням УСІХ витрат каналу; 2) перегляд логістичної схеми (консолідація відправлень); 3) Ads тільки на SKU з contribution &gt; €3.
    Ціль хвилі 2: contribution каналу ≥ 8% → +€60k/рік. Рейтинг 4.6 і Smart! — актив, який дозволяє підняти ціни без втрати Buy Box-аналога.</p>
    <h2 class="st" style="margin-top:5mm">Ринок і бренд: середина без причини обирати</h2>
    <table class="t">
      <tr><th>Спостережуваний факт (без вигаданих часток)</th><th>Значення для «Тестик»</th></tr>
      <tr><td>Конкурент №1: ціни −8% до наших, доставка безкоштовна від €30</td><td>наш поріг безкоштовної €50 — тест зниження до €40 на кошиках €35–50</td></tr>
      <tr><td>Конкуренти №2, №4 присутні в AI-відповідях (7/12 запитів)</td><td>GEO-програма W3 — інакше нова полиця пошуку буде зайнята</td></tr>
      <tr><td>Ніхто в ніші не веде контент про догляд за посудом системно</td><td>вільна позиція експерта — основа SEO/CRM-контенту</td></tr>
      <tr><td>Брендовий пошук «тестик» +9% р/р (GSC)</td><td>бренд живий; преміум-ціна поки не підтверджена (анкета: «іноді»)</td></tr>
    </table>
  `, 3, 4),
  page('', 'Зведений звіт · Business + Market + Product + Operations', `
    <h2 class="st">Зведення знахідок блоку — 11, з них 4 у хвилю 1</h2>
    <table class="t">
      <tr><th>#</th><th>Знахідка</th><th>Severity</th><th>Хвиля</th><th class="num">Ефект/рік</th></tr>
      <tr class="hl"><td class="num">08-01</td><td>OOS топ-20: 17% часу (Q4 — 26%)</td><td><span class="sev h">high</span></td><td>W2</td><td class="num"><b>€95k</b></td></tr>
      <tr class="hl"><td class="num">08-02</td><td>Allegro: contribution 3%</td><td><span class="sev h">high</span></td><td>W1–W2</td><td class="num"><b>€60k</b></td></tr>
      <tr><td class="num">08-03</td><td>Dead stock €70k кешу</td><td><span class="sev h">high</span></td><td>W1</td><td class="num">€70k one-off</td></tr>
      <tr><td class="num">08-04</td><td>Бій 2.1% відправлень</td><td><span class="sev h">high</span></td><td>W1</td><td class="num">€31k</td></tr>
      <tr><td class="num">08-05</td><td>Знижки без contribution-правила</td><td><span class="sev m">med</span></td><td>W1</td><td class="num">захист маржі</td></tr>
      <tr><td class="num">08-06</td><td>PL LTV:CAC 1.9 &lt; порога</td><td><span class="sev m">med</span></td><td>W3</td><td class="num">умова CZ/RO</td></tr>
      <tr><td class="num">08-07</td><td>Каса: розриви перед Q4-закупівлями</td><td><span class="sev m">med</span></td><td>W2</td><td class="num">план закупівель</td></tr>
      <tr><td class="num">08-08…11</td><td>поріг безкошт. доставки, VAT OSS-перевірка, GPSR-готовність, фінмодель 12–36 міс</td><td><span class="sev m">med</span></td><td>W2–W3</td><td class="num">ризики/готовність</td></tr>
    </table>
    <p class="marg" style="margin-top:5mm">Комплаєнс: продажі в PL йдуть через Allegro з PL VAT — ок; при запуску PL-версії сайту дистанційні продажі &gt;€10k/рік
    потребують OSS. GPSR: відповідальна особа в ЄС — перевірити договір з виробником (позначено «очікує погодження»).</p>
  `, 4, 4),
].join(''));

/* ════ a09 · Health Score і матриця зрілості ════ */
setDocNo('a09 · Health Score і матриця зрілості');
const DOMS = [
  ['Business', 2, 'Юніт-економіка на рівні замовлення є, фінмоделі немає; каса — розриви «іноді»', 'L3: фінмодель 12 міс, щомісячний P&L-ритм'],
  ['Market', 2, 'Конкурентів дивляться «по цінах»; позиціонування не відрізняється', 'L3: моніторинг + позиція експерта догляду'],
  ['Product', 2, 'ABC не проводився; 33% dead stock; hero-SKU відомі інтуїтивно', 'L3: ABC/XYZ-квартал, правила знижок'],
  ['Customer', 1, 'Персон немає, NPS не вимірюється, VoC — «читаємо вибірково»', 'L3: сегменти + NPS + теговані відгуки'],
  ['Website', 2, 'CR нижче бенчу, CWV червоні, але процес правок існує', 'L3: A/B-ритм, CWV зелені'],
  ['SEO', 2, 'Технічна база слабка (фасети), контент дубльований', 'L3: чистий індекс + контент-ядро'],
  ['Acquisition', 3, 'Кабінети керовані, ROAS видно; бренд-канібалізація й немає contribution-оптимізації', 'L4: біддинг по маржі'],
  ['CRM', 1, 'Один flow, немає сегментації, DMARC відсутній', 'L3: 4 flows + RFM + 15% виручки'],
  ['Analytics', 1, 'GA4 −22%, маржі немає, дашбордів немає', 'L3: звірка &lt;5%, щотижневий дашборд'],
  ['Operations', 2, 'Склад працює, але OOS 17%, бій 2.1%, OTIF не міряється', 'L3: правила закупівель + стандарт пакування'],
  ['Technology', 2, 'OpenCart кастом 8/10, 1 фрілансер, staging немає, бекапи не перевірені', 'L3: staging + перевірений бекап + SLA'],
  ['Organization', 2, 'Все через власника; PM зʼявляється з проектом', 'L3: власники каналів + щотижневий ритм'],
];
doc('09-matrytsia-zrilosti.html', 'a09 · Матриця зрілості — Тестик', [
  page('', 'Синтез · Матриця зрілості', `
    <span class="ebrow">Документ a09 · 12 доменів · шкала L1–L5 (за CMMI)</span>
    <h1 class="big">Health 52/100.<br>Стелю тримають <span class="mark">три L1</span>: Customer, CRM, Analytics.</h1>
    <div class="hero"><div class="n">52<span style="font-size:28pt;color:#94A0A8">/100</span></div>
      <div class="cap">Health Score — зважена сума 12 доменів з вагами важливості з анкети власника (матриця block_rate) · рівень домену = найнижчий ПОВНІСТЮ виконаний</div></div>
    <table class="t">
      <tr><th>Домен</th><th style="width:14mm">Рівень</th><th>Чому саме цей рівень (доказ)</th><th>Ціль 9 міс</th></tr>
      ${DOMS.slice(0, 6).map(([d, l, why, tgt]) => `
        <tr${l === 1 ? ' class="hl"' : ''}><td><b>${d}</b></td>
        <td><span class="mono" style="font-weight:700;font-size:11pt;${l === 1 ? 'color:var(--mark)' : ''}">L${l}</span></td>
        <td>${why}</td><td>${tgt}</td></tr>`).join('')}
    </table>
  `, 1, 2),
  page('', 'Синтез · Матриця зрілості', `
    <table class="t">
      <tr><th>Домен</th><th style="width:14mm">Рівень</th><th>Чому саме цей рівень (доказ)</th><th>Ціль 9 міс</th></tr>
      ${DOMS.slice(6).map(([d, l, why, tgt]) => `
        <tr${l === 1 ? ' class="hl"' : ''}><td><b>${d}</b></td>
        <td><span class="mono" style="font-weight:700;font-size:11pt;${l === 1 ? 'color:var(--mark)' : ''}">L${l}</span></td>
        <td>${why}</td><td>${tgt}</td></tr>`).join('')}
    </table>
    <h2 class="st" style="margin-top:6mm">Читання матриці: чому не можна «просто підняти рекламу»</h2>
    <p class="body">Acquisition — єдиний L3: реклама і так найзріліша частина системи. Масштабувати L3-канал поверх L1-аналітики
    та L1-CRM — значить купувати трафік, який не вимірюється і не утримується. Тому роадмапа (a15) спершу піднімає три L1 до L3,
    і лише потім розганяє придбання. Це і є відповідь на питання власника «чому не докинути бюджету в рекламу».</p>
    <div class="callout v"><b>Правило переоцінки:</b> матриця переміряється на 90-й день (контрольна точка a16) і наприкінці хвилі 3.
    Рівень вважається взятим лише при виконанні всіх критеріїв DoD відповідного домену (a17) — не «стало краще», а «пройдено поріг».</div>
    <p class="marg" style="margin-top:5mm">Ваги доменів — з анкети власника (block_rate, 1–10). Найвищі ваги: Економіка 10, CRM 9,
    Аналітика 9 — власник сам позначив зони найбільшої важливості; матриця показує, що саме там найнижча зрілість. Збіг ваги й розриву → пріоритет хвиль.</p>
  `, 2, 2),
].join(''));

/* ════ a10 · Розрив у грошах: 8 важелів + прогноз 12 міс ════ */
setDocNo('a10 · Розрив у грошах');
doc('10-rozryv-u-hroshakh.html', 'a10 · Розрив у грошах — Тестик', [
  page('', 'Синтез · Гроші', `
    <span class="ebrow">Документ a10 · 8 важелів · метод без подвійного рахунку</span>
    <h1 class="big">€433k на рік.<br>Порахован від замовлень, не від бажань.</h1>
    <div class="hero m"><div class="n">€433 000</div>
      <div class="cap">консервативна оцінка річного потенціалу виручки: найбільший важіль повністю + 45% суми решти (важелі перетинаються — чесніше зрізати, ніж скласти все)</div></div>
    <table class="t">
      <tr><th>#</th><th>Важіль</th><th>Від чого → до чого</th><th class="num">Виручка/рік</th><th>Впевненість</th></tr>
      <tr class="hl"><td class="num">1</td><td><b>Checkout completion</b></td><td>43.6% → 60% (бенч 65%+)</td><td class="num"><b>€190k</b></td><td><span class="sev ok">high</span></td></tr>
      <tr><td class="num">2</td><td>CRM / Retention</td><td>repeat 13% → 20% (бенч 25–30%)</td><td class="num">€150k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td class="num">3</td><td>Mobile-швидкість</td><td>LCP 4.6s → 2.5s · CR mobile 0.9 → 1.25%</td><td class="num">€120k</td><td><span class="sev m">med</span></td></tr>
      <tr><td class="num">4</td><td>OOS топ-20 SKU</td><td>17% часу → 7%</td><td class="num">€95k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td class="num">5</td><td>SEO: фасети, дублі, бренд-захист</td><td>чистий індекс + контент-ядро</td><td class="num">€85k</td><td><span class="sev m">med</span></td></tr>
      <tr><td class="num">6</td><td>Allegro: ціни й логістика</td><td>contribution 3% → 8%</td><td class="num">€60k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td class="num">7</td><td>Бій у доставці</td><td>2.1% → 0.7% відправлень</td><td class="num">€31k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td class="num">8</td><td>Dead stock → кеш</td><td>210 SKU → розпродаж</td><td class="num">€70k <span class="src">one-off</span></td><td><span class="sev ok">high</span></td></tr>
    </table>
    <p class="marg" style="margin-top:4mm">Розрахунок: €190k + 0.45 × (150+120+95+85+60+31) = €190k + €243k = €433k/рік виручки.
    Кеш із dead stock — одноразовий, у суму не входить. У contribution (36%): ≈ €156k/рік.</p>
  `, 1, 3),
  page('', 'Синтез · Гроші', `
    <h2 class="st">Як порахований кожен важіль — приклад на найбільшому</h2>
    <p class="body"><b>Важіль 1, checkout.</b> База: 5 180 входів у checkout/міс (GA4, звірено з бекендом через воронку).
    Сьогодні платить 43.6% → 2 260 замовлень. При 60% (консервативніше за бенч 65%) → 3 108 замовлень.
    Приріст 848 зам./міс × AOV €42 × 12 = €427k «сирої» виручки. Зрізаємо вдвічі на еластичність
    (частина «недоплативших» — нецільові) → <b>€190–210k, у розрахунок беремо €190k</b>. Ефект вимірюється по бекенду, не по GA4.</p>
    <p class="body"><b>Чутливість (що якщо ми помиляємось):</b></p>
    <table class="t">
      <tr><th>Сценарій</th><th class="num">Checkout →</th><th class="num">Важіль 1</th><th class="num">Разом 8 важелів</th></tr>
      <tr><td>Песимістичний (половина ефекту)</td><td class="num">52%</td><td class="num">€95k</td><td class="num">€290k</td></tr>
      <tr class="hl"><td><b>Базовий (у документі)</b></td><td class="num"><b>60%</b></td><td class="num"><b>€190k</b></td><td class="num"><b>€433k</b></td></tr>
      <tr><td>Оптимістичний (бенч узято)</td><td class="num">65%</td><td class="num">€245k</td><td class="num">€520k</td></tr>
    </table>
    <h2 class="st" style="margin-top:5mm">Прогноз реалізації на 12 місяців</h2>
    <table class="t">
      <tr><th>Квартал</th><th>Що спрацьовує</th><th class="num">Наростаюче, виручка</th></tr>
      <tr><td>міс 1–3</td><td>checkout-правки, GA4, пакування, Allegro-ціни, dead stock кеш</td><td class="num">€45–60k (+€70k кешу)</td></tr>
      <tr><td>міс 4–6</td><td>+ CRM-flows, mobile-швидкість, OOS-правила</td><td class="num">€120–160k</td></tr>
      <tr><td>міс 7–9</td><td>+ SEO-ефекти починають накопичуватись</td><td class="num">€200–260k</td></tr>
      <tr><td>міс 10–12</td><td>повний контур + сезон Q4 на здоровій системі</td><td class="num"><b>€240–300k (55–70%)</b></td></tr>
    </table>
  `, 2, 3),
  page('', 'Синтез · Гроші', `
    <h2 class="st">Чого в цій оцінці НЕМАЄ — свідомо</h2>
    <table class="t">
      <tr><th>Не включено</th><th>Чому</th></tr>
      <tr><td>Зростання рекламного бюджету</td><td>€433k — потенціал на ПОТОЧНОМУ трафіку. Масштабування — після хвилі 2, окремим рішенням</td></tr>
      <tr><td>Вихід на CZ/RO</td><td>умова не виконана: PL LTV:CAC 1.9 &lt; 2.5. Спершу модель, потім географія</td></tr>
      <tr><td>Ефект бренду/GEO</td><td>накопичувальний, погано прогнозується на 12 міс — буде виміряний, не обіцяний</td></tr>
      <tr><td>Підняття цін</td><td>потребує собівартості по SKU (не надана, a02) — «очікує погодження»</td></tr>
    </table>
    <div class="hero v" style="margin-top:6mm"><div class="n">€156k</div>
      <div class="cap">річний потенціал у contribution (36% від виручки) — саме цю цифру порівнюйте з бюджетом проекту €54k/9 міс (a18). Консервативне співвідношення 2.9× при 100% реалізації; 1.6–2.0× при реалістичних 55–70%</div></div>
    <p class="marg">Кожен важіль після старту отримує власну метрику в щотижневому дашборді (a17) — прогрес видно, не «на віру».
    Перерахунок оцінки: на 90-й день і наприкінці кожної хвилі.</p>
  `, 3, 3),
].join(''));

console.log('docs2 done');
