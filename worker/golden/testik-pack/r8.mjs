// Робочий том C · SEO-аудит + дерево сайта: карта індексації, семантика, on-page посторінково, техніка, GEO.
import { doc, page, cover, toc, kpi } from './gen.mjs';
const sc = (v) => `<td class="score sc${v}">${v}</td>`;

const PAGES = [
  // C.1 Дерево + індексація
  (p, n) => page('', 'C.1 · Дерево та індекс', `
    <span class="ebrow">Глава C.1 · Дерево сайта і карта індексації</span>
    <h1 class="big" style="font-size:23pt">1 097 сторінок будують бізнес.<br>8 315 URL сміття їх ховають.</h1>
    <div class="cols2" style="margin-top:3mm">
      <div class="tree">
        <b>Індекс Google: 9 412 URL</b><br>
        <div class="lvl1">├ <span class="good">Реальні сторінки: 1 097 (11.7%)</span></div>
        <div class="lvl2">│ ├ Головна 1 · Категорії 8 · Підкатегорії 24</div>
        <div class="lvl2">│ ├ PDP 640 <span class="warn">(з них 210 OOS віддають 200!)</span></div>
        <div class="lvl2">│ ├ Службові 11 · Блог 12 · Кабінет/системні ~400</div>
        <div class="lvl1">└ <span class="warn">Сміття: 8 315 (88.3%)</span></div>
        <div class="lvl2">&nbsp;&nbsp;├ Фасетні дублі ?color=&sort=&filter= <span class="cnt">≈6 900</span></div>
        <div class="lvl2">&nbsp;&nbsp;├ Пагінація ?page=N без правил <span class="cnt">≈900</span></div>
        <div class="lvl2">&nbsp;&nbsp;├ Дублі варіантів PDP (діаметри) <span class="cnt">≈380</span></div>
        <div class="lvl2">&nbsp;&nbsp;└ UTM/сесійні параметри в індексі <span class="cnt">≈135</span></div>
        <br><b>Розподіл органічної виручки по дереву</b> <span class="cnt">(GSC × бекенд)</span><br>
        <div class="lvl1">├ 340 сторінок → <span class="good">85% орг. виручки</span></div>
        <div class="lvl2">│ └ 8 категорій (41%) · 24 підкат. (17%) · топ-180 PDP (24%) · головна (3%)</div>
        <div class="lvl1">└ решта 757 → 15% <span class="cnt">(хвіст PDP + блог 0.4%)</span></div>
      </div>
      <div>
        <div class="kpis c3" style="margin-top:0">
          ${kpi('×8.6', 'сміття до реальних URL', 'bad')}
          ${kpi('41%', 'орг. кліків — бренд', 'bad')}
          ${kpi('3/6', 'кластерів попиту покрито', 'bad')}
        </div>
        <p class="body" style="font-size:8.4pt"><b>Що це коштує:</b> краулінговий бюджет розмазаний по сміттю (свіжі PDP індексуються 2–3 тижні),
        сигнали розпорошені між дублями варіантів, а фасетні URL конкурують із категоріями за ті самі запити.
        Небрендова органіка росте повільніше ринку — при тому що 3 кластери попиту (≈50k запитів/міс) взагалі без наших сторінок.</p>
        <p class="body" style="font-size:8.4pt"><b>Цільове дерево</b> (після фасет-правил + хабів W3): ≤1.3k керованих URL =
        1 097 реальних + ~60 контент-ядро + ~80 фільтруючих SEO-хабів (індексовані комбінації «категорія × ключовий атрибут»
        замість дикої фасетки: /skovorody/grylʼni/, /skovorody/24-sm/ — кожен хаб має попит у семантиці, унікальний текст і H1).</p>
        <p class="marg">Джерела: GSC 16 міс + повний кроул 20.08 + вивантаження замовлень (виручкова атрибуція). Скоуп чесно: без Ahrefs
        (доступ не надано) — посилальний профіль оцінено відкритими джерелами, позначено рівнем доказовості 4.</p>
      </div>
    </div>
  `, p, n),
  // C.2 Семантика
  (p, n) => page('', 'C.2 · Семантика', `
    <span class="ebrow">Глава C.2 · Семантичне покриття: 6 кластерів попиту</span>
    <h1 class="big" style="font-size:23pt">Половина попиту ніші — повз сайт.</h1>
    <table class="t" style="margin-top:3mm;font-size:8pt">
      <tr><th>Кластер</th><th class="num">Запитів/міс</th><th>Покриття зараз</th><th>Хто забирає</th><th>План</th></tr>
      <tr><td><b>Сковороди</b> <span class="src">«сковорода гриль», «для індукції»…</span></td><td class="num">74 000</td><td><span class="okm">є</span>: категорія + 4 підкат.</td><td>ми топ-5–12 небренд</td><td>хаби атрибутів + гайд вибору → топ-3</td></tr>
      <tr><td><b>Каструлі</b></td><td class="num">61 000</td><td><span class="okm">є</span>: категорія + 3 підкат.</td><td>конкурент №1 + Rozetka</td><td>те саме + чавун-хаб</td></tr>
      <tr><td><b>Ножі</b></td><td class="num">48 000</td><td><span class="okm">є</span>, слабке: без сталей/типів</td><td>спеціалізовані магазини</td><td>підкат. за типом + гайд сталей</td></tr>
      <tr class="hl"><td><b>Форми для випікання</b></td><td class="num">22 000</td><td><span class="badm">немає хаба</span>: категорія-заглушка без підкат.</td><td>маркетплейси повністю</td><td>W3: підкатегорії + гайд + добірки</td></tr>
      <tr class="hl"><td><b>Подарункові набори</b></td><td class="num">18 000</td><td><span class="badm">немає</span>: 26 SKU без посадкових</td><td>Rozetka + подарункові сайти</td><td>W3: добірки за бюджетом/приводом (+Q4!)</td></tr>
      <tr class="hl"><td><b>Догляд за посудом</b></td><td class="num">9 900</td><td><span class="badm">немає</span>: 1 стаття 480 слів</td><td><b>ніхто системно</b> — вільна позиція</td><td>W3: 24 гайди — позиція «експерт догляду» (d02)</td></tr>
    </table>
    <p class="body" style="font-size:8.5pt;margin-top:2mm"><b>Розподіл зусиль W3 (контент-ядро 60 сторінок):</b> догляд 24 (вільна позиція + живить CRM-цикл) ·
    вибір 20 (гайди категорій — конверсія + AEO) · подарунки 16 (сезонний пік Q4 наступного року — готуємо заздалегідь).
    Кожна сторінка ядра: цільовий запит кластера + структура «відповідь у першому абзаці» + перелінковка на категорію і топ-SKU.</p>
    <p class="marg">Обсяги — Keyword Planner (діапазони усереднені) + власна оцінка розподілу; позначено рівнем 2/4. Повна семантика
    (2 400 запитів по кластерах, ~140 сторінок-цілей) — Excel у робочих матеріалах, передається студії з редполітикою.</p>
    <h2 class="st" style="font-size:11.5pt;margin-top:3mm">Бренд vs небренд — чесний розріз органіки</h2>
    <table class="t" style="font-size:8pt">
      <tr><th></th><th class="num">Кліки/міс</th><th class="num">Частка</th><th>Тренд р/р</th></tr>
      <tr><td>Брендові запити («тестик» ± варіації)</td><td class="num">≈9 400</td><td class="num">41%</td><td class="mono">+9% (бренд живий)</td></tr>
      <tr class="hl"><td><b>Небрендові (справжнє SEO)</b></td><td class="num">≈13 500</td><td class="num">59%</td><td class="mono" style="color:var(--mark)">+2% — повільніше ринку</td></tr>
    </table>
  `, p, n),
  // C.3 On-page посторінково
  (p, n) => page('', 'C.3 · On-page', `
    <span class="ebrow">Глава C.3 · On-page посторінково: title / H1 / meta / schema / перелінковка</span>
    <h1 class="big" style="font-size:23pt">On-page: шаблони писали один раз —<br>і жодного разу не перечитували.</h1>
    <table class="bt" style="margin-top:2mm">
      <tr><th style="width:20mm">Сторінка/шаблон</th><th>Зараз (факт)</th><th style="width:46mm">Еталон</th><th style="width:8mm">0–5</th></tr>
      <tr><td class="bnum">Головна</td><td>title «Тестик — інтернет-магазин посуду» · description загальна · Organization-schema є, sameAs порожній</td><td>title з УТП і кластером-героєм; description з цифрами-доказами; sameAs на соцмережі/каталоги</td>${sc(3)}</tr>
      <tr class="hl"><td class="bnum">Категорії</td><td>title-шаблон «{Категорія} — купити в Тестик» БЕЗ ціни/кількості; description дубль title; H1 = назва без розширення; CollectionPage-schema немає</td><td>«{Категорія} — N моделей від €X · доставка 1–3 дні»; унікальні description; ItemList-розмітка</td>${sc(2)}</tr>
      <tr class="hl"><td class="bnum">PDP</td><td>title = назва товару (без покриття/діаметра для варіантних запитів); Product+Offer є, AggregateRating немає (зірок у SERP нуль — W2 задача 50); canonical на варіантах відсутній</td><td>title = назва + ключовий атрибут + ціна; повна schema; canonical моделі (з томом A, блок 04)</td>${sc(2)}</tr>
      <tr><td class="bnum">Підкатегорії</td><td>H1 і title успадковані від категорії з дописаним словом; описів немає взагалі</td><td>власний title/H1/опис під запит підкатегорії — це і є майбутні хаби</td>${sc(1)}</tr>
      <tr><td class="bnum">Блог</td><td>title = заголовок статті; Article-schema немає; автор/дата не розмічені (E-E-A-T нуль)</td><td>Article + author + dateModified; автор зі сторінкою</td>${sc(1)}</tr>
      <tr><td class="bnum">Службові</td><td>Доставка/Повернення без FAQPage; «Про нас» без Organization-деталей</td><td>FAQPage на доставці/поверненні/FAQ-хабі; повна Organization</td>${sc(2)}</tr>
    </table>
    <h2 class="st" style="font-size:11.5pt;margin-top:3mm">Внутрішня перелінковка — виміряно кроулом</h2>
    <table class="t" style="font-size:8pt">
      <tr><th>Метрика</th><th class="num">Факт</th><th class="num">Еталон</th><th>Дія</th></tr>
      <tr><td>Сторінки-сироти (0 внутрішніх посилань)</td><td class="num" style="color:var(--mark)">118 PDP</td><td class="num">0</td><td>блоки «схожі/пари» + теги (том A)</td></tr>
      <tr><td>Глибина до хвостових PDP</td><td class="num" style="color:var(--mark)">5–6 кліків</td><td class="num">≤3</td><td>хаби + пагінаційні правила</td></tr>
      <tr><td>Вихідні посилання з PDP вниз</td><td class="num" style="color:var(--mark)">0</td><td class="num">4–8</td><td>теги добірок (том A, блок 12)</td></tr>
      <tr><td>Блог → категорії</td><td class="num" style="color:var(--mark)">2 посилання на 12 статей</td><td class="num">3–5/стаття</td><td>редполітика перелінковки</td></tr>
    </table>
  `, p, n),
  // C.4 Техніка + GEO + пріоритети
  (p, n) => page('', 'C.4 · Техніка і GEO', `
    <span class="ebrow">Глава C.4 · Технічне SEO, GEO/AEO і пріоритети тома</span>
    <h1 class="big" style="font-size:23pt">Техніка: три системні дірки.<br>GEO: полиця, яку ще можна зайняти.</h1>
    <table class="t" style="margin-top:3mm;font-size:8pt">
      <tr><th>Технічна зона</th><th>Факт</th><th>Дія (Гант)</th></tr>
      <tr class="hl"><td><b>Фасети/параметри</b></td><td>≈6 900 URL без canonical/robots-правил — 73% сміття індексу</td><td>задачі 60–61: правила на staging (грудень) → розкат січень → індекс ≤1.3k за 8 тижнів</td></tr>
      <tr class="hl"><td><b>OOS-сторінки</b></td><td>210 знятих/відсутніх SKU віддають 200 як живі</td><td>задача 49: тимчасовий OOS = сторінка з датою + підписка; знятий = 410/редірект</td></tr>
      <tr class="hl"><td><b>Дублі варіантів PDP</b></td><td>≈380 URL діаметрів/кольорів без canonical</td><td>canonical моделі (W2-тимчасово) → обʼєднання карток (W3, з томом A)</td></tr>
      <tr><td>CWV</td><td>LCP 4.6s / INP 310ms / CLS 0.18 — ранж-фактор проти нас</td><td>задачі 40–41 (LCP-пакет) + 34 (кеш/TTFB)</td></tr>
      <tr><td>Sitemap</td><td>один файл із усім (включно зі сміттям), lastmod статичний</td><td>сегментовані sitemap за типами + чесний lastmod</td></tr>
      <tr><td>hreflang</td><td>відсутній (актуально при PL-версії сайту — після КТ-4)</td><td>у пакеті підготовки експансії (задача 74)</td></tr>
    </table>
    <h2 class="st" style="font-size:11.5pt;margin-top:3mm">GEO/AEO — протокол панелі (виправлено за критикою)</h2>
    <p class="body" style="font-size:8.5pt">Панель: 48 запитів (12 категорійних × 4 інтенти) × 4 системи (ChatGPT, Perplexity, Gemini, AI Overviews) ×
    <b>3 прогони з усередненням</b> (LLM-відповіді стохастичні — одиничний прогін не є заміром). Серпень: «Тестик» ≈0–1/48 (медіана 0),
    конкурент №2 — 9–12/48. Фіксована методика (формулювання, критерій «присутності», медіана прогонів) — у робочих матеріалах;
    щомісячний замір тим самим протоколом → DoD-метрика «тренд ↑ 3 заміри поспіль». Дії: llms.txt + FAQ/QAPage-розмітка + фактні блоки
    в гайдах (задача 63) — GEO тут виграється контентом ядра, не трюками.</p>
    <h2 class="st" style="font-size:11.5pt">Пріоритети тома C</h2>
    <table class="t" style="font-size:8pt">
      <tr><th>#</th><th>Що</th><th>Критичність</th><th>Вікно</th></tr>
      <tr class="hl"><td class="num">1</td><td>Фасет-правила + сегментовані sitemap</td><td><span class="sev h">Блокуюча</span></td><td>staging грудень → розкат січень (НЕ в сезон)</td></tr>
      <tr class="hl"><td class="num">2</td><td>OOS-політика 410/редіректів + сторінки очікування</td><td><span class="sev h">Висока</span></td><td>W2</td></tr>
      <tr><td class="num">3</td><td>Canonical варіантів PDP → обʼєднання моделей</td><td><span class="sev h">Висока</span></td><td>W2 тимчасово → W3 повністю</td></tr>
      <tr><td class="num">4</td><td>Title/description-шаблони категорій і PDP + ItemList/AggregateRating</td><td><span class="sev m">Середня</span></td><td>W2</td></tr>
      <tr><td class="num">5</td><td>Контент-ядро 60 стор. + 80 SEO-хабів атрибутів</td><td><span class="sev m">Середня</span></td><td>W3 за календарем</td></tr>
      <tr><td class="num">6</td><td>Сироти й глибина: перелінковка з тома A</td><td><span class="sev m">Середня</span></td><td>W2–W3</td></tr>
    </table>
    <p class="marg" style="margin-top:2mm">Ефект тома C зашитий у воронкову модель (вузол «органічний трафік ×1.018 програма / ×1.12 стеля») — консервативно, бо SEO-ефекти повільні; стеля розкривається у 2027.</p>
  `, p, n),
];
const chapters = [
  ['C.1', 'Дерево сайта і карта індексації: 1 097 реальних проти 8 315 сміття · цільове дерево', 3],
  ['C.2', 'Семантика: 6 кластерів × покриття · бренд/небренд · план контент-ядра', 4],
  ['C.3', 'On-page посторінково: title/H1/meta/schema по всіх шаблонах + перелінковка кроулом', 5],
  ['C.4', 'Техніка (фасети, OOS, canonical, CWV, sitemap) · GEO-панель з протоколом · пріоритети', 6],
];
const total = PAGES.length + 2;
doc('tom-C-seo-derevo.html', 'Том C · SEO-аудит і дерево сайта — Тестик', [
  cover('2·C', 'Робочий том C:<br>SEO і дерево сайта', 'Самостійний SEO-аудит: повне дерево сайта з картою індексації (реальні сторінки проти сміття ×8.6), семантичне покриття 6 кластерів, on-page посторінково по всіх шаблонах, технічні дірки і GEO-панель із чесним протоколом вимірювання.', '6 сторінок · дерево + семантика + on-page + техніка + GEO'),
  toc(chapters, 2, total),
  ...PAGES.map((f, i) => f(i + 3, total)),
].join(''));
console.log('tom C done:', total);
